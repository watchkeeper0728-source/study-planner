'use client'

import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            中学受験 学習予定・記録アプリ
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Googleアカウントでログインしてください
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => signIn('google', { callbackUrl: '/' })}
            className="w-full"
            size="lg"
          >
            Googleでログイン
          </Button>
          <div className="text-center text-sm text-gray-500">
            <p>ログインすることで、以下の機能が利用できます：</p>
            <ul className="mt-2 text-left space-y-1">
              <li>• 学習予定の管理</li>
              <li>• Googleカレンダーとの同期</li>
              <li>• 学習記録の保存</li>
              <li>• テスト結果の管理</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

