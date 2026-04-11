import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios'
import type { ApiError } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

// Token accessor/updater — wired by AuthContext once mounted
let _currentToken: string | null = null
let _getAccessToken: () => string | null = () => _currentToken
let _setAccessToken: (token: string, expiresIn?: number) => void = () => {}
let _onUnauthorized: () => void = () => {}
let refreshPromise: Promise<{ accessToken: string; expiresIn?: number } | null> | null = null

// Synchronous token update — bypasses React state batching
export const setCurrentToken = (token: string | null) => {
  _currentToken = token
}

export const setTokenAccessor = (fn: () => string | null) => {
  _getAccessToken = fn
}

export const setTokenUpdater = (fn: (token: string, expiresIn?: number) => void) => {
  _setAccessToken = fn
}

export const setUnauthorizedHandler = (fn: () => void) => {
  _onUnauthorized = fn
}

// ─── Axios instance ───────────────────────────────────────────────────────────
const instance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor – inject Authorization
instance.interceptors.request.use((config) => {
  const isFormDataPayload = typeof FormData !== 'undefined' && config.data instanceof FormData

  if (isFormDataPayload && config.headers) {
    delete config.headers['Content-Type']
    delete config.headers['content-type']
  }

  const token = _getAccessToken()
  if (token && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

// Response interceptor – normalise errors
instance.interceptors.response.use(
  (res) => res,
  async (err: AxiosError<{ error?: string; message?: string; code?: string; retryAfter?: number }>) => {
    const originalRequest = err.config as (AxiosRequestConfig & { _retry?: boolean; _refreshAttempts?: number }) | undefined
    const isUnauthorized = err.response?.status === 401
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/')

    if (isUnauthorized && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true
      originalRequest._refreshAttempts = (originalRequest._refreshAttempts ?? 0) + 1

      if (originalRequest._refreshAttempts <= 3) {
        try {
          if (!refreshPromise) {
            refreshPromise = axios
              .post<{ accessToken?: string; token?: string; expiresIn?: number }>(
                `${API_BASE_URL}/auth/refresh`,
                {},
                { withCredentials: true, headers: { 'Content-Type': 'application/json' } }
              )
              .then((response) => {
                const newAccessToken = response.data.accessToken || response.data.token || null
                const expiresIn = response.data.expiresIn
                if (newAccessToken) {
                  _setAccessToken(newAccessToken, expiresIn)
                }
                return newAccessToken ? { accessToken: newAccessToken, expiresIn } : null
              })
              .finally(() => {
                refreshPromise = null
              })
          }

          const refreshResult = await refreshPromise
          if (refreshResult?.accessToken) {
            originalRequest.headers = {
              ...(originalRequest.headers ?? {}),
              Authorization: `Bearer ${refreshResult.accessToken}`,
            }
            return instance.request(originalRequest)
          }
        } catch {
          // handled below by unauthorized flow
        }
      }
    }

    if (isUnauthorized) {
      _onUnauthorized()
    }

    const data = err.response?.data
    const apiError: ApiError = {
      message: data?.error ?? data?.message ?? err.message ?? 'Ocorreu um erro inesperado',
      statusCode: err.response?.status,
      code: data?.code,
      retryAfter: data?.retryAfter,
    }
    return Promise.reject(apiError)
  }
)

// ─── Typed request helpers ───────────────────────────────────────────────────
export const httpClient = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    instance.get<T>(url, config).then((r) => r.data),

  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    instance.post<T>(url, data, config).then((r) => r.data),

  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    instance.put<T>(url, data, config).then((r) => r.data),

  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    instance.patch<T>(url, data, config).then((r) => r.data),

  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    instance.delete<T>(url, config).then((r) => r.data),

  // Multipart helper (images)
  upload: <T>(url: string, formData: FormData, config?: AxiosRequestConfig) =>
    instance
      .put<T>(url, formData, {
        ...config,
        headers: { ...config?.headers },
      })
      .then((r) => r.data),
}

export default instance
