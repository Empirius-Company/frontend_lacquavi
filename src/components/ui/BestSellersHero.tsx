import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Product } from '../../types'

interface BestSellersHeroProps {
    products: Product[]
}

export function BestSellersHero({ products }: BestSellersHeroProps) {
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
    const hasImage = !!activeProduct?.imageUrl

    return (
        <section
            aria-label="Nossos produtos mais vendidos"
            className="bg-gradient-to-r from-gray-50 to-white relative flex items-center pt-6 pb-8 md:pt-8 md:pb-10 group mt-4 mb-4 rounded-xl mx-auto shadow-sm border border-gray-100 overflow-hidden"
            style={{ minHeight: 'clamp(240px, 30vw, 320px)', maxWidth: 'calc(100% - 2rem)' }}
        >
            <div className="container-page relative z-10 w-full px-12 md:px-24">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-16">

                    {/* LEFT: Copy */}
                    <div className="flex-1 max-w-xl">
                        <div
                            className={`transition-all duration-700 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
                            key={activeProduct.id} // Re-animate text when product changes
                        >
                            <p className="font-bold tracking-widest uppercase text-xs mb-2 text-[#e6226e]">
                                Mais Vendidos
                            </p>
                            <h1 className="text-3xl md:text-4xl font-black text-[#000000] leading-tight mb-2 font-display">
                                <span className="text-[#000000]">{activeProduct.name}</span>
                            </h1>

                            <p className="text-sm md:text-base text-gray-500 mb-6 font-medium leading-relaxed line-clamp-2">
                                {activeProduct.description || 'Descubra a fragrância perfeita para a sua pele com um dos nossos produtos mais amados pelos clientes.'}
                            </p>

                            <div className="flex gap-4">
                                <Link
                                    to={`/products/${activeProduct.id}`}
                                    className="bg-[#e6226e] text-white px-6 py-2.5 rounded-md font-bold text-sm hover:bg-[#cc1d60] transition-colors shadow-md hover:shadow-[0_4px_12px_rgba(230,34,110,0.4)] inline-block"
                                >
                                    Comprar Agora
                                </Link>
                            </div>

                            {activeProduct.price > 0 && (
                                <div className="mt-4 flex items-center gap-3 text-xs font-bold text-gray-400">
                                    <span className="text-[#333] text-xl font-black">
                                        R$ {activeProduct.price.toFixed(2).replace('.', ',')}
                                    </span>
                                    {activeProduct.volume && <span>| {activeProduct.volume}</span>}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: Image */}
                    <div className="flex-1 flex justify-center w-full relative h-[200px] md:h-[260px]">
                        {/* Decorative Circle Background */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180px] h-[180px] md:w-[240px] md:h-[240px] bg-white rounded-full shadow-lg opacity-70 z-0 border-2 border-gray-100 transition-all duration-500"></div>

                        <div
                            key={`img-${activeProduct.id}`} // Re-animate image when product changes
                            className="absolute inset-0 flex items-center justify-center animate-fade-in-up"
                        >
                            {hasImage ? (
                                <img
                                    src={activeProduct.imageUrl!}
                                    alt={activeProduct.name}
                                    className="relative z-10 w-full max-w-[120px] md:max-w-[160px] drop-shadow-[0_15px_15px_rgba(0,0,0,0.15)] object-contain h-full py-2"
                                    style={{ animation: 'float 6s ease-in-out infinite' }}
                                />
                            ) : (
                                <div className="relative z-10 w-[240px] h-[360px] bg-white border border-gray-100 shadow-xl rounded-lg flex items-center justify-center text-[#e6226e] font-bold text-4xl italic text-center p-4">
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
                        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-xl border border-gray-100 flex items-center justify-center text-[#e6226e] opacity-0 md:group-hover:opacity-100 transition-all z-20 hover:bg-[#e6226e] hover:text-white transform hover:scale-110"
                        aria-label="Produto Anterior"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    </button>

                    <button
                        onClick={handleNext}
                        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-xl border border-gray-100 flex items-center justify-center text-[#e6226e] opacity-0 md:group-hover:opacity-100 transition-all z-20 hover:bg-[#e6226e] hover:text-white transform hover:scale-110"
                        aria-label="Próximo Produto"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>

                    {/* Indicators */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                        {products.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentIndex(idx)}
                                className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? 'bg-[#e6226e] w-6' : 'bg-gray-300 hover:bg-gray-400'}`}
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
      `}</style>
        </section>
    )
}
