import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  return handleMigration(request)
}

export async function POST(request: NextRequest) {
  return handleMigration(request)
}

async function handleMigration(request: NextRequest) {
  try {
    // Get token from query parameter or Authorization header
    const url = new URL(request.url)
    const authQuery = url.searchParams.get('token')
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.MIGRATION_SECRET_TOKEN || 'temp-migration-token-change-in-production'
    
    const providedToken = authHeader?.replace('Bearer ', '') || authQuery
    
    if (providedToken !== expectedToken) {
      return NextResponse.json(
        { error: 'Unauthorized. Please provide token in query parameter: ?token=temp-migration-token-change-in-production' },
        { status: 401 }
      )
    }

    console.log('[MIGRATION] Starting database migration from /api/run-migration...')

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

