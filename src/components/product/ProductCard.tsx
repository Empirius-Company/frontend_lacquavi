import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatCurrency, getInstallmentDisplay, getProductPriceSummary } from '../../utils'
import { getProductPrimaryImage } from '../../utils/productImages'
import { QuickAddModal } from './QuickAddModal'
import type { Product, ProductReviewStats } from '../../types'

interface ProductCardProps {
  product: Product
  dark?: boolean
  reviewStats?: ProductReviewStats
}

const renderStars = (rating: number) => {
  const roundedRating = Math.max(0, Math.min(5, Math.round(rating)))
  return Array.from({ length: 5 }, (_, index) => (index < roundedRating ? '★' : '☆')).join('')
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
  const primaryImage = getProductPrimaryImage(product)

  if (!primaryImage?.url || imgError) {
    return <ImagePlaceholder product={product} />
  }

  return (
    <>
      {!imgLoaded && <div className="absolute inset-0"><ImagePlaceholder product={product} /></div>}
      <img
        src={primaryImage.url}
        alt={primaryImage.alt || product.name}
        className={`absolute inset-0 w-full h-full object-contain object-center transition-opacity duration-300 p-2
          ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
        loading="lazy"
        onLoad={() => setImgLoaded(true)}
        onError={() => setImgError(true)}
      />
    </>
  )
}

export function ProductCard({ product, reviewStats }: ProductCardProps) {
  const isOutOfStock = product.stock === 0
  const reviewsTotal = reviewStats?.total ?? 0
  const averageRating = reviewStats?.averageRating ?? 0

  const pricing = getProductPriceSummary(product)
  const installment = pricing.finalPrice > 0 ? getInstallmentDisplay(pricing.finalPrice) : null

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
          {pricing.hasDiscount && (
            <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-[#0B1B3D] text-white z-10 font-bold text-[9px] uppercase tracking-wider rounded-sm shadow-sm">
              {pricing.discountPercent}% OFF
            </div>
          )}

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
              {renderStars(averageRating)}
              <span className="text-[9px] text-gray-400 ml-0.5 font-normal">
                ({reviewsTotal})
              </span>
            </div>
          </div>

          {/* Product Name */}
          <h3 className="text-[12px] md:text-[13px] text-gray-800 leading-[1.3] line-clamp-2 min-h-[2.1rem]">
            <span className="font-semibold">{product.name}</span>
            {product.volume && <span className="text-gray-500 font-normal"> {product.volume}</span>}
          </h3>

          {/* Bottom Action Area (Price + Button stacked) */}
          <div className="mt-auto pt-2 flex flex-col gap-1.5">
            <div className="flex flex-col">
              {pricing.finalPrice > 0 ? (
                <>
                  {pricing.hasDiscount && (
                    <span className="text-[10px] text-gray-400 line-through leading-none mb-0.5">
                      {formatCurrency(pricing.basePrice)}
                    </span>
                  )}
                  <span className="text-[15px] font-black text-black leading-none">
                    {formatCurrency(pricing.finalPrice)}
                  </span>
                  {installment && (
                    <span className="text-[9px] text-gray-600 leading-none mt-0.5">
                      ou {installment.count}x de {formatCurrency(installment.amountPerInstallment)} sem juros
                    </span>
                  )}
                </>
              ) : (
                <span className="text-[12px] text-[#2a7e51] font-bold leading-[1.2]">Sob Consulta</span>
              )}
            </div>

            <button
              onClick={handleAddClick}
              disabled={isOutOfStock}
              className="w-full py-2.5 font-bold text-[10px] uppercase tracking-wide rounded transition-colors text-white bg-[#2a7e51] hover:bg-[#236843] disabled:opacity-50 flex items-center justify-center"
            >
              {isOutOfStock ? 'Esgotado' : 'COMPRAR'}
            </button>
          </div>

        </div>
      </Link>

      <QuickAddModal product={product} isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  )
}
