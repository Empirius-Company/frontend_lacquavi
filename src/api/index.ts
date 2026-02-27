import { httpClient } from './httpClient'
import type { Order, OrderStatus, Payment, Coupon, CouponValidation, HealthStatus, Refund } from '../types'

// ─── Orders API ───────────────────────────────────────────────────────────────
interface CreateOrderInput {
  items: { productId: string; quantity: number }[]
  couponCode?: string
  idempotencyKey?: string
}
interface OrdersResponse { total: number; orders: Order[] }
interface OrderResponse  { message?: string; order: Order; replayed?: boolean; correlationId?: string }

export const ordersApi = {
  create: ({ items, couponCode, idempotencyKey }: CreateOrderInput): Promise<OrderResponse> =>
    httpClient.post<OrderResponse>(
      '/orders',
      { items, ...(couponCode ? { couponCode } : {}) },
      idempotencyKey ? { headers: { 'Idempotency-Key': idempotencyKey } } : {}
    ),

  list: (): Promise<OrdersResponse> =>
    httpClient.get<OrdersResponse>('/orders'),

  getById: (id: string): Promise<{ order: Order }> =>
    httpClient.get<{ order: Order }>(`/orders/${id}`),

  updateStatus: (id: string, status: OrderStatus): Promise<OrderResponse> =>
    httpClient.put<OrderResponse>(`/orders/${id}/status`, { status }),

  cancel: (id: string): Promise<OrderResponse> =>
    httpClient.delete<OrderResponse>(`/orders/${id}`),
}

// ─── Payments API ─────────────────────────────────────────────────────────────
interface CreatePaymentInput {
  orderId: string
  paymentMethodId: string
  cardToken?: string
  idempotencyKey: string
}
interface PaymentResponse {
  message: string
  payment: Payment
  replayed?: boolean
  correlationId?: string
}
interface PaymentsListResponse { payments: Payment[]; count: number; correlationId?: string }
interface RefundResponse {
  message: string
  refund: Refund
  paymentStatus: string
  replayed?: boolean
  correlationId?: string
}

export const paymentsApi = {
  create: ({ orderId, paymentMethodId, cardToken, idempotencyKey }: CreatePaymentInput): Promise<PaymentResponse> =>
    httpClient.post<PaymentResponse>(
      '/api/payments',
      { orderId, paymentMethodId, ...(cardToken ? { cardToken } : {}) },
      { headers: { 'Idempotency-Key': idempotencyKey } }
    ),

  list: (): Promise<PaymentsListResponse> =>
    httpClient.get<PaymentsListResponse>('/api/payments'),

  getById: (id: string): Promise<{ payment: Payment; correlationId?: string }> =>
    httpClient.get<{ payment: Payment; correlationId?: string }>(`/api/payments/${id}`),

  refund: (id: string, opts: { amount?: number; idempotencyKey: string }): Promise<RefundResponse> =>
    httpClient.post<RefundResponse>(
      `/api/payments/${id}/refunds`,
      opts.amount !== undefined ? { amount: opts.amount } : {},
      { headers: { 'Idempotency-Key': opts.idempotencyKey } }
    ),
}

// ─── Coupons API ──────────────────────────────────────────────────────────────
interface ValidateCouponInput { couponCode: string; subtotal: number }
interface CouponCreateInput {
  code: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  maxDiscountAmount?: number
  minOrderAmount?: number
  maxUses?: number
  maxUsesPerUser?: number
  validFrom: string
  validUntil: string
  active?: boolean
}
type CouponUpdateInput = Partial<CouponCreateInput>
interface CouponsListResponse { total: number; coupons: Coupon[] }

export const couponsApi = {
  validate: (data: ValidateCouponInput): Promise<CouponValidation> =>
    httpClient.post<CouponValidation>('/api/coupons/validate', data),

  create: (data: CouponCreateInput): Promise<{ message: string; coupon: Coupon }> =>
    httpClient.post<{ message: string; coupon: Coupon }>('/api/admin/coupons', data),

  list: (params?: { code?: string; active?: boolean }): Promise<CouponsListResponse> =>
    httpClient.get<CouponsListResponse>('/api/admin/coupons', { params }),

  update: (id: string, data: CouponUpdateInput): Promise<{ message: string; coupon: Coupon }> =>
    httpClient.patch<{ message: string; coupon: Coupon }>(`/api/admin/coupons/${id}`, data),
}

// ─── Health API ───────────────────────────────────────────────────────────────
export const healthApi = {
  get: (): Promise<HealthStatus> =>
    httpClient.get<HealthStatus>('/health'),
}
