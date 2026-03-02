import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { productsApi, categoriesApi } from '../api/catalogApi'
import { ProductCard } from '../components/product/ProductCard'
import { ProductCardSkeleton, Button } from '../components/ui'
import { ScrollReveal } from '../components/ui/ScrollReveal'
import { useProductsReviewStats } from '../hooks/useProductsReviewStats'
import type { Product, Category } from '../types'

const GENDER_OPTIONS = [
  { value: '',          label: 'Todos' },
  { value: 'feminino',  label: 'Feminino' },
  { value: 'masculino', label: 'Masculino' },
  { value: 'unissex',   label: 'Unissex' },
]
const SORT_OPTIONS = [
  { value: 'default',       label: 'Em Destaque' },
  { value: 'price-asc',     label: 'Menor Preço' },
  { value: 'price-desc',    label: 'Maior Preço' },
  { value: 'name-asc',      label: 'A → Z' },
]

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`
        px-4 py-2 rounded-full text-xs font-medium tracking-wide transition-all duration-200
        ${active
          ? 'bg-noir-950 text-pearl border border-noir-950 shadow-sm'
          : 'bg-pearl text-nude-600 border border-nude-200 hover:border-nude-400'
        }
      `}
    >
      {label}
    </button>
  )
}

export function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products,   setProducts]   = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading,    setLoading]    = useState(true)

  const selectedCat    = searchParams.get('category') ?? ''
  const selectedType   = searchParams.get('type')     ?? ''
  const selectedGender = searchParams.get('gender')   ?? ''
  const searchQuery    = searchParams.get('q')        ?? ''
  const sort           = searchParams.get('sort')     ?? 'default'

  const setParam = (k: string, v: string) => {
    const p = new URLSearchParams(searchParams)
    v ? p.set(k, v) : p.delete(k)
    setSearchParams(p)
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([
      productsApi.list({
        ...(selectedCat ? { category: selectedCat } : {}),
        ...(selectedType ? { type: selectedType } : {}),
      }),
      categoriesApi.list(),
    ])
      .then(([pd, cd]) => { setProducts(pd.products); setCategories(cd.data) })
      .finally(() => setLoading(false))
  }, [selectedCat, selectedType])

  /* Client-side filter + sort */
  const visible = useMemo(() => {
    let list = [...products]
    if (selectedGender) list = list.filter(p => p.gender?.toLowerCase() === selectedGender)
    if (searchQuery)    list = list.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    switch (sort) {
      case 'price-asc':  list.sort((a, b) => a.price - b.price);             break
      case 'price-desc': list.sort((a, b) => b.price - a.price);             break
      case 'name-asc':   list.sort((a, b) => a.name.localeCompare(b.name));  break
    }
    return list
  }, [products, selectedGender, searchQuery, sort])

  const totalActive = [selectedCat, selectedType, selectedGender, searchQuery].filter(Boolean).length
  const { statsByProduct } = useProductsReviewStats(visible.map((product) => product.id))

  return (
    <div className="min-h-screen bg-parchment pt-20">

      {/* ── Page header ─────────────────────────────── */}
      <div className="bg-noir-950 pt-16 pb-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 50% 70% at 50% 120%, rgba(212,175,122,0.07) 0%, transparent 70%)' }} />
        <div className="container-page relative">
          {/* Breadcrumb */}
          <p className="text-2xs text-nude-600 mb-4 uppercase tracking-ultra">
            Início / <span className="text-nude-400">Coleção</span>
          </p>
          <h1 className="font-display text-4xl md:text-5xl text-pearl font-light">
            {selectedGender
              ? `Fragrâncias ${selectedGender.charAt(0).toUpperCase() + selectedGender.slice(1)}s`
              : searchQuery
              ? `"${searchQuery}"`
              : 'Toda a Coleção'
            }
          </h1>
          <p className="mt-3 text-nude-500 text-sm">
            {loading ? '...' : `${visible.length} fragrâncias encontradas`}
          </p>
        </div>
      </div>

      <div className="container-page py-10">

        {/* ── Filters row ─────────────────────────── */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">

          {/* Gender chips */}
          <div className="flex items-center gap-2 flex-wrap">
            {GENDER_OPTIONS.map(o => (
              <FilterChip
                key={o.value}
                label={o.label}
                active={selectedGender === o.value}
                onClick={() => setParam('gender', o.value)}
              />
            ))}
          </div>

          {/* Category dropdown */}
          {categories.length > 0 && (
            <div className="md:ml-auto flex items-center gap-3">
              <select
                value={selectedCat}
                onChange={e => setParam('category', e.target.value)}
                className="input-luxury text-sm py-2.5 pr-8 !rounded-full cursor-pointer min-w-[160px]"
              >
                <option value="">Todas Categorias</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>

              <select
                value={sort}
                onChange={e => setParam('sort', e.target.value)}
                className="input-luxury text-sm py-2.5 pr-8 !rounded-full cursor-pointer min-w-[140px]"
              >
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Active filters chips */}
        {totalActive > 0 && (
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            <span className="text-2xs text-nude-500 uppercase tracking-wide">Filtros ativos:</span>
            {selectedGender && (
              <button onClick={() => setParam('gender', '')} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-noir-950 text-pearl text-2xs">
                {selectedGender} <span className="opacity-60">✕</span>
              </button>
            )}
            {selectedCat && (
              <button onClick={() => setParam('category', '')} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-noir-950 text-pearl text-2xs">
                {categories.find(c => c.id === selectedCat)?.name ?? 'Categoria'} <span className="opacity-60">✕</span>
              </button>
            )}
            {selectedType && (
              <button onClick={() => setParam('type', '')} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-noir-950 text-pearl text-2xs">
                {selectedType} <span className="opacity-60">✕</span>
              </button>
            )}
            {searchQuery && (
              <button onClick={() => setParam('q', '')} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-noir-950 text-pearl text-2xs">
                "{searchQuery}" <span className="opacity-60">✕</span>
              </button>
            )}
            <button onClick={() => setSearchParams({})} className="text-2xs text-rouge-700 hover:text-rouge-800 underline ml-1">
              Limpar tudo
            </button>
          </div>
        )}

        {/* ── Product grid ────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-5">
            <div className="w-20 h-20 rounded-full bg-nude-100 flex items-center justify-center text-3xl">◇</div>
            <div>
              <h3 className="font-display text-2xl text-noir-950">Nenhuma fragrância encontrada</h3>
              <p className="text-sm text-nude-500 mt-2">Tente outros filtros ou explore toda a coleção</p>
            </div>
            <Button onClick={() => setSearchParams({})}>Ver todas</Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {visible.map((p, i) => (
              <ScrollReveal key={p.id} delay={Math.min(i * 40, 320)}>
                <ProductCard product={p} reviewStats={statsByProduct[p.id]} />
              </ScrollReveal>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
