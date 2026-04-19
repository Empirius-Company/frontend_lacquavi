import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { authApi } from '../api/authApi'
import { Button, Input, ErrorMessage } from '../components/ui'
import { useLoginModal } from '../context/LoginModalContext'
import type { ApiError } from '../types'

function validatePassword(password: string): string {
  if (password.length < 8)       return 'Senha deve ter no mínimo 8 caracteres.'
  if (!/[A-Z]/.test(password))   return 'Senha deve conter pelo menos uma letra maiúscula.'
  if (!/[a-z]/.test(password))   return 'Senha deve conter pelo menos uma letra minúscula.'
  if (!/[0-9]/.test(password))   return 'Senha deve conter pelo menos um número.'
  return ''
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { openLoginModal } = useLoginModal()

  const token = searchParams.get('token') ?? ''

  const [form, setForm] = useState({ password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  // Sem token na URL → redireciona imediatamente
  useEffect(() => {
    if (!token) navigate('/forgot-password', { replace: true })
  }, [token, navigate])

  const set = (k: string, v: string) => { setForm(f => ({ ...f, [k]: v })); setError('') }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const passwordError = validatePassword(form.password)
    if (passwordError) { setError(passwordError); return }
    if (form.password !== form.confirm) { setError('As senhas não coincidem.'); return }

    setLoading(true)
    setError('')
    try {
      await authApi.resetPassword(token, form.password)
      setDone(true)
    } catch (err) {
      const msg = (err as ApiError).message ?? ''
      setError(msg || 'Não foi possível redefinir sua senha. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenLogin = () => {
    navigate('/')
    openLoginModal({ mode: 'login' })
  }

  if (!token) return null

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">

        <div className="bg-white rounded-3xl shadow-card p-8 md:p-10 animate-fade-in">

          {/* Logo */}
          <div className="text-center mb-8">
            <picture>
              <source srcSet="/logo.webp" type="image/webp" />
              <img src="/logo.png" alt="Lacqua" className="h-9 object-contain mx-auto" width="144" height="36" />
            </picture>
          </div>

          {done ? (
            /* ── Estado: senha atualizada ── */
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-5">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-700">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="font-display text-2xl font-black text-[#000000] mb-3">
                Senha atualizada!
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-8">
                Sua senha foi redefinida com sucesso. Faça login para continuar comprando.
              </p>
              <Button variant="primary" size="lg" fullWidth onClick={handleOpenLogin}>
                Entrar na conta
              </Button>
            </div>
          ) : (
            /* ── Estado: formulário ── */
            <>
              <div className="mb-7">
                <p className="text-xs font-bold text-[#2a7e51] uppercase tracking-widest mb-1.5">
                  Nova senha
                </p>
                <h2 className="font-display text-2xl font-black text-[#000000] leading-tight">
                  Redefinir senha
                </h2>
                <p className="text-gray-500 text-sm mt-1.5 leading-relaxed">
                  Escolha uma senha forte para proteger sua conta.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Nova senha"
                  type="password"
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                  required
                />
                <Input
                  label="Confirmar nova senha"
                  type="password"
                  value={form.confirm}
                  onChange={e => set('confirm', e.target.value)}
                  placeholder="Repita a nova senha"
                  autoComplete="new-password"
                  required
                />

                {/* Requisitos visuais */}
                <ul className="text-xs text-gray-400 space-y-1 pl-1">
                  {[
                    { label: 'Mínimo 8 caracteres',        ok: form.password.length >= 8 },
                    { label: 'Uma letra maiúscula',         ok: /[A-Z]/.test(form.password) },
                    { label: 'Uma letra minúscula',         ok: /[a-z]/.test(form.password) },
                    { label: 'Um número',                   ok: /[0-9]/.test(form.password) },
                  ].map(({ label, ok }) => (
                    <li key={label} className={`flex items-center gap-1.5 transition-colors ${ok ? 'text-[#2a7e51]' : 'text-gray-400'}`}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        {ok
                          ? <polyline points="20 6 9 17 4 12" />
                          : <circle cx="12" cy="12" r="9" />}
                      </svg>
                      {label}
                    </li>
                  ))}
                </ul>

                {error && (
                  <>
                    <ErrorMessage message={error} />
                    {(error.includes('expirou') || error.includes('utilizado') || error.includes('inválido')) && (
                      <p className="text-sm text-center">
                        <a
                          href="/forgot-password"
                          className="text-[#2a7e51] hover:text-[#236843] font-semibold transition-colors"
                        >
                          Solicitar novo link
                        </a>
                      </p>
                    )}
                  </>
                )}

                <Button variant="primary" size="lg" fullWidth type="submit" loading={loading}>
                  Salvar nova senha
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
