import { useEffect, useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getProductPrimaryImage, getOptimizedCloudinaryUrl } from '../../utils/productImages'
import { formatCurrency, getInstallmentDisplay, getProductPriceSummary } from '../../utils'
import { Skeleton } from './index'
import type { Product, ProductReviewStats } from '../../types'

interface BestSellersHeroProps {
    products: Product[]
    reviewStatsByProduct?: Record<string, ProductReviewStats>
    loading?: boolean
}

const SLIDE_DURATION = 360

type AnimState = 'idle' | 'exit' | 'enter'

const BENEFITS = ['Produto Original', 'Frete rápido', 'Envio imediato']

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
    const fullStars = Math.floor(rating)
    const hasHalf = rating - fullStars >= 0.25 && rating - fullStars < 0.75
    const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0)
    return (
        <span className="inline-flex items-center gap-[1px]" aria-hidden="true">
            {Array.from({ length: fullStars }).map((_, i) => (
                <svg key={`f${i}`} width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="text-amber-400"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>
            ))}
            {hasHalf && (
                <svg key="h" width={size} height={size} viewBox="0 0 24 24" className="text-amber-400">
                    <defs><clipPath id="half"><rect x="0" y="0" width="12" height="24"/></clipPath></defs>
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" fill="currentColor" clipPath="url(#half)"/>
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
            )}
            {Array.from({ length: emptyStars }).map((_, i) => (
                <svg key={`e${i}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-amber-300"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>
            ))}
        </span>
    )
}

function BestSellersHeroSkeleton() {
    return (
        <section className="my-4 mx-2 sm:mx-4 rounded-3xl overflow-hidden border border-emerald-100/60 bg-gradient-to-br from-[#eef7f2] via-white to-[#f5f0eb]">
            <div className="px-6 py-10 md:px-14 md:py-14 max-w-6xl mx-auto">
                <div className="flex flex-col md:grid md:grid-cols-[2fr_3fr] items-center gap-8 md:gap-12">
                    <div className="order-2 md:order-1 w-full space-y-4">
                        <Skeleton className="h-6 w-40 rounded-full" />
                        <Skeleton className="h-9 w-4/5" />
                        <Skeleton className="h-5 w-28" />
                        <Skeleton className="h-14 w-2/3 mt-2" />
                        <Skeleton className="h-4 w-44" />
                        <div className="flex gap-3 pt-1">
                            {BENEFITS.map(b => <Skeleton key={b} className="h-4 w-28" />)}
                        </div>
                        <Skeleton className="h-[52px] w-44 rounded-xl mt-2" />
                    </div>
                    <div className="order-1 md:order-2 flex items-center justify-center w-full h-[290px] md:h-[380px]">
                        <Skeleton className="w-[220px] h-[260px] md:w-[290px] md:h-[340px] rounded-[28px]" />
                    </div>
                </div>
            </div>
        </section>
    )
}

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
            setTimeout(() => setAnimState('idle'), SLIDE_DURATION)
        }, SLIDE_DURATION)
    }, [])

    useEffect(() => {
        if (products.length <= 1) return
        const interval = setInterval(() => {
            const next = (displayIndexRef.current + 1) % products.length
            goTo(next, 'left')
        }, 6000)
        return () => clearInterval(interval)
    }, [products.length, goTo, autoplayKey])

    if (loading) return <BestSellersHeroSkeleton />
    if (!products || products.length === 0) return null

    const resetAutoplay = () => setAutoplayKey(k => k + 1)
    const handleNext = () => { resetAutoplay(); goTo((displayIndex + 1) % products.length, 'left') }
    const handlePrev = () => { resetAutoplay(); goTo(displayIndex === 0 ? products.length - 1 : displayIndex - 1, 'right') }

    const activeProduct = products[displayIndex]
    const priceSummary = getProductPriceSummary(activeProduct)
    const activeProductImage = getProductPrimaryImage(activeProduct)
    const hasImage = !!activeProductImage?.url
    const activeReviewStats = reviewStatsByProduct[activeProduct.id]
    const reviewTotal = activeReviewStats?.total ?? 0
    const averageRating = activeReviewStats?.averageRating ?? 0
    const installment = getInstallmentDisplay(priceSummary.finalPrice)

    const formatPriceParts = (value: number) => {
        const [integer, decimal] = value.toFixed(2).replace('.', ',').split(',')
        return { integer, decimal }
    }

    const finalParts = formatPriceParts(priceSummary.finalPrice)
    const originalParts = formatPriceParts(priceSummary.basePrice)
    const displayRating = averageRating.toFixed(1).replace('.', ',')

    const subtitle = activeProduct.brand ?? (
        activeProduct.gender
            ? activeProduct.gender.charAt(0).toUpperCase() + activeProduct.gender.slice(1)
            : null
    )

    const slideClass =
        animState === 'exit'
            ? (direction === 'left' ? 'bsh-slide-out-left' : 'bsh-slide-out-right')
            : animState === 'enter'
            ? (direction === 'left' ? 'bsh-slide-in-right' : 'bsh-slide-in-left')
            : ''

    return (
        <section
            id="selecao-premium-destaque-semana"
            aria-label="Destaque da semana"
            className="group relative my-4 mx-2 sm:mx-4 overflow-hidden rounded-3xl border border-emerald-100/60 bg-gradient-to-br from-[#eef7f2] via-[#fafafa] to-[#f5f1ed] shadow-sm"
        >
            {/* Ambient glows — desktop */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute right-[18%] top-1/2 hidden h-[420px] w-[420px] -translate-y-1/2 rounded-full md:block"
                style={{ background: 'radial-gradient(circle, rgba(42,126,81,0.09) 0%, rgba(42,126,81,0.03) 55%, transparent 80%)' }}
            />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute left-[3%] bottom-0 hidden h-[260px] w-[260px] rounded-full md:block"
                style={{ background: 'radial-gradient(circle, rgba(201,162,106,0.07) 0%, transparent 70%)' }}
            />

            <div className="relative z-10 px-5 pt-8 pb-16 md:px-14 md:py-12 lg:py-16 max-w-6xl mx-auto">
                <div
                    className={`flex flex-col md:grid md:grid-cols-[2fr_3fr] items-center gap-6 md:gap-12 lg:gap-20 ${slideClass} ${mounted ? '' : 'opacity-0 translate-y-6'}`}
                    style={{ transition: animState === 'idle' && !mounted ? 'opacity 0.7s ease, transform 0.7s ease' : undefined }}
                >

                    {/* ── Image column — top on mobile ── */}
                    <div className="order-1 md:order-2 relative flex h-[290px] sm:h-[320px] md:h-[380px] lg:h-[420px] w-full items-center justify-center">
                        {/* Decorative blurs behind the card */}
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute z-0 left-1/2 top-1/2 h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full md:h-[320px] md:w-[320px]"
                            style={{ background: 'radial-gradient(circle, rgba(42,126,81,0.13) 0%, rgba(42,126,81,0.05) 50%, transparent 80%)', filter: 'blur(10px)' }}
                        />
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute z-0 -top-6 right-4 h-28 w-28 rounded-full bg-emerald-100/50"
                            style={{ filter: 'blur(28px)' }}
                        />
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute z-0 bottom-2 -left-4 h-20 w-20 rounded-full bg-amber-100/40"
                            style={{ filter: 'blur(20px)' }}
                        />

                        {/* Premium image card */}
                        <div className="relative z-10 w-[210px] h-[255px] sm:w-[240px] sm:h-[285px] md:w-[285px] md:h-[335px] lg:w-[315px] lg:h-[370px] rounded-[26px] border border-gray-100 bg-white p-6 md:p-8 flex items-center justify-center shadow-[0_20px_56px_rgba(0,0,0,0.07),0_4px_14px_rgba(0,0,0,0.04)]">
                            {hasImage ? (
                                <img
                                    src={getOptimizedCloudinaryUrl(activeProductImage!.url, 400, 460)}
                                    alt={activeProductImage!.alt || activeProduct.name}
                                    className="h-full w-full object-contain"
                                    width="520"
                                    height="600"
                                    style={{
                                        animation: 'bshFloat 7s ease-in-out infinite',
                                        filter: 'drop-shadow(0 8px 18px rgba(0,0,0,0.10))',
                                    }}
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-b from-emerald-50 to-emerald-100 text-center font-display text-lg font-medium text-emerald-800 px-4">
                                    {activeProduct.name}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Text column — bottom on mobile ── */}
                    <div className="order-2 md:order-1 w-full flex flex-col justify-center text-center md:text-left">

                        {/* Badge */}
                        <div className="flex justify-center md:justify-start mb-4">
                            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-[0_2px_10px_rgba(42,126,81,0.28)]">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" aria-hidden="true" />
                                Destaque da Semana
                            </span>
                        </div>

                        {/* Product name */}
                        <h2 className="font-display text-[1.65rem] font-semibold leading-snug tracking-[-0.01em] text-neutral-900 md:text-3xl lg:text-[2.1rem] line-clamp-2 mb-1.5">
                            {activeProduct.name}
                        </h2>

                        {/* Subtitle */}
                        {subtitle && (
                            <p className="text-sm font-medium text-neutral-500 mb-3">{subtitle}</p>
                        )}

                        {/* Price */}
                        {priceSummary.finalPrice > 0 && (
                            <div className="mb-4">
                                {priceSummary.hasDiscount && (
                                    <div className="flex items-center gap-2 justify-center md:justify-start mb-1">
                                        <span className="text-sm text-neutral-400 line-through">
                                            R$ {originalParts.integer},{originalParts.decimal}
                                        </span>
                                        <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-black tracking-wide text-white">
                                            -{priceSummary.discountPercent}%
                                        </span>
                                    </div>
                                )}

                                <div className="flex items-end gap-1 justify-center md:justify-start leading-none">
                                    <span className="mb-1.5 text-base font-semibold text-neutral-600">R$</span>
                                    <span className="text-[3.25rem] md:text-[3.5rem] font-bold leading-none tracking-tight text-neutral-900">
                                        {finalParts.integer}
                                    </span>
                                    <span className="mb-1.5 text-xl font-semibold text-neutral-600">,{finalParts.decimal}</span>
                                </div>

                                <div className="mt-2 flex flex-wrap items-center gap-2 justify-center md:justify-start">
                                    {activeProduct.volume && (
                                        <span className="rounded-full border border-neutral-200 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                                            {activeProduct.volume}
                                        </span>
                                    )}
                                    {installment && (
                                        <span className="text-xs text-neutral-500">
                                            ou {installment.count}x de {formatCurrency(installment.amountPerInstallment)} sem juros
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Benefits */}
                        <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1.5 justify-center md:justify-start">
                            {BENEFITS.map(b => (
                                <span key={b} className="flex items-center gap-1 text-xs font-semibold text-emerald-700">
                                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                                        <circle cx="6" cy="6" r="5.5" fill="#2a7e51" fillOpacity="0.12"/>
                                        <path d="M3.5 6l1.8 1.8L8.5 4.5" stroke="#2a7e51" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    {b}
                                </span>
                            ))}
                        </div>

                        {/* Reviews */}
                        <div className="mb-5 flex items-center gap-2 justify-center md:justify-start">
                            {reviewTotal > 0 ? (
                                <>
                                    <StarRating rating={averageRating} size={15} />
                                    <span className="text-sm font-bold text-neutral-800">{displayRating}</span>
                                    <span className="text-neutral-300 text-sm">·</span>
                                    <span className="text-xs text-neutral-500">
                                        {reviewTotal} {reviewTotal === 1 ? 'avaliação' : 'avaliações'}
                                    </span>
                                </>
                            ) : (
                                <span className="text-xs text-neutral-400">Seja o primeiro a avaliar</span>
                            )}
                        </div>

                        {/* CTA */}
                        <div className="flex justify-center md:justify-start">
                            <Link
                                to={`/products/${activeProduct.id}`}
                                className="inline-flex h-[52px] items-center justify-center gap-2.5 rounded-xl bg-emerald-700 px-8 text-sm font-semibold tracking-[0.03em] text-white shadow-[0_8px_24px_rgba(42,126,81,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-800 hover:shadow-[0_12px_32px_rgba(42,126,81,0.38)] active:scale-[0.97]"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                                </svg>
                                Comprar agora
                            </Link>
                        </div>

                    </div>
                </div>
            </div>

            {/* Navigation arrows */}
            {products.length > 1 && (
                <>
                    <button
                        onClick={handlePrev}
                        aria-label="Produto anterior"
                        className="absolute left-3 top-[44%] z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-100 bg-white/95 text-neutral-400 shadow-[0_4px_16px_rgba(0,0,0,0.09)] transition-all duration-300 hover:border-emerald-600 hover:bg-emerald-700 hover:text-white hover:shadow-[0_6px_20px_rgba(42,126,81,0.28)] md:left-5 md:top-1/2 md:h-11 md:w-11 md:opacity-0 md:group-hover:opacity-100"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
                    </button>

                    <button
                        onClick={handleNext}
                        aria-label="Próximo produto"
                        className="absolute right-3 top-[44%] z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-100 bg-white/95 text-neutral-400 shadow-[0_4px_16px_rgba(0,0,0,0.09)] transition-all duration-300 hover:border-emerald-600 hover:bg-emerald-700 hover:text-white hover:shadow-[0_6px_20px_rgba(42,126,81,0.28)] md:right-5 md:top-1/2 md:h-11 md:w-11 md:opacity-0 md:group-hover:opacity-100"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>

                    {/* Pill indicators */}
                    <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5">
                        {products.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => { resetAutoplay(); goTo(idx, idx > displayIndex ? 'left' : 'right') }}
                                aria-label={`Ir para o produto ${idx + 1}`}
                                className="flex items-center justify-center p-1.5"
                            >
                                <span
                                    className={`block rounded-full transition-all duration-300 ${
                                        idx === displayIndex
                                            ? 'bg-emerald-700 w-5 h-2'
                                            : 'bg-emerald-200 hover:bg-emerald-300 w-2 h-2'
                                    }`}
                                />
                            </button>
                        ))}
                    </div>
                </>
            )}

            <style>{`
                @keyframes bshFloat {
                    0%, 100% { transform: translateY(0px); }
                    50%       { transform: translateY(-10px); }
                }
                @keyframes bshOutLeft  { from { opacity:1; transform:translateX(0);    } to { opacity:0; transform:translateX(-56px); } }
                @keyframes bshOutRight { from { opacity:1; transform:translateX(0);    } to { opacity:0; transform:translateX(56px);  } }
                @keyframes bshInRight  { from { opacity:0; transform:translateX(56px); } to { opacity:1; transform:translateX(0);     } }
                @keyframes bshInLeft   { from { opacity:0; transform:translateX(-56px);} to { opacity:1; transform:translateX(0);     } }
                .bsh-slide-out-left  { animation: bshOutLeft  ${SLIDE_DURATION}ms cubic-bezier(0.4,0,0.6,1) forwards; }
                .bsh-slide-out-right { animation: bshOutRight ${SLIDE_DURATION}ms cubic-bezier(0.4,0,0.6,1) forwards; }
                .bsh-slide-in-right  { animation: bshInRight  ${SLIDE_DURATION}ms cubic-bezier(0.16,1,0.3,1) forwards; }
                .bsh-slide-in-left   { animation: bshInLeft   ${SLIDE_DURATION}ms cubic-bezier(0.16,1,0.3,1) forwards; }
            `}</style>
        </section>
    )
}
