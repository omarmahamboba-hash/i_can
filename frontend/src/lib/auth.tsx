import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, ApiError } from './api'

export type ChangePasswordResult = 'ok' | 'invalid' | 'weak'

type AuthValue = {
  authenticated: boolean
  loading: boolean
  login: (password: string) => Promise<boolean>
  logout: () => Promise<void>
  changePassword: (current: string, next: string) => Promise<ChangePasswordResult>
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get<{ authenticated: boolean }>('/auth/me')
      .then((res) => setAuthenticated(res.authenticated))
      .catch(() => setAuthenticated(false))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const onUnauthorized = () => setAuthenticated(false)
    window.addEventListener('ican:unauthorized', onUnauthorized)
    return () => window.removeEventListener('ican:unauthorized', onUnauthorized)
  }, [])

  const login = useCallback(async (password: string) => {
    try {
      await api.post('/auth/login', { password })
      setAuthenticated(true)
      return true
    } catch (error) {
      if (error instanceof ApiError) return false
      throw error
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      setAuthenticated(false)
    }
  }, [])

  const changePassword = useCallback(async (current: string, next: string): Promise<ChangePasswordResult> => {
    try {
      await api.put('/auth/password', { current, next })
      return 'ok'
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.message === 'weak_password') return 'weak'
        if (error.message === 'invalid_password') return 'invalid'
      }
      throw error
    }
  }, [])

  const value = useMemo<AuthValue>(
    () => ({ authenticated, loading, login, logout, changePassword }),
    [authenticated, loading, login, logout, changePassword],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
