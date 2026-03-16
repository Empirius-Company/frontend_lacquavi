import type { ReactNode } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'
import { ToastContainer } from '../ui'

/* ════════════════════════════════════════════════════════
   MainLayout — public + customer pages
   ════════════════════════════════════════════════════ */
export function MainLayout({ children }: { children?: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {children ?? <Outlet />}
      </main>
      <Footer />
      <ToastContainer />
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   AdminLayout — admin panel
   ════════════════════════════════════════════════════ */
const ADMIN_LINKS = [
  { to: '/admin',             label: 'Dashboard',   icon: '◈', exact: true },
  { to: '/admin/products',    label: 'Produtos',     icon: '◇' },
  { to: '/admin/banners',     label: 'Banners',      icon: '◬' },
  { to: '/admin/categories',  label: 'Categorias',   icon: '⊞' },
  { to: '/admin/subcategories',  label: 'Subcategorias', icon: '⊟' },
  { to: '/admin/orders',      label: 'Pedidos',      icon: '◎' },
  { to: '/admin/payments',    label: 'Pagamentos',   icon: '◑' },
  { to: '/admin/coupons',     label: 'Cupons',       icon: '⊛' },
  { to: '/status',            label: 'Status API',   icon: '◐' },
]

export function AdminLayout({ children }: { children?: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50/40 via-white to-rose-100/30 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 flex-col fixed left-0 top-0 bottom-0 border-r border-brand.border z-30 bg-white/95 backdrop-blur-md">
        {/* Logo */}
        <div className="px-6 py-7 border-b border-brand.border">
          <NavLink to="/" className="font-display text-xl text-brand.dark tracking-[0.06em] hover:text-rose-600 transition-colors">
            LACQUAVI
          </NavLink>
          <p className="text-2xs text-rose-500/80 mt-1 uppercase tracking-ultra">Admin Panel</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
          {ADMIN_LINKS.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.exact}
              className={({ isActive }) => `
                flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm
                transition-all duration-200
                ${isActive
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-sm'
                  : 'text-brand.text hover:bg-rose-50/70 hover:text-rose-700'
                }
              `}
            >
              <span className="text-base opacity-80">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-6 py-5 border-t border-brand.border">
          <NavLink to="/" className="flex items-center gap-2 text-xs text-brand.textLight hover:text-rose-600 transition-colors">
            <span>←</span>
            Ir para a Loja
          </NavLink>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 md:ml-60 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="md:hidden bg-white border-b border-brand.border px-4 py-4 flex items-center justify-between">
          <span className="font-display text-lg text-brand.dark">LACQUAVI Admin</span>
          <NavLink to="/" className="text-xs text-brand.textLight hover:text-rose-600">← Loja</NavLink>
        </header>

        <main className="flex-1 p-6 md:p-8">
          {children ?? <Outlet />}
        </main>
      </div>

      <ToastContainer />
    </div>
  )
}
