import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useLoginModal } from '../../context/LoginModalContext'
import { categoriesApi } from '../../api/catalogApi'
import { MiniCart } from './MiniCart'
import type { Category } from '../../types'

function CategoryNavSkeleton() {
  return (
    <div className="flex items-center gap-6 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-3 rounded-full bg-gray-200" style={{ width: `${48 + (i % 3) * 16}px` }} />
      ))}
    </div>
  )
}

export function Header() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const { totalItems, openCart } = useCart()
  const { openLoginModal } = useLoginModal()
  const navigate = useNavigate()
  const location = useLocation()
  const isCheckoutFlow = location.pathname.startsWith('/checkout')
  const [menuOpen, setMenuOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const categoryTriggerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    categoriesApi.list()
      .then(res => setCategories(res.data || []))
      .catch(() => { /* falha silenciosa — menu principal ainda funciona */ })
      .finally(() => setCategoriesLoading(false))
  }, [])

  const handleLogout = async () => {
    await logout()
    setUserOpen(false)
    navigate('/')
  }

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      navigate(`/products?q=${searchTerm.trim()}`)
    }
  }

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-40 bg-white shadow-sm flex flex-col">
        {/* Tier 1: Top Promo Bar */}
        <div className="bg-[#2a7e51] py-1 text-center px-4 flex justify-center items-center gap-2 shadow-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white drop-shadow-sm">
            <rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle>
          </svg>
          <span className="text-[11px] text-white tracking-widest font-bold uppercase">
            FRETE GRÁTIS a partir de R$ 259,00 <span>+ descontos exclusivos</span>
          </span>
        </div>

        {/* Tier 2: Main Area (Logo, Search, Actions) */}
        <div className="container-page py-2.5 flex items-center justify-between gap-6 md:gap-10">

          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center hover:opacity-90 transition-opacity">
            <picture>
              <source srcSet="/logo.webp" type="image/webp" />
              <img src="/logo.png" alt="Lacquavi" className="h-[39px] md:h-[50px] object-contain" width="160" height="50" />
            </picture>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-2xl relative">
            <input
              type="text"
              placeholder="Oi, o que você procura hoje? :)"
              className="w-full bg-[#F5F5F5] border border-gray-200 hover:border-gray-300 rounded-full py-2 px-5 pr-12 text-sm text-[#333] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#2a7e51] focus:border-[#2a7e51] transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearch}
            />
            <button
              aria-label="Buscar"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-[#000000]"
              onClick={() => searchTerm.trim() && navigate(`/products?q=${searchTerm.trim()}`)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4 md:gap-6">

            {/* User Dropdown */}
            <div className="hidden md:flex items-center gap-2 cursor-pointer relative" onClick={() => setUserOpen(!userOpen)}>
              <div className="text-gray-600">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-[#333]">{isAuthenticated ? `Oie, ${user?.fullName?.split(' ')[0]}!` : 'Oie!'}</span>
                <span className="text-[11px] text-gray-500 flex items-center gap-1">
                  {isAuthenticated ? 'Sua conta' : 'Vem fazer seu login :)'}
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </span>
              </div>

              {/* Dropdown Menu */}
              {userOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-100 shadow-card-hover rounded-lg py-2 z-50 animate-fade-in">
                  {isAuthenticated ? (
                    <>
                      <Link to="/account/orders" className="block px-4 py-2 text-sm text-[#4A4A4A] hover:bg-gray-50 hover:text-[#000000]">Meus Pedidos</Link>
                      <Link to="/account/profile" className="block px-4 py-2 text-sm text-[#4A4A4A] hover:bg-gray-50 hover:text-[#000000]">Minha Conta</Link>
                      {isAdmin && <Link to="/admin" className="block px-4 py-2 text-sm text-[#000000] hover:bg-gray-50 font-semibold">Painel Admin</Link>}
                      <div className="border-t border-gray-100 my-1"></div>
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-[#4A4A4A] hover:bg-gray-50 hover:text-[#000000]">Sair</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setUserOpen(false); openLoginModal({ mode: 'login' }) }} className="w-full text-left px-4 py-2 text-sm text-[#4A4A4A] hover:bg-gray-50 hover:text-[#000000]">Entrar</button>
                      <button onClick={() => { setUserOpen(false); openLoginModal({ mode: 'register' }) }} className="w-full text-left px-4 py-2 text-sm text-[#4A4A4A] hover:bg-gray-50 hover:text-[#000000]">Cadastrar</button>
                    </>
                  )}
                </div>
              )}
            </div>
            {/* Cart */}
            <button aria-label="Abrir carrinho" onClick={openCart} className="relative text-[#333] hover:text-[#2a7e51] transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 01-8 0"></path></svg>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-[#2a7e51] text-white text-[9px] font-bold flex items-center justify-center">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </button>

            {/* Mobile Menu Toggle */}
            <button aria-label="Abrir menu" className="md:hidden text-[#333]" onClick={() => setMenuOpen(!menuOpen)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden px-4 pb-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar produtos..."
              className="w-full bg-[#F5F5F5] border border-gray-200 hover:border-gray-300 rounded-full py-1.5 px-4 pr-10 text-sm text-[#333] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#2a7e51] focus:border-[#2a7e51] transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearch}
            />
          </div>
        </div>

        {/* Tier 3: Category Nav Bar — hidden on checkout/payment */}
        <div className={`hidden border-t border-gray-100 ${isCheckoutFlow ? '' : 'md:flex'}`}>
          <div className="container-page flex items-center h-8">

            {/* Categories */}
            <nav className="flex-1 flex items-center justify-between overflow-visible no-scrollbar">
              {categoriesLoading ? (
                <CategoryNavSkeleton />
              ) : (
                <>
                  <div
                    ref={categoryTriggerRef}
                    className="relative flex items-center h-full group"
                    onMouseEnter={() => setCategoryOpen(true)}
                    onMouseLeave={() => setCategoryOpen(false)}
                    onFocus={() => setCategoryOpen(true)}
                    onBlur={(e) => {
                      if (!categoryTriggerRef.current?.contains(e.relatedTarget as Node)) {
                        setCategoryOpen(false)
                      }
                    }}
                  >
                    <button
                      className="text-xs font-semibold text-[#333] hover:text-[#000000] whitespace-nowrap flex items-center gap-1 cursor-pointer py-2"
                      aria-haspopup="true"
                      aria-expanded={categoryOpen}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCategoryOpen(v => !v) }
                        if (e.key === 'Escape') setCategoryOpen(false)
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                      Ver tudo
                    </button>

                    {categoryOpen && (
                      <div
                        role="menu"
                        className="absolute top-full left-0 -mt-1 w-64 bg-white border border-gray-100 shadow-xl rounded-b-lg rounded-tr-lg py-3 z-50 animate-fade-in before:absolute before:-top-3 before:left-0 before:w-full before:h-4"
                      >
                        <Link
                          to="/products"
                          role="menuitem"
                          onClick={() => setCategoryOpen(false)}
                          className="block px-5 py-2 text-sm font-bold text-[#2a7e51] hover:bg-gray-50 border-b border-gray-50 mb-1"
                        >
                          Todos os Produtos
                        </Link>
                        <div className="max-h-[60vh] overflow-y-auto no-scrollbar">
                          {categories.map(cat => (
                            <Link
                              key={`dropdown-${cat.id}`}
                              to={`/products?category=${cat.id}`}
                              role="menuitem"
                              onClick={() => setCategoryOpen(false)}
                              className="block px-5 py-2 text-sm text-[#4A4A4A] hover:bg-gray-50 hover:text-[#000000]"
                            >
                              {cat.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {categories.slice(0, 5).map(cat => (
                    <NavLink
                      key={cat.id}
                      to={`/products?category=${cat.id}`}
                      className={({ isActive }) => `text-xs font-semibold whitespace-nowrap transition-colors ${isActive ? 'text-[#000000]' : 'text-gray-500 hover:text-[#000000]'}`}
                    >
                      {cat.name}
                    </NavLink>
                  ))}

                  <NavLink to="/nossa-loja" className={({ isActive }) => `flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${isActive ? 'text-[#2a7e51]' : 'text-gray-500 hover:text-[#2a7e51]'}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2a7e51] flex-shrink-0" />
                    Nossas Lojas
                  </NavLink>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile drawer — slides from RIGHT (same side as the hamburger button) */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            style={{ animation: 'fadeInBackdrop 0.25s ease both' }}
            onClick={() => setMenuOpen(false)}
          />

          {/* Drawer */}
          <div
            className="relative w-4/5 max-w-xs bg-white h-full flex flex-col shadow-2xl"
            style={{ animation: 'slideInFromRight 0.3s cubic-bezier(0.16,1,0.3,1) both' }}
          >
            {/* Header with logo */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <Link to="/" onClick={() => setMenuOpen(false)} className="flex-shrink-0">
                <picture>
                  <source srcSet="/logo.webp" type="image/webp" />
                  <img src="/logo.png" alt="Lacquavi" className="h-9 object-contain" width="144" height="36" />
                </picture>
              </Link>
              <button
                aria-label="Fechar menu"
                onClick={() => setMenuOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Nav links */}
            <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-3 mb-1">Coleção</p>
              <Link to="/products" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl font-semibold text-[#333] hover:bg-gray-50 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                Todos os Produtos
              </Link>
              <Link to="/products?gender=feminino" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="5"/><line x1="12" y1="13" x2="12" y2="21"/><line x1="9" y1="18" x2="15" y2="18"/></svg>
                Femininos
              </Link>
              <Link to="/products?gender=masculino" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="10" cy="14" r="5"/><line x1="21" y1="3" x2="15" y2="9"/><polyline points="15 3 21 3 21 9"/></svg>
                Masculinos
              </Link>
              <Link to="/nossa-loja" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-[#2a7e51] bg-[#2a7e51]/10 hover:bg-[#2a7e51]/20 font-semibold transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                Nossas Lojas
              </Link>

              <div className="border-t border-gray-100 my-2 mx-2" />

              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-3 mb-1">Conta</p>
              {isAuthenticated ? (
                <>
                  <Link to="/account/orders" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    Meus Pedidos
                  </Link>
                  <Link to="/account/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Minha Conta
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-[#2a7e51] font-semibold hover:bg-emerald-50 transition-colors">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
                      Painel Admin
                    </Link>
                  )}
                  <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors w-full text-left">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Sair
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => { setMenuOpen(false); openLoginModal({ mode: 'login' }) }} className="flex items-center gap-3 px-3 py-3 rounded-xl font-bold text-[#000000] hover:bg-gray-50 transition-colors w-full text-left">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                    Entrar
                  </button>
                  <button onClick={() => { setMenuOpen(false); openLoginModal({ mode: 'register' }) }} className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors w-full text-left">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Criar conta
                  </button>
                </>
              )}
            </div>
          </div>

          <style>{`
            @keyframes slideInFromRight {
              from { transform: translateX(100%); }
              to { transform: translateX(0); }
            }
            @keyframes fadeInBackdrop {
              from { opacity: 0; }
              to { opacity: 1; }
            }
          `}</style>
        </div>
      )}

      {/* Mini Cart Drawer */}
      <MiniCart />
    </>
  )
}
