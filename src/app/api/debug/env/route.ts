import { NextResponse } from 'next/server'

export async function GET() {
  // セキュリティ: 本番環境では無効化推奨
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_DEBUG) {
    return NextResponse.json({ error: 'Debug endpoint disabled in production' }, { status: 403 })
  }

  const env = {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID 
      ? `${process.env.GOOGLE_CLIENT_ID.substring(0, 40)}...` 
      : 'NOT SET',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET 
      ? `${process.env.GOOGLE_CLIENT_SECRET.substring(0, 20)}...` 
      : 'NOT SET',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET',
    EXPECTED_CLIENT_ID_STARTS: '259584654504-h86ohpa6trnsif0falig3qssg55r7aap',
    CLIENT_ID_MATCH: process.env.GOOGLE_CLIENT_ID?.startsWith('259584654504-h86ohpa6trnsif0falig3qssg55r7aap') || false,
  }

  return NextResponse.json(env)
}

