import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios'
import type { ApiError } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

// Token accessor — will be overridden by AuthContext once mounted
let _getAccessToken: () => string | null = () => null
let _onUnauthorized: () => void = () => {}

export const setTokenAccessor = (fn: () => string | null) => {
  _getAccessToken = fn
}

export const setUnauthorizedHandler = (fn: () => void) => {
  _onUnauthorized = fn
}

// ─── Axios instance ───────────────────────────────────────────────────────────
const instance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor – inject Authorization
instance.interceptors.request.use((config) => {
  const token = _getAccessToken()
  if (token && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

// Response interceptor – normalise errors
instance.interceptors.response.use(
  (res) => res,
  (err: AxiosError<{ error?: string; message?: string; code?: string; retryAfter?: number }>) => {
    if (err.response?.status === 401) {
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
        headers: { ...config?.headers, 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),
}

export default instance
