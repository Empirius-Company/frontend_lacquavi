import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ordersApi, couponsApi } from '../api/index'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { Button, ErrorMessage } from '../components/ui'
import { formatCurrency, generateIdempotencyKey } from '../utils'
import { getProductPrimaryImage } from '../utils/productImages'
import type { CouponValidation, ApiError } from '../types'

/* Step indicator */
function StepBar({ current }: { current: 1 | 2 | 3 }) {
  const steps = ['Carrinho', 'Revisão', 'Pagamento']
  return (
    <div className="flex items-center justify-center gap-0">
      {steps.map((s, i) => {
        const n = i + 1
        const done = n < current
        const active = n === current
        return (
          <React.Fragment key={s}>
            <div className="flex items-center gap-2">
              <div className={`
                w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all
                ${done ? 'bg-[#e6226e] text-white' : ''}
                ${active ? 'bg-[#e6226e] text-white shadow-[0_0_0_4px_rgba(230,34,110,0.2)]' : ''}
                ${!done && !active ? 'bg-nude-100 text-nude-400' : ''}
              `}>
                {done ? '✓' : n}
              </div>
              <span className={`text-xs hidden sm:block ${active ? 'text-[#e6226e] font-bold tracking-wide' : 'text-nude-500'}`}>{s}</span>
            </div>
            {i < 2 && (
              <div className={`w-12 md:w-20 h-px mx-2 ${done ? 'bg-[#e6226e]/50' : 'bg-nude-200'}`} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

function FloatingTotalBar({ total, onSubmit, loading }: { total: number; onSubmit: () => void; loading: boolean }) {
  const [isVisible, setIsVisible] = useState(false)

  React.useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 150) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }
    window.addEventListener('scroll', toggleVisibility)
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  if (!isVisible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.05)] z-40 transform transition-transform animate-slide-up pb-safe hidden lg:block">
      <div className="container-narrow py-3">
        <div className="flex justify-between items-center max-w-5xl mx-auto">
          <div>
            <p className="text-2xs text-nude-500 uppercase tracking-wide mb-0.5">Total</p>
            <p className="font-display text-lg text-noir-950">{formatCurrency(total)}</p>
          </div>
          <button
            onClick={onSubmit}
            disabled={loading}
            className="bg-[#e6226e] hover:bg-[#cc1d60] transition-colors text-white font-bold tracking-widest uppercase text-xs px-6 py-3 rounded-xl shadow-[0_4px_14px_rgba(230,34,110,0.3)] disabled:opacity-50"
          >
            {loading ? 'Processando...' : 'Ir para o Pagamento →'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [couponCode, setCouponCode] = useState('')
  const [coupon, setCoupon] = useState<CouponValidation | null>(null)
  const [couponError, setCouponError] = useState('')
  const [validating, setValidating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const discount = coupon?.discount ?? 0
  const total = subtotal - discount
  const [showCouponInput, setShowCouponInput] = useState(false)

  const validateCoupon = async () => {
    if (!couponCode.trim()) return
    setValidating(true); setCouponError(''); setCoupon(null)
    try {
      const result = await couponsApi.validate({ couponCode: couponCode.trim().toUpperCase(), subtotal })
      setCoupon(result)
      toast(`Cupom aplicado! Desconto de ${formatCurrency(result.discount)}`, 'success')
    } catch (err) {
      setCouponError((err as ApiError).message)
    } finally { setValidating(false) }
  }

  const handleSubmit = async () => {
    if (items.length === 0) return
    setSubmitting(true); setError('')
    try {
      const { order } = await ordersApi.create({
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
        couponCode: coupon?.coupon.code,
        idempotencyKey: generateIdempotencyKey(),
      })
      clearCart()
      toast('Pedido criado com sucesso! Direcionando para pagamento...', 'success')
      navigate(`/checkout/payment/${order.id}`)
    } catch (err) {
      setError((err as ApiError).message ?? 'Erro ao criar pedido')
    } finally { setSubmitting(false) }
  }

  return (
    <div className="min-h-screen bg-white pt-6 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 mt-2">
        <StepBar current={2} />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left — items + coupon */}
          <div className="lg:col-span-7 space-y-5">

            {/* Items */}
            <div className="bg-pearl rounded-3xl border border-nude-100 overflow-hidden shadow-card-light">
              <div className="px-6 py-4 border-b border-nude-50">
                <h2 className="font-display text-lg text-noir-950">Seu Pedido</h2>
              </div>
              <div className="divide-y divide-nude-50">
                {items.map(item => {
                  const productImage = getProductPrimaryImage(item.product)
                  return (
                  <div key={item.productId} className="flex items-center gap-4 px-6 py-4">
                    <div className="w-14 h-16 rounded-xl overflow-hidden bg-nude-50 flex-shrink-0">
                      {productImage?.url ? (
                        <img src={productImage.url} alt={productImage.alt || item.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-nude-300 text-lg">⬟</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {item.product?.brand && (
                        <p className="text-2xs text-gold-600 uppercase tracking-wide mb-0.5">{item.product.brand}</p>
                      )}
                      <p className="text-sm font-medium text-noir-950 line-clamp-1">{item.product?.name ?? item.productId}</p>
                      <p className="text-xs text-nude-500 mt-0.5">Qtd: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium text-noir-950 flex-shrink-0">
                      {formatCurrency((item.product?.price ?? 0) * item.quantity)}
                    </p>
                  </div>
                  )
                })}
              </div>
              <div className="px-6 py-3 bg-nude-50/40 flex justify-between text-sm">
                <span className="text-nude-600">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
            </div>

            {/* Coupon */}
            <div className="bg-pearl rounded-2xl border border-nude-100 p-5 shadow-sm">
              {!showCouponInput && !coupon ? (
                <button
                  onClick={() => setShowCouponInput(true)}
                  className="text-sm font-medium text-[#D4AF37] hover:text-[#C5A028] transition-colors flex items-center gap-2 w-full text-left"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                  Tem um cupom de desconto?
                </button>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-display text-base text-noir-950">Cupom de Desconto</h3>
                    {!coupon && (
                      <button onClick={() => setShowCouponInput(false)} className="text-xs text-nude-500 hover:text-noir-950">Cancelar</button>
                    )}
                  </div>
                  {coupon ? (
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-2xl border border-green-200">
                      <div>
                        <p className="text-sm font-medium text-green-800 font-mono">{coupon.coupon.code}</p>
                        <p className="text-xs text-green-700 mt-0.5">Desconto: {formatCurrency(coupon.discount)}</p>
                      </div>
                      <button onClick={() => { setCoupon(null); setCouponCode('') }} className="text-xs text-green-700 hover:text-red-600 transition-colors">
                        Remover
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError('') }}
                        onKeyDown={e => e.key === 'Enter' && validateCoupon()}
                        placeholder="CÓDIGO DO CUPOM"
                        className="input-luxury font-mono uppercase text-sm flex-1 tracking-wider"
                      />
                      <Button variant="outline" onClick={validateCoupon} loading={validating} className="flex-shrink-0">
                        Aplicar
                      </Button>
                    </div>
                  )}
                  {couponError && <p className="text-xs text-red-500 mt-2">{couponError}</p>}
                </>
              )}
            </div>

            {error && <ErrorMessage message={error} />}
          </div>

          {/* Right — summary */}
          <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-4">
            <div className="bg-pearl rounded-3xl border border-nude-100 overflow-hidden shadow-card-light">
              <div className="px-6 py-5 border-b border-nude-50 bg-[#FAF7F2]">
                <h2 className="font-display text-xl tracking-wide text-noir-950">Resumo do Pedido</h2>
              </div>
              <div className="px-6 py-5 space-y-3">
                <Row label="Subtotal" value={formatCurrency(subtotal)} />
                {discount > 0 && (
                  <Row label="Desconto" value={`−${formatCurrency(discount)}`} valueClass="text-green-600" />
                )}
                <Row label="Frete" value="A calcular" valueClass="text-nude-500 text-xs" />
                <div className="h-px bg-nude-100 my-1" />
                <div className="flex justify-between items-end">
                  <span className="font-medium text-noir-950">Total</span>
                  <div className="text-right">
                    <p className="font-display text-2xl text-noir-950">{formatCurrency(total)}</p>
                    <p className="text-2xs text-nude-400">10× {formatCurrency(total / 10)}</p>
                  </div>
                </div>
              </div>
              <div className="px-6 pb-6 bg-[#FAF7F2]">
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full bg-[#e6226e] hover:bg-[#cc1d60] transition-colors text-white font-bold tracking-widest uppercase text-sm py-4 rounded-xl shadow-[0_4px_14px_rgba(230,34,110,0.3)] disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {submitting ? 'Processando...' : 'Ir para o Pagamento →'}
                </button>

                <div className="flex items-center justify-center gap-2 text-xs text-green-700 mt-4 font-medium bg-green-50 py-2 rounded-lg border border-green-100">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  <span>Ambiente Seguro e Criptografado</span>
                </div>
                <Link to="/cart" className="block text-center mt-3 text-xs text-nude-500 hover:text-noir-950 transition-colors">
                  ← Voltar ao carrinho
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Floating Total Bar */}
      {items.length > 0 && (
        <FloatingTotalBar
          total={total}
          onSubmit={handleSubmit}
          loading={submitting}
        />
      )}
    </div>
  )
}

function Row({ label, value, valueClass = 'text-noir-950' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-nude-600">{label}</span>
      <span className={`font-medium ${valueClass}`}>{value}</span>
    </div>
  )
}
