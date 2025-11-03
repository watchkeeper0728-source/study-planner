import { NextRequest, NextResponse } from 'next/server'
import { getRecentUsers } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Log request details immediately
    console.log('[MIGRATION DEBUG v3] Request received')
    console.log('[MIGRATION DEBUG v3] request.url:', request.url)
    console.log('[MIGRATION DEBUG v3] request.nextUrl:', request.nextUrl?.toString())
    console.log('[MIGRATION DEBUG v3] request.nextUrl.search:', request.nextUrl?.search)
    
    // Get query parameters using multiple methods
    const url = new URL(request.url)
    const { searchParams } = url
    
    // Try all possible ways to get migrate parameter
    const migrateParam = searchParams.get('migrate') || 
                        request.nextUrl?.searchParams?.get('migrate') ||
                        url.searchParams.get('migrate')
    const runMigrationParam = searchParams.get('run-migration') || 
                               request.nextUrl?.searchParams?.get('run-migration') ||
                               url.searchParams.get('run-migration')
    
    // Log all search params
    console.log('[MIGRATION DEBUG v3] All searchParams:', Array.from(searchParams.entries()))
    console.log('[MIGRATION DEBUG v3] All nextUrl searchParams:', Array.from(request.nextUrl?.searchParams?.entries() || []))
    
    // Set up expected token
    const envToken = process.env.MIGRATION_SECRET_TOKEN
    const expectedToken = envToken || 'temp-migration-token-change-in-production'
    
    // Check if migration should be triggered - be very lenient
    // Check URL string directly since query params may not be parsed correctly
    const urlString = request.url || ''
    const nextUrlString = request.nextUrl?.toString() || ''
    const combinedUrl = urlString + ' ' + nextUrlString
    
    const shouldMigrate = 
      migrateParam === 'true' || 
      migrateParam === '1' ||
      migrateParam === expectedToken ||
      runMigrationParam === expectedToken ||
      urlString.includes('migrate=true') ||
      urlString.includes('migrate=1') ||
      nextUrlString.includes('migrate=true') ||
      nextUrlString.includes('migrate=1') ||
      combinedUrl.includes('migrate=true') ||
      combinedUrl.includes('migrate=1')
    
    console.log('[MIGRATION DEBUG v3] migrateParam:', migrateParam)
    console.log('[MIGRATION DEBUG v3] runMigrationParam:', runMigrationParam)
    console.log('[MIGRATION DEBUG v3] shouldMigrate:', shouldMigrate)
    console.log('[MIGRATION DEBUG v3] URL includes migrate=true:', request.url.includes('migrate=true'))
    
    if (shouldMigrate) {
      // Run migration
      try {
        console.log('[MIGRATION] Starting database migration via recent-users endpoint...')
        
        const migrationSQL = `
          -- Add username column if it doesn't exist
          ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "username" TEXT;

          -- Set username for existing users (use id as fallback if username is null)
          UPDATE "users" SET "username" = "id" WHERE "username" IS NULL;

          -- Create unique index if it doesn't exist
          CREATE UNIQUE INDEX IF NOT EXISTS "users_username_key" ON "users"("username");

          -- Make username NOT NULL (after all rows have values)
          DO $$
          BEGIN
              IF EXISTS (
                  SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'users' 
                  AND column_name = 'username' 
                  AND is_nullable = 'YES'
              ) THEN
                  ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL;
              END IF;
          END $$;

          -- Add lastLoginAt column if it doesn't exist
          ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP;
        `

        await prisma.$executeRawUnsafe(migrationSQL)

        // Verify migration
        const columnCheck: any[] = await prisma.$queryRaw`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = 'users'
          AND column_name IN ('username', 'lastLoginAt')
          ORDER BY column_name
        `

        console.log('[MIGRATION] Migration completed successfully')
        console.log('[MIGRATION] Verified columns:', columnCheck)

        return NextResponse.json({
          success: true,
          message: 'Migration completed successfully',
          columns: columnCheck,
        })
      } catch (error: any) {
        console.error('[MIGRATION] Migration error:', error)
        return NextResponse.json(
          {
            error: error?.message || 'Migration failed',
            details: error?.stack,
          },
          { status: 500 }
        )
      }
    }
    
    // Normal flow: get recent users
    const users = await getRecentUsers(3)
    return NextResponse.json({ users })
  } catch (error: any) {
    console.error('[AUTH API] Get recent users error:', error)
    return NextResponse.json(
      { error: error?.message || 'ユーザー一覧の取得に失敗しました' },
      { status: 500 }
    )
  }
}


