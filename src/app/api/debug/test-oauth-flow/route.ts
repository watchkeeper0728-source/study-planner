import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// デバッグ用：OAuthフローの各ステップをテスト
export async function GET() {
  try {
    const email = 'watchkeeper0728@gmail.com'

    // ステップ1: ユーザーを取得
    const user = await prisma.user.findUnique({
      where: { email },
      include: { accounts: true, sessions: true },
    })

    if (!user) {
      return NextResponse.json({
        step: 'getUserByEmail',
        status: 'NOT_FOUND',
        message: `User not found: ${email}`,
      })
    }

    // ステップ2: アカウントをチェック
    const googleAccount = user.accounts.find(a => a.provider === 'google')

    // ステップ3: PrismaAdapterのメソッドを直接テスト
    const adapter = await import('@next-auth/prisma-adapter')
    const PrismaAdapter = adapter.default || adapter.PrismaAdapter
    
    // Adapterのメソッドを直接呼び出すことはできないので、
    // 代わりにデータベースの状態を確認

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
      },
      accounts: user.accounts.map(a => ({
        id: a.id,
        provider: a.provider,
        providerAccountId: a.providerAccountId,
        userId: a.userId,
      })),
      sessions: user.sessions.map(s => ({
        id: s.id,
        sessionToken: s.sessionToken.substring(0, 20) + '...',
        expires: s.expires,
      })),
      analysis: {
        hasGoogleAccount: !!googleAccount,
        accountCount: user.accounts.length,
        sessionCount: user.sessions.length,
        needsLinking: !googleAccount && user.accounts.length === 0,
      },
    })
  } catch (error: any) {
    console.error('Test OAuth flow error:', error)
    return NextResponse.json(
      {
        error: error?.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
      },
      { status: 500 }
    )
  }
}

