import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../../context/AuthContext'
import { useLoginModal } from '../../context/LoginModalContext'
import { Button, Input, ErrorMessage } from '../ui'
import type { ApiError } from '../../types'

// ─── Login Form ───────────────────────────────────────────────────────────────
function LoginForm({ onSwitchToRegister }: { onSwitchToRegister: () => void }) {
  const { login } = useAuth()
  const { closeLoginModal } = useLoginModal()

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k: string, v: string) => { setForm(f => ({ ...f, [k]: v })); setError('') }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email || !form.password) { setError('Preencha todos os campos.'); return }
    setLoading(true); setError('')
    try {
      await login(form.email, form.password)
      closeLoginModal()
    } catch (err) {
      setError((err as ApiError).message ?? 'Email ou senha inválidos')
    } finally { setLoading(false) }
  }

  return (
    <>
      <div className="mb-6">
        <p className="text-xs font-bold text-[#2a7e51] uppercase tracking-widest mb-1.5">
          Bem-vindo de volta
        </p>
        <h2 className="font-display text-2xl text-[#000000] font-black leading-tight">
          Entrar na sua conta
        </h2>
        <p className="text-gray-500 text-sm mt-1.5 leading-relaxed">
          Acesse para ver seus pedidos e continuar comprando.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="E-mail"
          type="email"
          value={form.email}
          onChange={e => set('email', e.target.value)}
          placeholder="seu@email.com"
          autoComplete="email"
          required
        />
        <Input
          label="Senha"
          type="password"
          value={form.password}
          onChange={e => set('password', e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />
        {error && <ErrorMessage message={error} />}
        <Button variant="primary" size="lg" fullWidth type="submit" loading={loading}>
          Entrar
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-5">
        Não tem conta?{' '}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-[#2a7e51] hover:text-[#236843] font-semibold transition-colors"
        >
          Criar conta gratuita
        </button>
      </p>
    </>
  )
}

// ─── Register Form ────────────────────────────────────────────────────────────
function RegisterForm({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const { register } = useAuth()
  const { closeLoginModal } = useLoginModal()

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k: string, v: string) => { setForm(f => ({ ...f, [k]: v })); setError('') }

  const handlePhone = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 11)
    let formatted = digits
    if (digits.length > 2)  formatted = `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    if (digits.length > 7)  formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
    set('phone', formatted)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) { setError('Preencha todos os campos obrigatórios.'); return }
    if (form.password.length < 8) { setError('Senha deve ter pelo menos 8 caracteres.'); return }
    if (form.phone && form.phone.replace(/\D/g, '').length < 10) { setError('Telefone inválido.'); return }
    setLoading(true); setError('')
    try {
      const rawPhone = form.phone ? form.phone.replace(/\D/g, '') : undefined
      await register(form.name, form.email, form.password, rawPhone)
      closeLoginModal()
    } catch (err) {
      setError((err as ApiError).message ?? 'Erro ao criar conta')
    } finally { setLoading(false) }
  }

  return (
    <>
      <div className="mb-5">
        <p className="text-xs font-bold text-[#2a7e51] uppercase tracking-widest mb-1">
          Junte-se à Lacquavi
        </p>
        <h2 className="font-display text-2xl text-[#000000] font-black leading-tight">
          Criar sua conta
        </h2>
        <p className="text-gray-500 text-sm mt-1 leading-relaxed">
          Cadastre-se e receba ofertas e novidades exclusivas.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Input
              label="Nome completo"
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="Seu nome"
              autoComplete="name"
              required
            />
          </div>
          <Input
            label="E-mail"
            type="email"
            value={form.email}
            onChange={e => set('email', e.target.value)}
            placeholder="seu@email.com"
            autoComplete="email"
            required
          />
          <Input
            label="Telefone (opcional)"
            type="tel"
            value={form.phone}
            onChange={e => handlePhone(e.target.value)}
            placeholder="(11) 99999-9999"
            inputMode="numeric"
          />
        </div>
        <Input
          label="Senha"
          type="password"
          value={form.password}
          onChange={e => set('password', e.target.value)}
          placeholder="Mínimo 8 caracteres"
          autoComplete="new-password"
          required
        />
        {error && <ErrorMessage message={error} />}
        <Button variant="primary" size="lg" fullWidth type="submit" loading={loading}>
          Criar Conta Gratuita
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-4">
        Já tem conta?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-[#2a7e51] hover:text-[#236843] font-semibold transition-colors"
        >
          Entrar
        </button>
      </p>
    </>
  )
}

// ─── Auth Modal ───────────────────────────────────────────────────────────────
export function LoginModal() {
  const { isOpen, mode, setMode, dismissLoginModal } = useLoginModal()

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') dismissLoginModal() }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, dismissLoginModal])

  // Close on browser back/forward navigation
  useEffect(() => {
    if (!isOpen) return
    const handlePopState = () => dismissLoginModal()
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [isOpen, dismissLoginModal])

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-label={mode === 'login' ? 'Entrar na conta' : 'Criar conta'}
    >
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={dismissLoginModal}
        aria-hidden="true"
      />

      {/* Modal card — scrollable so it never bleeds off-screen */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-full overflow-y-auto animate-fade-in">
        {/* Close button — sticky so always visible while scrolling */}
        <button
          onClick={dismissLoginModal}
          aria-label="Fechar"
          className="sticky top-4 float-right mr-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-black transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="px-8 pt-6 pb-8">
          {/* Logo */}
          <div className="text-center mb-5">
            <img src="/logo.png" alt="Lacquavi" className="h-9 object-contain mx-auto" />
          </div>

          {mode === 'login' ? (
            <LoginForm onSwitchToRegister={() => setMode('register')} />
          ) : (
            <RegisterForm onSwitchToLogin={() => setMode('login')} />
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
