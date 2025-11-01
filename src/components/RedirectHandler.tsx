'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export function RedirectHandler() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // セッション読み込み中は何もしない

    if (status === 'unauthenticated') {
      // 未認証の場合はサインインページにリダイレクト
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      // 認証済みの場合はメインアプリにリダイレクト
      router.push('/(app)');
    }
  }, [session, status, router]);

  return null; // このコンポーネントはUIを表示しない
}














