import { v4 as uuidv4 } from 'uuid'
import type { Order, Product, Shipment } from '../types'

// ─── UUID ─────────────────────────────────────────────────────────────────────
export const generateIdempotencyKey = (): string => uuidv4()

// ─── Currency Formatting ──────────────────────────────────────────────────────
export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)

export const getProductBasePrice = (product: Pick<Product, 'price'>): number => {
  const basePrice = Number(product.price)
  if (!Number.isFinite(basePrice) || basePrice <= 0) return 0
  return basePrice
}

export const getProductDiscount = (product: Pick<Product, 'discount'>): number => {
  const discount = Math.max(0, Number(product.discount ?? 0))
  if (!Number.isFinite(discount) || discount <= 0) return 0
  return discount
}

export const getProductFinalPrice = (product: Pick<Product, 'price' | 'discount'>): number => {
  const basePrice = getProductBasePrice(product)
  if (basePrice <= 0) return 0
  const discount = getProductDiscount(product)
  return Math.max(0, basePrice - discount)
}

export const getProductPriceSummary = (product: Pick<Product, 'price' | 'discount'>) => {
  const basePrice = getProductBasePrice(product)
  const discount = getProductDiscount(product)
  const finalPrice = getProductFinalPrice(product)
  const hasDiscount = discount > 0 && finalPrice < basePrice
  const discountPercent = hasDiscount && basePrice > 0
    ? Math.round((discount / basePrice) * 100)
    : 0

  return {
    basePrice,
    discount,
    finalPrice,
    hasDiscount,
    discountPercent,
  }
}

// ─── Date Formatting ──────────────────────────────────────────────────────────
export const formatDate = (dateStr: string): string =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(dateStr))

export const formatDateTime = (dateStr: string): string =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))

export const formatRelativeTime = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)

  if (minutes < 1) return 'agora mesmo'
  if (minutes < 60) return `há ${minutes} min`
  if (hours < 24) return `há ${hours}h`
  if (days < 7) return `há ${days} dias`
  return formatDate(dateStr)
}

// ─── Status Labels ────────────────────────────────────────────────────────────
export const orderStatusLabel: Record<string, string> = {
  pending:    'Pendente',
  processing: 'Em processamento',
  shipped:    'Enviado',
  delivered:  'Entregue',
  cancelled:  'Cancelado',
}

export const paymentStatusLabel: Record<string, string> = {
  pending:    'Aguardando',
  authorized: 'Autorizado',
  paid:       'Pago',
  failed:     'Falhou',
  cancelled:  'Cancelado',
  refunded:   'Estornado',
  chargeback: 'Chargeback',
}

export const orderStatusColor: Record<string, string> = {
  pending:    'bg-amber-50 text-amber-700 border-amber-200',
  processing: 'bg-blue-50 text-blue-700 border-blue-200',
  shipped:    'bg-purple-50 text-purple-700 border-purple-200',
  delivered:  'bg-green-50 text-green-700 border-green-200',
  cancelled:  'bg-red-50 text-red-700 border-red-200',
}

export const paymentStatusColor: Record<string, string> = {
  pending:    'bg-amber-50 text-amber-700 border-amber-200',
  authorized: 'bg-blue-50 text-blue-700 border-blue-200',
  paid:       'bg-green-50 text-green-700 border-green-200',
  failed:     'bg-red-50 text-red-700 border-red-200',
  cancelled:  'bg-obsidian-50 text-obsidian-600 border-obsidian-200',
  refunded:   'bg-purple-50 text-purple-700 border-purple-200',
  chargeback: 'bg-orange-50 text-orange-700 border-orange-200',
}

export type OrderDisplayStatus =
  | Order['status']
  | 'paid_waiting_shipment'
  | 'paid_label_purchased'
  | 'paid_posted'
  | 'paid_in_transit'

const orderDisplayStatusLabel: Record<OrderDisplayStatus, string> = {
  pending: 'Pendente',
  processing: 'Em processamento',
  shipped: 'Enviado',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
  paid_waiting_shipment: 'Pago · aguardando envio',
  paid_label_purchased: 'Pago · etiqueta gerada',
  paid_posted: 'Pago · postado',
  paid_in_transit: 'Pago · em trânsito',
}

const orderDisplayStatusColor: Record<OrderDisplayStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  processing: 'bg-blue-50 text-blue-700 border-blue-200',
  shipped: 'bg-purple-50 text-purple-700 border-purple-200',
  delivered: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  paid_waiting_shipment: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  paid_label_purchased: 'bg-teal-50 text-teal-700 border-teal-200',
  paid_posted: 'bg-sky-50 text-sky-700 border-sky-200',
  paid_in_transit: 'bg-indigo-50 text-indigo-700 border-indigo-200',
}

const isPaidOrder = (order: Pick<Order, 'paymentStatus'>): boolean =>
  order.paymentStatus === 'paid' || order.paymentStatus === 'authorized'

export const getOrderDisplayStatus = (
  order: Pick<Order, 'status' | 'paymentStatus'>,
  shipment?: Pick<Shipment, 'status'> | null,
): OrderDisplayStatus => {
  if (order.status === 'cancelled') return 'cancelled'
  if (order.status === 'delivered' || shipment?.status === 'delivered') return 'delivered'

  if (!isPaidOrder(order)) {
    return order.status
  }

  switch (shipment?.status) {
    case 'label_purchased':
      return 'paid_label_purchased'
    case 'posted':
      return 'paid_posted'
    case 'in_transit':
      return 'paid_in_transit'
    case 'pending':
      return 'paid_waiting_shipment'
    case 'failed':
    case 'cancelled':
      return 'processing'
    default:
      return order.status === 'shipped' ? 'shipped' : 'paid_waiting_shipment'
  }
}

export const getOrderDisplayStatusLabel = (
  order: Pick<Order, 'status' | 'paymentStatus'>,
  shipment?: Pick<Shipment, 'status'> | null,
): string => orderDisplayStatusLabel[getOrderDisplayStatus(order, shipment)]

export const getOrderDisplayStatusColor = (
  order: Pick<Order, 'status' | 'paymentStatus'>,
  shipment?: Pick<Shipment, 'status'> | null,
): string => orderDisplayStatusColor[getOrderDisplayStatus(order, shipment)]

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const truncate = (str: string, max: number): string =>
  str.length > max ? `${str.slice(0, max)}…` : str

export const slugify = (str: string): string =>
  str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
