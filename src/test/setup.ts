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

vi.mock('@/hooks/useAuth', () => ({
  useAuth() {
    return {
      data: {
        session: {
          user: {
            id: 'test-user-id',
            username: 'testuser',
            name: 'Test User',
          },
        },
      },
      status: 'authenticated',
      refetch: vi.fn(),
    }
  },
}))

// Mock fetch
global.fetch = vi.fn()

// Mock environment variables
process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'test-vapid-key'
