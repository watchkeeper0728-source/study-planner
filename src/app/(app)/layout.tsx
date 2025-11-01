import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { TopNav } from '@/components/TopNav'
import { MobileBottomNav } from '@/components/MobileBottomNav'
import { Toaster } from '@/components/ui/sonner'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth()
  console.log("[AUTH DEBUG] AppLayout - Session check:", {
    hasSession: !!session,
    userId: session?.user?.id,
    userEmail: session?.user?.email,
  })
  if (!session) {
    console.log("[AUTH DEBUG] AppLayout - No session, redirecting to signin")
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

