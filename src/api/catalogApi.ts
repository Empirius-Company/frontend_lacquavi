import { httpClient } from './httpClient'
import type { Category, Product } from '../types'

// ─── Categories ───────────────────────────────────────────────────────────────
interface CategoriesResponse { success: boolean; data: Category[] }
interface CategoryResponse   { success: boolean; data: Category }

export const categoriesApi = {
  list: (): Promise<CategoriesResponse> =>
    httpClient.get<CategoriesResponse>('/api/categories'),

  getById: (id: string): Promise<CategoryResponse> =>
    httpClient.get<CategoryResponse>(`/api/categories/${id}`),

  create: (data: { name: string; slug?: string }): Promise<CategoryResponse> =>
    httpClient.post<CategoryResponse>('/api/categories', data),

  update: (id: string, data: { name?: string; slug?: string }): Promise<CategoryResponse> =>
    httpClient.put<CategoryResponse>(`/api/categories/${id}`, data),

  remove: (id: string): Promise<{ success: boolean; message: string }> =>
    httpClient.delete<{ success: boolean; message: string }>(`/api/categories/${id}`),
}

// ─── Products ─────────────────────────────────────────────────────────────────
interface ProductsResponse { total: number; products: Product[] }
interface ProductResponse  { message?: string; product: Product }
type CreateProductInput = {
  name: string
  description?: string
  price: number
  stock: number
  categoryId?: string
  imageUrl?: string
  brand?: string
  volume?: string
  gender?: string
}
type UpdateProductInput = Partial<CreateProductInput>

export const productsApi = {
  list: (params?: { category?: string }): Promise<ProductsResponse> =>
    httpClient.get<ProductsResponse>('/products', { params }),

  getById: (id: string): Promise<Product> =>
    httpClient.get<Product>(`/products/${id}`),

  create: (data: CreateProductInput): Promise<ProductResponse> =>
    httpClient.post<ProductResponse>('/products', data),

  update: (id: string, data: UpdateProductInput): Promise<ProductResponse> =>
    httpClient.put<ProductResponse>(`/products/${id}`, data),

  remove: (id: string): Promise<{ message: string }> =>
    httpClient.delete<{ message: string }>(`/products/${id}`),

  uploadImage: (id: string, file: File): Promise<ProductResponse> => {
    const form = new FormData()
    form.append('image', file)
    return httpClient.upload<ProductResponse>(`/products/${id}/image`, form)
  },

  myProducts: (): Promise<ProductsResponse> =>
    httpClient.get<ProductsResponse>('/products/my/products'),
}
