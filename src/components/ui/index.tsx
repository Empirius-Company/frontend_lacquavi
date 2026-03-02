import { ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, ReactNode, useEffect } from 'react'
import { useToast } from '../../context/ToastContext'
import type { ToastType } from '../../context/ToastContext'

// ─── Button ───────────────────────────────────────────────────────────────────
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'noir' | 'ghost' | 'outline' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  const sizeClasses = {
    sm: 'px-5 py-2.5 text-xs gap-2',
    md: 'px-8 py-3.5 text-sm gap-2.5',
    lg: 'px-10 py-4 text-base gap-3',
  }[size]

  const variantClass = {
    primary: 'btn-primary',
    noir:    'btn-noir',
    ghost:   'btn-ghost',
    outline: 'btn-outline',
    danger:  'btn-danger',
  }[variant]

  return (
    <button
      className={`
        inline-flex items-center justify-center font-body font-medium
        tracking-wide rounded-full transition-all duration-300
        disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none
        ${variantClass} ${sizeClasses} ${fullWidth ? 'w-full' : ''} ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />
      )}
      {children}
    </button>
  )
}

// ─── Input ────────────────────────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  dark?: boolean
  icon?: ReactNode
}

export function Input({ label, error, hint, dark = false, icon, className = '', id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={inputId} className={`block text-2xs font-medium tracking-wide-lg uppercase ${dark ? 'text-nude-400' : 'text-nude-600'}`}>
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-nude-400 pointer-events-none">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          className={`
            ${dark ? 'input-dark' : 'input-luxury'}
            ${icon ? 'pl-10' : ''}
            ${error ? (dark ? '!border-red-500/50' : '!border-red-400') : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className={`text-xs ${dark ? 'text-red-400' : 'text-red-500'}`}>{error}</p>}
      {hint && !error && <p className={`text-xs ${dark ? 'text-nude-600' : 'text-nude-400'}`}>{hint}</p>}
    </div>
  )
}

// ─── Select ───────────────────────────────────────────────────────────────────
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
  dark?: boolean
}

export function Select({ label, error, options, placeholder, dark = false, className = '', id, ...props }: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={selectId} className={`block text-2xs font-medium tracking-wide-lg uppercase ${dark ? 'text-nude-400' : 'text-nude-600'}`}>
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`${dark ? 'input-dark' : 'input-luxury'} appearance-none cursor-pointer ${error ? '!border-red-400' : ''} ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ─── Badge ────────────────────────────────────────────────────────────────────
interface BadgeProps {
  children: ReactNode
  variant?: 'gold' | 'success' | 'error' | 'warning' | 'info' | 'neutral' | 'rouge'
  size?: 'sm' | 'md'
  className?: string
}

export function Badge({ children, variant = 'neutral', size = 'sm', className = '' }: BadgeProps) {
  const colors = {
    gold:    'bg-gold-500/10 text-gold-500 border-gold-600/25',
    rouge:   'bg-rouge-800/10 text-rouge-700 border-rouge-800/20',
    success: 'bg-green-50 text-green-700 border-green-200',
    error:   'bg-red-50 text-red-700 border-red-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    info:    'bg-blue-50 text-blue-700 border-blue-200',
    neutral: 'bg-nude-50 text-nude-700 border-nude-200',
  }[variant]

  const sizes = { sm: 'px-2.5 py-0.5 text-2xs', md: 'px-3 py-1 text-xs' }[size]

  return (
    <span className={`badge-status border rounded-full font-medium tracking-wide uppercase ${colors} ${sizes} ${className}`}>
      {children}
    </span>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
export function Skeleton({ className = '', dark = false }: { className?: string; dark?: boolean }) {
  return <div className={`${dark ? 'skeleton' : 'skeleton-light'} rounded-xl ${className}`} />
}

export function ProductCardSkeleton({ dark = false }: { dark?: boolean }) {
  const bg = dark ? 'bg-white/5' : 'bg-nude-100/50'
  return (
    <div className={`rounded-2xl overflow-hidden ${bg}`}>
      <Skeleton className="aspect-[3/4] w-full rounded-none" dark={dark} />
      <div className="p-4 space-y-3">
        <Skeleton className="h-2.5 w-1/2" dark={dark} />
        <Skeleton className="h-5 w-full" dark={dark} />
        <Skeleton className="h-4 w-2/3" dark={dark} />
        <Skeleton className="h-11 w-full rounded-full" dark={dark} />
      </div>
    </div>
  )
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 'md', className = '', dark = false }: { size?: 'sm' | 'md' | 'lg'; className?: string; dark?: boolean }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }[size]
  const color = dark ? 'border-gold-500/30 border-t-gold-500' : 'border-nude-300 border-t-nude-600'
  return <span className={`block border-2 ${color} rounded-full animate-spin ${sizes} ${className}`} />
}

// ─── Empty State ──────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: ReactNode
  dark?: boolean
}

export function EmptyState({ icon = '◇', title, description, action, dark = false }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-5">
      <div className={`text-5xl ${dark ? 'text-gold-600/30' : 'text-nude-300'}`}>{icon}</div>
      <div>
        <h3 className={`font-display text-xl ${dark ? 'text-pearl' : 'text-noir-950'}`}>{title}</h3>
        {description && <p className={`mt-1.5 text-sm ${dark ? 'text-nude-500' : 'text-nude-500'}`}>{description}</p>}
      </div>
      {action}
    </div>
  )
}

// ─── Toast Container ──────────────────────────────────────────────────────────
const toastConfig: Record<ToastType, { icon: string; class: string }> = {
  success: { icon: '✓', class: 'bg-noir-950/95 border-gold-600/30 text-gold-400' },
  error:   { icon: '✕', class: 'bg-noir-950/95 border-red-500/30 text-red-400' },
  warning: { icon: '⚠', class: 'bg-noir-950/95 border-amber-500/30 text-amber-400' },
  info:    { icon: 'i', class: 'bg-noir-950/95 border-nude-600/30 text-nude-300' },
}

export function ToastContainer() {
  const { toasts, dismiss } = useToast()
  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map(t => {
        const cfg = toastConfig[t.type]
        return (
          <div
            key={t.id}
            className={`
              pointer-events-auto flex items-start gap-3 px-4 py-3.5
              rounded-2xl border backdrop-blur-xl shadow-card-dark
              animate-slide-in font-body text-sm
              ${cfg.class}
            `}
          >
            <span className="text-sm leading-tight font-medium flex-shrink-0">{cfg.icon}</span>
            <span className="flex-1 leading-snug text-nude-200">{t.message}</span>
            <button onClick={() => dismiss(t.id)} className="text-nude-600 hover:text-nude-300 transition-colors text-xs">✕</button>
          </div>
        )
      })}
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────
interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  maxWidth?: string
  dark?: boolean
}

export function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg', dark = false }: ModalProps) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) { document.addEventListener('keydown', h); document.body.style.overflow = 'hidden' }
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = '' }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-noir-950/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`
        relative w-full ${maxWidth} rounded-3xl shadow-deep p-7 animate-scale-in
        ${dark ? 'bg-noir-900 border border-white/8' : 'bg-pearl border border-nude-100'}
      `}>
        {title && (
          <div className="flex items-center justify-between mb-6">
            <h2 className={`font-display text-xl ${dark ? 'text-pearl' : 'text-noir-950'}`}>{title}</h2>
            <button
              onClick={onClose}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors ${
                dark ? 'text-nude-500 hover:text-pearl hover:bg-white/8' : 'text-nude-400 hover:text-noir-950 hover:bg-nude-50'
              }`}
            >✕</button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

// ─── Error Message ────────────────────────────────────────────────────────────
export function ErrorMessage({ message, dark = false }: { message: string; dark?: boolean }) {
  if (!message) return null
  return (
    <div className={`flex items-start gap-2.5 p-3.5 rounded-xl text-sm border ${
      dark
        ? 'bg-red-500/8 border-red-500/20 text-red-400'
        : 'bg-red-50 border-red-200 text-red-700'
    }`}>
      <span className="flex-shrink-0">⚠</span>
      <span>{message}</span>
    </div>
  )
}
