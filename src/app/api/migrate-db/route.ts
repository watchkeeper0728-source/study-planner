import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Simple migration endpoint that always runs migration
 * Use with caution - protected by environment variable check
 */
export async function GET(request: NextRequest) {
  try {
    // Simple environment variable check for security
    const allowMigration = process.env.ALLOW_DIRECT_MIGRATION === 'true' || 
                          process.env.NODE_ENV !== 'production'
    
    if (!allowMigration) {
      return NextResponse.json(
        { error: 'Migration not allowed in production without ALLOW_DIRECT_MIGRATION=true' },
        { status: 403 }
      )
    }

    console.log('[MIGRATE-DB] Starting direct database migration...')
    console.log('[MIGRATE-DB] Request URL:', request.url)

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

    console.log('[MIGRATE-DB] Migration completed successfully')
    console.log('[MIGRATE-DB] Verified columns:', JSON.stringify(columnCheck, null, 2))

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      columns: columnCheck,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('[MIGRATE-DB] Migration error:', error)
    console.error('[MIGRATE-DB] Error stack:', error?.stack)
    return NextResponse.json(
      {
        error: error?.message || 'Migration failed',
        details: error?.stack,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}

