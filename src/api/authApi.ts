import { httpClient } from './httpClient'
import type { User } from '../types'

interface LoginInput  { email: string; password: string }

// ← phone agora incluído, conforme POST /auth/register da collection
interface RegisterInput { name: string; email: string; password: string; phone?: string }

interface AuthResponse { message: string; user: User; token: string; accessToken: string; refreshToken: string }
interface RefreshResponse { message: string; token: string; accessToken: string; refreshToken: string }

// ← phone incluído, conforme PUT /auth/profile da collection
interface ProfileUpdateInput { name?: string; email?: string; phone?: string }

export const authApi = {
  register: (data: RegisterInput): Promise<AuthResponse> =>
    httpClient.post<AuthResponse>('/auth/register', data),

  login: (data: LoginInput): Promise<AuthResponse> =>
    httpClient.post<AuthResponse>('/auth/login', data),

  refresh: (refreshToken: string): Promise<RefreshResponse> =>
    httpClient.post<RefreshResponse>('/auth/refresh', { refreshToken }),

  logout: (opts?: { accessToken?: string; refreshToken?: string }): Promise<{ message: string }> =>
    httpClient.post<{ message: string }>('/auth/logout', { refreshToken: opts?.refreshToken }),

  logoutAll: (): Promise<{ message: string }> =>
    httpClient.post<{ message: string }>('/auth/logout-all'),

  getProfile: (): Promise<{ user: User }> =>
    httpClient.get<{ user: User }>('/auth/profile'),

  // ← phone incluído no PUT /auth/profile
  updateProfile: (data: ProfileUpdateInput): Promise<{ message: string; user: User }> =>
    httpClient.put<{ message: string; user: User }>('/auth/profile', data),
}
