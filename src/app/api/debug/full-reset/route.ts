import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// デバッグ用：ユーザーと全ての関連データを完全に削除
export async function POST() {
  try {
    const email = 'watchkeeper0728@gmail.com'

    // ユーザーを取得
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        accounts: true,
        sessions: true,
        todos: true,
        plans: true,
        logs: true,
        tests: true,
        reflections: true,
        pastExams: true,
      },
    })

    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'User not found, nothing to delete',
      })
    }

    // 全ての関連データを削除（外部キー制約により自動的に削除されるが、明示的に削除）
    
    // アカウントとセッションは外部キー制約で自動削除される
    // その他のデータも外部キー制約で自動削除される
    
    // ユーザーを削除（CASCADEで関連データも削除される）
    await prisma.user.delete({
      where: { email },
    })

    return NextResponse.json({
      success: true,
      message: 'User and all associated data deleted',
      deleted: {
        userId: user.id,
        email: user.email,
        accounts: user.accounts.length,
        sessions: user.sessions.length,
        todos: user.todos.length,
        plans: user.plans.length,
        logs: user.logs.length,
        tests: user.tests.length,
        reflections: user.reflections.length,
        pastExams: user.pastExams.length,
      },
    })
  } catch (error: any) {
    console.error('Full reset error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Unknown error',
        errorName: error?.name,
        errorCode: error?.code,
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect().catch(() => {})
  }
}

