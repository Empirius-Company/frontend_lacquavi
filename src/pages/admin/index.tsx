import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { productsApi, categoriesApi, subcategoriesApi } from '../../api/catalogApi'
import { uploadProductImageToStorage } from '../../api/storageApi'
import { ordersApi, paymentsApi, couponsApi, healthApi, bannersApi, boxTypesApi, boxRulesApi } from '../../api/index'
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
  BoxType,
  BoxCategoryRule,
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
      productsApi.list(),
    ]).then(([o, pay, p]) => {
      setOrders(o.orders)
      setPayments(pay.payments)
      setProducts(p.products)
    }).finally(() => setLoading(false))
  }, [])

  const totalRevenue = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0)
  const pendingOrders = orders.filter(o => getOrderDisplayStatus(o) === 'pending').length

  const stats = [
    { label: 'Pedidos',         value: loading ? '—' : orders.length.toString(),          icon: '◎', color: 'bg-blue-50 text-blue-600' },
    { label: 'Receita Total',   value: loading ? '—' : formatCurrency(totalRevenue),       icon: '◉', color: 'bg-green-50 text-green-600' },
    { label: 'Pendentes',       value: loading ? '—' : pendingOrders.toString(),            icon: '◌', color: 'bg-amber-50 text-amber-600' },
    { label: 'Produtos',        value: loading ? '—' : products.length.toString(),          icon: '✦', color: 'bg-purple-50 text-purple-600' },
  ]

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-obsidian-400 mb-1">Painel</p>
        <h1 className="font-display text-3xl text-ink">Dashboard</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
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

  const load = () => {
    setLoading(true)
    productsApi.myProducts().then(r => setProducts(r.products)).finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleDeactivate = async (id: string, name: string) => {
    if (!confirm(`Desativar "${name}"?`)) return
    try {
      await productsApi.remove(id)
      setProducts(previous => previous.map(product => product.id === id ? { ...product, isActive: false } : product))
      toast('Produto desativado com sucesso', 'success')
    } catch (err) {
      toast((err as ApiError).message, 'error')
    }
  }

  const handleReactivate = async (id: string, name: string) => {
    if (!confirm(`Reativar "${name}"?`)) return
    try {
      await productsApi.update(id, { isActive: true })
      setProducts(previous => previous.map(product => product.id === id ? { ...product, isActive: true } : product))
      toast('Produto reativado com sucesso', 'success')
    } catch (err) {
      toast((err as ApiError).message, 'error')
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
                      {isActive ? (
                        <Button variant="danger" size="sm" onClick={() => handleDeactivate(product.id, product.name)}>
                          Desativar
                        </Button>
                      ) : (
                        <Button size="sm" onClick={() => handleReactivate(product.id, product.name)}>
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
    stock: '',
    brand: '',
    volume: '',
    gender: '',
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
            stock: p.stock.toString(), brand: p.brand ?? '', volume: p.volume ?? '',
            gender: p.gender ?? '', categoryId: p.categoryId ?? '',
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
        stock: parseInt(form.stock),
        brand: form.brand || undefined,
        volume: form.volume || undefined,
        gender: form.gender || undefined,
        categoryId: form.categoryId || undefined,
        subcategoryId: form.subcategoryId || undefined,
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
          <div className="grid grid-cols-2 gap-4">
            <Input label="Preço (R$) *" type="number" step="0.01" min="0" value={form.price} onChange={set('price')} required />
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
  const [packagingCategory, setPackagingCategory] = useState('')
  const [saving, setSaving]         = useState(false)

  const load = () => {
    setLoading(true)
    categoriesApi.list().then(r => setCategories(r.data)).finally(() => setLoading(false))
  }

  useEffect(load, [])

  const openModal = (cat?: Category) => {
    setEditing(cat ?? null)
    setName(cat?.name ?? '')
    setPackagingCategory(cat?.packagingCategory ?? '')
    setModal(true)
  }

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      if (editing) {
        await categoriesApi.update(editing.id, {
          name,
          packagingCategory: packagingCategory.trim() || undefined,
        })
        toast('Categoria atualizada!', 'success')
      } else {
        await categoriesApi.create({
          name,
          packagingCategory: packagingCategory.trim() || undefined,
        })
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

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Deletar "${name}"?`)) return
    try {
      await categoriesApi.remove(id)
      toast('Categoria deletada', 'success')
      load()
    } catch (err) {
      toast((err as ApiError).message, 'error')
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
                <th className="px-5 py-3.5 text-xs font-medium text-obsidian-400 uppercase tracking-wider">Nome</th>
                <th className="px-5 py-3.5 text-xs font-medium text-obsidian-400 uppercase tracking-wider">Categoria de embalagem</th>
                <th className="px-5 py-3.5 text-xs font-medium text-obsidian-400 uppercase tracking-wider">Slug</th>
                <th className="px-5 py-3.5 text-xs font-medium text-obsidian-400 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => (
                <tr key={cat.id} className="border-b border-obsidian-50 last:border-0">
                  <td className="px-5 py-4 text-sm font-medium text-ink">{cat.name}</td>
                  <td className="px-5 py-4 text-sm text-obsidian-500 font-mono">{cat.packagingCategory || '—'}</td>
                  <td className="px-5 py-4 text-sm text-obsidian-400 font-mono">{cat.slug}</td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openModal(cat)}>Editar</Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(cat.id, cat.name)}>Excluir</Button>
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
          <Input
            label="Categoria de embalagem"
            value={packagingCategory}
            onChange={e => setPackagingCategory(e.target.value)}
            placeholder="Ex: perfume, kit"
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

// ─── Admin Subcategories ─────────────────────────────────────────────────────
export function AdminSubcategoriesPage() {
  const { toast } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Subcategory | null>(null)
  const [saving, setSaving] = useState(false)
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

  const handleDelete = async (subcategory: Subcategory) => {
    if (!confirm(`Deletar subcategoria "${subcategory.name}"?`)) return
    try {
      await subcategoriesApi.remove(subcategory.id)
      toast('Subcategoria removida!', 'success')
      load()
    } catch (err) {
      toast((err as ApiError).message, 'error')
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
                      <Button variant="danger" size="sm" onClick={() => handleDelete(subcategory)}>Excluir</Button>
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

// ─── Admin Box Types ─────────────────────────────────────────────────────────
export function AdminBoxTypesPage() {
  const { toast } = useToast()
  const [boxTypes, setBoxTypes] = useState<BoxType[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<BoxType | null>(null)
  const [form, setForm] = useState({
    name: '',
    lengthCm: '',
    widthCm: '',
    heightCm: '',
    maxWeightGrams: '',
    isActive: true,
  })

  const load = () => {
    setLoading(true)
    boxTypesApi
      .list()
      .then((response) => setBoxTypes(response.boxTypes ?? response.data ?? []))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const openModal = (boxType?: BoxType) => {
    setEditing(boxType ?? null)
    setForm({
      name: boxType?.name ?? '',
      lengthCm: boxType?.lengthCm?.toString() ?? '',
      widthCm: boxType?.widthCm?.toString() ?? '',
      heightCm: boxType?.heightCm?.toString() ?? '',
      maxWeightGrams: boxType?.maxWeightGrams?.toString() ?? '',
      isActive: boxType?.isActive ?? true,
    })
    setModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        lengthCm: Number(form.lengthCm),
        widthCm: Number(form.widthCm),
        heightCm: Number(form.heightCm),
        maxWeightGrams: Number(form.maxWeightGrams),
        isActive: form.isActive,
      }

      if (editing) {
        await boxTypesApi.update(editing.id, payload)
        toast('Caixa atualizada!', 'success')
      } else {
        await boxTypesApi.create(payload)
        toast('Caixa criada!', 'success')
      }
      setModal(false)
      load()
    } catch (err) {
      toast((err as ApiError).message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (boxType: BoxType) => {
    if (!confirm(`Excluir caixa "${boxType.name}"?`)) return
    try {
      await boxTypesApi.remove(boxType.id)
      toast('Caixa removida!', 'success')
      load()
    } catch (err) {
      toast((err as ApiError).message, 'error')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl text-ink">Tipos de Caixa</h1>
        <Button onClick={() => openModal()}>+ Nova Caixa</Button>
      </div>

      <div className="bg-white rounded-2xl border border-obsidian-100 shadow-card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
        ) : boxTypes.length === 0 ? (
          <EmptyState title="Nenhum tipo de caixa" action={<Button onClick={() => openModal()}>Criar</Button>} />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-obsidian-100 text-left">
                <th className="px-5 py-3.5 text-xs font-medium text-obsidian-400 uppercase tracking-wider">Nome</th>
                <th className="px-5 py-3.5 text-xs font-medium text-obsidian-400 uppercase tracking-wider">Dimensões</th>
                <th className="px-5 py-3.5 text-xs font-medium text-obsidian-400 uppercase tracking-wider">Peso máx</th>
                <th className="px-5 py-3.5 text-xs font-medium text-obsidian-400 uppercase tracking-wider">Ativa</th>
                <th className="px-5 py-3.5 text-xs font-medium text-obsidian-400 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody>
              {boxTypes.map((boxType) => (
                <tr key={boxType.id} className="border-b border-obsidian-50 last:border-0">
                  <td className="px-5 py-4 text-sm font-medium text-ink">{boxType.name}</td>
                  <td className="px-5 py-4 text-sm text-obsidian-500">{boxType.lengthCm}×{boxType.widthCm}×{boxType.heightCm} cm</td>
                  <td className="px-5 py-4 text-sm text-obsidian-500">{boxType.maxWeightGrams} g</td>
                  <td className="px-5 py-4 text-sm text-obsidian-500">{boxType.isActive ? 'Sim' : 'Não'}</td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openModal(boxType)}>Editar</Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(boxType)}>Excluir</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar Caixa' : 'Nova Caixa'} maxWidth="max-w-lg">
        <div className="space-y-4">
          <Input label="Nome" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Comprimento (cm)" type="number" min="1" value={form.lengthCm} onChange={(event) => setForm((prev) => ({ ...prev, lengthCm: event.target.value }))} />
            <Input label="Largura (cm)" type="number" min="1" value={form.widthCm} onChange={(event) => setForm((prev) => ({ ...prev, widthCm: event.target.value }))} />
            <Input label="Altura (cm)" type="number" min="1" value={form.heightCm} onChange={(event) => setForm((prev) => ({ ...prev, heightCm: event.target.value }))} />
            <Input label="Peso máximo (g)" type="number" min="1" value={form.maxWeightGrams} onChange={(event) => setForm((prev) => ({ ...prev, maxWeightGrams: event.target.value }))} />
          </div>
          <label className="flex items-center gap-2 text-sm text-obsidian-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
              className="w-4 h-4"
            />
            Caixa ativa
          </label>
          <div className="flex gap-3">
            <Button onClick={handleSave} loading={saving} fullWidth>Salvar</Button>
            <Button variant="outline" onClick={() => setModal(false)} fullWidth>Cancelar</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ─── Admin Box Rules ─────────────────────────────────────────────────────────
export function AdminBoxRulesPage() {
  const { toast } = useToast()
  const [boxRules, setBoxRules] = useState<BoxCategoryRule[]>([])
  const [boxTypes, setBoxTypes] = useState<BoxType[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<BoxCategoryRule | null>(null)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [form, setForm] = useState({
    packagingCategory: '',
    boxTypeId: '',
    maxItems: '1',
    priority: '1',
    allowMix: false,
    isActive: true,
  })

  const load = () => {
    setLoading(true)
    Promise.all([
      boxRulesApi.list(categoryFilter ? { category: categoryFilter } : undefined),
      boxTypesApi.list(),
    ])
      .then(([boxRulesResponse, boxTypesResponse]) => {
        setBoxRules(boxRulesResponse.boxRules ?? boxRulesResponse.data ?? [])
        setBoxTypes(boxTypesResponse.boxTypes ?? boxTypesResponse.data ?? [])
      })
      .finally(() => setLoading(false))
  }

  useEffect(load, [categoryFilter])

  const openModal = (rule?: BoxCategoryRule) => {
    setEditing(rule ?? null)
    setForm({
      packagingCategory: rule?.packagingCategory ?? '',
      boxTypeId: rule?.boxTypeId ?? '',
      maxItems: rule?.maxItems?.toString() ?? '1',
      priority: rule?.priority?.toString() ?? '1',
      allowMix: rule?.allowMix ?? false,
      isActive: rule?.isActive ?? true,
    })
    setModal(true)
  }

  const handleSave = async () => {
    if (!form.packagingCategory.trim() || !form.boxTypeId) return
    setSaving(true)
    try {
      const payload = {
        packagingCategory: form.packagingCategory.trim().toLowerCase(),
        boxTypeId: form.boxTypeId,
        maxItems: Number(form.maxItems),
        priority: Number(form.priority),
        allowMix: form.allowMix,
        isActive: form.isActive,
      }

      if (editing) {
        await boxRulesApi.update(editing.id, payload)
        toast('Regra atualizada!', 'success')
      } else {
        await boxRulesApi.create(payload)
        toast('Regra criada!', 'success')
      }

      setModal(false)
      load()
    } catch (err) {
      toast((err as ApiError).message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (rule: BoxCategoryRule) => {
    if (!confirm(`Excluir regra de "${rule.packagingCategory}"?`)) return
    try {
      await boxRulesApi.remove(rule.id)
      toast('Regra removida!', 'success')
      load()
    } catch (err) {
      toast((err as ApiError).message, 'error')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl text-ink">Regras de Caixa</h1>
        <Button onClick={() => openModal()}>+ Nova Regra</Button>
      </div>

      <div className="bg-white rounded-2xl border border-obsidian-100 shadow-card p-5 mb-4">
        <Input
          label="Filtrar por categoria de embalagem"
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          placeholder="Ex: perfume, kit"
        />
      </div>

      <div className="bg-white rounded-2xl border border-obsidian-100 shadow-card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
        ) : boxRules.length === 0 ? (
          <EmptyState title="Nenhuma regra de caixa" action={<Button onClick={() => openModal()}>Criar</Button>} />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-obsidian-100 text-left">
                <th className="px-5 py-3.5 text-xs font-medium text-obsidian-400 uppercase tracking-wider">Categoria</th>
                <th className="px-5 py-3.5 text-xs font-medium text-obsidian-400 uppercase tracking-wider">Caixa</th>
                <th className="px-5 py-3.5 text-xs font-medium text-obsidian-400 uppercase tracking-wider">Capacidade</th>
                <th className="px-5 py-3.5 text-xs font-medium text-obsidian-400 uppercase tracking-wider">Prioridade</th>
                <th className="px-5 py-3.5 text-xs font-medium text-obsidian-400 uppercase tracking-wider">Ativa</th>
                <th className="px-5 py-3.5 text-xs font-medium text-obsidian-400 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody>
              {boxRules.map((rule) => (
                <tr key={rule.id} className="border-b border-obsidian-50 last:border-0">
                  <td className="px-5 py-4 text-sm font-medium text-ink">{rule.packagingCategory}</td>
                  <td className="px-5 py-4 text-sm text-obsidian-500">{rule.boxType?.name ?? boxTypes.find((boxType) => boxType.id === rule.boxTypeId)?.name ?? '—'}</td>
                  <td className="px-5 py-4 text-sm text-obsidian-500">{rule.maxItems} item(ns)</td>
                  <td className="px-5 py-4 text-sm text-obsidian-500">{rule.priority}</td>
                  <td className="px-5 py-4 text-sm text-obsidian-500">{rule.isActive ? 'Sim' : 'Não'}</td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openModal(rule)}>Editar</Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(rule)}>Excluir</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar Regra' : 'Nova Regra'} maxWidth="max-w-lg">
        <div className="space-y-4">
          <Input
            label="Categoria de embalagem"
            value={form.packagingCategory}
            onChange={(event) => setForm((prev) => ({ ...prev, packagingCategory: event.target.value }))}
            placeholder="Ex: perfume"
          />
          <Select
            label="Tipo de caixa"
            value={form.boxTypeId}
            onChange={(event) => setForm((prev) => ({ ...prev, boxTypeId: event.target.value }))}
            options={boxTypes.map((boxType) => ({ value: boxType.id, label: boxType.name }))}
            placeholder="Selecione"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Máx itens" type="number" min="1" value={form.maxItems} onChange={(event) => setForm((prev) => ({ ...prev, maxItems: event.target.value }))} />
            <Input label="Prioridade" type="number" min="1" value={form.priority} onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value }))} />
          </div>
          <label className="flex items-center gap-2 text-sm text-obsidian-700">
            <input
              type="checkbox"
              checked={form.allowMix}
              onChange={(event) => setForm((prev) => ({ ...prev, allowMix: event.target.checked }))}
              className="w-4 h-4"
            />
            Permitir mistura entre categorias
          </label>
          <label className="flex items-center gap-2 text-sm text-obsidian-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
              className="w-4 h-4"
            />
            Regra ativa
          </label>
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
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all')
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'none' | NonNullable<Order['paymentStatus']>>('all')
  const [dateRange, setDateRange] = useState<DateRangeFilter>('30d')
  const [minTotal, setMinTotal] = useState('')
  const [maxTotal, setMaxTotal] = useState('')

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
          if (!orderCode.includes(searchTerm) && !couponCode.includes(searchTerm)) return false
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

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="bg-gradient-to-r from-rose-50/90 via-white to-rose-100/50 border border-rose-100 rounded-2xl p-5 shadow-card">
        <p className="text-xs uppercase tracking-widest text-rose-500/80 mb-1">Admin</p>
        <h1 className="font-display text-3xl text-ink">Pedidos</h1>
        <p className="text-sm text-obsidian-500 mt-1">Visão consolidada de operação, pagamento e performance.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-rose-50 to-white rounded-2xl border border-rose-100 p-4 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
          <p className="text-xs text-obsidian-400 uppercase tracking-wider">Pedidos no filtro</p>
          <p className="text-2xl font-display text-ink mt-1">{kpis.total}</p>
        </div>
        <div className="bg-white rounded-2xl border border-obsidian-100 p-4 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
          <p className="text-xs text-obsidian-400 uppercase tracking-wider">Taxa pagamento</p>
          <p className="text-2xl font-display text-rose-600 mt-1">{kpis.paidRate}%</p>
        </div>
        <div className="bg-white rounded-2xl border border-obsidian-100 p-4 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
          <p className="text-xs text-obsidian-400 uppercase tracking-wider">Receita no filtro</p>
          <p className="text-2xl font-display text-ink mt-1">{formatCurrency(kpis.revenue)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-obsidian-100 p-4 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
          <p className="text-xs text-obsidian-400 uppercase tracking-wider">Ticket médio</p>
          <p className="text-2xl font-display text-ink mt-1">{formatCurrency(kpis.avgTicket)}</p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-rose-50/70 via-white to-rose-50/40 rounded-2xl border border-rose-100 shadow-card p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs uppercase tracking-widest text-rose-500/90">Filtros</p>
          <Button
            variant="outline"
            size="sm"
            className="!px-4 !py-2 border-rose-200 text-rose-600 hover:!bg-rose-50"
            onClick={() => {
              setSearch('')
              setStatusFilter('all')
              setPaymentFilter('all')
              setDateRange('30d')
              setMinTotal('')
              setMaxTotal('')
            }}
          >
            Limpar
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3 items-end">
          <Input label="Busca" className="border-rose-200 focus:!border-rose-500 focus:!ring-rose-200" placeholder="#A1B2C3D4 ou CUPOM" value={search} onChange={e => setSearch(e.target.value)} />
          <Select
            label="Status"
            className="border-rose-200 focus:!border-rose-500 focus:!ring-rose-200"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as 'all' | OrderStatus)}
            options={[{ value: 'all', label: 'Todos' }, ...Object.entries(orderStatusLabel).map(([value, label]) => ({ value, label }))]}
          />
          <Select
            label="Pagamento"
            className="border-rose-200 focus:!border-rose-500 focus:!ring-rose-200"
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
            className="border-rose-200 focus:!border-rose-500 focus:!ring-rose-200"
            value={dateRange}
            onChange={e => setDateRange(e.target.value as DateRangeFilter)}
            options={[
              { value: 'all', label: 'Todo período' },
              { value: 'today', label: 'Hoje' },
              { value: '7d', label: 'Últimos 7 dias' },
              { value: '30d', label: 'Últimos 30 dias' },
            ]}
          />
          <Input label="Mín (R$)" className="border-rose-200 focus:!border-rose-500 focus:!ring-rose-200" type="number" min="0" value={minTotal} onChange={e => setMinTotal(e.target.value)} />
          <Input label="Máx (R$)" className="border-rose-200 focus:!border-rose-500 focus:!ring-rose-200" type="number" min="0" value={maxTotal} onChange={e => setMaxTotal(e.target.value)} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-obsidian-100 shadow-card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
        ) : filteredOrders.length === 0 ? (
          <EmptyState title="Nenhum pedido" />
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead>
              <tr className="border-b border-rose-100 text-left bg-rose-50/60">
                {['Pedido','Data','Total','Status','Pagamento','Ações'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-xs font-medium text-obsidian-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order.id} className="border-b border-obsidian-50 last:border-0 hover:bg-rose-50/60 transition-colors duration-200">
                  <td className="px-5 py-4 font-mono text-sm text-ink">#{order.id.slice(-8).toUpperCase()}</td>
                  <td className="px-5 py-4 text-xs text-obsidian-500">{formatDateTime(order.createdAt)}</td>
                  <td className="px-5 py-4 text-sm font-medium">{formatCurrency(order.total)}</td>
                  <td className="px-5 py-4">
                    <span className={`badge-status border rounded-full text-xs px-2.5 py-0.5 ${getOrderDisplayStatusColor(order)}`}>
                      {getOrderDisplayStatusLabel(order)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {order.paymentStatus && (
                      <span className={`badge-status border rounded-full text-xs px-2.5 py-0.5 ${paymentStatusColor[order.paymentStatus] ?? ''}`}>
                        {paymentStatusLabel[order.paymentStatus]}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <Link to={`/admin/orders/${order.id}`}>
                      <Button variant="outline" size="sm">Ver</Button>
                    </Link>
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
  const [loading, setLoading]   = useState(true)
  const [shipmentLoading, setShipmentLoading] = useState(false)
  const [status, setStatus]     = useState<OrderStatus>('pending')
  const [updating, setUpdating] = useState(false)
  const [processingLabel, setProcessingLabel] = useState(false)

  useEffect(() => {
    if (!id) return
    ordersApi.getById(id).then(r => { setOrder(r.order); setStatus(r.order.status) }).finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!id) return
    setShipmentLoading(true)
    ordersApi.getShipment(id)
      .then(r => setShipment(r.shipment))
      .catch(() => setShipment(null))
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
    } catch {
      setShipment(null)
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
              <div key={item.id} className="flex justify-between py-2.5 border-b border-obsidian-50 last:border-0 text-sm">
                <span className="text-obsidian-700">{item.quantity}× item</span>
                <span>{formatCurrency(item.price * item.quantity)}</span>
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
              <p className="text-sm text-obsidian-500">Carregando shipment...</p>
            ) : !shipment ? (
              <p className="text-sm text-obsidian-500">Pedido ainda sem shipment.</p>
            ) : (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-obsidian-500">Status</span>
                  <span className="font-medium text-ink">{shipmentStatusLabel[shipment.status] ?? shipment.status}</span>
                </div>
                {shipment.trackingCode && (
                  <div className="flex justify-between text-sm">
                    <span className="text-obsidian-500">Tracking</span>
                    <span className="font-mono text-xs text-ink">{shipment.trackingCode}</span>
                  </div>
                )}
                {shipment.labelUrl && (
                  <a href={shipment.labelUrl} target="_blank" rel="noreferrer" className="text-sm text-rose-600 hover:underline">
                    Abrir etiqueta
                  </a>
                )}
                {shipment.status === 'failed' && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-1.5">
                    <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">Falha no shipment</p>
                    <p className="text-sm text-red-700">{shipment.lastError || 'Falha na geração da etiqueta'}</p>
                    <p className="text-xs text-red-700">retryCount: {shipment.retryCount ?? 0}</p>
                    {shipment.nextRetryAt && (
                      <p className="text-xs text-red-700">nextRetryAt: {formatDateTime(shipment.nextRetryAt)}</p>
                    )}
                    {shipment.dlqAt && (
                      <p className="text-xs font-medium text-red-800">dlqAt: {formatDateTime(shipment.dlqAt)} · exige intervenção manual</p>
                    )}
                  </div>
                )}
                {shipment.events && shipment.events.length > 0 && (
                  <div className="pt-1 space-y-2">
                    <p className="text-xs uppercase tracking-wide text-obsidian-400">Eventos</p>
                    <div className="space-y-2 max-h-44 overflow-y-auto">
                      {shipment.events.slice(0, 10).map(event => (
                        <div key={event.id} className="rounded-lg border border-obsidian-100 p-2.5 bg-obsidian-50/40">
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
            <Button variant="outline" onClick={handleProcessLabel} loading={processingLabel} fullWidth>
              Processar Etiqueta
            </Button>
          </div>

          <div className="bg-white rounded-2xl border border-obsidian-100 shadow-card p-5 space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-obsidian-500">Criado em</span>
              <span>{formatDateTime(order.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-obsidian-500">Status atual</span>
              <span className={`badge-status border rounded-full text-xs px-2.5 py-0.5 ${getOrderDisplayStatusColor(order, shipment)}`}>
                {getOrderDisplayStatusLabel(order, shipment)}
              </span>
            </div>
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
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | Payment['status']>('all')
  const [providerFilter, setProviderFilter] = useState<'all' | string>('all')
  const [dateRange, setDateRange] = useState<DateRangeFilter>('30d')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')

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

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="bg-gradient-to-r from-rose-50/90 via-white to-rose-100/50 border border-rose-100 rounded-2xl p-5 shadow-card">
        <p className="text-xs uppercase tracking-widest text-rose-500/80 mb-1">Admin</p>
        <h1 className="font-display text-3xl text-ink">Pagamentos</h1>
        <p className="text-sm text-obsidian-500 mt-1">Acompanhe transações, performance e risco financeiro em um só lugar.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-rose-50 to-white rounded-2xl border border-rose-100 p-4 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
          <p className="text-xs text-obsidian-400 uppercase tracking-wider">Transações no filtro</p>
          <p className="text-2xl font-display text-ink mt-1">{paymentKpis.total}</p>
        </div>
        <div className="bg-white rounded-2xl border border-obsidian-100 p-4 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
          <p className="text-xs text-obsidian-400 uppercase tracking-wider">Taxa de sucesso</p>
          <p className="text-2xl font-display text-rose-600 mt-1">{paymentKpis.paidRate}%</p>
        </div>
        <div className="bg-white rounded-2xl border border-obsidian-100 p-4 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
          <p className="text-xs text-obsidian-400 uppercase tracking-wider">Valor total</p>
          <p className="text-2xl font-display text-ink mt-1">{formatCurrency(paymentKpis.totalAmount)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-obsidian-100 p-4 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
          <p className="text-xs text-obsidian-400 uppercase tracking-wider">Falhas / Estornos</p>
          <p className="text-2xl font-display text-ink mt-1">{paymentKpis.failedCount} / {paymentKpis.refundedCount}</p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-rose-50/70 via-white to-rose-50/40 rounded-2xl border border-rose-100 shadow-card p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs uppercase tracking-widest text-rose-500/90">Filtros</p>
          <Button
            variant="outline"
            size="sm"
            className="!px-4 !py-2 border-rose-200 text-rose-600 hover:!bg-rose-50"
            onClick={() => {
              setSearch('')
              setStatusFilter('all')
              setProviderFilter('all')
              setDateRange('30d')
              setMinAmount('')
              setMaxAmount('')
            }}
          >
            Limpar
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3 items-end">
          <Input label="Busca" className="border-rose-200 focus:!border-rose-500 focus:!ring-rose-200" placeholder="#ABC12345" value={search} onChange={e => setSearch(e.target.value)} />
          <Select
            label="Status"
            className="border-rose-200 focus:!border-rose-500 focus:!ring-rose-200"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as 'all' | Payment['status'])}
            options={[{ value: 'all', label: 'Todos' }, ...Object.entries(paymentStatusLabel).map(([value, label]) => ({ value, label }))]}
          />
          <Select label="Provider" className="border-rose-200 focus:!border-rose-500 focus:!ring-rose-200" value={providerFilter} onChange={e => setProviderFilter(e.target.value)} options={providerOptions} />
          <Select
            label="Período"
            className="border-rose-200 focus:!border-rose-500 focus:!ring-rose-200"
            value={dateRange}
            onChange={e => setDateRange(e.target.value as DateRangeFilter)}
            options={[
              { value: 'all', label: 'Todo período' },
              { value: 'today', label: 'Hoje' },
              { value: '7d', label: 'Últimos 7 dias' },
              { value: '30d', label: 'Últimos 30 dias' },
            ]}
          />
          <Input label="Mín (R$)" className="border-rose-200 focus:!border-rose-500 focus:!ring-rose-200" type="number" min="0" value={minAmount} onChange={e => setMinAmount(e.target.value)} />
          <Input label="Máx (R$)" className="border-rose-200 focus:!border-rose-500 focus:!ring-rose-200" type="number" min="0" value={maxAmount} onChange={e => setMaxAmount(e.target.value)} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-obsidian-100 shadow-card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
        ) : filteredPayments.length === 0 ? (
          <EmptyState title="Nenhum pagamento" />
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead>
              <tr className="border-b border-rose-100 text-left bg-rose-50/60">
                {['Pagamento','Pedido','Valor','Status','Data','Ações'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-xs font-medium text-obsidian-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map(p => (
                <tr key={p.id} className="border-b border-obsidian-50 last:border-0 hover:bg-rose-50/60 transition-colors duration-200">
                  <td className="px-5 py-4 font-mono text-xs text-obsidian-500">#{p.id.slice(-8)}</td>
                  <td className="px-5 py-4 font-mono text-xs text-obsidian-500">#{p.orderId.slice(-8)}</td>
                  <td className="px-5 py-4 text-sm font-medium">{formatCurrency(p.amount)}</td>
                  <td className="px-5 py-4">
                    <span className={`badge-status border rounded-full text-xs px-2.5 py-0.5 ${paymentStatusColor[p.status] ?? ''}`}>
                      {paymentStatusLabel[p.status]}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-obsidian-500">{formatDateTime(p.createdAt)}</td>
                  <td className="px-5 py-4">
                    <Link to={`/admin/payments/${p.id}`}>
                      <Button variant="outline" size="sm">Ver</Button>
                    </Link>
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
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    couponsApi.list().then(r => setCoupons(r.coupons)).finally(() => setLoading(false))
  }

  useEffect(load, [])

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
        <div className="bg-white rounded-2xl border border-obsidian-100 p-4 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
          <p className="text-xs text-obsidian-400 uppercase tracking-wider">Cupons no filtro</p>
          <p className="text-2xl font-display text-ink mt-1">{couponKpis.total}</p>
        </div>
        <div className="bg-white rounded-2xl border border-obsidian-100 p-4 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
          <p className="text-xs text-obsidian-400 uppercase tracking-wider">Ativos</p>
          <p className="text-2xl font-display text-ink mt-1">{couponKpis.activeCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-obsidian-100 p-4 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
          <p className="text-xs text-obsidian-400 uppercase tracking-wider">Expirados</p>
          <p className="text-2xl font-display text-ink mt-1">{couponKpis.expiredCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-obsidian-100 p-4 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
          <p className="text-xs text-obsidian-400 uppercase tracking-wider">Uso médio</p>
          <p className="text-2xl font-display text-ink mt-1">{couponKpis.avgUsage}</p>
        </div>
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
                    <Button variant="outline" size="sm" onClick={() => navigate(`/admin/coupons/${c.id}/edit`)}>Editar</Button>
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
    productsApi.list().then((response) => setProducts(response.products)).catch(() => {})
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

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Remover banner "${title}"?`)) return
    try {
      await bannersApi.adminRemove(id)
      toast('Banner removido!', 'success')
      load()
    } catch (err) {
      toast((err as ApiError).message ?? 'Não foi possível remover o banner', 'error')
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
                      {banner.status}
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
                      <Button variant="danger" size="sm" onClick={() => handleDelete(banner.id, banner.product?.name ?? 'banner')}>Excluir</Button>
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
    hasDiscount: true,
    discountType: 'percentage',
    discountValue: '',
    priority: '0',
    type: 'flash_sale',
    status: 'paused',
    productId: '',
  })

  useEffect(() => {
    productsApi.list().then((response) => setProducts(response.products)).catch(() => {})

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
          hasDiscount: !!banner.hasDiscount,
          discountType: banner.discountType ?? 'percentage',
          discountValue: banner.discountValue?.toString() ?? '',
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
        hasDiscount: form.hasDiscount,
        discountType: form.hasDiscount ? (form.discountType as 'percentage' | 'fixed') : undefined,
        discountValue: form.hasDiscount && form.discountValue ? Number(form.discountValue) : undefined,
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
              options={products.map((product) => ({ value: product.id, label: product.name }))}
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

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="hasDiscount"
              checked={form.hasDiscount}
              onChange={setValue('hasDiscount')}
              className="w-4 h-4 rounded border-obsidian-300 text-champagne-600"
            />
            <label htmlFor="hasDiscount" className="text-sm text-ink">Exibir desconto</label>
          </div>

          {form.hasDiscount && (
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Tipo de desconto"
                value={form.discountType}
                onChange={setValue('discountType')}
                options={[{ value: 'percentage', label: 'Percentual (%)' }, { value: 'fixed', label: 'Valor fixo (R$)' }]}
              />
              <Input
                label="Valor do desconto"
                type="number"
                step="0.01"
                value={form.discountValue}
                onChange={setValue('discountValue')}
              />
            </div>
          )}
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
