import { prisma } from './prisma'
import { cookies } from 'next/headers'
import { nanoid } from 'nanoid'
import { randomBytes } from 'crypto'

// Session expiration (30 days)
const SESSION_EXPIRES_DAYS = 30

export interface SessionUser {
  id: string
  username: string
  name: string | null
}

/**
 * Get session
 */
export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session_token')?.value

    if (!sessionToken) {
      return null
    }

    // Use raw SQL to get session and user data
    const sessions: any[] = await prisma.$queryRaw`
      SELECT s.id, s."sessionToken", s."userId", s.expires,
             u.id as "userId", u.username, u.name
      FROM sessions s
      INNER JOIN users u ON s."userId" = u.id
      WHERE s."sessionToken" = ${sessionToken}
      LIMIT 1
    `

    if (sessions.length === 0) {
      return null
    }

    const sessionData = sessions[0]

    if (!sessionData || new Date(sessionData.expires) < new Date()) {
      // Session expired, delete it
      if (sessionData) {
        await prisma.$executeRaw`
          DELETE FROM sessions WHERE id = ${sessionData.id}
        `
      }
      return null
    }

    const user = {
      id: sessionData.userId,
      username: sessionData.username,
      name: sessionData.name,
    }
    const username = user.username || user.id

    return {
      id: user.id,
      username,
      name: user.name,
    }
  } catch (error) {
    console.error('[AUTH] Error getting session:', error)
    return null
  }
}

/**
 * Sign in with username
 */
export async function signIn(username: string): Promise<{ user: SessionUser; sessionToken: string } | null> {
  try {
    console.log('[AUTH] Starting sign in for username:', username)
    
    // Check database connection
    try {
      await prisma.$connect()
      console.log('[AUTH] Database connected')
    } catch (dbError) {
      console.error('[AUTH] Database connection error:', dbError)
      throw new Error('データベースに接続できませんでした')
    }

    // Use raw SQL query as workaround until Prisma Client is regenerated
    console.log('[AUTH] Looking up user by username using raw SQL')
    const existingUsers: any[] = await prisma.$queryRaw`
      SELECT id, username, name
      FROM users
      WHERE username = ${username}
      LIMIT 1
    `

    let user: any = existingUsers[0]
    console.log('[AUTH] User lookup result:', user ? 'found' : 'not found')

    if (!user) {
      console.log('[AUTH] User not found, creating new user')
      try {
        // Generate a new ID using cuid format (similar to Prisma's default)
        const idBytes = randomBytes(16)
        const newId = 'c' + idBytes.toString('base64url').substring(0, 24).replace(/[+\/=]/g, '')
        console.log('[AUTH] Generated user ID:', newId)
        
        // Check if username column exists before inserting
        console.log('[AUTH] Checking if username column exists...')
        const columnCheck: any[] = await prisma.$queryRaw`
          SELECT column_name
          FROM information_schema.columns
          WHERE table_name = 'users'
          AND column_name = 'username'
          LIMIT 1
        `
        console.log('[AUTH] Username column check result:', columnCheck.length > 0 ? 'exists' : 'not found')
        
        if (columnCheck.length === 0) {
          console.error('[AUTH] username column does not exist in database. Please run migration first.')
          throw new Error('データベーススキーマが更新されていません。マイグレーションを実行してください。')
        }
        
        // Create new user using raw SQL
        // First, check actual table structure to determine which columns exist
        console.log('[AUTH] Fetching users table structure...')
        const tableColumns: any[] = await prisma.$queryRaw`
          SELECT column_name, is_nullable, column_default, data_type
          FROM information_schema.columns
          WHERE table_name = 'users'
          ORDER BY ordinal_position
        `
        
        console.log('[AUTH] Users table columns count:', tableColumns.length)
        console.log('[AUTH] Users table columns:', JSON.stringify(tableColumns.map((col: any) => ({
          name: col.column_name,
          nullable: col.is_nullable,
          default: col.column_default
        })), null, 2))
      
      // Build column list dynamically based on what exists
      const columnNames = tableColumns.map((col: any) => col.column_name)
      
      const insertColumns: string[] = []
      const insertValues: any[] = []

      const addColumn = (name: string, value: any) => {
        insertColumns.push(`"${name}"`)
        insertValues.push(value)
      }

      // Always set core columns
      addColumn('id', newId)
      addColumn('username', username)
      if (columnNames.includes('name')) {
        addColumn('name', username)
      }
      if (columnNames.includes('tz')) {
        addColumn('tz', 'Asia/Tokyo')
      }

      // Legacy NextAuth columns - only add if they exist AND are nullable
      // Required (NOT NULL) columns will be handled by the missingRequiredColumns check below
      if (columnNames.includes('email')) {
        const emailColumn = tableColumns.find((col: any) => col.column_name === 'email')
        // Only add email if it's nullable (NOT NULL emails will be handled later)
        if (emailColumn && emailColumn.is_nullable === 'YES') {
          addColumn('email', `${username}@placeholder.local`)
        }
      }
      if (columnNames.includes('emailVerified')) {
        const emailVerifiedColumn = tableColumns.find((col: any) => col.column_name === 'emailVerified')
        // Only add emailVerified if it's nullable
        if (emailVerifiedColumn && emailVerifiedColumn.is_nullable === 'YES') {
          addColumn('emailVerified', null)
        }
      }
      if (columnNames.includes('image')) {
        addColumn('image', null)
      }
      if (columnNames.includes('gcalId')) {
        addColumn('gcalId', null)
      }

      // Timestamp columns
      if (columnNames.includes('createdAt')) {
        addColumn('createdAt', new Date())
      }
      if (columnNames.includes('updatedAt')) {
        addColumn('updatedAt', new Date())
      }
      if (columnNames.includes('lastLoginAt')) {
        addColumn('lastLoginAt', new Date())
      }

      // Ensure we handle all required columns (non-null without default)
      const handledColumns = new Set(insertColumns.map((col) => col.replace(/"/g, '')))
      const missingRequiredColumns = tableColumns.filter((col: any) => {
        const columnName = col.column_name
        if (handledColumns.has(columnName)) {
          return false
        }
        // Check if column is NOT NULL and has no default
        const isRequired = col.is_nullable === 'NO' && !col.column_default
        return isRequired
      })

      console.log('[AUTH] Handled columns:', Array.from(handledColumns))
      console.log('[AUTH] Missing required columns:', missingRequiredColumns.map((col: any) => col.column_name))

      // For each missing required column, provide a default value based on column type
      for (const col of missingRequiredColumns) {
        const columnName = col.column_name
        console.log('[AUTH] Adding missing required column:', columnName, 'type:', col.data_type)
        
        // Provide appropriate default values based on column name and type
        if (columnName === 'email') {
          addColumn(columnName, `${username}@placeholder.local`)
        } else if (columnName === 'emailVerified') {
          // emailVerified is usually nullable, but if NOT NULL, use current timestamp
          addColumn(columnName, new Date())
        } else if (columnName.includes('Id') || columnName.includes('id')) {
          // ID columns - use null if allowed, or generate a placeholder
          addColumn(columnName, null)
        } else if (col.data_type === 'timestamp without time zone' || col.data_type === 'timestamp with time zone') {
          addColumn(columnName, new Date())
        } else if (col.data_type === 'text' || col.data_type === 'character varying') {
          addColumn(columnName, '')
        } else if (col.data_type === 'integer' || col.data_type === 'bigint') {
          addColumn(columnName, 0)
        } else if (col.data_type === 'boolean') {
          addColumn(columnName, false)
        } else {
          // Default to empty string for text-like columns, null for others
          console.warn('[AUTH] Unknown column type for required column:', columnName, 'type:', col.data_type, '- using empty string')
          addColumn(columnName, '')
        }
      }

      // Double-check: ensure all NOT NULL columns without defaults are handled
      const finalHandledColumns = new Set(insertColumns.map((col) => col.replace(/"/g, '')))
      const stillMissing = tableColumns.filter((col: any) => {
        const columnName = col.column_name
        return !finalHandledColumns.has(columnName) && col.is_nullable === 'NO' && !col.column_default
      })

      if (stillMissing.length > 0) {
        console.error('[AUTH] Still missing required columns after auto-fill:', stillMissing.map((col: any) => col.column_name))
        throw new Error(`ユーザーテーブルに必須カラムがありますが値の設定に失敗しました: ${stillMissing.map((col: any) => col.column_name).join(', ')}`)
      }

      const columnsStr = insertColumns.join(', ')
      const placeholders = insertValues.map((_, i) => `$${i + 1}`).join(', ')

        console.log('[AUTH] INSERT columns:', columnsStr)
        console.log('[AUTH] INSERT values count:', insertValues.length)
        console.log('[AUTH] INSERT SQL:', `INSERT INTO users (${columnsStr}) VALUES (${placeholders})`)

        console.log('[AUTH] Executing INSERT statement...')
        await prisma.$executeRawUnsafe(
          `INSERT INTO users (${columnsStr}) VALUES (${placeholders})`,
          ...insertValues
        )
        console.log('[AUTH] INSERT statement executed successfully')
        
        // Fetch the created user
        console.log('[AUTH] Fetching created user from database...')
        const newUsers: any[] = await prisma.$queryRaw`
          SELECT id, username, name
          FROM users
          WHERE username = ${username}
          LIMIT 1
        `
        console.log('[AUTH] Created user query result count:', newUsers.length)
        if (newUsers.length === 0) {
          throw new Error('ユーザー作成後、データベースから取得できませんでした')
        }
        user = newUsers[0]
        console.log('[AUTH] New user created successfully:', user.id)
      } catch (createError) {
        console.error('[AUTH] Error creating new user:', createError)
        if (createError instanceof Error) {
          console.error('[AUTH] Create user error message:', createError.message)
          console.error('[AUTH] Create user error stack:', createError.stack)
        }
        throw createError
      }
    } else {
      console.log('[AUTH] Updating last login time for existing user')
      // Update last login time using raw SQL
      await prisma.$executeRaw`
        UPDATE users
        SET "lastLoginAt" = NOW()
        WHERE id = ${user.id}
      `
      console.log('[AUTH] Last login time updated')
    }

    // Generate session token
    const sessionToken = nanoid(32)
    console.log('[AUTH] Generated session token')

    // Create session using raw SQL
    const expires = new Date()
    expires.setDate(expires.getDate() + SESSION_EXPIRES_DAYS)
    console.log('[AUTH] Session expires at:', expires)

    // Check actual sessions table structure to determine which columns exist
    console.log('[AUTH] Fetching sessions table structure...')
    const sessionColumns: any[] = await prisma.$queryRaw`
      SELECT column_name, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'sessions'
      ORDER BY ordinal_position
    `
    console.log('[AUTH] Sessions table columns:', JSON.stringify(sessionColumns.map((col: any) => ({
      name: col.column_name,
      nullable: col.is_nullable,
      default: col.column_default
    })), null, 2))

    const sessionColumnNames = sessionColumns.map((col: any) => col.column_name)
    
    // Build INSERT statement dynamically based on actual table structure
    const sessionInsertColumns: string[] = []
    const sessionInsertValues: any[] = []
    
    // Always include required columns
    if (sessionColumnNames.includes('id')) {
      sessionInsertColumns.push('id')
      sessionInsertValues.push('c' + randomBytes(16).toString('base64url').substring(0, 24).replace(/[+\/=]/g, ''))
    }
    sessionInsertColumns.push('"sessionToken"')
    sessionInsertValues.push(sessionToken)
    sessionInsertColumns.push('"userId"')
    sessionInsertValues.push(user.id)
    if (sessionColumnNames.includes('expires')) {
      sessionInsertColumns.push('expires')
      sessionInsertValues.push(expires)
    }
    
    // Optional timestamp columns
    if (sessionColumnNames.includes('createdAt')) {
      sessionInsertColumns.push('"createdAt"')
      sessionInsertValues.push(new Date())
    }
    if (sessionColumnNames.includes('updatedAt')) {
      sessionInsertColumns.push('"updatedAt"')
      sessionInsertValues.push(new Date())
    }

    const sessionColumnsStr = sessionInsertColumns.join(', ')
    const sessionPlaceholders = sessionInsertValues.map((_, i) => `$${i + 1}`).join(', ')

    console.log('[AUTH] INSERT sessions columns:', sessionColumnsStr)
    console.log('[AUTH] INSERT sessions SQL:', `INSERT INTO sessions (${sessionColumnsStr}) VALUES (${sessionPlaceholders})`)

    await prisma.$executeRawUnsafe(
      `INSERT INTO sessions (${sessionColumnsStr}) VALUES (${sessionPlaceholders})`,
      ...sessionInsertValues
    )
    console.log('[AUTH] Session created successfully')

    const userUsername = user.username || user.id

    const result = {
      user: {
        id: user.id,
        username: userUsername,
        name: user.name,
      },
      sessionToken,
    }
    
    console.log('[AUTH] Sign in successful, returning result')
    return result
  } catch (error) {
    console.error('[AUTH] Error signing in:', error)
    if (error instanceof Error) {
      console.error('[AUTH] Error name:', error.name)
      console.error('[AUTH] Error message:', error.message)
      console.error('[AUTH] Error stack:', error.stack)
      
      // Check if it's a Prisma error
      if (error.message.includes('Unique constraint') || error.message.includes('P2002')) {
        console.error('[AUTH] Unique constraint violation - username may already exist')
      }
      if (error.message.includes('Unknown argument') || error.message.includes('P2012')) {
        console.error('[AUTH] Prisma schema mismatch - username field may not exist in database')
      }
      if (error.message.includes('connection') || error.message.includes('timeout')) {
        console.error('[AUTH] Database connection issue')
      }
    }
    return null
  }
}

/**
 * Sign in with session token (for recent login button)
 */
export async function signInWithToken(sessionToken: string): Promise<SessionUser | null> {
  try {
    // Use raw SQL to get session and user data
    const sessions: any[] = await prisma.$queryRaw`
      SELECT s.id, s."sessionToken", s."userId", s.expires,
             u.id as "userId", u.username, u.name
      FROM sessions s
      INNER JOIN users u ON s."userId" = u.id
      WHERE s."sessionToken" = ${sessionToken}
      LIMIT 1
    `

    if (sessions.length === 0) {
      return null
    }

    const sessionData = sessions[0]

    if (!sessionData || new Date(sessionData.expires) < new Date()) {
      return null
    }

    const user = {
      id: sessionData.userId,
      username: sessionData.username,
      name: sessionData.name,
    }

    // Update last login time using raw SQL
    await prisma.$executeRaw`
      UPDATE users
      SET "lastLoginAt" = NOW()
      WHERE id = ${user.id}
    `

    const username = user.username || user.id

    return {
      id: user.id,
      username,
      name: user.name,
    }
  } catch (error) {
    console.error('[AUTH] Error signing in with token:', error)
    return null
  }
}

/**
 * Sign out
 */
export async function signOut(sessionToken?: string): Promise<void> {
  try {
    if (sessionToken) {
      await prisma.$executeRaw`
        DELETE FROM sessions WHERE "sessionToken" = ${sessionToken}
      `
    }
  } catch (error) {
    console.error('[AUTH] Error signing out:', error)
  }
}

/**
 * Get recently logged in users (max 3)
 */
export async function getRecentUsers(limit: number = 3): Promise<{ username: string; name: string | null; lastLoginAt: Date | null }[]> {
  try {
    // Temporarily return empty array until Prisma Client is regenerated
    // @ts-ignore - Prisma Client may have old type definitions during migration
    try {
      const users: any[] = await prisma.$queryRaw`
        SELECT id, username, name, "lastLoginAt"
        FROM users
        WHERE "lastLoginAt" IS NOT NULL
        ORDER BY "lastLoginAt" DESC
        LIMIT ${limit}
      `
      
      return users.map((u: any) => ({
        username: u.username || u.id,
        name: u.name,
        lastLoginAt: u.lastLoginAt,
      }))
    } catch (rawError) {
      console.error('[AUTH] Raw query error, returning empty array:', rawError)
      return []
    }
  } catch (error) {
    console.error('[AUTH] Error getting recent users:', error)
    if (error instanceof Error) {
      console.error('[AUTH] Error details:', error.message)
    }
    return []
  }
}

/**
 * Validate username
 */
export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (!username || username.trim().length === 0) {
    return { valid: false, error: '\u30e6\u30fc\u30b6\u30fc\u540d\u3092\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044' }
  }

  const trimmed = username.trim()

  if (trimmed.length < 2) {
    return { valid: false, error: '\u30e6\u30fc\u30b6\u30fc\u540d\u306f2\u6587\u5b57\u4ee5\u4e0a\u3067\u3042\u308b\u5fc5\u8981\u304c\u3042\u308a\u307e\u3059' }
  }

  if (trimmed.length > 20) {
    return { valid: false, error: '\u30e6\u30fc\u30b6\u30fc\u540d\u306f20\u6587\u5b57\u4ee5\u4e0a\u3067\u3042\u308b\u5fc5\u8981\u304c\u3042\u308a\u307e\u3059' }
  }

  // Only allow alphanumeric characters, underscore, and hyphen
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return { valid: false, error: '\u30e6\u30fc\u30b6\u30fc\u540d\u306f\u82f1\u6570\u5b57\u3001\u30a2\u30f3\u30c0\u30fc\u30b9\u30b3\u30a2(_)\u3001\u30cf\u30a4\u30d5\u30f3(-)\u306e\u307f\u4f7f\u7528\u3067\u304d\u307e\u3059' }
  }

  return { valid: true }
}
