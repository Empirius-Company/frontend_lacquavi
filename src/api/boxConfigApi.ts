import { httpClient } from './httpClient'
import type { BoxCategoryRule, BoxType } from '../types'

interface BoxTypesResponse {
  boxTypes?: BoxType[]
  data?: BoxType[]
}

interface BoxTypeResponse {
  boxType?: BoxType
  data?: BoxType
  message?: string
}

interface BoxRulesResponse {
  boxRules?: BoxCategoryRule[]
  data?: BoxCategoryRule[]
}

interface BoxRuleResponse {
  boxRule?: BoxCategoryRule
  data?: BoxCategoryRule
  message?: string
}

export const boxTypesApi = {
  list: (): Promise<BoxTypesResponse> =>
    httpClient.get<BoxTypesResponse>('/api/box-types'),

  create: (data: Omit<BoxType, 'id' | 'createdAt' | 'updatedAt'>): Promise<BoxTypeResponse> =>
    httpClient.post<BoxTypeResponse>('/api/box-types', data),

  update: (id: string, data: Partial<Omit<BoxType, 'id' | 'createdAt' | 'updatedAt'>>): Promise<BoxTypeResponse> =>
    httpClient.put<BoxTypeResponse>(`/api/box-types/${id}`, data),

  remove: (id: string): Promise<{ message?: string }> =>
    httpClient.delete<{ message?: string }>(`/api/box-types/${id}`),
}

export const boxRulesApi = {
  list: (params?: { category?: string }): Promise<BoxRulesResponse> =>
    httpClient.get<BoxRulesResponse>('/api/box-rules', { params }),

  create: (data: Omit<BoxCategoryRule, 'id' | 'boxType' | 'createdAt' | 'updatedAt'>): Promise<BoxRuleResponse> =>
    httpClient.post<BoxRuleResponse>('/api/box-rules', data),

  update: (
    id: string,
    data: Partial<Omit<BoxCategoryRule, 'id' | 'boxType' | 'createdAt' | 'updatedAt'>>
  ): Promise<BoxRuleResponse> =>
    httpClient.put<BoxRuleResponse>(`/api/box-rules/${id}`, data),

  remove: (id: string): Promise<{ message?: string }> =>
    httpClient.delete<{ message?: string }>(`/api/box-rules/${id}`),
}
