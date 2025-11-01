import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { TopNav, MobileBottomNav } from '@/components/TopNav'
import { Toaster } from '@/components/ui/sonner'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth()
  if (!session) {
    redirect('/auth/signin')
  }
  return (
    <>
      <TopNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 sm:pb-8">
        {children}
      </main>
      <MobileBottomNav />
      <Toaster />
    </>
  )
}

