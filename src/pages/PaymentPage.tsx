import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ordersApi, paymentsApi } from '../api/index'
import { useToast } from '../context/ToastContext'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useLoginModal } from '../context/LoginModalContext'
import { Button, Spinner, ErrorMessage } from '../components/ui'
import { PaymentBrandBadges, PaymentIconsCheckout, detectCardBrand } from '../components/ui/PaymentMethodIcons'
import { formatCurrency, generateIdempotencyKey } from '../utils'
import type { Order, Payment, InstallmentOption, ApiError } from '../types'

const CARD_REJECTION_MESSAGES: Record<string, string> = {
  cc_rejected_insufficient_amount: 'Saldo insuficiente. Verifique o limite disponível no cartão.',
  cc_rejected_bad_filled_security_code: 'Código de segurança (CVV) incorreto.',
  cc_rejected_bad_filled_date: 'Data de validade incorreta.',
  cc_rejected_bad_filled_other: 'Dados do cartão incorretos. Confira e tente novamente.',
  cc_rejected_bad_filled_card_number: 'Número do cartão incorreto.',
  cc_rejected_card_disabled: 'Cartão bloqueado. Entre em contato com seu banco.',
  cc_rejected_high_risk: 'Pagamento recusado por análise de risco. Tente outro cartão ou entre em contato com seu banco.',
  cc_rejected_duplicated_payment: 'Pagamento duplicado detectado.',
  cc_rejected_max_attempts: 'Número máximo de tentativas atingido. Tente outro cartão.',
  cc_rejected_invalid_installments: 'Número de parcelas inválido para este cartão.',
  cc_rejected_call_for_authorize: 'Seu banco precisa autorizar este pagamento. Entre em contato com ele.',
  cc_rejected_card_type_not_allowed: 'Tipo de cartão não aceito.',
  cc_rejected_other_reason: 'Pagamento recusado pelo banco. Tente outro cartão ou entre em contato com seu banco.',
  pending_review: 'Pagamento cancelado após análise de segurança. Tente novamente ou use outro cartão.',
  pending_contingency: 'Não foi possível processar o pagamento no momento. Tente novamente em alguns minutos.',
}

const getCardRejectionMessage = (statusDetail: string | null | undefined): string => {
  if (!statusDetail) return 'Pagamento recusado. Tente novamente ou use outro cartão.'
  return CARD_REJECTION_MESSAGES[statusDetail] ?? 'Pagamento recusado. Tente novamente ou use outro cartão.'
}

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
  const { openLoginModal } = useLoginModal()

  const [order, setOrder] = useState<Order | null>(null)
  const [payment, setPayment] = useState<Payment | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [checking, setChecking] = useState(false)
  const [waitingPixData, setWaitingPixData] = useState(false)
  const [threeDsUrl, setThreeDsUrl] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [method, setMethod] = useState('pix')
  const [copied, setCopied] = useState(false)
  const [pixExpired, setPixExpired] = useState(false)
  const [deviceId, setDeviceId] = useState<string | null>(null)
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

  // Installment state
  const [installments, setInstallments] = useState(1)
  const [installmentOptions, setInstallmentOptions] = useState<InstallmentOption[]>([])
  const [loadingInstallments, setLoadingInstallments] = useState(false)
  const lastInstallmentFetchRef = useRef<string>('')

  // Carrega o script de segurança do Mercado Pago para gerar MP_DEVICE_SESSION_ID
  // Esse fingerprint é crítico para reduzir falsos bloqueios de risco.
  useEffect(() => {
    if (method !== 'credit_card') return

    const setDeviceSession = () => {
      setDeviceId((window as any).MP_DEVICE_SESSION_ID || null)
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://www.mercadopago.com/v2/security.js"]')
    if (existingScript) {
      if ((window as any).MP_DEVICE_SESSION_ID || (existingScript as any).readyState === 'complete') {
        setDeviceSession()
        return
      }

      existingScript.addEventListener('load', setDeviceSession)
      existingScript.addEventListener('error', () => {
        setError('Falha ao carregar segurança do Mercado Pago. Recarregue a página e tente novamente.')
      })
      return () => {
        existingScript.removeEventListener('load', setDeviceSession)
      }
    }

    const script = document.createElement('script')
    script.src = 'https://www.mercadopago.com/v2/security.js'
    script.async = true
    script.setAttribute('view', 'checkout')

    const handleError = () => {
      setError('Falha ao carregar segurança do Mercado Pago. Recarregue a página e tente novamente.')
    }

    script.addEventListener('load', setDeviceSession)
    script.addEventListener('error', handleError)
    document.head.appendChild(script)

    return () => {
      script.removeEventListener('load', setDeviceSession)
      script.removeEventListener('error', handleError)
    }
  }, [method])

  useEffect(() => {
    if (!orderId) return
    ordersApi.getById(orderId)
      .then(r => setOrder(r.order))
      .catch(() => navigate('/account/orders'))
      .finally(() => setLoading(false))
  }, [orderId])

  // Listener para conclusão do desafio 3DS enviado pelo Mercado Pago via postMessage
  useEffect(() => {
    const handle3dsMessage = (event: MessageEvent) => {
      if (event.data?.type === '3DS_AUTHORIZATION_COMPLETED' || event.data?.type === 'CHALLENGE_COMPLETED') {
        setThreeDsUrl(null)
        if (payment) {
          setChecking(true)
          paymentsApi.getById(payment.id)
            .then(res => {
              if (!res.payment) return
              setPayment(res.payment)
              const s = res.payment.status
              if (s === 'paid' || s === 'authorized') {
                clearCart()
                toast('Pagamento aprovado!', 'success')
                navigate(`/checkout/payment/${orderId}/result?paymentId=${payment.id}`)
              } else if (s === 'failed' || s === 'cancelled') {
                toast(getCardRejectionMessage(res.payment.statusDetail ?? res.payment.attempts?.[0]?.statusDetail), 'error')
              } else {
                toast('Autenticação concluída. Verificando pagamento...', 'info')
              }
            })
            .catch(() => toast('Erro ao verificar status após autenticação. Use "Atualizar Status".', 'error'))
            .finally(() => setChecking(false))
        }
      }
    }
    window.addEventListener('message', handle3dsMessage)
    return () => window.removeEventListener('message', handle3dsMessage)
  }, [payment, orderId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Derive card brand and BIN from card number for installment lookup
  const cardBrand = detectCardBrand(cardForm.cardNumber)
  const cardBin = cardForm.cardNumber.replace(/\D/g, '').slice(0, 6)

  // ── Card field formatters ────────────────────────────────────────────────────

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, '')
    const newBrand = detectCardBrand(rawDigits)
    const maxLen = newBrand === 'amex' ? 15 : 16
    const limited = rawDigits.slice(0, maxLen)
    let formatted: string
    if (newBrand === 'amex') {
      // Amex: 4-6-5 grouping
      formatted = [limited.slice(0, 4), limited.slice(4, 10), limited.slice(10)]
        .filter(p => p.length > 0).join(' ')
    } else {
      formatted = limited.match(/.{1,4}/g)?.join(' ') ?? limited
    }
    setCardForm(prev => ({ ...prev, cardNumber: formatted }))
  }

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const prevVal = cardForm.expiryDate
    const raw = e.target.value
    const isDeleting = raw.length < prevVal.length
    const digits = raw.replace(/\D/g, '').slice(0, 4)

    let formatted = digits
    if (!isDeleting && digits.length === 1 && parseInt(digits, 10) > 1) {
      // First digit > 1 can't start a valid month alone — auto-prepend 0: "2" → "02/"
      formatted = '0' + digits + '/'
    } else if (digits.length > 2) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`
    } else if (digits.length === 2 && !isDeleting) {
      formatted = digits + '/'
    }

    setCardForm(prev => ({ ...prev, expiryDate: formatted }))
  }

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 11)
    let formatted = digits
    if (digits.length > 9) {
      formatted = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
    } else if (digits.length > 6) {
      formatted = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
    } else if (digits.length > 3) {
      formatted = `${digits.slice(0, 3)}.${digits.slice(3)}`
    }
    setCardForm(prev => ({ ...prev, cpf: formatted }))
  }

  const handleSecurityCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const maxLen = cardBrand === 'amex' ? 4 : 3
    const digits = e.target.value.replace(/\D/g, '').slice(0, maxLen)
    setCardForm(prev => ({ ...prev, securityCode: digits }))
  }

  const handleCardholderNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardForm(prev => ({ ...prev, cardholderName: e.target.value.toUpperCase() }))
  }

  const mpBrandMap: Record<string, string> = {
    visa: 'visa',
    mastercard: 'master',
    amex: 'amex',
    elo: 'elo',
    hipercard: 'hipercard',
  }

  const fetchInstallmentOptions = useCallback(async (paymentMethodId: string, amount: number, bin: string) => {
    const fetchKey = `${paymentMethodId}:${amount}:${bin}`
    if (lastInstallmentFetchRef.current === fetchKey) return
    lastInstallmentFetchRef.current = fetchKey

    setLoadingInstallments(true)
    try {
      const res = await paymentsApi.getInstallmentOptions({ paymentMethodId, amount, bin })
      setInstallmentOptions(res.installmentOptions)
      // Reset to 1x whenever new options are fetched
      setInstallments(1)
    } catch {
      setInstallmentOptions([])
    } finally {
      setLoadingInstallments(false)
    }
  }, [])

  useEffect(() => {
    if (method !== 'credit_card' || !order) return
    if (cardBin.length < 6) {
      // Don't fetch yet; clear any stale options
      if (installmentOptions.length > 0) {
        setInstallmentOptions([])
        lastInstallmentFetchRef.current = ''
      }
      return
    }

    const mpMethod = mpBrandMap[cardBrand || ''] || cardBrand || 'master'
    fetchInstallmentOptions(mpMethod, order.total, cardBin)
  }, [method, cardBin, cardBrand, order, fetchInstallmentOptions]) // eslint-disable-line react-hooks/exhaustive-deps

  // Also trigger a fresh fetch when user switches to credit_card before typing a full BIN
  useEffect(() => {
    if (method !== 'credit_card' || !order || cardBin.length >= 6) return
    // If we have no BIN, fetch default options using a placeholder brand so user sees installment UI
    const mpMethod = mpBrandMap[cardBrand || ''] || 'master'
    const fetchKey = `${mpMethod}:${order.total}:`
    if (lastInstallmentFetchRef.current === fetchKey) return
    lastInstallmentFetchRef.current = fetchKey

    setLoadingInstallments(true)
    paymentsApi.getInstallmentOptions({ paymentMethodId: mpMethod, amount: order.total })
      .then(res => {
        setInstallmentOptions(res.installmentOptions)
        setInstallments(1)
      })
      .catch(() => setInstallmentOptions([]))
      .finally(() => setLoadingInstallments(false))
  }, [method, order]) // eslint-disable-line react-hooks/exhaustive-deps

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

      const recoveredStatus = paymentResponse.payment.status
      if (recoveredStatus === 'failed' || recoveredStatus === 'cancelled') {
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
      toast('Sua sessão expirou. Faça login novamente para continuar.', 'error')
      openLoginModal()
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
      let cardIssuerId: string | undefined

      if (method === 'credit_card') {
        if (!cardForm.cardNumber || !cardForm.securityCode || !cardForm.expiryDate) {
          throw new Error('Preencha os dados do cartão corretamente.')
        }

        const [month, yearRaw] = cardForm.expiryDate.split('/')
        const year = yearRaw?.length === 2 ? `20${yearRaw}` : yearRaw

        const mpPublicKey = (import.meta as unknown as { env: { VITE_MP_PUBLIC_KEY?: string } }).env.VITE_MP_PUBLIC_KEY
        if (!mpPublicKey) throw new Error('Chave pública do Mercado Pago não configurada. Defina VITE_MP_PUBLIC_KEY no arquivo .env.')

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
          const translateMpCardError = (msg: string): string => {
            if (!msg) return 'Não foi possível validar os dados do cartão. Confira e tente novamente.'
            const m = msg.toLowerCase()
            if (m.includes('card_number') || m.includes('cardnumber')) return 'Número do cartão inválido. Verifique os dados.'
            if (m.includes('expiration_month') || m.includes('expiry')) return 'Mês de validade inválido.'
            if (m.includes('expiration_year')) return 'Ano de validade inválido.'
            if (m.includes('security_code') || m.includes('cvv') || m.includes('cvc')) return 'Código de segurança inválido.'
            if (m.includes('cardholder') || m.includes('name')) return 'Nome do titular inválido. Use o nome como está no cartão.'
            if (m.includes('cpf') || m.includes('identification')) return 'CPF inválido.'
            if (m.includes('invalid')) return 'Dados do cartão inválidos. Confira as informações e tente novamente.'
            return 'Não foi possível validar os dados do cartão. Confira e tente novamente.'
          }
          throw new Error(translateMpCardError(mpData.message))
        }
        cardTokenStr = mpData.id
        cardIssuerId = mpData.issuer_id ? String(mpData.issuer_id) : undefined
      }

      const mpMethod = method === 'credit_card'
        ? (mpBrandMap[cardBrand || ''] || 'master')
        : method

      if (method === 'credit_card' && !deviceId) {
        throw new Error('Falha ao validar o dispositivo de pagamento. Recarregue a página e tente novamente.')
      }

      const res = await paymentsApi.create({
        orderId,
        paymentMethodId: mpMethod,
        idempotencyKey,
        ...(cardTokenStr ? { cardToken: cardTokenStr } : {}),
        ...(cardIssuerId ? { issuerId: cardIssuerId } : {}),
        ...(method === 'credit_card' ? { installments } : {}),
        ...(method === 'credit_card' && cardForm.cpf ? { cpf: cardForm.cpf } : {}),
        ...(method === 'credit_card' && cardForm.cardholderName ? { cardholderName: cardForm.cardholderName } : {}),
        ...(method === 'credit_card' && deviceId ? { deviceId } : {}),
      })
      const createdPayment = res.payment ?? await recoverPaymentFromOrder(orderId)
      if (!createdPayment) {
        throw new Error('Pagamento solicitado, mas o backend ainda não retornou os dados. Tente novamente em alguns segundos.')
      }

      setPayment(createdPayment)
      canReuseLastAttemptKeyRef.current = false

      if (method === 'credit_card') {
        if (createdPayment.status === 'paid' || createdPayment.status === 'authorized') {
          clearCart()
          toast('Pagamento aprovado!', 'success')
          navigate(`/checkout/payment/${orderId}/result?paymentId=${createdPayment.id}`)
        } else if (createdPayment.statusDetail === 'pending_challenge' && createdPayment.three_ds_info?.external_resource_url) {
          setThreeDsUrl(createdPayment.three_ds_info.external_resource_url)
          toast('Autentique o pagamento com seu banco para concluir.', 'info')
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
        toast('Já existe um pagamento ativo para este pedido. Recuperando...', 'info')

        const recovered = await recoverPaymentFromOrder(orderId)
        if (!recovered) {
          setError('Já existe um pagamento ativo para este pedido.')
        }
      } else if (apiError.statusCode === 401) {
        // 401 aqui pode ser erro do provedor (Mercado Pago) e não necessariamente
        // sessão expirada. O httpClient já cuida de deslogar quando o refresh falha.
        // Não redirecionar para /login — o guard de rota faz isso se necessário.
        setError('Falha na integração de pagamento. Tente novamente ou contate o suporte.')
        toast('Erro no provedor de pagamento. Tente novamente.', 'error')
      } else {
        setError(apiError.message ?? 'Não foi possível processar o pagamento. Tente novamente.')
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
      const s = res.payment.status
      if (s === 'paid' || s === 'authorized') {
        toast('Pagamento confirmado!', 'success')
        navigate(`/checkout/payment/${orderId}/result?paymentId=${payment.id}`)
      } else if (s === 'failed' || s === 'cancelled') {
        const detail = res.payment.statusDetail ?? res.payment.attempts?.[0]?.statusDetail
        toast(getCardRejectionMessage(detail), 'error')
      } else {
        toast('Pagamento ainda em análise. Aguarde e tente novamente.', 'info')
      }
    } catch { toast('Não foi possível verificar o status do pagamento. Tente novamente.', 'error') }
    finally { setChecking(false) }
  }

  const copyCode = async () => {
    if (!payment?.qr_code) return
    try {
      await navigator.clipboard.writeText(payment.qr_code)
      setCopied(true)
      toast('Código PIX copiado!', 'success')
      setTimeout(() => setCopied(false), 3000)
    } catch { toast('Não foi possível copiar o código PIX. Copie manualmente.', 'error') }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-parchment pt-20 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  const isPaid = payment?.status === 'paid' || payment?.status === 'authorized'

  if (threeDsUrl) {
    return (
      <div className="min-h-screen bg-obsidian-950/80 flex items-center justify-center p-4 fixed inset-0 z-50">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          <div className="px-6 py-4 border-b border-nude-100 flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg text-noir-950">Autenticação do Banco</h3>
              <p className="text-xs text-nude-500 mt-0.5">Conclua a verificação para aprovar o pagamento</p>
            </div>
            <button
              onClick={() => { setThreeDsUrl(null); setChecking(false) }}
              className="text-nude-400 hover:text-nude-600 text-xl leading-none"
              aria-label="Fechar"
            >✕</button>
          </div>
          <iframe
            src={threeDsUrl}
            className="w-full border-0"
            style={{ height: '400px' }}
            title="Autenticação 3DS"
            sandbox="allow-scripts allow-forms allow-same-origin allow-top-navigation"
          />
          <div className="px-6 py-3 bg-nude-50 border-t border-nude-100">
            <p className="text-xs text-nude-500 text-center">
              Siga as instruções do seu banco. Esta janela fecha automaticamente ao concluir.
            </p>
          </div>
        </div>
      </div>
    )
  }

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
                        {m.id === 'credit_card' ? (
                          <PaymentBrandBadges />
                        ) : (
                          <p className="text-xs text-nude-500">{m.sub}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>

                {/* Credit Card Form Fields */}
                {method === 'credit_card' && (
                  <>
                    <div className="bg-nude-50 border border-nude-200 rounded-2xl p-5 mb-4 space-y-4 shadow-inner">
                      <h3 className="font-display text-sm text-noir-950 mb-4 border-b border-nude-200 pb-2">Detalhes do Cartão</h3>

                      <div>
                        <label className="block text-2xs uppercase tracking-widest text-nude-500 mb-1.5 font-medium">Número do Cartão</label>
                        <input
                          type="tel"
                          inputMode="numeric"
                          autoComplete="cc-number"
                          placeholder="0000 0000 0000 0000"
                          className="w-full px-4 py-3 rounded-lg border border-nude-200 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none text-sm bg-white font-mono tracking-wider"
                          value={cardForm.cardNumber}
                          onChange={handleCardNumberChange}
                        />
                        <div className="mt-2">
                          <PaymentIconsCheckout detectedBrand={detectCardBrand(cardForm.cardNumber)} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-2xs uppercase tracking-widest text-nude-500 mb-1.5 font-medium">Nome no Cartão</label>
                          <input
                            type="text"
                            autoComplete="cc-name"
                            placeholder="NOME IGUAL AO CARTÃO"
                            className="w-full px-4 py-3 rounded-lg border border-nude-200 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none text-sm bg-white uppercase"
                            value={cardForm.cardholderName}
                            onChange={handleCardholderNameChange}
                          />
                        </div>
                        <div>
                          <label className="block text-2xs uppercase tracking-widest text-nude-500 mb-1.5 font-medium">CPF do Titular</label>
                          <input
                            type="tel"
                            inputMode="numeric"
                            autoComplete="off"
                            placeholder="000.000.000-00"
                            className="w-full px-4 py-3 rounded-lg border border-nude-200 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none text-sm bg-white"
                            value={cardForm.cpf}
                            onChange={handleCpfChange}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-2xs uppercase tracking-widest text-nude-500 mb-1.5 font-medium">Validade</label>
                          <input
                            type="tel"
                            inputMode="numeric"
                            autoComplete="cc-exp"
                            placeholder="MM/AA"
                            maxLength={5}
                            className="w-full px-4 py-3 rounded-lg border border-nude-200 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none text-sm bg-white"
                            value={cardForm.expiryDate}
                            onChange={handleExpiryChange}
                          />
                        </div>
                        <div>
                          <label className="block text-2xs uppercase tracking-widest text-nude-500 mb-1.5 font-medium">CVV</label>
                          <input
                            type="tel"
                            inputMode="numeric"
                            autoComplete="cc-csc"
                            placeholder={cardBrand === 'amex' ? '0000' : '000'}
                            maxLength={cardBrand === 'amex' ? 4 : 3}
                            className="w-full px-4 py-3 rounded-lg border border-nude-200 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none text-sm bg-white"
                            value={cardForm.securityCode}
                            onChange={handleSecurityCodeChange}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Installment selector */}
                    <div className="bg-nude-50 border border-nude-200 rounded-2xl p-5 mb-7 shadow-inner">
                      <div className="flex items-center justify-between mb-3 border-b border-nude-200 pb-2">
                        <h3 className="font-display text-sm text-noir-950">Parcelas</h3>
                        {loadingInstallments && (
                          <span className="text-2xs text-nude-500 flex items-center gap-1">
                            <Spinner size="sm" /> Calculando...
                          </span>
                        )}
                      </div>

                      {installmentOptions.length > 0 ? (
                        <select
                          value={installments}
                          onChange={(e) => setInstallments(Number(e.target.value))}
                          disabled={creating || loadingInstallments}
                          className="w-full px-4 py-3 rounded-lg border border-nude-200 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none text-sm bg-white text-noir-950 disabled:opacity-50"
                        >
                          {installmentOptions.map((opt) => (
                            <option key={opt.installments} value={opt.installments}>
                              {opt.installments === 1
                                ? `À vista — ${formatCurrency(opt.installmentAmount)}`
                                : `${opt.installments}x de ${formatCurrency(opt.installmentAmount)}${opt.hasInterest ? ` (total ${formatCurrency(opt.totalAmount)})` : ' — sem juros'}`
                              }
                            </option>
                          ))}
                        </select>
                      ) : loadingInstallments ? (
                        <div className="py-4 flex justify-center">
                          <Spinner size="sm" />
                        </div>
                      ) : (
                        <p className="text-xs text-nude-500 py-2">
                          Insira o número do cartão para ver as opções de parcelamento.
                        </p>
                      )}
                    </div>
                  </>
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
                ) : method === 'credit_card' && (payment?.status === 'failed' || payment?.status === 'cancelled') ? (
                  <div className="text-center py-6 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-2xl mx-auto">✕</div>
                    <div>
                      <h3 className="font-display text-xl text-noir-950">Pagamento Recusado</h3>
                      <p className="text-sm text-nude-600 mt-1">
                        {getCardRejectionMessage(payment?.statusDetail ?? payment?.attempts?.[0]?.statusDetail)}
                      </p>
                      {(payment?.statusDetail ?? payment?.attempts?.[0]?.statusDetail) && (
                        <p className="text-xs text-nude-400 mt-2 font-mono">
                          código: {payment?.statusDetail ?? payment?.attempts?.[0]?.statusDetail}
                        </p>
                      )}
                    </div>
                    <Button variant="primary" fullWidth onClick={() => { setPayment(null); setError('') }}>
                      Tentar Novamente
                    </Button>
                  </div>
                ) : method === 'credit_card' ? (
                  <div className="text-center py-6 space-y-2">
                    <p className="text-nude-600">Seu cartão está em análise de segurança pelo Mercado Pago.</p>
                    <p className="text-xs text-nude-400">Isso costuma resolver em alguns minutos. Clique em "Atualizar Status" para verificar.</p>
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

                        <p className="text-center text-xs text-nude-500 mt-3 leading-relaxed">
                          Após pagar, a confirmação pode levar até alguns minutos para aparecer aqui. Fique tranquilo — assim que identificarmos o pagamento, seu pedido será atualizado automaticamente.
                        </p>
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
