import { useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { MainLayout, AdminLayout } from '../components/layout'
import { ProtectedRoute, AdminRoute } from './guards'
import { useLoginModal, type AuthModalMode } from '../context/LoginModalContext'

// Public pages
import { HomePage }             from '../pages/HomePage'
import { ProductListPage }      from '../pages/ProductListPage'
import { ProductDetailPage }    from '../pages/ProductDetailPage'
import { CartPage }             from '../pages/CartPage'
import { StorePage }            from '../pages/StorePage'
import { ForgotPasswordPage }   from '../pages/ForgotPasswordPage'
import { ResetPasswordPage }    from '../pages/ResetPasswordPage'

// Auth / account / utility pages
import {
  AccountProfilePage,
  MyOrdersPage,
  OrderDetailPage,
  PaymentResultPage,
  NotFoundPage,
} from '../pages/general'

// Informational pages
import {
  TermosPage,
  PrivacidadePage,
  EntregaPage,
  TrocasPage,
  PagamentoPage,
} from '../pages/InfoPages'

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

// Checkout
import { CheckoutPage } from '../pages/CheckoutPage'
import { PaymentPage }  from '../pages/PaymentPage'

// Admin pages
import {
  AdminDashboardPage,
  AdminProductsPage,
  AdminProductFormPage,
  AdminBannersPage,
  AdminBannerFormPage,
  AdminHomeTilesPage,
  AdminCategoriesPage,
  AdminSubcategoriesPage,
  AdminOrdersPage,
  AdminOrderDetailPage,
  AdminPaymentsPage,
  AdminPaymentDetailPage,
  AdminCouponsPage,
  AdminCouponFormPage,
  AdminShippingPage,
  StatusPage,
} from '../pages/admin'

export function AppRoutes() {
  return (
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
  )
}
