import { useEffect, useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getProductPrimaryImage, getOptimizedCloudinaryUrl } from '../../utils/productImages'
import { formatCurrency, getInstallmentDisplay, getProductFinalPrice } from '../../utils'
import { Skeleton } from './index'
import type { Product, ProductReviewStats } from '../../types'

interface BestSellersHeroProps {
    products: Product[]
    reviewStatsByProduct?: Record<string, ProductReviewStats>
    loading?: boolean
}

function BestSellersHeroSkeleton() {
  return (
    <section className="my-4 mx-2 sm:mx-4 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/60">
      <div className="px-5 py-6 md:px-10 md:py-8 max-w-5xl mx-auto">
        <div className="flex flex-col md:grid md:grid-cols-[1fr_1fr] items-center gap-6 md:gap-10">
          <div className="order-2 md:order-1 w-full space-y-3">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-5 w-28 mt-2" />
            <Skeleton className="h-10 w-36 rounded-full mt-4" />
          </div>
          <div className="order-1 md:order-2 flex items-center justify-center h-[220px] md:h-[270px] w-full">
            <Skeleton className="w-[165px] h-[190px] md:w-[225px] md:h-[255px] rounded-2xl" />
          </div>
        </div>
      </div>
    </section>
  )
}

const SLIDE_DURATION = 320

type AnimState = 'idle' | 'exit' | 'enter'

export function BestSellersHero({ products, reviewStatsByProduct = {}, loading = false }: BestSellersHeroProps) {
    const [mounted, setMounted] = useState(false)
    const [displayIndex, setDisplayIndex] = useState(0)
    const [animState, setAnimState] = useState<AnimState>('idle')
    const [direction, setDirection] = useState<'left' | 'right'>('left')
    const [autoplayKey, setAutoplayKey] = useState(0)

    const animStateRef = useRef<AnimState>('idle')
    const displayIndexRef = useRef(0)

    useEffect(() => { animStateRef.current = animState }, [animState])
    useEffect(() => { displayIndexRef.current = displayIndex }, [displayIndex])

    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 100)
        return () => clearTimeout(t)
    }, [])

    const goTo = useCallback((nextIndex: number, dir: 'left' | 'right') => {
        if (animStateRef.current !== 'idle') return
        setDirection(dir)
        setAnimState('exit')
        setTimeout(() => {
            setDisplayIndex(nextIndex)
            setAnimState('enter')
            setTimeout(() => {
                setAnimState('idle')
            }, SLIDE_DURATION)
        }, SLIDE_DURATION)
    }, [])

    useEffect(() => {
        if (products.length <= 1) return
        const interval = setInterval(() => {
            const next = (displayIndexRef.current + 1) % products.length
            goTo(next, 'left')
        }, 5000)
        return () => clearInterval(interval)
    }, [products.length, goTo, autoplayKey])

    if (loading) return <BestSellersHeroSkeleton />
    if (!products || products.length === 0) return null

    const resetAutoplay = () => setAutoplayKey(k => k + 1)

    const handleNext = () => { resetAutoplay(); goTo((displayIndex + 1) % products.length, 'left') }
    const handlePrev = () => { resetAutoplay(); goTo(displayIndex === 0 ? products.length - 1 : displayIndex - 1, 'right') }

    const activeProduct = products[displayIndex]
    const activeProductFinalPrice = getProductFinalPrice(activeProduct)
    const activeProductImage = getProductPrimaryImage(activeProduct)
    const hasImage = !!activeProductImage?.url
    const activeReviewStats = reviewStatsByProduct[activeProduct.id]
    const reviewTotal = activeReviewStats?.total ?? 0
    const averageRating = activeReviewStats?.averageRating ?? 0
    const formattedPrice = activeProductFinalPrice.toFixed(2).replace('.', ',')
    const [priceInteger, priceDecimal] = formattedPrice.split(',')
    const installment = getInstallmentDisplay(activeProductFinalPrice)
    const displayedRating = averageRating.toFixed(1).replace('.', ',')

    const slideClass =
        animState === 'exit'
            ? (direction === 'left' ? 'hero-slide-out-left' : 'hero-slide-out-right')
            : animState === 'enter'
            ? (direction === 'left' ? 'hero-slide-in-right' : 'hero-slide-in-left')
            : ''

    return (
        <section
            id="selecao-premium-destaque-semana"
            aria-label="Nossos produtos mais vendidos"
            className="group relative my-4 mx-2 sm:mx-4 overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/60 shadow-sm min-h-[440px] sm:min-h-[440px] md:min-h-[350px] lg:min-h-[380px]"
        >
            {/* Background glow — desktop only */}
            <div className="pointer-events-none absolute right-[10%] top-1/2 hidden h-[300px] w-[300px] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(42,126,81,0.12)_0%,rgba(42,126,81,0.06)_45%,rgba(255,255,255,0)_76%)] blur-[2px] md:block" />

            <div className="relative z-10 px-5 py-6 md:px-10 md:py-8 max-w-5xl mx-auto">
                <div
                    className={`flex flex-col md:grid md:grid-cols-[1fr_1fr] items-center gap-2 md:gap-10 lg:gap-16 ${slideClass} ${mounted ? '' : 'opacity-0 translate-y-8'}`}
                    style={{ transition: animState === 'idle' && !mounted ? 'opacity 0.7s, transform 0.7s' : undefined }}
                >

                    {/* ── Image — order-1 on mobile (appears first/top) ── */}
                    <div className="order-1 md:order-2 relative flex h-[260px] sm:h-[280px] md:h-[270px] lg:h-[300px] w-full items-center justify-center">
                        <div className="pointer-events-none absolute z-0 left-1/2 top-1/2 h-[200px] w-[200px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(42,126,81,0.18)_0%,rgba(42,126,81,0.08)_44%,rgba(255,255,255,0)_76%)] md:h-[250px] md:w-[250px]" />
                        <div className="relative z-10 flex items-center justify-center w-[185px] h-[230px] sm:w-[210px] sm:h-[255px] md:w-[225px] md:h-[255px] lg:w-[255px] lg:h-[290px]">
                            {hasImage ? (
                                <img
                                    src={getOptimizedCloudinaryUrl(activeProductImage!.url, 330, 380)}
                                    alt={activeProductImage!.alt || activeProduct.name}
                                    className="soft-edge-image h-full w-full object-contain drop-shadow-[0_12px_22px_rgba(0,0,0,0.18)]"
                                    width="460"
                                    height="520"
                                    style={{ animation: 'float 6s ease-in-out infinite', maxWidth: '100%' }}
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center rounded-[26px] bg-gradient-to-b from-emerald-100 to-emerald-300 text-center font-display text-lg font-medium text-emerald-800 shadow-[0_16px_28px_rgba(0,0,0,0.15)] px-3">
                                    {activeProduct.name}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Text info — order-2 on mobile (appears below image) ── */}
                    <div className="order-2 md:order-1 w-full flex flex-col justify-center min-h-[180px] md:h-[270px] lg:h-[300px] text-center md:text-left">
                        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700 md:text-xs">
                            Destaque da Semana
                        </p>

                        <h1 className="font-display text-xl font-medium leading-tight tracking-[0.01em] text-neutral-900 md:text-3xl lg:text-[2.25rem] line-clamp-2">
                            {activeProduct.name}
                        </h1>

                        {activeProductFinalPrice > 0 && (
                            <>
                                <div className="mt-3 flex items-end gap-1 text-neutral-900 justify-center md:justify-start">
                                    <span className="pb-1 text-sm font-medium">R$</span>
                                    <span className="text-3xl font-semibold leading-none tracking-tight md:text-4xl">{priceInteger}</span>
                                    <span className="pb-1 text-lg font-medium leading-none">,{priceDecimal}</span>
                                    {activeProduct.volume && (
                                        <span className="ml-2 text-[10px] font-medium uppercase tracking-wide text-neutral-500">{activeProduct.volume}</span>
                                    )}
                                </div>
                                {installment && (
                                  <p className="mt-1 text-[11px] text-neutral-600">
                                    ou {installment.count}x de {formatCurrency(installment.amountPerInstallment)} sem juros
                                  </p>
                                )}
                            </>
                        )}

                        <div className="mt-4 flex flex-wrap items-center gap-2.5 justify-center md:justify-start">
                            <Link
                                to={`/products/${activeProduct.id}`}
                                className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-6 py-2.5 text-xs font-semibold tracking-[0.04em] text-white shadow-[0_8px_18px_rgba(42,126,81,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-800"
                            >
                                Comprar agora
                            </Link>

                            {reviewTotal > 0 ? (
                                <span className="w-full text-xs font-medium text-neutral-600">
                                    ★★★★★ {displayedRating} ({reviewTotal} {reviewTotal === 1 ? 'avaliação' : 'avaliações'})
                                </span>
                            ) : (
                                <span className="w-full text-xs font-medium text-neutral-500">
                                    Sem avaliações ainda
                                </span>
                            )}
                        </div>
                    </div>

                </div>
            </div>

            {/* Navigation arrows */}
            {products.length > 1 && (
                <>
                    <button
                        onClick={handlePrev}
                        className="absolute left-2 top-[38%] z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-emerald-200 bg-white/90 text-[#215f3d] shadow-md transition-all hover:scale-105 hover:bg-[#2a7e51] hover:text-white md:left-4 md:top-1/2 md:h-11 md:w-11 md:opacity-0 md:group-hover:opacity-100"
                        aria-label="Produto Anterior"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    </button>

                    <button
                        onClick={handleNext}
                        className="absolute right-2 top-[38%] z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-emerald-200 bg-white/90 text-[#215f3d] shadow-md transition-all hover:scale-105 hover:bg-[#2a7e51] hover:text-white md:right-4 md:top-1/2 md:h-11 md:w-11 md:opacity-0 md:group-hover:opacity-100"
                        aria-label="Próximo Produto"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>

                    {/* Pagination dots */}
                    <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2">
                        {products.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => { resetAutoplay(); goTo(idx, idx > displayIndex ? 'left' : 'right') }}
                                className="flex items-center justify-center w-8 h-8 rounded-full"
                                aria-label={`Ir para o produto ${idx + 1}`}
                            >
                                <span className={`block h-1.5 w-1.5 rounded-full transition-transform duration-200 will-change-transform ${idx === displayIndex ? 'scale-[3.33] bg-[#2a7e51]' : 'scale-100 bg-emerald-200'}`} />
                            </button>
                        ))}
                    </div>
                </>
            )}

            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }
                @keyframes heroSlideOutLeft {
                    from { opacity: 1; transform: translateX(0); }
                    to   { opacity: 0; transform: translateX(-72px); }
                }
                @keyframes heroSlideOutRight {
                    from { opacity: 1; transform: translateX(0); }
                    to   { opacity: 0; transform: translateX(72px); }
                }
                @keyframes heroSlideInFromRight {
                    from { opacity: 0; transform: translateX(72px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
                @keyframes heroSlideInFromLeft {
                    from { opacity: 0; transform: translateX(-72px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
                .hero-slide-out-left  { animation: heroSlideOutLeft  ${SLIDE_DURATION}ms cubic-bezier(0.4, 0, 0.6, 1) forwards; }
                .hero-slide-out-right { animation: heroSlideOutRight ${SLIDE_DURATION}ms cubic-bezier(0.4, 0, 0.6, 1) forwards; }
                .hero-slide-in-right  { animation: heroSlideInFromRight ${SLIDE_DURATION}ms cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .hero-slide-in-left   { animation: heroSlideInFromLeft  ${SLIDE_DURATION}ms cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .soft-edge-image {
                    -webkit-mask-image: radial-gradient(ellipse 90% 96% at center, rgba(0,0,0,1) 78%, rgba(0,0,0,0.5) 92%, rgba(0,0,0,0) 100%);
                    mask-image: radial-gradient(ellipse 90% 96% at center, rgba(0,0,0,1) 78%, rgba(0,0,0,0.5) 92%, rgba(0,0,0,0) 100%);
                }
            `}</style>
        </section>
    )
}
