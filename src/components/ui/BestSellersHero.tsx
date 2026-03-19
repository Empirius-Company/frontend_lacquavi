import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getProductPrimaryImage } from '../../utils/productImages'
import { getProductFinalPrice } from '../../utils'
import type { Product, ProductReviewStats } from '../../types'

interface BestSellersHeroProps {
    products: Product[]
    reviewStatsByProduct?: Record<string, ProductReviewStats>
}

export function BestSellersHero({ products, reviewStatsByProduct = {} }: BestSellersHeroProps) {
    const [mounted, setMounted] = useState(false)
    const [currentIndex, setCurrentIndex] = useState(0)

    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 100)
        return () => clearTimeout(t)
    }, [])

    // Auto-slide every 5 seconds
    useEffect(() => {
        if (products.length <= 1) return
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % products.length)
        }, 5000)
        return () => clearInterval(interval)
    }, [products.length])

    if (!products || products.length === 0) return null

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % products.length)
    }

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev === 0 ? products.length - 1 : prev - 1))
    }

    const activeProduct = products[currentIndex]
    const activeProductFinalPrice = getProductFinalPrice(activeProduct)
    const activeProductImage = getProductPrimaryImage(activeProduct)
    const hasImage = !!activeProductImage?.url
    const activeReviewStats = reviewStatsByProduct[activeProduct.id]
    const reviewTotal = activeReviewStats?.total ?? 0
    const averageRating = activeReviewStats?.averageRating ?? 0
    const formattedPrice = activeProductFinalPrice.toFixed(2).replace('.', ',')
    const [priceInteger, priceDecimal] = formattedPrice.split(',')
    const installmentValue = (activeProductFinalPrice / 3).toFixed(2).replace('.', ',')
    const displayedRating = averageRating.toFixed(1).replace('.', ',')

    return (
        <section
            id="selecao-premium-destaque-semana"
            aria-label="Nossos produtos mais vendidos"
            className="group relative mt-4 mb-4 mx-auto overflow-hidden rounded-2xl border border-rose-100 bg-gradient-to-r from-rose-50/80 via-white to-rose-50/70 shadow-sm"
            style={{ minHeight: 'clamp(240px, 30vw, 360px)', maxWidth: 'calc(100% - 2rem)' }}
        >
            <div className="pointer-events-none absolute right-[13%] top-1/2 h-[220px] w-[220px] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(244,114,182,0.2)_0%,rgba(244,114,182,0.1)_45%,rgba(255,255,255,0)_76%)] blur-[2px] md:h-[340px] md:w-[340px]" />

            <div className="container-page relative z-10 w-full px-4 py-6 md:px-8 md:py-7">
                <div className="grid items-center gap-4 md:grid-cols-[0.66fr_1.34fr] md:gap-2 sm:grid-cols-1">

                    <div
                        className={`max-w-sm transition-all duration-700 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
                        key={activeProduct.id}
                    >
                        <p className="mb-3 text-base font-black uppercase tracking-[0.22em] text-rose-700 md:text-xl">
                            Destaque da Semana
                        </p>

                        <h1 className="font-display text-xl font-medium leading-tight tracking-[0.01em] text-neutral-900 md:text-3xl lg:text-[2.25rem]">
                            {activeProduct.name}
                        </h1>

                        {activeProductFinalPrice > 0 && (
                            <>
                                <div className="mt-4 flex items-end gap-1 text-neutral-900">
                                    <span className="pb-1 text-sm font-medium md:text-base">R$</span>
                                    <span className="text-3xl font-semibold leading-none tracking-tight md:text-4xl">{priceInteger}</span>
                                    <span className="pb-1 text-lg font-medium leading-none md:text-xl">,{priceDecimal}</span>
                                    {activeProduct.volume && <span className="ml-2 text-[10px] font-medium uppercase tracking-wide text-neutral-500 md:text-xs">{activeProduct.volume}</span>}
                                </div>
                                <p className="mt-1 text-[11px] text-neutral-500 md:text-xs">ou 3x de R$ {installmentValue}</p>
                            </>
                        )}

                        <div className="mt-4 flex flex-wrap items-center gap-2.5">
                            <Link
                                to={`/products/${activeProduct.id}`}
                                className="inline-flex items-center justify-center rounded-full bg-rose-500 px-6 py-2.5 text-xs font-semibold tracking-[0.04em] text-white shadow-[0_10px_20px_rgba(244,63,94,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-rose-600 hover:shadow-[0_14px_26px_rgba(244,63,94,0.32)] md:px-7 md:py-3 md:text-sm"
                            >
                                Comprar agora
                            </Link>

                            {reviewTotal > 0 ? (
                                <span className="w-full text-xs font-medium text-neutral-600 md:text-sm">
                                    ★★★★★ {displayedRating} ({reviewTotal} {reviewTotal === 1 ? 'avaliação' : 'avaliações'})
                                </span>
                            ) : (
                                <span className="w-full text-xs font-medium text-neutral-500 md:text-sm">
                                    Sem avaliações ainda
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="relative flex h-[120px] items-center justify-center overflow-hidden sm:h-[180px] md:h-[250px] lg:h-[270px]">
                        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[180px] w-[180px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(251,113,133,0.34)_0%,rgba(251,113,133,0.2)_44%,rgba(255,255,255,0)_76%)] md:h-[250px] md:w-[250px]" />

                        <div
                            key={`img-${activeProduct.id}`}
                            className="relative z-10 flex items-center justify-center animate-fade-in-up w-[90px] h-[100px] sm:w-[170px] sm:h-[190px] md:w-[220px] md:h-[250px] lg:w-[240px] lg:h-[270px]"
                        >
                            {hasImage ? (
                                <img
                                    src={activeProductImage!.url}
                                    alt={activeProductImage!.alt || activeProduct.name}
                                    className="soft-edge-image relative h-full w-full object-contain drop-shadow-[0_12px_22px_rgba(41,20,33,0.22)] max-w-full"
                                    style={{ animation: 'float 6s ease-in-out infinite', maxWidth: '100%', height: 'auto' }}
                                />
                            ) : (
                                <div className="flex h-[220px] w-[160px] items-center justify-center rounded-[26px] bg-gradient-to-b from-rose-100 to-rose-300 text-center font-display text-xl font-medium text-rose-800 shadow-[0_16px_28px_rgba(41,20,33,0.2)] md:h-[290px] md:w-[200px] lg:h-[320px] lg:w-[220px]">
                                    {activeProduct.name}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Arrows (Visible on Hover in Desktop) */}
            {products.length > 1 && (
                <>
                    <button
                        onClick={handlePrev}
                        className="absolute left-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-rose-200 bg-white/90 text-[#c31f61] opacity-100 shadow-lg transition-all hover:scale-105 hover:bg-[#e6226e] hover:text-white md:left-6 md:opacity-0 md:group-hover:opacity-100"
                        aria-label="Produto Anterior"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    </button>

                    <button
                        onClick={handleNext}
                        className="absolute right-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-rose-200 bg-white/90 text-[#c31f61] opacity-100 shadow-lg transition-all hover:scale-105 hover:bg-[#e6226e] hover:text-white md:right-6 md:opacity-0 md:group-hover:opacity-100"
                        aria-label="Próximo Produto"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>

                    {/* Indicators */}
                    <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
                        {products.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentIndex(idx)}
                                className={`h-2 rounded-full transition-all ${idx === currentIndex ? 'w-6 bg-[#e6226e]' : 'w-2 bg-rose-200 hover:bg-rose-300'}`}
                                aria-label={`Ir para o produto ${idx + 1}`}
                            />
                        ))}
                    </div>
                </>
            )}

            <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
                .soft-edge-image {
                    -webkit-mask-image: radial-gradient(circle at center, rgba(0, 0, 0, 1) 70%, rgba(0, 0, 0, 0.68) 86%, rgba(0, 0, 0, 0) 100%);
                    mask-image: radial-gradient(circle at center, rgba(0, 0, 0, 1) 70%, rgba(0, 0, 0, 0.68) 86%, rgba(0, 0, 0, 0) 100%);
                }
      `}</style>
        </section>
    )
}
