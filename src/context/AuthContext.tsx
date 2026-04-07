import {
  createContext, useContext, useEffect, useState, useCallback, ReactNode
} from 'react'
import { authApi } from '../api/authApi'
import { setTokenUpdater, setUnauthorizedHandler, setCurrentToken } from '../api/httpClient'
import type { User, ApiError } from '../types'

interface AuthContextValue {
  user: User | null
  accessToken: string
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>
  logout: () => Promise<void>
  logoutAll: () => Promise<void>
  refreshSession: () => Promise<void>
  updateUser: (user: User) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]               = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState('')
  const [isLoading, setIsLoading]     = useState(true)

  const saveSession = useCallback((at: string, u: User) => {
    setCurrentToken(at)
    setAccessToken(at)
    setUser(u)
  }, [])

  const clearSession = useCallback(() => {
    setCurrentToken(null)
    setAccessToken('')
    setUser(null)
  }, [])

  // Sync _currentToken whenever accessToken state changes
  // (keeps the in-memory token used by the request interceptor up-to-date)
  useEffect(() => {
    setCurrentToken(accessToken || null)
  }, [accessToken])

  // Wire httpClient — update in-memory token after silent refresh
  useEffect(() => {
    setTokenUpdater((token: string) => {
      setCurrentToken(token)   // immediate — no React batching delay
      setAccessToken(token)
    })
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(() => clearSession())
  }, [clearSession])

  // Bootstrap — always restore session via HttpOnly cookie
  useEffect(() => {
    authApi.refresh()
      .then(({ accessToken: at }) => {
        setCurrentToken(at)   // sync — ensures getProfile request carries the token
        setAccessToken(at)
        return authApi.getProfile()
      })
      .then(({ user }) => setUser(user))
      .catch(() => clearSession())
      .finally(() => setIsLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Actions ────────────────────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login({ email, password })
    saveSession(res.accessToken, res.user)
  }, [saveSession])

  const register = useCallback(async (name: string, email: string, password: string, phone?: string) => {
    const res = await authApi.register({ name, email, password, ...(phone ? { phone } : {}) })
    saveSession(res.accessToken, res.user)
  }, [saveSession])

  const logout = useCallback(async () => {
    try { await authApi.logout() } catch { /* ignore */ }
    clearSession()
  }, [clearSession])

  const logoutAll = useCallback(async () => {
    try { await authApi.logoutAll() } catch { /* ignore */ }
    clearSession()
  }, [clearSession])

  const refreshSession = useCallback(async () => {
    const res = await authApi.refresh()
    setAccessToken(res.accessToken)
  }, [])

  const updateUser = useCallback((updated: User) => setUser(updated), [])

  const value: AuthContextValue = {
    user,
    accessToken,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
    logoutAll,
    refreshSession,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

export type { ApiError }
