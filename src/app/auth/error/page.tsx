export const dynamic = 'force-dynamic'

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const error = params?.error

  const errorMessages: Record<string, string> = {
    Configuration: 'サーバーの設定に問題があります。しばらくしてから再度お試しください。',
    AccessDenied: 'アクセスが拒否されました。Googleアカウントがテストユーザーに追加されているか確認してください。',
    Verification: '認証に失敗しました。メールアドレスの確認が必要な場合があります。',
    Default: '認証エラーが発生しました。もう一度お試しください。',
  }

  const errorMessage = error && errorMessages[error] ? errorMessages[error] : errorMessages.Default

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">認証エラー</h1>
          <p className="text-gray-700 mb-4">{errorMessage}</p>
          {error && (
            <p className="text-sm text-gray-500 mb-4">
              エラーコード: {error}
            </p>
          )}
          <a
            href="/auth/signin"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            ログインページに戻る
          </a>
        </div>
      </div>
    </div>
  )
}

