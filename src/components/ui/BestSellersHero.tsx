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
            aria-label="Nossos produtos mais vendidos"
            className="group relative mt-4 mb-4 mx-auto overflow-hidden rounded-2xl border border-rose-100 bg-gradient-to-r from-rose-50/80 via-white to-rose-50/70 shadow-sm"
            style={{ minHeight: 'clamp(280px, 34vw, 410px)', maxWidth: 'calc(100% - 2rem)' }}
        >
            <div className="pointer-events-none absolute right-[13%] top-1/2 h-[220px] w-[220px] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(244,114,182,0.2)_0%,rgba(244,114,182,0.1)_45%,rgba(255,255,255,0)_76%)] blur-[2px] md:h-[340px] md:w-[340px]" />

            <div className="container-page relative z-10 w-full px-5 py-7 md:px-10 md:py-9">
                <div className="grid items-center gap-6 md:grid-cols-[0.62fr_1.38fr] md:gap-3">

                    <div
                        className={`max-w-sm transition-all duration-700 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
                        key={activeProduct.id}
                    >
                        <span className="mb-2 inline-flex rounded-full border border-rose-200 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-rose-500 md:text-[11px]">
                            Seleção Premium
                        </span>

                        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.26em] text-rose-600 md:text-base">
                            Destaque da Semana
                        </p>

                        <h1 className="font-display text-3xl font-semibold leading-tight tracking-[0.01em] text-neutral-900 md:text-5xl">
                            {activeProduct.name}
                        </h1>

                        <p className="mt-3 max-w-sm text-sm leading-relaxed text-rose-900/70 md:text-base">
                            Um toque de luxo que transforma presença em assinatura.
                        </p>

                        {activeProductFinalPrice > 0 && (
                            <>
                                <div className="mt-5 flex items-end gap-1.5 text-neutral-900">
                                    <span className="pb-1 text-base font-medium md:text-lg">R$</span>
                                    <span className="text-4xl font-semibold leading-none tracking-tight md:text-5xl">{priceInteger}</span>
                                    <span className="pb-1 text-xl font-medium leading-none md:text-2xl">,{priceDecimal}</span>
                                    {activeProduct.volume && <span className="ml-3 text-xs font-medium uppercase tracking-wide text-neutral-500 md:text-sm">{activeProduct.volume}</span>}
                                </div>
                                <p className="mt-1 text-xs text-neutral-500 md:text-sm">ou 3x de R$ {installmentValue}</p>
                            </>
                        )}

                        <div className="mt-5 flex flex-wrap items-center gap-3">
                            <Link
                                to={`/products/${activeProduct.id}`}
                                className="inline-flex items-center justify-center rounded-full bg-rose-500 px-8 py-3 text-sm font-semibold tracking-[0.04em] text-white shadow-[0_14px_28px_rgba(244,63,94,0.32)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-rose-600 hover:shadow-[0_18px_34px_rgba(244,63,94,0.36)] md:text-base"
                            >
                                Comprar agora
                            </Link>

                            {reviewTotal > 0 ? (
                                <span className="w-full text-sm font-medium text-neutral-600 md:text-[15px]">
                                    ★★★★★ {displayedRating} ({reviewTotal} {reviewTotal === 1 ? 'avaliação' : 'avaliações'})
                                </span>
                            ) : (
                                <span className="w-full text-sm font-medium text-neutral-500 md:text-[15px]">
                                    Sem avaliações ainda
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="relative flex h-[270px] items-center justify-center md:h-[380px]">
                        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[210px] w-[210px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(251,113,133,0.34)_0%,rgba(251,113,133,0.2)_44%,rgba(255,255,255,0)_76%)] md:h-[320px] md:w-[320px]" />

                        <div
                            key={`img-${activeProduct.id}`}
                            className="relative z-10 flex items-center justify-center animate-fade-in-up"
                        >
                            {hasImage ? (
                                <img
                                    src={activeProductImage!.url}
                                    alt={activeProductImage!.alt || activeProduct.name}
                                    className="soft-edge-image relative h-[132%] w-auto max-w-none object-contain drop-shadow-[0_26px_40px_rgba(41,20,33,0.28)] md:h-[150%] lg:h-[160%]"
                                    style={{ animation: 'float 6s ease-in-out infinite' }}
                                />
                            ) : (
                                <div className="flex h-[290px] w-[200px] items-center justify-center rounded-[34px] bg-gradient-to-b from-rose-100 to-rose-300 text-center font-display text-2xl font-medium text-rose-800 shadow-[0_24px_40px_rgba(41,20,33,0.2)] md:h-[360px] md:w-[240px] lg:h-[410px] lg:w-[260px]">
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
          50% { transform: translateY(-15px); }
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
