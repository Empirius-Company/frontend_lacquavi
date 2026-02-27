import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { productsApi } from '../api/catalogApi'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { formatCurrency } from '../utils'
import type { Product } from '../types'



function FloatingBuyBar({ product, onAdd }: { product: Product, onAdd: () => void }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      // Show when scrolling past the main buy button
      if (window.scrollY > 600) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }
    window.addEventListener('scroll', toggleVisibility)
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  if (!isVisible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.05)] z-40 transform transition-transform animate-slide-up">
      <div className="container-page py-3">
        <div className="flex justify-between items-center max-w-5xl mx-auto">
          <div className="flex items-center gap-4 hidden md:flex">
            <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center pb-1">
              {product.imageUrl ? <img src={product.imageUrl} className="max-h-full" alt="" /> : product.name.charAt(0)}
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">{product.brand || 'DIVERSOS'}</p>
              <p className="text-sm font-semibold truncate max-w-[200px]">{product.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-6 justify-end flex-1 md:flex-none">
            <div className="text-right">
              <p className="text-xs text-gray-400 line-through">{formatCurrency(product.price * 1.15)}</p>
              <p className="text-lg font-bold text-black leading-none">{formatCurrency(product.price)} <span className="text-[10px] font-normal text-gray-500">no PIX</span></p>
            </div>

            <div className="flex items-center gap-4">
              <button onClick={onAdd} className="bg-[#e6226e] hover:bg-[#cc1d60] text-white px-8 py-2.5 rounded text-sm font-bold uppercase tracking-wide transition-colors">
                Comprar
              </button>
              <button className="text-gray-400 hover:text-[#e6226e]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const { toast } = useToast()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [zipCode, setZipCode] = useState('')

  useEffect(() => {
    if (!id) return
    productsApi.getById(id)
      .then(r => setProduct(r))
      .catch(() => navigate('/products'))
      .finally(() => setLoading(false))
  }, [id, navigate])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
      </div>
    )
  }
  if (!product) return null

  const isOutOfStock = product.stock === 0
  const discount = 12

  const handleAdd = () => {
    if (isOutOfStock) return
    addItem(product, 1)
    toast(`${product.name} adicionado à sacola`, 'success')
  }

  // Define product images dynamically
  const productImages: (string | null)[] = (product as any).images?.length
    ? (product as any).images
    : (product.imageUrl ? [product.imageUrl] : [null]);

  return (
    <div className="min-h-screen bg-white pb-32">
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
            {productImages.length > 1 && (
              <div className="flex flex-col gap-2 w-16 md:w-20 shrink-0">
                {productImages.map((img, idx) => (
                  <div key={idx} className={`aspect-square border-2 rounded ${idx === 0 ? 'border-[#e6226e]' : 'border-transparent hover:border-gray-200'} cursor-pointer overflow-hidden p-1 bg-white shadow-sm`}>
                    {img ? (
                      <img src={img} alt="" className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center font-bold text-gray-300">{product.name[0]}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Main Image */}
            <div className="flex-1 relative aspect-[3/4] flex items-center justify-center bg-white p-4">
              {product.price > 0 && (
                <div className="absolute top-2 right-2 w-14 h-14 bg-[#0B1B3D] rounded-full flex flex-col items-center justify-center text-white z-10 font-bold leading-tight shadow-md">
                  <span className="text-sm">{discount}%</span>
                  <span className="text-[10px]">OFF</span>
                </div>
              )}
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="max-w-full max-h-full object-contain" />
              ) : (
                <div className="w-64 h-64 bg-gray-50 flex items-center justify-center rounded-2xl">
                  <span className="text-[#e6226e] text-6xl font-black italic opacity-20">{product.name[0]}</span>
                </div>
              )}

              {productImages.length > 1 && (
                <>
                  <button className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-gray-300 hover:text-gray-600"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg></button>
                  <button className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-gray-300 hover:text-gray-600"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg></button>

                  <div className="absolute bottom-2 right-2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded">1/{productImages.length}</div>
                </>
              )}
            </div>
          </div>

          {/* ── Right: Info ────────────────────────────────── */}
          <div className="w-full md:w-[55%] flex flex-col pt-4">

            {/* Brand & Stars */}
            <div className="flex justify-between items-start mb-2">
              <Link to={`/brand/${product.brand}`} className="text-xs text-[#e6226e] hover:underline uppercase tracking-wide">Ver tudo da marca <span className="font-bold">{product.brand || 'DIVERSOS'}</span></Link>
              <span className="text-xs text-gray-400">Ref: {product.id.split('-')[0].toUpperCase()}</span>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-1 leading-tight">{product.name}</h1>
            <h2 className="text-sm text-gray-500 uppercase tracking-widest mb-4">{product.brand || 'LACQUAVI'} {product.volume && `— ${product.volume}`}</h2>

            <div className="flex items-center gap-1 text-[#fcb900] text-sm mb-6">
              ★★★★★ <span className="text-gray-400 text-xs ml-2">({Math.floor(Math.random() * 200) + 10})</span>
            </div>

            {/* Pricing */}
            <div className="mb-6">
              <p className="text-sm text-gray-400 line-through mb-1">{formatCurrency(product.price * (1 + (discount / 100)))}</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-black text-black leading-none">{formatCurrency(product.price)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Vendido e entregue por <span className="text-[#e6226e] font-bold">Lacquavi ›</span></p>
            </div>

            {/* Actions */}
            <div className="mb-8">
              <button
                onClick={handleAdd}
                disabled={isOutOfStock}
                className="w-full bg-[#e6226e] hover:bg-[#cc1d60] transition-colors text-white font-bold text-sm tracking-wide uppercase py-4 rounded shadow-[0_4px_12px_rgba(230,34,110,0.3)] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
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
                  onChange={(e) => setZipCode(e.target.value)}
                  className="flex-1 border border-r-0 border-gray-300 rounded-l px-4 text-sm focus:outline-none focus:border-gray-400"
                />
                <button className="bg-white border border-gray-300 rounded-r px-6 text-xs font-bold text-gray-700 hover:bg-gray-50 uppercase tracking-widest transition-colors">
                  Calcular
                </button>
              </div>
              <a href="#" className="text-[10px] text-gray-400 hover:underline mt-2 inline-block">Não sei meu CEP</a>
            </div>
          </div>
        </div>

        {/* ── Ext Info Layout: Description + Right Sidebar ────────────────────────────────── */}
        <div className="mt-16 border-t border-gray-200 pt-10">
          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">

            {/* Main Content Area */}
            <div className="flex-1 max-w-3xl">
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
                  <h3 className="uppercase text-sm font-bold text-gray-800 tracking-widest border-b-2 border-[#e6226e] pb-2 -mb-px">Especificações</h3>
                </div>
                <div className="border border-pink-100 rounded p-4 text-sm text-gray-600 bg-white shadow-sm">
                  <p className="mb-1"><span className="font-medium">Indicação:</span> Todos os tipos de pele</p>
                  <p className="mb-1"><span className="font-medium">Necessidade:</span> Cuidado Diário</p>
                  {product.volume && <p><span className="font-medium">Tamanho:</span> {product.volume}</p>}
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="w-full lg:w-[320px]">
              <div className="flex border-b border-pink-200 mb-4">
                <h3 className="uppercase text-sm font-bold text-gray-800 tracking-widest border-b-2 border-[#e6226e] pb-2 -mb-px">Informações da Loja</h3>
              </div>

              <div className="border border-gray-200 rounded p-4 mb-6 shadow-sm bg-white">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-[#FF4170] rounded-lg flex items-center justify-center text-white font-bold text-2xl tracking-tighter">L</div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Lacquavi Oficial</p>
                    <p className="text-xs text-gray-500">Loja oficial</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 py-2 px-2 border border-gray-200 rounded text-[10px] text-gray-600 font-semibold uppercase hover:bg-gray-50 flex items-center justify-center gap-1">Ver mais infomações ›</button>
                  <button className="flex-1 py-2 px-2 border border-gray-200 rounded text-[10px] text-gray-600 font-semibold uppercase hover:bg-gray-50 flex items-center justify-center gap-1">Ver mais da marca ›</button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      <FloatingBuyBar product={product} onAdd={handleAdd} />
    </div>
  )
}
