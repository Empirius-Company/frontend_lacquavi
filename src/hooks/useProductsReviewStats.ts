import { useEffect, useState } from 'react'
import { productsApi } from '../api/catalogApi'
import type { ApiError, ProductReviewStats } from '../types'

type ProductReviewStatsMap = Record<string, ProductReviewStats>

const EMPTY_STATS: ProductReviewStats = {
  total: 0,
  averageRating: 0,
}

export function useProductsReviewStats(productIds: string[]) {
  const [statsByProduct, setStatsByProduct] = useState<ProductReviewStatsMap>({})
  const [loading, setLoading] = useState(false)
  const normalizedIds = Array.from(new Set(productIds.filter(Boolean))).sort()
  const idsKey = normalizedIds.join('|')

  useEffect(() => {
    if (normalizedIds.length === 0) {
      setStatsByProduct({})
      return
    }

    let cancelled = false
    setLoading(true)

    Promise.allSettled(
      normalizedIds.map(async (productId) => {
        try {
          const response = await productsApi.listReviews(productId)
          return { productId, stats: response.stats }
        } catch (error) {
          const apiError = error as ApiError
          if (apiError.statusCode === 404 || apiError.statusCode === 500) {
            return { productId, stats: EMPTY_STATS }
          }
          return { productId, stats: EMPTY_STATS }
        }
      })
    )
      .then((results) => {
        if (cancelled) return
        const nextStats: ProductReviewStatsMap = {}
        for (const result of results) {
          if (result.status === 'fulfilled') {
            nextStats[result.value.productId] = result.value.stats
          }
        }
        setStatsByProduct(nextStats)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [idsKey])

  return { statsByProduct, loading }
}
