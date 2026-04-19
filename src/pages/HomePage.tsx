import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { productsApi, categoriesApi, homeTilesApi } from '../api/catalogApi'
import { bannersApi } from '../api'
import { ProductCarousel } from '../components/product/ProductCarousel'
import { Button } from '../components/ui'
import { BestSellersHero } from '../components/ui/BestSellersHero'
import { StoreTeaser } from '../components/store/StoreTeaser'
import { useProductsReviewStats } from '../hooks/useProductsReviewStats'
import { useSEO } from '../components/seo'
import { getProductPriceSummary } from '../utils'
import { getProductPrimaryImageUrl, getOptimizedCloudinaryUrl } from '../utils/productImages'
import type { Product, Category, Banner, HomeTile } from '../types'

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

function HomeTopBanner() {
  const [imageOk, setImageOk] = useState(true)

  const handleScrollToWeekHighlights = () => {
    document.getElementById('mais-vendidos-semana')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  return (
    <section className="bg-white">
      <div className="container-page pt-4 md:pt-6 pb-2 md:pb-3">
        <div className="relative w-full aspect-[1396/642] md:aspect-[3/1] overflow-hidden rounded-2xl border border-[#c8e6d4] shadow-sm">
          {imageOk ? (
            <picture>
              <source
                srcSet="/banner-home-top-mobile.webp 700w, /banner-home-top.webp 1400w"
                sizes="(max-width: 768px) 700px, 1400px"
                type="image/webp"
              />
              <img
                src="/banner-home-top.png"
                alt="Banner Lacquavi"
                className="absolute inset-0 w-full h-full object-cover object-top"
                fetchPriority="high"
                loading="eager"
                width="1396"
                height="642"
                onError={() => setImageOk(false)}
              />
            </picture>
          ) : (
            <div
              className="absolute inset-0 w-full h-full"
              style={{
                background: 'linear-gradient(145deg, #b7ddc6 0%, #8dcca7 46%, #6ab88a 100%)',
              }}
            />
          )}
          <button
            onClick={handleScrollToWeekHighlights}
            className="absolute bottom-[36px] left-[66px] md:bottom-[44px] md:left-[74px] bg-[#2a7e51] hover:bg-[#236843] active:scale-[0.97] text-white text-xs md:text-sm font-semibold px-4 py-2 md:px-5 md:py-2.5 rounded-full shadow-lg transition-all duration-200 flex items-center gap-2"
          >
            Destaques da semana
            <span className="text-base leading-none">↓</span>
          </button>
        </div>
      </div>
    </section>
  )
}

function FlashSaleBanner() {
  const DEFAULT_TITLE = 'OFERTA RELÂMPAGO'
  const DEFAULT_SUBTITLE = 'Aproveite os preços especiais por tempo limitado.'
  const DEFAULT_BG = '#1A1A1A'
  const DEFAULT_TEXT = '#FFFFFF'
  const DEFAULT_CTA = 'COMPRAR'

  const navigate = useNavigate()
  const [banner, setBanner] = useState<Banner | null>(null)
  const [now, setNow] = useState(Date.now())

  const loadBanner = useCallback(async () => {
    try {
      const response = await bannersApi.listActive({ type: 'flash_sale', limit: 1 })
      const nextBanner = response.total > 0 ? response.banners?.[0] ?? null : null
      setBanner(nextBanner)
    } catch {
      setBanner(null)
    }
  }, [])

  useEffect(() => {
    loadBanner()
    const intervalId = window.setInterval(loadBanner, 60_000)
    return () => window.clearInterval(intervalId)
  }, [loadBanner])

  useEffect(() => {
    if (!banner?.showTimer) return
    const timerId = window.setInterval(() => setNow(Date.now()), 1_000)
    return () => window.clearInterval(timerId)
  }, [banner?.showTimer])

  useEffect(() => {
    if (!banner?.endDate) return
    const endAt = new Date(banner.endDate).getTime()
    if (Number.isNaN(endAt)) return

    const msUntilEnd = endAt - Date.now()
    if (msUntilEnd <= 0) {
      setBanner(null)
      loadBanner()
      return
    }

    const timeoutId = window.setTimeout(() => {
      setBanner(null)
      loadBanner()
    }, msUntilEnd + 100)

    return () => window.clearTimeout(timeoutId)
  }, [banner?.id, banner?.endDate, loadBanner])

  const product = banner?.product ?? null
  const productImage = useMemo(() => {
    if (!product?.images?.length) return null
    return product.images.find((image) => image.isPrimary)?.url ?? product.images[0]?.url ?? null
  }, [product?.images])

  const pricing = useMemo(() => {
    if (!product) return null
    const summary = getProductPriceSummary(product)
    return {
      currentPrice: summary.finalPrice,
      showOriginal: summary.hasDiscount,
      originalPrice: summary.basePrice,
      discountPercent: summary.discountPercent,
    }
  }, [product])

  const bannerDiscountInfo = useMemo(() => {
    if (!pricing || !pricing.showOriginal) return null
    return { discountPercent: Math.max(0, pricing.discountPercent) }
  }, [pricing])

  const remainingTime = useMemo(() => {
    if (!banner?.endDate) return null
    const endAt = new Date(banner.endDate).getTime()
    if (Number.isNaN(endAt)) return null

    const diff = Math.max(0, endAt - now)
    const days = Math.floor(diff / 86_400_000)
    const hours = Math.floor((diff % 86_400_000) / 3_600_000)
    const minutes = Math.floor((diff % 3_600_000) / 60_000)
    const seconds = Math.floor((diff % 60_000) / 1_000)

    return {
      days,
      hours: String(hours).padStart(2, '0'),
      minutes: String(minutes).padStart(2, '0'),
      seconds: String(seconds).padStart(2, '0'),
      mode: days > 0 ? 'days' : 'clock',
      isOver: diff <= 0,
    }
  }, [banner?.endDate, now])

  const dynamicTitleLines = useMemo(() => {
    if (!remainingTime) return [DEFAULT_TITLE]
    if (remainingTime.isOver) return ['OFERTA ENCERRADA']
    if (remainingTime.days > 0) return ['OFERTA IMPERDÍVEL', `${remainingTime.days} DIA${remainingTime.days > 1 ? 'S' : ''} RESTANTE${remainingTime.days > 1 ? 'S' : ''}`]
    if (Number(remainingTime.hours) >= 1) return ['É HOJE', 'OFERTA 24H']
    return ['ÚLTIMOS MINUTOS', 'APROVEITE AGORA']
  }, [remainingTime])

  if (!banner || (remainingTime?.isOver ?? false)) return null

  const formatPrice = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  const destination = product ? `/products/${product.id}` : ''

  const handleCtaClick = async () => {
    if (!destination) return
    try {
      await bannersApi.registerClick(banner.id)
    } catch {
      // navegação segue mesmo com falha no tracking
    }

    if (destination.startsWith('http://') || destination.startsWith('https://')) {
      window.location.assign(destination)
      return
    }
    navigate(destination)
  }

  return (
    <div
      className="w-full relative overflow-hidden flex flex-col items-center justify-center p-8 md:p-12 mb-12"
      style={{
        backgroundColor: DEFAULT_BG,
        color: DEFAULT_TEXT,
      }}
    >
      <div className="absolute top-0 right-0 w-1/2 h-full bg-black/10 mix-blend-multiply opacity-50 transform skew-x-12 translate-x-1/4" />

      <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16 z-10 w-full max-w-5xl justify-between">
        <div className="text-center md:text-left flex flex-col items-center md:items-start gap-4">
          <div className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none drop-shadow-md">
            {dynamicTitleLines.map((line, index) => {
              const isHighlightLine = index === dynamicTitleLines.length - 1
              return (
                <span
                  key={line}
                  className={isHighlightLine ? 'text-[#2a7e51] [text-shadow:0_0_18px_rgba(42,126,81,0.35)]' : 'text-white'}
                >
                  {line}
                  {index < dynamicTitleLines.length - 1 ? <br /> : null}
                </span>
              )
            })}
          </div>
          <p className="text-sm md:text-base opacity-90 max-w-md">{DEFAULT_SUBTITLE}</p>

          {banner.showTimer && remainingTime && (
            <div className="flex gap-2 md:gap-3 p-2 md:p-3 rounded-2xl bg-black/20 border border-white/20 backdrop-blur-sm">
              {remainingTime.mode === 'days' ? (
                <>
                  <div className="rounded-xl px-2.5 md:px-3.5 py-2 min-w-[3.5rem] md:min-w-[4.25rem] flex flex-col items-center justify-center bg-white text-[#111111] shadow-[0_8px_24px_rgba(0,0,0,0.22)]">
                    <span className="leading-none text-2xl md:text-3xl font-black tabular-nums">{String(remainingTime.days).padStart(2, '0')}</span>
                    <span className="text-[9px] md:text-[10px] uppercase tracking-wide font-semibold text-[#555] mt-1">Dias</span>
                  </div>
                  <div className="rounded-xl px-2.5 md:px-3.5 py-2 min-w-[3.5rem] md:min-w-[4.25rem] flex flex-col items-center justify-center bg-white text-[#111111] shadow-[0_8px_24px_rgba(0,0,0,0.22)]">
                    <span className="leading-none text-2xl md:text-3xl font-black tabular-nums">{remainingTime.hours}</span>
                    <span className="text-[9px] md:text-[10px] uppercase tracking-wide font-semibold text-[#555] mt-1">Horas</span>
                  </div>
                  <div className="rounded-xl px-2.5 md:px-3.5 py-2 min-w-[3.5rem] md:min-w-[4.25rem] flex flex-col items-center justify-center bg-white text-[#111111] shadow-[0_8px_24px_rgba(0,0,0,0.22)]">
                    <span className="leading-none text-2xl md:text-3xl font-black tabular-nums">{remainingTime.minutes}</span>
                    <span className="text-[9px] md:text-[10px] uppercase tracking-wide font-semibold text-[#555] mt-1">Min</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-xl px-2.5 md:px-3.5 py-2 min-w-[3.5rem] md:min-w-[4.25rem] flex flex-col items-center justify-center bg-white text-[#111111] shadow-[0_8px_24px_rgba(0,0,0,0.22)]">
                    <span className="leading-none text-2xl md:text-3xl font-black tabular-nums">{remainingTime.hours}</span>
                    <span className="text-[9px] md:text-[10px] uppercase tracking-wide font-semibold text-[#555] mt-1">Horas</span>
                  </div>
                  <div className="rounded-xl px-2.5 md:px-3.5 py-2 min-w-[3.5rem] md:min-w-[4.25rem] flex flex-col items-center justify-center bg-white text-[#111111] shadow-[0_8px_24px_rgba(0,0,0,0.22)]">
                    <span className="leading-none text-2xl md:text-3xl font-black tabular-nums">{remainingTime.minutes}</span>
                    <span className="text-[9px] md:text-[10px] uppercase tracking-wide font-semibold text-[#555] mt-1">Min</span>
                  </div>
                  <div className="rounded-xl px-2.5 md:px-3.5 py-2 min-w-[3.5rem] md:min-w-[4.25rem] flex flex-col items-center justify-center bg-white text-[#111111] shadow-[0_8px_24px_rgba(0,0,0,0.22)] ring-1 ring-[#2a7e51]/25">
                    <span className="leading-none text-2xl md:text-3xl font-black tabular-nums text-[#2a7e51]">{remainingTime.seconds}</span>
                    <span className="text-[9px] md:text-[10px] uppercase tracking-wide font-semibold text-[#1a5c36] mt-1">Seg</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-2xl p-4 md:p-6 flex w-full max-w-sm mx-auto md:mx-0 gap-4 items-center relative">
          {bannerDiscountInfo ? (
            <div className="absolute -top-3 -left-3 bg-[#0B1B3D] text-white font-bold text-xs rounded-full w-12 h-12 flex items-center justify-center border-2 border-white shadow-md">
              {bannerDiscountInfo.discountPercent}%<br /><span className="text-[8px]">OFF</span>
            </div>
          ) : null}
          <div className="w-1/3 bg-gray-100 rounded-lg aspect-square flex items-center justify-center text-gray-300 font-bold text-2xl overflow-hidden">
            {productImage ? (
              <img src={productImage} alt={product?.name || 'Flash Sale'} className="w-full h-full object-cover" />
            ) : (
              'L'
            )}
          </div>
          <div className="flex-1 flex flex-col text-[#222]">
            {product?.name && <span className="text-sm font-semibold leading-tight mb-2">{product.name}</span>}
            {pricing?.showOriginal && <span className="text-xs text-gray-400 line-through">de {formatPrice(pricing.originalPrice)}</span>}
            {pricing && <span className="text-lg font-black text-[#000000]">{formatPrice(pricing.currentPrice)}</span>}
            <button
              className="bg-[#2a7e51] hover:bg-[#236843] transition-colors text-white text-xs font-bold py-2 mt-2 rounded disabled:opacity-50"
              onClick={handleCtaClick}
              disabled={!destination}
            >
              {DEFAULT_CTA} ›
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const TILE_CONFIG: { key: string; label: string; to: (catId?: string) => string }[] = [
  { key: 'perfumes',      label: 'Perfumes',      to: (id) => id ? `/products?category=${id}` : '/products' },
  { key: 'hidratantes',   label: 'Hidratantes',   to: (id) => id ? `/products?category=${id}` : '/products' },
  { key: 'mais-vendidos', label: 'Mais Vendidos', to: ()   => '/products' },
  { key: 'lancamentos',   label: 'Lançamentos',   to: ()   => '/products?sort=newest' },
]

function CategoryTiles({ categories, products, homeTiles }: { categories: Category[]; products: Product[]; homeTiles: HomeTile[] }) {
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

  const pickFallbackImage = (categoryId?: string) => {
    const match = categoryId
      ? products.find((p) => getProductPrimaryImageUrl(p) && p.categoryId === categoryId)
      : products.find((p) => getProductPrimaryImageUrl(p))
    return match ? getProductPrimaryImageUrl(match) ?? undefined : undefined
  }

  const perfumeCategory = findCategory('perfume')
  const hidratanteCategory = findCategory('hidratante')

  const categoryById: Record<string, string | undefined> = {
    'perfumes': perfumeCategory?.id,
    'hidratantes': hidratanteCategory?.id,
  }

  const tiles = TILE_CONFIG.map((cfg) => {
    const tileData = homeTiles.find((t) => t.key === cfg.key)
    const catId = categoryById[cfg.key]
    const imageUrl = tileData?.imageUrl ?? pickFallbackImage(catId)
    return {
      key: cfg.key,
      label: cfg.label,
      to: cfg.to(catId),
      imageUrl,
    }
  })

  return (
    <section className="bg-gradient-to-b from-white to-[#fff5f8] py-10 md:py-12">
      <div className="container-page">
        <h3 className="text-center font-semibold text-[#1A1A1A] text-2xl mb-6 md:mb-8">Explore nossas categorias</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 justify-items-center">
          {tiles.map((tile) => (
            <Link
              key={tile.key}
              to={tile.to}
              className="group relative rounded-2xl overflow-hidden aspect-[3/4] w-full max-w-[200px] bg-[#EAEAEA] shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)] active:scale-[0.98] block"
            >
              {tile.imageUrl ? (
                <img
                  src={getOptimizedCloudinaryUrl(tile.imageUrl, 320, 427)}
                  alt={tile.label}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  width="320"
                  height="427"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-[#999] font-bold text-4xl">
                  {tile.label.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 flex flex-col items-start">
                <span className="font-semibold text-sm md:text-base text-white drop-shadow">{tile.label}</span>
                <span className="mt-1.5 block h-[2px] w-10 rounded-full bg-[#2a7e51]" />
              </div>
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
  const [homeTiles, setHomeTiles] = useState<HomeTile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // SEO Meta Tags
  useSEO({
    title: 'Fragrâncias Premium | Lacqua Minas Shopping',
    description: 'Descubra fragrâncias premium e originais no Minas Shopping, Belo Horizonte. Perfumaria de luxo com entrega rápida e pagamento seguro.',
    image: 'https://lacquaminas.com.br/og-image-home.png',
    type: 'website',
  })

  useReveal(loading)

  // Fase 1: produtos — desbloqueia o hero e o primeiro carrossel imediatamente
  useEffect(() => {
    productsApi.list()
      .then((pRes) => setProducts(pRes.products))
      .catch(() => setError('Não foi possível carregar os produtos.'))
      .finally(() => setLoading(false))
  }, [])

  // Fase 2: categorias e tiles — carregam em paralelo, independente dos produtos
  // Falha silenciosa intencional: essas seções são secundárias e já têm fallback visual
  useEffect(() => {
    Promise.all([categoriesApi.list(), homeTilesApi.list()])
      .then(([cRes, tRes]) => {
        setCategories(cRes.data || [])
        setHomeTiles(tRes.tiles || [])
      })
      .catch(() => { /* tiles e categorias têm fallback visual — página segue funcional */ })
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

  const fixedSections = useMemo(() => {
    const perfumes   = sortedProducts.filter(p => !p.name.toLowerCase().startsWith('kit'))
    const femininos  = sortedProducts.filter(p => p.gender?.toLowerCase().startsWith('feminin'))
    const masculinos = sortedProducts.filter(p => p.gender?.toLowerCase().startsWith('masculin'))
    const kits       = sortedProducts.filter(p => p.name.toLowerCase().startsWith('kit'))

    return [
      { key: 'perfumes',   title: 'Perfumes',   linkTo: '/products',                  products: perfumes   },
      { key: 'femininos',  title: 'Femininos',  linkTo: '/products?gender=feminino',  products: femininos  },
      { key: 'masculinos', title: 'Masculinos', linkTo: '/products?gender=masculino', products: masculinos },
      { key: 'kits',       title: 'Kits',       linkTo: '/products',                  products: kits       },
    ].filter(s => s.products.length > 0)
  }, [sortedProducts])

  return (
    <div className="bg-[#F5F5F5] min-h-screen pb-16">

      {/* Banner principal logo abaixo do menu */}
      <HomeTopBanner />

      {/* Hero Section at the top */}
      <BestSellersHero products={topProducts} reviewStatsByProduct={statsByProduct} loading={loading} />

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
      <CategoryTiles categories={categories} products={sortedProducts} homeTiles={homeTiles} />

      {/* Mobile-only: produto em destaque no lugar das categorias */}
      <section className="md:hidden py-10 bg-white">
        <div className="container-page">
          <SectionHeader
            eyebrow="Tendências"
            title="Mais vendidos da semana"
            linkTo="/products"
          />
          {!error && (
            <ProductCarousel products={[...sortedProducts].reverse()} loading={loading} count={12} reviewStatsByProduct={statsByProduct} />
          )}
        </div>
      </section>

      {/* Flash sale banner */}
      <FlashSaleBanner />

      {/* Mais vendidos da semana */}
      <section id="mais-vendidos-semana" className="py-12 bg-[#F5F5F5]">
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

      {fixedSections.map((section, index) => (
        <section key={section.key} className={`py-12 ${index % 2 === 0 ? 'bg-white' : 'bg-[#F5F5F5]'}`}>
          <div className="container-page">
            <SectionHeader
              title={section.title}
              linkTo={section.linkTo}
            />
            {error ? null : (
              <ProductCarousel products={section.products} loading={loading} count={12} reviewStatsByProduct={statsByProduct} />
            )}
          </div>
        </section>
      ))}

     
      {/* Physical Store Teaser */}
      <StoreTeaser />

      {/* Trust bar simple */}
      <div className="bg-white border-y border-gray-200 py-8 mt-8">
        <div className="container-page grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <span className="text-2xl mb-1 block">💳</span>
            <h4 className="font-bold text-sm text-[#333]">Parcele em até 10x</h4>
            <p className="text-xs text-gray-500">Sem juros no cartão</p>
          </div>
          <div>
            <span className="text-2xl mb-1 block">🔐</span>
            <h4 className="font-bold text-sm text-[#333]">Compra 100% Segura</h4>
            <p className="text-xs text-gray-500">Seus dados protegidos</p>
          </div>
          <div>
            <span className="text-2xl mb-1 block">📦</span>
            <h4 className="font-bold text-sm text-[#333]">Entrega Rápida</h4>
            <p className="text-xs text-gray-500">Para todo o Brasil</p>
          </div>
          <div>
            <span className="text-2xl mb-1 block">⭐</span>
            <h4 className="font-bold text-sm text-[#333]">Produtos Originais</h4>
            <p className="text-xs text-gray-500">Com garantia</p>
          </div>
        </div>
      </div>

    </div>
  )
}

