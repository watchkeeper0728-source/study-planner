import { NextRequest, NextResponse } from 'next/server'
import { signInWithToken } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionToken } = body

    if (!sessionToken || typeof sessionToken !== 'string') {
      return NextResponse.json(
        { error: 'セッショントークンが必要です' },
        { status: 400 }
      )
    }

    // セッショントークンでログイン
    const user = await signInWithToken(sessionToken)

    if (!user) {
      return NextResponse.json(
        { error: '無効なセッショントークンです' },
        { status: 401 }
      )
    }

    // セッションクッキーを設定
    const cookieStore = await cookies()
    cookieStore.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30日
      path: '/',
    })

    return NextResponse.json({
      success: true,
      user,
    })
  } catch (error: any) {
    console.error('[AUTH API] Sign in with token error:', error)
    return NextResponse.json(
      { error: error?.message || 'ログインに失敗しました' },
      { status: 500 }
    )
  }
}


