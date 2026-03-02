import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getProductPrimaryImage } from '../../utils/productImages'
import type { Product } from '../../types'

interface HitHeroProps {
  hitProduct: Product | null
}

export function HitHero({ hitProduct }: HitHeroProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { const t = setTimeout(() => setMounted(true), 100); return () => clearTimeout(t) }, [])

  const hitProductImage = getProductPrimaryImage(hitProduct)
  const hasImage = !!hitProductImage?.url

  return (
    <section
      aria-label="Hit — Perfume em Destaque"
      className="bg-gradient-to-r from-gray-50 to-white relative overflow-hidden flex items-center pt-8 pb-12 md:pt-12 md:pb-20"
      style={{ minHeight: 'clamp(400px, 45vw, 500px)' }}
    >
      <div className="container-page relative z-10 w-full">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12">

          {/* LEFT: Copy */}
          <div className="flex-1 max-w-xl">
            <div
              className={`transition-all duration-700 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
            >

              <h1 className="text-5xl md:text-7xl font-black text-[#000000] leading-tight mb-4 font-display">
                Sinta o poder do <span className="text-[#15803D] italic">Hit</span>.
              </h1>

              <p className="text-lg md:text-xl text-gray-600 mb-8 font-medium leading-relaxed">
                A fragrância icônica que acompanha o seu ritmo. Frescor floral perfeito para todas as ocasiões.
              </p>

              <div className="flex gap-4">
                <Link
                  to={hitProduct ? `/products/${hitProduct.id}` : '/products'}
                  className="bg-[#e6226e] text-white px-8 py-4 rounded-md font-bold text-lg hover:bg-[#cc1d60] transition-colors shadow-lg hover:shadow-xl"
                >
                  Comprar Agora
                </Link>
              </div>

              {hitProduct && hitProduct.price > 0 && (
                <div className="mt-8 flex items-center gap-4 text-sm font-bold text-gray-400">
                  <span className="text-[#333] text-xl">R$ {hitProduct.price.toFixed(2).replace('.', ',')}</span>
                  {hitProduct.volume && <span>| {hitProduct.volume}</span>}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Image */}
          <div className="flex-1 flex justify-center w-full relative">
            <div
              className={`transition-all duration-1000 delay-300 transform ${mounted ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-12 opacity-0 scale-95'}`}
            >
              {/* Decorative Circle Background */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[450px] md:h-[450px] bg-white rounded-full shadow-2xl mix-blend-multiply opacity-50 z-0 border-4 border-gray-100"></div>

              {hasImage ? (
                <img
                  src={hitProductImage!.url}
                  alt={hitProductImage!.alt || 'Perfume Hit'}
                  className="relative z-10 w-full max-w-[280px] md:max-w-[340px] drop-shadow-2xl"
                  style={{ animation: 'float 6s ease-in-out infinite' }}
                />
              ) : (
                <div className="relative z-10 w-[240px] h-[360px] bg-white border border-gray-100 shadow-xl rounded-lg flex items-center justify-center text-green-500 font-bold text-5xl italic drop-shadow-md">
                  Hit
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
      `}</style>
    </section>
  )
}
