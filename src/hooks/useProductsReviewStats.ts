import { useEffect, useState, startTransition } from 'react'
import { productsApi } from '../api/catalogApi'
import type { ProductReviewStats } from '../types'

type ProductReviewStatsMap = Record<string, ProductReviewStats>

const EMPTY_STATS: ProductReviewStats = { total: 0, averageRating: 0 }

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

    productsApi
      .listReviewsBatch(normalizedIds)
      .then((response) => {
        if (cancelled) return
        const nextStats: ProductReviewStatsMap = {}
        for (const id of normalizedIds) {
          nextStats[id] = response.stats[id] ?? EMPTY_STATS
        }
        startTransition(() => setStatsByProduct(nextStats))
      })
      .catch(() => {
        if (cancelled) return
        const fallback: ProductReviewStatsMap = {}
        for (const id of normalizedIds) fallback[id] = EMPTY_STATS
        startTransition(() => setStatsByProduct(fallback))
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
