import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { MainLayout, AdminLayout } from '../components/layout'
import { ProtectedRoute, AdminRoute } from './guards'
import { useLoginModal, type AuthModalMode } from '../context/LoginModalContext'

// Home is eagerly loaded — it's the entry point and the LCP page
import { HomePage } from '../pages/HomePage'

// All other pages are lazy-loaded to reduce the initial bundle
const ProductListPage    = lazy(() => import('../pages/ProductListPage').then(m => ({ default: m.ProductListPage })))
const ProductDetailPage  = lazy(() => import('../pages/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })))
const CartPage           = lazy(() => import('../pages/CartPage').then(m => ({ default: m.CartPage })))
const StorePage          = lazy(() => import('../pages/StorePage').then(m => ({ default: m.StorePage })))
const ForgotPasswordPage = lazy(() => import('../pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })))
const ResetPasswordPage  = lazy(() => import('../pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })))
const CheckoutPage       = lazy(() => import('../pages/CheckoutPage').then(m => ({ default: m.CheckoutPage })))
const PaymentPage        = lazy(() => import('../pages/PaymentPage').then(m => ({ default: m.PaymentPage })))

// Info pages
const TermosPage      = lazy(() => import('../pages/InfoPages').then(m => ({ default: m.TermosPage })))
const PrivacidadePage = lazy(() => import('../pages/InfoPages').then(m => ({ default: m.PrivacidadePage })))
const EntregaPage     = lazy(() => import('../pages/InfoPages').then(m => ({ default: m.EntregaPage })))
const TrocasPage      = lazy(() => import('../pages/InfoPages').then(m => ({ default: m.TrocasPage })))
const PagamentoPage   = lazy(() => import('../pages/InfoPages').then(m => ({ default: m.PagamentoPage })))

// Account/utility pages
const AccountProfilePage = lazy(() => import('../pages/general').then(m => ({ default: m.AccountProfilePage })))
const MyOrdersPage       = lazy(() => import('../pages/general').then(m => ({ default: m.MyOrdersPage })))
const OrderDetailPage    = lazy(() => import('../pages/general').then(m => ({ default: m.OrderDetailPage })))
const PaymentResultPage  = lazy(() => import('../pages/general').then(m => ({ default: m.PaymentResultPage })))
const NotFoundPage       = lazy(() => import('../pages/general').then(m => ({ default: m.NotFoundPage })))

// Admin pages
const AdminDashboardPage    = lazy(() => import('../pages/admin').then(m => ({ default: m.AdminDashboardPage })))
const AdminProductsPage     = lazy(() => import('../pages/admin').then(m => ({ default: m.AdminProductsPage })))
const AdminProductFormPage  = lazy(() => import('../pages/admin').then(m => ({ default: m.AdminProductFormPage })))
const AdminBannersPage      = lazy(() => import('../pages/admin').then(m => ({ default: m.AdminBannersPage })))
const AdminBannerFormPage   = lazy(() => import('../pages/admin').then(m => ({ default: m.AdminBannerFormPage })))
const AdminHomeTilesPage    = lazy(() => import('../pages/admin').then(m => ({ default: m.AdminHomeTilesPage })))
const AdminCategoriesPage   = lazy(() => import('../pages/admin').then(m => ({ default: m.AdminCategoriesPage })))
const AdminSubcategoriesPage= lazy(() => import('../pages/admin').then(m => ({ default: m.AdminSubcategoriesPage })))
const AdminOrdersPage       = lazy(() => import('../pages/admin').then(m => ({ default: m.AdminOrdersPage })))
const AdminOrderDetailPage  = lazy(() => import('../pages/admin').then(m => ({ default: m.AdminOrderDetailPage })))
const AdminPaymentsPage     = lazy(() => import('../pages/admin').then(m => ({ default: m.AdminPaymentsPage })))
const AdminPaymentDetailPage= lazy(() => import('../pages/admin').then(m => ({ default: m.AdminPaymentDetailPage })))
const AdminCouponsPage      = lazy(() => import('../pages/admin').then(m => ({ default: m.AdminCouponsPage })))
const AdminCouponFormPage   = lazy(() => import('../pages/admin').then(m => ({ default: m.AdminCouponFormPage })))
const AdminShippingPage     = lazy(() => import('../pages/admin').then(m => ({ default: m.AdminShippingPage })))
const StatusPage            = lazy(() => import('../pages/admin').then(m => ({ default: m.StatusPage })))

// Redirects /login and /register to the current page with the modal open
function AuthModalRedirect({ mode }: { mode: AuthModalMode }) {
  const { openLoginModal } = useLoginModal()
  const navigate = useNavigate()
  useEffect(() => {
    navigate(-1)
    openLoginModal({ mode })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

export function AppRoutes() {
  return (
    <Suspense fallback={null}>
      <Routes>

        {/* ── Public routes (within MainLayout) ───────────────── */}
        <Route element={<MainLayout />}>
          <Route path="/"             element={<HomePage />} />
          <Route path="/products"     element={<ProductListPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/cart"         element={<CartPage />} />
          <Route path="/nossa-loja"    element={<StorePage />} />
          <Route path="/termos"            element={<TermosPage />} />
          <Route path="/privacidade"       element={<PrivacidadePage />} />
          <Route path="/entrega"           element={<EntregaPage />} />
          <Route path="/trocas"            element={<TrocasPage />} />
          <Route path="/pagamento"         element={<PagamentoPage />} />
          <Route path="/forgot-password"   element={<ForgotPasswordPage />} />
          <Route path="/reset-password"    element={<ResetPasswordPage />} />
        </Route>

        {/* ── Auth pages — open modal and go back, no fullscreen page ── */}
        <Route path="/login"    element={<AuthModalRedirect mode="login" />} />
        <Route path="/register" element={<AuthModalRedirect mode="register" />} />

        {/* ── Protected customer routes ──────────────────────────── */}
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/account/profile"                    element={<AccountProfilePage />} />
          <Route path="/account/orders"                     element={<MyOrdersPage />} />
          <Route path="/account/orders/:id"                 element={<OrderDetailPage />} />
          <Route path="/checkout"                           element={<CheckoutPage />} />
          <Route path="/checkout/payment/:orderId"          element={<PaymentPage />} />
          <Route path="/checkout/payment/:orderId/result"   element={<PaymentResultPage />} />
        </Route>

        {/* ── Admin routes ──────────────────────────────────────── */}
        <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route path="/admin"                      element={<AdminDashboardPage />} />
          <Route path="/admin/products"             element={<AdminProductsPage />} />
          <Route path="/admin/products/new"         element={<AdminProductFormPage />} />
          <Route path="/admin/products/:id/edit"    element={<AdminProductFormPage />} />
          <Route path="/admin/banners"              element={<AdminBannersPage />} />
          <Route path="/admin/banners/new"          element={<AdminBannerFormPage />} />
          <Route path="/admin/banners/:id/edit"     element={<AdminBannerFormPage />} />
          <Route path="/admin/home-tiles"           element={<AdminHomeTilesPage />} />
          <Route path="/admin/categories"           element={<AdminCategoriesPage />} />
          <Route path="/admin/subcategories"        element={<AdminSubcategoriesPage />} />
          <Route path="/admin/orders"               element={<AdminOrdersPage />} />
          <Route path="/admin/orders/:id"           element={<AdminOrderDetailPage />} />
          <Route path="/admin/payments"             element={<AdminPaymentsPage />} />
          <Route path="/admin/payments/:id"         element={<AdminPaymentDetailPage />} />
          <Route path="/admin/coupons"              element={<AdminCouponsPage />} />
          <Route path="/admin/coupons/new"          element={<AdminCouponFormPage />} />
          <Route path="/admin/coupons/:id/edit"     element={<AdminCouponFormPage />} />
          <Route path="/admin/shipping"             element={<AdminShippingPage />} />
          <Route path="/status"                     element={<StatusPage />} />
        </Route>

        {/* ── 404 ────────────────────────────────────────────────── */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}
