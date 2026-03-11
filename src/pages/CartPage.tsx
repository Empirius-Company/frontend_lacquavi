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
    <div className="flex gap-4 py-5 border-b border-gray-100 last:border-0 group">
      {/* Image */}
      <Link to={`/products/${item.productId}`} className="flex-shrink-0">
        <div className="w-20 h-24 rounded-xl overflow-hidden bg-[#F5F5F5] border border-gray-100">
          {productImage?.url ? (
            <img src={productImage.url} alt={productImage.alt || item.product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-2xl text-gray-300">⬟</span>
            </div>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        {item.product?.brand && (
          <p className="text-2xs text-[#e6226e] uppercase tracking-wide-lg font-semibold mb-0.5">
            {item.product.brand}
          </p>
        )}
        <Link to={`/products/${item.productId}`}>
          <h3 className="font-display text-base text-[#111111] leading-snug hover:text-[#e6226e] transition-colors line-clamp-2">
            {item.product?.name ?? item.productId}
          </h3>
        </Link>
        {item.product?.volume && (
          <p className="text-xs text-gray-500 mt-0.5">{item.product.volume}</p>
        )}

        <div className="flex items-center justify-between mt-3">
          {/* Stepper */}
          <div className="flex items-center border border-gray-200 rounded-full overflow-hidden bg-white">
            <button
              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
              className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-[#111111] hover:bg-gray-50 transition-colors"
            >−</button>
            <span className="w-7 text-center text-sm font-medium text-[#111111]">{item.quantity}</span>
            <button
              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
              disabled={item.quantity >= (item.product?.stock ?? 99)}
              className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-[#111111] hover:bg-gray-50 transition-colors disabled:opacity-30"
            >+</button>
          </div>

          {/* Price */}
          <p className="font-body font-semibold text-sm text-[#111111]">
            {formatCurrency(getProductFinalPrice(item.product) * item.quantity)}
          </p>
        </div>
      </div>

      {/* Remove */}
      <button
        onClick={() => removeItem(item.productId)}
        className="self-start p-1.5 text-gray-300 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50"
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
      <div className="min-h-screen bg-[#F5F5F5]">
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
    <div className="min-h-screen bg-[#F5F5F5] pb-12">

      {/* Page header */}
      <div className="bg-white border-b border-gray-100">
        <div className="container-page py-8 md:py-10">
          <p className="text-xs font-bold text-[#e6226e] uppercase tracking-widest mb-2">Compra</p>
          <h1 className="font-display text-3xl md:text-4xl font-black text-[#000000]">
            Carrinho de Compras
          </h1>
          <p className="text-gray-500 text-sm mt-2">{items.length} {items.length === 1 ? 'item' : 'itens'} no seu carrinho</p>
        </div>
      </div>

      <div className="container-page py-8 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Items list */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-display text-lg text-[#000000] font-bold">Produtos</h2>
              <button
                onClick={clearCart}
                className="text-xs text-gray-400 hover:text-red-700 transition-colors"
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
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-display text-lg text-[#000000] font-bold">Resumo do Pedido</h2>
              </div>
              <div className="px-6 py-5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-[#111111] font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Frete</span>
                  <span className="text-green-600 font-medium text-xs">Calculado no checkout</span>
                </div>
                <div className="h-px bg-gray-100 my-2" />
                <div className="flex justify-between">
                  <span className="font-medium text-[#111111]">Total</span>
                  <div className="text-right">
                    <p className="font-display text-2xl text-[#000000]">{formatCurrency(subtotal)}</p>
                    <p className="text-2xs text-gray-400 mt-0.5">10× {formatCurrency(subtotal / 10)}</p>
                  </div>
                </div>
              </div>
              <div className="px-6 pb-6">
                <Button variant="primary" size="lg" fullWidth onClick={handleCheckout}>
                  Finalizar Compra →
                </Button>
                <Link to="/products" className="block text-center mt-3 text-xs text-gray-500 hover:text-[#000000] transition-colors">
                  Continuar comprando
                </Link>
              </div>
            </div>

            {/* Trust badges */}
            <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4 space-y-2.5 shadow-sm">
              {[
                { icon: '🔒', t: 'Pagamento 100% seguro' },
                { icon: '✦', t: 'Produtos originais garantidos' },
                { icon: '↩', t: 'Troca em até 30 dias' },
              ].map(b => (
                <div key={b.t} className="flex items-center gap-3 text-xs text-gray-600">
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
