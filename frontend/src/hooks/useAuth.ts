import { create } from 'zustand'
import { api } from '../services/api'
import { User } from '../types'

interface AuthState {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  loadUser: () => Promise<void>
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', data.token)
    set({ token: data.token, user: data.user })
  },

  logout: () => {
    localStorage.removeItem('token')
    set({ token: null, user: null })
    window.location.href = '/login'
  },

  loadUser: async () => {
    try {
      const { data } = await api.get('/auth/me')
      set({ user: data })
    } catch {
      localStorage.removeItem('token')
      set({ token: null, user: null })
    }
  },
}))
