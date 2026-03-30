import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { STORES } from '../config/store'

/* ══════════════════════════════════════════════════════════════════
  NOSSA LOJA — /nossa-loja
   ══════════════════════════════════════════════════════════════════ */
function useReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-visible'); obs.unobserve(e.target) } }),
      { threshold: 0.08, rootMargin: '0px 0px -32px 0px' }
    )
    document.querySelectorAll('.sp-reveal').forEach(el => {
      if (!el.classList.contains('is-visible')) obs.observe(el)
    })
    return () => obs.disconnect()
  })
}

/* ── SVG Icons ─────────────────────────────────────────────────── */
const Icon = {
  MapPin: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Clock: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Phone: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.02 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
    </svg>
  ),
  Mail: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  Instagram: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  ),
  WhatsApp: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.556 4.118 1.528 5.845L.057 23.882a.5.5 0 00.611.611l6.037-1.471A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.937 0-3.745-.524-5.303-1.438l-.38-.22-3.935.958.958-3.935-.22-.38A9.956 9.956 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
    </svg>
  ),
  Arrow: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  Star: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  Shield: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  Gift: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
    </svg>
  ),
}

/* ── Experiências detalhadas ────────────────────────────────────── */
const EXPERIENCES_FULL = [
  {
    icon: '◈',
    title: 'Consultoria Olfativa Gratuita',
    desc: 'Nossa especialista mapeia seu perfil olfativo — notas que você ama, ocasiões, personalidade — e apresenta as fragrâncias ideais para você. Uma experiência única, sem compromisso.',
    tag: 'Sem compromisso',
  },
  {
    icon: '✦',
    title: 'Testagem Direta na Pele',
    desc: 'Perfume só revela sua verdadeira assinatura na sua pele. Na loja, você testa com calma, sente a evolução das notas e decide com total segurança.',
    tag: 'Experiência sensorial',
  },
  {
    icon: '◎',
    title: 'Embalagem para Presente',
    desc: 'Presenteie com caixas exclusivas Lacquavi, lacinho dourado e cartão personalizado. Ideal para aniversários, Natal, Dia das Mães e ocasiões especiais.',
    tag: 'Disponível na loja',
  },
  {
    icon: '◇',
    title: 'Retirada com Rapidez',
    desc: 'Comprou online? Retire na loja sem fila. Pedido pronto hoje mesmo! Economize o frete e passe uma experiência completa.',
    tag: 'Compra online · Retirada rápida',
  },
]

/* ══════════════════════════════════════════════════════════════════
   PAGE COMPONENT
   ══════════════════════════════════════════════════════════════════ */
export function StorePage() {
  useReveal()
  const [activeId, setActiveId] = useState(STORES[0].id)
  const s = STORES.find(store => store.id === activeId)!
  const day = new Date().getDay()
  // Mon–Sat (1–6)
  const todayIsOpen = day >= 1 && day <= 6

  return (
    <div className="min-h-screen bg-[#F5F5F5]">

      {/* ══ 1. CABEÇALHO DA PÁGINA ═════════════════════════════════ */}
      <div className="bg-white border-b border-gray-100">
        <div className="container-page py-10">
          <nav className="flex items-center gap-2 text-xs text-gray-400 mb-5">
            <Link to="/" className="hover:text-[#000000] transition-colors">Início</Link>
            <span>›</span>
            <span className="text-[#000000] font-medium">Nossa Loja</span>
          </nav>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-[#2a7e51] uppercase tracking-widest mb-2">Experiência Presencial</p>
              <h1 className="text-4xl md:text-5xl font-black text-[#000000] font-display leading-tight">
                Nossas Lojas
              </h1>
              <p className="mt-3 text-gray-500 max-w-lg leading-relaxed text-sm sm:text-base">
                Visite-nos, teste fragrâncias na pele e receba consultoria olfativa gratuita com nossas especialistas.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${todayIsOpen ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-xs text-gray-500 font-medium">{todayIsOpen ? 'Aberto hoje' : 'Fechado hoje'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ══ 2. TRUST BAR ══════════════════════════════════════════ */}
      <div className="bg-white border-b border-gray-100">
        <div className="container-page">
          <div className="flex flex-wrap items-center justify-center sm:justify-between gap-4 sm:gap-0 py-4">
            {[
              { icon: <Icon.Shield />, text: 'Loja registrada e verificada' },
              { icon: '★', text: '4.9 no Google Reviews' },
              { icon: <Icon.Gift />, text: 'Embalagem presente gratuita' },
              { icon: '✦', text: '100% originais, NF-e em toda compra' },
            ].map((t, i) => (
              <div key={i} className="flex items-center gap-2 text-gray-500">
                <span className="text-[#000000] text-sm flex-shrink-0">{typeof t.icon === 'string' ? t.icon : t.icon}</span>
                <span className="text-[0.72rem] font-medium">{t.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ 3. SELETOR DE LOJA + MAPA + CONTATO ══════════════════ */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="container-page">

          <div className="sp-reveal text-center mb-8">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Localização</p>
            <h2 className="font-display font-black text-[#000000] leading-tight"
              style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)' }}>
              Encontre nossa loja
            </h2>
          </div>

          {/* Store selector tabs */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex bg-gray-100 border border-gray-200 p-1 rounded-xl gap-1">
              {STORES.map(store => (
                <button
                  key={store.id}
                  onClick={() => setActiveId(store.id)}
                  className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all focus:outline-none ${
                    activeId === store.id
                      ? 'bg-[#2a7e51] text-white shadow-md'
                      : 'text-gray-500 hover:text-[#000000] hover:bg-white'
                  }`}
                >
                  {store.locationName}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto items-stretch">

            {/* Info column */}
            <div className="flex flex-col gap-4">

              {/* Status + nome */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-[#2a7e51]" />
                <div className="flex items-center gap-2.5 mt-2 mb-3">
                  <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase tracking-widest font-black flex items-center gap-1.5 ${todayIsOpen ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    <span className={`w-2 h-2 rounded-full ${todayIsOpen ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                    {todayIsOpen ? 'Aberto Hoje' : 'Fechado Hoje'}
                  </span>
                  <span className="bg-[#2a7e51]/10 text-[#2a7e51] px-2.5 py-1 rounded-md text-[10px] uppercase font-black tracking-widest">
                    ★ Retire Aqui em 1h
                  </span>
                </div>
                <h3 className="text-2xl font-black font-display text-[#000000]">{s.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{s.city}, {s.state}</p>
              </div>

              {/* Endereço */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex gap-4">
                <span className="text-[#000000] pt-0.5 flex-shrink-0"><Icon.MapPin /></span>
                <div>
                  <p className="text-[0.65rem] text-gray-500 uppercase tracking-wider mb-1 font-bold">Endereço</p>
                  <p className="font-bold text-[#000000] leading-tight">{s.street}</p>
                  <p className="text-sm text-gray-700">{s.complement}</p>
                  <p className="text-sm text-gray-500">{s.city}, {s.state} — CEP {s.zip}</p>
                </div>
              </div>

              {/* Horários */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex gap-4">
                <span className="text-[#000000] pt-0.5 flex-shrink-0"><Icon.Clock /></span>
                <div className="flex-1">
                  <p className="text-[0.65rem] text-gray-500 uppercase tracking-wider mb-2 font-bold">Horário de Funcionamento</p>
                  {s.hours.map(h => (
                    <div key={h.days} className="flex justify-between gap-4 text-sm border-b border-gray-50 pb-1.5 last:border-0 last:pb-0 mb-1.5">
                      <span className="text-gray-500">{h.days}</span>
                      <span className={`font-bold ${h.time === 'Fechado' ? 'text-gray-400' : 'text-[#000000]'}`}>{h.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contato */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <p className="text-[0.65rem] text-gray-500 uppercase tracking-wider mb-3 font-bold">Contato</p>
                <div className="space-y-2">
                  <a href={`https://wa.me/${s.whatsapp}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all group">
                    <span className="text-[#000000] w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0"><Icon.WhatsApp /></span>
                    <div>
                      <p className="text-[0.6rem] text-gray-400 uppercase tracking-wider">WhatsApp</p>
                      <p className="text-sm font-medium text-[#000000]">{s.phone}</p>
                    </div>
                    <span className="ml-auto text-gray-400 group-hover:text-[#000000] group-hover:translate-x-0.5 transition-all"><Icon.Arrow /></span>
                  </a>
                  <a href={`mailto:${s.email}`}
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all group">
                    <span className="text-[#000000] w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0"><Icon.Mail /></span>
                    <div>
                      <p className="text-[0.6rem] text-gray-400 uppercase tracking-wider">E-mail</p>
                      <p className="text-sm font-medium text-[#000000]">{s.email}</p>
                    </div>
                    <span className="ml-auto text-gray-400 group-hover:text-[#000000] group-hover:translate-x-0.5 transition-all"><Icon.Arrow /></span>
                  </a>
                  <a href={s.instagram} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all group">
                    <span className="text-[#000000] w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0"><Icon.Instagram /></span>
                    <div>
                      <p className="text-[0.6rem] text-gray-400 uppercase tracking-wider">Instagram</p>
                      <p className="text-sm font-medium text-[#000000]">@lacquavi</p>
                    </div>
                    <span className="ml-auto text-gray-400 group-hover:text-[#000000] group-hover:translate-x-0.5 transition-all"><Icon.Arrow /></span>
                  </a>
                </div>
              </div>

              {/* Botões de ação */}
              <div className="flex gap-3">
                <a href={s.mapsUrl} target="_blank" rel="noopener noreferrer"
                  className="flex-1 bg-[#2a7e51] text-white py-4 rounded-xl font-bold text-sm text-center hover:bg-[#236843] transition-colors shadow-lg shadow-[#2a7e51]/20 flex items-center justify-center gap-2">
                  <Icon.MapPin /> Como Chegar
                </a>
                <a href={`https://wa.me/${s.whatsapp}?text=Olá!%20Gostaria%20de%20visitar%20a%20${encodeURIComponent(s.name)}.`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex-1 border border-gray-200 bg-white text-[#000000] py-4 rounded-xl font-bold text-sm text-center hover:bg-gray-50 hover:border-gray-300 transition-colors flex items-center justify-center gap-2">
                  <Icon.WhatsApp /> WhatsApp
                </a>
              </div>
            </div>

            {/* Mapa */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative group"
              style={{ minHeight: 480 }}>
              {/* Click para abrir no Google Maps */}
              <a href={s.mapsUrl} target="_blank" rel="noopener noreferrer"
                className="absolute inset-0 z-20" aria-label="Abrir no Google Maps" />

              <iframe
                key={s.id}
                title={`Mapa — ${s.name}`}
                src={s.mapEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0, position: 'absolute', inset: 0, filter: 'grayscale(0.6) contrast(1.05)', pointerEvents: 'none' }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />

              {/* Pin rosa */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-10 pointer-events-none drop-shadow-xl mt-[-15px]">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="#2a7e51" stroke="white" strokeWidth="1">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
              </div>

              {/* Hover CTA */}
              <div className="absolute inset-x-0 bottom-0 z-10 pointer-events-none bg-gradient-to-t from-black/40 to-transparent flex items-end justify-center pb-8 pt-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="bg-[#2a7e51] text-white px-6 py-3 rounded-full font-bold shadow-2xl flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <Icon.MapPin /> Abrir no Google Maps
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ 4. EXPERIÊNCIAS ════════════════════════════════════════ */}
      <section className="py-12 sm:py-16 bg-[#F5F5F5]">
        <div className="container-page">

          <div className="sp-reveal text-center mb-12 sm:mb-16">
            <p className="font-bold text-gray-500 text-sm uppercase tracking-widest mb-3">Só na Loja</p>
            <h2
              className="font-display font-black text-[#000000] leading-tight mb-4"
              style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)' }}
            >
              Experiências que o<br />
              <span className="italic text-[#000000]">
                digital não oferece.
              </span>
            </h2>
            <p className="text-gray-500 max-w-md mx-auto leading-relaxed text-sm">
              A nossa loja foi pensada para transformar a escolha de uma fragrância em uma memória afetiva.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {EXPERIENCES_FULL.map((exp, i) => (
              <div
                key={exp.title}
                className="sp-reveal group rounded-2xl p-7 sm:p-8 bg-white border border-gray-200 shadow-sm relative
                  hover:-translate-y-1 hover:border-gray-300 hover:shadow-md
                  transition-all duration-300"
                style={{
                  transitionDelay: `${i * 80}ms`,
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className="w-10 h-10 rounded-full flex items-center justify-center text-base flex-shrink-0 bg-gray-50 text-[#000000]"
                  >
                    {exp.icon}
                  </span>
                  <span
                    className="text-[0.6rem] uppercase tracking-[0.18em] font-medium px-2.5 py-0.5 rounded-full bg-gray-50 text-[#000000]"
                  >
                    {exp.tag}
                  </span>
                </div>
                <h3 className="font-display text-xl text-[#000000] font-bold mb-2 leading-snug">{exp.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed transition-colors">{exp.desc}</p>

                {/* Badge Rosa de Conversão para Retirada */}
                {exp.title === 'Retirada com Rapidez' && (
                  <div className="absolute top-4 right-4 w-14 h-14 bg-[#2a7e51] rounded-full flex flex-col items-center justify-center text-white z-10 shadow-sm">
                    <span className="text-[7.5px] font-bold text-center leading-[1.2]">ECONOMIZE<br />NO FRETE</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 5. BENEFÍCIO DE VISITA — CTA FINAL ════════════════════ */}
      <section className="bg-white py-12 sm:py-16">
        <div className="container-page">
          <div className="sp-reveal text-center max-w-xl mx-auto">
            <p className="text-xs font-bold text-[#2a7e51] uppercase tracking-widest mb-3">Visite-nos</p>
            <h2 className="font-display font-black text-[#000000] leading-tight mb-4"
              style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)' }}>
              Sua assinatura olfativa te espera
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
              Venha descobrir fragrâncias com a orientação das nossas especialistas. Experiência gratuita, sem compromisso.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href={s.mapsUrl} target="_blank" rel="noopener noreferrer"
                className="bg-[#2a7e51] text-white px-8 py-3.5 rounded-lg font-bold hover:bg-[#236843] transition-colors inline-flex items-center justify-center gap-2 shadow-lg shadow-[#2a7e51]/20">
                <Icon.MapPin /> Visitar a Loja
              </a>
              <a href={`https://wa.me/${s.whatsapp}?text=Olá!%20Vi%20o%20benefício%20de%20visita%20no%20site%20e%20gostaria%20de%20saber%20mais.`}
                target="_blank" rel="noopener noreferrer"
                className="border border-gray-200 bg-white text-[#000000] px-8 py-3.5 rounded-lg font-bold hover:bg-gray-50 hover:border-gray-300 transition-colors inline-flex items-center justify-center gap-2">
                <Icon.WhatsApp /> Falar pelo WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ══ SEO LOCAL — structured data ═══════════════════════════ */}
      {/* JSON-LD injetado no head via script tag — LocalBusiness Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Store',
            name: s.name,
            image: 'https://lacquavi.com.br/og-store.jpg',
            url: 'https://lacquavi.com.br/nossa-loja',
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
              { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '10:00', closes: '20:00' },
              { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Saturday'], opens: '10:00', closes: '18:00' },
            ],
            priceRange: '$$',
            description: `Loja física ${s.name} em ${s.city}. Fragrâncias 100% originais, consultoria olfativa gratuita e embalagem para presente.`,
          }),
        }}
      />
    </div >
  )
}
