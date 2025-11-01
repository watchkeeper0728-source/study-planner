'use client'

import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  
  // すべてのパラメータを取得してデバッグ情報として表示
  const allParams: Record<string, string> = {}
  searchParams.forEach((value, key) => {
    allParams[key] = value
  })

  const errorMessages: Record<string, string> = {
    Configuration: '認証の設定に問題があります。管理者にお問い合わせください。',
    AccessDenied: 'アクセスが拒否されました。Googleアカウントにアクセス権限がない可能性があります。',
    Verification: '認証トークンの検証に失敗しました。もう一度お試しください。',
    Default: '認証中にエラーが発生しました。もう一度お試しください。',
  }

  const errorMessage = error ? errorMessages[error] || errorMessages.Default : errorMessages.Default

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-red-600">
            認証エラー
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-red-800 font-semibold mb-2">エラーが発生しました</div>
            <div className="text-red-700 text-sm">{errorMessage}</div>
            <div className="mt-2 text-xs text-red-600 space-y-1">
              {error ? (
                <>
                  <div><strong>エラーコード:</strong> {error}</div>
                  {errorDescription && (
                    <div><strong>エラー詳細:</strong> {errorDescription}</div>
                  )}
                </>
              ) : (
                <div className="text-yellow-700 bg-yellow-50 p-2 rounded">
                  <strong>注意:</strong> エラーコードが取得できませんでした。URLパラメータを確認してください。
                </div>
              )}
              <div className="mt-2 p-2 bg-red-100 rounded text-xs font-mono break-all">
                <strong>すべてのURLパラメータ ({Object.keys(allParams).length}個):</strong>
                <br />
                {Object.keys(allParams).length > 0 ? (
                  Object.entries(allParams).map(([key, value]) => (
                    <div key={key} className="mt-1">
                      <strong>{key}:</strong> {value}
                    </div>
                  ))
                ) : (
                  <div className="mt-1 text-gray-600">パラメータがありません</div>
                )}
              </div>
              <div className="mt-2 p-2 bg-blue-100 rounded text-xs">
                <strong>デバッグ情報:</strong>
                <br />
                <div className="mt-1">現在のURL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}</div>
                <div className="mt-1">エラーコード: {error || 'なし'}</div>
                <div className="mt-1">エラー詳細: {errorDescription || 'なし'}</div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild className="flex-1">
              <Link href="/auth/signin">再度ログイン</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

