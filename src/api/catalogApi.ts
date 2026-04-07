import { httpClient } from './httpClient'
import type { Category, HomeTile, HomeTileKey, Product, ProductImage, ProductReview, ProductReviewStats, Subcategory } from '../types'

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

  reorder: (order: { id: string; displayOrder: number }[]): Promise<{ success: boolean }> =>
    httpClient.patch<{ success: boolean }>('/api/categories/reorder', { order }),
}

// ─── Subcategories ───────────────────────────────────────────────────────────
interface SubcategoriesResponse { success?: boolean; data?: Subcategory[]; subcategories?: Subcategory[] }
interface SubcategoryResponse { success?: boolean; data?: Subcategory; subcategory?: Subcategory }

export const subcategoriesApi = {
  list: (params?: { categoryId?: string }): Promise<SubcategoriesResponse> =>
    httpClient.get<SubcategoriesResponse>('/api/subcategories', { params }),

  getById: (id: string): Promise<SubcategoryResponse> =>
    httpClient.get<SubcategoryResponse>(`/api/subcategories/${id}`),

  create: (data: { name: string; categoryId: string; slug?: string }): Promise<SubcategoryResponse> =>
    httpClient.post<SubcategoryResponse>('/api/subcategories', data),

  update: (id: string, data: { name?: string; categoryId?: string; slug?: string }): Promise<SubcategoryResponse> =>
    httpClient.put<SubcategoryResponse>(`/api/subcategories/${id}`, data),

  remove: (id: string): Promise<{ success?: boolean; message?: string }> =>
    httpClient.delete<{ success?: boolean; message?: string }>(`/api/subcategories/${id}`),
}

// ─── Products ─────────────────────────────────────────────────────────────────
interface ProductsResponse { total: number; products: Product[] }
interface ProductResponse  { message?: string; product: Product }
interface ProductImagesResponse { total?: number; images: ProductImage[] }
interface ProductReviewsResponse { stats: ProductReviewStats; total: number; reviews: ProductReview[] }
interface CreateProductReviewInput { rating: number; comment: string }
interface CreateProductReviewResponse { message: string; review: ProductReview }
interface CreateProductImageInput { url: string; alt?: string; isPrimary?: boolean }
interface ReorderProductImagesInput { imageIds: string[] }
type CreateProductInput = {
  name: string
  description?: string
  price: number
  discount?: number
  stock: number
  categoryId?: string | null
  subcategoryId?: string | null
  brand?: string | null
  volume?: string | null
  gender?: string | null
  isActive?: boolean
  requiresShipping?: boolean
  weightGrams?: number
}
type UpdateProductInput = Partial<CreateProductInput>
const buildLegacyUploadFormData = (file: File) => {
  const form = new FormData()
  form.append('image', file)
  return form
}

export const productsApi = {
  list: (params?: { category?: string; subcategory?: string; type?: string }): Promise<ProductsResponse> =>
    httpClient.get<ProductsResponse>('/products', { params }),

  getById: (id: string): Promise<Product> =>
    httpClient.get<Product>(`/products/${id}`),

  getImages: async (id: string): Promise<ProductImage[]> => {
    const response = await httpClient.get<ProductImage[] | ProductImagesResponse>(`/products/${id}/images`)
    if (Array.isArray(response)) return response
    return response?.images ?? []
  },

  create: (data: CreateProductInput): Promise<ProductResponse> =>
    httpClient.post<ProductResponse>('/products', data),

  update: (id: string, data: UpdateProductInput): Promise<ProductResponse> =>
    httpClient.put<ProductResponse>(`/products/${id}`, data),

  remove: (id: string): Promise<{ message: string }> =>
    httpClient.delete<{ message: string }>(`/products/${id}`),

  uploadLegacyPrimary: (id: string, file: File): Promise<ProductResponse> =>
    httpClient.upload<ProductResponse>(`/products/${id}/image`, buildLegacyUploadFormData(file)),

  addImage: (id: string, data: CreateProductImageInput): Promise<{ message?: string; image: ProductImage }> =>
    httpClient.post<{ message?: string; image: ProductImage }>(
      `/products/${id}/images`,
      data,
      { headers: { 'Content-Type': 'application/json' } }
    ),

  addImages: async (id: string, images: CreateProductImageInput[]): Promise<ProductImage[]> => {
    const createdImages: ProductImage[] = []
    for (const imageData of images) {
      const response = await productsApi.addImage(id, imageData)
      createdImages.push(response.image)
    }
    return createdImages
  },

  reorderImages: (id: string, data: ReorderProductImagesInput): Promise<{ message?: string; images: ProductImage[] }> =>
    httpClient.put<{ message?: string; images: ProductImage[] }>(`/products/${id}/images/reorder`, data),

  setPrimaryImage: (id: string, imageId: string): Promise<{ message?: string; image: ProductImage }> =>
    httpClient.put<{ message?: string; image: ProductImage }>(`/products/${id}/images/${imageId}/primary`),

  removeImage: (id: string, imageId: string): Promise<{ message?: string }> =>
    httpClient.delete<{ message?: string }>(`/products/${id}/images/${imageId}`),

  myProducts: (): Promise<ProductsResponse> =>
    httpClient.get<ProductsResponse>('/products/my/products'),

  listReviews: (id: string): Promise<ProductReviewsResponse> =>
    httpClient.get<ProductReviewsResponse>(`/products/${id}/reviews`),

  createReview: (id: string, data: CreateProductReviewInput): Promise<CreateProductReviewResponse> =>
    httpClient.post<CreateProductReviewResponse>(`/products/${id}/reviews`, data),
}

// ─── Home Tiles ───────────────────────────────────────────────────────────────
interface HomeTilesResponse { success: boolean; tiles: HomeTile[] }
interface HomeTileResponse  { success: boolean; tile: HomeTile }

export const homeTilesApi = {
  list: (): Promise<HomeTilesResponse> =>
    httpClient.get<HomeTilesResponse>('/api/home-tiles'),

  updateImage: (key: HomeTileKey, imageUrl: string): Promise<HomeTileResponse> =>
    httpClient.put<HomeTileResponse>(`/api/home-tiles/${key}`, { imageUrl }),
}
