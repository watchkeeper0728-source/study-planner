import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// デバッグ用：ユーザーと全ての関連データを完全に削除（GETとPOSTの両方に対応）
export async function GET() {
  return await resetUser()
}

export async function POST() {
  return await resetUser()
}

async function resetUser() {
  try {
    const email = 'watchkeeper0728@gmail.com'

    // ユーザーを取得
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        accounts: true,
        sessions: true,
      },
    })

    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'ユーザーが見つかりませんでした',
        html: '<html><body><h1>ユーザーリセット完了</h1><p>ユーザーが見つかりませんでした（既に削除されているか、存在しません）</p><p><a href="/auth/signin">ログインページへ</a></p></body></html>',
      }, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    }

    // ユーザーを削除（CASCADEで関連データも自動削除）
    await prisma.user.delete({
      where: { email },
    })

    return NextResponse.json({
      success: true,
      message: 'ユーザーと全ての関連データを削除しました',
      deleted: {
        userId: user.id,
        email: user.email,
        accounts: user.accounts.length,
        sessions: user.sessions.length,
      },
      html: `<html><body>
        <h1>ユーザーリセット完了</h1>
        <p>ユーザー「${user.email}」と全ての関連データを削除しました。</p>
        <p>削除されたデータ:</p>
        <ul>
          <li>アカウント: ${user.accounts.length}件</li>
          <li>セッション: ${user.sessions.length}件</li>
        </ul>
        <p><a href="/auth/signin">ログインページへ</a>（新規ユーザーとして再作成されます）</p>
      </body></html>`,
    }, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  } catch (error: any) {
    console.error('Reset user error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Unknown error',
        html: `<html><body>
          <h1>エラーが発生しました</h1>
          <p>${error?.message || 'Unknown error'}</p>
          <p><a href="/auth/signin">ログインページへ</a></p>
        </body></html>`,
      },
      {
        status: 500,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    )
  } finally {
    await prisma.$disconnect().catch(() => {})
  }
}

