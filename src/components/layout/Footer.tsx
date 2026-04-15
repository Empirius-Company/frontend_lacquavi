import { Link } from 'react-router-dom'
import { PaymentIconsBar } from '../ui/PaymentMethodIcons'

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      {/* Newsletter Section */}
      <div className="px-4 py-12 md:py-16" style={{ background: 'linear-gradient(180deg, #111111 0%, #000000 100%)' }}>
        <div className="container-page flex flex-col lg:flex-row items-center justify-between gap-8 md:gap-12 max-w-6xl mx-auto">

          <div className="flex items-center gap-5 w-full lg:w-auto">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-[#D4AF37] flex-shrink-0">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            <div className="text-white">
              <h3 className="text-2xl md:text-3xl font-light font-display mb-1.5 tracking-wide text-white">
                Receba nossas <span className="font-bold">novidades</span>
              </h3>
              <p className="text-sm md:text-base text-gray-300">
                Cadastre-se e ganhe um <strong className="text-[#D4AF37] font-bold">cupom especial de boas-vindas!</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-col w-full lg:w-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Seu melhor e-mail"
                className="px-5 py-4 rounded-lg w-full sm:w-80 text-[#333] bg-white border border-[#D4AF37]/40 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all placeholder:text-gray-400"
              />
              <button className="bg-[#2a7e51] hover:bg-[#236843] active:scale-[0.98] text-white font-bold px-8 py-4 rounded-lg uppercase tracking-widest text-xs transition-all shadow-lg shadow-[#2a7e51]/20 whitespace-nowrap">
                QUERO MEU CUPOM
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-3 text-center sm:text-left font-medium">
              Respeitamos sua privacidade. Saia quando quiser.
            </p>
          </div>

        </div>
      </div>

      <div className="container-page py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Institutional */}
          <div>
            <h4 className="font-bold text-[#333] mb-4 uppercase text-sm">Institucional</h4>
            <ul className="space-y-3">
              {[
                { to: '/nossa-loja', label: 'Nossas Lojas' },
                { to: '/termos', label: 'Termos e Condições' },
                { to: '/privacidade', label: 'Política de Privacidade' },
              ].map(l => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-gray-500 hover:text-[#2a7e51] transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="font-bold text-[#333] mb-4 uppercase text-sm">Dúvidas</h4>
            <ul className="space-y-3">
              {[
                { to: '/entrega', label: 'Frete e Entrega' },
                { to: '/trocas', label: 'Trocas e Devoluções' },
                { to: '/pagamento', label: 'Formas de Pagamento' },
              ].map(l => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-gray-500 hover:text-[#2a7e51] transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="font-bold text-[#333] mb-4 uppercase text-sm">Sua Conta</h4>
            <ul className="space-y-3">
              {[
                { to: '/account/profile', label: 'Meu Perfil' },
                { to: '/account/orders', label: 'Meus Pedidos' },
                { to: '/cart', label: 'Carrinho de Compras' },
                { to: '/login', label: 'Entrar/Cadastrar' },
              ].map(l => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-gray-500 hover:text-[#2a7e51] transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social and Contact */}
          <div>
            <h4 className="font-bold text-[#333] mb-4 uppercase text-sm">Siga-nos</h4>
            <div className="flex gap-4 mb-8">
              <span className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-[#2a7e51] hover:text-white cursor-pointer transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </span>
              <span className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-[#2a7e51] hover:text-white cursor-pointer transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              </span>
            </div>

            <h4 className="font-bold text-[#333] mb-2 uppercase text-sm">Atendimento</h4>
            <p className="text-2xl font-black text-[#000000] mb-1">31 97501-9000</p>
            <p className="text-xs text-gray-500">Seg. a Sex. das 8h às 22h<br />Sáb. das 9h às 14h</p>
          </div>

        </div>
      </div>

      {/* Payment methods strip */}
      <div className="border-t border-gray-100">
        <div className="container-page py-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <span className="text-xs text-gray-400 uppercase tracking-widest font-medium whitespace-nowrap flex-shrink-0">
              Formas de pagamento
            </span>
            <PaymentIconsBar />
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-gray-100 py-6">
        <div className="container-page flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500 text-center md:text-left">
          <p>
            © {new Date().getFullYear()} Lacquavi. Todos os direitos reservados.
            <br />
            Preços e condições de pagamento exclusivos para compras via internet.
          </p>
          <div className="flex items-center gap-1 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
            <img src="/logo.png" alt="Lacquavi" className="h-[43px] object-contain" />
          </div>
        </div>
      </div>
    </footer>
  )
}
