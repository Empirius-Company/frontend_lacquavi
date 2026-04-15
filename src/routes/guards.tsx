import { ReactNode, useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLoginModal } from '../context/LoginModalContext'
import { Spinner } from '../components/ui'

interface GuardProps { children: ReactNode }

export function ProtectedRoute({ children }: GuardProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const { openLoginModal } = useLoginModal()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      openLoginModal({ onDismiss: () => navigate(-1) })
    }
  }, [isAuthenticated, isLoading, openLoginModal, navigate])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  return <>{children}</>
}

export function AdminRoute({ children }: GuardProps) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth()
  const { openLoginModal } = useLoginModal()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      openLoginModal({ onDismiss: () => navigate(-1) })
    }
  }, [isAuthenticated, isLoading, openLoginModal, navigate])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-obsidian-50">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
