import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// デバッグ用：手動でアカウントをリンクする
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, providerAccountId } = body

    if (!email || !providerAccountId) {
      return NextResponse.json(
        { error: 'email and providerAccountId are required' },
        { status: 400 }
      )
    }

    // ユーザーを検索
    const user = await prisma.user.findUnique({
      where: { email },
      include: { accounts: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: `User not found: ${email}` },
        { status: 404 }
      )
    }

    // 既にアカウントがリンクされているか確認
    const existingAccount = await prisma.account.findFirst({
      where: {
        userId: user.id,
        provider: 'google',
        providerAccountId: providerAccountId,
      },
    })

    if (existingAccount) {
      return NextResponse.json({
        success: true,
        message: 'Account already linked',
        account: {
          id: existingAccount.id,
          provider: existingAccount.provider,
          providerAccountId: existingAccount.providerAccountId,
        },
      })
    }

    // 手動でアカウントを作成（これはテスト用なので、実際のトークンは不要）
    // 実際のアカウントリンクには、Google OAuthからのトークンが必要です
    return NextResponse.json({
      success: false,
      message: 'Cannot manually link account - requires OAuth tokens. Use this to check account status only.',
      user: {
        id: user.id,
        email: user.email,
        accountCount: user.accounts.length,
        accounts: user.accounts.map(a => ({
          id: a.id,
          provider: a.provider,
          providerAccountId: a.providerAccountId,
        })),
      },
    })
  } catch (error: any) {
    console.error('Manual link account error:', error)
    return NextResponse.json(
      {
        error: error?.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
      },
      { status: 500 }
    )
  }
}

