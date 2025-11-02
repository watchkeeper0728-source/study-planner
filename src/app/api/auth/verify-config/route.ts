import { NextResponse } from 'next/server'

// 本番環境では無効化（セキュリティのため）
export async function GET() {
  // 開発環境またはデバッグモードが有効な場合のみ
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_AUTH_DEBUG !== 'true') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development or when ENABLE_AUTH_DEBUG=true' },
      { status: 403 }
    )
  }

  const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim()
  const expectedClientIdStart = '259584654504-h86ohpa6trnsif0falig3qssg55r7aap'
  
  return NextResponse.json({
    currentClientId: googleClientId 
      ? `${googleClientId.substring(0, 40)}...` 
      : 'NOT SET',
    expectedStart: expectedClientIdStart,
    matches: googleClientId?.startsWith(expectedClientIdStart) || false,
    fullClientId: googleClientId || 'NOT SET',
    message: googleClientId?.startsWith(expectedClientIdStart)
      ? '正しいOAuth Client IDが設定されています'
      : '誤ったOAuth Client IDが設定されている可能性があります。Google Cloud Consoleで「study-planner」プロジェクトのOAuth Client IDを確認してください。',
  })
}

