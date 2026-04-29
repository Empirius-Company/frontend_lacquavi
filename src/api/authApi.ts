import { httpClient } from './httpClient'
import type { User } from '../types'

interface LoginInput  { email: string; password: string }

// ← phone agora incluído, conforme POST /auth/register da collection
interface RegisterInput { fullName: string; email: string; password: string; phone?: string }

interface AuthResponse { message: string; user: User; accessToken: string; expiresIn?: number }
interface RefreshResponse { message: string; accessToken: string; expiresIn?: number }

// ← phone incluído, conforme PUT /auth/profile da collection
interface ProfileUpdateInput { fullName?: string; email?: string; phone?: string }

export const authApi = {
  register: (data: RegisterInput): Promise<AuthResponse> =>
    httpClient.post<AuthResponse>('/auth/register', data),

  login: (data: LoginInput): Promise<AuthResponse> =>
    httpClient.post<AuthResponse>('/auth/login', data),

  refresh: (): Promise<RefreshResponse> =>
    httpClient.post<RefreshResponse>('/auth/refresh', {}),

  logout: (): Promise<{ message: string }> =>
    httpClient.post<{ message: string }>('/auth/logout'),

  logoutAll: (): Promise<{ message: string }> =>
    httpClient.post<{ message: string }>('/auth/logout-all'),

  getProfile: (): Promise<{ user: User }> =>
    httpClient.get<{ user: User }>('/auth/profile'),

  // ← phone incluído no PUT /auth/profile
  updateProfile: (data: ProfileUpdateInput): Promise<{ message: string; user: User }> =>
    httpClient.put<{ message: string; user: User }>('/auth/profile', data),

  forgotPassword: (email: string): Promise<{ message: string }> =>
    httpClient.post<{ message: string }>('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string): Promise<{ message: string }> =>
    httpClient.post<{ message: string }>('/auth/reset-password', { token, password }),
}
