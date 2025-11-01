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
    
    // 特定のユーザーの確認
    const user = await prisma.user.findUnique({
      where: { email: 'watchkeeper0728@gmail.com' },
      include: {
        accounts: true,
        sessions: true,
      },
    })

    return NextResponse.json({
      success: true,
      connection: 'OK',
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
    return NextResponse.json({
      success: false,
      error: error?.message || 'Unknown error',
      stack: error?.stack,
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

