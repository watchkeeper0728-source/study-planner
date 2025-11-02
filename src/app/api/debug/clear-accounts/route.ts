import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // 特定のユーザーのアカウントを削除
    const user = await prisma.user.findUnique({
      where: { email: 'watchkeeper0728@gmail.com' },
      include: {
        accounts: true,
        sessions: true,
      },
    })

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: 'User not found' 
      }, { status: 404 })
    }

    // アカウントとセッションを削除
    await prisma.account.deleteMany({
      where: { userId: user.id },
    })

    await prisma.session.deleteMany({
      where: { userId: user.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Accounts and sessions cleared',
      user: {
        id: user.id,
        email: user.email,
        accountsDeleted: user.accounts.length,
        sessionsDeleted: user.sessions.length,
      },
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error?.message || 'Unknown error',
      stack: error?.stack,
    }, { status: 500 })
  }
}


