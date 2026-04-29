import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ordersApi, shippingApi } from '../api'
import { useToast } from '../context/ToastContext'
import { Button, EmptyState, Skeleton, Spinner } from '../components/ui'
import {
  formatCurrency,
  formatDateTime,
  getOrderDisplayStatusLabel,
  getOrderDisplayStatusColor,
} from '../utils'
import { mapShippingLabelError } from '../utils/shippingLabelError'
import type {
  ApiError,
  Order,
  Shipment,
  ShipmentSelection,
  ShipmentStatus,
  ShippingDestination,
} from '../types'

// ─── Local helpers ────────────────────────────────────────────────────────────

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

const pickupLocationLabel: Record<string, string> = {
  lagoa_santa: 'Lagoa Santa',
  minas_shopping: 'Minas Shopping',
}

const formatZipCode = (zip?: string | null) => {
  const digits = (zip ?? '').replace(/\D/g, '')
  if (digits.length !== 8) return zip ?? '—'
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

const formatAddressLine = (destination?: ShippingDestination | null) => {
  if (!destination) return 'Endereço não informado'
  const parts = [destination.street?.trim(), destination.number?.trim()].filter(Boolean)
  const base = parts.join(', ')
  if (!base) return 'Endereço não informado'
  return destination.complement?.trim() ? `${base} · ${destination.complement.trim()}` : base
}

const todayStr = () => new Date().toDateString()

// ─── OpsDashboardPage ─────────────────────────────────────────────────────────

export function OpsDashboardPage() {
  const { toast } = useToast()

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [shipmentMap, setShipmentMap] = useState<Record<string, ShipmentStatus | null>>({})
  const [selectedLabels, setSelectedLabels] = useState<Set<string>>(new Set())
  const [generatingLabels, setGeneratingLabels] = useState(false)
  const [labelResults, setLabelResults] = useState<Record<string, { success: boolean; error?: string }>>({})
  const [confirmingPickup, setConfirmingPickup] = useState<Record<string, boolean>>({})

  const loadOrders = useCallback(async () => {
    try {
      const r = await ordersApi.list()
      setOrders(r.orders)
      return r.orders
    } catch {
      toast('Erro ao carregar pedidos', 'error')
      return []
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadOrders().then((loaded) => {
      const pickupCandidates = loaded.filter(
        (o) => o.shippingProvider === 'STORE_PICKUP' && o.paymentStatus === 'paid' && o.status === 'processing'
      )
      if (pickupCandidates.length === 0) return

      Promise.allSettled(
        pickupCandidates.map((o) =>
          shippingApi.getOrderShipment(o.id).then((r) => ({ orderId: o.id, status: r.shipment?.status ?? null }))
        )
      ).then((results) => {
        const map: Record<string, ShipmentStatus | null> = {}
        results.forEach((r) => {
          if (r.status === 'fulfilled') map[r.value.orderId] = r.value.status
        })
        setShipmentMap(map)
      })
    })
  }, [loadOrders])

  const shippingOrders = useMemo(
    () => orders.filter((o) => o.shippingProvider != null && o.shippingProvider !== 'STORE_PICKUP'),
    [orders]
  )
  const pickupOrders = useMemo(
    () => orders.filter((o) => o.shippingProvider === 'STORE_PICKUP'),
    [orders]
  )

  const awaitingLabel = useMemo(
    () => shippingOrders.filter((o) => o.paymentStatus === 'paid' && o.status === 'processing'),
    [shippingOrders]
  )
  const inTransit = useMemo(
    () => shippingOrders.filter((o) => o.status === 'shipped'),
    [shippingOrders]
  )
  const deliveredToday = useMemo(
    () => orders.filter((o) => o.status === 'delivered' && new Date(o.createdAt).toDateString() === todayStr()),
    [orders]
  )
  const readyForPickup = useMemo(
    () =>
      pickupOrders.filter(
        (o) =>
          o.paymentStatus === 'paid' &&
          o.status === 'processing' &&
          shipmentMap[o.id] === 'ready_for_pickup'
      ),
    [pickupOrders, shipmentMap]
  )
  const awaitingPickupPrep = useMemo(
    () =>
      pickupOrders.filter(
        (o) =>
          o.paymentStatus === 'paid' &&
          o.status === 'processing' &&
          (shipmentMap[o.id] === 'pending' || shipmentMap[o.id] === undefined)
      ),
    [pickupOrders, shipmentMap]
  )

  const toggleLabel = (id: string) => {
    setSelectedLabels((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelectedLabels((prev) =>
      prev.size === awaitingLabel.length ? new Set() : new Set(awaitingLabel.map((o) => o.id))
    )
  }

  const handleBatchLabels = async () => {
    if (selectedLabels.size === 0) return
    setGeneratingLabels(true)
    try {
      const result = await shippingApi.batchLabels(Array.from(selectedLabels))
      const newResults: Record<string, { success: boolean; error?: string }> = {}
      result.results.forEach((r) => { newResults[r.orderId] = { success: r.success, error: r.error } })
      setLabelResults((prev) => ({ ...prev, ...newResults }))
      const ok = result.results.filter((r) => r.success).length
      const fail = result.results.length - ok
      if (fail === 0) toast(`${ok} etiqueta(s) gerada(s) com sucesso!`, 'success')
      else toast(`${ok} gerada(s), ${fail} com erro`, 'warning')
      await loadOrders()
    } catch {
      toast('Erro ao gerar etiquetas em lote', 'error')
    } finally {
      setGeneratingLabels(false)
    }
  }

  const handlePrintLabels = async () => {
    const ids = Array.from(selectedLabels)
    if (ids.length === 0) return
    try {
      const result = await shippingApi.printLabels(ids)
      let opened = 0
      result.labels.forEach((label) => {
        const url = label.labelPdfUrl || label.labelUrl
        if (url) { window.open(url, '_blank'); opened++ }
      })
      if (opened === 0) toast('Nenhuma etiqueta disponível para impressão', 'warning')
    } catch {
      toast('Erro ao buscar etiquetas para impressão', 'error')
    }
  }

  const handleConfirmPickup = async (orderId: string) => {
    setConfirmingPickup((prev) => ({ ...prev, [orderId]: true }))
    try {
      await shippingApi.confirmCollection(orderId)
      toast('Retirada confirmada!', 'success')
      setShipmentMap((prev) => ({ ...prev, [orderId]: 'delivered' }))
      await loadOrders()
    } catch (err) {
      toast((err as ApiError).message || 'Erro ao confirmar retirada', 'error')
    } finally {
      setConfirmingPickup((prev) => ({ ...prev, [orderId]: false }))
    }
  }

  const hasSelectedWithLabel = Array.from(selectedLabels).some(
    (id) => labelResults[id]?.success
  )

  const todayLabel = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-widest text-obsidian-400 mb-1">
          {todayLabel.charAt(0).toUpperCase() + todayLabel.slice(1)}
        </p>
        <h1 className="font-display text-3xl text-ink">Turno de Hoje</h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Aguard. Etiqueta',  value: awaitingLabel.length,   color: 'text-red-600',   anchor: 'section-label'    },
          { label: 'Pronto p/ Retirada', value: readyForPickup.length, color: 'text-amber-600', anchor: 'section-pickup'   },
          { label: 'Em Trânsito',        value: inTransit.length,      color: 'text-blue-600',  anchor: 'section-transit'  },
          { label: 'Entregues Hoje',     value: deliveredToday.length,  color: 'text-green-600', anchor: 'section-delivered'},
        ].map((s) => (
          <button
            key={s.label}
            onClick={() => document.getElementById(s.anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="bg-white rounded-2xl border border-obsidian-100 p-5 shadow-card text-left w-full hover:shadow-md hover:border-obsidian-200 transition-all cursor-pointer"
          >
            <p className={`text-2xl font-display ${s.color}`}>
              {loading ? '—' : s.value}
            </p>
            <p className="text-xs text-obsidian-400 mt-0.5">{s.label}</p>
          </button>
        ))}
      </div>

      {/* ── 🔴 Ação necessária ─────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
          <h2 className="font-semibold text-sm uppercase tracking-widest text-obsidian-500">
            Ação necessária agora
          </h2>
        </div>
        <div className="space-y-4">

          {/* Aguardando etiqueta */}
          <div id="section-label" className="bg-white rounded-2xl border border-obsidian-100 shadow-card">
              <div className="flex items-center justify-between px-5 py-4 border-b border-obsidian-100">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-base text-ink">Aguardando Etiqueta</h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                    {loading ? '…' : awaitingLabel.length}
                  </span>
                </div>
                {awaitingLabel.length > 0 && (
                  <div className="flex items-center gap-2">
                    {hasSelectedWithLabel && (
                      <Button size="sm" variant="outline" onClick={handlePrintLabels}>
                        Imprimir selecionadas
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={handleBatchLabels}
                      loading={generatingLabels}
                      disabled={selectedLabels.size === 0}
                    >
                      Gerar etiquetas ({selectedLabels.size})
                    </Button>
                  </div>
                )}
              </div>

              <div className="p-2">
                {loading ? (
                  [1, 2, 3].map((i) => <Skeleton key={i} className="h-12 m-3 rounded-xl" />)
                ) : awaitingLabel.length === 0 ? (
                  <p className="text-sm text-obsidian-400 px-4 py-4">Nenhum pedido aguardando etiqueta.</p>
                ) : (
                  <>
                    <div className="flex items-center gap-3 px-4 py-2 border-b border-obsidian-50">
                      <input
                        type="checkbox"
                        checked={selectedLabels.size === awaitingLabel.length && awaitingLabel.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded accent-amber-600 cursor-pointer"
                      />
                      <span className="text-xs text-obsidian-400">Selecionar todos</span>
                    </div>
                    {awaitingLabel.map((order) => {
                      const result = labelResults[order.id]
                      return (
                        <div
                          key={order.id}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-obsidian-50 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedLabels.has(order.id)}
                            onChange={() => toggleLabel(order.id)}
                            className="w-4 h-4 rounded accent-amber-600 cursor-pointer shrink-0"
                          />
                          <Link to={`/ops/orders/${order.id}`} className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-ink font-mono">
                              #{order.id.slice(-8).toUpperCase()}
                            </p>
                            <p className="text-xs text-obsidian-400 mt-0.5">
                              {order.user?.fullName || `ID ${order.userId.slice(-8).toUpperCase()}`}
                              {order.shippingServiceName ? ` · ${order.shippingServiceName}` : ''}
                            </p>
                          </Link>
                          <div className="flex items-center gap-3 shrink-0">
                            {result && (
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                result.success
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {result.success ? '✓ Gerada' : '✗ Falhou'}
                              </span>
                            )}
                            <span className="text-xs text-obsidian-400">{formatDateTime(order.createdAt)}</span>
                            <span className="text-sm font-medium text-ink">{formatCurrency(order.total)}</span>
                          </div>
                        </div>
                      )
                    })}
                  </>
                )}
              </div>
            </div>

            {/* Pronto para retirada */}
            <div id="section-pickup" className="bg-white rounded-2xl border border-obsidian-100 shadow-card">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-obsidian-100">
                <h3 className="font-display text-base text-ink">Pronto para Retirada</h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  {loading ? '…' : readyForPickup.length}
                </span>
              </div>
              <div className="p-2">
                {loading ? (
                  [1, 2].map((i) => <Skeleton key={i} className="h-12 m-3 rounded-xl" />)
                ) : readyForPickup.length === 0 ? (
                  <p className="text-sm text-obsidian-400 px-4 py-4">Nenhum cliente aguardando retirada.</p>
                ) : (
                  readyForPickup.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-obsidian-50 transition-colors"
                    >
                      <Link to={`/ops/orders/${order.id}`} className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink font-mono">
                          #{order.id.slice(-8).toUpperCase()}
                        </p>
                        <p className="text-xs text-obsidian-400 mt-0.5">
                          {order.user?.fullName || `ID ${order.userId.slice(-8).toUpperCase()}`}
                          {order.pickupLocation
                            ? ` · ${pickupLocationLabel[order.pickupLocation] ?? order.pickupLocation}`
                            : ''}
                        </p>
                      </Link>
                      <Button
                        size="sm"
                        onClick={() => handleConfirmPickup(order.id)}
                        loading={confirmingPickup[order.id]}
                      >
                        Confirmar retirada
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </section>

      {/* ── 🟡 Acompanhar ──────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 shrink-0" />
          <h2 className="font-semibold text-sm uppercase tracking-widest text-obsidian-500">
            Acompanhar
          </h2>
        </div>
        <div className="space-y-4">

          {/* Em trânsito */}
          <div id="section-transit" className="bg-white rounded-2xl border border-obsidian-100 shadow-card">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-obsidian-100">
              <h3 className="font-display text-base text-ink">Em Trânsito</h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                {loading ? '…' : inTransit.length}
              </span>
            </div>
            <div className="p-2">
              {loading ? (
                [1, 2, 3].map((i) => <Skeleton key={i} className="h-12 m-3 rounded-xl" />)
              ) : inTransit.length === 0 ? (
                <p className="text-sm text-obsidian-400 px-4 py-4">Nenhum pedido em trânsito.</p>
              ) : (
                inTransit.map((order) => (
                  <Link
                    key={order.id}
                    to={`/ops/orders/${order.id}`}
                    className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-obsidian-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink font-mono">
                        #{order.id.slice(-8).toUpperCase()}
                      </p>
                      <p className="text-xs text-obsidian-400 mt-0.5">
                        {order.user?.fullName || `ID ${order.userId.slice(-8).toUpperCase()}`}
                        {order.shippingServiceName ? ` · ${order.shippingServiceName}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-obsidian-400">{formatDateTime(order.createdAt)}</span>
                      <span className="text-sm font-medium text-ink">{formatCurrency(order.total)}</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Aguardando preparo de retirada */}
          {awaitingPickupPrep.length > 0 && (
            <div className="bg-white rounded-2xl border border-obsidian-100 shadow-card">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-obsidian-100">
                <h3 className="font-display text-base text-ink">Retirada — Preparar</h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-obsidian-100 text-obsidian-600">
                  {awaitingPickupPrep.length}
                </span>
              </div>
              <div className="p-2">
                {awaitingPickupPrep.map((order) => (
                  <Link
                    key={order.id}
                    to={`/ops/orders/${order.id}`}
                    className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-obsidian-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink font-mono">
                        #{order.id.slice(-8).toUpperCase()}
                      </p>
                      <p className="text-xs text-obsidian-400 mt-0.5">
                        {order.user?.fullName || `ID ${order.userId.slice(-8).toUpperCase()}`}
                        {order.pickupLocation
                          ? ` · ${pickupLocationLabel[order.pickupLocation] ?? order.pickupLocation}`
                          : ''}
                      </p>
                    </div>
                    <span className="text-champagne-600 text-sm shrink-0">→</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>
      </section>

      {/* ── ✅ Concluído hoje ──────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
          <h2 className="font-semibold text-sm uppercase tracking-widest text-obsidian-500">
            Concluído hoje
          </h2>
        </div>
        <div id="section-delivered" className="bg-white rounded-2xl border border-obsidian-100 shadow-card">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-obsidian-100">
            <h3 className="font-display text-base text-ink">Entregues</h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
              {loading ? '…' : deliveredToday.length}
            </span>
          </div>
          <div className="p-2">
            {loading ? (
              [1].map((i) => <Skeleton key={i} className="h-12 m-3 rounded-xl" />)
            ) : deliveredToday.length === 0 ? (
              <p className="text-sm text-obsidian-400 px-4 py-4">Nenhuma entrega concluída hoje.</p>
            ) : (
              deliveredToday.map((order) => (
                <Link
                  key={order.id}
                  to={`/ops/orders/${order.id}`}
                  className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-obsidian-50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink font-mono">
                      #{order.id.slice(-8).toUpperCase()}
                    </p>
                    <p className="text-xs text-obsidian-400 mt-0.5">
                      {order.user?.fullName || `ID ${order.userId.slice(-8).toUpperCase()}`}
                    </p>
                  </div>
                  <span className="text-xs text-obsidian-400 shrink-0">{formatDateTime(order.createdAt)}</span>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

// ─── OpsOrdersPage ────────────────────────────────────────────────────────────

export function OpsOrdersPage() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ordersApi.list()
      .then((r) => setOrders(r.orders))
      .catch(() => toast('Erro ao carregar pedidos', 'error'))
      .finally(() => setLoading(false))
  }, [toast])

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-obsidian-400 mb-1">Operações</p>
        <h1 className="font-display text-3xl text-ink">Pedidos</h1>
      </div>

      <div className="bg-white rounded-2xl border border-obsidian-100 shadow-card">
        <div className="p-2">
          {loading
            ? [1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 m-3 rounded-xl" />)
            : orders.length === 0
              ? <EmptyState title="Nenhum pedido encontrado" />
              : orders.map((order) => (
                <Link
                  key={order.id}
                  to={`/ops/orders/${order.id}`}
                  className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-obsidian-50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink font-mono">
                      #{order.id.slice(-8).toUpperCase()}
                    </p>
                    <p className="text-xs text-obsidian-400 mt-0.5">
                      {order.user?.fullName || `ID ${order.userId.slice(-8).toUpperCase()}`}
                      {order.shippingServiceName ? ` · ${order.shippingServiceName}` : ''}
                      {order.pickupLocation
                        ? ` · ${pickupLocationLabel[order.pickupLocation] ?? order.pickupLocation}`
                        : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${getOrderDisplayStatusColor(order, null)}`}>
                      {getOrderDisplayStatusLabel(order, null)}
                    </span>
                    <span className="text-xs text-obsidian-400">{formatDateTime(order.createdAt)}</span>
                    <span className="text-sm font-medium text-ink">{formatCurrency(order.total)}</span>
                  </div>
                </Link>
              ))
          }
        </div>
      </div>
    </div>
  )
}

// ─── OpsOrderDetailPage ───────────────────────────────────────────────────────

export function OpsOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [order, setOrder]         = useState<Order | null>(null)
  const [shipment, setShipment]   = useState<Shipment | null>(null)
  const [shipmentSelection, setShipmentSelection] = useState<ShipmentSelection | null>(null)
  const [shippingDestination, setShippingDestination] = useState<ShippingDestination | null>(null)
  const [loading, setLoading]     = useState(true)
  const [shipmentLoading, setShipmentLoading] = useState(false)
  const [processingLabel, setProcessingLabel]   = useState(false)
  const [markingReady, setMarkingReady]         = useState(false)
  const [confirmingCollection, setConfirmingCollection] = useState(false)

  useEffect(() => {
    if (!id) return
    ordersApi.getById(id)
      .then((r) => setOrder(r.order))
      .catch(() => toast('Erro ao carregar pedido', 'error'))
      .finally(() => setLoading(false))
  }, [id, toast])

  const reloadShipment = useCallback(async () => {
    if (!id) return
    setShipmentLoading(true)
    try {
      const r = await ordersApi.getShipment(id)
      setShipment(r.shipment)
      setShipmentSelection(r.selection ?? null)
      setShippingDestination(r.destination ?? r.selection?.destination ?? null)
    } catch {
      setShipment(null)
    } finally {
      setShipmentLoading(false)
    }
  }, [id])

  useEffect(() => { reloadShipment() }, [reloadShipment])

  const handleProcessLabel = async () => {
    if (!id) return
    setProcessingLabel(true)
    try {
      await shippingApi.createLabel(id)
      toast('Etiqueta processada com sucesso', 'success')
      await reloadShipment()
    } catch (err) {
      const mapped = mapShippingLabelError(err)
      toast(`${mapped.title}: ${mapped.message}`, 'error')
      await reloadShipment()
    } finally {
      setProcessingLabel(false)
    }
  }

  const handleMarkReady = async () => {
    if (!id) return
    setMarkingReady(true)
    try {
      await shippingApi.markPickupReady(id)
      toast('Pedido marcado como pronto para retirada!', 'success')
      await reloadShipment()
    } catch (err) {
      toast((err as ApiError).message || 'Não foi possível marcar o pedido como pronto.', 'error')
    } finally {
      setMarkingReady(false)
    }
  }

  const handleConfirmCollection = async () => {
    if (!id) return
    setConfirmingCollection(true)
    try {
      await shippingApi.confirmCollection(id)
      toast('Retirada confirmada com sucesso!', 'success')
      setOrder((prev) => prev ? { ...prev, status: 'delivered' } : prev)
      await reloadShipment()
    } catch (err) {
      toast((err as ApiError).message || 'Erro ao confirmar retirada', 'error')
    } finally {
      setConfirmingCollection(false)
    }
  }

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>
  if (!order) return <EmptyState title="Pedido não encontrado" />

  const isPickup = order.shippingProvider === 'STORE_PICKUP'

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate(-1)} className="text-champagne-600 hover:underline text-sm">
          ← Voltar
        </button>
        <span className="text-obsidian-300">/</span>
        <h1 className="font-display text-2xl text-ink">#{order.id.slice(-8).toUpperCase()}</h1>
        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${getOrderDisplayStatusColor(order, shipment)}`}>
          {getOrderDisplayStatusLabel(order, shipment)}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Coluna principal ───────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Itens */}
          <div className="bg-white rounded-2xl border border-obsidian-100 shadow-card p-6">
            <h2 className="font-display text-lg text-ink mb-4">Itens do Pedido</h2>
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-start gap-4 py-2.5 border-b border-obsidian-50 last:border-0 text-sm"
              >
                <div>
                  <p className="text-obsidian-700 font-medium">
                    {item.product?.name || `Produto ${item.productId.slice(-8).toUpperCase()}`}
                  </p>
                  <p className="text-xs text-obsidian-500 mt-0.5">
                    {item.quantity} × {formatCurrency(item.price)}
                  </p>
                </div>
                <span className="font-medium text-ink">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
            {typeof order.shippingAmountCents === 'number' && order.shippingAmountCents > 0 && (
              <div className="flex justify-between py-2.5 border-b border-obsidian-50 text-sm">
                <span className="text-obsidian-700">
                  Frete{order.shippingServiceName ? ` (${order.shippingServiceName})` : ''}
                </span>
                <span>{formatCurrency(order.shippingAmountCents / 100)}</span>
              </div>
            )}
            <div className="flex justify-between pt-3 font-medium text-ink">
              <span>Total</span>
              <span className="font-display text-lg">{formatCurrency(order.total)}</span>
            </div>
          </div>

          {/* Entrega e rastreio */}
          <div className="bg-white rounded-2xl border border-obsidian-100 shadow-card p-6 space-y-3">
            <h2 className="font-display text-lg text-ink">Entrega e Rastreio</h2>
            {shipmentLoading ? (
              <p className="text-sm text-obsidian-500">Carregando dados de entrega...</p>
            ) : !shipment ? (
              <p className="text-sm text-obsidian-500">
                {shipmentSelection
                  ? `Frete selecionado: ${shipmentSelection.serviceName ?? '—'} — etiqueta ainda não gerada.`
                  : 'Nenhum envio registrado para este pedido.'}
              </p>
            ) : (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-obsidian-500">Status</span>
                  <span className="font-medium text-ink">{shipmentStatusLabel[shipment.status] ?? shipment.status}</span>
                </div>
                {(shipment.serviceName || shipmentSelection?.serviceName || order.shippingServiceName) && (
                  <div className="flex justify-between text-sm">
                    <span className="text-obsidian-500">Serviço</span>
                    <span className="font-medium text-ink">
                      {shipment.serviceName || shipmentSelection?.serviceName || order.shippingServiceName}
                    </span>
                  </div>
                )}
                {isPickup && order.pickupLocation && (
                  <div className="flex justify-between text-sm">
                    <span className="text-obsidian-500">Ponto de retirada</span>
                    <span className="font-medium text-ink">
                      {pickupLocationLabel[order.pickupLocation] ?? order.pickupLocation}
                    </span>
                  </div>
                )}
                {shipment.status === 'ready_for_pickup' && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                    <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                      Pronto para retirada
                    </p>
                    <p className="text-sm text-emerald-700 mt-0.5">
                      Cliente pode retirar em{' '}
                      {order.pickupLocation
                        ? (pickupLocationLabel[order.pickupLocation] ?? order.pickupLocation)
                        : 'loja'}
                      .
                    </p>
                  </div>
                )}
                {shipment.trackingCode && (
                  <div className="flex justify-between text-sm">
                    <span className="text-obsidian-500">Tracking</span>
                    <span className="font-mono text-xs text-ink">{shipment.trackingCode}</span>
                  </div>
                )}
                {(shipment.labelPdfUrl || shipment.labelUrl) && (
                  <a
                    href={shipment.labelPdfUrl || shipment.labelUrl || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-emerald-600 hover:underline"
                  >
                    Imprimir etiqueta →
                  </a>
                )}
                {shipment.status === 'failed' && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-1.5">
                    <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">
                      Falha na geração da etiqueta
                    </p>
                    <p className="text-sm text-red-700">{shipment.lastError || 'Erro desconhecido'}</p>
                    <p className="text-xs text-red-600">Tentativas: {shipment.retryCount ?? 0}</p>
                    {shipment.nextRetryAt && !shipment.dlqAt && (
                      <p className="text-xs text-red-600">
                        Próxima tentativa: {formatDateTime(shipment.nextRetryAt)}
                      </p>
                    )}
                    {shipment.dlqAt && (
                      <p className="text-xs font-semibold text-red-800">
                        Falha definitiva — requer intervenção manual
                      </p>
                    )}
                  </div>
                )}
                {shipment.events && shipment.events.length > 0 && (
                  <div className="pt-1 space-y-2">
                    <p className="text-xs uppercase tracking-wide text-obsidian-400">Eventos</p>
                    <div className="space-y-2 max-h-44 overflow-y-auto">
                      {shipment.events.slice(0, 10).map((event) => (
                        <div
                          key={`${event.id || event.eventType}-${event.occurredAt}`}
                          className="rounded-lg border border-obsidian-100 p-2.5 bg-obsidian-50/40"
                        >
                          <p className="text-xs font-medium text-ink">{event.description || event.eventType}</p>
                          <p className="text-2xs text-obsidian-500 mt-0.5">{formatDateTime(event.occurredAt)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Sidebar de ações ───────────────────────────────── */}
        <div className="space-y-4">

          {/* Ações operacionais */}
          <div className="bg-white rounded-2xl border border-obsidian-100 shadow-card p-5 space-y-3">
            <h2 className="font-display text-lg text-ink">Ações</h2>

            {isPickup ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleMarkReady}
                  loading={markingReady}
                  fullWidth
                  disabled={
                    shipment?.status === 'ready_for_pickup' ||
                    shipment?.status === 'delivered'
                  }
                >
                  {shipment?.status === 'ready_for_pickup'
                    ? 'Já marcado como pronto'
                    : 'Marcar pronto para retirada'}
                </Button>
                <Button
                  onClick={handleConfirmCollection}
                  loading={confirmingCollection}
                  fullWidth
                  disabled={shipment?.status !== 'ready_for_pickup'}
                >
                  Confirmar retirada pelo cliente
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={handleProcessLabel}
                loading={processingLabel}
                fullWidth
                disabled={shipment?.status === 'label_purchased' || shipment?.status === 'delivered'}
              >
                {shipment?.status === 'label_purchased' ? 'Etiqueta já gerada' : 'Processar Etiqueta'}
              </Button>
            )}
          </div>

          {/* Resumo do pedido */}
          <div className="bg-white rounded-2xl border border-obsidian-100 shadow-card p-5 space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-obsidian-500">Criado em</span>
              <span>{formatDateTime(order.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-obsidian-500">Cliente</span>
              <span className="text-right">
                {order.user?.fullName || `ID ${order.userId.slice(-8).toUpperCase()}`}
              </span>
            </div>
            {order.user?.email && (
              <div className="flex justify-between gap-2">
                <span className="text-obsidian-500">E-mail</span>
                <span className="text-right break-all">{order.user.email}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-obsidian-500">CEP</span>
              <span>{formatZipCode(shippingDestination?.zip || order.shippingDestinationZip)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-obsidian-500">Endereço</span>
              <span className="text-right">{formatAddressLine(shippingDestination)}</span>
            </div>
            {shippingDestination?.district && (
              <div className="flex justify-between gap-2">
                <span className="text-obsidian-500">Bairro</span>
                <span className="text-right">{shippingDestination.district}</span>
              </div>
            )}
            {(shippingDestination?.city || shippingDestination?.state) && (
              <div className="flex justify-between gap-2">
                <span className="text-obsidian-500">Cidade/UF</span>
                <span className="text-right">
                  {[shippingDestination?.city, shippingDestination?.state].filter(Boolean).join(' / ')}
                </span>
              </div>
            )}
            {isPickup && order.pickupLocation && (
              <div className="flex justify-between gap-2">
                <span className="text-obsidian-500">Retirada</span>
                <span className="text-right font-medium">
                  {pickupLocationLabel[order.pickupLocation] ?? order.pickupLocation}
                </span>
              </div>
            )}
            {!isPickup && (order.shippingServiceName || shipmentSelection?.serviceName) && (
              <div className="flex justify-between gap-2">
                <span className="text-obsidian-500">Serviço</span>
                <span className="text-right">
                  {order.shippingServiceName || shipmentSelection?.serviceName}
                </span>
              </div>
            )}
            {order.couponCode && (
              <div className="flex justify-between">
                <span className="text-obsidian-500">Cupom</span>
                <span className="font-mono text-champagne-600">{order.couponCode}</span>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
