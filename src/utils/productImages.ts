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

export function getOptimizedCloudinaryUrl(url: string, width: number, height: number): string {
  if (!url || !url.includes('res.cloudinary.com')) return url
  const transforms = `w_${width},h_${height},c_fit,f_auto,q_auto`
  if (url.includes('/upload/f_auto,q_auto/')) {
    return url.replace('/upload/f_auto,q_auto/', `/upload/${transforms}/`)
  }
  return url.replace('/upload/', `/upload/${transforms}/`)
}