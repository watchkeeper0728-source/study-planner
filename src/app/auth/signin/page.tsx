'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface RecentUser {
  username: string
  name: string | null
  lastLoginAt: string | null
}

export default function SignInPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])

  useEffect(() => {
    // 直近ログインユーザーを取得
    fetch('/api/auth/recent-users')
      .then((res) => res.json())
      .then((data) => {
        if (data.users) {
          setRecentUsers(data.users)
        }
      })
      .catch((error) => {
        console.error('Failed to fetch recent users:', error)
      })
  }, [])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('[CLIENT] Sign in form submitted, username:', username)
    setIsLoading(true)

    try {
      console.log('[CLIENT] Sending request to /api/auth/signin')
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })

      console.log('[CLIENT] Response status:', response.status)
      const data = await response.json()
      console.log('[CLIENT] Response data:', data)

      if (!response.ok) {
        console.error('[CLIENT] Response not OK, error:', data.error)
        throw new Error(data.error || 'ログインに失敗しました')
      }

      console.log('[CLIENT] Sign in successful, redirecting...')
      toast.success(`ようこそ、${data.user.username}さん！`)
      router.push('/')
      router.refresh()
    } catch (error: any) {
      console.error('[CLIENT] Sign in error:', error)
      toast.error(error.message || 'ログインに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickSignIn = async (username: string) => {
    setIsLoading(true)

    try {
      // まずセッションを確認
      const sessionRes = await fetch('/api/auth/session')
      const sessionData = await sessionRes.json()

      // セッションが有効な場合はそのトークンを使用
      if (sessionData.user && sessionData.user.username === username) {
        router.push('/')
        router.refresh()
        return
      }

      // 新しくログイン
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'ログインに失敗しました')
      }

      toast.success(`ようこそ、${data.user.username}さん！`)
      router.push('/')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'ログインに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            中学受験 学習予定・記録アプリ
          </CardTitle>
          <p className="text-gray-600 mt-2">
            ユーザー名でログインしてください
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {recentUsers.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm text-gray-600">直近ログイン</Label>
              <div className="grid grid-cols-1 gap-2">
                {recentUsers.map((user) => (
                  <Button
                    key={user.username}
                    variant="outline"
                    onClick={() => handleQuickSignIn(user.username)}
                    disabled={isLoading}
                    className="w-full justify-start"
                  >
                    <span className="font-medium">{user.name || user.username}</span>
                    {user.lastLoginAt && (
                      <span className="ml-auto text-xs text-gray-500">
                        {new Date(user.lastLoginAt).toLocaleDateString('ja-JP', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    )}
                  </Button>
                ))}
              </div>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">または</span>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">ユーザー名</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => {
                  const value = e.target.value
                  // Only allow alphanumeric, underscore, and hyphen
                  if (value === '' || /^[a-zA-Z0-9_-]+$/.test(value)) {
                    setUsername(value)
                  }
                }}
                placeholder="ユーザー名を入力"
                required
                minLength={2}
                maxLength={20}
                disabled={isLoading}
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                英数字、アンダースコア(_)、ハイフン(-)のみ使用できます（2-20文字）
              </p>
            </div>
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? 'ログイン中...' : 'ログイン'}
            </Button>
          </form>

          <div className="text-center text-sm text-gray-500">
            <p>ログインすることで、以下の機能が利用できます：</p>
            <ul className="mt-2 text-left space-y-1">
              <li>• 学習予定の管理</li>
              <li>• 学習記録の保存</li>
              <li>• テスト結果の管理</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
