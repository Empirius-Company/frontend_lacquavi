import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { formatCurrency, getProductFinalPrice } from '../../utils'
import { useCart } from '../../context/CartContext'
import { getProductPrimaryImage } from '../../utils/productImages'
import type { Product } from '../../types'

interface QuickAddModalProps {
    product: Product
    isOpen: boolean
    onClose: () => void
}

export function QuickAddModal({ product, isOpen, onClose }: QuickAddModalProps) {
    const { addItem } = useCart()
    const [qty, setQty] = useState(1)
    const primaryImage = getProductPrimaryImage(product)
    const addButtonRef = useRef<HTMLButtonElement>(null)

    useEffect(() => {
        if (isOpen) {
            // Pequeno delay para garantir que o portal foi renderizado
            const timer = setTimeout(() => addButtonRef.current?.focus(), 50)
            return () => clearTimeout(timer)
        }
    }, [isOpen])

    useEffect(() => {
        if (!isOpen) return
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, onClose])

    if (!isOpen) return null

    const handleAdd = () => {
        addItem(product, qty)
        onClose()
    }

    const finalPrice = getProductFinalPrice(product)

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-label={`Adicionar ${product.name} à sacola`}
            onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
            {/* Sheet on mobile (slides from bottom), centered modal on sm+ */}
            <div className="bg-white w-full sm:rounded-xl sm:max-w-md shadow-2xl relative animate-slide-up overflow-hidden">
                {/* Close button */}
                <button
                    onClick={onClose}
                    aria-label="Fechar"
                    className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-black transition-colors"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>

                {/* Drag handle — mobile only */}
                <div className="flex justify-center pt-3 sm:hidden">
                    <div className="w-10 h-1 rounded-full bg-gray-200" />
                </div>

                <div className="p-4 sm:p-5">
                    <h2 className="text-sm font-bold text-center mb-4 text-[#333] pr-6">
                        De olho nesse item? Coloque na sua sacola!
                    </h2>

                    {/* Product info row */}
                    <div className="flex gap-3 items-center bg-gray-50 rounded-xl p-3">
                        {/* Image */}
                        <div className="w-16 h-20 flex-shrink-0 bg-white rounded-lg flex items-center justify-center p-1.5 border border-gray-100">
                            {primaryImage?.url ? (
                                <img src={primaryImage.url} alt={primaryImage.alt || product.name} className="w-full h-full object-contain" />
                            ) : (
                                <div className="text-gray-300 font-bold text-xl">{product.name.charAt(0)}</div>
                            )}
                        </div>

                        {/* Name + price */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#222] leading-snug line-clamp-2">
                                {product.name}
                            </p>
                            {product.volume && (
                                <p className="text-xs text-gray-400 mt-0.5">{product.volume}</p>
                            )}
                            <p className="text-lg font-black text-[#111] mt-1">
                                {formatCurrency(finalPrice)}
                            </p>
                        </div>
                    </div>

                    {/* Quantity row */}
                    <div className="flex items-center justify-between mt-4">
                        <span className="text-sm font-medium text-gray-600">Quantidade</span>
                        <div className="flex items-center border border-gray-200 rounded-full h-10">
                            <button
                                onClick={() => setQty(Math.max(1, qty - 1))}
                                className="w-10 h-full flex items-center justify-center text-gray-500 hover:text-black transition-colors"
                            >−</button>
                            <span className="w-8 text-center text-sm font-bold">{qty}</span>
                            <button
                                onClick={() => setQty(Math.min(99, qty + 1))}
                                className="w-10 h-full flex items-center justify-center text-gray-500 hover:text-black transition-colors"
                            >+</button>
                        </div>
                    </div>

                    {/* Subtotal */}
                    {qty > 1 && (
                        <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
                            <span>Subtotal</span>
                            <span className="font-semibold text-[#333]">{formatCurrency(finalPrice * qty)}</span>
                        </div>
                    )}

                    {/* CTA */}
                    <button
                        ref={addButtonRef}
                        onClick={handleAdd}
                        className="w-full mt-4 bg-[#2a7e51] hover:bg-[#236843] transition-colors text-white font-bold py-3.5 px-4 rounded-xl uppercase tracking-wide flex items-center justify-center gap-2 text-sm"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" />
                        </svg>
                        Adicionar à Sacola
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}
