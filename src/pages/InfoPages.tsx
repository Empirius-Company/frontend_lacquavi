import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { CONTACT_CONFIG, getWhatsAppUrl } from '../config/contactConfig'

// ─── LAYOUT COMPARTILHADO ────────────────────────────────────────────────────

function InfoLayout({
  breadcrumb,
  title,
  subtitle,
  children,
}: {
  breadcrumb: string
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="bg-white border-b border-gray-100">
        <div className="container-page py-8 md:py-10">
          <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
            <Link to="/" className="hover:text-[#000000] transition-colors">Início</Link>
            <span>›</span>
            <span className="text-[#000000] font-semibold">{breadcrumb}</span>
          </nav>
          <h1 className="font-display text-3xl md:text-4xl text-[#000000] font-black">{title}</h1>
          <p className="text-sm text-gray-500 mt-2">{subtitle}</p>
        </div>
      </div>

      <div className="container-page py-10 md:py-14">
        <div className="max-w-3xl mx-auto space-y-6">
          {children}
        </div>
      </div>
    </div>
  )
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-7 md:p-8">
      <h2 className="font-display text-lg font-bold text-[#000000] mb-4 pb-3 border-b border-gray-100">
        {title}
      </h2>
      <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
        {children}
      </div>
    </div>
  )
}

function Item({ icon, title, children }: { icon: string; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
      <div>
        <p className="font-semibold text-[#000000] text-sm mb-0.5">{title}</p>
        <p className="text-gray-500 text-sm leading-relaxed">{children}</p>
      </div>
    </div>
  )
}

function ContactCTA({ message }: { message: string }) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-7 flex flex-col sm:flex-row items-center justify-between gap-5">
      <div>
        <p className="text-xs font-bold text-[#2a7e51] uppercase tracking-widest mb-1">Fale com a gente</p>
        <p className="font-display text-lg font-bold text-[#000000]">{message}</p>
        <p className="text-sm text-gray-500 mt-0.5">{CONTACT_CONFIG.businessHours.replace('\n', ' · ')}</p>
      </div>
      <a
        href={getWhatsAppUrl('Olá! Preciso de ajuda.')}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-[#2a7e51] hover:bg-[#236843] text-white font-bold text-xs px-6 py-3 rounded-xl transition-colors whitespace-nowrap shadow-md shadow-[#2a7e51]/20"
      >
        Falar pelo WhatsApp
      </a>
    </div>
  )
}

// ─── TERMOS E CONDIÇÕES ──────────────────────────────────────────────────────

export function TermosPage() {
  return (
    <InfoLayout
      breadcrumb="Termos e Condições"
      title="Termos e Condições de Uso"
      subtitle="Leia com atenção antes de utilizar nossa plataforma. Última atualização: abril de 2025."
    >
      <Card title="1. Aceitação dos Termos">
        <p>
          Ao acessar e utilizar o site da Lacquavi, você concorda com estes Termos e Condições de Uso. Caso não
          concorde com qualquer disposição, pedimos que não utilize nossos serviços.
        </p>
        <p>
          Estes termos aplicam-se a todos os visitantes, clientes e usuários da plataforma Lacquavi, incluindo
          o site, aplicativo e demais canais de venda online.
        </p>
      </Card>

      <Card title="2. Cadastro e Conta">
        <Item icon="◎" title="Veracidade das informações">
          Ao criar sua conta, você se compromete a fornecer dados verdadeiros, completos e atualizados. A
          Lacquavi reserva o direito de suspender contas com informações falsas.
        </Item>
        <Item icon="◎" title="Responsabilidade sobre a conta">
          Você é responsável pela confidencialidade da sua senha e por todas as atividades realizadas em sua
          conta. Em caso de uso não autorizado, entre em contato imediatamente.
        </Item>
        <Item icon="◎" title="Elegibilidade">
          Para realizar compras, é necessário ter pelo menos 18 anos ou estar assistido pelos responsáveis legais.
        </Item>
      </Card>

      <Card title="3. Pedidos e Pagamentos">
        <p>
          Todos os pedidos estão sujeitos à disponibilidade de estoque e à confirmação do pagamento. A Lacquavi
          reserva o direito de cancelar pedidos em casos de erros de preço ou indisponibilidade de produto,
          com reembolso integral.
        </p>
        <Item icon="◈" title="Preços">
          Os preços exibidos no site são válidos exclusivamente para compras online e podem ser alterados sem
          aviso prévio. O preço válido é o que estava vigente no momento da finalização do pedido.
        </Item>
        <Item icon="◈" title="Confirmação">
          O contrato de compra e venda se perfaz com o envio do e-mail de confirmação do pedido, após a
          aprovação do pagamento.
        </Item>
      </Card>

      <Card title="4. Entrega e Prazo">
        <p>
          Os prazos de entrega são estimados e podem variar conforme a transportadora e a localidade de
          destino. A Lacquavi não se responsabiliza por atrasos causados por greves, catástrofes naturais ou
          outros eventos de força maior.
        </p>
        <p>
          Para mais detalhes sobre prazos e modalidades de envio, consulte nossa{' '}
          <Link to="/entrega" className="text-[#2a7e51] hover:underline font-medium">página de Frete e Entrega</Link>.
        </p>
      </Card>

      <Card title="5. Direito de Arrependimento">
        <p>
          Em conformidade com o Artigo 49 do Código de Defesa do Consumidor (Lei nº 8.078/90), você tem o
          direito de se arrepender da compra realizada por meio eletrônico no prazo de <strong className="text-[#000000]">7 (sete)
          dias corridos</strong> a contar da data de recebimento do produto, sem necessidade de justificativa.
        </p>
        <p>
          Para exercer esse direito, entre em contato com nosso atendimento pelo WhatsApp ou e-mail.
          O produto deve ser devolvido em sua embalagem original, sem uso e sem avarias.
        </p>
      </Card>

      <Card title="6. Propriedade Intelectual">
        <p>
          Todo o conteúdo do site — incluindo textos, imagens, logotipos, marcas, layouts e código-fonte —
          é de propriedade exclusiva da Lacquavi ou de seus licenciadores, sendo protegido pelas leis de
          propriedade intelectual. É proibida a reprodução sem autorização expressa.
        </p>
      </Card>

      <Card title="7. Limitação de Responsabilidade">
        <p>
          A Lacquavi não se responsabiliza por danos indiretos, incidentais ou consequentes decorrentes do
          uso ou incapacidade de uso dos serviços. Nossa responsabilidade fica limitada ao valor do produto
          adquirido.
        </p>
      </Card>

      <Card title="8. Disposições Gerais">
        <p>
          Estes Termos são regidos pela legislação brasileira, com foro eleito na Comarca de Belo Horizonte,
          Minas Gerais. A Lacquavi pode atualizar estes Termos a qualquer momento, sendo as alterações
          comunicadas pelo site.
        </p>
        <p>
          Dúvidas? Entre em contato pelo e-mail{' '}
          <a href="mailto:contato@lacquavi.com.br" className="text-[#2a7e51] hover:underline font-medium">
            contato@lacquavi.com.br
          </a>.
        </p>
      </Card>

      <ContactCTA message="Tem alguma dúvida sobre nossos termos?" />
    </InfoLayout>
  )
}

// ─── POLÍTICA DE PRIVACIDADE ─────────────────────────────────────────────────

export function PrivacidadePage() {
  return (
    <InfoLayout
      breadcrumb="Política de Privacidade"
      title="Política de Privacidade"
      subtitle="Sua privacidade é importante para nós. Veja como coletamos e usamos seus dados. Última atualização: abril de 2025."
    >
      <Card title="1. Quem Somos">
        <p>
          A Lacquavi é responsável pelo tratamento dos dados pessoais coletados neste site, nos termos da
          Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018). Em caso de dúvidas, entre em contato
          pelo e-mail{' '}
          <a href="mailto:privacidade@lacquavi.com.br" className="text-[#2a7e51] hover:underline font-medium">
            privacidade@lacquavi.com.br
          </a>.
        </p>
      </Card>

      <Card title="2. Dados que Coletamos">
        <Item icon="◎" title="Dados de cadastro">
          Nome completo, e-mail, telefone e senha (criptografada). Necessários para criar sua conta e
          gerenciar pedidos.
        </Item>
        <Item icon="◎" title="Dados de entrega">
          Endereço completo para cálculo de frete e envio dos produtos.
        </Item>
        <Item icon="◎" title="Dados de pagamento">
          As transações são processadas pelo Mercado Pago. Não armazenamos dados de cartão de crédito em
          nossos servidores.
        </Item>
        <Item icon="◎" title="Dados de navegação">
          Endereço IP, tipo de navegador, páginas visitadas e tempo de sessão, coletados via cookies e
          ferramentas de análise.
        </Item>
      </Card>

      <Card title="3. Como Usamos Seus Dados">
        <Item icon="✦" title="Processamento de pedidos">
          Gerenciar sua compra, emitir nota fiscal, calcular e despachar o frete.
        </Item>
        <Item icon="✦" title="Comunicação">
          Enviar confirmações de pedido, atualizações de entrega e, com seu consentimento, novidades e
          promoções por e-mail.
        </Item>
        <Item icon="✦" title="Melhoria dos serviços">
          Analisar padrões de uso para aprimorar a experiência de compra.
        </Item>
        <Item icon="✦" title="Prevenção de fraudes">
          Verificar a autenticidade de pedidos e proteger sua conta.
        </Item>
      </Card>

      <Card title="4. Compartilhamento de Dados">
        <p>
          Não vendemos seus dados pessoais. Compartilhamos apenas com:
        </p>
        <Item icon="◇" title="Parceiros de entrega">
          Correios e transportadoras parceiras, somente os dados necessários para a entrega (nome, endereço
          e telefone).
        </Item>
        <Item icon="◇" title="Processador de pagamentos">
          Mercado Pago, para processamento seguro das transações.
        </Item>
        <Item icon="◇" title="Obrigações legais">
          Autoridades públicas quando exigido por lei ou ordem judicial.
        </Item>
      </Card>

      <Card title="5. Seus Direitos (LGPD)">
        <p>
          De acordo com a LGPD, você tem direito a:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          {[
            { icon: '◎', label: 'Confirmar o tratamento dos seus dados' },
            { icon: '◎', label: 'Acessar seus dados pessoais' },
            { icon: '◎', label: 'Corrigir dados incompletos ou incorretos' },
            { icon: '◎', label: 'Solicitar a exclusão dos seus dados' },
            { icon: '◎', label: 'Revogar consentimentos dados' },
            { icon: '◎', label: 'Portabilidade dos seus dados' },
          ].map(r => (
            <div key={r.label} className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-[#2a7e51] text-xs">{r.icon}</span>
              {r.label}
            </div>
          ))}
        </div>
        <p className="mt-3">
          Para exercer qualquer um desses direitos, entre em contato pelo e-mail{' '}
          <a href="mailto:privacidade@lacquavi.com.br" className="text-[#2a7e51] hover:underline font-medium">
            privacidade@lacquavi.com.br
          </a>{' '}
          ou pelo WhatsApp.
        </p>
      </Card>

      <Card title="6. Cookies">
        <p>
          Utilizamos cookies para manter sua sessão ativa, lembrar o carrinho de compras e coletar dados
          analíticos. Você pode desativar os cookies nas configurações do seu navegador, porém algumas
          funcionalidades do site podem ficar indisponíveis.
        </p>
      </Card>

      <Card title="7. Retenção e Segurança">
        <p>
          Seus dados são armazenados em servidores seguros com criptografia e acesso restrito. Mantemos
          seus dados pelo período necessário para cumprir as finalidades descritas nesta política ou por
          obrigação legal (geralmente 5 anos para dados fiscais).
        </p>
      </Card>

      <ContactCTA message="Exercite seus direitos ou tire dúvidas sobre privacidade." />
    </InfoLayout>
  )
}

// ─── FRETE E ENTREGA ─────────────────────────────────────────────────────────

export function EntregaPage() {
  return (
    <InfoLayout
      breadcrumb="Frete e Entrega"
      title="Frete e Entrega"
      subtitle="Enviamos para todo o Brasil com rastreio em tempo real."
    >
      {/* Destaque frete grátis */}
      <div className="bg-[#2a7e51] rounded-3xl p-7 text-white">
        <p className="text-xs font-bold uppercase tracking-widest text-white/70 mb-1">Benefício exclusivo</p>
        <p className="font-display text-2xl font-black mb-1">Frete Grátis acima de R$ 259</p>
        <p className="text-sm text-white/80">
          Para todo o Brasil. O benefício é aplicado automaticamente no checkout.
        </p>
      </div>

      <Card title="Modalidades de Envio">
        <div className="space-y-4">
          {[
            {
              name: 'SEDEX — Expresso',
              prazo: '1 a 3 dias úteis',
              desc: 'Entrega expressa pelos Correios. Rastreio em tempo real após o despacho.',
              icon: '◈',
            },
            {
              name: 'Retirada na Loja',
              prazo: 'Em 1 hora',
              desc: 'Comprou online? Retire na nossa loja física sem pagar frete.',
              icon: '✦',
            },
          ].map(m => (
            <div key={m.name} className="flex gap-4 p-4 rounded-2xl border border-gray-100 bg-[#F5F5F5]">
              <span className="text-lg flex-shrink-0 mt-0.5 text-[#2a7e51]">{m.icon}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="font-bold text-[#000000] text-sm">{m.name}</p>
                  <span className="text-xs bg-white border border-gray-200 text-gray-600 px-2.5 py-0.5 rounded-full font-medium">
                    {m.prazo}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Prazo de Despacho">
        <Item icon="◎" title="Pedidos pagos até 14h (dias úteis)">
          Despachados no mesmo dia. Você recebe o código de rastreio por e-mail assim que o pedido for postado.
        </Item>
        <Item icon="◎" title="Pedidos pagos após 14h">
          Despachados no próximo dia útil.
        </Item>
        <Item icon="◎" title="Fins de semana e feriados">
          Pedidos processados no próximo dia útil seguinte.
        </Item>
      </Card>

      <Card title="Rastreio do Pedido">
        <p>
          Após o despacho, você receberá o código de rastreio por e-mail. Acompanhe sua entrega diretamente
          no site dos Correios ou na área{' '}
          <Link to="/account/orders" className="text-[#2a7e51] hover:underline font-medium">
            Meus Pedidos
          </Link>{' '}
          da sua conta.
        </p>
        <Item icon="◈" title="Atualização em tempo real">
          A Lacquavi atualiza o status do seu pedido automaticamente a cada movimentação registrada
          pelos Correios.
        </Item>
      </Card>

      <Card title="Embalagem Premium">
        <p>
          Todos os pedidos são embalados com cuidado para garantir a integridade dos frascos durante o
          transporte. Produtos frágeis recebem proteção adicional com material acolchoado.
          Encomendas para presente podem ser acompanhadas de embalagem especial — consulte as opções
          no checkout.
        </p>
      </Card>

      <Card title="Regiões e Restrições">
        <p>
          Entregamos para todo o território nacional. Regiões remotas (zonas rurais, ilhas e algumas
          localidades do Norte e Nordeste) podem ter prazos maiores e valor de frete diferenciado,
          conforme tabela dos Correios.
        </p>
        <p>
          O valor exato do frete e o prazo estimado são calculados no checkout, com base no seu CEP.
        </p>
      </Card>

      <ContactCTA message="Dúvidas sobre seu envio? Fale com a gente." />
    </InfoLayout>
  )
}

// ─── TROCAS E DEVOLUÇÕES ─────────────────────────────────────────────────────

export function TrocasPage() {
  return (
    <InfoLayout
      breadcrumb="Trocas e Devoluções"
      title="Trocas e Devoluções"
      subtitle="Sua satisfação é nossa prioridade. Veja como funciona nosso processo."
    >
      {/* Destaque prazo */}
      <div className="bg-[#000000] rounded-3xl p-7 text-white">
        <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-1">Garantia legal</p>
        <p className="font-display text-2xl font-black mb-1">7 dias para se arrepender</p>
        <p className="text-sm text-white/70">
          Direito garantido pelo Código de Defesa do Consumidor (Art. 49, Lei 8.078/90) para compras online.
          Sem precisar de justificativa.
        </p>
      </div>

      <Card title="Quando Posso Solicitar Troca ou Devolução?">
        <Item icon="✦" title="Arrependimento (7 dias)">
          Você pode devolver qualquer produto no prazo de 7 dias corridos a partir do recebimento, sem
          precisar de justificativa. O produto deve estar lacrado, sem uso e na embalagem original.
        </Item>
        <Item icon="✦" title="Produto com defeito">
          Se o produto chegou com algum defeito de fabricação, entre em contato em até 30 dias (produto
          não durável) ou 90 dias (produto durável) após o recebimento.
        </Item>
        <Item icon="✦" title="Produto errado ou avariado">
          Recebeu um produto diferente do que pediu, ou que chegou danificado? Solicite a troca
          imediatamente pelo WhatsApp com foto do produto.
        </Item>
      </Card>

      <Card title="Como Solicitar">
        <div className="space-y-4">
          {[
            { step: '01', title: 'Entre em contato', desc: 'Fale conosco pelo WhatsApp ou e-mail informando o número do pedido e o motivo da troca/devolução.' },
            { step: '02', title: 'Confirmação', desc: 'Nossa equipe analisará seu caso e enviará as instruções de devolução em até 1 dia útil.' },
            { step: '03', title: 'Envie o produto', desc: 'Embale o produto na caixa original e encaminhe pelo Correios. Para devoluções por arrependimento, o frete de retorno é por sua conta.' },
            { step: '04', title: 'Reembolso ou troca', desc: 'Após receber e conferir o produto, processamos o reembolso ou enviamos a troca em até 5 dias úteis.' },
          ].map(s => (
            <div key={s.step} className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-[#2a7e51]/10 border border-[#2a7e51]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[0.6rem] font-black text-[#2a7e51]">{s.step}</span>
              </div>
              <div>
                <p className="font-bold text-[#000000] text-sm mb-0.5">{s.title}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Condições do Produto para Devolução">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { ok: true,  label: 'Produto lacrado e sem uso' },
            { ok: true,  label: 'Na embalagem original' },
            { ok: true,  label: 'Com todos os itens inclusos' },
            { ok: true,  label: 'Com nota fiscal' },
            { ok: false, label: 'Produto aberto (exceto defeito)' },
            { ok: false, label: 'Produto com sinais de uso' },
            { ok: false, label: 'Sem embalagem original' },
            { ok: false, label: 'Fora do prazo de 7 dias' },
          ].map(c => (
            <div key={c.label} className="flex items-center gap-2.5 text-sm">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[0.6rem] font-black flex-shrink-0 ${
                c.ok
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-50 text-red-500'
              }`}>
                {c.ok ? '✓' : '✕'}
              </span>
              <span className={c.ok ? 'text-gray-700' : 'text-gray-500'}>{c.label}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Reembolso">
        <Item icon="◎" title="PIX (recomendado)">
          Reembolso em até 2 dias úteis após a confirmação da devolução.
        </Item>
        <Item icon="◎" title="Cartão de crédito">
          O estorno é solicitado à operadora, podendo aparecer em até 2 faturas seguintes.
        </Item>
        <p className="text-xs text-gray-400 mt-2 border-t border-gray-100 pt-3">
          O prazo de reembolso começa a contar a partir da confirmação de recebimento e análise do
          produto devolvido.
        </p>
      </Card>

      <ContactCTA message="Precisa iniciar uma troca ou devolução?" />
    </InfoLayout>
  )
}

// ─── FORMAS DE PAGAMENTO ─────────────────────────────────────────────────────

export function PagamentoPage() {
  return (
    <InfoLayout
      breadcrumb="Formas de Pagamento"
      title="Formas de Pagamento"
      subtitle="Aceitamos os principais meios de pagamento com total segurança."
    >
      {/* Cards de pagamento */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            icon: '◈',
            name: 'PIX',
            desc: 'Aprovação imediata',
            highlight: 'Mais rápido',
            color: 'bg-[#2a7e51]/10 border-[#2a7e51]/20 text-[#2a7e51]',
          },
          {
            icon: '◇',
            name: 'Cartão de Crédito',
            desc: 'Até 12x sem juros',
            highlight: 'Parcelado',
            color: 'bg-[#000000]/5 border-gray-200 text-[#000000]',
          },
        ].map(p => (
          <div key={p.name} className={`rounded-2xl border p-5 ${p.color}`}>
            <span className="text-2xl mb-3 block">{p.icon}</span>
            <p className="font-display text-lg font-black text-[#000000] mb-0.5">{p.name}</p>
            <p className="text-xs text-gray-500">{p.desc}</p>
            <span className="mt-3 inline-block text-[0.65rem] font-bold uppercase tracking-widest border rounded-full px-2 py-0.5 border-current opacity-60">
              {p.highlight}
            </span>
          </div>
        ))}
      </div>

      <Card title="PIX">
        <Item icon="✦" title="Aprovação instantânea">
          O pedido é confirmado em segundos após o pagamento. Ideal para quem quer garantir o produto
          o mais rápido possível.
        </Item>
        <Item icon="✦" title="Como pagar">
          Finalize o checkout e escaneie o QR Code gerado, ou copie a chave PIX. O código expira em
          30 minutos.
        </Item>
        <Item icon="✦" title="Segurança">
          Transações processadas pelo Mercado Pago, criptografadas de ponta a ponta.
        </Item>
      </Card>

      <Card title="Cartão de Crédito">
        <p>
          Aceitamos as principais bandeiras: Visa, Mastercard, Elo, American Express e Hipercard.
        </p>
        <div className="grid grid-cols-2 gap-3 mt-3">
          {[
            { parcelas: '1x', descricao: 'À vista — sem juros' },
            { parcelas: 'Até 3x', descricao: 'Sem juros' },
            { parcelas: 'Até 6x', descricao: 'Sem juros' },
            { parcelas: 'Até 12x', descricao: 'Sem juros*' },
          ].map(p => (
            <div key={p.parcelas} className="flex items-center gap-3 p-3 rounded-xl bg-[#F5F5F5] border border-gray-100">
              <span className="text-sm font-black text-[#000000] flex-shrink-0 w-14">{p.parcelas}</span>
              <span className="text-xs text-gray-500">{p.descricao}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">
          * Condições de parcelamento sujeitas a alteração. O número máximo de parcelas e eventuais juros
          são definidos pelo Mercado Pago no momento da compra.
        </p>
      </Card>

      <Card title="Segurança nas Transações">
        <p>
          Todas as transações são processadas pela plataforma Mercado Pago, líder em pagamentos digitais
          na América Latina. Não armazenamos dados de cartão de crédito em nossos servidores. A
          comunicação entre seu navegador e nossa plataforma é criptografada via SSL/TLS.
        </p>
        <div className="flex flex-wrap gap-3 mt-4">
          {['SSL Criptografado', 'Mercado Pago', 'Dados Protegidos'].map(label => (
            <span
              key={label}
              className="text-xs font-medium bg-[#F5F5F5] border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full"
            >
              ✓ {label}
            </span>
          ))}
        </div>
      </Card>

      <ContactCTA message="Problema com pagamento? Nossa equipe resolve." />
    </InfoLayout>
  )
}
