import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import Cookies from 'js-cookie'

interface User {
  id: string
  email: string
  role: string
  name?: string
  centerId?: string
}

interface AuthStore {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setToken: (token: string) => void
  setUser: (user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setToken: (token: string) => {
        Cookies.set('auth-token', token, {
          expires: 7,
          secure: false,
          sameSite: 'lax',
        })
        set({ token, isAuthenticated: true })
      },

      setUser: (user: User) => {
        set({ user })
      },

      logout: () => {
        Cookies.remove('auth-token')
        set({ token: null, user: null, isAuthenticated: false })
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)
