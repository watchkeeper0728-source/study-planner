import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // データベース接続の確認
    await prisma.$connect()
    
    // テーブルの存在確認
    const userCount = await prisma.user.count()
    const sessionCount = await prisma.session.count()
    const accountCount = await prisma.account.count()
    
    // テーブル構造の確認（refresh_token_expires_inフィールドの存在確認）
    let hasRefreshTokenExpiresIn = false
    try {
      // 直接SQLクエリでカラムの存在を確認
      const result = await prisma.$queryRaw<Array<{column_name: string}>>`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'accounts' 
        AND column_name = 'refresh_token_expires_in'
      `
      hasRefreshTokenExpiresIn = result.length > 0
    } catch (e) {
      // エラーが発生した場合は無視
      console.error('Column check error:', e)
    }
    
    // 特定のユーザーの確認
    let user = null
    try {
      user = await prisma.user.findUnique({
        where: { email: 'watchkeeper0728@gmail.com' },
        include: {
          accounts: true,
          sessions: true,
        },
      })
    } catch (e) {
      console.error('User query error:', e)
    }

    return NextResponse.json({
      success: true,
      connection: 'OK',
      schema: {
        hasRefreshTokenExpiresIn,
      },
      counts: {
        users: userCount,
        sessions: sessionCount,
        accounts: accountCount,
      },
      user: user ? {
        id: user.id,
        email: user.email,
        accountCount: user.accounts.length,
        sessionCount: user.sessions.length,
        accounts: user.accounts.map(a => ({
          provider: a.provider,
          providerAccountId: a.providerAccountId,
        })),
      } : null,
    })
  } catch (error: any) {
    console.error('Database debug error:', error)
    return NextResponse.json({
      success: false,
      error: error?.message || 'Unknown error',
      errorName: error?.name,
      errorCode: error?.code,
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
    }, { status: 500 })
  } finally {
    await prisma.$disconnect().catch(() => {})
  }
}

