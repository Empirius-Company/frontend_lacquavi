import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { productsApi, categoriesApi } from '../../api/catalogApi'
import { ordersApi, paymentsApi, couponsApi, healthApi } from '../../api/index'
import { useToast } from '../../context/ToastContext'
import { Button, Input, Select, Badge, Spinner, EmptyState, ErrorMessage, Skeleton, Modal } from '../../components/ui'
import { formatCurrency, formatDateTime, orderStatusLabel, orderStatusColor, paymentStatusLabel, paymentStatusColor, generateIdempotencyKey } from '../../utils'
import type { Product, Category, Order, Payment, Coupon, HealthStatus, OrderStatus, ApiError } from '../../types'

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
  const pendingOrders = orders.filter(o => o.status === 'pending').length

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
                    <span className={`badge-status border rounded-full text-xs px-2.5 py-0.5 ${orderStatusColor[order.status] ?? ''}`}>
                      {orderStatusLabel[order.status]}
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

  const load = () => {
    setLoading(true)
    productsApi.list().then(r => setProducts(r.products)).finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Deletar "${name}"?`)) return
    try {
      await productsApi.remove(id)
      toast('Produto deletado', 'success')
      load()
    } catch (err) {
      toast((err as ApiError).message, 'error')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-widest text-obsidian-400 mb-1">Admin</p>
          <h1 className="font-display text-3xl text-ink">Produtos</h1>
        </div>
        <Button onClick={() => navigate('/admin/products/new')}>+ Novo Produto</Button>
      </div>

      <div className="bg-white rounded-2xl border border-obsidian-100 shadow-card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}
          </div>
        ) : products.length === 0 ? (
          <EmptyState title="Nenhum produto" action={<Button onClick={() => navigate('/admin/products/new')}>Criar Produto</Button>} />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-obsidian-100">
                <th className="px-5 py-3.5 text-xs font-medium text-obsidian-400 uppercase tracking-wider">Produto</th>
                <th className="px-5 py-3.5 text-xs font-medium text-obsidian-400 uppercase tracking-wider hidden md:table-cell">Preço</th>
                <th className="px-5 py-3.5 text-xs font-medium text-obsidian-400 uppercase tracking-wider hidden md:table-cell">Estoque</th>
                <th className="px-5 py-3.5 text-xs font-medium text-obsidian-400 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id} className="border-b border-obsidian-50 last:border-0 hover:bg-obsidian-50/50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-obsidian-50 flex-shrink-0">
                        {product.imageUrl
                          ? <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
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
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/admin/products/${product.id}/edit`)}>
                        Editar
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(product.id, product.name)}>
                        Excluir
                      </Button>
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

// ─── Admin Product Form ───────────────────────────────────────────────────────
export function AdminProductFormPage() {
  const { id } = useParams<{ id?: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const { toast } = useToast()

  const [loading, setLoading]   = useState(isEdit)
  const [saving, setSaving]     = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [error, setError]       = useState('')
  const [categories, setCategories] = useState<Category[]>([])

  const [form, setForm] = useState({
    name: '', description: '', price: '', stock: '', brand: '', volume: '', gender: '', categoryId: '', imageUrl: ''
  })

  useEffect(() => {
    categoriesApi.list().then(r => setCategories(r.data))
    if (isEdit && id) {
      productsApi.getById(id)
        .then(p => setForm({
          name: p.name, description: p.description, price: p.price.toString(),
          stock: p.stock.toString(), brand: p.brand ?? '', volume: p.volume ?? '',
          gender: p.gender ?? '', categoryId: p.categoryId ?? '', imageUrl: p.imageUrl
        }))
        .finally(() => setLoading(false))
    }
  }, [id, isEdit])

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [key]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const data = {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        stock: parseInt(form.stock),
        brand: form.brand || undefined,
        volume: form.volume || undefined,
        gender: form.gender || undefined,
        categoryId: form.categoryId || undefined,
      }
      let productId = id
      if (isEdit && id) {
        await productsApi.update(id, data)
      } else {
        const r = await productsApi.create(data)
        productId = r.product.id
      }
      if (imageFile && productId) {
        await productsApi.uploadImage(productId, imageFile)
      }
      toast(isEdit ? 'Produto atualizado!' : 'Produto criado!', 'success')
      navigate('/admin/products')
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
        <button onClick={() => navigate('/admin/products')} className="text-champagne-600">← Produtos</button>
        <span className="text-obsidian-300">/</span>
        <h1 className="font-display text-2xl text-ink">{isEdit ? 'Editar Produto' : 'Novo Produto'}</h1>
      </div>

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
              onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
              placeholder="Sem categoria"
              options={categories.map(c => ({ value: c.id, label: c.name }))}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-obsidian-100 shadow-card p-6 space-y-4">
          <h2 className="font-display text-lg text-ink">Imagem</h2>
          {form.imageUrl && (
            <img src={form.imageUrl} alt="Preview" className="w-28 h-28 rounded-xl object-cover" />
          )}
          <div>
            <label className="block text-xs font-medium text-obsidian-600 tracking-wide mb-1.5">Upload de imagem</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={e => setImageFile(e.target.files?.[0] ?? null)}
              className="block text-sm text-obsidian-500 file:mr-3 file:px-4 file:py-2 file:rounded-full file:border-0 file:text-xs file:bg-champagne-50 file:text-champagne-700 hover:file:bg-champagne-100"
            />
            <p className="text-xs text-obsidian-400 mt-1">JPG, PNG ou WebP • máx. 2MB</p>
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
                <th className="px-5 py-3.5 text-xs font-medium text-obsidian-400 uppercase tracking-wider">Slug</th>
                <th className="px-5 py-3.5 text-xs font-medium text-obsidian-400 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => (
                <tr key={cat.id} className="border-b border-obsidian-50 last:border-0">
                  <td className="px-5 py-4 text-sm font-medium text-ink">{cat.name}</td>
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

  useEffect(() => {
    ordersApi.list().then(r => setOrders(r.orders)).finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <h1 className="font-display text-3xl text-ink mb-8">Pedidos</h1>
      <div className="bg-white rounded-2xl border border-obsidian-100 shadow-card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
        ) : orders.length === 0 ? (
          <EmptyState title="Nenhum pedido" />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-obsidian-100 text-left">
                {['Pedido','Data','Total','Status','Pagamento','Ações'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-xs font-medium text-obsidian-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} className="border-b border-obsidian-50 last:border-0 hover:bg-obsidian-50/50">
                  <td className="px-5 py-4 font-mono text-sm text-ink">#{order.id.slice(-8).toUpperCase()}</td>
                  <td className="px-5 py-4 text-xs text-obsidian-500">{formatDateTime(order.createdAt)}</td>
                  <td className="px-5 py-4 text-sm font-medium">{formatCurrency(order.total)}</td>
                  <td className="px-5 py-4">
                    <span className={`badge-status border rounded-full text-xs px-2.5 py-0.5 ${orderStatusColor[order.status] ?? ''}`}>
                      {orderStatusLabel[order.status]}
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
  const [loading, setLoading]   = useState(true)
  const [status, setStatus]     = useState<OrderStatus>('pending')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (!id) return
    ordersApi.getById(id).then(r => { setOrder(r.order); setStatus(r.order.status) }).finally(() => setLoading(false))
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
            <div className="flex justify-between pt-3 font-medium text-ink">
              <span>Total</span>
              <span className="font-display text-lg">{formatCurrency(order.total)}</span>
            </div>
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
          </div>

          <div className="bg-white rounded-2xl border border-obsidian-100 shadow-card p-5 space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-obsidian-500">Criado em</span>
              <span>{formatDateTime(order.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-obsidian-500">Status atual</span>
              <span className={`badge-status border rounded-full text-xs px-2.5 py-0.5 ${orderStatusColor[order.status] ?? ''}`}>
                {orderStatusLabel[order.status]}
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

  useEffect(() => {
    paymentsApi.list().then(r => setPayments(r.payments)).finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <h1 className="font-display text-3xl text-ink mb-8">Pagamentos</h1>
      <div className="bg-white rounded-2xl border border-obsidian-100 shadow-card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
        ) : payments.length === 0 ? (
          <EmptyState title="Nenhum pagamento" />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-obsidian-100 text-left">
                {['Pagamento','Pedido','Valor','Status','Data','Ações'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-xs font-medium text-obsidian-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id} className="border-b border-obsidian-50 last:border-0 hover:bg-obsidian-50/50">
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

  const load = () => {
    setLoading(true)
    couponsApi.list().then(r => setCoupons(r.coupons)).finally(() => setLoading(false))
  }

  useEffect(load, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl text-ink">Cupons</h1>
        <Button onClick={() => navigate('/admin/coupons/new')}>+ Novo Cupom</Button>
      </div>

      <div className="bg-white rounded-2xl border border-obsidian-100 shadow-card overflow-x-auto">
        {loading ? (
          <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
        ) : coupons.length === 0 ? (
          <EmptyState title="Nenhum cupom" action={<Button onClick={() => navigate('/admin/coupons/new')}>Criar</Button>} />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-obsidian-100 text-left">
                {['Código','Tipo','Desconto','Usos','Válido até','Ativo','Ações'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-xs font-medium text-obsidian-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {coupons.map(c => (
                <tr key={c.id} className="border-b border-obsidian-50 last:border-0 hover:bg-obsidian-50/50">
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
