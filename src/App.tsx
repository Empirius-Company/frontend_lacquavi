import { useEffect } from 'react'
import { BrowserRouter, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { ToastProvider } from './context/ToastContext'
import { LoginModalProvider } from './context/LoginModalContext'
import { AppRoutes } from './routes/AppRoutes'
import { ToastContainer, ErrorBoundary, WhatsAppFloatingButton } from './components/ui'
import { LoginModal } from './components/layout/LoginModal'

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return null
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ScrollToTop />
        <ToastProvider>
          <AuthProvider>
            <CartProvider>
              <LoginModalProvider>
                <ErrorBoundary>
                  <AppRoutes />
                </ErrorBoundary>
                <LoginModal />
                <ToastContainer />
                <WhatsAppFloatingButton />
              </LoginModalProvider>
            </CartProvider>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
