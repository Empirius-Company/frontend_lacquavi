import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react'

export type AuthModalMode = 'login' | 'register'

interface OpenOpts {
  mode?: AuthModalMode
  onSuccess?: () => void
  onDismiss?: () => void
}

interface LoginModalContextValue {
  isOpen: boolean
  mode: AuthModalMode
  setMode: (mode: AuthModalMode) => void
  openLoginModal: (opts?: OpenOpts) => void
  closeLoginModal: () => void
  dismissLoginModal: () => void
}

const LoginModalContext = createContext<LoginModalContextValue | null>(null)

export function LoginModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<AuthModalMode>('login')
  const onSuccessRef = useRef<(() => void) | null>(null)
  const onDismissRef = useRef<(() => void) | null>(null)

  const openLoginModal = useCallback((opts?: OpenOpts) => {
    onSuccessRef.current = opts?.onSuccess ?? null
    onDismissRef.current = opts?.onDismiss ?? null
    setMode(opts?.mode ?? 'login')
    setIsOpen(true)
  }, [])

  // Called after successful login/register
  const closeLoginModal = useCallback(() => {
    const cb = onSuccessRef.current
    onSuccessRef.current = null
    onDismissRef.current = null
    setIsOpen(false)
    cb?.()
  }, [])

  // Called when user explicitly dismisses without logging in
  const dismissLoginModal = useCallback(() => {
    const cb = onDismissRef.current
    onSuccessRef.current = null
    onDismissRef.current = null
    setIsOpen(false)
    cb?.()
  }, [])

  return (
    <LoginModalContext.Provider value={{ isOpen, mode, setMode, openLoginModal, closeLoginModal, dismissLoginModal }}>
      {children}
    </LoginModalContext.Provider>
  )
}

export function useLoginModal() {
  const ctx = useContext(LoginModalContext)
  if (!ctx) throw new Error('useLoginModal must be used inside <LoginModalProvider>')
  return ctx
}
