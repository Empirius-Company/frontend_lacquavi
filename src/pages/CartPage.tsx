import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { Button, EmptyState } from '../components/ui'
import { formatCurrency, getProductFinalPrice } from '../utils'
import { getProductPrimaryImage } from '../utils/productImages'

function CartItem({ item }: { item: any }) {
  const { updateQuantity, removeItem } = useCart()
  const productImage = getProductPrimaryImage(item.product)

  return (
    <div className="flex gap-4 py-5 border-b border-nude-100 last:border-0 group">
      {/* Image */}
      <Link to={`/products/${item.productId}`} className="flex-shrink-0">
        <div className="w-20 h-24 rounded-xl overflow-hidden bg-nude-50 border border-nude-100">
          {productImage?.url ? (
            <img src={productImage.url} alt={productImage.alt || item.product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-2xl text-nude-300">⬟</span>
            </div>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        {item.product?.brand && (
          <p className="text-2xs text-gold-600 uppercase tracking-wide-lg font-medium mb-0.5">
            {item.product.brand}
          </p>
        )}
        <Link to={`/products/${item.productId}`}>
          <h3 className="font-display text-base text-noir-950 leading-snug hover:text-gold-700 transition-colors line-clamp-2">
            {item.product?.name ?? item.productId}
          </h3>
        </Link>
        {item.product?.volume && (
          <p className="text-xs text-nude-500 mt-0.5">{item.product.volume}</p>
        )}

        <div className="flex items-center justify-between mt-3">
          {/* Stepper */}
          <div className="flex items-center border border-nude-200 rounded-full overflow-hidden">
            <button
              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
              className="w-8 h-8 flex items-center justify-center text-nude-500 hover:text-noir-950 hover:bg-nude-50 transition-colors"
            >−</button>
            <span className="w-7 text-center text-sm font-medium">{item.quantity}</span>
            <button
              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
              disabled={item.quantity >= (item.product?.stock ?? 99)}
              className="w-8 h-8 flex items-center justify-center text-nude-500 hover:text-noir-950 hover:bg-nude-50 transition-colors disabled:opacity-30"
            >+</button>
          </div>

          {/* Price */}
          <p className="font-body font-medium text-sm text-noir-950">
            {formatCurrency(getProductFinalPrice(item.product) * item.quantity)}
          </p>
        </div>
      </div>

      {/* Remove */}
      <button
        onClick={() => removeItem(item.productId)}
        className="self-start p-1.5 text-nude-300 hover:text-rouge-700 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50"
        aria-label="Remover"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}

export function CartPage() {
  const { items, subtotal, clearCart } = useCart()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const handleCheckout = () => {
    if (!isAuthenticated) { navigate('/login?redirect=/checkout'); return }
    navigate('/checkout')
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-parchment pt-20">
        <div className="container-page py-16">
          <EmptyState
            icon="◇"
            title="Seu Carrinho está Vazio"
            description="Explore nossas fragrâncias e encontre o seu perfume ideal."
            action={
              <Link to="/products">
                <Button variant="primary">Explorar Coleção</Button>
              </Link>
            }
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white pt-8 pb-12">

      {/* Page header */}
      <div className="container-page mb-6">
        <h1 className="font-display text-3xl md:text-3xl font-light text-[#111111]">
          Carrinho de Compras
        </h1>
        <p className="text-gray-500 text-sm mt-1">{items.length} {items.length === 1 ? 'item' : 'itens'}</p>
      </div>

      <div className="container-page">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Items list */}
          <div className="lg:col-span-7 bg-pearl rounded-3xl border border-nude-100 shadow-card-light overflow-hidden">
            <div className="px-6 py-4 border-b border-nude-50 flex items-center justify-between">
              <h2 className="font-display text-lg text-noir-950">Produtos</h2>
              <button
                onClick={clearCart}
                className="text-xs text-nude-400 hover:text-rouge-700 transition-colors"
              >
                Esvaziar
              </button>
            </div>
            <div className="px-6">
              {items.map(item => <CartItem key={item.productId} item={item} />)}
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-4">
            <div className="bg-pearl rounded-3xl border border-nude-100 shadow-card-light overflow-hidden">
              <div className="px-6 py-4 border-b border-nude-50">
                <h2 className="font-display text-lg text-noir-950">Resumo do Pedido</h2>
              </div>
              <div className="px-6 py-5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-nude-600">Subtotal</span>
                  <span className="text-noir-950 font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-nude-600">Frete</span>
                  <span className="text-green-600 font-medium text-xs">Calculado no checkout</span>
                </div>
                <div className="h-px bg-nude-100 my-2" />
                <div className="flex justify-between">
                  <span className="font-medium text-noir-950">Total</span>
                  <div className="text-right">
                    <p className="font-display text-2xl text-noir-950">{formatCurrency(subtotal)}</p>
                    <p className="text-2xs text-nude-400 mt-0.5">10× {formatCurrency(subtotal / 10)}</p>
                  </div>
                </div>
              </div>
              <div className="px-6 pb-6">
                <Button variant="primary" size="lg" fullWidth onClick={handleCheckout}>
                  Finalizar Compra →
                </Button>
                <Link to="/products" className="block text-center mt-3 text-xs text-nude-500 hover:text-noir-950 transition-colors">
                  Continuar comprando
                </Link>
              </div>
            </div>

            {/* Trust badges */}
            <div className="bg-pearl rounded-2xl border border-nude-100 px-5 py-4 space-y-2.5">
              {[
                { icon: '🔒', t: 'Pagamento 100% seguro' },
                { icon: '✦', t: 'Produtos originais garantidos' },
                { icon: '↩', t: 'Troca em até 30 dias' },
              ].map(b => (
                <div key={b.t} className="flex items-center gap-3 text-xs text-nude-600">
                  <span>{b.icon}</span>{b.t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
