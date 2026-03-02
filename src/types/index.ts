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
  createdAt: string
  createdBy: string
  categoryId: string | null
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
}

export interface Order {
  id: string
  userId: string
  subtotal: number
  discountTotal: number
  couponCode: string | null
  couponId: string | null
  total: number
  status: OrderStatus
  paymentId: string | null
  paymentStatus: PaymentStatus | null
  createdAt: string
  items: OrderItem[]
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

export interface Payment {
  id: string
  orderId: string
  provider: string
  providerPaymentId: string | null
  amount: number
  currency: string
  status: PaymentStatus
  createdAt: string
  updatedAt: string
  qr_code?: string | null
  qr_code_base64?: string | null
  ticket_url?: string | null
  expiresAt?: string | null
  isExpired?: boolean
  order?: Partial<Order>
  refunds?: Refund[]
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
