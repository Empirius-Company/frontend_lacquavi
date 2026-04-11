import { ReactNode, useEffect, useState } from 'react'
import { Link, useParams, useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import { ordersApi, paymentsApi } from '../api/index'
import { authApi } from '../api/authApi'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Button, Input, EmptyState, ErrorMessage, Spinner, Skeleton } from '../components/ui'
import { ScrollReveal } from '../components/ui/ScrollReveal'
import {
  formatCurrency, formatDate, formatDateTime,
  getOrderDisplayStatusLabel, getOrderDisplayStatusColor,
  paymentStatusLabel, paymentStatusColor,
} from '../utils'
import type { Order, Payment, ApiError, Shipment, ShipmentStatus } from '../types'

const shipmentStatusLabel: Record<ShipmentStatus, string> = {
  pending: 'Pendente',
  label_purchased: 'Etiqueta gerada',
  posted: 'Postado',
  in_transit: 'Em trânsito',
  delivered: 'Entregue',
  failed: 'Falhou',
  cancelled: 'Cancelado',
  ready_for_pickup: 'Pronto para retirada',
}

const buildCustomerTrackingUrl = (trackingCode?: string | null): string | null => {
  if (!trackingCode) return null
  const normalized = trackingCode.trim().toUpperCase()
  if (!normalized) return null
  return `https://rastreamento.correios.com.br/app/index.php?objeto=${encodeURIComponent(normalized)}`
}

// ─── AUTH LAYOUT ──────────────────────────────────────────────────────────────
function AuthLayout({ children, eyebrow, title, sub }: {
  children: ReactNode
  eyebrow: string
  title: string
  sub?: string
}) {
  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="container-page py-10 sm:py-14 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-start max-w-6xl mx-auto">

          {/* Coluna institucional */}
          <div className="hidden lg:flex flex-col bg-white rounded-3xl border border-gray-100 shadow-sm p-10 gap-8 relative overflow-hidden">
            <div aria-hidden className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-[#2a7e51]/10 blur-2xl" />
            <div>
              <Link to="/" className="inline-flex items-center hover:opacity-90 transition-opacity">
                <img src="/logo.png" alt="Lacquavi" className="h-[43px] md:h-[54px] object-contain" />
              </Link>
              <p className="text-xs font-bold text-[#2a7e51] uppercase tracking-widest mt-8 mb-3">Experiência Premium</p>
              <h2 className="font-display text-4xl text-[#000000] font-black leading-tight mb-4">
                Fragrâncias originais,
                <br />
                <span className="italic font-bold">curadoria exclusiva.</span>
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed max-w-md">
                Faça login para acompanhar seus pedidos ou crie sua conta para receber ofertas e novidades da Lacquavi.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[{ n: '200+', l: 'Fragrâncias' }, { n: '15k+', l: 'Clientes' }, { n: '★ 4.9', l: 'Avaliações' }].map(s => (
                <div key={s.l} className="rounded-xl border border-gray-100 bg-[#F5F5F5] px-3 py-3">
                  <p className="font-display text-lg text-[#000000]">{s.n}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Coluna do formulário */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-md bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
              <Link to="/" className="block lg:hidden text-center mb-8">
                <img src="/logo.png" alt="Lacquavi" className="h-[43px] object-contain mx-auto" />
              </Link>

              <div className="mb-7">
                <p className="text-xs font-bold text-[#2a7e51] uppercase tracking-widest mb-2">{eyebrow}</p>
                <h1 className="font-display text-3xl text-[#000000] font-black leading-tight">{title}</h1>
                {sub && <p className="text-gray-500 text-sm mt-2 leading-relaxed">{sub}</p>}
              </div>

              {children}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
export function LoginPage() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const from = new URLSearchParams(location.search).get('redirect') ?? '/'

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k: string, v: string) => { setForm(f => ({ ...f, [k]: v })); setError('') }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email || !form.password) { setError('Preencha todos os campos.'); return }
    setLoading(true); setError('')
    try {
      await login(form.email, form.password)
      navigate(from, { replace: true })
    } catch (err) {
      setError((err as ApiError).message ?? 'Email ou senha inválidos')
    } finally { setLoading(false) }
  }

  return (
    <AuthLayout eyebrow="Bem-vindo de volta" title="Entrar na sua conta" sub="Acesse sua conta para ver pedidos e continuar comprando.">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="E-mail"
          type="email"
          value={form.email}
          onChange={e => set('email', e.target.value)}
          placeholder="seu@email.com"
          autoComplete="email"
          required
        />
        <Input
          label="Senha"
          type="password"
          value={form.password}
          onChange={e => set('password', e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />
        {error && <ErrorMessage message={error} />}
        <Button variant="primary" size="lg" fullWidth type="submit" loading={loading}>
          Entrar
        </Button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-6">
        Não tem conta?{' '}
        <Link to="/register" className="text-[#2a7e51] hover:text-[#236843] font-semibold transition-colors">
          Criar conta gratuita
        </Link>
      </p>
    </AuthLayout>
  )
}

// ─── REGISTER ─────────────────────────────────────────────────────────────────
export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k: string, v: string) => { setForm(f => ({ ...f, [k]: v })); setError('') }

  // Formata telefone automaticamente: (11) 99999-9999
  const handlePhone = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 11)
    let formatted = digits
    if (digits.length > 2)  formatted = `(${digits.slice(0,2)}) ${digits.slice(2)}`
    if (digits.length > 7)  formatted = `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`
    set('phone', formatted)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) { setError('Preencha todos os campos obrigatórios.'); return }
    if (form.password.length < 8) { setError('Senha deve ter pelo menos 8 caracteres.'); return }
    if (form.phone && form.phone.replace(/\D/g, '').length < 10) { setError('Telefone inválido.'); return }
    setLoading(true); setError('')
    try {
      // Envia phone como dígitos puros para o backend
      const rawPhone = form.phone ? form.phone.replace(/\D/g, '') : undefined
      await register(form.name, form.email, form.password, rawPhone)
      navigate('/')
    } catch (err) {
      setError((err as ApiError).message ?? 'Erro ao criar conta')
    } finally { setLoading(false) }
  }

  return (
    <AuthLayout eyebrow="Junte-se à Lacquavi" title="Criar sua conta" sub="Cadastre-se e acesse fragrâncias exclusivas com entrega para todo o Brasil.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Nome completo" type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Seu nome" required />
        <Input label="E-mail" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="seu@email.com" required />
        <Input
          label="Telefone"
          type="tel"
          value={form.phone}
          onChange={e => handlePhone(e.target.value)}
          placeholder="(11) 99999-9999"
          hint="Opcional — para atualizações do seu pedido"
          inputMode="numeric"
        />
        <Input label="Senha" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Mínimo 8 caracteres" required />
        {error && <ErrorMessage message={error} />}
        <Button variant="primary" size="lg" fullWidth type="submit" loading={loading}>
          Criar Conta Gratuita
        </Button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-6">
        Já tem conta?{' '}
        <Link to="/login" className="text-[#2a7e51] hover:text-[#236843] font-semibold transition-colors">Entrar</Link>
      </p>
    </AuthLayout>
  )
}

// ─── PAYMENT RESULT ───────────────────────────────────────────────────────────
export function PaymentResultPage() {
  const { orderId }   = useParams<{ orderId: string }>()
  const [searchParams] = useSearchParams()
  const paymentId = searchParams.get('paymentId')

  const [order,   setOrder]   = useState<Order | null>(null)
  const [payment, setPayment] = useState<Payment | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orderId) return
    Promise.all([
      ordersApi.getById(orderId).then(r => setOrder(r.order)).catch(() => {}),
      paymentId ? paymentsApi.getById(paymentId).then(r => setPayment(r.payment)).catch(() => {}) : Promise.resolve(),
    ]).finally(() => setLoading(false))
  }, [orderId, paymentId])

  if (loading) return <div className="min-h-screen bg-parchment pt-20 flex items-center justify-center"><Spinner size="lg" /></div>

  const isPaid = payment?.status === 'paid' || payment?.status === 'authorized'
  const orderForDisplay = order
    ? { ...order, paymentStatus: order.paymentStatus ?? payment?.status ?? null }
    : null

  return (
    <div className="min-h-screen bg-parchment pt-20">
      <div className="container-page py-16">
        <div className="max-w-md mx-auto text-center">
          <ScrollReveal direction="scale">
            {/* Icon */}
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto text-4xl mb-8 ${
              isPaid ? 'bg-green-50 border border-green-200 text-green-600' : 'bg-amber-50 border border-amber-200 text-amber-600'
            }`}>
              {isPaid ? '✓' : '⏳'}
            </div>

            <p className="section-eyebrow mb-3">{isPaid ? 'Pedido Confirmado' : 'Aguardando'}</p>
            <h1 className="font-display text-3xl md:text-4xl text-noir-950 mb-3">
              {isPaid ? 'Pedido Aprovado!' : 'Aguardando Pagamento'}
            </h1>
            <p className="text-nude-600 text-sm mb-8 leading-relaxed">
              {isPaid
                ? 'Seu pagamento foi confirmado. Prepararemos sua fragrância com todo o cuidado que você merece.'
                : 'Seu pedido foi criado. Assim que o pagamento for confirmado você receberá uma notificação.'}
            </p>
          </ScrollReveal>

          {order && (
            <ScrollReveal delay={200}>
              <div className="bg-pearl rounded-2xl border border-nude-100 p-6 text-left shadow-card-light mb-8">
                <Row2 label="Pedido" value={`#${order.id.slice(-8).toUpperCase()}`} mono />
                <Row2 label="Status" value={
                  <span className={`badge-status border rounded-full text-xs px-2.5 py-0.5 ${orderForDisplay ? getOrderDisplayStatusColor(orderForDisplay) : ''}`}>
                    {orderForDisplay ? getOrderDisplayStatusLabel(orderForDisplay) : '—'}
                  </span>
                } />
                <Row2 label="Total" value={formatCurrency(order.total)} bold />
              </div>
            </ScrollReveal>
          )}

          <ScrollReveal delay={300} className="flex flex-col sm:flex-row gap-3">
            <Link to="/account/orders" className="flex-1">
              <Button variant="outline" fullWidth>Ver Meus Pedidos</Button>
            </Link>
            <Link to="/products" className="flex-1">
              <Button variant="primary" fullWidth>Continuar Comprando</Button>
            </Link>
          </ScrollReveal>
        </div>
      </div>
    </div>
  )
}

function Row2({ label, value, mono = false, bold = false }: any) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-nude-50 last:border-0">
      <span className="text-sm text-nude-600">{label}</span>
      {typeof value === 'string'
        ? <span className={`text-sm ${bold ? 'font-medium text-noir-950' : 'text-noir-800'} ${mono ? 'font-mono' : ''}`}>{value}</span>
        : value}
    </div>
  )
}

// ─── MY ORDERS ────────────────────────────────────────────────────────────────
export function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [shipmentByOrder, setShipmentByOrder] = useState<Record<string, Shipment | null>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    const loadOrdersAndShipments = async () => {
      try {
        const ordersResponse = await ordersApi.list()
        if (!active) return

        setOrders(ordersResponse.orders)

        const shipmentEntries = await Promise.all(
          ordersResponse.orders.map(async (order) => {
            try {
              const shipmentResponse = await ordersApi.getShipment(order.id)
              return [order.id, shipmentResponse.shipment ?? null] as const
            } catch {
              return [order.id, null] as const
            }
          }),
        )

        if (!active) return
        setShipmentByOrder(Object.fromEntries(shipmentEntries))
      } finally {
        if (active) setLoading(false)
      }
    }

    loadOrdersAndShipments()

    return () => {
      active = false
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="bg-white border-b border-gray-100">
        <div className="container-page py-8 md:py-10">
          <p className="text-xs font-bold text-[#2a7e51] uppercase tracking-widest mb-2">Conta</p>
          <h1 className="font-display text-3xl md:text-4xl text-[#000000] font-black">Meus Pedidos</h1>
          <p className="text-sm text-gray-500 mt-2">Acompanhe o status e histórico dos seus pedidos.</p>
        </div>
      </div>

      <div className="container-page py-8 md:py-10">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            icon="◎"
            title="Nenhum pedido ainda"
            description="Explore nossa coleção e faça seu primeiro pedido."
            action={<Link to="/products"><Button variant="primary">Ver Coleção</Button></Link>}
          />
        ) : (
          <div className="space-y-4">
            {orders.map((order, i) => (
              <ScrollReveal key={order.id} delay={i * 60}>
                {(() => {
                  const trackingCode = shipmentByOrder[order.id]?.trackingCode
                  const customerTrackingUrl = buildCustomerTrackingUrl(trackingCode)

                  return (
                <Link to={`/account/orders/${order.id}`} className="group block">
                  <div className="bg-white rounded-2xl border border-gray-100 px-6 py-5 shadow-sm hover:border-[#2a7e51]/30 hover:shadow-md transition-all duration-300">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1.5">
                          <p className="font-mono text-sm font-medium text-[#111111]">#{order.id.slice(-8).toUpperCase()}</p>
                          <span className={`badge-status border rounded-full text-xs px-2.5 py-0.5 ${getOrderDisplayStatusColor(order)}`}>
                            {getOrderDisplayStatusLabel(order)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{order.items.length} {order.items.length === 1 ? 'item' : 'itens'}</p>
                        {trackingCode && (
                          <div className="mt-2 flex items-center gap-3">
                            <p className="text-2xs text-gray-600">
                              Rastreio: <span className="font-mono text-[#000000]">{trackingCode}</span>
                            </p>
                            {customerTrackingUrl && (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.preventDefault()
                                  event.stopPropagation()
                                  window.open(customerTrackingUrl, '_blank', 'noopener,noreferrer')
                                }}
                                className="text-2xs font-medium text-[#2a7e51] hover:text-[#236843] underline underline-offset-2"
                              >
                                Acompanhar entrega
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-display text-xl text-[#000000]">{formatCurrency(order.total)}</p>
                        <p className="text-xs text-gray-400 mt-1 group-hover:text-[#2a7e51] transition-colors">Ver detalhes →</p>
                      </div>
                    </div>
                  </div>
                </Link>
                  )
                })()}
              </ScrollReveal>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── ORDER DETAIL ─────────────────────────────────────────────────────────────
export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [order,    setOrder]    = useState<Order | null>(null)
  const [shipment, setShipment] = useState<Shipment | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [shipmentLoading, setShipmentLoading] = useState(false)
  const [canceling, setCanceling] = useState(false)

  useEffect(() => {
    if (!id) return
    ordersApi.getById(id)
      .then(r => setOrder(r.order))
      .catch(() => navigate('/account/orders'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!id) return
    setShipmentLoading(true)
    ordersApi.getShipment(id)
      .then(r => setShipment(r.shipment))
      .catch(() => setShipment(null))
      .finally(() => setShipmentLoading(false))
  }, [id])

  const handleCancel = async () => {
    if (!order || !confirm('Cancelar este pedido?')) return
    setCanceling(true)
    try {
      const r = await ordersApi.cancel(order.id)
      setOrder(r.order)
      toast('Pedido cancelado.', 'success')
    } catch (err) {
      toast((err as ApiError).message ?? 'Erro ao cancelar', 'error')
    } finally { setCanceling(false) }
  }

  if (loading) return <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center"><Spinner size="lg" /></div>
  if (!order)  return null

  const canCancel = !['delivered', 'cancelled'].includes(order.status)
  const customerTrackingUrl = buildCustomerTrackingUrl(shipment?.trackingCode)

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="bg-white border-b border-gray-100">
        <div className="container-page py-8 md:py-10">
          <Link to="/account/orders" className="text-xs text-gray-500 hover:text-[#000000] transition-colors flex items-center gap-1.5 mb-4">
            <span>←</span> Meus Pedidos
          </Link>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-[#2a7e51] uppercase tracking-widest mb-2">Pedido</p>
              <h1 className="font-display text-3xl md:text-4xl text-[#000000] font-black">
                #{order.id.slice(-8).toUpperCase()}
              </h1>
              <p className="text-gray-500 text-sm mt-2">{formatDateTime(order.createdAt)}</p>
            </div>
            <span className={`badge-status border rounded-full text-sm px-3 py-1 self-start md:self-auto ${getOrderDisplayStatusColor(order, shipment)}`}>
              {getOrderDisplayStatusLabel(order, shipment)}
            </span>
          </div>
        </div>
      </div>

      <div className="container-page py-8 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Items */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-display text-lg text-[#000000] font-bold">Itens do Pedido</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {order.items.map(item => (
                  <div key={item.id} className="flex items-center gap-4 px-6 py-4">
                    <div className="w-12 h-14 rounded-xl bg-[#F5F5F5] flex items-center justify-center text-gray-300 flex-shrink-0 border border-gray-100">
                      <span className="text-xl">⬟</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-[#000000] font-medium">{item.productId}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Qtd: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium text-[#000000]">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-3">
              <h2 className="font-display text-lg text-[#000000] font-bold mb-4">Resumo Financeiro</h2>
              <Row2 label="Subtotal"          value={formatCurrency(order.subtotal)} />
              {order.discountTotal > 0 && (
                <Row2 label={`Desconto${order.couponCode ? ` (${order.couponCode})` : ''}`} value={`−${formatCurrency(order.discountTotal)}`} />
              )}
              {typeof order.shippingAmountCents === 'number' && order.shippingAmountCents > 0 && (
                <Row2 label={`Frete${order.shippingServiceName ? ` (${order.shippingServiceName})` : ''}`} value={formatCurrency(order.shippingAmountCents / 100)} />
              )}
              <div className="border-t border-gray-100 pt-3 mt-3">
                <Row2 label="Total" value={formatCurrency(order.total)} bold />
              </div>
              {order.paymentStatus && (
                <div className="pt-2 flex justify-between items-center">
                  <span className="text-sm text-gray-500">Pagamento</span>
                  <span className={`badge-status border rounded-full text-xs px-2.5 py-0.5 ${paymentStatusColor[order.paymentStatus] ?? ''}`}>
                    {paymentStatusLabel[order.paymentStatus]}
                  </span>
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-3">
              <h2 className="font-display text-lg text-[#000000] font-bold mb-2">Entrega e Rastreio</h2>
              {shipmentLoading ? (
                <p className="text-sm text-gray-500">Carregando rastreio...</p>
              ) : !shipment ? (
                <p className="text-sm text-gray-500">Ainda não há envio vinculado a este pedido.</p>
              ) : (
                <>
                  <Row2 label="Status" value={shipmentStatusLabel[shipment.status] ?? shipment.status} />
                  {shipment.trackingCode && <Row2 label="Código" value={shipment.trackingCode} mono />}
                  {customerTrackingUrl && (
                    <Row2
                      label="Acompanhar"
                      value={
                        <a
                          href={customerTrackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-[#2a7e51] hover:text-[#236843] underline underline-offset-2"
                        >
                          Ver rastreio
                        </a>
                      }
                    />
                  )}
                  {shipment.status === 'ready_for_pickup' && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 mt-1">
                      <p className="text-sm font-semibold text-emerald-700">Seu pedido está pronto!</p>
                      <p className="text-sm text-emerald-700 mt-0.5">
                        Compareça ao ponto de retirada selecionado com seu documento de identidade.
                      </p>
                    </div>
                  )}
                  {shipment.status === 'failed' && (
                    <p className="text-sm text-gray-600">
                      Tivemos uma instabilidade no envio. Nossa equipe já foi acionada e o status será atualizado em breve.
                    </p>
                  )}
                  {shipment.events && shipment.events.length > 0 && (
                    <div className="pt-2 space-y-2">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Eventos</p>
                      <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                        {shipment.events.slice(0, 10).map(event => (
                          <div key={event.id} className="rounded-xl border border-gray-100 bg-[#F5F5F5] p-2.5">
                            <p className="text-xs font-medium text-[#111111]">{event.description || event.eventType}</p>
                            <p className="text-2xs text-gray-500 mt-0.5">{formatDateTime(event.occurredAt)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {canCancel && (
              <Button variant="danger" fullWidth onClick={handleCancel} loading={canceling} className="rounded-xl">
                Cancelar Pedido
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── ACCOUNT PROFILE ──────────────────────────────────────────────────────────
export function AccountProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  // Formata telefone para exibição
  const formatPhone = (raw?: string | null) => {
    if (!raw) return ''
    const d = raw.replace(/\D/g, '')
    if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
    if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
    return raw
  }
  const handlePhone = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 11)
    let formatted = digits
    if (digits.length > 2)  formatted = `(${digits.slice(0,2)}) ${digits.slice(2)}`
    if (digits.length > 7)  formatted = `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`
    setForm(f => ({ ...f, phone: formatted }))
  }
  const [form,    setForm]    = useState({ name: user?.name ?? '', email: user?.email ?? '', phone: formatPhone(user?.phone) })
  const [saving,  setSaving]  = useState(false)
  const [success, setSuccess] = useState(false)
  const [error,   setError]   = useState('')

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setSuccess(false); setError('')
    try {
      const rawPhone = form.phone ? form.phone.replace(/\D/g, '') : undefined
      await authApi.updateProfile({ name: form.name, email: form.email, ...(rawPhone !== undefined ? { phone: rawPhone } : {}) })
      setSuccess(true)
      toast('Perfil atualizado com sucesso!', 'success')
    } catch (err) {
      setError((err as ApiError).message ?? 'Erro ao salvar')
    } finally { setSaving(false) }
  }

  const handleLogout = async () => { await logout(); navigate('/') }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="bg-white border-b border-gray-100">
        <div className="container-page py-8 md:py-10">
          <p className="text-xs font-bold text-[#2a7e51] uppercase tracking-widest mb-2">Conta</p>
          <h1 className="font-display text-3xl md:text-4xl text-[#000000] font-black">Minha Conta</h1>
          <p className="text-sm text-gray-500 mt-2">Gerencie seus dados e acesse rapidamente seus pedidos.</p>
        </div>
      </div>

      <div className="container-page py-8 md:py-10">
        <div className="max-w-lg mx-auto space-y-6">
          {/* Avatar card */}
          <ScrollReveal>
            <div className="bg-white rounded-3xl border border-gray-100 p-7 shadow-sm flex items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-[#2a7e51]/10 border border-[#2a7e51]/20 flex items-center justify-center text-2xl font-display text-[#2a7e51]">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-display text-xl text-[#000000] font-bold">{user?.name}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
                <span className={`mt-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-2xs border font-medium ${
                  user?.role === 'admin'
                    ? 'bg-[#2a7e51]/10 text-[#2a7e51] border-[#2a7e51]/20'
                    : 'bg-gray-50 text-gray-600 border-gray-200'
                }`}>
                  {user?.role === 'admin' ? '✦ Admin' : 'Cliente'}
                </span>
              </div>
            </div>
          </ScrollReveal>

          {/* Edit form */}
          <ScrollReveal delay={100}>
            <form onSubmit={handleSave} className="bg-white rounded-3xl border border-gray-100 p-7 shadow-sm space-y-5">
              <h2 className="font-display text-lg text-[#000000] font-bold">Editar Dados</h2>
              <Input
                label="Nome"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Seu nome completo"
              />
              <Input
                label="E-mail"
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="seu@email.com"
              />
              <Input
                label="Telefone"
                type="tel"
                value={form.phone}
                onChange={e => handlePhone(e.target.value)}
                placeholder="(11) 99999-9999"
                hint="Para atualizações sobre seus pedidos"
                inputMode="numeric"
              />
              {error   && <ErrorMessage message={error} />}
              {success && <p className="text-xs text-green-600 bg-green-50 border border-green-200 rounded-xl px-4 py-3">✓ Perfil atualizado com sucesso!</p>}
              <Button variant="primary" type="submit" loading={saving}>Salvar Alterações</Button>
            </form>
          </ScrollReveal>

          {/* Quick links */}
          <ScrollReveal delay={200}>
            <div className="bg-white rounded-3xl border border-gray-100 p-7 shadow-sm space-y-3">
              <h2 className="font-display text-lg text-[#000000] font-bold mb-4">Acesso Rápido</h2>
              <Link to="/account/orders" className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-[#2a7e51]/25 hover:bg-[#f5faf7] transition-all group">
                <div className="flex items-center gap-3">
                  <span className="text-lg text-gray-400">◎</span>
                  <span className="text-sm font-medium text-[#111111]">Meus Pedidos</span>
                </div>
                <span className="text-gray-300 group-hover:text-[#2a7e51] transition-colors">→</span>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-red-200 hover:bg-red-50/30 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg text-gray-400">◐</span>
                  <span className="text-sm font-medium text-rouge-700">Sair da conta</span>
                </div>
              </button>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </div>
  )
}

// ─── NOT FOUND ────────────────────────────────────────────────────────────────
export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-noir-950 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(212,175,122,0.06) 0%, transparent 70%)' }} />
      <div className="relative text-center px-6">
        <p className="font-display text-[10rem] md:text-[16rem] text-pearl/5 font-light leading-none select-none">
          404
        </p>
        <div className="-mt-8 md:-mt-16">
          <p className="section-eyebrow-light mb-4">Página não encontrada</p>
          <h1 className="font-display text-3xl md:text-4xl text-pearl font-light mb-4">
            Esta página não existe
          </h1>
          <p className="text-nude-500 text-sm mb-8 max-w-sm mx-auto leading-relaxed">
            A página que você procura pode ter sido removida ou o endereço está incorreto.
          </p>
          <Link to="/">
            <Button variant="primary">Voltar ao Início</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
