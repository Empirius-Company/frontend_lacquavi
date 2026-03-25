import { useEffect } from 'react'
import { BrowserRouter, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { ToastProvider } from './context/ToastContext'
import { AppRoutes } from './routes/AppRoutes'
import { ToastContainer, ErrorBoundary } from './components/ui'

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
              <ErrorBoundary>
                <AppRoutes />
              </ErrorBoundary>
              <ToastContainer />
            </CartProvider>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
