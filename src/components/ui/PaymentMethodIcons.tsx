import { useId } from 'react'

// ─── Individual brand icons (viewBox 38×24) ───────────────────────────────────

function VisaIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 38 24" className={className} role="img" aria-label="Visa" xmlns="http://www.w3.org/2000/svg">
      <rect width="38" height="24" rx="3" fill="#1434CB" />
      <text x="19" y="16.5" textAnchor="middle" fill="white"
        fontFamily="Arial, sans-serif" fontWeight="700" fontSize="11" letterSpacing="1">VISA</text>
    </svg>
  )
}

function MastercardIcon({ className = '' }: { className?: string }) {
  const uid = useId()
  return (
    <svg viewBox="0 0 38 24" className={className} role="img" aria-label="Mastercard" xmlns="http://www.w3.org/2000/svg">
      <rect width="38" height="24" rx="3" fill="#1A1A2E" />
      <defs>
        <clipPath id={`${uid}r`}><circle cx="23" cy="12" r="8.5" /></clipPath>
      </defs>
      <circle cx="15" cy="12" r="8.5" fill="#EB001B" />
      <circle cx="23" cy="12" r="8.5" fill="#F79E1B" />
      {/* Orange overlap area */}
      <circle cx="15" cy="12" r="8.5" fill="#FF5F00" clipPath={`url(#${uid}r)`} />
    </svg>
  )
}

function EloIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 38 24" className={className} role="img" aria-label="Elo" xmlns="http://www.w3.org/2000/svg">
      <rect width="38" height="24" rx="3" fill="#000000" />
      <text x="9" y="16.5" fill="#FFD700" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="12">e</text>
      <text x="17" y="16.5" fill="white" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="12">lo</text>
    </svg>
  )
}

function AmexIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 38 24" className={className} role="img" aria-label="American Express" xmlns="http://www.w3.org/2000/svg">
      <rect width="38" height="24" rx="3" fill="#2E77BC" />
      <text x="19" y="15.5" textAnchor="middle" fill="white"
        fontFamily="Arial, sans-serif" fontWeight="700" fontSize="9" letterSpacing="0.8">AMEX</text>
    </svg>
  )
}

function HipercardIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 38 24" className={className} role="img" aria-label="Hipercard" xmlns="http://www.w3.org/2000/svg">
      <rect width="38" height="24" rx="3" fill="#CC0000" />
      <text x="19" y="15.5" textAnchor="middle" fill="white"
        fontFamily="Arial, sans-serif" fontWeight="700" fontSize="8.5" letterSpacing="0.5">HIPER</text>
    </svg>
  )
}

function PixIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 38 24" className={className} role="img" aria-label="PIX" xmlns="http://www.w3.org/2000/svg">
      <rect width="38" height="24" rx="3" fill="#32BCAD" />
      {/* PIX mark: rotated cross (×) using two rounded bars */}
      <g transform="translate(9, 12) rotate(45)">
        <rect x="-5" y="-1.5" width="10" height="3" rx="1.5" fill="white" />
        <rect x="-1.5" y="-5" width="3" height="10" rx="1.5" fill="white" />
      </g>
      <text x="27" y="15.5" textAnchor="middle" fill="white"
        fontFamily="Arial, sans-serif" fontWeight="700" fontSize="8" letterSpacing="0.3">PIX</text>
    </svg>
  )
}

function BoletoIcon({ className = '' }: { className?: string }) {
  // Barcode pattern: [x, width] pairs that fit inside 38px card
  const bars: [number, number][] = [
    [5, 2], [8, 1], [11, 3], [15, 1], [18, 2], [22, 1], [25, 2], [28, 1], [31, 3]
  ]
  return (
    <svg viewBox="0 0 38 24" className={className} role="img" aria-label="Boleto Bancário" xmlns="http://www.w3.org/2000/svg">
      <rect width="38" height="24" rx="3" fill="#3D3D3D" />
      {bars.map(([x, w], i) => (
        <rect key={i} x={x} y="5" width={w} height="14" fill="white" />
      ))}
    </svg>
  )
}

// ─── Card brand detection ─────────────────────────────────────────────────────

const ELO_SIX_DIGIT_BINS = [
  '401178', '401179', '431274', '438935', '451416', '457393',
  '457631', '457632', '504175', '627780', '636297', '636368',
]

/**
 * Detects the card brand from a (possibly partially typed) card number.
 * Returns null when no brand matches yet.
 */
export function detectCardBrand(
  cardNumber: string
): 'visa' | 'mastercard' | 'amex' | 'elo' | 'hipercard' | null {
  const n = cardNumber.replace(/\D/g, '')
  if (n.length < 2) return null

  // Elo — specific 6-digit BINs (check before Visa/MC due to overlap)
  if (n.length >= 6 && ELO_SIX_DIGIT_BINS.includes(n.substring(0, 6))) return 'elo'
  // Elo — 4-digit BIN prefixes
  if (/^(5090|5041|5066|5067)/.test(n)) return 'elo'

  // Hipercard
  if (/^(606282|3841)/.test(n)) return 'hipercard'

  // Amex
  if (/^3[47]/.test(n)) return 'amex'

  // Mastercard: 51–55, and 2221–2720 range
  if (/^5[1-5]/.test(n)) return 'mastercard'
  if (n.length >= 4) {
    const prefix = parseInt(n.substring(0, 4), 10)
    if (prefix >= 2221 && prefix <= 2720) return 'mastercard'
  }

  // Visa (after Elo to avoid false positives on 4xxx Elo BINs)
  if (/^4/.test(n)) return 'visa'

  return null
}

// ─── Footer bar — all 7 icons, grayscale + hover to reveal color ──────────────

export function PaymentIconsBar() {
  const iconCls = 'h-7 w-auto grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-200 cursor-default'
  return (
    <div className="flex flex-wrap items-center gap-2">
      <VisaIcon className={iconCls} />
      <MastercardIcon className={iconCls} />
      <EloIcon className={iconCls} />
      <AmexIcon className={iconCls} />
      <HipercardIcon className={iconCls} />
      <PixIcon className={iconCls} />
      <BoletoIcon className={iconCls} />
    </div>
  )
}

// ─── Checkout — 5 card brand icons with optional brand highlight ──────────────

const CHECKOUT_BRANDS: { id: string; Icon: (props: { className?: string }) => JSX.Element }[] = [
  { id: 'visa', Icon: VisaIcon },
  { id: 'mastercard', Icon: MastercardIcon },
  { id: 'elo', Icon: EloIcon },
  { id: 'amex', Icon: AmexIcon },
  { id: 'hipercard', Icon: HipercardIcon },
]

interface PaymentIconsCheckoutProps {
  /** Currently detected brand. Undefined = no detection yet (all icons normal). Null = typed but unrecognized. */
  detectedBrand?: string | null
  size?: 'sm' | 'md'
}

export function PaymentIconsCheckout({ detectedBrand, size = 'md' }: PaymentIconsCheckoutProps) {
  const h = size === 'sm' ? 'h-5' : 'h-6'
  const hasDetection = detectedBrand !== undefined && detectedBrand !== null

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {CHECKOUT_BRANDS.map(({ id, Icon }) => {
        const isActive = hasDetection && id === detectedBrand
        const isDimmed = hasDetection && id !== detectedBrand

        return (
          <span
            key={id}
            className={`transition-all duration-200 rounded-sm inline-flex ${
              isActive ? 'ring-1 ring-[#2a7e51] scale-110 shadow-sm' : ''
            } ${isDimmed ? 'opacity-25 grayscale' : ''}`}
          >
            <Icon className={`${h} w-auto`} />
          </span>
        )
      })}
    </div>
  )
}

// ─── Small badges for method selector (credit card radio option) ──────────────

export function PaymentBrandBadges() {
  const iconCls = 'h-5 w-auto opacity-75'
  return (
    <div className="flex items-center gap-1 flex-wrap mt-0.5">
      <VisaIcon className={iconCls} />
      <MastercardIcon className={iconCls} />
      <EloIcon className={iconCls} />
      <AmexIcon className={iconCls} />
      <HipercardIcon className={iconCls} />
    </div>
  )
}
