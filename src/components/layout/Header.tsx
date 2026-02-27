import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { categoriesApi } from '../../api/catalogApi'
import { MiniCart } from './MiniCart'
import type { Category } from '../../types'

export function Header() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const { totalItems, openCart } = useCart()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    categoriesApi.list().then(res => setCategories(res.data || [])).catch(() => { })
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
        <div className="bg-[#e6226e] py-1.5 text-center px-4 flex justify-center items-center gap-2 shadow-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white drop-shadow-sm">
            <rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle>
          </svg>
          <span className="text-[11px] text-white tracking-widest font-bold uppercase">
            FRETE GRÁTIS a partir de R$ 199,00 <span className="opacity-80">+ descontos exclusivos</span>
          </span>
        </div>

        {/* Tier 2: Main Area (Logo, Search, Actions) */}
        <div className="container-page py-3 flex items-center justify-between gap-6 md:gap-10">

          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center hover:opacity-90 transition-opacity">
            <img src="/logo.png" alt="Lacquavi" className="h-9 md:h-[45px] object-contain" />
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-2xl relative">
            <input
              type="text"
              placeholder="Oi, o que você procura hoje? :)"
              className="w-full bg-[#F5F5F5] border border-gray-200 hover:border-gray-300 rounded-full py-2 px-5 pr-12 text-sm text-[#333] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#e6226e] focus:border-[#e6226e] transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearch}
            />
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#000000]"
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
                <span className="text-sm font-bold text-[#333]">{isAuthenticated ? `Oie, ${user?.name?.split(' ')[0]}!` : 'Oie!'}</span>
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
                      <Link to="/login" className="block px-4 py-2 text-sm text-[#4A4A4A] hover:bg-gray-50 hover:text-[#000000]">Entrar</Link>
                      <Link to="/register" className="block px-4 py-2 text-sm text-[#4A4A4A] hover:bg-gray-50 hover:text-[#000000]">Cadastrar</Link>
                    </>
                  )}
                </div>
              )}
            </div>



            {/* Wishlist */}
            <div className="relative text-gray-500 hover:text-[#e6226e] cursor-pointer hidden md:block">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"></path></svg>
              <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-[#e6226e] text-white text-[9px] font-bold flex items-center justify-center">0</span>
            </div>

            {/* Cart */}
            <button onClick={openCart} className="relative text-[#333] hover:text-[#e6226e] transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 01-8 0"></path></svg>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-[#e6226e] text-white text-[9px] font-bold flex items-center justify-center">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </button>

            {/* Mobile Menu Toggle */}
            <button className="md:hidden text-[#333]" onClick={() => setMenuOpen(!menuOpen)}>
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
              className="w-full bg-[#F5F5F5] border border-gray-200 hover:border-gray-300 rounded-full py-1.5 px-4 pr-10 text-sm text-[#333] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#e6226e] focus:border-[#e6226e] transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearch}
            />
          </div>
        </div>

        {/* Tier 3: Category Nav Bar */}
        <div className="hidden md:flex border-t border-gray-100">
          <div className="container-page flex items-center h-9">

            {/* Categories */}
            <nav className="flex-1 flex items-center justify-between overflow-visible no-scrollbar">
              <div
                className="relative flex items-center h-full group"
                onMouseEnter={() => setCategoryOpen(true)}
                onMouseLeave={() => setCategoryOpen(false)}
              >
                <button className="text-xs font-semibold text-[#333] hover:text-[#000000] whitespace-nowrap flex items-center gap-1 cursor-pointer py-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                  Ver tudo
                </button>

                {categoryOpen && (
                  <div className="absolute top-full left-0 -mt-1 w-64 bg-white border border-gray-100 shadow-xl rounded-b-lg rounded-tr-lg py-3 z-50 animate-fade-in before:absolute before:-top-3 before:left-0 before:w-full before:h-4">
                    <Link to="/products" className="block px-5 py-2 text-sm font-bold text-[#e6226e] hover:bg-gray-50 border-b border-gray-50 mb-1">
                      Todos os Produtos
                    </Link>
                    <div className="max-h-[60vh] overflow-y-auto no-scrollbar">
                      {categories.map(cat => (
                        <Link
                          key={`dropdown-${cat.id}`}
                          to={`/products?category=${cat.id}`}
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

              <NavLink to="/nossa-loja" className={({ isActive }) => `text-xs font-semibold whitespace-nowrap transition-colors ${isActive ? 'text-[#000000]' : 'text-gray-500 hover:text-[#000000]'}`}>
                Nossa Loja
              </NavLink>
            </nav>
          </div>
        </div>
      </header>

      {/* Spacer to prevent content from hiding behind fixed header */}
      <div className="h-[124px] md:h-[108px]" />

      {/* Mobile drawer ... */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
          <div className="relative w-4/5 max-w-sm bg-white h-full flex flex-col shadow-xl">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-[#000000] text-white">
              <span className="font-bold">Menu</span>
              <button onClick={() => setMenuOpen(false)}>✕</button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-4">
              <Link to="/products" onClick={() => setMenuOpen(false)} className="font-semibold text-[#333]">Todos os Produtos</Link>
              <Link to="/products?gender=feminino" onClick={() => setMenuOpen(false)} className="font-semibold text-gray-600">Femininos</Link>
              <Link to="/products?gender=masculino" onClick={() => setMenuOpen(false)} className="font-semibold text-gray-600">Masculinos</Link>
              <div className="border-t border-gray-100 my-2"></div>
              {isAuthenticated ? (
                <>
                  <Link to="/account/profile" onClick={() => setMenuOpen(false)} className="text-gray-600">Minha Conta</Link>
                  <button onClick={handleLogout} className="text-left text-red-500">Sair</button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMenuOpen(false)} className="text-[#000000] font-bold">Entrar</Link>
                  <Link to="/register" onClick={() => setMenuOpen(false)} className="text-gray-600">Criar conta</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mini Cart Drawer */}
      <MiniCart />
    </>
  )
}
