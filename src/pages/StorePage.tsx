import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { STORE_CONFIG } from '../config/store'

/* ══════════════════════════════════════════════════════════════════
   NOSSA LOJA — Página Dedicada /nossa-loja
   ──────────────────────────────────────────────────────────────────
   Estrutura em funil de confiança:
   1. Hero editorial da loja
   2. Três pilares da experiência presencial
   3. Endereço + mapa + horários (SEO local)
   4. Experiências exclusivas
   5. Benefício de visita + CTA final
   ══════════════════════════════════════════════════════════════════ */

/* ── Micro scroll-reveal hook ──────────────────────────────────── */
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
  const s = STORE_CONFIG
  const [mapLoaded, setMapLoaded] = useState(false)
  const todayIsOpen = new Date().getDay() >= 1 && new Date().getDay() <= 5

  return (
    <div className="min-h-screen bg-[#FAF7F2]">

      {/* ══ 1. HERO ════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden bg-black"
        style={{
          minHeight: 'clamp(420px, 50vw, 580px)',
        }}
      >
        {/* Subtle concentric circles glow */}
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 'min(900px, 100vw)', height: 'min(500px, 80vh)',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 40%, transparent 70%)',
          }} />
        </div>

        {/* Content */}
        <div className="container-page relative z-10 flex flex-col justify-center"
          style={{ minHeight: 'clamp(420px, 50vw, 580px)', paddingTop: '5rem', paddingBottom: '5rem' }}>

          <div className="max-w-2xl">
            {/* Breadcrumb / eyebrow */}
            <div className="flex items-center gap-3 mb-6">
              <Link to="/" className="text-[0.6rem] text-gray-400 uppercase tracking-widest hover:text-white transition-colors">
                Início
              </Link>
              <span className="text-gray-600 text-xs">›</span>
              <span className="text-[0.6rem] text-gray-400 uppercase tracking-widest">Nossa Loja</span>
            </div>

            {/* Open indicator */}
            <div className="flex items-center gap-2.5 mb-7">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{
                  background: todayIsOpen ? '#5CBB7D' : '#666666',
                  boxShadow: todayIsOpen ? '0 0 0 3px rgba(92,187,125,0.2)' : 'none',
                  animation: todayIsOpen ? 'pulseDot 2s ease-in-out infinite' : 'none',
                }}
              />
              <span className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-gray-400">
                {todayIsOpen ? 'Aberto agora — Segunda a Sexta, 10h às 20h' : 'Fechado hoje — Retornamos segunda-feira'}
              </span>
            </div>

            <h1
              className="font-display font-light text-white leading-none mb-5"
              style={{ fontSize: 'clamp(2.4rem, 6vw, 5rem)', letterSpacing: '-0.03em' }}
            >
              Um espaço<br />
              <span className="italic text-white font-bold">
                criado para você.
              </span>
            </h1>

            <p className="text-gray-300 leading-relaxed max-w-lg mb-8 font-medium"
              style={{ fontSize: 'clamp(0.95rem, 1.5vw, 1.1rem)' }}>
              Na Lacquavi, cada visita é uma jornada sensorial. Teste fragrâncias, receba consultoria especializada e descubra o perfume que conta a sua história — antes de comprar.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={s.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#e6226e] text-white hover:bg-[#cc1d60] px-6 py-3 rounded-lg font-bold transition-colors inline-flex items-center justify-center gap-2 shadow-xl hover:shadow-[0_4px_16px_rgba(230,34,110,0.4)]"
              >
                <Icon.MapPin />
                Como Chegar
              </a>
              <a
                href={`https://wa.me/${s.contact.whatsapp}?text=Olá!%20Gostaria%20de%20visitar%20a%20loja%20Lacquavi.`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white inline-flex items-center justify-center gap-2 text-sm font-medium transition-colors"
              >
                <Icon.WhatsApp />
                Falar pelo WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section >

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
                <span className="text-[#000000] text-sm flex-shrink-0">
                  {typeof t.icon === 'string' ? t.icon : t.icon}
                </span>
                <span className="text-[0.72rem] font-medium">{t.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ 3. MAP + CONTACT ══════════════════════════════════════ */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="container-page">

          <div className="sp-reveal text-center mb-12">
            <p className="font-bold text-gray-500 text-sm uppercase tracking-widest mb-3">Localização</p>
            <h2 className="font-display font-black text-[#000000] leading-tight"
              style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)' }}>
              Encontre a gente
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 items-stretch">

            {/* Map */}
            <div
              className="sp-reveal lg:col-span-3 rounded-2xl overflow-hidden relative bg-gray-100"
              style={{ minHeight: 420 }}
            >
              {!mapLoaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gray-50">
                  <div className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[#000000]">
                    <Icon.MapPin />
                  </div>
                  <p className="text-sm text-gray-400">Carregando mapa…</p>
                </div>
              )}
              <iframe
                title={`Mapa — ${s.name}`}
                src={s.mapEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: 420, display: mapLoaded ? 'block' : 'none', filter: 'grayscale(1)' }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                onLoad={() => setMapLoaded(true)}
              />
            </div>

            {/* Contact info card */}
            <div
              className="sp-reveal lg:col-span-2 flex flex-col gap-4"
              style={{ transitionDelay: '120ms' }}
            >

              {/* Address block */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-7 shadow-sm">
                <h3 className="font-display font-bold text-lg text-[#000000] mb-5">Informações da Loja</h3>

                <address className="not-italic space-y-5">
                  {/* Address */}
                  <div className="flex gap-3.5">
                    <span className="text-[#000000] mt-0.5 flex-shrink-0"><Icon.MapPin /></span>
                    <div>
                      <p className="text-[0.65rem] text-gray-500 uppercase tracking-wider mb-1">Endereço</p>
                      <p className="text-sm text-[#000000] font-medium leading-relaxed">{s.address.street}</p>
                      <p className="text-sm text-[#000000]">{s.address.complement}</p>
                      <p className="text-sm text-gray-600">{s.address.neighborhood} — {s.address.city}, {s.address.state}</p>
                      <p className="text-xs text-gray-400 mt-0.5">CEP {s.address.zip}</p>
                    </div>
                  </div>

                  {/* Hours */}
                  <div className="flex gap-3.5">
                    <span className="text-[#000000] mt-0.5 flex-shrink-0"><Icon.Clock /></span>
                    <div>
                      <p className="text-[0.65rem] text-gray-500 uppercase tracking-wider mb-2">Horário de Funcionamento</p>
                      {s.hours.map(h => (
                        <div key={h.days} className="flex justify-between gap-6 mb-1">
                          <span className="text-xs text-gray-600">{h.days}</span>
                          <span className={`text-xs font-medium ${h.time === 'Fechado' ? 'text-gray-400' : 'text-[#000000]'}`}>
                            {h.time}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </address>
              </div>

              {/* Contact links */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-7 shadow-sm">
                <h3 className="font-display font-bold text-lg text-[#000000] mb-5">Contato</h3>
                <div className="space-y-3">
                  <a
                    href={`https://wa.me/${s.contact.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all group"
                  >
                    <span className="text-[#000000] w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Icon.WhatsApp />
                    </span>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">WhatsApp</p>
                      <p className="text-sm font-medium text-[#000000]">{s.contact.phone}</p>
                    </div>
                    <span className="ml-auto text-gray-400 group-hover:text-[#000000] group-hover:translate-x-0.5 transition-all">
                      <Icon.Arrow />
                    </span>
                  </a>

                  <a
                    href={`mailto:${s.contact.email}`}
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all group"
                  >
                    <span className="text-[#000000] w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Icon.Mail />
                    </span>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">E-mail</p>
                      <p className="text-sm font-medium text-[#000000]">{s.contact.email}</p>
                    </div>
                    <span className="ml-auto text-gray-400 group-hover:text-[#000000] group-hover:translate-x-0.5 transition-all">
                      <Icon.Arrow />
                    </span>
                  </a>

                  <a
                    href={s.contact.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all group"
                  >
                    <span className="text-[#000000] w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Icon.Instagram />
                    </span>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Instagram</p>
                      <p className="text-sm font-medium text-[#000000]">@lacquavi</p>
                    </div>
                    <span className="ml-auto text-gray-400 group-hover:text-[#000000] group-hover:translate-x-0.5 transition-all">
                      <Icon.Arrow />
                    </span>
                  </a>
                </div>

                <a
                  href={s.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-2 border-[#0A0806] text-[#0A0806] hover:bg-[#0A0806] hover:text-white justify-center w-full px-6 py-3 rounded-lg font-bold transition-all inline-flex items-center gap-2 mt-5"
                >
                  <Icon.MapPin />
                  Como Chegar em Lagoa Santa
                </a>
              </div>
            </div>
          </div>
        </div>
      </section >

      {/* ══ 4. EXPERIÊNCIAS ════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 bg-white">
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
                  <div className="absolute top-4 right-4 w-14 h-14 bg-[#e6226e] rounded-full flex flex-col items-center justify-center text-white z-10 shadow-sm">
                    <span className="text-[7.5px] font-bold text-center leading-[1.2]">ECONOMIZE<br />NO FRETE</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 5. BENEFÍCIO DE VISITA — CTA FINAL ════════════════════ */}
      < section className="bg-[#FAF7F2] py-16 sm:py-24" >
        <div className="container-page">
          <div
            className="sp-reveal relative overflow-hidden rounded-3xl px-6 sm:px-14 py-12 sm:py-16"
            style={{ background: 'linear-gradient(145deg, #0D0B09 0%, #1A1510 50%, #0A0806 100%)' }}
          >
            {/* Glow */}
            <div aria-hidden className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse 60% 80% at 90% 50%, rgba(212,175,122,0.08) 0%, rgba(139,31,66,0.06) 40%, transparent 70%)' }}
            />
            {/* Gold top line */}
            <div aria-hidden className="absolute top-0 inset-x-0 h-px"
              style={{ background: 'linear-gradient(to right, transparent, rgba(212,175,122,0.45) 30%, rgba(212,175,122,0.7) 50%, rgba(212,175,122,0.45) 70%, transparent)' }}
            />
            {/* Decorative rings */}
            <div aria-hidden className="hidden sm:block absolute right-[-5%] top-1/2 -translate-y-1/2 w-80 h-80 rounded-full border border-white/[0.04]" />
            <div aria-hidden className="hidden sm:block absolute right-[12%] top-1/2 -translate-y-1/2 w-52 h-52 rounded-full border border-[rgba(212,175,122,0.07)]" />

            <div className="relative max-w-xl">
              <span
                className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full mb-5 text-[0.65rem] font-medium uppercase tracking-[0.18em] border"
                style={{
                  color: '#D4AF37',
                  background: 'rgba(212,175,122,0.1)',
                  borderColor: 'rgba(212,175,122,0.25)',
                }}
              >
                <Icon.Gift />
                {s.visitPerk.badge}
              </span>

              <h2
                className="font-display font-light text-white leading-tight mb-4"
                style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}
              >
                {s.visitPerk.headline}
              </h2>
              <p className="text-[#A89688] text-sm leading-relaxed mb-3 max-w-sm">
                {s.visitPerk.sub}
              </p>
              <p className="text-xs text-[rgba(168,150,136,0.45)] mb-8">
                Agendamentos sujeitos a disponibilidade. Válido apenas na loja modelo.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={s.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#e6226e] text-white hover:bg-[#cc1d60] px-6 py-3 rounded-lg font-bold transition-colors inline-flex items-center justify-center gap-2 shadow-xl hover:shadow-[0_4px_16px_rgba(230,34,110,0.4)]"
                >
                  <Icon.MapPin />
                  Visitar a Loja Agora
                </a>
                <a
                  href={`https://wa.me/${s.contact.whatsapp}?text=Olá!%20Vi%20o%20benefício%20de%20visita%20no%20site%20e%20gostaria%20de%20saber%20mais.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white inline-flex items-center justify-center gap-2 text-sm font-medium transition-colors"
                >
                  <Icon.WhatsApp />
                  Tirar Dúvidas
                </a>
              </div>
            </div>
          </div>
        </div >
      </section >

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
            telephone: s.contact.phone,
            email: s.contact.email,
            address: {
              '@type': 'PostalAddress',
              streetAddress: `${s.address.street}, ${s.address.complement}`,
              addressLocality: s.address.city,
              addressRegion: s.address.state,
              postalCode: s.address.zip,
              addressCountry: 'BR',
            },
            openingHoursSpecification: [
              { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '10:00', closes: '20:00' },
              { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Saturday'], opens: '10:00', closes: '18:00' },
            ],
            priceRange: '$$',
            description: 'Parfumerie premium em Belo Horizonte. Fragrâncias 100% originais, consultoria olfativa gratuita e embalagem para presente.',
          }),
        }}
      />
    </div >
  )
}
