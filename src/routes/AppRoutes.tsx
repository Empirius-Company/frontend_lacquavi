import { Routes, Route } from 'react-router-dom'
import { MainLayout, AdminLayout } from '../components/layout'
import { ProtectedRoute, AdminRoute } from './guards'

// Public pages
import { HomePage }          from '../pages/HomePage'
import { ProductListPage }   from '../pages/ProductListPage'
import { ProductDetailPage } from '../pages/ProductDetailPage'
import { CartPage }          from '../pages/CartPage'
import { StorePage }         from '../pages/StorePage'

// Auth / account / utility pages
import {
  LoginPage,
  RegisterPage,
  AccountProfilePage,
  MyOrdersPage,
  OrderDetailPage,
  PaymentResultPage,
  NotFoundPage,
} from '../pages/general'

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
  AdminCategoriesPage,
  AdminSubcategoriesPage,
  AdminOrdersPage,
  AdminOrderDetailPage,
  AdminPaymentsPage,
  AdminPaymentDetailPage,
  AdminCouponsPage,
  AdminCouponFormPage,
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
      </Route>

      {/* ── Auth pages (full-screen, no nav layout) ───────────── */}
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

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
        <Route path="/admin/categories"           element={<AdminCategoriesPage />} />
        <Route path="/admin/subcategories"        element={<AdminSubcategoriesPage />} />
        <Route path="/admin/orders"               element={<AdminOrdersPage />} />
        <Route path="/admin/orders/:id"           element={<AdminOrderDetailPage />} />
        <Route path="/admin/payments"             element={<AdminPaymentsPage />} />
        <Route path="/admin/payments/:id"         element={<AdminPaymentDetailPage />} />
        <Route path="/admin/coupons"              element={<AdminCouponsPage />} />
        <Route path="/admin/coupons/new"          element={<AdminCouponFormPage />} />
        <Route path="/admin/coupons/:id/edit"     element={<AdminCouponFormPage />} />
        <Route path="/status"                     element={<StatusPage />} />
      </Route>

      {/* ── 404 ────────────────────────────────────────────────── */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
