import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ordersApi, couponsApi, shippingApi } from '../api/index'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { Button } from '../components/ui'
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
  const couponErrorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [shippingError, setShippingError] = useState('')
  const [shippingLoading, setShippingLoading] = useState(false)
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
  const shippingRef = useRef<HTMLDivElement>(null)

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
      sessionStorage.removeItem(SHIPPING_SESSION_KEY)
      orderIdempotencyKeyRef.current = generateIdempotencyKey()
    }
    sessionStorage.setItem('lacquavi_checkout_cart_signature', cartSignature)
  }, [cartSignature])

  useEffect(() => {
    const loadCachedShippingSession = async () => {
      let foundValidSession = false
      try {
        const raw = sessionStorage.getItem(SHIPPING_SESSION_KEY)
        if (raw) {
          const parsed = JSON.parse(raw) as ShippingSessionCache
          if (parsed.cartSignature === cartSignature && parsed.orderId) {
            const { order } = await ordersApi.getById(parsed.orderId)
            if (order.status === 'cancelled') {
              sessionStorage.removeItem(SHIPPING_SESSION_KEY)
            } else {
              setOrderDraft(order)
              setShippingQuotes(parsed.quotes ?? [])
              setSelectedQuoteId(parsed.selectedQuoteId ?? '')
              setShippingConfirmed(Boolean(order.shippingQuoteId))
              setShippingAmountCents(order.shippingAmountCents ?? 0)
              setShippingDiscountCents(order.shippingDiscountCents ?? 0)
              foundValidSession = true
            }
          } else {
            sessionStorage.removeItem(SHIPPING_SESSION_KEY)
          }
        }
      } catch {
        sessionStorage.removeItem(SHIPPING_SESSION_KEY)
      }

      // Sem sessão válida: cria o rascunho em background para que esteja pronto
      // quando o usuário clicar em "Calcular Frete" (elimina 1 request em série)
      if (!foundValidSession && items.length > 0) {
        void ensureOrderDraft()
      }
    }

    void loadCachedShippingSession()
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    sessionStorage.setItem(SHIPPING_SESSION_KEY, JSON.stringify(payload))
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

  const setCouponErrorWithTimeout = (msg: string) => {
    setCouponError(msg)
    if (couponErrorTimerRef.current) clearTimeout(couponErrorTimerRef.current)
    // Mantém o erro visível por 6s antes de sumir — evita desaparecer antes de ser lido
    couponErrorTimerRef.current = setTimeout(() => setCouponError(''), 6000)
  }

  const validateCoupon = async () => {
    if (!couponCode.trim()) return
    setValidating(true); setCouponError(''); setCoupon(null)
    try {
      const result = await couponsApi.validate({ couponCode: couponCode.trim().toUpperCase(), subtotal })
      setCoupon(result)
      toast(`Cupom aplicado! Desconto de ${formatCurrency(result.discount)}`, 'success')
    } catch (err) {
      setCouponErrorWithTimeout((err as ApiError).message)
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

      setSelectedQuoteId('')
      setShippingConfirmed(false)
      persistShippingSession({
        orderId: draftOrder.id,
        quotes: validQuotes,
        selectedQuoteId: null,
      })

      if (!validQuotes.length) {
        setShippingError('Nenhuma opção de frete disponível para este endereço no momento.')
      } else {
        toast('Frete calculado! Clique na opção desejada para confirmar.', 'success')
      }
    } catch (err) {
      handleShippingBusinessError(err as ApiError)
    } finally {
      setShippingLoading(false)
    }
  }

  const scrollToShipping = useCallback(() => {
    shippingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [])

  const handleSubmit = async () => {
    if (items.length === 0) return
    const draftOrder = orderDraft ?? await ensureOrderDraft()
    if (shippingRequired && (!shippingConfirmed || !selectedQuoteId)) {
      setError('Selecione uma opção de frete para continuar.')
      scrollToShipping()
      return
    }
    setSubmitting(true)
    setError('')
    try {
      if (shippingRequired && selectedQuoteId) {
        await shippingApi.select({
          orderId: draftOrder.id,
          quoteId: selectedQuoteId,
          destination: normalizeDestination(destination),
        })
      }
      clearCart()
      navigate(`/checkout/payment/${draftOrder.id}`)
    } catch (err) {
      handleShippingBusinessError(err as ApiError)
      setSubmitting(false)
    }
  }

  const hasShippingError = Boolean(error || shippingError)
  const isPickupMode = shippingQuotes.length > 0 && shippingQuotes.every(q => q.provider === 'STORE_PICKUP')
  const isPickupConfirmed = shippingConfirmed && shippingQuotes.some(q => q.quoteId === selectedQuoteId && q.provider === 'STORE_PICKUP')

  return (
    <div className="min-h-screen bg-white pt-6 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 mt-2">
        <StepBar current={2} />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Left — itens do pedido + frete */}
          <div className="lg:col-span-7 space-y-4">

            {/* Itens */}
            <div className="bg-pearl rounded-3xl border border-nude-100 overflow-hidden shadow-card-light">
              <div className="px-6 py-4 border-b border-nude-50 flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-[#2a7e51] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">1</span>
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

            {/* Entrega */}
            {shippingRequired && (
              <div
                ref={shippingRef}
                className={`bg-pearl rounded-2xl border p-5 shadow-sm space-y-4 transition-colors ${
                  hasShippingError
                    ? 'border-red-300 shadow-[0_0_0_3px_rgba(239,68,68,0.1)]'
                    : shippingConfirmed
                    ? 'border-green-200'
                    : 'border-nude-100'
                }`}
              >
                {/* Cabeçalho com status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0 ${
                      shippingConfirmed ? 'bg-[#2a7e51]' : hasShippingError ? 'bg-red-500' : 'bg-nude-300'
                    }`}>
                      {shippingConfirmed ? '✓' : '2'}
                    </span>
                    <h3 className="font-display text-base text-noir-950">Entrega</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {shippingConfirmed && (
                      <span className="text-xs text-green-700 font-medium bg-green-50 border border-green-200 rounded-full px-2 py-0.5">Confirmado</span>
                    )}
                    {!isPickupMode && <span className="text-xs text-nude-500">Frete via SEDEX</span>}
                  </div>
                </div>

                {/* Erro de validação (frete não selecionado ao tentar avançar) */}
                {error && (
                  <div role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                    <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                  </div>
                )}

                {/* Erro do processo de frete */}
                {shippingError && (
                  <div role="alert" className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
                    <svg className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    <p className="text-sm text-amber-800">{shippingError}</p>
                  </div>
                )}

                {/* Formulário de endereço — ocultado no modo retirada */}
                {!isPickupMode && (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="flex flex-col gap-1">
                        <label htmlFor="dest-zip" className="text-2xs text-nude-500 uppercase tracking-wide font-medium">CEP</label>
                        <input
                          id="dest-zip"
                          type="text"
                          inputMode="numeric"
                          value={destination.zip}
                          onChange={e => {
                            const digits = e.target.value.replace(/\D/g, '').slice(0, 8)
                            const masked = digits.length > 5
                              ? `${digits.slice(0, 5)}-${digits.slice(5)}`
                              : digits
                            handleDestinationChange('zip', masked)
                          }}
                          placeholder="00000-000"
                          className="input-luxury text-sm"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label htmlFor="dest-number" className="text-2xs text-nude-500 uppercase tracking-wide font-medium">Número</label>
                        <input
                          id="dest-number"
                          type="text"
                          value={destination.number}
                          onChange={e => handleDestinationChange('number', e.target.value)}
                          placeholder="123"
                          className="input-luxury text-sm"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label htmlFor="dest-state" className="text-2xs text-nude-500 uppercase tracking-wide font-medium">UF</label>
                        <input
                          id="dest-state"
                          type="text"
                          value={destination.state}
                          onChange={e => handleDestinationChange('state', e.target.value.toUpperCase().slice(0, 2))}
                          placeholder="MG"
                          maxLength={2}
                          className="input-luxury text-sm"
                        />
                      </div>
                      <div className="flex flex-col gap-1 col-span-2 sm:col-span-3">
                        <label htmlFor="dest-street" className="text-2xs text-nude-500 uppercase tracking-wide font-medium">Rua / Logradouro</label>
                        <input
                          id="dest-street"
                          type="text"
                          value={destination.street}
                          onChange={e => handleDestinationChange('street', e.target.value)}
                          placeholder="Rua das Flores"
                          className="input-luxury text-sm"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label htmlFor="dest-complement" className="text-2xs text-nude-500 uppercase tracking-wide font-medium">Complemento</label>
                        <input
                          id="dest-complement"
                          type="text"
                          value={destination.complement ?? ''}
                          onChange={e => handleDestinationChange('complement', e.target.value)}
                          placeholder="Apto 12 (opcional)"
                          className="input-luxury text-sm"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label htmlFor="dest-district" className="text-2xs text-nude-500 uppercase tracking-wide font-medium">Bairro</label>
                        <input
                          id="dest-district"
                          type="text"
                          value={destination.district}
                          onChange={e => handleDestinationChange('district', e.target.value)}
                          placeholder="Centro"
                          className="input-luxury text-sm"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label htmlFor="dest-city" className="text-2xs text-nude-500 uppercase tracking-wide font-medium">Cidade</label>
                        <input
                          id="dest-city"
                          type="text"
                          value={destination.city}
                          onChange={e => handleDestinationChange('city', e.target.value)}
                          placeholder="Belo Horizonte"
                          className="input-luxury text-sm"
                        />
                      </div>
                    </div>

                    {zipLookupLoading && (
                      <p className="text-xs text-nude-500">Buscando endereço pelo CEP...</p>
                    )}

                    <Button variant="outline" onClick={handleQuoteShipping} loading={shippingLoading} fullWidth>
                      Calcular frete
                    </Button>
                  </>
                )}

                {/* Modo retirada */}
                {isPickupMode && (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                      SEDEX não disponível para este CEP. Selecione um ponto de retirada:
                    </div>
                    <div className="space-y-2">
                      {shippingQuotes.map(quote => {
                        const checked = selectedQuoteId === quote.quoteId
                        const locationLabel = quote.serviceCode === 'lagoa_santa' ? 'Lagoa Santa' : 'Minas Shopping'
                        return (
                          <label
                            key={quote.quoteId}
                            className={`flex items-center justify-between rounded-xl border px-3 py-3 cursor-pointer transition-colors ${
                              checked ? 'border-[#2a7e51] bg-[#2a7e51]/5' : 'border-nude-200 hover:border-nude-300'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <input
                                type="radio"
                                name="shipping-quote"
                                checked={checked}
                                onChange={() => {
                                  setSelectedQuoteId(quote.quoteId)
                                  setShippingConfirmed(true)
                                  setShippingRequired(true)
                                  setShippingAmountCents(0)
                                  setShippingDiscountCents(0)
                                  setError('')
                                  persistShippingSession({ selectedQuoteId: quote.quoteId })
                                }}
                                className="mt-0.5"
                              />
                              <div>
                                <p className="text-sm font-medium text-noir-950">Retirar em {locationLabel}</p>
                                <p className="text-xs text-nude-500">Você retira no local após notificação</p>
                              </div>
                            </div>
                            <p className="text-sm font-semibold text-green-600">Grátis</p>
                          </label>
                        )
                      })}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShippingQuotes([])
                        setSelectedQuoteId('')
                        setShippingConfirmed(false)
                        setShippingAmountCents(0)
                      }}
                      className="text-xs text-nude-500 hover:text-noir-950 transition-colors w-full text-center"
                    >
                      Tentar outro CEP
                    </button>
                  </div>
                )}

                {/* Opções de SEDEX */}
                {!isPickupMode && shippingQuotes.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-nude-500 uppercase tracking-wide">Selecione o serviço de entrega</p>
                    {shippingQuotes.map(quote => {
                      const checked = selectedQuoteId === quote.quoteId
                      return (
                        <label
                          key={quote.quoteId}
                          className={`flex items-center justify-between rounded-xl border px-3 py-2 cursor-pointer transition-colors ${
                            checked ? 'border-[#2a7e51] bg-[#2a7e51]/5' : 'border-nude-200 hover:border-nude-300'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <input
                              type="radio"
                              name="shipping-quote"
                              checked={checked}
                              onChange={() => {
                                setSelectedQuoteId(quote.quoteId)
                                setShippingConfirmed(true)
                                setShippingRequired(true)
                                setShippingAmountCents(quote.priceCents)
                                setShippingDiscountCents(orderDraft?.shippingDiscountCents ?? 0)
                                setError('')
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
                  <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    {isPickupMode
                      ? `Retirada confirmada em ${shippingQuotes.find(q => q.quoteId === selectedQuoteId)?.serviceCode === 'lagoa_santa' ? 'Lagoa Santa' : 'Minas Shopping'}.`
                      : 'Frete confirmado para este pedido.'}
                  </div>
                )}
              </div>
            )}

            {!shippingRequired && (
              <div className="bg-pearl rounded-2xl border border-green-200 p-5 shadow-sm flex items-center gap-3">
                <svg className="w-5 h-5 text-green-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                <p className="text-sm text-green-700">Este pedido não possui itens físicos. Frete não aplicável.</p>
              </div>
            )}
          </div>

          {/* Right — cupom + resumo + CTA */}
          <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">

            {/* Cupom */}
            <div className="bg-pearl rounded-2xl border border-nude-100 p-5 shadow-sm">
              {!showCouponInput && !coupon ? (
                <button
                  onClick={() => setShowCouponInput(true)}
                  className="text-sm font-medium text-[#D4AF37] hover:text-[#C5A028] transition-colors flex items-center gap-2 w-full text-left"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
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
                      <button
                        onClick={() => { setCoupon(null); setCouponCode(''); toast('Cupom removido.', 'info') }}
                        className="text-xs text-green-700 hover:text-red-600 transition-colors"
                      >
                        Remover
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        id="coupon-code-input"
                        value={couponCode}
                        onChange={e => {
                          setCouponCode(e.target.value.toUpperCase())
                          if (couponErrorTimerRef.current) clearTimeout(couponErrorTimerRef.current)
                          couponErrorTimerRef.current = setTimeout(() => setCouponError(''), 2000)
                        }}
                        onKeyDown={e => e.key === 'Enter' && validateCoupon()}
                        placeholder="CÓDIGO DO CUPOM"
                        className="input-luxury font-mono uppercase text-sm flex-1 tracking-wider"
                        aria-describedby={couponError ? 'coupon-error' : undefined}
                      />
                      <Button variant="outline" onClick={validateCoupon} loading={validating} className="flex-shrink-0">
                        Aplicar
                      </Button>
                    </div>
                  )}
                  {couponError && <p id="coupon-error" role="alert" className="text-xs text-red-500 mt-2">{couponError}</p>}
                </>
              )}
            </div>

            {/* Resumo */}
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
                  value={
                    !shippingRequired ? 'Não aplicável'
                    : isPickupConfirmed ? 'Grátis (retirada)'
                    : shippingConfirmed ? formatCurrency(shippingAmount)
                    : 'A calcular'
                  }
                  valueClass={
                    !shippingRequired ? 'text-green-700 text-xs'
                    : isPickupConfirmed ? 'text-green-600 text-sm'
                    : shippingConfirmed ? 'text-noir-950'
                    : 'text-nude-500 text-xs'
                  }
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
              <div className="px-6 pb-6 bg-[#FAF7F2] space-y-3">
                {/* Aviso inline junto ao botão quando frete não selecionado */}
                {shippingRequired && !shippingConfirmed && (
                  <button
                    type="button"
                    onClick={scrollToShipping}
                    className="w-full flex items-center justify-center gap-2 text-xs text-amber-700 font-medium bg-amber-50 border border-amber-200 rounded-lg py-2 hover:bg-amber-100 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    Selecione o frete para continuar
                  </button>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full bg-[#2a7e51] hover:bg-[#236843] transition-colors text-white font-bold tracking-widest uppercase text-sm py-4 rounded-xl shadow-[0_4px_14px_rgba(42,126,81,0.3)] disabled:opacity-80 flex justify-center items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Preparando seu pedido...
                    </>
                  ) : 'Ir para o Pagamento →'}
                </button>
                {submitting && (
                  <p className="text-center text-xs text-nude-500">
                    Confirmando frete e finalizando — só um instante
                  </p>
                )}

                <div className="flex items-center justify-center gap-2 text-xs text-green-700 font-medium bg-green-50 py-2 rounded-lg border border-green-100">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <span>Ambiente Seguro e Criptografado</span>
                </div>
                <Link to="/cart" className="block text-center text-xs text-nude-500 hover:text-noir-950 transition-colors">
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
