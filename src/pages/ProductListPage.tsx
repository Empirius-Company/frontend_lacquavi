import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { productsApi, categoriesApi, subcategoriesApi } from '../api/catalogApi'
import { ProductCard } from '../components/product/ProductCard'
import { ProductCardSkeleton, Button } from '../components/ui'
import { ScrollReveal } from '../components/ui/ScrollReveal'
import { useProductsReviewStats } from '../hooks/useProductsReviewStats'
import { getProductPriceSummary } from '../utils'
import type { Product, Category, Subcategory } from '../types'

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
          ? 'bg-[#e6226e] text-white border border-[#e6226e] shadow-sm'
          : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
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
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [loading,    setLoading]    = useState(true)

  const selectedCat    = searchParams.get('category') ?? ''
  const selectedSubcategory = searchParams.get('subcategory') ?? ''
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
        ...(selectedSubcategory ? { subcategory: selectedSubcategory } : {}),
        ...(selectedType ? { type: selectedType } : {}),
      }),
      categoriesApi.list(),
    ])
      .then(([pd, cd]) => { setProducts(pd.products); setCategories(cd.data) })
      .finally(() => setLoading(false))
  }, [selectedCat, selectedSubcategory, selectedType])

  useEffect(() => {
    if (!selectedCat) {
      setSubcategories([])
      return
    }

    subcategoriesApi
      .list({ categoryId: selectedCat })
      .then((response) => {
        setSubcategories(response.data ?? response.subcategories ?? [])
      })
      .catch(() => setSubcategories([]))
  }, [selectedCat])

  /* Client-side filter + sort */
  const visible = useMemo(() => {
    let list = [...products]
    if (selectedGender) list = list.filter(p => p.gender?.toLowerCase() === selectedGender)
    if (searchQuery)    list = list.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const getSortablePrice = (product: Product) => getProductPriceSummary(product).finalPrice

    switch (sort) {
      case 'price-asc':  list.sort((a, b) => getSortablePrice(a) - getSortablePrice(b)); break
      case 'price-desc': list.sort((a, b) => getSortablePrice(b) - getSortablePrice(a)); break
      case 'name-asc':   list.sort((a, b) => a.name.localeCompare(b.name));  break
    }
    return list
  }, [products, selectedGender, searchQuery, sort])

  const totalActive = [selectedCat, selectedSubcategory, selectedType, selectedGender, searchQuery].filter(Boolean).length
  const { statsByProduct } = useProductsReviewStats(visible.map((product) => product.id))

  return (
    <div className="min-h-screen bg-[#F5F5F5]">

      {/* ── Page header ─────────────────────────────── */}
      <div className="bg-white border-b border-gray-100">
        <div className="container-page py-8 md:py-10">
          {/* Breadcrumb */}
          <p className="text-[11px] text-gray-400 mb-3 uppercase tracking-widest">
            Início / <span className="text-[#000000] font-medium">Coleção</span>
          </p>
          <h1 className="font-display text-4xl md:text-5xl text-[#000000] font-black leading-tight">
            {selectedGender
              ? `Fragrâncias ${selectedGender.charAt(0).toUpperCase() + selectedGender.slice(1)}s`
              : searchQuery
              ? `"${searchQuery}"`
              : 'Toda a Coleção'
            }
          </h1>
          <p className="mt-2 text-gray-500 text-sm">
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
                onChange={e => {
                  setParam('category', e.target.value)
                  setParam('subcategory', '')
                }}
                className="input-luxury text-sm py-2.5 pr-8 !rounded-full cursor-pointer min-w-[160px] bg-white"
              >
                <option value="">Todas Categorias</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>

              {selectedCat && (
                <select
                  value={selectedSubcategory}
                  onChange={e => setParam('subcategory', e.target.value)}
                  className="input-luxury text-sm py-2.5 pr-8 !rounded-full cursor-pointer min-w-[180px] bg-white"
                >
                  <option value="">Todas Subcategorias</option>
                  {subcategories.map((subcategory) => (
                    <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>
                  ))}
                </select>
              )}

              <select
                value={sort}
                onChange={e => setParam('sort', e.target.value)}
                className="input-luxury text-sm py-2.5 pr-8 !rounded-full cursor-pointer min-w-[140px] bg-white"
              >
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Active filters chips */}
        {totalActive > 0 && (
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            <span className="text-2xs text-gray-500 uppercase tracking-wide">Filtros ativos:</span>
            {selectedGender && (
              <button onClick={() => setParam('gender', '')} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e6226e] text-white text-2xs">
                {selectedGender} <span className="opacity-60">✕</span>
              </button>
            )}
            {selectedCat && (
              <button onClick={() => setParam('category', '')} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e6226e] text-white text-2xs">
                {categories.find(c => c.id === selectedCat)?.name ?? 'Categoria'} <span className="opacity-60">✕</span>
              </button>
            )}
            {selectedSubcategory && (
              <button onClick={() => setParam('subcategory', '')} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e6226e] text-white text-2xs">
                {subcategories.find((subcategory) => subcategory.id === selectedSubcategory)?.name ?? 'Subcategoria'} <span className="opacity-60">✕</span>
              </button>
            )}
            {selectedType && (
              <button onClick={() => setParam('type', '')} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e6226e] text-white text-2xs">
                {selectedType} <span className="opacity-60">✕</span>
              </button>
            )}
            {searchQuery && (
              <button onClick={() => setParam('q', '')} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e6226e] text-white text-2xs">
                "{searchQuery}" <span className="opacity-60">✕</span>
              </button>
            )}
            <button onClick={() => setSearchParams({})} className="text-2xs text-[#e6226e] hover:text-[#cc1d60] underline ml-1">
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
