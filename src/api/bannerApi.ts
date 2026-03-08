import { httpClient } from './httpClient'
import type { Banner, BannerStatus, BannerType } from '../types'

interface BannersResponse {
  total: number
  banners: Banner[]
}

interface BannerResponse {
  banner: Banner
  message?: string
}

const unwrapBanner = (payload: BannerResponse | Banner): Banner => {
  if ('banner' in payload && payload.banner) return payload.banner
  return payload as Banner
}

export interface BannerAdminPayload {
  title: string
  productId: string
  endDate: string
  startDate?: string
  showTimer?: boolean
  priority?: number
  type?: BannerType
  status?: BannerStatus
}

export const bannersApi = {
  listActive: (params?: { type?: BannerType; limit?: number }): Promise<BannersResponse> =>
    httpClient.get<BannersResponse>('/banners/active', { params }),

  getById: async (id: string): Promise<Banner> => {
    const response = await httpClient.get<BannerResponse | Banner>(`/banners/${id}`)
    return unwrapBanner(response)
  },

  registerClick: (id: string): Promise<{ message?: string }> =>
    httpClient.post<{ message?: string }>(`/banners/${id}/click`),

  adminList: (params?: { type?: BannerType; status?: BannerStatus }): Promise<BannersResponse> =>
    httpClient.get<BannersResponse>('/banners/admin', { params }),

  adminGetById: async (id: string): Promise<Banner> => {
    const response = await httpClient.get<BannerResponse | Banner>(`/banners/admin/${id}`)
    return unwrapBanner(response)
  },

  adminCreate: (data: BannerAdminPayload): Promise<BannerResponse> =>
    httpClient.post<BannerResponse>('/banners/admin', data),

  adminUpdate: (id: string, data: Partial<BannerAdminPayload>): Promise<BannerResponse> =>
    httpClient.put<BannerResponse>(`/banners/admin/${id}`, data),

  adminActivate: (id: string): Promise<{ message?: string; banner?: Banner }> =>
    httpClient.post<{ message?: string; banner?: Banner }>(`/banners/admin/${id}/activate`),

  adminPause: (id: string): Promise<{ message?: string; banner?: Banner }> =>
    httpClient.post<{ message?: string; banner?: Banner }>(`/banners/admin/${id}/pause`),

  adminRemove: (id: string): Promise<{ message?: string }> =>
    httpClient.delete<{ message?: string }>(`/banners/admin/${id}`),
}
