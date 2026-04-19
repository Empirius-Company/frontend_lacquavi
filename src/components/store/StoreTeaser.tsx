import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { STORES } from '../../config/store'

function IconMapPin() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  )
}
function IconClock() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  )
}
function IconWhatsApp() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.556 4.118 1.528 5.845L.057 23.882a.5.5 0 00.611.611l6.037-1.471A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.937 0-3.745-.524-5.303-1.438l-.38-.22-3.935.958.958-3.935-.22-.38A9.956 9.956 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
    </svg>
  )
}
function IconArrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

export function StoreTeaser() {
  const [activeStoreId, setActiveStoreId] = useState(STORES[0].id)
  const s = STORES.find(store => store.id === activeStoreId)!
  const day = new Date().getDay()
  const todayIsOpen = day >= 1 && day <= 6

  const mapRef = useRef<HTMLDivElement>(null)
  const [mapVisible, setMapVisible] = useState(false)

  useEffect(() => {
    const el = mapRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setMapVisible(true); obs.disconnect() } },
      { rootMargin: '200px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <section className="bg-white py-10 border-t border-gray-100">
      <div className="container-page">

        {/* Header row: título + seletor + status */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <h2 className="text-lg font-black text-[#000000] font-display tracking-tight">
            Nossas Lojas Físicas
          </h2>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Seletor de loja */}
            <div className="flex bg-gray-100 border border-gray-200 p-0.5 rounded-lg gap-0.5">
              {STORES.map(store => (
                <button
                  key={store.id}
                  onClick={() => setActiveStoreId(store.id)}
                  className={`px-4 py-1.5 rounded-md font-bold text-xs transition-all focus:outline-none whitespace-nowrap ${
                    activeStoreId === store.id
                      ? 'bg-[#2a7e51] text-white shadow-sm'
                      : 'text-gray-700 hover:text-[#000000] hover:bg-white'
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

        {/* Layout principal */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4" style={{ height: 'clamp(340px, 52vh, 480px)' }}>

          {/* Painel de info — 2/5 */}
          <div className="lg:col-span-2 flex flex-col justify-between bg-[#F5F5F5] rounded-xl p-5 h-full">

            {/* Nome da loja */}
            <div>
              <p className="text-[0.6rem] font-bold text-gray-600 uppercase tracking-widest mb-0.5">
                {s.city}, {s.state}
              </p>
              <h3 className="text-xl font-black font-display text-[#000000] leading-tight mb-4">
                {s.name}
              </h3>

              {/* Endereço */}
              <div className="flex gap-2 mb-3">
                <span className="text-gray-400 mt-0.5 flex-shrink-0"><IconMapPin /></span>
                <div>
                  <p className="text-sm font-semibold text-[#000000] leading-snug">{s.street}</p>
                  <p className="text-xs text-gray-700">{s.complement}</p>
                  <p className="text-xs text-gray-600">{s.city}, {s.state} — CEP {s.zip}</p>
                </div>
              </div>

              {/* Horários */}
              <div className="flex gap-2">
                <span className="text-gray-400 mt-0.5 flex-shrink-0"><IconClock /></span>
                <div className="space-y-1">
                  {s.hours.map(h => (
                    <div key={h.days} className="flex gap-3 text-xs">
                      <span className="text-gray-700 w-32 flex-shrink-0">{h.days}</span>
                      <span className={`font-bold ${h.time === 'Fechado' ? 'text-gray-600' : 'text-[#000000]'}`}>{h.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="flex gap-2 mt-4">
              <a
                href={s.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-[#2a7e51] text-white py-2.5 rounded-lg font-bold text-xs text-center hover:bg-[#236843] transition-colors flex items-center justify-center gap-1.5"
              >
                <IconMapPin /> Como Chegar
              </a>
              <a
                href={`https://wa.me/${s.whatsapp}?text=Olá!%20Gostaria%20de%20visitar%20a%20${encodeURIComponent(s.name)}.`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 border border-gray-200 bg-white text-[#000000] py-2.5 rounded-lg font-bold text-xs text-center hover:bg-gray-50 hover:border-gray-300 transition-colors flex items-center justify-center gap-1.5"
              >
                <IconWhatsApp /> WhatsApp
              </a>
            </div>

            <Link
              to="/nossa-loja"
              className="mt-2 flex items-center justify-center gap-1 text-[0.65rem] text-gray-600 hover:text-[#000000] transition-colors"
            >
              Ver página completa <IconArrow />
            </Link>
          </div>

          {/* Mapa — 3/5 */}
          <div ref={mapRef} className="lg:col-span-3 rounded-xl overflow-hidden relative group h-full bg-gray-100">
            <a
              href={s.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute inset-0 z-20"
              aria-label="Abrir no Google Maps"
            />

            {mapVisible && (
              <iframe
                key={s.id}
                title={`Mapa — ${s.name}`}
                src={s.mapEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0, position: 'absolute', inset: 0, filter: 'grayscale(0.5) contrast(1.05)', pointerEvents: 'none' }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            )}

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-10 pointer-events-none drop-shadow-xl" style={{ marginTop: '-12px' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="#2a7e51" stroke="white" strokeWidth="1">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
            </div>

            <div className="absolute inset-x-0 bottom-0 z-10 pointer-events-none bg-gradient-to-t from-black/35 to-transparent flex items-end justify-center pb-5 pt-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="bg-[#2a7e51] text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-xl flex items-center gap-2 translate-y-3 group-hover:translate-y-0 transition-transform duration-300">
                <IconMapPin /> Abrir no Google Maps
              </span>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
