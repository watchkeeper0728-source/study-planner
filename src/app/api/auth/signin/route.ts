import { NextRequest, NextResponse } from 'next/server'
import { signIn, validateUsername } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  console.log('========================================')
  console.log('[AUTH API] ===== SIGN IN REQUEST RECEIVED =====')
  console.log('[AUTH API] Timestamp:', new Date().toISOString())
  try {
    const body = await request.json()
    console.log('[AUTH API] Request body:', JSON.stringify(body))
    const { username } = body
    console.log('[AUTH API] Username extracted:', username)

    // ユーザー名の検証
    console.log('[AUTH API] Validating username...')
    const validation = validateUsername(username)
    console.log('[AUTH API] Validation result:', validation)
    if (!validation.valid) {
      console.log('[AUTH API] Validation failed, returning error')
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // ログイン処理
    console.log('[AUTH API] Attempting sign in for username:', username.trim())
    const result = await signIn(username.trim())
    console.log('[AUTH API] Sign in result:', result ? 'SUCCESS' : 'FAILED')

    if (!result) {
      console.error('[AUTH API] Sign in returned null result')
      return NextResponse.json(
        { error: 'ログインに失敗しました。データベース接続を確認してください。' },
        { status: 500 }
      )
    }

    console.log('[AUTH API] Sign in successful for user:', result.user.username)

    // セッションクッキーを設定
    console.log('[AUTH API] Setting session cookie...')
    const cookieStore = await cookies()
    cookieStore.set('session_token', result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30日
      path: '/',
    })
    console.log('[AUTH API] Session cookie set successfully')

    console.log('[AUTH API] Returning success response')
    console.log('[AUTH API] ===== SIGN IN SUCCESS =====')
    console.log('========================================')
    return NextResponse.json({
      success: true,
      user: result.user,
    })
  } catch (error: any) {
    console.error('========================================')
    console.error('[AUTH API] ===== SIGN IN ERROR =====')
    console.error('[AUTH API] Error type:', error?.constructor?.name)
    console.error('[AUTH API] Sign in error:', error)
    if (error instanceof Error) {
      console.error('[AUTH API] Error name:', error.name)
      console.error('[AUTH API] Error message:', error.message)
      console.error('[AUTH API] Error stack:', error.stack)
    }
    console.error('[AUTH API] ===== ERROR END =====')
    console.error('========================================')
    return NextResponse.json(
      { error: error?.message || 'ログインに失敗しました' },
      { status: 500 }
    )
  }
}


