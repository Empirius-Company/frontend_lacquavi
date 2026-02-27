/* ══════════════════════════════════════════════════════════════════
   LACQUAVI — Configuração Central da Loja Física
   ──────────────────────────────────────────────────────────────────
   Edite este arquivo para atualizar endereço, horários e contatos
   em todo o site de uma só vez.
   ══════════════════════════════════════════════════════════════════ */

export const STORE_CONFIG = {
  name: 'Lacquavi Parfumerie',

  address: {
    street: 'Rua das Fragrâncias, 247',
    complement: 'Loja 12 — Galeria Premium',
    neighborhood: 'Savassi',
    city: 'Belo Horizonte',
    state: 'MG',
    zip: '30140-110',
    full: 'Rua das Fragrâncias, 247 — Loja 12, Savassi, BH',
  },

  hours: [
    { days: 'Segunda a Sexta', time: '10h às 20h' },
    { days: 'Sábado', time: '10h às 18h' },
    { days: 'Domingo e Feriados', time: 'Fechado' },
  ],

  contact: {
    phone: '+55 31 9 9999-0000',
    whatsapp: '5531999990000',
    email: 'contato@lacquavi.com.br',
    instagram: 'https://instagram.com/lacquavi',
  },

  mapEmbedUrl:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3750.9!2d-43.93!3d-19.93!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTnCsDU1JzU0LjciUyA0M8KwNTUnNDguMCJX!5e0!3m2!1spt-BR!2sbr!4v1000000000000',

  mapsUrl:
    'https://www.google.com/maps/dir/?api=1&destination=Rua+das+Fragrancias+247+Savassi+Belo+Horizonte+MG',

  visitPerk: {
    headline: 'Sua assinatura olfativa te espera',
    sub: 'Visite nossa loja e desfrute de uma consultoria exclusiva com nossos especialistas.',
    badge: 'Experiência Premium',
  },
} as const

export type StoreConfig = typeof STORE_CONFIG
