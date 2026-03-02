import type { Product, ProductImage } from '../types'

export const getPrimaryImage = (images: ProductImage[] | null | undefined): ProductImage | null => {
  if (!images?.length) return null
  return images.find((image) => image.isPrimary) ?? images[0] ?? null
}

export const getOrderedGallery = (images: ProductImage[] | null | undefined): ProductImage[] => {
  if (!images?.length) return []
  return [...images].sort((a, b) => a.position - b.position)
}

export const getProductPrimaryImage = (product: Product | null | undefined): ProductImage | null =>
  getPrimaryImage(product?.images)

export const getProductPrimaryImageUrl = (product: Product | null | undefined): string | null =>
  getProductPrimaryImage(product)?.url ?? null