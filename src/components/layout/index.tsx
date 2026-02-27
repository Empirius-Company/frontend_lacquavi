import React from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'
import { ToastContainer } from '../ui'

/* ════════════════════════════════════════════════════════
   MainLayout — public + customer pages
   ════════════════════════════════════════════════════ */
export function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
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
  { to: '/admin/categories',  label: 'Categorias',   icon: '⊞' },
  { to: '/admin/orders',      label: 'Pedidos',      icon: '◎' },
  { to: '/admin/payments',    label: 'Pagamentos',   icon: '◑' },
  { to: '/admin/coupons',     label: 'Cupons',       icon: '⊛' },
  { to: '/status',            label: 'Status API',   icon: '◐' },
]

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-noir-950 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 flex-col fixed left-0 top-0 bottom-0 border-r border-white/8 z-30 bg-noir-950">
        {/* Logo */}
        <div className="px-6 py-7 border-b border-white/8">
          <NavLink to="/" className="font-display text-xl text-pearl tracking-[0.06em] hover:text-gold-400 transition-colors">
            LACQUAVI
          </NavLink>
          <p className="text-2xs text-nude-700 mt-1 uppercase tracking-ultra">Admin Panel</p>
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
                  ? 'bg-gold-500/10 text-gold-400 border border-gold-600/20'
                  : 'text-nude-500 hover:bg-white/5 hover:text-nude-300'
                }
              `}
            >
              <span className="text-base opacity-70">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-6 py-5 border-t border-white/8">
          <NavLink to="/" className="flex items-center gap-2 text-xs text-nude-600 hover:text-nude-300 transition-colors">
            <span>←</span>
            Ir para a Loja
          </NavLink>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 md:ml-60 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="md:hidden bg-noir-900 border-b border-white/8 px-4 py-4 flex items-center justify-between">
          <span className="font-display text-lg text-pearl">LACQUAVI Admin</span>
          <NavLink to="/" className="text-xs text-nude-500 hover:text-nude-300">← Loja</NavLink>
        </header>

        <main className="flex-1 p-6 md:p-8">
          <Outlet />
        </main>
      </div>

      <ToastContainer />
    </div>
  )
}
