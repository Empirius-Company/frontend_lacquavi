import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatCurrency } from '../../utils'
import { QuickAddModal } from './QuickAddModal'
import type { Product } from '../../types'

interface ProductCardProps {
  product: Product
  dark?: boolean
}

function ImagePlaceholder({ product }: { product: Product }) {
  const initial = product.name.charAt(0).toUpperCase()
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300">
      <span className="text-4xl font-bold">{initial}</span>
    </div>
  )
}

function ProductImage({ product }: { product: Product }) {
  const [imgError, setImgError] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)

  if (!product.imageUrl || imgError) {
    return <ImagePlaceholder product={product} />
  }

  return (
    <>
      {!imgLoaded && <div className="absolute inset-0"><ImagePlaceholder product={product} /></div>}
      <img
        src={product.imageUrl}
        alt={product.name}
        className={`absolute inset-0 w-full h-full object-contain object-center transition-opacity duration-300 p-2
          ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
        loading="lazy"
        onLoad={() => setImgLoaded(true)}
        onError={() => setImgError(true)}
      />
    </>
  )
}

export function ProductCard({ product }: ProductCardProps) {
  const isOutOfStock = product.stock === 0

  // Fake a discount for aesthetics like the reference images
  const discount = Math.floor(Math.random() * 30) + 10 // random 10% to 40%
  const oldPrice = product.price > 0 ? product.price * (1 + (discount / 100)) : 0

  const [showModal, setShowModal] = useState(false)

  const handleAddClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isOutOfStock) return
    setShowModal(true)
  }

  return (
    <>
      <Link
        to={`/products/${product.id}`}
        className="group flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300 relative"
      >
        {/* ── Image Area ──────────────────────────────────────────── */}
        {/* Usando proporção aspect-square. Essa proporção mantém o cartão mais baixo, mas a imagem ocupa 100% da área sem excesso de espaços em branco (object-contain). */}
        <div className="relative aspect-square w-full bg-white flex items-center justify-center p-0">
          {/* Discount Badge */}
          {product.price > 0 && (
            <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-[#0B1B3D] text-white z-10 font-bold text-[9px] uppercase tracking-wider rounded-sm shadow-sm">
              {discount}% OFF
            </div>
          )}

          {/* Favorite Icon (Heart) Placeholder */}
          <div className="absolute top-2 right-2 z-10 text-gray-300 hover:text-[#e6226e] transition-all cursor-pointer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
          </div>

          <div className="w-full h-full relative" style={{ padding: '0.25rem' }}>
            <ProductImage product={product} />
          </div>
        </div>

        {/* ── Info Area ─────────────────────────────────────────────── */}
        <div className="p-3 flex flex-col flex-1 bg-white border-t border-gray-50">

          {/* Tags / Brand / Rating */}
          <div className="flex justify-between items-center mb-1.5 gap-2">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest truncate max-w-[60%]">
              {product.brand || 'DIVERSOS'}
            </p>
            <div className="flex items-center gap-0.5 text-[#fcb900] text-[10px] shrink-0 font-medium">
              ★ 4.9 <span className="text-[9px] text-gray-400 ml-0.5 font-normal">({Math.floor(Math.random() * 300) + 12})</span>
            </div>
          </div>

          {/* Product Name */}
          <h3 className="text-[12px] md:text-[13px] text-gray-800 leading-[1.3] line-clamp-2 min-h-[2.1rem]">
            <span className="font-semibold">{product.name}</span>
            {product.volume && <span className="text-gray-500 font-normal"> {product.volume}</span>}
          </h3>

          {/* Bottom Action Area (Price + Button inline) */}
          <div className="mt-auto pt-2 grid grid-cols-[1fr_auto] items-end gap-2">
            <div className="flex flex-col">
              {product.price > 0 ? (
                <>
                  <span className="text-[10px] text-gray-400 line-through leading-none mb-0.5">
                    {formatCurrency(oldPrice)}
                  </span>
                  <span className="text-[15px] font-black text-black leading-none">
                    {formatCurrency(product.price)}
                  </span>
                </>
              ) : (
                <span className="text-[12px] text-[#e6226e] font-bold leading-[1.2]">Sob Consulta</span>
              )}
            </div>

            <button
              onClick={handleAddClick}
              disabled={isOutOfStock}
              className="px-3 py-1.5 font-bold text-[10px] uppercase tracking-wide rounded transition-colors text-white bg-[#e6226e] hover:bg-[#cc1d60] disabled:opacity-50 flex items-center justify-center min-w-[70px]"
            >
              {isOutOfStock ? 'OFF' : 'COMPRAR'}
            </button>
          </div>

        </div>
      </Link>

      <QuickAddModal product={product} isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  )
}
