/**
 * Contact Configuration
 * Centralized contact management using a single environment variable
 */

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '5531975019000'

export const CONTACT_CONFIG = {
  // WhatsApp number (raw format: country code + area + number, no symbols)
  whatsappNumber: WHATSAPP_NUMBER,

  // Display phone (formatted for UI)
  displayPhone: formatPhone(WHATSAPP_NUMBER),

  // Business hours (hardcoded)
  businessHours: 'Seg. a Sex. das 8h às 22h\nSáb. das 9h às 14h',
}

/**
 * Generate WhatsApp URL
 * @param message - Optional message to pre-fill
 * @returns WhatsApp Web URL
 */
export const getWhatsAppUrl = (message?: string): string => {
  const encoded = message ? encodeURIComponent(message) : ''
  const url = `https://wa.me/${CONTACT_CONFIG.whatsappNumber}`
  return encoded ? `${url}?text=${encoded}` : url
}

/**
 * Format phone number for display
 * Converts 5531975019000 to 31 97501-9000
 * @param raw - Raw phone number (digits only)
 * @returns Formatted phone number
 */
function formatPhone(raw: string): string {
  const cleaned = raw.replace(/\D/g, '')

  // If starts with country code (55), remove it for display
  const withoutCountry = cleaned.startsWith('55') ? cleaned.slice(2) : cleaned

  // Format: (XX) XXXXX-XXXX for 10 or 11 digits
  if (withoutCountry.length === 10) {
    return `${withoutCountry.slice(0, 2)} ${withoutCountry.slice(2, 7)}-${withoutCountry.slice(7)}`
  }
  if (withoutCountry.length === 11) {
    return `${withoutCountry.slice(0, 2)} ${withoutCountry.slice(2, 7)}-${withoutCountry.slice(7)}`
  }

  return withoutCountry
}

/**
 * Get phone with country code for schema.org
 * Converts 5531975019000 to +55 31 97501-9000
 */
export function getSchemaPhone(): string {
  const cleaned = CONTACT_CONFIG.whatsappNumber.replace(/\D/g, '')

  // Ensure country code
  const withCountry = cleaned.startsWith('55') ? cleaned : `55${cleaned}`
  const countryCode = withCountry.slice(0, 2)
  const areaCode = withCountry.slice(2, 4)
  const firstPart = withCountry.slice(4, 9)
  const secondPart = withCountry.slice(9)

  return `+${countryCode} ${areaCode} ${firstPart}-${secondPart}`
}

