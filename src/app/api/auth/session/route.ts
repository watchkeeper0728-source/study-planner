import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ user: null })
    }

    return NextResponse.json({ user: session })
  } catch (error: any) {
    console.error('[AUTH API] Get session error:', error)
    return NextResponse.json(
      { error: error?.message || 'セッションの取得に失敗しました' },
      { status: 500 }
    )
  }
}


