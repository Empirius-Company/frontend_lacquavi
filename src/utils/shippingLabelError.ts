type ShippingApiError = {
  error?: string
  code?: string
  details?: {
    shipmentId?: string
    retryCount?: number
    nextRetryAt?: string | null
    dlqAt?: string | null
  }
}

export function mapShippingLabelError(err: unknown) {
  const responseData = (err as { response?: { data?: ShippingApiError } })?.response?.data
  const data: ShippingApiError = responseData ?? {}
  const code = data.code || 'SHIPPING_UNKNOWN_ERROR'
  const raw = data.error || 'Falha ao gerar etiqueta'

  if (code === 'SHIPPING_LABEL_PURCHASE_FAILED') {
    return {
      title: 'Falha ao comprar etiqueta',
      message: raw,
      code,
      details: data.details || null,
    }
  }

  if (code === 'SHIPPING_PAYMENT_NOT_APPROVED') {
    return { title: 'Pagamento pendente', message: raw, code, details: data.details || null }
  }

  if (code === 'SHIPPING_SELECTION_REQUIRED') {
    return { title: 'Frete não selecionado', message: raw, code, details: data.details || null }
  }

  return { title: 'Erro de frete', message: raw, code, details: data.details || null }
}
