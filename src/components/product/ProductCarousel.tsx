import { useRef } from 'react'
import { ProductCard } from './ProductCard'
import { ProductCardSkeleton } from '../ui'
import type { Product } from '../../types'

export function ProductCarousel({ products, loading, count = 12 }: { products: Product[]; loading: boolean; count?: number }) {
    const scrollRef = useRef<HTMLDivElement>(null)

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = Math.max(300, scrollRef.current.clientWidth * 0.7)
            scrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' })
        }
    }

    if (loading) {
        return (
            <div className="flex gap-4 overflow-x-hidden pb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="min-w-[190px] md:min-w-[210px] lg:min-w-[220px] flex-shrink-0">
                        <ProductCardSkeleton />
                    </div>
                ))}
            </div>
        )
    }

    if (!products || !products.length) {
        return <div className="text-center py-12"><p className="text-gray-500 font-medium">Nenhum produto encontrado</p></div>
    }

    return (
        <div className="relative group">
            {/* Container (esconde a barra nativa mas mantem o scroll) */}
            <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

            <div
                ref={scrollRef}
                className="flex gap-4 md:gap-6 lg:gap-8 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-6 pt-2 px-1 -mx-1"
            >
                {products.slice(0, count).map((p, i) => (
                    <div key={p.id || i} className="snap-start w-[171px] md:w-[205px] lg:w-[231px] flex-shrink-0">
                        <ProductCard product={p} />
                    </div>
                ))}
            </div>

            {/* Setas (só aparecem no hover em telas P pra cima) */}
            <button
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 -ml-3 md:-ml-5 w-10 h-10 md:w-12 md:h-12 bg-white rounded-full shadow-xl border border-gray-100 flex items-center justify-center text-[#e6226e] opacity-0 md:group-hover:opacity-100 transition-opacity z-10 disabled:opacity-0 hover:bg-[#e6226e] hover:text-white"
                aria-label="Anterior"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>

            <button
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 -mr-3 md:-mr-5 w-10 h-10 md:w-12 md:h-12 bg-white rounded-full shadow-xl border border-gray-100 flex items-center justify-center text-[#e6226e] opacity-0 md:group-hover:opacity-100 transition-opacity z-10 hover:bg-[#e6226e] hover:text-white"
                aria-label="Próximo"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
        </div>
    )
}
