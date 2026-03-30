import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ordersApi, couponsApi, shippingApi } from '../api/index'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { Button, ErrorMessage } from '../components/ui'
import { formatCurrency, generateIdempotencyKey, getProductFinalPrice } from '../utils'
import { getProductPrimaryImage } from '../utils/productImages'
import type { CouponValidation, ApiError, Order, ShippingDestination, ShippingQuote } from '../types'

const SHIPPING_DESTINATION_KEY = 'lacquavi_checkout_shipping_destination'
const SHIPPING_SESSION_KEY = 'lacquavi_checkout_shipping_session'

type ShippingSessionCache = {
  cartSignature: string
  orderId: string
  quotes: ShippingQuote[]
  selectedQuoteId: string | null
}

function getEmptyDestination(): ShippingDestination {
  return {
    zip: '',
    street: '',
    number: '',
    complement: '',
    district: '',
    city: '',
    state: '',
  }
}

function normalizeDestination(destination: ShippingDestination): ShippingDestination {
  const digitsZip = destination.zip.replace(/\D/g, '').slice(0, 8)
  const formattedZip = digitsZip.length > 5
    ? `${digitsZip.slice(0, 5)}-${digitsZip.slice(5)}`
    : digitsZip

  return {
    zip: formattedZip,
    street: destination.street.trim(),
    number: destination.number.trim(),
    complement: destination.complement?.trim() ?? '',
    district: destination.district.trim(),
    city: destination.city.trim(),
    state: destination.state.trim().toUpperCase(),
  }
}

function isDestinationComplete(destination: ShippingDestination): boolean {
  const normalized = normalizeDestination(destination)
  return Boolean(
    normalized.zip.replace(/\D/g, '').length === 8 &&
    normalized.street &&
    normalized.number &&
    normalized.district &&
    normalized.city &&
    normalized.state.length === 2
  )
}

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
                ${done ? 'bg-[#2a7e51] text-white' : ''}
                ${active ? 'bg-[#2a7e51] text-white shadow-[0_0_0_4px_rgba(42,126,81,0.2)]' : ''}
                ${!done && !active ? 'bg-nude-100 text-nude-400' : ''}
              `}>
                {done ? '✓' : n}
              </div>
              <span className={`text-xs hidden sm:block ${active ? 'text-[#2a7e51] font-bold tracking-wide' : 'text-nude-500'}`}>{s}</span>
            </div>
            {i < 2 && (
              <div className={`w-12 md:w-20 h-px mx-2 ${done ? 'bg-[#2a7e51]/50' : 'bg-nude-200'}`} />
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
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.05)] z-40 transform transition-transform animate-slide-up pb-safe block">
      <div className="container-narrow py-3">
        <div className="flex justify-between items-center max-w-5xl mx-auto">
          <div>
            <p className="text-2xs text-nude-500 uppercase tracking-wide mb-0.5">Total</p>
            <p className="font-display text-lg text-noir-950">{formatCurrency(total)}</p>
          </div>
          <button
            onClick={onSubmit}
            disabled={loading}
            className="bg-[#2a7e51] hover:bg-[#236843] transition-colors text-white font-bold tracking-widest uppercase text-xs px-6 py-3 rounded-xl shadow-[0_4px_14px_rgba(42,126,81,0.3)] disabled:opacity-50"
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
  const [shippingError, setShippingError] = useState('')
  const [shippingLoading, setShippingLoading] = useState(false)
  const [selectingShipping, setSelectingShipping] = useState(false)
  const [zipLookupLoading, setZipLookupLoading] = useState(false)
  const [destination, setDestination] = useState<ShippingDestination>(() => {
    try {
      const raw = localStorage.getItem(SHIPPING_DESTINATION_KEY)
      if (!raw) return getEmptyDestination()
      return { ...getEmptyDestination(), ...(JSON.parse(raw) as Partial<ShippingDestination>) }
    } catch {
      return getEmptyDestination()
    }
  })
  const [orderDraft, setOrderDraft] = useState<Order | null>(null)
  const [shippingQuotes, setShippingQuotes] = useState<ShippingQuote[]>([])
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>('')
  const [shippingConfirmed, setShippingConfirmed] = useState(false)
  const [shippingRequired, setShippingRequired] = useState(true)
  const [shippingAmountCents, setShippingAmountCents] = useState(0)
  const [shippingDiscountCents, setShippingDiscountCents] = useState(0)

  const orderIdempotencyKeyRef = useRef(generateIdempotencyKey())

  const cartSignature = useMemo(() => {
    const compact = items
      .map(item => `${item.productId}:${item.quantity}`)
      .sort()
      .join('|')
    return `${compact}::${subtotal.toFixed(2)}`
  }, [items, subtotal])

  const discount = coupon?.discount ?? 0
  const shippingAmount = shippingRequired && shippingConfirmed
    ? (shippingAmountCents - shippingDiscountCents) / 100
    : 0
  const total = subtotal - discount + shippingAmount
  const displayTotal = total
  const [showCouponInput, setShowCouponInput] = useState(false)

  const lastZipLookupRef = useRef<string>('')

  useEffect(() => {
    localStorage.setItem(SHIPPING_DESTINATION_KEY, JSON.stringify(destination))
  }, [destination])

  useEffect(() => {
    const zipDigits = destination.zip.replace(/\D/g, '')
    if (zipDigits.length !== 8) return
    if (lastZipLookupRef.current === zipDigits) return

    const timeoutId = window.setTimeout(async () => {
      setZipLookupLoading(true)
      try {
        const response = await fetch(`https://viacep.com.br/ws/${zipDigits}/json/`)
        const data = await response.json() as {
          erro?: boolean
          cep?: string
          logradouro?: string
          bairro?: string
          localidade?: string
          uf?: string
        }

        if (!response.ok || data.erro) {
          setShippingError('Não foi possível localizar o CEP informado.')
          return
        }

        lastZipLookupRef.current = zipDigits
        setDestination(prev => ({
          ...prev,
          zip: data.cep ?? prev.zip,
          street: data.logradouro?.trim() || prev.street,
          district: data.bairro?.trim() || prev.district,
          city: data.localidade?.trim() || prev.city,
          state: data.uf?.trim().toUpperCase() || prev.state,
        }))
      } catch {
        setShippingError('Erro ao buscar CEP automaticamente.')
      } finally {
        setZipLookupLoading(false)
      }
    }, 350)

    return () => window.clearTimeout(timeoutId)
  }, [destination.zip])

  useEffect(() => {
    const prevSignature = sessionStorage.getItem('lacquavi_checkout_cart_signature')
    if (prevSignature && prevSignature !== cartSignature) {
      setOrderDraft(null)
      setShippingQuotes([])
      setSelectedQuoteId('')
      setShippingConfirmed(false)
      setShippingRequired(true)
      setShippingAmountCents(0)
      setShippingDiscountCents(0)
      localStorage.removeItem(SHIPPING_SESSION_KEY)
      orderIdempotencyKeyRef.current = generateIdempotencyKey()
    }
    sessionStorage.setItem('lacquavi_checkout_cart_signature', cartSignature)
  }, [cartSignature])

  useEffect(() => {
    const loadCachedShippingSession = async () => {
      try {
        const raw = localStorage.getItem(SHIPPING_SESSION_KEY)
        if (!raw) return
        const parsed = JSON.parse(raw) as ShippingSessionCache
        if (parsed.cartSignature !== cartSignature) return
        if (!parsed.orderId) return

        const { order } = await ordersApi.getById(parsed.orderId)
        setOrderDraft(order)
        setShippingQuotes(parsed.quotes ?? [])
        setSelectedQuoteId(parsed.selectedQuoteId ?? '')
        setShippingConfirmed(Boolean(order.shippingQuoteId))
        setShippingAmountCents(order.shippingAmountCents ?? 0)
        setShippingDiscountCents(order.shippingDiscountCents ?? 0)
      } catch {
        localStorage.removeItem(SHIPPING_SESSION_KEY)
      }
    }

    void loadCachedShippingSession()
  }, [cartSignature])

  const persistShippingSession = (next: Partial<ShippingSessionCache> = {}) => {
    if (!orderDraft && !next.orderId) return
    const payload: ShippingSessionCache = {
      cartSignature,
      orderId: next.orderId ?? orderDraft?.id ?? '',
      quotes: next.quotes ?? shippingQuotes,
      selectedQuoteId: next.selectedQuoteId ?? selectedQuoteId ?? null,
    }
    if (!payload.orderId) return
    localStorage.setItem(SHIPPING_SESSION_KEY, JSON.stringify(payload))
  }

  const ensureOrderDraft = async (): Promise<Order> => {
    if (orderDraft) return orderDraft
    const { order } = await ordersApi.create({
      items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
      couponCode: coupon?.coupon.code,
      idempotencyKey: orderIdempotencyKeyRef.current,
    })
    setOrderDraft(order)
    persistShippingSession({ orderId: order.id, quotes: [], selectedQuoteId: null })
    return order
  }

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

  const handleDestinationChange = (field: keyof ShippingDestination, value: string) => {
    setDestination(prev => ({ ...prev, [field]: value }))
    setShippingError('')

    if (field === 'zip') {
      const digits = value.replace(/\D/g, '').slice(0, 8)
      if (digits.length < 8) {
        lastZipLookupRef.current = ''
      }
    }

    if (shippingConfirmed) {
      setShippingConfirmed(false)
      setShippingAmountCents(0)
      setShippingDiscountCents(0)
    }
  }

  const handleShippingBusinessError = (apiError: ApiError) => {
    switch (apiError.code) {
      case 'SHIPPING_QUOTE_EXPIRED':
        setShippingConfirmed(false)
        setSelectedQuoteId('')
        setShippingQuotes([])
        setShippingError('A cotação expirou. Calcule novamente e escolha um novo frete.')
        break
      case 'SHIPPING_QUOTE_CART_CHANGED':
        setShippingConfirmed(false)
        setSelectedQuoteId('')
        setShippingQuotes([])
        setShippingError('Seu carrinho mudou desde a cotação. Recalcule o frete.')
        break
      case 'SHIPPING_QUOTE_ADDRESS_CHANGED':
        setShippingConfirmed(false)
        setSelectedQuoteId('')
        setShippingQuotes([])
        setShippingError('O endereço mudou desde a cotação. Recalcule o frete.')
        break
      case 'SHIPPING_NO_PHYSICAL_ITEMS':
        setShippingRequired(false)
        setShippingConfirmed(true)
        setShippingQuotes([])
        setShippingAmountCents(0)
        setShippingDiscountCents(0)
        setShippingError('Este pedido não possui itens físicos. Frete não é necessário.')
        break
      default:
        setShippingError(apiError.message ?? 'Erro no processo de frete')
    }
  }

  const handleQuoteShipping = async () => {
    if (items.length === 0) return
    setShippingError('')
    setShippingRequired(true)

    if (!isDestinationComplete(destination)) {
      setShippingError('Preencha endereço completo para calcular frete (incluindo UF com 2 letras e CEP válido).')
      return
    }

    setShippingLoading(true)
    try {
      const draftOrder = await ensureOrderDraft()
      const normalized = normalizeDestination(destination)
      const response = await shippingApi.quote({
        orderId: draftOrder.id,
        destination: normalized,
      })

      const validQuotes = response.quotes.filter(q => new Date(q.expiresAt).getTime() > Date.now())
      setShippingQuotes(validQuotes)

      const bestQuote = validQuotes.reduce<ShippingQuote | null>((best, current) => {
        if (!best) return current
        return current.priceCents < best.priceCents ? current : best
      }, null)

      const nextSelectedQuoteId = bestQuote?.quoteId ?? ''
      setSelectedQuoteId(nextSelectedQuoteId)
      setShippingConfirmed(false)
      persistShippingSession({
        orderId: draftOrder.id,
        quotes: validQuotes,
        selectedQuoteId: nextSelectedQuoteId || null,
      })

      if (!validQuotes.length) {
        setShippingError('Nenhuma opção de frete disponível para este endereço no momento.')
      } else {
        toast('Frete calculado com sucesso. Selecione e confirme o serviço.', 'success')
      }
    } catch (err) {
      handleShippingBusinessError(err as ApiError)
    } finally {
      setShippingLoading(false)
    }
  }

  const handleConfirmShipping = async () => {
    if (!orderDraft || !selectedQuoteId) {
      setShippingError('Selecione um serviço de frete antes de continuar.')
      return
    }
    if (!isDestinationComplete(destination)) {
      setShippingError('Endereço inválido para seleção de frete.')
      return
    }

    setSelectingShipping(true)
    setShippingError('')
    try {
      const selectionResponse = await shippingApi.select({
        orderId: orderDraft.id,
        quoteId: selectedQuoteId,
        destination: normalizeDestination(destination),
      })
      const freshOrder = await ordersApi.getById(orderDraft.id)
      setOrderDraft(freshOrder.order)
      setShippingConfirmed(true)
      setShippingRequired(true)
      setShippingAmountCents(selectionResponse.selection.shippingAmountCents)
      setShippingDiscountCents(selectionResponse.selection.shippingDiscountCents)
      persistShippingSession({ selectedQuoteId })
      toast('Frete selecionado com sucesso!', 'success')
    } catch (err) {
      handleShippingBusinessError(err as ApiError)
      setShippingConfirmed(false)
    } finally {
      setSelectingShipping(false)
    }
  }

  const handleSubmit = async () => {
    if (items.length === 0) return
    const draftOrder = orderDraft ?? await ensureOrderDraft()
    if (shippingRequired && (!shippingConfirmed || !draftOrder.shippingQuoteId)) {
      setError('Calcule e confirme o frete antes de seguir para o pagamento.')
      return
    }
    setSubmitting(true); setError('')
    try {
      clearCart()
      toast('Pedido criado com sucesso! Direcionando para pagamento...', 'success')
      navigate(`/checkout/payment/${draftOrder.id}`)
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
                      {formatCurrency(getProductFinalPrice(item.product) * item.quantity)}
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

            {/* Shipping */}
            {shippingRequired && (
            <div className="bg-pearl rounded-2xl border border-nude-100 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base text-noir-950">Entrega</h3>
                <span className="text-xs text-nude-500">Frete via Melhor Envio</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={destination.zip}
                  onChange={e => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 8)
                    const masked = digits.length > 5
                      ? `${digits.slice(0, 5)}-${digits.slice(5)}`
                      : digits
                    handleDestinationChange('zip', masked)
                  }}
                  placeholder="CEP"
                  className="input-luxury text-sm"
                />
                <input
                  type="text"
                  value={destination.state}
                  onChange={e => handleDestinationChange('state', e.target.value.toUpperCase().slice(0, 2))}
                  placeholder="UF"
                  className="input-luxury text-sm"
                />
                <input
                  type="text"
                  value={destination.street}
                  onChange={e => handleDestinationChange('street', e.target.value)}
                  placeholder="Rua"
                  className="input-luxury text-sm sm:col-span-2"
                />
                <input
                  type="text"
                  value={destination.number}
                  onChange={e => handleDestinationChange('number', e.target.value)}
                  placeholder="Número"
                  className="input-luxury text-sm"
                />
                <input
                  type="text"
                  value={destination.complement ?? ''}
                  onChange={e => handleDestinationChange('complement', e.target.value)}
                  placeholder="Complemento (opcional)"
                  className="input-luxury text-sm"
                />
                <input
                  type="text"
                  value={destination.district}
                  onChange={e => handleDestinationChange('district', e.target.value)}
                  placeholder="Bairro"
                  className="input-luxury text-sm"
                />
                <input
                  type="text"
                  value={destination.city}
                  onChange={e => handleDestinationChange('city', e.target.value)}
                  placeholder="Cidade"
                  className="input-luxury text-sm"
                />
              </div>

              {zipLookupLoading && (
                <p className="text-xs text-nude-500">Buscando endereço pelo CEP...</p>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleQuoteShipping} loading={shippingLoading} className="flex-1">
                  Calcular frete
                </Button>
                <Button variant="primary" onClick={handleConfirmShipping} loading={selectingShipping} className="flex-1">
                  Confirmar frete
                </Button>
              </div>

              {shippingQuotes.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-nude-500 uppercase tracking-wide">Selecione o serviço</p>
                  {shippingQuotes.map(quote => {
                    const checked = selectedQuoteId === quote.quoteId
                    return (
                      <label
                        key={quote.quoteId}
                        className={`flex items-center justify-between rounded-xl border px-3 py-2 cursor-pointer transition-colors ${checked ? 'border-[#2a7e51] bg-[#2a7e51]/5' : 'border-nude-200'}`}
                      >
                        <div className="flex items-start gap-2">
                          <input
                            type="radio"
                            name="shipping-quote"
                            checked={checked}
                            onChange={() => {
                              setSelectedQuoteId(quote.quoteId)
                              setShippingConfirmed(false)
                              persistShippingSession({ selectedQuoteId: quote.quoteId })
                            }}
                            className="mt-1"
                          />
                          <div>
                            <p className="text-sm font-medium text-noir-950">{quote.serviceName}</p>
                            <p className="text-xs text-nude-500">Entrega em até {quote.deliveryDays} dias</p>
                          </div>
                        </div>
                        <p className="text-sm font-medium text-noir-950">{formatCurrency(quote.priceCents / 100)}</p>
                      </label>
                    )
                  })}
                </div>
              )}

              {shippingConfirmed && (
                <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                  Frete confirmado para este pedido.
                </div>
              )}

              {shippingError && <p className="text-xs text-red-500">{shippingError}</p>}
            </div>
            )}

            {!shippingRequired && (
              <div className="bg-pearl rounded-2xl border border-nude-100 p-5 shadow-sm">
                <p className="text-sm text-green-700">Este pedido não possui itens físicos. Frete não aplicável.</p>
              </div>
            )}

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
                <Row
                  label="Frete"
                  value={!shippingRequired ? 'Não aplicável' : shippingConfirmed ? formatCurrency(shippingAmount) : 'A calcular'}
                  valueClass={!shippingRequired ? 'text-green-700 text-xs' : shippingConfirmed ? 'text-noir-950' : 'text-nude-500 text-xs'}
                />
                <div className="h-px bg-nude-100 my-1" />
                <div className="flex justify-between items-end">
                  <span className="font-medium text-noir-950">Total</span>
                  <div className="text-right">
                    <p className="font-display text-2xl text-noir-950">{formatCurrency(displayTotal)}</p>
                    <p className="text-2xs text-nude-400">10× {formatCurrency(displayTotal / 10)}</p>
                  </div>
                </div>
              </div>
              <div className="px-6 pb-6 bg-[#FAF7F2]">
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full bg-[#2a7e51] hover:bg-[#236843] transition-colors text-white font-bold tracking-widest uppercase text-sm py-4 rounded-xl shadow-[0_4px_14px_rgba(42,126,81,0.3)] disabled:opacity-50 flex justify-center items-center gap-2"
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
          total={displayTotal}
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
