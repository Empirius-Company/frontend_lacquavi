import { useState } from 'react'
import { Link } from 'react-router-dom'

/* ── Ícones SVG ───────────────── */
function IconMapPin() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  )
}
function IconClock() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  )
}
function IconArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

const STORES = [
  {
    id: 'lagoa-santa',
    name: 'Lacquavi Lagoa Santa',
    locationName: 'Lagoa Santa',
    street: 'Open Mall',
    complement: 'Loja 05 — Centro',
    city: 'Lagoa Santa',
    state: 'MG',
    zip: '33400-000',
    hours: [
      { days: 'Segunda a Sábado', time: '09h às 21h' },
      { days: 'Domingos e Feriados', time: '10h às 16h' },
    ],
    whatsapp: '5531999990000',
    mapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=Open+Mall+Lagoa+Santa',
    mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3756.8837265561085!2d-43.90177722409549!3d-19.63102418169002!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xa67dd88421869f%3A0x6a2ec68bd5f874bc!2sOpen%20Mall%20Lagoa%20Santa!5e0!3m2!1spt-BR!2sbr!4v1710900000000'
  },
  {
    id: 'bh',
    name: "L'acqua di Fiori",
    locationName: 'Belo Horizonte',
    street: 'Minas Shopping',
    complement: 'Piso 2, Loja 110 — São Paulo',
    city: 'Belo Horizonte',
    state: 'MG',
    zip: '31160-551',
    hours: [
      { days: 'Segunda a Sábado', time: '10h às 22h' },
      { days: 'Domingos e Feriados', time: '14h às 20h' },
    ],
    whatsapp: '5531999990000',
    mapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=Minas+Shopping+Belo+Horizonte',
    mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3751.487053073747!2d-43.93121512409025!3d-19.882677181512876!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xa6903f7a6f3b7d%3A0xdfeb9cc7bf7dfb9c!2sMinas%20Shopping!5e0!3m2!1spt-BR!2sbr!4v1710900000000'
  }
];

export function StoreTeaser() {
  const [activeStoreId, setActiveStoreId] = useState<'lagoa-santa' | 'bh'>('lagoa-santa');
  const s = STORES.find(store => store.id === activeStoreId)!;

  const todayIsOpen = new Date().getDay() >= 1 && new Date().getDay() <= 5;

  return (
    <section className="bg-[#F5F5F5] py-16 sm:py-24">
      <div className="container-page">
        {/* Header and Toggle */}
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-3xl md:text-5xl font-black text-[#333] mb-4 font-display">
            Nossas <span className="text-[#000000]">Lojas Físicas</span>
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-lg leading-relaxed mb-8">
            Selecione a loja da sua região para ver o endereço, mapa e retirar seus pedidos hoje mesmo!
          </p>

          {/* Selector UI */}
          <div className="inline-flex bg-white border border-gray-200 shadow-sm p-1.5 rounded-xl max-w-full overflow-x-auto gap-2">
            {STORES.map((store) => (
              <button
                key={store.id}
                onClick={() => setActiveStoreId(store.id as any)}
                className={`flex-1 min-w-[160px] whitespace-nowrap px-6 py-3 rounded-lg font-bold text-sm transition-all focus:outline-none ${activeStoreId === store.id
                  ? 'bg-[#e6226e] text-white shadow-md'
                  : 'text-gray-500 hover:text-[#000000] hover:bg-gray-50'
                  }`}
              >
                {store.locationName}
              </button>
            ))}
          </div>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch max-w-5xl mx-auto">

          {/* Info Side */}
          <div className="flex flex-col gap-4">

            {/* Title / Status */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-[#000000]"></div>

              <div className="flex items-center gap-2.5 mb-4 mt-2">
                <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase tracking-widest font-black flex items-center gap-1.5 ${todayIsOpen ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  <span className={`w-2 h-2 rounded-full ${todayIsOpen ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                  {todayIsOpen ? 'Aberto Hoje' : 'Fechado Hoje'}
                </span>
                <span className="bg-[#e6226e]/10 text-[#e6226e] px-2.5 py-1 rounded-md text-[10px] uppercase font-black tracking-widest">
                  ★ Retire Aqui em 1h
                </span>
              </div>
              <h3 className="text-3xl font-black font-display text-[#000000]">{s.name}</h3>
            </div>

            {/* Address */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 flex gap-5">
              <div className="text-[#000000] pt-1 flex-shrink-0"><IconMapPin /></div>
              <div>
                <h4 className="font-bold text-[#000000] mb-2 text-sm uppercase tracking-wider">Localização</h4>
                <p className="text-base font-bold text-[#000000] leading-none mb-1">
                  {s.street}
                </p>
                <p className="text-sm text-gray-700 font-medium mb-1">
                  {s.complement}
                </p>
                <p className="text-sm text-gray-500 mb-2">
                  {s.city}, {s.state}
                </p>
              </div>
            </div>

            {/* Hours */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 flex gap-5">
              <div className="text-[#000000] pt-1 flex-shrink-0"><IconClock /></div>
              <div className="flex-1 w-full">
                <h4 className="font-bold text-[#000000] mb-3 text-sm uppercase tracking-wider">Horário de Funcionamento</h4>
                <div className="space-y-2 w-full">
                  {s.hours.map((h, i) => (
                    <div key={i} className="text-sm flex flex-col sm:flex-row sm:justify-between w-full border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                      <span className="text-gray-500 mb-1 sm:mb-0">{h.days}</span>
                      <span className="font-bold text-[#000000]">{h.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 mt-2">
              <a href={s.mapsUrl} target="_blank" rel="noopener noreferrer" className="flex-1 bg-[#e6226e] text-white text-center py-4 rounded-xl font-bold text-sm hover:bg-[#cc1d60] transition-colors shadow-lg shadow-[#e6226e]/20 flex items-center justify-center gap-2">
                <IconMapPin /> Como Chegar
              </a>
              <a href={`https://wa.me/${s.whatsapp}?text=Olá!%20Gostaria%20de%20visitar%20a%20${s.name}.`} target="_blank" rel="noopener noreferrer" className="flex-1 border border-gray-200 bg-white text-[#000000] text-center py-4 rounded-xl font-bold text-sm hover:border-gray-300 hover:bg-gray-50 transition-colors shadow-sm">
                WhatsApp
              </a>
            </div>

          </div>

          {/* Map Side */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px] h-full relative group" style={{ minHeight: '400px' }}>
            {/* Click interceptor to open full Maps */}
            <a href={s.mapsUrl} target="_blank" rel="noopener noreferrer" className="absolute inset-0 z-20" aria-label="Abrir no Google Maps"></a>

            <iframe
              title={`Mapa — ${s.name}`}
              src={s.mapEmbedUrl}
              width="100%"
              height="100%"
              style={{ border: 0, position: 'absolute', inset: 0, filter: 'grayscale(1) contrast(1.1) opacity(0.9)', pointerEvents: 'none' }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />

            {/* Custom Pink Pin Overlay */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-10 pointer-events-none drop-shadow-xl mt-[-15px]">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="#e6226e" stroke="white" strokeWidth="1" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
            </div>

            {/* Hover Action Indicator */}
            <div className="absolute inset-x-0 bottom-0 top-auto z-10 pointer-events-none bg-gradient-to-t from-[#000000]/40 to-transparent flex items-end justify-center pb-8 pt-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="bg-[#e6226e] text-white px-6 py-3 rounded-full font-bold shadow-2xl flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                <IconMapPin /> Abrir no Google Maps
              </span>
            </div>
          </div>

        </div>

        <div className="mt-12 text-center">
          <Link to="/nossa-loja" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-bold bg-transparent text-[#000000] hover:bg-white border border-gray-200 transition-colors">
            Ver a página completa da loja <IconArrow />
          </Link>
        </div>

      </div>
    </section>
  )
}
