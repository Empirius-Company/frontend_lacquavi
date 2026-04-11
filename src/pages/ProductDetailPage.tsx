import { FormEvent, useCallback, useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { productsApi } from '../api/catalogApi'
import { shippingApi } from '../api'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { Button } from '../components/ui'
import { formatCurrency, getProductPriceSummary } from '../utils'
import { getOrderedGallery, getProductPrimaryImage } from '../utils/productImages'
import type { ApiError, Product, ProductImage, ProductReview, ProductReviewStats, ShippingQuote } from '../types'

const PRODUCT_DETAIL_ZIP_CACHE_KEY = 'lacquavi_product_detail_zip'
const PENDING_REVIEW_KEY = 'lacquavi_pending_review'


function FloatingBuyBar({ product, onAdd, onVisibilityChange }: { product: Product, onAdd: () => void, onVisibilityChange?: (v: boolean) => void }) {
  const [isVisible, setIsVisible] = useState(false)
  const pricing = getProductPriceSummary(product)
  const primaryImage = getProductPrimaryImage(product)

  useEffect(() => {
    const toggleVisibility = () => {
      const visible = window.scrollY > 600
      setIsVisible(visible)
      onVisibilityChange?.(visible)
    }
    window.addEventListener('scroll', toggleVisibility)
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [onVisibilityChange])

  if (!isVisible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.05)] z-40 transform transition-transform animate-slide-up">
      <div className="container-page py-3">
        <div className="flex justify-between items-center max-w-5xl mx-auto">
          <div className="flex items-center gap-4 hidden md:flex">
            <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center pb-1">
              {primaryImage?.url ? <img src={primaryImage.url} className="max-h-full" alt={primaryImage.alt || product.name} /> : product.name.charAt(0)}
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">{product.brand || 'DIVERSOS'}</p>
              <p className="text-sm font-semibold truncate max-w-[200px]">{product.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-6 justify-end flex-1 md:flex-none">
            <div className="text-right">
              {pricing.hasDiscount && <p className="text-xs text-gray-400 line-through">{formatCurrency(pricing.basePrice)}</p>}
              <p className="text-lg font-bold text-black leading-none">{formatCurrency(pricing.finalPrice)} <span className="text-[10px] font-normal text-gray-500">no PIX</span></p>
            </div>

            <div className="flex items-center gap-4">
              <button onClick={onAdd} className="bg-[#2a7e51] hover:bg-[#236843] text-white px-8 py-2.5 rounded text-sm font-bold uppercase tracking-wide transition-colors">
                Comprar
              </button>
              <button className="text-gray-400 hover:text-[#2a7e51]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const formatReviewDate = (isoDate: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(isoDate))

const renderStars = (rating: number) => {
  const roundedRating = Math.max(0, Math.min(5, Math.round(rating)))
  return Array.from({ length: 5 }, (_, index) => (index < roundedRating ? '★' : '☆')).join('')
}

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { addItem } = useCart()
  const { toast } = useToast()

  const [product, setProduct] = useState<Product | null>(null)
  const [productImages, setProductImages] = useState<ProductImage[]>([])
  const [loading, setLoading] = useState(true)
  const [zipCode, setZipCode] = useState(() => {
    try {
      return localStorage.getItem(PRODUCT_DETAIL_ZIP_CACHE_KEY) ?? ''
    } catch {
      return ''
    }
  })
  const [reviews, setReviews] = useState<ProductReview[]>([])
  const [reviewsStats, setReviewsStats] = useState<ProductReviewStats>({ total: 0, averageRating: 0 })
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewForm, setReviewForm] = useState(() => {
    // Restaura review pendente salva antes de redirect para login
    try {
      const pending = sessionStorage.getItem(PENDING_REVIEW_KEY)
      if (pending) {
        sessionStorage.removeItem(PENDING_REVIEW_KEY)
        return JSON.parse(pending) as { rating: number; comment: string }
      }
    } catch { /* ignore */ }
    return { rating: 5, comment: '' }
  })
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [shippingLoading, setShippingLoading] = useState(false)
  const [shippingError, setShippingError] = useState('')
  const [shippingQuotes, setShippingQuotes] = useState<ShippingQuote[]>([])
  const [floatingBarVisible, setFloatingBarVisible] = useState(false)

const loadReviews = useCallback(async () => {
    if (!id) return
    setReviewsLoading(true)
    try {
      const response = await productsApi.listReviews(id)
      setReviews(response.reviews)
      setReviewsStats(response.stats)
    } catch (error) {
      const apiError = error as ApiError
      if (apiError.statusCode === 404 || apiError.statusCode === 500) {
        setReviews([])
        setReviewsStats({ total: 0, averageRating: 0 })
      } else {
        toast('Não foi possível carregar as avaliações do produto', 'warning')
      }
    } finally {
      setReviewsLoading(false)
    }
  }, [id, toast])

  useEffect(() => {
    if (!id) return
    setLoading(true)
    productsApi.getById(id)
      .then((productResponse) => {
        const resolvedImages = productResponse.images ?? []
        setProduct({ ...productResponse, images: resolvedImages })
        setProductImages(resolvedImages)
      })
      .catch((error) => {
        const apiError = error as ApiError
        if (apiError.statusCode === 404) {
          navigate('/products')
          return
        }

        toast('Não foi possível carregar o produto', 'error')
        navigate('/products')
      })
      .finally(() => setLoading(false))
  }, [id, navigate, toast])

  useEffect(() => {
    void loadReviews()
  }, [loadReviews])

  useEffect(() => {
    setSelectedImageIndex(0)
  }, [product?.id])

  useEffect(() => {
    try {
      if (zipCode.trim()) {
        localStorage.setItem(PRODUCT_DETAIL_ZIP_CACHE_KEY, zipCode)
      } else {
        localStorage.removeItem(PRODUCT_DETAIL_ZIP_CACHE_KEY)
      }
    } catch {
      // ignore localStorage failures
    }
  }, [zipCode])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
      </div>
    )
  }
  if (!product) return null

  const orderedImages = getOrderedGallery(productImages.length > 0 ? productImages : product.images)
  const primaryImage = getProductPrimaryImage(product)
  const galleryImages: ProductImage[] = orderedImages.length > 0
    ? orderedImages
    : (primaryImage ? [primaryImage] : [])
  const selectedImage = galleryImages[selectedImageIndex] ?? galleryImages[0] ?? null

  const isOutOfStock = product.stock === 0
  const pricing = getProductPriceSummary(product)

  const handleAdd = () => {
    if (isOutOfStock) return
    addItem(product, 1)
    toast(`${product.name} adicionado à sacola`, 'success')
  }

  const handleCalculateShipping = async () => {
    if (!id || !product) return

    const zipDigits = zipCode.replace(/\D/g, '')
    if (zipDigits.length !== 8) {
      setShippingError('Informe um CEP válido com 8 dígitos.')
      setShippingQuotes([])
      return
    }

    setShippingLoading(true)
    setShippingError('')

    try {
      const result = await shippingApi.publicQuote({
        items: [{ productId: product.id, quantity: 1 }],
        destinationZip: zipDigits,
      })

      if (!result.quotes?.length) {
        setShippingError('Nenhuma opção de frete disponível para este CEP no momento.')
        setShippingQuotes([])
        return
      }

      const sortedQuotes = [...result.quotes].sort((a, b) => a.priceCents - b.priceCents)
      setShippingQuotes(sortedQuotes)
      toast('Frete calculado com sucesso!', 'success')
    } catch (error) {
      setShippingQuotes([])
      setShippingError((error as ApiError).message ?? 'Não foi possível calcular o frete agora.')
    } finally {
      setShippingLoading(false)
    }
  }

  const handleReviewSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!id || submittingReview || authLoading) return

    if (!isAuthenticated) {
      // Salva o rascunho para restaurar depois do login
      try {
        sessionStorage.setItem(PENDING_REVIEW_KEY, JSON.stringify(reviewForm))
      } catch { /* ignore */ }
      navigate(`/login?redirect=${encodeURIComponent(`/products/${id}`)}`)
      return
    }

    const trimmedComment = reviewForm.comment.trim()
    const validRating = Number.isInteger(reviewForm.rating) && reviewForm.rating >= 1 && reviewForm.rating <= 5

    if (!validRating) {
      toast('Escolha uma nota inteira entre 1 e 5', 'warning')
      return
    }

    if (!trimmedComment) {
      toast('Comentário é obrigatório', 'warning')
      return
    }

    setSubmittingReview(true)
    try {
      await productsApi.createReview(id, {
        rating: reviewForm.rating,
        comment: trimmedComment,
      })
      toast('Avaliação criada com sucesso', 'success')
      setReviewForm({ rating: 5, comment: '' })
      await loadReviews()
    } catch (error) {
      const apiError = error as ApiError
      if (apiError.statusCode === 409) {
        toast('Você já avaliou este produto', 'warning')
      } else if (apiError.statusCode === 401) {
        toast('Faça login para avaliar este produto', 'warning')
        navigate(`/login?redirect=${encodeURIComponent(`/products/${id}`)}`)
      } else if (apiError.statusCode === 400) {
        toast(apiError.message || 'Dados inválidos para criar avaliação', 'warning')
      } else if (apiError.statusCode === 404) {
        toast('Produto não encontrado para avaliação', 'error')
      } else {
        toast(apiError.message || 'Erro ao criar avaliação', 'error')
      }
    } finally {
      setSubmittingReview(false)
    }
  }

  const handleNextImage = () => {
    if (galleryImages.length <= 1) return
    setSelectedImageIndex((prev) => (prev + 1) % galleryImages.length)
  }

  const handlePrevImage = () => {
    if (galleryImages.length <= 1) return
    setSelectedImageIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1))
  }

  return (
    <div className={`min-h-screen bg-white ${floatingBarVisible ? 'pb-40' : 'pb-32'}`}>
      <div className="border-b border-gray-200 py-3 text-xs bg-white">
        <div className="container-page flex gap-2 text-gray-500 overflow-x-auto whitespace-nowrap">
          <Link to="/" className="hover:underline opacity-60 flex items-center gap-1"><span className="text-[14px]">🏠</span></Link>
          <span className="opacity-40">|</span>
          <Link to="/products" className="hover:underline opacity-80">Todos os Produtos</Link>
          <span className="opacity-40">|</span>
          <span className="text-gray-900 truncate font-semibold">{product.brand ? `${product.brand} - ` : ''}{product.name}</span>
        </div>
      </div>

      <div className="container-page py-8">
        <div className="flex flex-col md:flex-row gap-12 lg:gap-16 items-start max-w-6xl mx-auto">

          {/* ── Left: Images ────────────────────────────────── */}
          <div className="w-full md:w-[45%] flex gap-4 sticky top-24">

            {/* Thumbnails */}
            {galleryImages.length > 1 && (
              <div className="flex flex-col gap-2 w-16 md:w-20 shrink-0">
                {galleryImages.map((img, idx) => (
                  <div key={img.id} className={`aspect-square border-2 rounded ${idx === selectedImageIndex ? 'border-[#2a7e51]' : 'border-transparent hover:border-gray-200'} cursor-pointer overflow-hidden p-1 bg-white shadow-sm`}>
                    <button type="button" onClick={() => setSelectedImageIndex(idx)} className="w-full h-full">
                      <img src={img.url} alt={img.alt || `${product.name} ${idx + 1}`} className="w-full h-full object-contain" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Main Image */}
            <div className="flex-1 relative h-[250px] sm:h-[300px] md:h-[340px] lg:h-[365px] flex items-center justify-center bg-white p-4">
              {pricing.hasDiscount && (
                <div className="absolute top-2 right-2 w-14 h-14 bg-[#0B1B3D] rounded-full flex flex-col items-center justify-center text-white z-10 font-bold leading-tight shadow-md">
                  <span className="text-sm">{pricing.discountPercent}%</span>
                  <span className="text-[10px]">OFF</span>
                </div>
              )}
              {selectedImage?.url ? (
                <img src={selectedImage.url} alt={selectedImage.alt || product.name} className="w-full h-full object-contain" />
              ) : (
                <div className="w-64 h-64 bg-gray-50 flex items-center justify-center rounded-2xl">
                  <span className="text-[#2a7e51] text-6xl font-black italic opacity-20">{product.name[0]}</span>
                </div>
              )}

              {galleryImages.length > 1 && (
                <>
                  <button onClick={handlePrevImage} className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-gray-300 hover:text-gray-600"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg></button>
                  <button onClick={handleNextImage} className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-gray-300 hover:text-gray-600"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg></button>

                  <div className="absolute bottom-2 right-2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded">{selectedImageIndex + 1}/{galleryImages.length}</div>
                </>
              )}
            </div>
          </div>

          {/* ── Right: Info ────────────────────────────────── */}
          <div className="w-full md:w-[55%] flex flex-col">

            {/* Brand & Stars */}
            <div className="flex justify-between items-start mb-2">
              <Link to={`/brand/${product.brand}`} className="text-xs text-[#2a7e51] hover:underline uppercase tracking-wide">Ver tudo da marca <span className="font-bold">{product.brand || 'DIVERSOS'}</span></Link>
              <span className="text-xs text-gray-400">Ref: {product.id.split('-')[0].toUpperCase()}</span>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-1 leading-tight">{product.name}</h1>
            <h2 className="text-sm text-gray-500 uppercase tracking-widest mb-4">{product.brand || 'LACQUAVI'} {product.volume && `— ${product.volume}`}</h2>

            <div className="flex items-center gap-2 text-[#fcb900] text-sm mb-6">
              <span>{renderStars(reviewsStats.averageRating)}</span>
              <span className="text-gray-500 text-xs">
                {reviewsStats.total > 0
                  ? `${reviewsStats.averageRating.toFixed(1)} (${reviewsStats.total})`
                  : 'Sem avaliações'}
              </span>
            </div>

            {/* Pricing */}
            <div className="mb-6">
              {pricing.hasDiscount && <p className="text-sm text-gray-400 line-through mb-1">{formatCurrency(pricing.basePrice)}</p>}
              <div className="flex items-end gap-2">
                <span className="text-3xl font-black text-black leading-none">{formatCurrency(pricing.finalPrice)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Vendido e entregue por <span className="text-[#2a7e51] font-bold">Lacquavi ›</span></p>
            </div>

            {/* Actions */}
            <div className="mb-8">
              <button
                onClick={handleAdd}
                disabled={isOutOfStock}
                className="w-full bg-[#2a7e51] hover:bg-[#236843] transition-colors text-white font-bold text-sm tracking-wide uppercase py-4 rounded shadow-[0_4px_12px_rgba(42,126,81,0.3)] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Comprar
              </button>
            </div>

            {/* Shipping calculator */}
            <div className="border-t border-gray-200 pt-6">
              <label className="block text-xs text-gray-600 font-medium mb-2">Consulte o valor e o prazo de entrega.</label>
              <div className="flex h-11">
                <input
                  type="text"
                  placeholder="Informe seu CEP"
                  value={zipCode}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 8)
                    const masked = digits.length > 5
                      ? `${digits.slice(0, 5)}-${digits.slice(5)}`
                      : digits
                    setZipCode(masked)
                    setShippingError('')
                  }}
                  className="flex-1 border border-r-0 border-gray-300 rounded-l px-4 text-sm focus:outline-none focus:border-gray-400"
                />
                <Button
                  variant="outline"
                  className="!rounded-l-none !rounded-r !h-full !px-6 !text-xs !tracking-widest"
                  onClick={handleCalculateShipping}
                  loading={shippingLoading}
                >
                  Calcular
                </Button>
              </div>
              <a href="https://buscacepinter.correios.com.br/app/endereco/index.php" target="_blank" rel="noreferrer" className="text-[10px] text-gray-400 hover:underline mt-2 inline-block">Não sei meu CEP</a>

              {shippingError && (
                <p className="text-xs text-red-500 mt-3">{shippingError}</p>
              )}

              {shippingQuotes.length > 0 && (
                <div className="mt-3 space-y-2">
                  {shippingQuotes.map((quote) => (
                    <div key={quote.quoteId} className="flex items-center justify-between rounded border border-gray-200 bg-gray-50 px-3 py-2">
                      <div>
                        <p className="text-xs font-semibold text-gray-800 uppercase tracking-wide">{quote.serviceName}</p>
                        <p className="text-[11px] text-gray-500">Entrega em até {quote.deliveryDays} dias</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(quote.priceCents / 100)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Ext Info Layout: Description + Right Sidebar ────────────────────────────────── */}
        <div className="mt-16 border-t border-gray-200 pt-10">
          <div className="max-w-6xl mx-auto">

            {/* Main Content Area */}
            <div className="w-full">
              {/* Description */}
              <div className="mb-10 text-sm text-gray-600 leading-relaxed font-sans" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                <div className="flex border-b border-gray-200 mb-6">
                  <h3 className="uppercase text-sm font-bold text-gray-800 tracking-widest border-b-2 border-black pb-2 -mb-px">Descrição</h3>
                </div>

                {product.description ? (
                  <div className="whitespace-pre-line text-gray-700">{product.description}</div>
                ) : (
                  <p className="italic text-gray-400">Nenhuma descrição disponível para este produto.</p>
                )}
              </div>

              {/* Specs */}
              <div className="mb-12">
                <div className="flex border-b border-pink-200 mb-4">
                  <h3 className="uppercase text-sm font-bold text-gray-800 tracking-widest border-b-2 border-[#2a7e51] pb-2 -mb-px">Especificações</h3>
                </div>
                <div className="border border-pink-100 rounded p-4 text-sm text-gray-600 bg-white shadow-sm">
                  {product.volume && <p><span className="font-medium">Tamanho:</span> {product.volume}</p>}
                </div>
              </div>

              <div className="mb-12">
                <div className="flex border-b border-pink-200 mb-4">
                  <h3 className="uppercase text-sm font-bold text-gray-800 tracking-widest border-b-2 border-[#2a7e51] pb-2 -mb-px">Avaliações</h3>
                </div>

                <div className="border border-gray-200 rounded p-4 bg-white mb-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-gray-700">Média das avaliações</p>
                      <p className="text-2xl font-bold text-gray-900 leading-none mt-1">{reviewsStats.averageRating.toFixed(1)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg text-[#fcb900]">{renderStars(reviewsStats.averageRating)}</p>
                      <p className="text-xs text-gray-500 mt-1">{reviewsStats.total} avaliação(ões)</p>
                    </div>
                  </div>
                </div>

                {isAuthenticated ? (
                  <form onSubmit={handleReviewSubmit} className="border border-gray-200 rounded p-4 bg-white mb-4 space-y-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-800 mb-2">Deixe sua avaliação</p>
                      <div className="flex gap-2" role="radiogroup" aria-label="Nota do produto">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                            className={`text-2xl leading-none ${reviewForm.rating >= star ? 'text-[#fcb900]' : 'text-gray-300'}`}
                            aria-label={`${star} estrela${star > 1 ? 's' : ''}`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="product-review-comment" className="block text-xs text-gray-600 font-medium mb-2">Comentário</label>
                      <textarea
                        id="product-review-comment"
                        value={reviewForm.comment}
                        onChange={(event) => setReviewForm(prev => ({ ...prev, comment: event.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                        rows={4}
                        placeholder="Conte como foi sua experiência com este produto"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="bg-[#2a7e51] hover:bg-[#236843] text-white px-6 py-2.5 rounded text-sm font-bold uppercase tracking-wide transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {submittingReview ? 'Enviando...' : 'Enviar avaliação'}
                    </button>
                  </form>
                ) : (
                  <div className="border border-gray-200 rounded p-4 bg-white mb-4 text-sm text-gray-600">
                    Faça <Link to={`/login?redirect=${encodeURIComponent(`/products/${id}`)}`} className="text-[#2a7e51] font-semibold hover:underline">login</Link> para enviar sua avaliação.
                  </div>
                )}

                <div className="space-y-3">
                  {reviewsLoading ? (
                    <div className="border border-gray-200 rounded p-4 bg-white text-sm text-gray-500">Carregando avaliações...</div>
                  ) : reviews.length === 0 ? (
                    <div className="border border-gray-200 rounded p-4 bg-white text-sm text-gray-500">Este produto ainda não possui avaliações.</div>
                  ) : (
                    reviews.map((review) => (
                      <div key={review.id} className="border border-gray-200 rounded p-4 bg-white">
                        <div className="flex flex-wrap justify-between gap-2 mb-2">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{review.user.name}</p>
                            <p className="text-xs text-gray-500">{formatReviewDate(review.createdAt)}</p>
                          </div>
                          <p className="text-[#fcb900] text-sm">{renderStars(review.rating)}</p>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-line">{review.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <FloatingBuyBar product={product} onAdd={handleAdd} onVisibilityChange={setFloatingBarVisible} />
    </div>
  )
}
