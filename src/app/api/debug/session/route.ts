import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

// デバッグ用：現在のセッション状態を確認
export async function GET() {
  // 開発環境またはデバッグモードが有効な場合のみ
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_AUTH_DEBUG !== 'true') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development or when ENABLE_AUTH_DEBUG=true' },
      { status: 403 }
    )
  }

  try {
    const session = await auth()
    
    return NextResponse.json({
      hasSession: !!session,
      session: session ? {
        user: {
          id: session.user?.id,
          email: session.user?.email,
          name: session.user?.name,
          image: session.user?.image,
        },
        expires: session.expires,
      } : null,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
      },
      { status: 500 }
    )
  }
}

