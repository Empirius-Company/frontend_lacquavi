import { Fragment } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { formatCurrency, getProductFinalPrice } from '../../utils'
import { getProductPrimaryImage } from '../../utils/productImages'
import { Button } from '../ui'

export function MiniCart() {
    const { isCartOpen, closeCart, items, subtotal, removeItem, updateQuantity } = useCart()
    const navigate = useNavigate()

    if (!isCartOpen) return null

    const handleCheckout = () => {
        closeCart()
        navigate('/cart')
    }

    return (
        <Fragment>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-[100] transition-opacity animate-fade-in"
                onClick={closeCart}
            />

            {/* Drawer */}
            <div className="fixed inset-y-0 right-0 z-[101] w-full sm:w-96 bg-white shadow-xl flex flex-col animate-[slideLeft_0.3s_ease-out_both] transform">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-nude-100">
                    <h2 className="font-display text-lg text-noir-950 font-medium">Sua Sacola</h2>
                    <button
                        onClick={closeCart}
                        className="p-2 -mr-2 text-nude-400 hover:text-noir-950 transition-colors"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto px-6 py-4 no-scrollbar">
                    {items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-nude-500">
                            <span className="text-4xl text-nude-300">◇</span>
                            <p className="text-sm">Sua sacola está vazia.</p>
                            <Button variant="outline" onClick={closeCart}>Continuar Comprando</Button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {items.map(item => {
                                const productImage = getProductPrimaryImage(item.product)
                                return (
                                <div key={item.productId} className="flex gap-4 group">
                                    {/* Image */}
                                    <Link to={`/products/${item.productId}`} onClick={closeCart} className="w-20 h-24 flex-shrink-0 border border-nude-100 rounded-xl overflow-hidden bg-nude-50">
                                        {productImage?.url ? (
                                            <img src={productImage.url} alt={productImage.alt || item.product.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-nude-300">⬟</div>
                                        )}
                                    </Link>

                                    {/* Info */}
                                    <div className="flex-1 flex flex-col justify-between py-0.5">
                                        <div>
                                            <div className="flex justify-between items-start">
                                                {item.product?.brand && (
                                                    <p className="text-[10px] text-gold-600 uppercase tracking-widest font-bold mb-0.5">{item.product.brand}</p>
                                                )}
                                                <button
                                                    onClick={() => removeItem(item.productId)}
                                                    className="text-nude-300 hover:text-red-500 transition-colors"
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                </button>
                                            </div>
                                            <Link to={`/products/${item.productId}`} onClick={closeCart}>
                                                <h3 className="text-sm font-medium text-noir-950 line-clamp-2 hover:text-gold-700 leading-tight">
                                                    {item.product?.name ?? item.productId}
                                                </h3>
                                            </Link>
                                        </div>

                                        <div className="flex items-end justify-between mt-2">
                                            <div className="flex items-center border border-nude-200 rounded-full bg-white">
                                                <button
                                                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                                    className="w-9 h-9 flex items-center justify-center text-nude-500 hover:text-noir-950 transition-colors"
                                                >−</button>
                                                <span className="w-6 text-center text-xs font-semibold">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                                    disabled={item.quantity >= (item.product?.stock ?? 99)}
                                                    className="w-7 h-7 flex items-center justify-center text-nude-500 hover:text-noir-950 transition-colors disabled:opacity-30"
                                                >+</button>
                                            </div>
                                            <p className="text-sm font-medium text-noir-950">
                                                {formatCurrency(getProductFinalPrice(item.product) * item.quantity)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                    <div className="border-t border-nude-100 p-6 bg-pearl">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm text-nude-600">Subtotal</span>
                            <span className="text-lg font-medium text-noir-950">{formatCurrency(subtotal)}</span>
                        </div>

                        <button
                            onClick={handleCheckout}
                            className="w-full bg-[#000000] hover:bg-[#2a7e51] transition-colors text-white font-bold tracking-widest uppercase text-sm py-4 rounded-xl shadow-[0_4px_14px_rgba(0,0,0,0.1)] mb-2"
                        >
                            Finalizar Pedido →
                        </button>
                        <p className="text-center text-xs text-nude-500">Frete e impostos calculados no checkout</p>
                    </div>
                )}
            </div>
        </Fragment>
    )
}
