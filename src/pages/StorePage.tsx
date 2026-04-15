import { useState } from 'react'
import { Link } from 'react-router-dom'
import { STORES } from '../config/store'

const escapeForJsonLd = (data: unknown): string =>
  JSON.stringify(data)
    .replace(/<\/script>/gi, '<\\/script>')
    .replace(/<!--/g, '<\\!--')

const Icon = {
  MapPin: ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Clock: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Phone: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.02 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
    </svg>
  ),
  Mail: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  Instagram: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  ),
  WhatsApp: ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.556 4.118 1.528 5.845L.057 23.882a.5.5 0 00.611.611l6.037-1.471A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.937 0-3.745-.524-5.303-1.438l-.38-.22-3.935.958.958-3.935-.22-.38A9.956 9.956 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
    </svg>
  ),
  Arrow: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  ),
}

const EXPERIENCES = [
  { icon: '◈', title: 'Consultoria Olfativa', desc: 'Gratuita, sem compromisso' },
  { icon: '✦', title: 'Testagem na Pele', desc: 'Sinta a evolução das notas' },
  { icon: '◎', title: 'Embalagem Presente', desc: 'Caixa, lacinho e cartão' },
  { icon: '◇', title: 'Retirada em 1h', desc: 'Comprou online? Retire aqui' },
]

export function StorePage() {
  const [activeId, setActiveId] = useState(STORES[0].id)
  const s = STORES.find(store => store.id === activeId)!
  const day = new Date().getDay()
  const todayIsOpen = day >= 1 && day <= 6

  return (
    <div className="min-h-screen bg-[#F5F5F5]">

      {/* ── Cabeçalho compacto ─────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100">
        <div className="container-page py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">

            <div className="flex items-center gap-3">
              <nav className="flex items-center gap-1.5 text-xs text-gray-400">
                <Link to="/" className="hover:text-[#000000] transition-colors">Início</Link>
                <span>›</span>
                <span className="text-[#000000] font-semibold">Nossas Lojas</span>
              </nav>
              <span className="text-gray-200 hidden sm:inline">|</span>
              <h1 className="hidden sm:block text-sm font-black text-[#000000] font-display">
                Nossas Lojas
              </h1>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Seletor */}
              <div className="flex bg-gray-100 border border-gray-200 p-0.5 rounded-lg gap-0.5">
                {STORES.map(store => (
                  <button
                    key={store.id}
                    onClick={() => setActiveId(store.id)}
                    className={`px-4 py-1.5 rounded-md font-bold text-xs transition-all focus:outline-none whitespace-nowrap ${
                      activeId === store.id
                        ? 'bg-[#2a7e51] text-white shadow-sm'
                        : 'text-gray-500 hover:text-[#000000] hover:bg-white'
                    }`}
                  >
                    {store.locationName}
                  </button>
                ))}
              </div>

              {/* Status */}
              <span className={`flex items-center gap-1.5 text-xs font-semibold ${todayIsOpen ? 'text-green-700' : 'text-gray-500'}`}>
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${todayIsOpen ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                {todayIsOpen ? 'Aberto hoje' : 'Fechado hoje'}
              </span>
            </div>

          </div>
        </div>
      </div>

      {/* ── Conteúdo principal ─────────────────────────────────── */}
      <div className="container-page py-5">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4" style={{ height: 'clamp(420px, 62vh, 580px)' }}>

          {/* Painel info — 2/5 */}
          <div className="lg:col-span-2 flex flex-col justify-between bg-white rounded-xl border border-gray-100 shadow-sm p-5 h-full">

            <div>
              {/* Nome + localidade */}
              <div className="mb-4 pb-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[0.6rem] font-bold text-gray-400 uppercase tracking-widest">
                    {s.city}, {s.state}
                  </p>
                  <span className="bg-[#2a7e51]/10 text-[#2a7e51] px-2 py-0.5 rounded text-[0.6rem] uppercase font-black tracking-widest">
                    ★ Retire em 1h
                  </span>
                </div>
                <h2 className="text-2xl font-black font-display text-[#000000] leading-tight">{s.name}</h2>
              </div>

              {/* Endereço */}
              <div className="flex gap-2.5 mb-4">
                <span className="text-gray-400 mt-0.5 flex-shrink-0"><Icon.MapPin /></span>
                <div>
                  <p className="text-sm font-semibold text-[#000000] leading-snug">{s.street}</p>
                  <p className="text-xs text-gray-500">{s.complement}</p>
                  <p className="text-xs text-gray-400">{s.city}, {s.state} — CEP {s.zip}</p>
                </div>
              </div>

              {/* Horários */}
              <div className="flex gap-2.5 mb-4">
                <span className="text-gray-400 mt-0.5 flex-shrink-0"><Icon.Clock /></span>
                <div className="space-y-1.5 w-full">
                  {s.hours.map(h => (
                    <div key={h.days} className="flex items-baseline justify-between gap-2 text-xs">
                      <span className="text-gray-500">{h.days}</span>
                      <span className={`font-bold flex-shrink-0 ${h.time === 'Fechado' ? 'text-gray-400' : 'text-[#000000]'}`}>{h.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contatos */}
              <div className="flex gap-2.5">
                <span className="text-gray-400 mt-0.5 flex-shrink-0"><Icon.Phone /></span>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`https://wa.me/${s.whatsapp}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-[#000000] transition-colors"
                  >
                    <Icon.WhatsApp size={13} /> {s.phone}
                  </a>
                  <span className="text-gray-200">·</span>
                  <a
                    href={`mailto:${s.email}`}
                    className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-[#000000] transition-colors"
                  >
                    <Icon.Mail /> {s.email}
                  </a>
                  <span className="text-gray-200">·</span>
                  <a
                    href={s.instagram}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-[#000000] transition-colors"
                  >
                    <Icon.Instagram /> @lacquavi
                  </a>
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="mt-4 space-y-2">
              <div className="flex gap-2">
                <a
                  href={s.mapsUrl}
                  target="_blank" rel="noopener noreferrer"
                  className="flex-1 bg-[#2a7e51] text-white py-2.5 rounded-lg font-bold text-xs text-center hover:bg-[#236843] transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-[#2a7e51]/20"
                >
                  <Icon.MapPin /> Como Chegar
                </a>
                <a
                  href={`https://wa.me/${s.whatsapp}?text=Olá!%20Gostaria%20de%20visitar%20a%20${encodeURIComponent(s.name)}.`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex-1 border border-gray-200 bg-white text-[#000000] py-2.5 rounded-lg font-bold text-xs text-center hover:bg-gray-50 hover:border-gray-300 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Icon.WhatsApp /> WhatsApp
                </a>
              </div>
            </div>
          </div>

          {/* Mapa — 3/5 */}
          <div className="lg:col-span-3 rounded-xl overflow-hidden relative group h-full bg-gray-100 border border-gray-100 shadow-sm">
            <a
              href={s.mapsUrl}
              target="_blank" rel="noopener noreferrer"
              className="absolute inset-0 z-20"
              aria-label="Abrir no Google Maps"
            />

            <iframe
              key={s.id}
              title={`Mapa — ${s.name}`}
              src={s.mapEmbedUrl}
              width="100%"
              height="100%"
              style={{ border: 0, position: 'absolute', inset: 0, filter: 'grayscale(0.4) contrast(1.05)', pointerEvents: 'none' }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-10 pointer-events-none drop-shadow-xl" style={{ marginTop: '-12px' }}>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="#2a7e51" stroke="white" strokeWidth="1">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
            </div>

            <div className="absolute inset-x-0 bottom-0 z-10 pointer-events-none bg-gradient-to-t from-black/35 to-transparent flex items-end justify-center pb-5 pt-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="bg-[#2a7e51] text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-xl flex items-center gap-2 translate-y-3 group-hover:translate-y-0 transition-transform duration-300">
                <Icon.MapPin /> Abrir no Google Maps
              </span>
            </div>
          </div>

        </div>

        {/* ── Barra de features rápidas ────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {EXPERIENCES.map(exp => (
            <div
              key={exp.title}
              className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3"
            >
              <span className="text-lg flex-shrink-0 text-[#000000]">{exp.icon}</span>
              <div>
                <p className="text-xs font-bold text-[#000000] leading-tight">{exp.title}</p>
                <p className="text-[0.65rem] text-gray-400 leading-tight">{exp.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Benefícios da loja presencial ──────────────────────────── */}
      <section className="bg-white border-t border-gray-100">
        <div className="container-page py-12">

          <div className="text-center mb-10">
            <p className="text-[0.6rem] font-bold text-[#2a7e51] uppercase tracking-widest mb-2">Por que visitar</p>
            <h3 className="text-2xl font-black font-display text-[#000000] leading-tight">
              O que a tela não consegue entregar
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto mb-10">
            {[
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                  </svg>
                ),
                title: 'Sinta antes de comprar',
                desc: 'Perfume só revela sua assinatura na sua pele. Teste com calma e saia com certeza.',
              },
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="4" /><path d="M6 20v-2a6 6 0 0112 0v2" />
                  </svg>
                ),
                title: 'Consultoria gratuita',
                desc: 'Uma especialista mapeia seu perfil olfativo e indica as fragrâncias certas para você.',
              },
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                ),
                title: 'Retire em 1 hora',
                desc: 'Comprou online? Retire aqui, economize o frete e ainda aproveite a experiência da loja.',
              },
            ].map(b => (
              <div key={b.title} className="flex flex-col items-center text-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#2a7e51]/10 flex items-center justify-center text-[#2a7e51] flex-shrink-0">
                  {b.icon}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#000000] mb-1">{b.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <a
              href={s.mapsUrl}
              target="_blank" rel="noopener noreferrer"
              className="bg-[#2a7e51] text-white px-8 py-3 rounded-lg font-bold text-sm hover:bg-[#236843] transition-colors inline-flex items-center gap-2 shadow-md shadow-[#2a7e51]/20"
            >
              <Icon.MapPin size={16} /> Visitar a Loja
            </a>
          </div>

        </div>
      </section>

      {/* SEO — LocalBusiness Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: escapeForJsonLd({
            '@context': 'https://schema.org',
            '@type': 'Store',
            name: s.name,
            image: 'https://lacquavi.com.br/og-store.jpg',
            url: 'https://lacquavi.com.br/nossas-lojas',
            telephone: s.phone,
            email: s.email,
            address: {
              '@type': 'PostalAddress',
              streetAddress: `${s.street}, ${s.complement}`,
              addressLocality: s.city,
              addressRegion: s.state,
              postalCode: s.zip,
              addressCountry: 'BR',
            },
            openingHoursSpecification: [
              { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], opens: '10:00', closes: '22:00' },
              { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Sunday'], opens: '14:00', closes: '20:00' },
            ],
            priceRange: '$$',
            description: `Loja física ${s.name} em ${s.city}. Fragrâncias 100% originais, consultoria olfativa gratuita e embalagem para presente.`,
          }),
        }}
      />
    </div>
  )
}
