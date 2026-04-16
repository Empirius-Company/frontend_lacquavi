import {
  createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode
} from 'react'
import { authApi } from '../api/authApi'
import { setTokenUpdater, setUnauthorizedHandler, setCurrentToken } from '../api/httpClient'
import { useToast } from './ToastContext'
import type { User, ApiError } from '../types'

// Refresh the access token when this fraction of its TTL remains (e.g. 0.2 = last 20%)
const REFRESH_THRESHOLD = 0.2
// Random jitter window added to the proactive-refresh delay so multiple tabs don't fire at once
const REFRESH_JITTER_MAX_MS = 45_000

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
  // BroadcastChannel for cross-tab token sync (prevents refresh race conditions)
  const bcRef                         = useRef<BroadcastChannel | null>(null)
  // Tracks whether there was an active session — used to decide if an expiry toast is appropriate
  const hadSessionRef                 = useRef(false)

  const { toast } = useToast()

  // Keep hadSessionRef in sync with user state
  useEffect(() => {
    hadSessionRef.current = !!user
  }, [user])

  const scheduleProactiveRefresh = useCallback((expiresInSeconds: number) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    // Spread multi-tab refreshes by adding a random jitter within REFRESH_JITTER_MAX_MS.
    // Without jitter, all open tabs fire at the same instant, causing a backend race where
    // only one refresh succeeds and the others trigger unnecessary logouts.
    const jitterMs = Math.random() * REFRESH_JITTER_MAX_MS
    const delayMs = Math.max((expiresInSeconds * (1 - REFRESH_THRESHOLD)) * 1000, 5_000) + jitterMs
    refreshTimerRef.current = setTimeout(async () => {
      try {
        const res = await authApi.refresh()
        setCurrentToken(res.accessToken)
        setAccessToken(res.accessToken)
        if (res.expiresIn) scheduleProactiveRefresh(res.expiresIn)
        // Tell other tabs: "I just refreshed — update your token, cancel your pending timers"
        bcRef.current?.postMessage({ type: 'TOKEN_REFRESHED', accessToken: res.accessToken, expiresIn: res.expiresIn })
      } catch {
        // Refresh token expired or lost the multi-tab race — the 401 interceptor handles logout
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

  // ─── BroadcastChannel setup ──────────────────────────────────────────────────
  // Synchronises auth state across all open tabs of the same origin so that:
  //   • When one tab refreshes the token, others adopt the new token immediately
  //     instead of also attempting a refresh (which would fail with "already revoked").
  //   • When one tab logs out, all others clear their session right away.
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return
    const bc = new BroadcastChannel('lacqua_auth')
    bcRef.current = bc
    bc.onmessage = (event: MessageEvent) => {
      const { type, accessToken: newToken, expiresIn } = event.data ?? {}
      if (type === 'TOKEN_REFRESHED' && newToken) {
        // Another tab just refreshed — adopt the new token and reschedule our timer
        // so we don't also try to refresh (which would race against the new token).
        setCurrentToken(newToken)
        setAccessToken(newToken)
        if (expiresIn) scheduleProactiveRefresh(expiresIn)
      } else if (type === 'LOGOUT') {
        clearSession()
      }
    }
    return () => {
      bc.close()
      bcRef.current = null
    }
  }, [scheduleProactiveRefresh, clearSession])

  // Sync _currentToken whenever accessToken state changes
  // (keeps the in-memory token used by the request interceptor up-to-date)
  useEffect(() => {
    setCurrentToken(accessToken || null)
  }, [accessToken])

  // Wire httpClient — update in-memory token after silent refresh (reactive 401 path)
  useEffect(() => {
    setTokenUpdater((token: string, expiresIn?: number) => {
      setCurrentToken(token)   // immediate — no React batching delay
      setAccessToken(token)
      if (expiresIn) scheduleProactiveRefresh(expiresIn)
      // Broadcast so other tabs don't try to refresh again with the same old cookie
      bcRef.current?.postMessage({ type: 'TOKEN_REFRESHED', accessToken: token, expiresIn })
    })
  }, [scheduleProactiveRefresh])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      // Only show the toast when a real session was active, not during the initial
      // bootstrap refresh attempt (when user is still null).
      // Set hadSessionRef to false immediately (not waiting for the effect) so that
      // concurrent 401s on multiple in-flight requests don't show the toast twice.
      if (hadSessionRef.current) {
        hadSessionRef.current = false
        toast('Sua sessão expirou. Por favor, faça login novamente.', 'warning')
        // Notify other tabs so they also clear their session immediately
        bcRef.current?.postMessage({ type: 'LOGOUT' })
      }
      clearSession()
    })
  }, [clearSession, toast])

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
    // Inform other tabs so they also clear their session (no toast — user initiated this)
    bcRef.current?.postMessage({ type: 'LOGOUT' })
    clearSession()
  }, [clearSession])

  const logoutAll = useCallback(async () => {
    try { await authApi.logoutAll() } catch { /* ignore */ }
    bcRef.current?.postMessage({ type: 'LOGOUT' })
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
