import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/authApi'
import { Button, Input, ErrorMessage } from '../components/ui'
import { useLoginModal } from '../context/LoginModalContext'
import type { ApiError } from '../types'

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const { openLoginModal } = useLoginModal()

  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) { setError('Informe seu e-mail.'); return }
    setLoading(true)
    setError('')
    try {
      await authApi.forgotPassword(email.trim())
      setSent(true)
    } catch (err) {
      setError((err as ApiError).message ?? 'Erro ao enviar as instruções. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleBackToLogin = () => {
    navigate('/')
    openLoginModal({ mode: 'login' })
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-card p-8 md:p-10 animate-fade-in">

          {/* Logo */}
          <div className="text-center mb-8">
            <img src="/logo.png" alt="Lacqua" className="h-9 object-contain mx-auto" />
          </div>

          {sent ? (
            /* ── Estado: email enviado ── */
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-5">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <h2 className="font-display text-2xl font-black text-[#000000] mb-3">
                Verifique seu e-mail
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-2">
                Se o endereço <strong className="text-gray-700">{email}</strong> estiver cadastrado, você receberá as instruções para redefinir sua senha em breve.
              </p>
              <p className="text-gray-400 text-xs mb-8">
                Não esqueça de verificar a caixa de spam.
              </p>
              <Button variant="primary" size="lg" fullWidth onClick={handleBackToLogin}>
                Voltar ao login
              </Button>
            </div>
          ) : (
            /* ── Estado: formulário ── */
            <>
              <div className="mb-7">
                <p className="text-xs font-bold text-[#2a7e51] uppercase tracking-widest mb-1.5">
                  Recuperação de acesso
                </p>
                <h2 className="font-display text-2xl font-black text-[#000000] leading-tight">
                  Esqueceu sua senha?
                </h2>
                <p className="text-gray-500 text-sm mt-1.5 leading-relaxed">
                  Informe seu e-mail e enviaremos um link para você criar uma nova senha.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="E-mail"
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  placeholder="seu@email.com"
                  autoComplete="email"
                  required
                />
                {error && <ErrorMessage message={error} />}
                <Button variant="primary" size="lg" fullWidth type="submit" loading={loading}>
                  Enviar instruções
                </Button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-6">
                Lembrou a senha?{' '}
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="text-[#2a7e51] hover:text-[#236843] font-semibold transition-colors"
                >
                  Voltar ao login
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
