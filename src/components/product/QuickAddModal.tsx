import { useState } from 'react'
import { createPortal } from 'react-dom'
import { formatCurrency } from '../../utils'
import { useCart } from '../../context/CartContext'
import type { Product } from '../../types'

interface QuickAddModalProps {
    product: Product
    isOpen: boolean
    onClose: () => void
}

export function QuickAddModal({ product, isOpen, onClose }: QuickAddModalProps) {
    const { addItem } = useCart()
    const [qty, setQty] = useState(1)

    if (!isOpen) return null

    const handleAdd = () => {
        addItem(product, qty)
        onClose()
    }

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden relative animate-slide-up">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>

                <div className="p-6">
                    <h2 className="text-xl font-bold text-center mb-6">De olho nesse item? Coloque na sua sacola!</h2>

                    <div className="flex gap-6 items-center">
                        {/* Image */}
                        <div className="w-24 h-32 flex-shrink-0 bg-gray-50 rounded-lg flex items-center justify-center p-2">
                            {product.imageUrl ? (
                                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain" />
                            ) : (
                                <div className="text-gray-300 font-bold text-xl">{product.name.charAt(0)}</div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                            <p className="text-sm text-gray-600 mb-1">{product.name} {product.volume && `— ${product.volume}`}</p>

                            <div className="flex items-center justify-between mt-4">
                                <span className="text-xl font-black text-black">{formatCurrency(product.price)}</span>

                                {/* Stepper */}
                                <div className="flex items-center border border-gray-200 rounded-full h-10">
                                    <button
                                        onClick={() => setQty(Math.max(1, qty - 1))}
                                        className="w-10 h-full flex items-center justify-center text-gray-500 hover:text-black"
                                    >−</button>
                                    <span className="w-8 text-center text-sm font-bold">{qty}</span>
                                    <button
                                        onClick={() => setQty(Math.min(99, qty + 1))}
                                        className="w-10 h-full flex items-center justify-center text-gray-500 hover:text-black"
                                    >+</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleAdd}
                        className="w-full mt-8 bg-[#e6226e] hover:bg-[#cc1d60] transition-colors text-white font-bold py-3 px-4 rounded-md uppercase tracking-wide flex items-center justify-center gap-2"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" />
                        </svg>
                        ADICIONAR À SACOLA
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}
