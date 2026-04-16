import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { productsApi, categoriesApi, subcategoriesApi, homeTilesApi } from '../../api/catalogApi'
import { uploadProductImageToStorage } from '../../api/storageApi'
import { ordersApi, paymentsApi, couponsApi, healthApi, bannersApi, shippingApi } from '../../api/index'
import { useToast } from '../../context/ToastContext'
import { Button, Input, Select, Spinner, EmptyState, ErrorMessage, Skeleton, Modal } from '../../components/ui'
import {
  formatCurrency,
  formatDateTime,
  orderStatusLabel,
  paymentStatusLabel,
  paymentStatusColor,
  generateIdempotencyKey,
  getOrderDisplayStatus,
  getOrderDisplayStatusLabel,
  getOrderDisplayStatusColor,
} from '../../utils'
import { mapShippingLabelError } from '../../utils/shippingLabelError'
import { getOrderedGallery, getProductPrimaryImage } from '../../utils/productImages'
import { optimizeProductImage } from '../../utils/imagePipeline'
import type {
  Product,
  Category,
  Subcategory,
  Order,
  Payment,
  Coupon,
  HealthStatus,
  OrderStatus,
  ApiError,
  ProductImage,
  Banner,
  Shipment,
  ShipmentStatus,
  ShipmentSelection,
  ShippingDestination,
  HomeTile,
  HomeTileKey,
} from '../../types'

const MAX_PRODUCT_IMAGES = 6
type DateRangeFilter = 'all' | 'today' | '7d' | '30d'

const isWithinDateRange = (dateIso: string, range: DateRangeFilter) => {
  if (range === 'all') return true
  const date = new Date(dateIso)
  if (Number.isNaN(date.getTime())) return false

  const now = new Date()
  if (range === 'today') {
    return date.toDateString() === now.toDateString()
  }

  const days = range === '7d' ? 7 : 30
  const threshold = new Date(now)
  threshold.setDate(threshold.getDate() - days)
  return date >= threshold
}

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
  const street = destination.street?.trim()
  const number = destination.number?.trim()
  const complement = destination.complement?.trim()
  const base = [street, number].filter(Boolean).join(', ')
  if (!base) return 'Endereço não informado'
  return complement ? `${base} · ${complement}` : base
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
export function AdminDashboardPage() {
  const [orders, setOrders]     = useState<Order[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([
      ordersApi.list(),
      paymentsApi.list(),
      productsApi.myProducts(),
    ]).then(([o, pay, p]) => {
      setOrders(o.orders)
      setPayments(pay.payments)
      setProducts(p.products)
    }).finally(() => setLoading(false))
  }, [])

  const totalRevenue = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0)
  const pendingOrders = orders.filter(o => getOrderDisplayStatus(o) === 'pending').length
  const awaitingLabel = orders.filter(o =>
    o.paymentStatus === 'paid' &&
    o.status === 'processing' &&
    o.shippingProvider !== 'STORE_PICKUP' &&
    o.shippingProvider != null
  ).length

  const stats = [
    { label: 'Pedidos',            value: loading ? '—' : orders.length.toString(),      icon: '◎', color: 'bg-blue-50 text-blue-600' },
    { label: 'Receita Total',      value: loading ? '—' : formatCurrency(totalRevenue),  icon: '◉', color: 'bg-green-50 text-green-600' },
    { label: 'Pendentes',          value: loading ? '—' : pendingOrders.toString(),       icon: '◌', color: 'bg-amber-50 text-amber-600' },
    { label: 'Aguard. Etiqueta',   value: loading ? '—' : awaitingLabel.toString(),       icon: '◫', color: 'bg-orange-50 text-orange-600' },
    { label: 'Produtos',           value: loading ? '—' : products.length.toString(),    icon: '✦', color: 'bg-purple-50 text-purple-600' },
  ]

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-obsidian-400 mb-1">Painel</p>
        <h1 className="font-display text-3xl text-ink">Dashboard</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-obsidian-100 p-5 shadow-card">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-3 ${s.color}`}>{s.icon}</div>
            <p className="text-2xl font-display text-ink">{s.value}</p>
            <p className="text-xs text-obsidian-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-2xl border border-obsidian-100 shadow-card">
        <div className="flex items-center justify-between p-5 border-b border-obsidian-100">
          <h2 className="font-display text-lg text-ink">Pedidos Recentes</h2>
          <Link to="/admin/orders" className="text-sm text-champagne-600 hover:text-champagne-700">Ver todos</Link>
        </div>
        <div className="p-2">
          {loading
            ? [1,2,3].map(i => <Skeleton key={i} className="h-12 m-3 rounded-xl" />)
            : orders.slice(0, 5).map(order => (
                <Link key={order.id} to={`/admin/orders/${order.id}`} className="flex items-center justify-between px-3 py-3 rounded-xl hover:bg-obsidian-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-ink font-mono">#{order.id.slice(-8).toUpperCase()}</p>
                    <p className="text-xs text-obsidian-400">{formatDateTime(order.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`badge-status border rounded-full text-xs px-2.5 py-0.5 ${getOrderDisplayStatusColor(order)}`}>
                      {getOrderDisplayStatusLabel(order)}
                    </span>
                    <span className="text-sm font-medium">{formatCurrency(order.total)}</span>
                  </div>
                </Link>
              ))
          }
        </div>
      </div>
    </div>
  )
}

// ─── Admin Products ───────────────────────────────────────────────────────────
export function AdminProductsPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading]   = useState(true)
  const [statusTab, setStatusTab] = useState<'active' | 'inactive'>('active')
  const [confirmActionId, setConfirmActionId] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    productsApi.myProducts().then(r => setProducts(r.products)).finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleDeactivate = async (id: string) => {
    try {
      await productsApi.remove(id)
      setProducts(previous => previous.map(product => product.id === id ? { ...product, isActive: false } : product))
      toast('Produto desativado', 'success')
    } catch (err) {
      toast((err as ApiError).message, 'error')
    } finally {
      setConfirmActionId(null)
    }
  }

  const handleReactivate = async (id: string) => {
    try {
      await productsApi.update(id, { isActive: true })
      setProducts(previous => previous.map(product => product.id === id ? { ...product, isActive: true } : product))
      toast('Produto reativado', 'success')
    } catch (err) {
      toast((err as ApiError).message, 'error')
    } finally {
      setConfirmActionId(null)
    }
  }

  const filteredProducts = products.filter(product => {
    const isActive = product.isActive !== false
    return statusTab === 'active' ? isActive : !isActive
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-widest text-obsidian-400 mb-1">Admin</p>
          <h1 className="font-display text-3xl text-ink">Produtos</h1>
        </div>
        <Button onClick={() => navigate('/admin/products/new')}>+ Novo Produto</Button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Button variant={statusTab === 'active' ? 'primary' : 'outline'} size="sm" onClick={() => setStatusTab('active')}>
          Ativos
        </Button>
        <Button variant={statusTab === 'inactive' ? 'primary' : 'outline'} size="sm" onClick={() => setStatusTab('inactive')}>
          Inativos
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-obsidian-100 shadow-card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}
          </div>
        ) : filteredProducts.length === 0 ? (
          <EmptyState title={`Nenhum produto ${statusTab === 'active' ? 'ativo' : 'inativo'}`} action={<Button onClick={() => navigate('/admin/products/new')}>Criar Produto</Button>} />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-obsidian-100">
                <th className="px-5 py-3.5 text-xs font-medium text-obsidian-400 uppercase tracking-wider">Produto</th>
                <th className="px-5 py-3.5 text-xs font-medium text-obsidian-400 uppercase tracking-wider hidden md:table-cell">Preço</th>
                <th className="px-5 py-3.5 text-xs font-medium text-obsidian-400 uppercase tracking-wider hidden md:table-cell">Estoque</th>
                <th className="px-5 py-3.5 text-xs font-medium text-obsidian-400 uppercase tracking-wider hidden md:table-cell">Status</th>
                <th className="px-5 py-3.5 text-xs font-medium text-obsidian-400 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => {
                const productImage = getProductPrimaryImage(product)
                const isActive = product.isActive !== false
                return (
                <tr key={product.id} className="border-b border-obsidian-50 last:border-0 hover:bg-obsidian-50/50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-obsidian-50 flex-shrink-0">
                        {productImage?.url
                          ? <img src={productImage.url} alt={productImage.alt || product.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-obsidian-300 text-sm">⬟</div>
                        }
                      </div>
                      <div>
                        <p className="text-sm font-medium text-ink">{product.name}</p>
                        {product.brand && <p className="text-xs text-obsidian-400">{product.brand}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell text-sm text-ink">{formatCurrency(product.price)}</td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className={`text-sm ${product.stock === 0 ? 'text-red-500' : product.stock <= 5 ? 'text-amber-500' : 'text-green-600'}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className={`badge-status border rounded-full text-xs px-2.5 py-0.5 ${isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-obsidian-100 text-obsidian-500 border-obsidian-200'}`}>
                      {isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/admin/products/${product.id}/edit`)}>
                        Editar
                      </Button>
                      {confirmActionId === product.id ? (
                        <>
                          <Button
                            size="sm"
                            className={isActive ? 'bg-red-600 hover:bg-red-700 text-white border-0' : ''}
                            onClick={() => isActive ? handleDeactivate(product.id) : handleReactivate(product.id)}
                          >
                            Confirmar
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setConfirmActionId(null)}>
                            Cancelar
                          </Button>
                        </>
                      ) : isActive ? (
                        <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setConfirmActionId(product.id)}>
                          Desativar
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" className="text-emerald-700 border-emerald-200 hover:bg-emerald-50" onClick={() => setConfirmActionId(product.id)}>
                          Reativar
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ─── Admin Product Form ───────────────────────────────────────────────────────
export function AdminProductFormPage() {
  const { id } = useParams<{ id?: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const { toast } = useToast()

  const [loading, setLoading]   = useState(isEdit)
  const [saving, setSaving]     = useState(false)
  const [removingImageId, setRemovingImageId] = useState<string | null>(null)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([])
  const [existingImages, setExistingImages] = useState<ProductImage[]>([])
  const [error, setError]       = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    discount: '0',
    stock: '',
    brand: '',
    volume: '',
    gender: '',
    olfactoryFamily: '',
    categoryId: '',
    subcategoryId: '',
    isActive: true,
    requiresShipping: true,
    weightGrams: '',
  })

  useEffect(() => {
    const previews = imageFiles.map((file) => URL.createObjectURL(file))
    setNewImagePreviews(previews)
    return () => {
      previews.forEach((previewUrl) => URL.revokeObjectURL(previewUrl))
    }
  }, [imageFiles])

  useEffect(() => {
    categoriesApi.list().then(r => setCategories(r.data))
    if (isEdit && id) {
      productsApi.getById(id)
        .then(p => {
          setForm({
            name: p.name, description: p.description, price: p.price.toString(),
            discount: (p.discount ?? 0).toString(),
            stock: p.stock.toString(), brand: p.brand ?? '', volume: p.volume ?? '',
            gender: p.gender ?? '', olfactoryFamily: p.olfactoryFamily ?? '',
            categoryId: p.categoryId ?? '',
            subcategoryId: p.subcategoryId ?? '',
            isActive: p.isActive !== false,
            requiresShipping: p.requiresShipping ?? true,
            weightGrams: p.weightGrams?.toString() ?? '',
          })
          setExistingImages(getOrderedGallery(p.images))
        })
        .finally(() => setLoading(false))
    }
  }, [id, isEdit])

  useEffect(() => {
    if (!form.categoryId) {
      if (form.subcategoryId) {
        setForm((previous) => ({ ...previous, subcategoryId: '' }))
      }
      setSubcategories([])
      return
    }

    subcategoriesApi
      .list({ categoryId: form.categoryId })
      .then((response) => {
        const nextSubcategories = response.data ?? response.subcategories ?? []
        setSubcategories(nextSubcategories)
        if (form.subcategoryId && !nextSubcategories.some((subcategory) => subcategory.id === form.subcategoryId)) {
          setForm((previous) => ({ ...previous, subcategoryId: '' }))
        }
      })
      .catch(() => setSubcategories([]))
  }, [form.categoryId, form.subcategoryId])

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [key]: e.target.value }))
  }

  const handleImageSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? [])
    if (selectedFiles.length === 0) return

    setImageFiles((previousFiles) => {
      return [...previousFiles, ...selectedFiles]
    })

    event.target.value = ''
  }

  const removeSelectedImage = (indexToRemove: number) => {
    setImageFiles((previousFiles) => previousFiles.filter((_, index) => index !== indexToRemove))
  }

  const handleRemoveExistingImage = async (image: ProductImage) => {
    if (!id) return
    if (!confirm('Remover esta imagem do produto?')) return

    setRemovingImageId(image.id)
    try {
      await productsApi.removeImage(id, image.id)
      const confirmedImages = await productsApi.getImages(id)
      setExistingImages(getOrderedGallery(confirmedImages))
      toast('Imagem removida com sucesso!', 'success')
    } catch (err) {
      toast((err as ApiError).message ?? 'Não foi possível remover a imagem', 'error')
    } finally {
      setRemovingImageId(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const parseOptionalInt = (value: string) => {
        const trimmed = value.trim()
        if (!trimmed) return undefined
        const parsed = parseInt(trimmed, 10)
        return Number.isNaN(parsed) ? undefined : parsed
      }

      const parsedWeightGrams = parseOptionalInt(form.weightGrams)
      if (form.requiresShipping && (!parsedWeightGrams || parsedWeightGrams <= 0)) {
        throw new Error('Peso (gramas) é obrigatório para produtos com envio físico')
      }

      const data = {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        discount: parseFloat(form.discount || '0'),
        stock: parseInt(form.stock),
        brand: form.brand.trim() ? form.brand.trim() : null,
        volume: form.volume.trim() ? form.volume.trim() : null,
        gender: form.gender.trim() ? form.gender.trim() : null,
        olfactoryFamily: form.olfactoryFamily.trim() ? form.olfactoryFamily.trim() : null,
        categoryId: form.categoryId.trim() ? form.categoryId.trim() : null,
        subcategoryId: form.subcategoryId.trim() ? form.subcategoryId.trim() : null,
        isActive: form.isActive,
        requiresShipping: form.requiresShipping,
        weightGrams: form.requiresShipping ? parsedWeightGrams : undefined,
      }
      let productId = id
      if (isEdit && id) {
        await productsApi.update(id, data)
      } else {
        const r = await productsApi.create(data)
        productId = r.product.id
      }

      if (productId && imageFiles.length > 0) {
        const currentImagesCount = existingImages.length
        const totalAfterUpload = currentImagesCount + imageFiles.length

        if (totalAfterUpload > MAX_PRODUCT_IMAGES) {
          throw new Error(`Limite de ${MAX_PRODUCT_IMAGES} imagens por produto atingido`)
        }

        const normalizedFiles = await Promise.all(imageFiles.map((file) => optimizeProductImage(file)))

        for (let index = 0; index < normalizedFiles.length; index += 1) {
          const normalizedFile = normalizedFiles[index]
          const { url } = await uploadProductImageToStorage(normalizedFile)

          await productsApi.addImage(productId, {
            url,
            alt: `${form.name} ${index + 1}`,
            isPrimary: currentImagesCount === 0 && index === 0,
          })
        }

        const confirmedImages = await productsApi.getImages(productId)
        setExistingImages(getOrderedGallery(confirmedImages))

        toast(
          `${isEdit ? 'Produto atualizado' : 'Produto criado'}! Galeria confirmada com ${confirmedImages.length} imagem(ns).`,
          'success'
        )
      } else {
        toast(isEdit ? 'Produto atualizado!' : 'Produto criado!', 'success')
      }
      navigate('/admin/products')
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.message || 'Não foi possível processar e enviar as imagens')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate('/admin/products')} className="text-champagne-600">← Produtos</button>
        <span className="text-obsidian-300">/</span>
        <h1 className="font-display text-2xl text-ink">{isEdit ? 'Editar Produto' : 'Novo Produto'}</h1>
      </div>

      {isEdit && !form.isActive && (
        <div className="max-w-2xl mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Este produto está inativo e não aparece no catálogo público.
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="bg-white rounded-2xl border border-obsidian-100 shadow-card p-6 space-y-4">
          <h2 className="font-display text-lg text-ink">Informações Gerais</h2>
          <Input label="Nome *" value={form.name} onChange={set('name')} required />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Preço (R$) *" type="number" step="0.01" min="0" value={form.price} onChange={set('price')} required />
            <Input label="Desconto (R$)" type="number" step="0.01" min="0" value={form.discount} onChange={set('discount')} />
            <Input label="Estoque *" type="number" min="0" value={form.stock} onChange={set('stock')} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-obsidian-600 tracking-wide mb-1.5">Descrição</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              className="input-luxury resize-none"
              placeholder="Descrição do perfume..."
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-obsidian-100 shadow-card p-6 space-y-4">
          <h2 className="font-display text-lg text-ink">Detalhes</h2>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Marca" value={form.brand} onChange={set('brand')} />
            <Input label="Volume (ex: 100ml)" value={form.volume} onChange={set('volume')} />
          </div>
          <Input label="Família Olfativa (ex: Floral Gourmand)" value={form.olfactoryFamily} onChange={set('olfactoryFamily')} />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Gênero"
              value={form.gender}
              onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
              placeholder="Selecionar..."
              options={[
                { value: 'feminino', label: 'Feminino' },
                { value: 'masculino', label: 'Masculino' },
                { value: 'unissex', label: 'Unissex' },
              ]}
            />
            <Select
              label="Categoria"
              value={form.categoryId}
              onChange={e => setForm(f => ({ ...f, categoryId: e.target.value, subcategoryId: '' }))}
              placeholder="Sem categoria"
              options={categories.map(c => ({ value: c.id, label: c.name }))}
            />
            <Select
              label="Subcategoria"
              value={form.subcategoryId}
              onChange={e => setForm(f => ({ ...f, subcategoryId: e.target.value }))}
              placeholder={form.categoryId ? 'Sem subcategoria' : 'Selecione categoria primeiro'}
              options={subcategories.map((subcategory) => ({ value: subcategory.id, label: subcategory.name }))}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-obsidian-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
              className="w-4 h-4"
            />
            Produto ativo
          </label>
        </div>

        <div className="bg-white rounded-2xl border border-obsidian-100 shadow-card p-6 space-y-4">
          <h2 className="font-display text-lg text-ink">Logística de Frete</h2>

          <label className="flex items-center gap-2 text-sm text-obsidian-700">
            <input
              type="checkbox"
              checked={form.requiresShipping}
              onChange={e => setForm(f => ({ ...f, requiresShipping: e.target.checked }))}
              className="w-4 h-4"
            />
            Produto requer envio físico
          </label>

          {form.requiresShipping && (
            <div className="grid grid-cols-1 gap-4">
              <Input label="Peso (gramas) *" type="number" min="1" required={form.requiresShipping} value={form.weightGrams} onChange={set('weightGrams')} />
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-obsidian-100 shadow-card p-6 space-y-4">
          <h2 className="font-display text-lg text-ink">Imagens</h2>
          {existingImages.length > 0 && (
            <div>
              <p className="text-xs font-medium text-obsidian-600 tracking-wide mb-2">Imagens atuais</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {existingImages.map((image) => (
                  <div key={image.id} className="relative w-full aspect-square rounded-xl border border-obsidian-100 overflow-hidden bg-obsidian-50">
                    <img src={image.url} alt={image.alt || 'Imagem do produto'} className="w-full h-full object-cover" />
                    {image.isPrimary && (
                      <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-ink text-white text-[10px] uppercase">Principal</span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveExistingImage(image)}
                      disabled={removingImageId === image.id}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white text-xs flex items-center justify-center hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Remover imagem existente"
                    >
                      {removingImageId === image.id ? '…' : '✕'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {newImagePreviews.length > 0 && (
            <div>
              <p className="text-xs font-medium text-obsidian-600 tracking-wide mb-2">Novas imagens selecionadas</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {newImagePreviews.map((previewUrl, index) => (
                  <div key={`${previewUrl}-${index}`} className="relative w-full aspect-square rounded-xl border border-obsidian-100 overflow-hidden bg-obsidian-50">
                    <img src={previewUrl} alt={`Nova imagem ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeSelectedImage(index)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white text-xs flex items-center justify-center hover:bg-black"
                      aria-label={`Remover imagem ${index + 1}`}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-obsidian-600 tracking-wide mb-1.5">Upload de imagens</label>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageSelection}
              className="block text-sm text-obsidian-500 file:mr-3 file:px-4 file:py-2 file:rounded-full file:border-0 file:text-xs file:bg-champagne-50 file:text-champagne-700 hover:file:bg-champagne-100"
            />
            <p className="text-xs text-obsidian-400 mt-1">JPG, PNG ou WebP • até 6 imagens por produto</p>
          </div>
        </div>

        {error && <ErrorMessage message={error} />}

        <div className="flex gap-3">
          <Button type="submit" loading={saving}>{isEdit ? 'Salvar Alterações' : 'Criar Produto'}</Button>
          <Button variant="outline" onClick={() => navigate('/admin/products')}>Cancelar</Button>
        </div>
      </form>
    </div>
  )
}

// ─── Admin Categories ─────────────────────────────────────────────────────────
export function AdminCategoriesPage() {
  const { toast } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading]       = useState(true)
  const [modal, setModal]           = useState(false)
  const [editing, setEditing]       = useState<Category | null>(null)
  const [name, setName]             = useState('')
  const [saving, setSaving]         = useState(false)
  const [reordering, setReordering] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    categoriesApi.list().then(r => setCategories(r.data)).finally(() => setLoading(false))
  }

  useEffect(load, [])

  const openModal = (cat?: Category) => {
    setEditing(cat ?? null)
    setName(cat?.name ?? '')
    setModal(true)
  }

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      if (editing) {
        await categoriesApi.update(editing.id, { name })
        toast('Categoria atualizada!', 'success')
      } else {
        await categoriesApi.create({ name })
        toast('Categoria criada!', 'success')
      }
      setModal(false)
      load()
    } catch (err) {
      toast((err as ApiError).message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await categoriesApi.remove(id)
      toast('Categoria excluída', 'success')
      load()
    } catch (err) {
      toast((err as ApiError).message, 'error')
    } finally {
      setConfirmDeleteId(null)
    }
  }

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= categories.length) return

    // Move o item no array e reatribui displayOrder sequencial
    const reordered = [...categories]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(swapIndex, 0, moved)
    const withNewOrder = reordered.map((cat, i) => ({ ...cat, displayOrder: i }))

    setCategories(withNewOrder)

    setReordering(true)
    try {
      await categoriesApi.reorder(withNewOrder.map(({ id, displayOrder }) => ({ id, displayOrder })))
    } catch (err) {
      toast('Erro ao reordenar', 'error')
      load()
    } finally {
      setReordering(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl text-ink">Categorias</h1>
        <Button onClick={() => openModal()}>+ Nova Categoria</Button>
      </div>

      <div className="bg-white rounded-2xl border border-obsidian-100 shadow-card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
        ) : categories.length === 0 ? (
          <EmptyState title="Nenhuma categoria" action={<Button onClick={() => openModal()}>Criar</Button>} />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-obsidian-100 text-left">
                <th className="px-5 py-3.5 text-xs font-medium text-obsidian-400 uppercase tracking-wider w-10">Ordem</th>
                <th className="px-5 py-3.5 text-xs font-medium text-obsidian-400 uppercase tracking-wider">Nome</th>
                <th className="px-5 py-3.5 text-xs font-medium text-obsidian-400 uppercase tracking-wider">Slug</th>
                <th className="px-5 py-3.5 text-xs font-medium text-obsidian-400 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat, idx) => (
                <tr key={cat.id} className="border-b border-obsidian-50 last:border-0">
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => handleMove(idx, 'up')}
                        disabled={idx === 0 || reordering}
                        className="p-0.5 rounded text-obsidian-400 hover:text-ink hover:bg-obsidian-50 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                        title="Mover para cima"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
                      </button>
                      <button
                        onClick={() => handleMove(idx, 'down')}
                        disabled={idx === categories.length - 1 || reordering}
                        className="p-0.5 rounded text-obsidian-400 hover:text-ink hover:bg-obsidian-50 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                        title="Mover para baixo"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                      </button>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm font-medium text-ink">{cat.name}</td>
                  <td className="px-5 py-4 text-sm text-obsidian-400 font-mono">{cat.slug}</td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openModal(cat)}>Editar</Button>
                      {confirmDeleteId === cat.id ? (
                        <>
                          <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white border-0" onClick={() => handleDelete(cat.id)}>Confirmar</Button>
                          <Button variant="outline" size="sm" onClick={() => setConfirmDeleteId(null)}>Cancelar</Button>
                        </>
                      ) : (
                        <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setConfirmDeleteId(cat.id)}>Excluir</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar Categoria' : 'Nova Categoria'} maxWidth="max-w-sm">
        <div className="space-y-4">
          <Input label="Nome" value={name} onChange={e => setName(e.target.value)} />
          <div className="flex gap-3">
            <Button onClick={handleSave} loading={saving} fullWidth>Salvar</Button>
            <Button variant="outline" onClick={() => setModal(false)} fullWidth>Cancelar</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ─── Admin Subcategories ─────────────────────────────────────────────────────
export function AdminSubcategoriesPage() {
  const { toast } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Subcategory | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    categoryId: '',
  })

  const load = () => {
    setLoading(true)
    Promise.all([categoriesApi.list(), subcategoriesApi.list()])
      .then(([categoriesResponse, subcategoriesResponse]) => {
        setCategories(categoriesResponse.data)
        setSubcategories(subcategoriesResponse.data ?? subcategoriesResponse.subcategories ?? [])
      })
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const openModal = (subcategory?: Subcategory) => {
    setEditing(subcategory ?? null)
    setForm({
      name: subcategory?.name ?? '',
      categoryId: subcategory?.categoryId ?? '',
    })
    setModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.categoryId) return
    setSaving(true)
    try {
      if (editing) {
        await subcategoriesApi.update(editing.id, {
          name: form.name,
          categoryId: form.categoryId,
        })
        toast('Subcategoria atualizada!', 'success')
      } else {
        await subcategoriesApi.create({
          name: form.name,
          categoryId: form.categoryId,
        })
        toast('Subcategoria criada!', 'success')
      }
      setModal(false)
      load()
    } catch (err) {
      toast((err as ApiError).message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await subcategoriesApi.remove(id)
      toast('Subcategoria removida!', 'success')
      load()
    } catch (err) {
      toast((err as ApiError).message, 'error')
    } finally {
      setConfirmDeleteId(null)
    }
  }

  const categoryById = useMemo(() => {
    return new Map(categories.map((category) => [category.id, category.name]))
  }, [categories])

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl text-ink">Subcategorias</h1>
        <Button onClick={() => openModal()}>+ Nova Subcategoria</Button>
      </div>

      <div className="bg-white rounded-2xl border border-obsidian-100 shadow-card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
        ) : subcategories.length === 0 ? (
          <EmptyState title="Nenhuma subcategoria" action={<Button onClick={() => openModal()}>Criar</Button>} />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-obsidian-100 text-left">
                <th className="px-5 py-3.5 text-xs font-medium text-obsidian-400 uppercase tracking-wider">Nome</th>
                <th className="px-5 py-3.5 text-xs font-medium text-obsidian-400 uppercase tracking-wider">Categoria</th>
                <th className="px-5 py-3.5 text-xs font-medium text-obsidian-400 uppercase tracking-wider">Slug</th>
                <th className="px-5 py-3.5 text-xs font-medium text-obsidian-400 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody>
              {subcategories.map((subcategory) => (
                <tr key={subcategory.id} className="border-b border-obsidian-50 last:border-0">
                  <td className="px-5 py-4 text-sm font-medium text-ink">{subcategory.name}</td>
                  <td className="px-5 py-4 text-sm text-obsidian-500">{categoryById.get(subcategory.categoryId) ?? '—'}</td>
                  <td className="px-5 py-4 text-sm text-obsidian-400 font-mono">{subcategory.slug}</td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openModal(subcategory)}>Editar</Button>
                      {confirmDeleteId === subcategory.id ? (
                        <>
                          <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white border-0" onClick={() => handleDelete(subcategory.id)}>Confirmar</Button>
                          <Button variant="outline" size="sm" onClick={() => setConfirmDeleteId(null)}>Cancelar</Button>
                        </>
                      ) : (
                        <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setConfirmDeleteId(subcategory.id)}>Excluir</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar Subcategoria' : 'Nova Subcategoria'} maxWidth="max-w-sm">
        <div className="space-y-4">
          <Input label="Nome" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
          <Select
            label="Categoria"
            value={form.categoryId}
            onChange={(event) => setForm((prev) => ({ ...prev, categoryId: event.target.value }))}
            options={categories.map((category) => ({ value: category.id, label: category.name }))}
            placeholder="Selecione"
          />
          <div className="flex gap-3">
            <Button onClick={handleSave} loading={saving} fullWidth>Salvar</Button>
            <Button variant="outline" onClick={() => setModal(false)} fullWidth>Cancelar</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ─── Admin Orders ─────────────────────────────────────────────────────────────
export function AdminOrdersPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all')
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'none' | NonNullable<Order['paymentStatus']>>('all')
  const [dateRange, setDateRange] = useState<DateRangeFilter>('30d')
  const [minTotal, setMinTotal] = useState('')
  const [maxTotal, setMaxTotal] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => {
    ordersApi.list().then(r => setOrders(r.orders)).finally(() => setLoading(false))
  }, [])

  const filteredOrders = useMemo(() => {
    const searchTerm = search.trim().toLowerCase()
    const min = minTotal ? Number(minTotal) : null
    const max = maxTotal ? Number(maxTotal) : null

    return orders
      .filter(order => {
        if (statusFilter !== 'all' && order.status !== statusFilter) return false
        if (paymentFilter !== 'all') {
          if (paymentFilter === 'none' && order.paymentStatus !== null) return false
          if (paymentFilter !== 'none' && order.paymentStatus !== paymentFilter) return false
        }
        if (!isWithinDateRange(order.createdAt, dateRange)) return false
        if (min !== null && order.total < min) return false
        if (max !== null && order.total > max) return false
        if (searchTerm) {
          const orderCode = order.id.slice(-8).toLowerCase()
          const couponCode = order.couponCode?.toLowerCase() ?? ''
          const customerName = order.user?.name?.toLowerCase() ?? ''
          const customerEmail = order.user?.email?.toLowerCase() ?? ''
          const destinationZip = order.shippingDestinationZip?.toLowerCase() ?? ''
          if (!orderCode.includes(searchTerm) && !couponCode.includes(searchTerm) && !customerName.includes(searchTerm) && !customerEmail.includes(searchTerm) && !destinationZip.includes(searchTerm)) return false
        }
        return true
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [orders, search, statusFilter, paymentFilter, dateRange, minTotal, maxTotal])

  const kpis = useMemo(() => {
    const base = filteredOrders
    const paidCount = base.filter(order => order.paymentStatus === 'paid').length
    const revenue = base.reduce((sum, order) => sum + order.total, 0)
    const avgTicket = base.length ? revenue / base.length : 0

    return {
      total: base.length,
      paidRate: base.length ? Math.round((paidCount / base.length) * 100) : 0,
      revenue,
      avgTicket,
    }
  }, [filteredOrders])

  const activeFiltersCount = [
    search !== '',
    statusFilter !== 'all',
    paymentFilter !== 'all',
    dateRange !== '30d',
    minTotal !== '',
    maxTotal !== '',
  ].filter(Boolean).length

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setPaymentFilter('all')
    setDateRange('30d')
    setMinTotal('')
    setMaxTotal('')
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-obsidian-400 mb-0.5">Operações</p>
          <h1 className="font-display text-3xl text-ink">Pedidos</h1>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Pedidos',       value: kpis.total.toString(),             color: 'text-ink' },
          { label: 'Taxa de pgto',  value: `${kpis.paidRate}%`,               color: 'text-emerald-600' },
          { label: 'Receita',       value: formatCurrency(kpis.revenue),      color: 'text-ink' },
          { label: 'Ticket médio',  value: formatCurrency(kpis.avgTicket),    color: 'text-ink' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-obsidian-100 p-4 shadow-card">
            <p className="text-xs text-obsidian-400 uppercase tracking-wider">{s.label}</p>
            <p className={`text-2xl font-display mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-obsidian-100 shadow-card overflow-hidden">
        <button
          type="button"
          onClick={() => setFiltersOpen(o => !o)}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-obsidian-50/50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-medium text-obsidian-700">Filtros</span>
            {activeFiltersCount > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white text-xs font-bold">
                {activeFiltersCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {activeFiltersCount > 0 && (
              <span
                role="button"
                tabIndex={0}
                onClick={e => { e.stopPropagation(); clearFilters() }}
                onKeyDown={e => e.key === 'Enter' && clearFilters()}
                className="text-xs text-obsidian-400 hover:text-ink cursor-pointer"
              >
                Limpar
              </span>
            )}
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className={`text-obsidian-400 transition-transform duration-200 ${filtersOpen ? 'rotate-180' : ''}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </button>
        {filtersOpen && (
          <div className="border-t border-obsidian-100 p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3 items-end">
              <Input label="Busca" placeholder="#ID, nome ou e-mail" value={search} onChange={e => setSearch(e.target.value)} />
              <Select
                label="Status"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as 'all' | OrderStatus)}
                options={[{ value: 'all', label: 'Todos' }, ...Object.entries(orderStatusLabel).map(([value, label]) => ({ value, label }))]}
              />
              <Select
                label="Pagamento"
                value={paymentFilter}
                onChange={e => setPaymentFilter(e.target.value as 'all' | 'none' | NonNullable<Order['paymentStatus']>)}
                options={[
                  { value: 'all', label: 'Todos' },
                  { value: 'none', label: 'Sem pagamento' },
                  ...Object.entries(paymentStatusLabel).map(([value, label]) => ({ value, label })),
                ]}
              />
              <Select
                label="Período"
                value={dateRange}
                onChange={e => setDateRange(e.target.value as DateRangeFilter)}
                options={[
                  { value: 'all', label: 'Todo período' },
                  { value: 'today', label: 'Hoje' },
                  { value: '7d', label: 'Últimos 7 dias' },
                  { value: '30d', label: 'Últimos 30 dias' },
                ]}
              />
              <Input label="Mín (R$)" type="number" min="0" value={minTotal} onChange={e => setMinTotal(e.target.value)} />
              <Input label="Máx (R$)" type="number" min="0" value={maxTotal} onChange={e => setMaxTotal(e.target.value)} />
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-obsidian-100 shadow-card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
        ) : filteredOrders.length === 0 ? (
          <EmptyState title="Nenhum pedido encontrado" />
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-obsidian-100 text-left bg-obsidian-50/40">
                {['Pedido','Cliente','Data','Total','Status','Pagamento'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-xs font-medium text-obsidian-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr
                  key={order.id}
                  onClick={() => navigate(`/admin/orders/${order.id}`)}
                  className="border-b border-obsidian-50 last:border-0 hover:bg-obsidian-50/60 transition-colors duration-150 cursor-pointer"
                >
                  <td className="px-5 py-4 font-mono text-sm text-ink">#{order.id.slice(-8).toUpperCase()}</td>
                  <td className="px-5 py-4 text-sm text-ink">
                    <p className="font-medium">{order.user?.name || 'Cliente não identificado'}</p>
                    <p className="text-xs text-obsidian-400">{order.user?.email || `ID: ${order.userId.slice(-8).toUpperCase()}`}</p>
                  </td>
                  <td className="px-5 py-4 text-xs text-obsidian-500 whitespace-nowrap">{formatDateTime(order.createdAt)}</td>
                  <td className="px-5 py-4 text-sm font-medium text-ink">{formatCurrency(order.total)}</td>
                  <td className="px-5 py-4">
                    <span className={`badge-status border rounded-full text-xs px-2.5 py-0.5 ${getOrderDisplayStatusColor(order)}`}>
                      {getOrderDisplayStatusLabel(order)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {order.paymentStatus
                      ? <span className={`badge-status border rounded-full text-xs px-2.5 py-0.5 ${paymentStatusColor[order.paymentStatus] ?? ''}`}>{paymentStatusLabel[order.paymentStatus]}</span>
                      : <span className="text-xs text-obsidian-400">—</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Admin Order Detail ───────────────────────────────────────────────────────
export function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()
  const [order, setOrder]       = useState<Order | null>(null)
  const [shipment, setShipment] = useState<Shipment | null>(null)
  const [shipmentSelection, setShipmentSelection] = useState<ShipmentSelection | null>(null)
  const [shippingDestination, setShippingDestination] = useState<ShippingDestination | null>(null)
  const [loading, setLoading]   = useState(true)
  const [shipmentLoading, setShipmentLoading] = useState(false)
  const [status, setStatus]     = useState<OrderStatus>('pending')
  const [updating, setUpdating] = useState(false)
  const [processingLabel, setProcessingLabel] = useState(false)
  const [markingPickupReady, setMarkingPickupReady] = useState(false)

  useEffect(() => {
    if (!id) return
    ordersApi.getById(id).then(r => { setOrder(r.order); setStatus(r.order.status) }).finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!id) return
    setShipmentLoading(true)
    ordersApi.getShipment(id)
      .then(r => {
        setShipment(r.shipment)
        setShipmentSelection(r.selection ?? null)
        setShippingDestination(r.destination ?? r.selection?.destination ?? null)
      })
      .catch(() => {
        setShipment(null)
        setShipmentSelection(null)
        setShippingDestination(null)
      })
      .finally(() => setShipmentLoading(false))
  }, [id])

  const handleUpdateStatus = async () => {
    if (!id) return
    setUpdating(true)
    try {
      const r = await ordersApi.updateStatus(id, status)
      setOrder(r.order)
      toast('Status atualizado!', 'success')
    } catch (err) {
      toast((err as ApiError).message, 'error')
    } finally {
      setUpdating(false)
    }
  }

  const reloadShipment = async () => {
    if (!id) return
    setShipmentLoading(true)
    try {
      const response = await ordersApi.getShipment(id)
      setShipment(response.shipment)
      setShipmentSelection(response.selection ?? null)
      setShippingDestination(response.destination ?? response.selection?.destination ?? null)
    } catch {
      setShipment(null)
      setShipmentSelection(null)
      setShippingDestination(null)
    } finally {
      setShipmentLoading(false)
    }
  }

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
      console.error('shipping-label-error', mapped)
      await reloadShipment()
    } finally {
      setProcessingLabel(false)
    }
  }

  const handleMarkPickupReady = async () => {
    if (!id) return
    setMarkingPickupReady(true)
    try {
      await shippingApi.markPickupReady(id)
      toast('Pedido marcado como pronto para retirada!', 'success')
      await reloadShipment()
    } catch (err) {
      toast((err as ApiError).message || 'Erro ao marcar como pronto para retirada', 'error')
    } finally {
      setMarkingPickupReady(false)
    }
  }

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>
  if (!order) return <EmptyState title="Pedido não encontrado" />

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link to="/admin/orders" className="text-champagne-600">← Pedidos</Link>
        <span className="text-obsidian-300">/</span>
        <h1 className="font-display text-2xl text-ink">#{order.id.slice(-8).toUpperCase()}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-obsidian-100 shadow-card p-6">
            <h2 className="font-display text-lg text-ink mb-4">Itens do Pedido</h2>
            {order.items.map(item => (
              <div key={item.id} className="flex justify-between items-start gap-4 py-2.5 border-b border-obsidian-50 last:border-0 text-sm">
                <div>
                  <p className="text-obsidian-700 font-medium">{item.product?.name || `Produto ${item.productId.slice(-8).toUpperCase()}`}</p>
                  <p className="text-xs text-obsidian-500">SKU: {item.productId.slice(-8).toUpperCase()}</p>
                  <p className="text-xs text-obsidian-500 mt-0.5">{item.quantity} × {formatCurrency(item.price)}</p>
                </div>
                <span className="font-medium text-ink">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
            {typeof order.shippingAmountCents === 'number' && order.shippingAmountCents > 0 && (
              <div className="flex justify-between py-2.5 border-b border-obsidian-50 text-sm">
                <span className="text-obsidian-700">Frete{order.shippingServiceName ? ` (${order.shippingServiceName})` : ''}</span>
                <span>{formatCurrency(order.shippingAmountCents / 100)}</span>
              </div>
            )}
            <div className="flex justify-between pt-3 font-medium text-ink">
              <span>Total</span>
              <span className="font-display text-lg">{formatCurrency(order.total)}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-obsidian-100 shadow-card p-6 space-y-3">
            <h2 className="font-display text-lg text-ink">Entrega e Rastreio</h2>
            {shipmentLoading ? (
              <p className="text-sm text-obsidian-500">Carregando dados de entrega...</p>
            ) : !shipment ? (
              <p className="text-sm text-obsidian-500">Nenhum envio registrado para este pedido.</p>
            ) : (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-obsidian-500">Status</span>
                  <span className="font-medium text-ink">{shipmentStatusLabel[shipment.status] ?? shipment.status}</span>
                </div>
                {(shipment.serviceName || shipmentSelection?.serviceName || order.shippingServiceName) && (
                  <div className="flex justify-between text-sm">
                    <span className="text-obsidian-500">Serviço</span>
                    <span className="font-medium text-ink">{shipment.serviceName || shipmentSelection?.serviceName || order.shippingServiceName}</span>
                  </div>
                )}
                {order.shippingProvider === 'STORE_PICKUP' && order.pickupLocation && (
                  <div className="flex justify-between text-sm">
                    <span className="text-obsidian-500">Ponto de retirada</span>
                    <span className="font-medium text-ink">{pickupLocationLabel[order.pickupLocation] ?? order.pickupLocation}</span>
                  </div>
                )}
                {shipment.status === 'ready_for_pickup' && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                    <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Pronto para retirada</p>
                    <p className="text-sm text-emerald-700 mt-0.5">
                      Cliente pode retirar em {order.pickupLocation ? (pickupLocationLabel[order.pickupLocation] ?? order.pickupLocation) : 'loja'}.
                    </p>
                  </div>
                )}
                {shipment.trackingCode && (
                  <div className="flex justify-between text-sm">
                    <span className="text-obsidian-500">Tracking</span>
                    <span className="font-mono text-xs text-ink">{shipment.trackingCode}</span>
                  </div>
                )}
                {shipment.labelUrl && (
                  <a href={shipment.labelUrl} target="_blank" rel="noreferrer" className="text-sm text-emerald-600 hover:underline">
                    Abrir etiqueta
                  </a>
                )}
                {shipment.status === 'failed' && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-1.5">
                    <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">Falha na geração da etiqueta</p>
                    <p className="text-sm text-red-700">{shipment.lastError || 'Erro desconhecido'}</p>
                    <p className="text-xs text-red-600">Tentativas: {shipment.retryCount ?? 0}</p>
                    {shipment.nextRetryAt && (
                      <p className="text-xs text-red-600">Próxima tentativa: {formatDateTime(shipment.nextRetryAt)}</p>
                    )}
                    {shipment.dlqAt && (
                      <p className="text-xs font-semibold text-red-800">Falha definitiva em {formatDateTime(shipment.dlqAt)} — requer intervenção manual</p>
                    )}
                  </div>
                )}
                {shipment.events && shipment.events.length > 0 && (
                  <div className="pt-1 space-y-2">
                    <p className="text-xs uppercase tracking-wide text-obsidian-400">Eventos</p>
                    <div className="space-y-2 max-h-44 overflow-y-auto">
                      {shipment.events.slice(0, 10).map(event => (
                        <div key={`${event.id || event.eventType}-${event.occurredAt}`} className="rounded-lg border border-obsidian-100 p-2.5 bg-obsidian-50/40">
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

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-obsidian-100 shadow-card p-5 space-y-4">
            <h2 className="font-display text-lg text-ink">Atualizar Status</h2>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as OrderStatus)}
              className="input-luxury"
            >
              {Object.entries(orderStatusLabel).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <Button onClick={handleUpdateStatus} loading={updating} fullWidth>
              Salvar Status
            </Button>
            {order.shippingProvider === 'STORE_PICKUP' ? (
              <Button
                variant="outline"
                onClick={handleMarkPickupReady}
                loading={markingPickupReady}
                fullWidth
                disabled={shipment?.status === 'ready_for_pickup' || shipment?.status === 'delivered'}
              >
                {shipment?.status === 'ready_for_pickup' ? 'Já marcado como pronto' : 'Marcar pronto para retirada'}
              </Button>
            ) : (
              <Button variant="outline" onClick={handleProcessLabel} loading={processingLabel} fullWidth>
                Processar Etiqueta
              </Button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-obsidian-100 shadow-card p-5 space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-obsidian-500">Criado em</span>
              <span>{formatDateTime(order.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-obsidian-500">Cliente</span>
              <span className="text-right">{order.user?.name || `ID ${order.userId.slice(-8).toUpperCase()}`}</span>
            </div>
            {order.user?.email && (
              <div className="flex justify-between gap-2">
                <span className="text-obsidian-500">E-mail</span>
                <span className="text-right break-all">{order.user.email}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-obsidian-500">Status atual</span>
              <span className={`badge-status border rounded-full text-xs px-2.5 py-0.5 ${getOrderDisplayStatusColor(order, shipment)}`}>
                {getOrderDisplayStatusLabel(order, shipment)}
              </span>
            </div>
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
                <span className="text-right">{[shippingDestination?.city, shippingDestination?.state].filter(Boolean).join(' / ')}</span>
              </div>
            )}
            {order.shippingProvider === 'STORE_PICKUP' && order.pickupLocation ? (
              <div className="flex justify-between gap-2">
                <span className="text-obsidian-500">Retirada</span>
                <span className="text-right font-medium">{pickupLocationLabel[order.pickupLocation] ?? order.pickupLocation}</span>
              </div>
            ) : (order.shippingServiceName || shipmentSelection?.serviceName) && (
              <div className="flex justify-between gap-2">
                <span className="text-obsidian-500">Serviço</span>
                <span className="text-right">{order.shippingServiceName || shipmentSelection?.serviceName}</span>
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

// ─── Admin Payments ───────────────────────────────────────────────────────────
export function AdminPaymentsPage() {
  const navigate = useNavigate()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | Payment['status']>('all')
  const [providerFilter, setProviderFilter] = useState<'all' | string>('all')
  const [dateRange, setDateRange] = useState<DateRangeFilter>('30d')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => {
    paymentsApi.list().then(r => setPayments(r.payments)).finally(() => setLoading(false))
  }, [])

  const providerOptions = useMemo(() => {
    const providers = Array.from(new Set(payments.map(payment => payment.provider).filter(Boolean)))
    return [{ value: 'all', label: 'Todos' }, ...providers.map(provider => ({ value: provider, label: provider }))]
  }, [payments])

  const filteredPayments = useMemo(() => {
    const searchTerm = search.trim().toLowerCase()
    const min = minAmount ? Number(minAmount) : null
    const max = maxAmount ? Number(maxAmount) : null

    return payments
      .filter(payment => {
        if (statusFilter !== 'all' && payment.status !== statusFilter) return false
        if (providerFilter !== 'all' && payment.provider !== providerFilter) return false
        if (!isWithinDateRange(payment.createdAt, dateRange)) return false
        if (min !== null && payment.amount < min) return false
        if (max !== null && payment.amount > max) return false
        if (searchTerm) {
          const paymentCode = payment.id.slice(-8).toLowerCase()
          const orderCode = payment.orderId.slice(-8).toLowerCase()
          if (!paymentCode.includes(searchTerm) && !orderCode.includes(searchTerm)) return false
        }
        return true
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [payments, search, statusFilter, providerFilter, dateRange, minAmount, maxAmount])

  const paymentKpis = useMemo(() => {
    const base = filteredPayments
    const paidCount = base.filter(payment => payment.status === 'paid').length
    const failedCount = base.filter(payment => payment.status === 'failed').length
    const refundedCount = base.filter(payment => payment.status === 'refunded').length
    const totalAmount = base.reduce((sum, payment) => sum + payment.amount, 0)

    return {
      total: base.length,
      paidCount,
      failedCount,
      refundedCount,
      paidRate: base.length ? Math.round((paidCount / base.length) * 100) : 0,
      totalAmount,
    }
  }, [filteredPayments])

  const activeFiltersCount = [
    search !== '',
    statusFilter !== 'all',
    providerFilter !== 'all',
    dateRange !== '30d',
    minAmount !== '',
    maxAmount !== '',
  ].filter(Boolean).length

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setProviderFilter('all')
    setDateRange('30d')
    setMinAmount('')
    setMaxAmount('')
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-obsidian-400 mb-0.5">Operações</p>
          <h1 className="font-display text-3xl text-ink">Pagamentos</h1>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Transações',    value: paymentKpis.total.toString(),              color: 'text-ink' },
          { label: 'Taxa de sucesso', value: `${paymentKpis.paidRate}%`,              color: 'text-emerald-600' },
          { label: 'Valor total',   value: formatCurrency(paymentKpis.totalAmount),   color: 'text-ink' },
          { label: 'Falhas / Estornos', value: `${paymentKpis.failedCount} / ${paymentKpis.refundedCount}`, color: paymentKpis.failedCount > 0 ? 'text-red-600' : 'text-ink' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-obsidian-100 p-4 shadow-card">
            <p className="text-xs text-obsidian-400 uppercase tracking-wider">{s.label}</p>
            <p className={`text-2xl font-display mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-obsidian-100 shadow-card overflow-hidden">
        <button
          type="button"
          onClick={() => setFiltersOpen(o => !o)}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-obsidian-50/50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-medium text-obsidian-700">Filtros</span>
            {activeFiltersCount > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white text-xs font-bold">
                {activeFiltersCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {activeFiltersCount > 0 && (
              <span
                role="button"
                tabIndex={0}
                onClick={e => { e.stopPropagation(); clearFilters() }}
                onKeyDown={e => e.key === 'Enter' && clearFilters()}
                className="text-xs text-obsidian-400 hover:text-ink cursor-pointer"
              >
                Limpar
              </span>
            )}
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className={`text-obsidian-400 transition-transform duration-200 ${filtersOpen ? 'rotate-180' : ''}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </button>
        {filtersOpen && (
          <div className="border-t border-obsidian-100 p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3 items-end">
              <Input label="Busca" placeholder="#ID do pagamento ou pedido" value={search} onChange={e => setSearch(e.target.value)} />
              <Select
                label="Status"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as 'all' | Payment['status'])}
                options={[{ value: 'all', label: 'Todos' }, ...Object.entries(paymentStatusLabel).map(([value, label]) => ({ value, label }))]}
              />
              <Select label="Provedor" value={providerFilter} onChange={e => setProviderFilter(e.target.value)} options={providerOptions} />
              <Select
                label="Período"
                value={dateRange}
                onChange={e => setDateRange(e.target.value as DateRangeFilter)}
                options={[
                  { value: 'all', label: 'Todo período' },
                  { value: 'today', label: 'Hoje' },
                  { value: '7d', label: 'Últimos 7 dias' },
                  { value: '30d', label: 'Últimos 30 dias' },
                ]}
              />
              <Input label="Mín (R$)" type="number" min="0" value={minAmount} onChange={e => setMinAmount(e.target.value)} />
              <Input label="Máx (R$)" type="number" min="0" value={maxAmount} onChange={e => setMaxAmount(e.target.value)} />
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-obsidian-100 shadow-card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
        ) : filteredPayments.length === 0 ? (
          <EmptyState title="Nenhum pagamento encontrado" />
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-obsidian-100 text-left bg-obsidian-50/40">
                {['Pagamento','Pedido','Valor','Status','Data'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-xs font-medium text-obsidian-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map(p => (
                <tr
                  key={p.id}
                  onClick={() => navigate(`/admin/payments/${p.id}`)}
                  className="border-b border-obsidian-50 last:border-0 hover:bg-obsidian-50/60 transition-colors duration-150 cursor-pointer"
                >
                  <td className="px-5 py-4 font-mono text-xs text-obsidian-600">#{p.id.slice(-8).toUpperCase()}</td>
                  <td className="px-5 py-4 font-mono text-xs text-obsidian-400">#{p.orderId.slice(-8).toUpperCase()}</td>
                  <td className="px-5 py-4 text-sm font-medium text-ink">{formatCurrency(p.amount)}</td>
                  <td className="px-5 py-4">
                    <span className={`badge-status border rounded-full text-xs px-2.5 py-0.5 ${paymentStatusColor[p.status] ?? ''}`}>
                      {paymentStatusLabel[p.status]}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-obsidian-500 whitespace-nowrap">{formatDateTime(p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Admin Payment Detail ──────────────────────────────────────────────────────
export function AdminPaymentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()
  const [payment, setPayment]   = useState<Payment | null>(null)
  const [loading, setLoading]   = useState(true)
  const [refundAmt, setRefundAmt] = useState('')
  const [refunding, setRefunding] = useState(false)

  const load = () => {
    if (!id) return
    paymentsApi.getById(id).then(r => setPayment(r.payment)).finally(() => setLoading(false))
  }

  useEffect(load, [id])

  const handleRefund = async () => {
    if (!id || !confirm('Confirmar estorno?')) return
    setRefunding(true)
    try {
      await paymentsApi.refund(id, {
        amount: refundAmt ? parseFloat(refundAmt) : undefined,
        idempotencyKey: generateIdempotencyKey(),
      })
      toast('Estorno solicitado!', 'success')
      load()
    } catch (err) {
      toast((err as ApiError).message, 'error')
    } finally {
      setRefunding(false)
    }
  }

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>
  if (!payment) return <EmptyState title="Pagamento não encontrado" />

  const canRefund = payment.status === 'paid' || payment.status === 'authorized'

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link to="/admin/payments" className="text-champagne-600">← Pagamentos</Link>
        <span className="text-obsidian-300">/</span>
        <h1 className="font-display text-2xl text-ink">#{payment.id.slice(-8).toUpperCase()}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-obsidian-100 shadow-card p-6 space-y-3 text-sm">
            {[
              { label: 'ID do Pagamento', value: payment.id, mono: true },
              { label: 'ID do Pedido', value: payment.orderId, mono: true },
              { label: 'Provider', value: payment.provider },
              { label: 'ID no Provider', value: payment.providerPaymentId ?? '—', mono: true },
              { label: 'Valor', value: formatCurrency(payment.amount) },
              { label: 'Moeda', value: payment.currency },
              { label: 'Criado em', value: formatDateTime(payment.createdAt) },
            ].map(row => (
              <div key={row.label} className="flex justify-between border-b border-obsidian-50 pb-2.5 last:border-0">
                <span className="text-obsidian-500">{row.label}</span>
                <span className={`text-ink ${row.mono ? 'font-mono text-xs' : ''}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-obsidian-100 shadow-card p-5 space-y-2">
            <p className="text-xs uppercase tracking-wider text-obsidian-400 font-medium">Status</p>
            <span className={`badge-status border rounded-full text-sm px-3 py-1 ${paymentStatusColor[payment.status] ?? ''}`}>
              {paymentStatusLabel[payment.status]}
            </span>
          </div>

          {canRefund && (
            <div className="bg-white rounded-2xl border border-obsidian-100 shadow-card p-5 space-y-4">
              <h3 className="font-display text-base text-ink">Estorno</h3>
              <Input
                label="Valor do estorno (R$)"
                type="number"
                step="0.01"
                placeholder={`Total: ${payment.amount}`}
                value={refundAmt}
                onChange={e => setRefundAmt(e.target.value)}
              />
              <p className="text-xs text-obsidian-400">Deixe em branco para estorno total</p>
              <Button variant="danger" onClick={handleRefund} loading={refunding} fullWidth>
                Solicitar Estorno
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Admin Coupons ─────────────────────────────────────────────────────────────
export function AdminCouponsPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    couponsApi.list().then(r => setCoupons(r.coupons)).finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await couponsApi.delete(id)
      setCoupons(prev => prev.filter(c => c.id !== id))
      toast('Cupom excluído', 'success')
    } catch (err) {
      toast((err as ApiError).message ?? 'Erro ao excluir cupom', 'error')
    } finally {
      setDeletingId(null)
      setConfirmDeleteId(null)
    }
  }

  const sortedCoupons = useMemo(() => {
    return [...coupons].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [coupons])

  const couponKpis = useMemo(() => {
    const now = new Date()
    const base = sortedCoupons
    const activeCount = base.filter(coupon => coupon.active).length
    const expiredCount = base.filter(coupon => new Date(coupon.validUntil) < now).length
    const totalUsage = base.reduce((sum, coupon) => sum + coupon.usedCount, 0)
    const avgUsage = base.length ? Math.round(totalUsage / base.length) : 0

    return {
      total: base.length,
      activeCount,
      expiredCount,
      totalUsage,
      avgUsage,
    }
  }, [sortedCoupons])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-widest text-obsidian-400 mb-1">Admin</p>
          <h1 className="font-display text-3xl text-ink">Cupons</h1>
        </div>
        <Button onClick={() => navigate('/admin/coupons/new')}>+ Novo Cupom</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total de cupons', value: couponKpis.total.toString(),          color: 'text-ink' },
          { label: 'Ativos',          value: couponKpis.activeCount.toString(),     color: 'text-emerald-600' },
          { label: 'Expirados',       value: couponKpis.expiredCount.toString(),    color: couponKpis.expiredCount > 0 ? 'text-amber-600' : 'text-ink' },
          { label: 'Uso médio',       value: couponKpis.avgUsage.toString(),        color: 'text-ink' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-obsidian-100 p-4 shadow-card">
            <p className="text-xs text-obsidian-400 uppercase tracking-wider">{s.label}</p>
            <p className={`text-2xl font-display mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-obsidian-100 shadow-card overflow-x-auto">
        {loading ? (
          <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
        ) : sortedCoupons.length === 0 ? (
          <EmptyState title="Nenhum cupom" action={<Button onClick={() => navigate('/admin/coupons/new')}>Criar</Button>} />
        ) : (
          <table className="w-full min-w-[860px]">
            <thead>
              <tr className="border-b border-obsidian-100 text-left bg-obsidian-50/60">
                {['Código','Tipo','Desconto','Usos','Válido até','Ativo','Ações'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-xs font-medium text-obsidian-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedCoupons.map(c => (
                <tr key={c.id} className="border-b border-obsidian-50 last:border-0 hover:bg-obsidian-50/70 transition-colors duration-200">
                  <td className="px-5 py-4 font-mono text-sm font-medium text-champagne-700">{c.code}</td>
                  <td className="px-5 py-4 text-xs text-obsidian-600">{c.discountType === 'percentage' ? 'Percentual' : 'Fixo'}</td>
                  <td className="px-5 py-4 text-sm">{c.discountType === 'percentage' ? `${c.discountValue}%` : formatCurrency(c.discountValue)}</td>
                  <td className="px-5 py-4 text-sm">{c.usedCount}{c.maxUses ? `/${c.maxUses}` : ''}</td>
                  <td className="px-5 py-4 text-xs text-obsidian-500">{formatDateTime(c.validUntil)}</td>
                  <td className="px-5 py-4">
                    <span className={`badge-status border rounded-full text-xs px-2.5 py-0.5 ${c.active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-obsidian-50 text-obsidian-500 border-obsidian-200'}`}>
                      {c.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/admin/coupons/${c.id}/edit`)}>Editar</Button>
                      {confirmDeleteId === c.id ? (
                        <>
                          <Button
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white border-0"
                            onClick={() => handleDelete(c.id)}
                            disabled={deletingId === c.id}
                          >
                            {deletingId === c.id ? 'Excluindo…' : 'Confirmar'}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setConfirmDeleteId(null)}>Cancelar</Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => setConfirmDeleteId(c.id)}
                        >
                          Excluir
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ─── Admin Coupon Form ─────────────────────────────────────────────────────────
export function AdminCouponFormPage() {
  const { id } = useParams<{ id?: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEdit)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    code: '', discountType: 'percentage', discountValue: '', maxDiscountAmount: '',
    minOrderAmount: '', maxUses: '', maxUsesPerUser: '',
    validFrom: '', validUntil: '', active: true,
  })

  useEffect(() => {
    if (!isEdit || !id) return
    couponsApi.list().then(r => {
      const c = r.coupons.find(x => x.id === id)
      if (c) {
        setForm({
          code: c.code,
          discountType: c.discountType,
          discountValue: c.discountValue.toString(),
          maxDiscountAmount: c.maxDiscountAmount?.toString() ?? '',
          minOrderAmount: c.minOrderAmount?.toString() ?? '',
          maxUses: c.maxUses?.toString() ?? '',
          maxUsesPerUser: c.maxUsesPerUser?.toString() ?? '',
          validFrom: c.validFrom.split('.')[0],
          validUntil: c.validUntil.split('.')[0],
          active: c.active,
        })
      }
    }).finally(() => setLoading(false))
  }, [id, isEdit])

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [key]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const data = {
        code: form.code.toUpperCase(),
        discountType: form.discountType as 'percentage' | 'fixed',
        discountValue: parseFloat(form.discountValue),
        maxDiscountAmount: form.maxDiscountAmount ? parseFloat(form.maxDiscountAmount) : undefined,
        minOrderAmount: form.minOrderAmount ? parseFloat(form.minOrderAmount) : undefined,
        maxUses: form.maxUses ? parseInt(form.maxUses) : undefined,
        maxUsesPerUser: form.maxUsesPerUser ? parseInt(form.maxUsesPerUser) : undefined,
        validFrom: form.validFrom,
        validUntil: form.validUntil,
        active: form.active,
      }
      if (isEdit && id) {
        await couponsApi.update(id, data)
        toast('Cupom atualizado!', 'success')
      } else {
        await couponsApi.create(data)
        toast('Cupom criado!', 'success')
      }
      navigate('/admin/coupons')
    } catch (err) {
      setError((err as ApiError).message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link to="/admin/coupons" className="text-champagne-600">← Cupons</Link>
        <span className="text-obsidian-300">/</span>
        <h1 className="font-display text-2xl text-ink">{isEdit ? 'Editar Cupom' : 'Novo Cupom'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
        <div className="bg-white rounded-2xl border border-obsidian-100 shadow-card p-6 space-y-4">
          <h2 className="font-display text-lg text-ink">Configuração</h2>
          <Input label="Código *" value={form.code} onChange={set('code')} placeholder="BEMVINDO10" required />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Tipo *"
              value={form.discountType}
              onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))}
              options={[{ value: 'percentage', label: 'Percentual (%)' }, { value: 'fixed', label: 'Valor fixo (R$)' }]}
            />
            <Input label="Valor do desconto *" type="number" step="0.01" value={form.discountValue} onChange={set('discountValue')} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Desconto máximo (R$)" type="number" step="0.01" value={form.maxDiscountAmount} onChange={set('maxDiscountAmount')} />
            <Input label="Pedido mínimo (R$)" type="number" step="0.01" value={form.minOrderAmount} onChange={set('minOrderAmount')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Limite de usos" type="number" value={form.maxUses} onChange={set('maxUses')} />
            <Input label="Usos por usuário" type="number" value={form.maxUsesPerUser} onChange={set('maxUsesPerUser')} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-obsidian-100 shadow-card p-6 space-y-4">
          <h2 className="font-display text-lg text-ink">Validade</h2>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Válido de *" type="datetime-local" value={form.validFrom} onChange={set('validFrom')} required />
            <Input label="Válido até *" type="datetime-local" value={form.validUntil} onChange={set('validUntil')} required />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="active"
              checked={form.active}
              onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
              className="w-4 h-4 rounded border-obsidian-300 text-champagne-600"
            />
            <label htmlFor="active" className="text-sm text-ink">Cupom ativo</label>
          </div>
        </div>

        {error && <ErrorMessage message={error} />}

        <div className="flex gap-3">
          <Button type="submit" loading={saving}>{isEdit ? 'Salvar Alterações' : 'Criar Cupom'}</Button>
          <Button variant="outline" onClick={() => navigate('/admin/coupons')}>Cancelar</Button>
        </div>
      </form>
    </div>
  )
}

// ─── Admin Banners ───────────────────────────────────────────────────────────
const toDateTimeLocalValue = (value?: string | null) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const timezoneOffsetMs = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 16)
}

export function AdminBannersPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [banners, setBanners] = useState<Banner[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    bannersApi.adminList().then((response) => setBanners(response.banners ?? [])).finally(() => setLoading(false))
  }

  useEffect(load, [])

  useEffect(() => {
    productsApi.myProducts().then((response) => setProducts(response.products)).catch(() => {})
  }, [])

  const productNameById = useMemo(
    () => new Map(products.map((product) => [product.id, product.name])),
    [products]
  )

  const sortedBanners = useMemo(
    () => [...banners].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0) || new Date(b.startDate).getTime() - new Date(a.startDate).getTime()),
    [banners]
  )

  const handleActivate = async (id: string) => {
    try {
      await bannersApi.adminActivate(id)
      toast('Banner ativado!', 'success')
      load()
    } catch (err) {
      toast((err as ApiError).message ?? 'Não foi possível ativar o banner', 'error')
    }
  }

  const handlePause = async (id: string) => {
    try {
      await bannersApi.adminPause(id)
      toast('Banner pausado!', 'success')
      load()
    } catch (err) {
      toast((err as ApiError).message ?? 'Não foi possível pausar o banner', 'error')
    }
  }

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    try {
      await bannersApi.adminRemove(id)
      toast('Banner removido!', 'success')
      load()
    } catch (err) {
      toast((err as ApiError).message ?? 'Não foi possível remover o banner', 'error')
    } finally {
      setConfirmDeleteId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-widest text-obsidian-400 mb-1">Admin</p>
          <h1 className="font-display text-3xl text-ink">Banners</h1>
        </div>
        <Button onClick={() => navigate('/admin/banners/new')}>+ Novo Banner</Button>
      </div>

      <div className="bg-white rounded-2xl border border-obsidian-100 shadow-card overflow-x-auto">
        {loading ? (
          <div className="p-6 space-y-3">{[1, 2, 3].map((index) => <Skeleton key={index} className="h-12 rounded-xl" />)}</div>
        ) : sortedBanners.length === 0 ? (
          <EmptyState title="Nenhum banner" action={<Button onClick={() => navigate('/admin/banners/new')}>Criar Banner</Button>} />
        ) : (
          <table className="w-full min-w-[960px]">
            <thead>
              <tr className="border-b border-obsidian-100 text-left bg-obsidian-50/60">
                {['Produto', 'Tipo', 'Período', 'Prioridade', 'Status', 'Cliques', 'Ações'].map((header) => (
                  <th key={header} className="px-5 py-3.5 text-xs font-medium text-obsidian-400 uppercase tracking-wider whitespace-nowrap">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedBanners.map((banner) => (
                <tr key={banner.id} className="border-b border-obsidian-50 last:border-0 hover:bg-obsidian-50/70 transition-colors duration-200">
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-ink">{banner.product?.name ?? (banner.productId ? productNameById.get(banner.productId) : null) ?? 'Produto não encontrado'}</p>
                    <p className="text-xs text-obsidian-500 line-clamp-1">ID: {banner.product?.id ?? banner.productId ?? '—'}</p>
                  </td>
                  <td className="px-5 py-4 text-xs text-obsidian-600 uppercase">{banner.type}</td>
                  <td className="px-5 py-4 text-xs text-obsidian-500">
                    {formatDateTime(banner.startDate)}
                    <br />
                    até {formatDateTime(banner.endDate)}
                  </td>
                  <td className="px-5 py-4 text-sm">{banner.priority ?? 0}</td>
                  <td className="px-5 py-4">
                    <span className={`badge-status border rounded-full text-xs px-2.5 py-0.5 ${banner.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-obsidian-50 text-obsidian-500 border-obsidian-200'}`}>
                      {banner.status === 'active' ? 'Ativo' : 'Pausado'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm">{banner.clickCount ?? 0}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/admin/banners/${banner.id}/edit`)}>Editar</Button>
                      {banner.status === 'active' ? (
                        <Button variant="outline" size="sm" onClick={() => handlePause(banner.id)}>Pausar</Button>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => handleActivate(banner.id)}>Ativar</Button>
                      )}
                      {confirmDeleteId === banner.id ? (
                        <>
                          <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white border-0" onClick={() => handleDelete(banner.id)}>Confirmar</Button>
                          <Button variant="outline" size="sm" onClick={() => setConfirmDeleteId(null)}>Cancelar</Button>
                        </>
                      ) : (
                        <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setConfirmDeleteId(banner.id)}>Excluir</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export function AdminBannerFormPage() {
  const DEFAULT_BANNER_TITLE = 'Oferta 24H'
  const { id } = useParams<{ id?: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const { toast } = useToast()

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [products, setProducts] = useState<Product[]>([])

  const [form, setForm] = useState({
    startDate: '',
    endDate: '',
    showTimer: true,
    priority: '0',
    type: 'flash_sale',
    status: 'paused',
    productId: '',
  })

  const activeProducts = useMemo(
    () => products.filter((product) => product.isActive !== false),
    [products]
  )

  useEffect(() => {
    productsApi.myProducts().then((response) => setProducts(response.products)).catch(() => {})

    if (!isEdit || !id) {
      const now = new Date()
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      setForm((prev) => ({
        ...prev,
        startDate: toDateTimeLocalValue(now.toISOString()),
        endDate: toDateTimeLocalValue(tomorrow.toISOString()),
      }))
      setLoading(false)
      return
    }

    bannersApi.adminGetById(id)
      .then((banner) => {
        setForm({
          startDate: toDateTimeLocalValue(banner.startDate),
          endDate: toDateTimeLocalValue(banner.endDate),
          showTimer: banner.showTimer,
          priority: (banner.priority ?? 0).toString(),
          type: banner.type || 'flash_sale',
          status: banner.status || 'paused',
          productId: banner.product?.id ?? banner.productId ?? '',
        })
      })
      .finally(() => setLoading(false))
  }, [id, isEdit])

  const setValue = (key: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = event.target.type === 'checkbox'
      ? (event.target as HTMLInputElement).checked
      : event.target.value

    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      if (!form.productId) {
        setError('Selecione um produto para o banner')
        setSaving(false)
        return
      }

      const payload = {
        title: DEFAULT_BANNER_TITLE,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
        endDate: new Date(form.endDate).toISOString(),
        showTimer: form.showTimer,
        priority: Number(form.priority) || 0,
        type: form.type,
        status: form.status,
        productId: form.productId,
      }

      if (isEdit && id) {
        await bannersApi.adminUpdate(id, payload)
        toast('Banner atualizado!', 'success')
      } else {
        await bannersApi.adminCreate(payload)
        toast('Banner criado!', 'success')
      }

      navigate('/admin/banners')
    } catch (err) {
      setError((err as ApiError).message ?? 'Não foi possível salvar o banner')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link to="/admin/banners" className="text-champagne-600">← Banners</Link>
        <span className="text-obsidian-300">/</span>
        <h1 className="font-display text-2xl text-ink">{isEdit ? 'Editar Banner' : 'Novo Banner'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="bg-white rounded-2xl border border-obsidian-100 shadow-card p-6 space-y-4">
          <h2 className="font-display text-lg text-ink">Configuração Dinâmica</h2>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Início (opcional)" type="datetime-local" value={form.startDate} onChange={setValue('startDate')} />
            <Input label="Fim *" type="datetime-local" value={form.endDate} onChange={setValue('endDate')} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Tipo"
              value={form.type}
              onChange={setValue('type')}
              options={[{ value: 'flash_sale', label: 'Flash Sale' }]}
            />
            <Input label="Prioridade" type="number" value={form.priority} onChange={setValue('priority')} min="0" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Status"
              value={form.status}
              onChange={setValue('status')}
              options={[{ value: 'active', label: 'Ativo' }, { value: 'paused', label: 'Pausado' }]}
            />
            <Select
              label="Produto *"
              value={form.productId}
              onChange={setValue('productId')}
              placeholder="Selecione"
              options={activeProducts.map((product) => ({ value: product.id, label: product.name }))}
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="showTimer"
              checked={form.showTimer}
              onChange={setValue('showTimer')}
              className="w-4 h-4 rounded border-obsidian-300 text-champagne-600"
            />
            <label htmlFor="showTimer" className="text-sm text-ink">Mostrar timer</label>
          </div>
        </div>

        {error && <ErrorMessage message={error} />}

        <div className="flex gap-3">
          <Button type="submit" loading={saving}>{isEdit ? 'Salvar Alterações' : 'Criar Banner'}</Button>
          <Button variant="outline" onClick={() => navigate('/admin/banners')}>Cancelar</Button>
        </div>
      </form>
    </div>
  )
}

// ─── Status Page ──────────────────────────────────────────────────────────────
export function StatusPage() {
  const [health, setHealth]   = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  const check = () => {
    setLoading(true)
    setError('')
    healthApi.get()
      .then(setHealth)
      .catch(() => setError('API offline ou não acessível'))
      .finally(() => setLoading(false))
  }

  useEffect(check, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl text-ink">Status do Sistema</h1>
        <Button variant="outline" onClick={check} size="sm">↻ Verificar</Button>
      </div>

      {loading ? (
        <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
      ) : error ? (
        <ErrorMessage message={error} />
      ) : health ? (
        <div className="space-y-4 max-w-lg">
          {[
            { label: 'API Principal', ok: health.ok },
            { label: 'Worker de Pagamentos', ok: health.workers.paymentEventWorker },
            { label: 'Reconciliação de Pagamentos', ok: health.workers.paymentReconciliation },
          ].map(item => (
            <div key={item.label} className="bg-white rounded-2xl border border-obsidian-100 shadow-card p-5 flex items-center justify-between">
              <span className="font-medium text-ink text-sm">{item.label}</span>
              <span className={`flex items-center gap-1.5 text-sm font-medium ${item.ok ? 'text-green-600' : 'text-red-500'}`}>
                <span className={`w-2 h-2 rounded-full ${item.ok ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                {item.ok ? 'Online' : 'Offline'}
              </span>
            </div>
          ))}
          <p className="text-xs text-obsidian-400 text-right">
            Verificado em {new Date(health.timestamp).toLocaleTimeString('pt-BR')}
          </p>
        </div>
      ) : null}
    </div>
  )
}

// ─── Admin Shipping ───────────────────────────────────────────────────────────
export function AdminShippingPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ordersApi.list().then(r => setOrders(r.orders)).finally(() => setLoading(false))
  }, [])

  const shippingOrders = useMemo(() =>
    orders.filter(o => o.shippingProvider != null && o.shippingProvider !== 'STORE_PICKUP'),
    [orders]
  )

  const pickupOrders = useMemo(() =>
    orders.filter(o => o.shippingProvider === 'STORE_PICKUP'),
    [orders]
  )

  const awaitingLabel = useMemo(() =>
    shippingOrders.filter(o => o.paymentStatus === 'paid' && o.status === 'processing'),
    [shippingOrders]
  )

  const inTransit = useMemo(() =>
    shippingOrders.filter(o => o.status === 'shipped'),
    [shippingOrders]
  )

  const delivered = useMemo(() =>
    shippingOrders.filter(o => o.status === 'delivered'),
    [shippingOrders]
  )

  const awaitingPickup = useMemo(() =>
    pickupOrders.filter(o => o.paymentStatus === 'paid' && o.status === 'processing'),
    [pickupOrders]
  )

  const renderOrderRow = (order: Order) => (
    <Link
      key={order.id}
      to={`/admin/orders/${order.id}`}
      className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-obsidian-50 transition-colors"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink font-mono">#{order.id.slice(-8).toUpperCase()}</p>
        <p className="text-xs text-obsidian-400 mt-0.5">
          {order.user?.name || `ID ${order.userId.slice(-8).toUpperCase()}`}
          {order.shippingServiceName ? ` · ${order.shippingServiceName}` : ''}
          {order.pickupLocation ? ` · ${pickupLocationLabel[order.pickupLocation] ?? order.pickupLocation}` : ''}
        </p>
      </div>
      <div className="flex items-center gap-3 ml-4 shrink-0">
        <span className="text-xs text-obsidian-400">{formatDateTime(order.createdAt)}</span>
        <span className="text-sm font-medium text-ink">{formatCurrency(order.total)}</span>
        <span className="text-champagne-600 text-sm">→</span>
      </div>
    </Link>
  )

  const SectionCard = ({
    title,
    badge,
    badgeColor,
    items,
    emptyText,
  }: {
    title: string
    badge: number
    badgeColor: string
    items: Order[]
    emptyText: string
  }) => (
    <div className="bg-white rounded-2xl border border-obsidian-100 shadow-card">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-obsidian-100">
        <h2 className="font-display text-base text-ink">{title}</h2>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeColor}`}>
          {badge}
        </span>
      </div>
      <div className="p-2">
        {loading
          ? [1, 2, 3].map(i => <Skeleton key={i} className="h-12 m-3 rounded-xl" />)
          : items.length === 0
            ? <p className="text-sm text-obsidian-400 px-4 py-4">{emptyText}</p>
            : items.map(renderOrderRow)
        }
      </div>
    </div>
  )

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-obsidian-400 mb-1">Logística</p>
        <h1 className="font-display text-3xl text-ink">Frete & Etiquetas</h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Aguard. Etiqueta', value: loading ? '—' : awaitingLabel.length.toString(),  color: 'bg-orange-50 text-orange-600' },
          { label: 'Em Trânsito',      value: loading ? '—' : inTransit.length.toString(),       color: 'bg-blue-50 text-blue-600' },
          { label: 'Entregues',        value: loading ? '—' : delivered.length.toString(),        color: 'bg-green-50 text-green-600' },
          { label: 'Retirada Pendente',value: loading ? '—' : awaitingPickup.length.toString(),   color: 'bg-amber-50 text-amber-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-obsidian-100 p-5 shadow-card">
            <p className={`text-2xl font-display ${s.color.split(' ')[1]}`}>{s.value}</p>
            <p className="text-xs text-obsidian-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        <SectionCard
          title="Aguardando Etiqueta"
          badge={awaitingLabel.length}
          badgeColor="bg-orange-100 text-orange-700"
          items={awaitingLabel}
          emptyText="Nenhum pedido aguardando etiqueta."
        />
        <SectionCard
          title="Retirada na Loja — Ação Necessária"
          badge={awaitingPickup.length}
          badgeColor="bg-amber-100 text-amber-700"
          items={awaitingPickup}
          emptyText="Nenhuma retirada pendente."
        />
        <SectionCard
          title="Em Trânsito"
          badge={inTransit.length}
          badgeColor="bg-blue-100 text-blue-700"
          items={inTransit}
          emptyText="Nenhum pedido em trânsito no momento."
        />
      </div>
    </div>
  )
}

// ─── Admin Home Tiles ─────────────────────────────────────────────────────────

const TILE_LABELS: Record<HomeTileKey, string> = {
  'perfumes':      'Perfumes',
  'hidratantes':   'Hidratantes',
  'mais-vendidos': 'Mais Vendidos',
  'lancamentos':   'Lançamentos',
}

export function AdminHomeTilesPage() {
  const { toast } = useToast()
  const [tiles, setTiles] = useState<HomeTile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<HomeTileKey | null>(null)

  useEffect(() => {
    homeTilesApi.list()
      .then((res) => setTiles(res.tiles || []))
      .catch(() => toast('Erro ao carregar tiles', 'error'))
      .finally(() => setLoading(false))
  }, [])

  const handleImageChange = async (key: HomeTileKey, file: File) => {
    setUploading(key)
    try {
      const { url } = await uploadProductImageToStorage(file)
      const res = await homeTilesApi.updateImage(key, url)
      setTiles((prev) => prev.map((t) => t.key === key ? res.tile : t))
      toast('Imagem atualizada!', 'success')
    } catch {
      toast('Erro ao atualizar imagem', 'error')
    } finally {
      setUploading(null)
    }
  }

  if (loading) {
    return (
      <div className="p-8 grid grid-cols-2 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-52 rounded-2xl" />)}
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-[#1A1A1A] mb-1">Imagens das Categorias</h1>
      <p className="text-sm text-gray-500 mb-8">Defina a imagem exibida em cada tile na página inicial.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {(['perfumes', 'hidratantes', 'mais-vendidos', 'lancamentos'] as HomeTileKey[]).map((key) => {
          const tile = tiles.find((t) => t.key === key)
          const isUploading = uploading === key

          return (
            <div key={key} className="flex flex-col gap-2">
              <div className="relative rounded-2xl overflow-hidden bg-gray-100 aspect-square border border-gray-200">
                {tile?.imageUrl ? (
                  <img src={tile.imageUrl} alt={TILE_LABELS[key]} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  </div>
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                    <Spinner />
                  </div>
                )}
              </div>
              <p className="text-sm font-semibold text-[#333] text-center">{TILE_LABELS[key]}</p>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={isUploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageChange(key, file)
                    e.target.value = ''
                  }}
                />
                <span className="block text-center text-xs py-1.5 px-3 rounded-full border border-gray-300 text-gray-600 hover:border-[#2a7e51] hover:text-[#2a7e51] transition-colors">
                  {tile?.imageUrl ? 'Trocar imagem' : 'Adicionar imagem'}
                </span>
              </label>
            </div>
          )
        })}
      </div>
    </div>
  )
}
