// ─── Home Tiles ──────────────────────────────────────────────────────────────
export type HomeTileKey = 'perfumes' | 'hidratantes' | 'mais-vendidos' | 'lancamentos'

export interface HomeTile {
  key: HomeTileKey
  imageUrl: string | null
  updatedAt: string
}

// ─── User ────────────────────────────────────────────────────────────────────
export interface User {
  id: string
  name: string
  email: string
  phone?: string | null
  role: 'customer' | 'admin'
  createdAt: string
}

// ─── Auth Tokens ─────────────────────────────────────────────────────────────
export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

// ─── API Error ────────────────────────────────────────────────────────────────
export interface ApiError {
  message: string
  statusCode?: number
  code?: string
  retryAfter?: number
}

// ─── Category ─────────────────────────────────────────────────────────────────
export interface Category {
  id: string
  name: string
  slug: string
  displayOrder: number
}

export interface Subcategory {
  id: string
  name: string
  slug: string
  categoryId: string
}

export interface ProductImage {
  id: string
  url: string
  alt: string | null
  position: number
  isPrimary: boolean
  createdAt: string
  updatedAt: string
}

// ─── Product ──────────────────────────────────────────────────────────────────
export interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  discount?: number | null
  stock: number
  images: ProductImage[]
  brand: string | null
  volume: string | null
  gender: 'masculino' | 'feminino' | 'unissex' | null
  olfactoryFamily: string | null
  requiresShipping?: boolean
  weightGrams?: number | null
  createdAt: string
  createdBy: string
  categoryId: string | null
  subcategoryId?: string | null
  isActive?: boolean
}

// ─── Product Reviews ──────────────────────────────────────────────────────────
export interface ProductReviewUser {
  id: string
  name: string
}

export interface ProductReview {
  id: string
  rating: number
  comment: string
  createdAt: string
  updatedAt: string
  user: ProductReviewUser
}

export interface ProductReviewStats {
  total: number
  averageRating: number
}

// ─── Order ────────────────────────────────────────────────────────────────────
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  quantity: number
  price: number
  product?: {
    id: string
    name: string
    slug?: string | null
    brand?: string | null
  }
}

export interface Order {
  id: string
  userId: string
  user?: {
    id: string
    name: string
    email: string
    phone?: string | null
  }
  subtotal: number
  discountTotal: number
  couponCode: string | null
  couponId: string | null
  total: number
  status: OrderStatus
  paymentId: string | null
  paymentStatus: PaymentStatus | null
  shippingProvider?: string | null
  shippingServiceCode?: string | null
  shippingServiceName?: string | null
  shippingQuoteId?: string | null
  shippingAmountCents?: number | null
  shippingDiscountCents?: number | null
  shippingDestinationZip?: string | null
  shippingAddressHash?: string | null
  pickupLocation?: string | null
  createdAt: string
  items: OrderItem[]
}

export interface ShippingDestination {
  zip: string
  street: string
  number: string
  complement?: string
  district: string
  city: string
  state: string
}

export interface ShippingQuote {
  quoteId: string
  provider: string
  serviceCode: string
  serviceName: string
  priceCents: number
  deliveryDays: number
  expiresAt: string
}

export interface ShippingQuoteListResponse {
  quotes: ShippingQuote[]
}

export interface ShippingSelectionResponse {
  message: string
  selection: {
    orderId: string
    quoteId: string
    serviceCode: string
    serviceName: string
    shippingAmountCents: number
    shippingDiscountCents: number
    total: number
  }
}

export type ShipmentStatus =
  | 'pending'
  | 'label_purchased'
  | 'posted'
  | 'in_transit'
  | 'delivered'
  | 'failed'
  | 'cancelled'
  | 'ready_for_pickup'

export interface ShipmentEvent {
  id: string
  provider?: string
  providerEventId?: string
  eventType: string
  description?: string | null
  occurredAt: string
}

export interface Shipment {
  id: string
  orderId: string
  provider: string
  status: ShipmentStatus
  serviceCode?: string | null
  serviceName?: string | null
  priceCents?: number | null
  trackingCode?: string | null
  labelUrl?: string | null
  labelPdfUrl?: string | null
  packageWeightGrams?: number | null
  packageLengthCm?: number | null
  packageWidthCm?: number | null
  packageHeightCm?: number | null
  lastError?: string | null
  retryCount?: number
  nextRetryAt?: string | null
  dlqAt?: string | null
  events?: ShipmentEvent[]
}

export interface ShipmentSelection {
  quoteId?: string | null
  quoteCreatedAt?: string | null
  provider?: string | null
  serviceCode?: string | null
  serviceName?: string | null
  shippingAmountCents?: number | null
  shippingDiscountCents?: number | null
  destination?: ShippingDestination | null
}

export interface OrderShipmentResponse {
  orderId: string
  shipment: Shipment | null
  selection?: ShipmentSelection | null
  destination?: ShippingDestination | null
}

// ─── Payment ──────────────────────────────────────────────────────────────────
export type PaymentStatus =
  | 'pending'
  | 'authorized'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'refunded'
  | 'chargeback'

export interface InstallmentOption {
  installments: number
  installmentRate: number
  installmentAmount: number
  totalAmount: number
  hasInterest: boolean
  label: string
}

export interface PaymentAttempt {
  id: string
  resultStatus: string
  statusDetail: string | null
  createdAt: string
}

export interface Payment {
  id: string
  orderId: string
  provider: string
  providerPaymentId: string | null
  amount: number
  currency: string
  status: PaymentStatus
  statusDetail?: string | null
  installments: number
  installmentAmount: number | null
  createdAt: string
  updatedAt: string
  qr_code?: string | null
  qr_code_base64?: string | null
  ticket_url?: string | null
  expiresAt?: string | null
  isExpired?: boolean
  three_ds_info?: { external_resource_url: string } | null
  order?: Partial<Order>
  refunds?: Refund[]
  attempts?: PaymentAttempt[]
}

export interface Refund {
  id: string
  paymentId: string
  providerRefundId: string
  amount: number
  status: 'pending' | 'succeeded' | 'failed'
  createdAt: string
  updatedAt: string
}

// ─── Coupon ───────────────────────────────────────────────────────────────────
export type DiscountType = 'percentage' | 'fixed'

export interface Coupon {
  id: string
  code: string
  discountType: DiscountType
  discountValue: number
  maxDiscountAmount: number | null
  minOrderAmount: number | null
  maxUses: number | null
  maxUsesPerUser: number | null
  usedCount: number
  validFrom: string
  validUntil: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface CouponValidation {
  valid: boolean
  coupon: Pick<Coupon, 'id' | 'code' | 'discountType' | 'discountValue' | 'maxDiscountAmount'>
  subtotal: number
  discount: number
  finalTotal: number
}

// ─── Banner ───────────────────────────────────────────────────────────────────
export type BannerType = 'flash_sale' | string
export type BannerStatus = 'active' | 'paused' | string

export interface BannerProduct {
  id: string
  name: string
  slug?: string | null
  price: number
  discount?: number
  promotionalPrice?: number | null
  images: ProductImage[]
}

export interface Banner {
  id: string
  title: string
  productId?: string
  subtitle?: string | null
  imageUrl?: string | null
  backgroundColor?: string | null
  textColor?: string | null
  ctaText?: string | null
  ctaLink?: string | null
  startDate: string
  endDate: string
  showTimer: boolean
  priority?: number
  type: BannerType
  status: BannerStatus
  viewCount?: number
  clickCount?: number
  product?: BannerProduct | null
  createdAt?: string
  updatedAt?: string
}

// ─── Cart ─────────────────────────────────────────────────────────────────────
export interface CartItem {
  productId: string
  product: Product
  quantity: number
}

// ─── Health ───────────────────────────────────────────────────────────────────
export interface HealthStatus {
  ok: boolean
  service: string
  workers: {
    paymentEventWorker: boolean
    paymentReconciliation: boolean
  }
  timestamp: string
}
