import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { TopNav } from '@/components/TopNav'
import { SideNav } from '@/components/SideNav'
import { MobileBottomNav } from '@/components/MobileBottomNav'
import { Toaster } from '@/components/ui/sonner'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth()
  if (process.env.ENABLE_AUTH_DEBUG === 'true') {
    console.log("[AUTH DEBUG] AppLayout - Session check:", {
      hasSession: !!session,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
    })
  }
  if (!session) {
    if (process.env.ENABLE_AUTH_DEBUG === 'true') {
      console.log("[AUTH DEBUG] AppLayout - No session, redirecting to signin")
    }
    redirect('/auth/signin')
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <div className="hidden md:block">
        <SideNav />
      </div>
      <main className="pb-16 md:pb-0 md:ml-32 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
      <div className="md:hidden">
        <MobileBottomNav />
      </div>
      <Toaster />
    </div>
  )
}

