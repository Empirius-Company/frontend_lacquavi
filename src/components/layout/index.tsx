import { type ReactNode, useEffect, useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'
import { ToastContainer } from '../ui'
import { useAuth } from '../../context/AuthContext'
import { ordersApi } from '../../api'

/* ════════════════════════════════════════════════════════
   MainLayout — public + customer pages
   ════════════════════════════════════════════════════ */
export function MainLayout({ children }: { children?: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-32">
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
type AdminNavLink = { to: string; label: string; icon: string; exact?: boolean }
type AdminNavGroup = { label?: string; links: AdminNavLink[] }

const ADMIN_NAV: AdminNavGroup[] = [
  {
    links: [
      { to: '/admin', label: 'Dashboard', icon: '◈', exact: true },
    ],
  },
  {
    label: 'Operações',
    links: [
      { to: '/admin/orders',   label: 'Pedidos',    icon: '◎' },
      { to: '/admin/payments', label: 'Pagamentos', icon: '◑' },
      { to: '/ops',            label: 'Painel Ops', icon: '◉' },
    ],
  },
  {
    label: 'Logística',
    links: [
      { to: '/admin/shipping', label: 'Frete & Etiquetas', icon: '◫' },
    ],
  },
  {
    label: 'Loja',
    links: [
      { to: '/admin/products',      label: 'Produtos',      icon: '◇' },
      { to: '/admin/categories',    label: 'Categorias',    icon: '⊞' },
      { to: '/admin/subcategories', label: 'Subcategorias', icon: '⊟' },
      { to: '/admin/banners',       label: 'Banners',       icon: '◬' },
      { to: '/admin/home-tiles',    label: 'Tiles Início',  icon: '⊡' },
      { to: '/admin/coupons',       label: 'Cupons',        icon: '⊛' },
    ],
  },
  {
    label: 'Sistema',
    links: [
      { to: '/status', label: 'Status API', icon: '◐' },
    ],
  },
]

/* ════════════════════════════════════════════════════════
   OpsLayout — operator panel (vendedoras)
   ════════════════════════════════════════════════════ */
type OpsNavLink = { to: string; label: string; icon: string; exact?: boolean }

const OPS_NAV: OpsNavLink[] = [
  { to: '/ops',          label: 'Turno de Hoje',   icon: '◈', exact: true },
  { to: '/ops/orders',   label: 'Pedidos',          icon: '◎' },
]

export function OpsLayout({ children }: { children?: ReactNode }) {
  const { isAdmin } = useAuth()
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/40 via-white to-amber-100/20 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-56 flex-col fixed left-0 top-0 bottom-0 border-r border-brand.border z-30 bg-white/95 backdrop-blur-md">
        {/* Logo */}
        <div className="px-6 py-7 border-b border-brand.border">
          <NavLink to="/" className="font-display text-xl text-brand.dark tracking-[0.06em] hover:text-amber-600 transition-colors">
            LACQUAVI
          </NavLink>
          <p className="text-2xs text-amber-500/80 mt-1 uppercase tracking-ultra">Operações</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-0.5">
          {OPS_NAV.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.exact}
              className={({ isActive }) => `
                flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm
                transition-all duration-200
                ${isActive
                  ? 'bg-amber-50 text-amber-700 border border-amber-200 shadow-sm'
                  : 'text-brand.text hover:bg-amber-50/70 hover:text-amber-700'
                }
              `}
            >
              <span className="text-base opacity-80">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-6 py-5 border-t border-brand.border space-y-2">
          {isAdmin && (
            <NavLink to="/admin" className="flex items-center gap-2 text-xs text-brand.textLight hover:text-amber-600 transition-colors">
              <span>⊞</span>
              Painel Admin
            </NavLink>
          )}
          <NavLink to="/" className="flex items-center gap-2 text-xs text-brand.textLight hover:text-amber-600 transition-colors">
            <span>←</span>
            Ir para a Loja
          </NavLink>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 md:ml-56 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="md:hidden bg-white border-b border-brand.border px-4 py-4 flex items-center justify-between">
          <span className="font-display text-lg text-brand.dark">LACQUAVI Operações</span>
          <NavLink to={isAdmin ? '/admin' : '/'} className="text-xs text-brand.textLight hover:text-amber-600">
            {isAdmin ? '← Admin' : '← Loja'}
          </NavLink>
        </header>

        <main className="flex-1 p-6 md:p-8">
          {children ?? <Outlet />}
        </main>
      </div>

      <ToastContainer />
    </div>
  )
}

export function AdminLayout({ children }: { children?: ReactNode }) {
  const [pendingOpsCount, setPendingOpsCount] = useState<number | null>(null)

  useEffect(() => {
    const fetch = () => ordersApi.opsCount().then(r => setPendingOpsCount(r.pendingCount)).catch(() => {})
    fetch()
    const id = setInterval(fetch, 60_000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/40 via-white to-emerald-100/30 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 flex-col fixed left-0 top-0 bottom-0 border-r border-brand.border z-30 bg-white/95 backdrop-blur-md">
        {/* Logo */}
        <div className="px-6 py-7 border-b border-brand.border">
          <NavLink to="/" className="font-display text-xl text-brand.dark tracking-[0.06em] hover:text-emerald-600 transition-colors">
            LACQUAVI
          </NavLink>
          <p className="text-2xs text-emerald-500/80 mt-1 uppercase tracking-ultra">Admin Panel</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 overflow-y-auto space-y-4">
          {ADMIN_NAV.map((group, gi) => (
            <div key={gi}>
              {group.label && (
                <p className="px-3.5 mb-1 text-2xs font-semibold uppercase tracking-widest text-obsidian-400">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.links.map(link => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.exact}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm
                      transition-all duration-200
                      ${isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm'
                        : 'text-brand.text hover:bg-emerald-50/70 hover:text-emerald-700'
                      }
                    `}
                  >
                    <span className="text-base opacity-80">{link.icon}</span>
                    <span className="flex-1">{link.label}</span>
                    {link.to === '/ops' && pendingOpsCount !== null && pendingOpsCount > 0 && (
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 min-w-[1.25rem] text-center leading-tight">
                        {pendingOpsCount > 99 ? '99+' : pendingOpsCount}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-6 py-5 border-t border-brand.border">
          <NavLink to="/" className="flex items-center gap-2 text-xs text-brand.textLight hover:text-emerald-600 transition-colors">
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
          <NavLink to="/" className="text-xs text-brand.textLight hover:text-emerald-600">← Loja</NavLink>
        </header>

        <main className="flex-1 p-6 md:p-8">
          {children ?? <Outlet />}
        </main>
      </div>

      <ToastContainer />
    </div>
  )
}
