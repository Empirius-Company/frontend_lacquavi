import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { productsApi, categoriesApi } from '../api/catalogApi'
import { ProductCarousel } from '../components/product/ProductCarousel'
import { Button } from '../components/ui'
import { BestSellersHero } from '../components/ui/BestSellersHero'
import { StoreTeaser } from '../components/store/StoreTeaser'
import { useProductsReviewStats } from '../hooks/useProductsReviewStats'
import { getProductPrimaryImageUrl } from '../utils/productImages'
import type { Product, Category } from '../types'

function useReveal(dep?: unknown) {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible')
            observer.unobserve(e.target)
          }
        }),
      { threshold: 0.08, rootMargin: '0px 0px -32px 0px' }
    )
    document.querySelectorAll('.reveal').forEach((el) => {
      if (!el.classList.contains('is-visible')) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [dep])
}

function SectionHeader({ eyebrow, title, linkTo, linkLabel }: { eyebrow?: string; title: string; linkTo?: string; linkLabel?: string }) {
  return (
    <div className="reveal flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-2 sm:mb-3">
      <div>
        {eyebrow && <p className="text-xs font-bold text-[#000000] uppercase tracking-widest mb-1">{eyebrow}</p>}
        <h2 className="text-2xl md:text-3xl font-bold text-[#000000]">{title}</h2>
      </div>
      {linkTo && (
        <Link to={linkTo} className="text-sm font-semibold text-[#000000] hover:underline flex items-center gap-1">
          {linkLabel || 'Ver todos'} <span className="text-lg leading-none">›</span>
        </Link>
      )}
    </div>
  )
}

/* ─── Hero Banner "Oferta 24H" ────────────────────────────── */
function EpicPromoBanner() {
  return (
    <div className="w-full bg-[#1A1A1A] relative overflow-hidden flex flex-col items-center justify-center p-8 md:p-12 mb-12">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-[#222222] mix-blend-multiply opacity-50 transform skew-x-12 translate-x-1/4"></div>

      <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16 z-10 w-full max-w-5xl justify-between">

        {/* Left Side: Text and Countdown */}
        <div className="text-center md:text-left text-white flex flex-col items-center md:items-start gap-4">
          <div className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none text-white drop-shadow-md">
            É HOJE
            <br />
            <span className="text-3xl md:text-5xl">OFERTA 24H</span>
          </div>

          <div className="flex gap-2 text-[#111111] font-bold">
            <div className="bg-white rounded px-2 md:px-3 py-1 text-xl md:text-3xl min-w-[3rem] md:min-w-[4rem] flex flex-col items-center justify-center shadow-lg"><span className="leading-none">14</span><span className="text-[8px] md:text-[10px] uppercase font-bold text-[#000000] mt-1">Horas</span></div>
            <div className="text-white text-2xl md:text-4xl flex items-center mb-4">:</div>
            <div className="bg-white rounded px-2 md:px-3 py-1 text-xl md:text-3xl min-w-[3rem] md:min-w-[4rem] flex flex-col items-center justify-center shadow-lg"><span className="leading-none">55</span><span className="text-[8px] md:text-[10px] uppercase font-bold text-[#000000] mt-1">Minutos</span></div>
            <div className="text-white text-2xl md:text-4xl flex items-center mb-4">:</div>
            <div className="bg-white rounded px-2 md:px-3 py-1 text-xl md:text-3xl min-w-[3rem] md:min-w-[4rem] flex flex-col items-center justify-center shadow-lg"><span className="leading-none">29</span><span className="text-[8px] md:text-[10px] uppercase font-bold text-[#000000] mt-1">Segundos</span></div>
          </div>
        </div>

        {/* Right Side: Demo Deal Card overlay */}
        <div className="bg-white rounded-xl shadow-2xl p-4 md:p-6 flex max-w-sm w-full gap-4 items-center relative transform md:rotate-2 hover:rotate-0 transition-transform">
          <div className="absolute -top-3 -left-3 bg-[#0B1B3D] text-white font-bold text-xs rounded-full w-12 h-12 flex items-center justify-center border-2 border-white shadow-md">
            41%<br /><span className="text-[8px]">OFF</span>
          </div>
          <div className="w-1/3 bg-gray-100 rounded-lg aspect-square flex items-center justify-center text-gray-300 font-bold text-2xl">
            L
          </div>
          <div className="flex-1 flex flex-col">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">LACQUAVI</span>
            <span className="text-sm font-semibold text-[#333] leading-tight mb-2">Perfume Feminino - Eau de Parfum</span>
            <span className="text-xs text-gray-400 line-through">de R$ 559,00</span>
            <span className="text-lg font-black text-[#000000]">R$ 305,97</span>
            <button className="bg-[#e6226e] hover:bg-[#cc1d60] transition-colors text-white text-xs font-bold py-2 mt-2 rounded">COMPRAR ›</button>
          </div>
        </div>

      </div>
    </div>
  )
}

function CategoryTiles({ categories, products }: { categories: Category[]; products: Product[] }) {
  const colors = ["bg-gray-50", "bg-gray-100", "bg-[#F5F5F5]", "bg-[#FAFAFA]"]

  if (!categories || categories.length === 0) return null

  const normalize = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')

  const findCategory = (...keywords: string[]) =>
    categories.find((category) => {
      const haystack = `${normalize(category.name)} ${normalize(category.slug)}`
      return keywords.every((keyword) => haystack.includes(normalize(keyword)))
    })

  const perfumeCategory = findCategory('perfume')
  const kitsCategory = findCategory('kit')
  const lotionCategory = categories.find((category) => {
    const haystack = `${normalize(category.name)} ${normalize(category.slug)}`
    return (
      haystack.includes('locao hidratante') ||
      haystack.includes('locoes hidratantes') ||
      haystack.includes('locao') ||
      haystack.includes('hidrat') ||
      haystack.includes('locion')
    )
  })

  const pickImage = (categoryId: string, keyword?: string) => {
    const normalizedKeyword = keyword ? normalize(keyword) : ''
    const directMatch = products.find((product) => {
      if (!getProductPrimaryImageUrl(product) || product.categoryId !== categoryId) return false
      if (!normalizedKeyword) return true
      return normalize(product.name).includes(normalizedKeyword)
    })
    const directMatchImage = directMatch ? getProductPrimaryImageUrl(directMatch) : null
    if (directMatchImage) return directMatchImage
    const fallbackProduct = products.find((product) => getProductPrimaryImageUrl(product) && product.categoryId === categoryId)
    return fallbackProduct ? getProductPrimaryImageUrl(fallbackProduct) ?? undefined : undefined
  }

  const tiles: Array<{ key: string; label: string; to: string; imageUrl?: string }> = []

  if (perfumeCategory) {
    tiles.push(
      {
        key: 'perfume-lacqua-di-fiori',
        label: 'Perfumes Lacqua Di Fiori',
        to: `/products?category=${perfumeCategory.id}&type=lacqua di fiori`,
        imageUrl: pickImage(perfumeCategory.id, 'lacqua di fiori'),
      },
      {
        key: 'perfume-arabes',
        label: 'Perfumes Árabes',
        to: `/products?category=${perfumeCategory.id}&type=arabe`,
        imageUrl: pickImage(perfumeCategory.id, 'arabe'),
      }
    )
  }

  if (kitsCategory) {
    tiles.push({
      key: 'kits',
      label: 'Kits',
      to: `/products?category=${kitsCategory.id}`,
      imageUrl: pickImage(kitsCategory.id),
    })
  }

  if (lotionCategory) {
    tiles.push({
      key: 'locoes-hidratantes',
      label: lotionCategory.name,
      to: `/products?category=${lotionCategory.id}`,
      imageUrl: pickImage(lotionCategory.id),
    })
  }

  if (tiles.length === 0) return null

  return (
    <section className="bg-white py-8">
      <div className="container-page">
        <h3 className="text-center font-bold text-gray-500 text-lg mb-6">Encontre o que você precisa</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {tiles.map((tile, i) => (
            <Link key={tile.key} to={tile.to} className={`rounded-xl ${colors[i % colors.length]} flex flex-col items-center justify-center p-6 aspect-square hover:shadow-md transition-shadow hover:-translate-y-1`}>
              <span className="w-16 h-16 rounded-full bg-white shadow-sm mb-3 overflow-hidden flex items-center justify-center">
                {tile.imageUrl ? (
                  <img src={tile.imageUrl} alt={tile.label} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <span className="text-[#000000] font-bold text-xl">{tile.label.charAt(0).toUpperCase()}</span>
                )}
              </span>
              <span className="font-semibold text-sm text-[#333] text-center line-clamp-2">{tile.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useReveal(loading)

  useEffect(() => {
    Promise.all([productsApi.list(), categoriesApi.list()])
      .then(([pRes, cRes]) => {
        setProducts(pRes.products)
        setCategories(cRes.data || [])
      })
      .catch(() => setError('Não foi possível carregar os produtos.'))
      .finally(() => setLoading(false))
  }, [])

  const sortedProducts = [...products].sort((a, b) => {
    const aImage = getProductPrimaryImageUrl(a)
    const bImage = getProductPrimaryImageUrl(b)
    if (aImage && !bImage) return -1
    if (!aImage && bImage) return 1
    return 0
  })

  // Find a hit product to show in the Hero Section. 
  // Top 4 best selling products logic (just grabbing some top products based on id or arbitrary logic if real best-sellers aren't strictly known from API, or we can use sortedProducts sliced to 4)
  const topProducts = sortedProducts.slice(0, 4);
  const { statsByProduct } = useProductsReviewStats(sortedProducts.map((product) => product.id))

  return (
    <div className="bg-[#F5F5F5] min-h-screen pb-16">

      {/* Hero Section at the top */}
      <BestSellersHero products={topProducts} />

      {/* Main product showcase - Tudo para o verão (White Background) */}
      <section className="py-12 bg-white">
        <div className="container-page">
          <SectionHeader
            title="Lançamentos em Destaque"
            linkTo="/products"
          />
          {error ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-sm mb-4">{error}</p>
              <Button variant="outline" onClick={() => window.location.reload()}>Tentar novamente</Button>
            </div>
          ) : (
            <ProductCarousel products={sortedProducts} loading={loading} count={12} reviewStatsByProduct={statsByProduct} />
          )}
        </div>
      </section>

      {/* Categories quick nav */}
      <CategoryTiles categories={categories} products={sortedProducts} />

      {/* Dynamic Pink Hero Promo Moved Down */}
      <EpicPromoBanner />

      {/* Mais vendidos da semana */}
      <section className="py-12 bg-[#F5F5F5]">
        <div className="container-page">
          <SectionHeader
            eyebrow="Tendências"
            title="Mais vendidos da semana"
            linkTo="/products"
          />
          {error ? null : (
            <ProductCarousel products={[...sortedProducts].reverse()} loading={loading} count={12} reviewStatsByProduct={statsByProduct} />
          )}
        </div>
      </section>

      {/* Perfumes */}
      <section className="py-12 bg-white">
        <div className="container-page">
          <SectionHeader
            title="Perfumes"
            linkTo="/products"
          />
          {error ? null : (
            <ProductCarousel products={sortedProducts.filter(p => p.name.toLowerCase().includes('perfume') || p.price > 120)} loading={loading} count={12} reviewStatsByProduct={statsByProduct} />
          )}
        </div>
      </section>

      {/* Kits */}
      <section className="py-12 bg-[#F5F5F5]">
        <div className="container-page">
          <SectionHeader
            title="Kits e Presentes"
            linkTo="/products"
          />
          {error ? null : (
            <ProductCarousel products={sortedProducts.filter(p => p.name.toLowerCase().includes('kit') || p.price < 120)} loading={loading} count={12} reviewStatsByProduct={statsByProduct} />
          )}
        </div>
      </section>

      {/* Physical Store Teaser */}
      <StoreTeaser />

      {/* Trust bar simple */}
      <div className="bg-white border-y border-gray-200 py-8 mt-8">
        <div className="container-page flex flex-wrap justify-between items-center text-center gap-6">
          <div className="flex-1 min-w-[150px]">
            <span className="text-2xl mb-1 block">💳</span>
            <h4 className="font-bold text-sm text-[#333]">Parcele em até 10x</h4>
            <p className="text-xs text-gray-500">Sem juros no cartão</p>
          </div>
          <div className="flex-1 min-w-[150px]">
            <span className="text-2xl mb-1 block">🔐</span>
            <h4 className="font-bold text-sm text-[#333]">Compra 100% Segura</h4>
            <p className="text-xs text-gray-500">Seus dados protegidos</p>
          </div>
          <div className="flex-1 min-w-[150px]">
            <span className="text-2xl mb-1 block">📦</span>
            <h4 className="font-bold text-sm text-[#333]">Entrega Rápida</h4>
            <p className="text-xs text-gray-500">Para todo o Brasil</p>
          </div>
          <div className="flex-1 min-w-[150px]">
            <span className="text-2xl mb-1 block">⭐</span>
            <h4 className="font-bold text-sm text-[#333]">Produtos Originais</h4>
            <p className="text-xs text-gray-500">Com garantia</p>
          </div>
        </div>
      </div>

    </div>
  )
}

