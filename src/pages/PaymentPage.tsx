import React, { useEffect, useState, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ordersApi, paymentsApi } from '../api/index'
import { useToast } from '../context/ToastContext'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { Button, Spinner, ErrorMessage } from '../components/ui'
import { formatCurrency, generateIdempotencyKey } from '../utils'
import type { Order, Payment, ApiError } from '../types'

const PAYMENT_METHODS = [
  { id: 'pix', label: 'PIX', sub: 'Aprovação instantânea', icon: '⚡' },
  { id: 'credit_card', label: 'Cartão de Crédito', sub: 'Visa, Master, Amex', icon: '💳' },
]

function CountdownTimer({ expiresAt, onExpired }: { expiresAt: string; onExpired?: () => void }) {
  const [remaining, setRemaining] = useState('')
  const [expired, setExpired] = useState(false)
  const onExpiredRef = React.useRef(onExpired)
  onExpiredRef.current = onExpired

  useEffect(() => {
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now()
      if (diff <= 0) {
        if (!expired) {
          setExpired(true)
          setRemaining('00:00')
          onExpiredRef.current?.()
        }
        return
      }
      const m = Math.floor(diff / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setRemaining(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
    }
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [expiresAt]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`flex items-center gap-2 text-sm ${expired ? 'text-red-400' : 'text-amber-400'}`}>
      <span>{expired ? '⚠' : '⏱'}</span>
      <span className="font-mono font-medium">{remaining}</span>
      <span className="text-nude-500 text-xs">{expired ? 'Código expirado' : 'para expirar'}</span>
    </div>
  )
}

function FloatingTotalBar({ order, payment, onSubmit, loading, method }: { order: Order; payment: Payment | null; onSubmit: () => void; loading: boolean; method: string }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
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

  if (!isVisible || payment) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.05)] z-40 transform transition-transform animate-slide-up pb-safe">
      <div className="container-narrow py-3">
        <div className="flex justify-between items-center max-w-xl mx-auto">
          <div>
            <p className="text-2xs text-nude-500 uppercase tracking-wide mb-0.5">Total</p>
            <p className="font-display text-lg text-noir-950">{formatCurrency(order.total)}</p>
          </div>
          <button
            onClick={onSubmit}
            disabled={loading}
            className="bg-[#2a7e51] hover:bg-[#236843] transition-colors text-white font-bold tracking-widest uppercase text-xs px-6 py-3 rounded-xl shadow-[0_4px_14px_rgba(42,126,81,0.3)] disabled:opacity-50"
          >
            {loading ? 'Processando...' : method === 'pix' ? 'Gerar PIX' : 'Finalizar Compra'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function PaymentPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { clearCart } = useCart()
  const { isAuthenticated, accessToken } = useAuth()

  const [order, setOrder] = useState<Order | null>(null)
  const [payment, setPayment] = useState<Payment | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [checking, setChecking] = useState(false)
  const [waitingPixData, setWaitingPixData] = useState(false)
  const [error, setError] = useState('')
  const [method, setMethod] = useState('pix')
  const [copied, setCopied] = useState(false)
  const [pixExpired, setPixExpired] = useState(false)
  const isCreatingRef = useRef(false)
  const lastAttemptKeyRef = useRef<string | null>(null)
  const canReuseLastAttemptKeyRef = useRef(false)

  // Form states for credit card
  const [cardForm, setCardForm] = useState({
    cardNumber: '',
    cardholderName: '',
    expiryDate: '', // MM/YY
    securityCode: '',
    cpf: '',
  })

  useEffect(() => {
    if (!orderId) return
    ordersApi.getById(orderId)
      .then(r => setOrder(r.order))
      .catch(() => navigate('/account/orders'))
      .finally(() => setLoading(false))
  }, [orderId])

  const shouldReuseKeyForRetry = (apiError: ApiError): boolean => {
    if (apiError.statusCode) return false
    const normalizedMessage = apiError.message.toLowerCase()
    return /timeout|timed out|network|conex|conexão|internet/.test(normalizedMessage)
  }

  const hasPixPayload = (p?: Payment | null): boolean => Boolean(p?.qr_code || p?.qr_code_base64)

  const waitForPixPayload = async (paymentId: string): Promise<Payment | null> => {
    const maxAttempts = 10
    const intervalMs = 1500

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs))

      try {
        const refreshed = await paymentsApi.getById(paymentId)
        const refreshedPayment = refreshed.payment
        if (!refreshedPayment) {
          continue
        }

        setPayment(refreshedPayment)

        if (hasPixPayload(refreshedPayment)) {
          return refreshedPayment
        }

        if (refreshedPayment.status === 'paid' || refreshedPayment.status === 'authorized' || refreshedPayment.isExpired) {
          return refreshedPayment
        }
      } catch {
        // ignore transient polling errors
      }
    }

    return null
  }

  const recoverPaymentFromOrder = async (targetOrderId: string): Promise<Payment | null> => {
    try {
      const orderResponse = await ordersApi.getById(targetOrderId)
      setOrder(orderResponse.order)

      if (!orderResponse.order.paymentId) {
        return null
      }

      const paymentResponse = await paymentsApi.getById(orderResponse.order.paymentId)
      if (!paymentResponse.payment) {
        return null
      }

      setPayment(paymentResponse.payment)
      return paymentResponse.payment
    } catch {
      return null
    }
  }

  const createPayment = async () => {
    if (!orderId) return
    if (isCreatingRef.current) return

    if (!isAuthenticated || !accessToken) {
      toast('Sua sessão expirou. Faça login novamente para gerar o PIX.', 'error')
      navigate('/login', { replace: true })
      return
    }

    isCreatingRef.current = true

    const idempotencyKey = canReuseLastAttemptKeyRef.current && lastAttemptKeyRef.current
      ? lastAttemptKeyRef.current
      : generateIdempotencyKey()

    if (!canReuseLastAttemptKeyRef.current) {
      lastAttemptKeyRef.current = idempotencyKey
    }

    canReuseLastAttemptKeyRef.current = false

    setCreating(true); setError('')

    try {
      let cardTokenStr = ''

      if (method === 'credit_card') {
        if (!cardForm.cardNumber || !cardForm.securityCode || !cardForm.expiryDate) {
          throw new Error('Preencha os dados do cartão corretamente.')
        }

        const [month, yearRaw] = cardForm.expiryDate.split('/')
        const year = yearRaw?.length === 2 ? `20${yearRaw}` : yearRaw

        // Generate token via Mercado Pago SDK / API Call directly from frontend
        // Note: For production use VITE_MP_PUBLIC_KEY in .env file
        const mpPublicKey = (import.meta as unknown as { env: { VITE_MP_PUBLIC_KEY?: string } }).env.VITE_MP_PUBLIC_KEY || 'TEST-00000000-0000-0000-0000-000000000000'

        const mpRes = await fetch(`https://api.mercadopago.com/v1/card_tokens?public_key=${mpPublicKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            card_number: cardForm.cardNumber.replace(/\D/g, ''),
            security_code: cardForm.securityCode,
            expiration_month: parseInt(month, 10),
            expiration_year: parseInt(year, 10),
            cardholder: {
              name: cardForm.cardholderName,
              identification: {
                type: 'CPF',
                number: cardForm.cpf.replace(/\D/g, '')
              }
            }
          })
        })

        const mpData = await mpRes.json()
        if (!mpRes.ok || !mpData.id) {
          throw new Error(mpData.message || 'Erro ao validar cartão no Mercado Pago.')
        }
        cardTokenStr = mpData.id
      }

      const res = await paymentsApi.create({
        orderId,
        paymentMethodId: method === 'credit_card' ? 'master' : method,
        idempotencyKey,
        ...(cardTokenStr ? { cardToken: cardTokenStr } : {})
      })
      const createdPayment = res.payment ?? await recoverPaymentFromOrder(orderId)
      if (!createdPayment) {
        throw new Error('Pagamento solicitado, mas o backend ainda não retornou os dados. Tente novamente em alguns segundos.')
      }

      setPayment(createdPayment)
      canReuseLastAttemptKeyRef.current = false

      if (method === 'credit_card') {
        if (createdPayment.status === 'paid' || createdPayment.status === 'authorized') {
          clearCart() // Order effectively confirmed
          toast('Pagamento aprovado!', 'success')
          navigate(`/checkout/payment/${orderId}/result?paymentId=${createdPayment.id}`)
        } else {
          toast('Pagamento sendo processado...', 'info')
        }
      } else {
        if (!hasPixPayload(createdPayment)) {
          setWaitingPixData(true)
          const refreshedPix = await waitForPixPayload(createdPayment.id)
          setWaitingPixData(false)

          if (!refreshedPix) {
            toast('Pagamento criado, mas o QR Code ainda está sendo preparado. Clique em "Verificar Pagamento" em alguns segundos.', 'info')
          } else if (hasPixPayload(refreshedPix)) {
            toast('QR Code PIX pronto! Escaneie para pagar.', 'success')
          } else {
            toast('Pagamento criado! Acompanhe o status abaixo.', 'info')
          }
        } else {
          toast('Pagamento criado! Escaneie o QR Code.', 'success')
        }

        clearCart() // Pix generated/processing
      }
    } catch (err) {
      const apiError = err as ApiError

      if (apiError.statusCode === 409) {
        setError('Pagamento já está em processamento. Aguarde alguns segundos e tente novamente.')
        toast('Já existe uma tentativa de pagamento em processamento.', 'info')

        await recoverPaymentFromOrder(orderId)
      } else if (apiError.statusCode === 401) {
        // 401 aqui pode ser erro do provedor (Mercado Pago) e não necessariamente
        // sessão expirada. O httpClient já cuida de deslogar quando o refresh falha.
        // Não redirecionar para /login — o guard de rota faz isso se necessário.
        setError('Falha na integração de pagamento. Tente novamente ou contate o suporte.')
        toast('Erro no provedor de pagamento. Tente novamente.', 'error')
      } else {
        setError(apiError.message ?? 'Erro ao criar pagamento')
      }

      canReuseLastAttemptKeyRef.current = shouldReuseKeyForRetry(apiError)
    } finally {
      setWaitingPixData(false)
      setCreating(false)
      isCreatingRef.current = false
    }
  }

  const checkStatus = async () => {
    if (!payment) return
    setChecking(true)
    try {
      const res = await paymentsApi.getById(payment.id)
      if (!res.payment) {
        toast('Pagamento ainda está sendo criado. Tente novamente em alguns segundos.', 'info')
        return
      }

      setPayment(res.payment)
      if (res.payment.status === 'paid' || res.payment.status === 'authorized') {
        toast('Pagamento confirmado!', 'success')
        navigate(`/checkout/payment/${orderId}/result?paymentId=${payment.id}`)
      } else {
        toast('Pagamento ainda pendente.', 'info')
      }
    } catch { toast('Erro ao verificar pagamento.', 'error') }
    finally { setChecking(false) }
  }

  const copyCode = async () => {
    if (!payment?.qr_code) return
    try {
      await navigator.clipboard.writeText(payment.qr_code)
      setCopied(true)
      toast('Código PIX copiado!', 'success')
      setTimeout(() => setCopied(false), 3000)
    } catch { toast('Erro ao copiar.', 'error') }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-parchment pt-20 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  const isPaid = payment?.status === 'paid' || payment?.status === 'authorized'

  return (
    <div className="min-h-screen bg-white pt-6 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 mt-2">
        {/* Stepper Copied and updated from Checkout */}
        <div className="flex items-center justify-center gap-0">
          {['Carrinho', 'Revisão', 'Pagamento'].map((s, i) => {
            const n = i + 1
            const current = 3
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
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto space-y-6">

          {/* Order summary */}
          {order && (
            <div className="bg-pearl rounded-2xl border border-nude-100 p-5 flex items-center justify-between shadow-card-light">
              <div>
                <p className="text-2xs text-nude-500 uppercase tracking-wide mb-0.5">Pedido</p>
                <p className="font-mono text-sm font-medium text-noir-950">#{order.id.slice(-8).toUpperCase()}</p>
              </div>
              <div className="text-right">
                <p className="text-2xs text-nude-500 uppercase tracking-wide mb-0.5">Total</p>
                <p className="font-display text-xl text-noir-950">{formatCurrency(order.total)}</p>
              </div>
            </div>
          )}

          {/* Payment form / QR */}
          <div className="bg-pearl rounded-3xl border border-nude-100 shadow-card-light overflow-hidden">
            {!payment ? (
              <div className="p-7">
                <h2 className="font-display text-xl text-noir-950 mb-6">Escolha como Pagar</h2>

                {/* Method selection */}
                <div className="space-y-3 mb-7">
                  {PAYMENT_METHODS.map(m => (
                    <label key={m.id} className={`
                      flex items-center gap-4 p-4 rounded-2xl border cursor-pointer
                      transition-all duration-200
                      ${method === m.id
                        ? 'border-gold-500/50 bg-gold-500/5'
                        : 'border-nude-200 hover:border-nude-300'
                      }
                    `}>
                      <input
                        type="radio"
                        name="method"
                        value={m.id}
                        checked={method === m.id}
                        onChange={() => setMethod(m.id)}
                        disabled={creating}
                        className="accent-gold-500"
                      />
                      <span className="text-2xl">{m.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-noir-950">{m.label}</p>
                        <p className="text-xs text-nude-500">{m.sub}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Credit Card Form Fields */}
                {method === 'credit_card' && (
                  <div className="bg-nude-50 border border-nude-200 rounded-2xl p-5 mb-7 space-y-4 shadow-inner">
                    <h3 className="font-display text-sm text-noir-950 mb-4 border-b border-nude-200 pb-2">Detalhes do Cartão</h3>

                    <div>
                      <label className="block text-2xs uppercase tracking-widest text-nude-500 mb-1.5 font-medium">Número do Cartão</label>
                      <input
                        type="text"
                        placeholder="0000 0000 0000 0000"
                        className="w-full px-4 py-3 rounded-lg border border-nude-200 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none text-sm bg-white"
                        value={cardForm.cardNumber}
                        onChange={(e) => setCardForm({ ...cardForm, cardNumber: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-2xs uppercase tracking-widest text-nude-500 mb-1.5 font-medium">Nome no Cartão</label>
                        <input
                          type="text"
                          placeholder="NOME IGUAL AO CARTÃO"
                          className="w-full px-4 py-3 rounded-lg border border-nude-200 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none text-sm bg-white uppercase"
                          value={cardForm.cardholderName}
                          onChange={(e) => setCardForm({ ...cardForm, cardholderName: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-2xs uppercase tracking-widest text-nude-500 mb-1.5 font-medium">CPF do Titular</label>
                        <input
                          type="text"
                          placeholder="000.000.000-00"
                          className="w-full px-4 py-3 rounded-lg border border-nude-200 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none text-sm bg-white"
                          value={cardForm.cpf}
                          onChange={(e) => setCardForm({ ...cardForm, cpf: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-2xs uppercase tracking-widest text-nude-500 mb-1.5 font-medium">Validade</label>
                        <input
                          type="text"
                          placeholder="MM/AA"
                          className="w-full px-4 py-3 rounded-lg border border-nude-200 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none text-sm bg-white"
                          value={cardForm.expiryDate}
                          onChange={(e) => setCardForm({ ...cardForm, expiryDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-2xs uppercase tracking-widest text-nude-500 mb-1.5 font-medium">CVV</label>
                        <input
                          type="text"
                          placeholder="123"
                          className="w-full px-4 py-3 rounded-lg border border-nude-200 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none text-sm bg-white"
                          value={cardForm.securityCode}
                          onChange={(e) => setCardForm({ ...cardForm, securityCode: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {error && <div className="mb-5"><ErrorMessage message={error} /></div>}

                <button
                  onClick={createPayment}
                  disabled={creating}
                  className="w-full bg-[#2a7e51] hover:bg-[#236843] transition-colors text-white font-bold tracking-widest uppercase text-sm py-4 rounded-xl shadow-[0_4px_14px_rgba(42,126,81,0.3)] disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {creating ? 'Processando...' : method === 'pix' ? 'Gerar QR Code PIX' : 'Finalizar Minha Compra'}
                </button>

                <div className="flex items-center justify-center gap-2 text-xs text-green-700 mt-4 font-medium bg-green-50 py-2 rounded-lg border border-green-100">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  <span>Checkout 100% Seguro</span>
                </div>
              </div>
            ) : (
              <div className="p-7">
                {/* PIX QR Code */}
                {isPaid ? (
                  <div className="text-center py-8 space-y-4">
                    <div className="w-20 h-20 rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-3xl mx-auto">
                      ✓
                    </div>
                    <div>
                      <h3 className="font-display text-2xl text-noir-950">Pagamento Confirmado</h3>
                      <p className="text-sm text-nude-600 mt-1">Seu pedido está sendo processado.</p>
                    </div>
                    <Button variant="primary" onClick={() => navigate(`/checkout/payment/${orderId}/result?paymentId=${payment.id}`)}>
                      Ver Pedido
                    </Button>
                  </div>
                ) : method === 'credit_card' ? (
                  <div className="text-center py-6">
                    <p className="text-nude-600">Seu cartão está em análise de segurança pelo Mercado Pago.</p>
                    <Button variant="outline" className="mt-4" fullWidth onClick={checkStatus} loading={checking}>
                      Atualizar Status
                    </Button>
                  </div>
                ) : waitingPixData ? (
                  <div className="text-center py-10 space-y-4">
                    <div className="flex justify-center">
                      <Spinner size="lg" />
                    </div>
                    <div>
                      <h3 className="font-display text-xl text-noir-950">Gerando QR Code PIX</h3>
                      <p className="text-sm text-nude-600 mt-1">Aguarde alguns segundos enquanto o provedor finaliza os dados do pagamento.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="font-display text-xl text-noir-950">Escaneie o QR Code</h2>
                      {payment.expiresAt && !payment.isExpired && (
                        <CountdownTimer
                          expiresAt={payment.expiresAt}
                          onExpired={() => setPixExpired(true)}
                        />
                      )}
                    </div>

                    {/* PIX expirado — bloqueia UI e oferece verificar ou recomeçar */}
                    {(pixExpired || payment.isExpired) ? (
                      <div className="text-center py-6 space-y-4">
                        <div className="w-16 h-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-2xl mx-auto">⚠</div>
                        <div>
                          <h3 className="font-display text-lg text-noir-950">PIX expirado</h3>
                          <p className="text-sm text-nude-600 mt-1">O código de pagamento não é mais válido.</p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button variant="outline" fullWidth onClick={checkStatus} loading={checking}>
                            Verificar se foi pago mesmo assim
                          </Button>
                          <button
                            onClick={() => {
                              setPixExpired(false)
                              setPayment(null)
                            }}
                            className="text-sm text-[#2a7e51] hover:underline"
                          >
                            Gerar novo PIX
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* QR Image */}
                        {payment.qr_code_base64 ? (
                          <div className="flex justify-center mb-6">
                            <div className="p-4 bg-white rounded-2xl border border-nude-100 shadow-sm">
                              <img
                                src={payment.qr_code_base64.startsWith('data:') ? payment.qr_code_base64 : `data:image/png;base64,${payment.qr_code_base64}`}
                                alt="QR Code PIX"
                                className="w-48 h-48"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-center mb-6">
                            <div className="w-48 h-48 bg-nude-50 rounded-2xl border border-nude-200 flex items-center justify-center">
                              <p className="text-3xl">⚡</p>
                            </div>
                          </div>
                        )}

                        {/* Copy code */}
                        {payment.qr_code && (
                          <div className="mb-6">
                            <p className="text-2xs text-nude-500 uppercase tracking-wide mb-2">Código PIX Copia e Cola</p>
                            <div className="flex gap-2">
                              <input
                                readOnly
                                value={payment.qr_code}
                                className="input-luxury font-mono text-xs flex-1 select-all"
                              />
                              <button
                                onClick={copyCode}
                                className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-medium border transition-all ${copied
                                  ? 'border-green-400 text-green-600 bg-green-50'
                                  : 'border-nude-200 text-nude-700 hover:border-nude-400 hover:bg-nude-50'
                                  }`}
                              >
                                {copied ? '✓ Copiado' : 'Copiar'}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Instructions */}
                        <div className="bg-nude-50 rounded-2xl p-4 mb-6 space-y-2">
                          {[
                            'Abra o app do seu banco',
                            'Escolha pagar com PIX',
                            'Escaneie o QR ou cole o código',
                            'Confirme o pagamento',
                          ].map((step, i) => (
                            <div key={step} className="flex items-center gap-3 text-xs text-nude-700">
                              <span className="w-5 h-5 rounded-full bg-gold-500/20 text-gold-700 flex items-center justify-center text-2xs font-medium flex-shrink-0">
                                {i + 1}
                              </span>
                              {step}
                            </div>
                          ))}
                        </div>

                        <Button variant="outline" fullWidth onClick={checkStatus} loading={checking}>
                          Verificar Pagamento
                        </Button>
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Back link */}
          <div className="text-center">
            <Link to="/account/orders" className="text-xs text-nude-500 hover:text-noir-950 transition-colors">
              ← Ver meus pedidos
            </Link>
          </div>
        </div>
      </div>

      {/* Floating Total Bar */}
      {order && !payment && (
        <FloatingTotalBar
          order={order}
          payment={payment}
          method={method}
          onSubmit={createPayment}
          loading={creating}
        />
      )}
    </div>
  )
}
