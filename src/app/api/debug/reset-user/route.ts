import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // 特定のユーザーを完全に削除（関連するすべてのデータも削除）
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

    // ユーザーを削除（CASCADEで関連データも自動削除）
    await prisma.user.delete({
      where: { id: user.id },
    })

    return NextResponse.json({
      success: true,
      message: 'User completely deleted',
      deleted: {
        userId: user.id,
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


