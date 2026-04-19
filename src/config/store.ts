/* ══════════════════════════════════════════════════════════════════
   LACQUAVI — Dados das Lojas Físicas
   Edite aqui para atualizar endereço, horários e contatos em todo
   o site de uma só vez (StorePage + StoreTeaser).
   ══════════════════════════════════════════════════════════════════ */

export interface StoreHours {
  days: string
  time: string
}

export interface Store {
  id: string
  name: string
  locationName: string
  street: string
  complement: string
  city: string
  state: string
  zip: string
  hours: StoreHours[]
  phone: string
  whatsapp: string
  email: string
  instagram: string
  mapsUrl: string
  mapEmbedUrl: string
}

export const STORES: Store[] = [
  {
    id: 'bh',
    name: "L'acqua di Fiori",
    locationName: 'Minas Shopping',
    street: 'Minas Shopping',
    complement: 'Piso 1, Loja 610',
    city: 'Belo Horizonte',
    state: 'MG',
    zip: '31160-551',
    hours: [
      { days: 'Segunda a Sexta', time: '8h às 22h' },
      { days: 'Sábado', time: '9h às 14h' },
      { days: 'Domingos e Feriados', time: 'Fechado' },
    ],
    phone: '+55 31 9 9999-0000',
    whatsapp: '5531999990000',
    email: 'contato@lacquavi.com.br',
    instagram: 'https://instagram.com/lacqua.minas',
    mapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=Minas+Shopping+Belo+Horizonte',
    mapEmbedUrl:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3751.487053073747!2d-43.93121512409025!3d-19.882677181512876!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xa6903f7a6f3b7d%3A0xdfeb9cc7bf7dfb9c!2sMinas%20Shopping!5e0!3m2!1spt-BR!2sbr!4v1710900000000',
  },
  {
    id: 'lagoa-santa',
    name: 'Lacquavi Lagoa Santa',
    locationName: 'Open Mall — Lagoa Santa',
    street: 'Open Mall',
    complement: 'Loja 05 — Centro',
    city: 'Lagoa Santa',
    state: 'MG',
    zip: '33400-000',
    hours: [
      { days: 'Segunda a Sexta', time: '8h às 22h' },
      { days: 'Sábado', time: '9h às 14h' },
      { days: 'Domingos e Feriados', time: 'Fechado' },
    ],
    phone: '+55 31 9 9999-0000',
    whatsapp: '5531999990000',
    email: 'contato@lacquavi.com.br',
    instagram: 'https://instagram.com/lacqua.minas',
    mapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=Open+Mall+Lagoa+Santa',
    mapEmbedUrl:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3756.8837265561085!2d-43.90177722409549!3d-19.63102418169002!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xa67dd88421869f%3A0x6a2ec68bd5f874bc!2sOpen%20Mall%20Lagoa%20Santa!5e0!3m2!1spt-BR!2sbr!4v1710900000000',
  },
]
