import {
  createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode
} from 'react'
import { authApi } from '../api/authApi'
import { setTokenUpdater, setUnauthorizedHandler, setCurrentToken } from '../api/httpClient'
import type { User, ApiError } from '../types'

// Refresh the access token when this fraction of its TTL remains (e.g. 0.2 = last 20%)
const REFRESH_THRESHOLD = 0.2

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
  const refreshTimerRef               = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scheduleProactiveRefresh = useCallback((expiresInSeconds: number) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    // Refresh when REFRESH_THRESHOLD of the TTL remains
    const delayMs = Math.max((expiresInSeconds * (1 - REFRESH_THRESHOLD)) * 1000, 5_000)
    refreshTimerRef.current = setTimeout(async () => {
      try {
        const res = await authApi.refresh()
        setCurrentToken(res.accessToken)
        setAccessToken(res.accessToken)
        if (res.expiresIn) scheduleProactiveRefresh(res.expiresIn)
      } catch {
        // Refresh token expired — let the 401 interceptor handle logout naturally
      }
    }, delayMs)
  }, [])

  const saveSession = useCallback((at: string, u: User, expiresIn?: number) => {
    setCurrentToken(at)
    setAccessToken(at)
    setUser(u)
    if (expiresIn) scheduleProactiveRefresh(expiresIn)
  }, [scheduleProactiveRefresh])

  const clearSession = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
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
    setTokenUpdater((token: string, expiresIn?: number) => {
      setCurrentToken(token)   // immediate — no React batching delay
      setAccessToken(token)
      if (expiresIn) scheduleProactiveRefresh(expiresIn)
    })
  }, [scheduleProactiveRefresh])

  useEffect(() => {
    setUnauthorizedHandler(() => clearSession())
  }, [clearSession])

  // Bootstrap — always restore session via HttpOnly cookie
  useEffect(() => {
    authApi.refresh()
      .then((res) => {
        setCurrentToken(res.accessToken)   // sync — ensures getProfile request carries the token
        setAccessToken(res.accessToken)
        if (res.expiresIn) scheduleProactiveRefresh(res.expiresIn)
        return authApi.getProfile()
      })
      .then(({ user }) => setUser(user))
      .catch(() => clearSession())
      .finally(() => setIsLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Actions ────────────────────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login({ email, password })
    saveSession(res.accessToken, res.user, res.expiresIn)
  }, [saveSession])

  const register = useCallback(async (name: string, email: string, password: string, phone?: string) => {
    const res = await authApi.register({ name, email, password, ...(phone ? { phone } : {}) })
    saveSession(res.accessToken, res.user, res.expiresIn)
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
