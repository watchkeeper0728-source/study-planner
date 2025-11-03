import { NextRequest, NextResponse } from 'next/server'
import { signOut } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session_token')?.value

    if (sessionToken) {
      await signOut(sessionToken)
    }

    // クッキーを削除
    cookieStore.delete('session_token')

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[AUTH API] Sign out error:', error)
    return NextResponse.json(
      { error: error?.message || 'ログアウトに失敗しました' },
      { status: 500 }
    )
  }
}


