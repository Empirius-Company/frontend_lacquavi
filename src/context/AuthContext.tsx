import {
  createContext, useContext, useEffect, useState, useCallback, ReactNode
} from 'react'
import { authApi } from '../api/authApi'
import { setTokenAccessor, setUnauthorizedHandler } from '../api/httpClient'
import type { User, ApiError } from '../types'

const ACCESS_KEY  = 'lacquavi_access_token'
const REFRESH_KEY = 'lacquavi_refresh_token'

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
  const [user, setUser]                   = useState<User | null>(null)
  const [accessToken, setAccessToken]     = useState('')
  const [refreshToken, setRefreshToken]   = useState('')
  const [isLoading, setIsLoading]         = useState(true)

  const saveSession = useCallback((at: string, rt: string, u: User) => {
    localStorage.setItem(ACCESS_KEY,  at)
    localStorage.setItem(REFRESH_KEY, rt)
    setAccessToken(at)
    setRefreshToken(rt)
    setUser(u)
  }, [])

  const clearSession = useCallback(() => {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
    setAccessToken('')
    setRefreshToken('')
    setUser(null)
  }, [])

  // Wire httpClient
  useEffect(() => {
    setTokenAccessor(() => accessToken || localStorage.getItem(ACCESS_KEY))
  }, [accessToken])

  useEffect(() => {
    setUnauthorizedHandler(() => clearSession())
  }, [clearSession])

  // Bootstrap session from localStorage
  useEffect(() => {
    const storedAccess  = localStorage.getItem(ACCESS_KEY)
    const storedRefresh = localStorage.getItem(REFRESH_KEY)

    if (!storedAccess) {
      setIsLoading(false)
      return
    }

    setAccessToken(storedAccess)
    if (storedRefresh) setRefreshToken(storedRefresh)

    authApi.getProfile()
      .then(({ user }) => setUser(user))
      .catch(() => {
        // Try refresh if profile fails
        if (storedRefresh) {
          return authApi.refresh(storedRefresh)
            .then(({ accessToken: at, refreshToken: rt }) => {
              localStorage.setItem(ACCESS_KEY,  at)
              localStorage.setItem(REFRESH_KEY, rt)
              setAccessToken(at)
              setRefreshToken(rt)
              return authApi.getProfile()
            })
            .then(({ user }) => setUser(user))
            .catch(() => clearSession())
        }
        clearSession()
      })
      .finally(() => setIsLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Actions ────────────────────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login({ email, password })
    saveSession(res.accessToken, res.refreshToken, res.user)
  }, [saveSession])

  const register = useCallback(async (name: string, email: string, password: string, phone?: string) => {
    const res = await authApi.register({ name, email, password, ...(phone ? { phone } : {}) })
    saveSession(res.accessToken, res.refreshToken, res.user)
  }, [saveSession])

  const logout = useCallback(async () => {
    try { await authApi.logout({ refreshToken }) } catch { /* ignore */ }
    clearSession()
  }, [refreshToken, clearSession])

  const logoutAll = useCallback(async () => {
    try { await authApi.logoutAll() } catch { /* ignore */ }
    clearSession()
  }, [clearSession])

  const refreshSession = useCallback(async () => {
    const rt = refreshToken || localStorage.getItem(REFRESH_KEY) || ''
    const res = await authApi.refresh(rt)
    localStorage.setItem(ACCESS_KEY,  res.accessToken)
    localStorage.setItem(REFRESH_KEY, res.refreshToken)
    setAccessToken(res.accessToken)
    setRefreshToken(res.refreshToken)
  }, [refreshToken])

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
