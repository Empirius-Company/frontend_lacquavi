import { v4 as uuidv4 } from 'uuid'

// ─── UUID ─────────────────────────────────────────────────────────────────────
export const generateIdempotencyKey = (): string => uuidv4()

// ─── Currency Formatting ──────────────────────────────────────────────────────
export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)

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
