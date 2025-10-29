import { vi } from 'vitest'

// Mock Next.js modules
vi.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    }
  },
  usePathname() {
    return '/'
  },
}))

vi.mock('next-auth/react', () => ({
  useSession() {
    return {
      data: {
        user: {
          id: 'test-user-id',
          name: 'Test User',
          email: 'test@example.com',
        },
      },
      status: 'authenticated',
    }
  },
}))

// Mock fetch
global.fetch = vi.fn()

// Mock environment variables
process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'test-vapid-key'
