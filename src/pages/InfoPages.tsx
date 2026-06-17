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
        <p className="font-display text-2xl font-black mb-1">Frete Grátis acima de R$ 200</p>
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
      title="Política de Trocas e Devoluções"
      subtitle="Sua satisfação é nossa prioridade. Conheça seus direitos e como iniciar uma solicitação. Última atualização: maio de 2025."
    >

      {/* Cards de resumo rápido */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            icon: '◈',
            title: '7 dias',
            desc: 'Arrependimento sem justificativa (Art. 49 do CDC)',
            color: 'border-[#2a7e51]/20 bg-[#2a7e51]/5',
            textColor: 'text-[#2a7e51]',
          },
          {
            icon: '◇',
            title: '90 dias',
            desc: 'Defeito de fabricação em produto durável (Art. 26 do CDC)',
            color: 'border-gray-200 bg-[#F5F5F5]',
            textColor: 'text-[#000000]',
          },
          {
            icon: '✦',
            title: 'WhatsApp',
            desc: 'Todo o processo inicia pelo nosso atendimento — rápido e sem burocracia',
            color: 'border-gray-200 bg-[#F5F5F5]',
            textColor: 'text-[#000000]',
          },
        ].map(c => (
          <div key={c.title} className={`rounded-2xl border p-5 ${c.color}`}>
            <span className={`text-2xl mb-2 block ${c.textColor}`}>{c.icon}</span>
            <p className={`font-display text-2xl font-black mb-1 ${c.textColor}`}>{c.title}</p>
            <p className="text-xs text-gray-500 leading-relaxed">{c.desc}</p>
          </div>
        ))}
      </div>

      {/* Destaque legal */}
      <div className="bg-[#000000] rounded-3xl p-7 text-white">
        <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Seus direitos garantidos por lei</p>
        <p className="font-display text-xl font-black mb-3">Código de Defesa do Consumidor — Lei nº 8.078/90</p>
        <div className="space-y-2.5 text-sm text-white/75 leading-relaxed">
          <p>
            <strong className="text-white font-semibold">Art. 49 — Direito de Arrependimento:</strong>{' '}
            Para compras realizadas fora do estabelecimento comercial (internet, telefone), você tem{' '}
            <strong className="text-white">7 dias corridos</strong> a partir do recebimento para desistir,
            sem precisar de qualquer justificativa. O produto devolvido deve estar sem uso e na embalagem original.
          </p>
          <p>
            <strong className="text-white font-semibold">Art. 26 — Vícios do Produto:</strong>{' '}
            Produtos com defeito de fabricação têm prazo de reclamação de{' '}
            <strong className="text-white">30 dias para bens não duráveis</strong> (ex.: cosméticos, itens descartáveis) e{' '}
            <strong className="text-white">90 dias para bens duráveis</strong> (ex.: frascos, embalagens rígidas).
          </p>
          <p>
            <strong className="text-white font-semibold">Art. 18 §1 — Solução de Vícios:</strong>{' '}
            Se o defeito não for sanado em até 30 dias, você pode exigir a substituição do produto,
            o reembolso integral do valor pago ou o abatimento proporcional no preço.
          </p>
        </div>
      </div>

      <Card title="Quando Posso Solicitar Troca ou Devolução?">
        <Item icon="✦" title="Arrependimento — 7 dias corridos (Art. 49, CDC)">
          Você pode devolver qualquer produto no prazo de 7 dias corridos a contar da data de recebimento,
          sem precisar de justificativa. O produto deve estar lacrado, sem uso e na embalagem original.
          O frete de retorno é gratuito para você — a Lacquavi arca com o custo de postagem.
        </Item>
        <Item icon="✦" title="Produto com defeito — até 90 dias (Art. 26, CDC)">
          Identificou algum defeito de fabricação? Entre em contato em até 30 dias para produtos não duráveis
          ou 90 dias para produtos duráveis. Envie fotos do defeito pelo WhatsApp para agilizar a análise.
          O frete de retorno é sempre por conta da Lacquavi neste caso.
        </Item>
        <Item icon="✦" title="Produto errado ou avariado no transporte">
          Recebeu um produto diferente do que pediu ou que chegou danificado pela transportadora?
          Nos avise imediatamente — de preferência com foto do produto e da embalagem —
          pelo WhatsApp. Resolvemos sem custo algum para você.
        </Item>
      </Card>

      <Card title="Como Iniciar uma Solicitação">
        <p className="text-xs font-semibold text-[#2a7e51] uppercase tracking-widest mb-4">
          Todo o processo começa entrando em contato conosco
        </p>
        <div className="space-y-5">
          {[
            {
              step: '01',
              title: 'Entre em contato pelo WhatsApp ou e-mail',
              desc: 'Informe o número do pedido, o produto e o motivo (arrependimento, defeito, produto errado etc.). Tire uma foto do produto se houver avaria ou defeito visível.',
            },
            {
              step: '02',
              title: 'Análise pela nossa equipe',
              desc: 'Em até 1 dia útil, nossa equipe confirmará se o pedido está dentro do prazo e das condições e enviará as instruções de devolução, incluindo a etiqueta de postagem quando aplicável.',
            },
            {
              step: '03',
              title: 'Envio do produto',
              desc: 'Embale o produto com cuidado na embalagem original. Para arrependimento e defeito, a Lacquavi fornece a etiqueta de postagem — basta levar ao Correios mais próximo.',
            },
            {
              step: '04',
              title: 'Confirmação e reembolso ou troca',
              desc: 'Assim que recebermos e conferirmos o produto, processamos o reembolso em até 5 dias úteis ou despachamos o produto substituto.',
            },
          ].map(s => (
            <div key={s.step} className="flex gap-4">
              <div className="w-9 h-9 rounded-full bg-[#2a7e51]/10 border border-[#2a7e51]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[0.6rem] font-black text-[#2a7e51]">{s.step}</span>
              </div>
              <div>
                <p className="font-bold text-[#000000] text-sm mb-0.5">{s.title}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA de contato inline */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <a
            href={getWhatsAppUrl('Olá! Preciso solicitar uma troca ou devolução. Número do pedido: ')}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 bg-[#2a7e51] hover:bg-[#236843] text-white font-bold text-xs px-5 py-3 rounded-xl transition-colors shadow-md shadow-[#2a7e51]/20"
          >
            Iniciar pelo WhatsApp
          </a>
          <a
            href="mailto:contato@lacquavi.com.br"
            className="flex-1 flex items-center justify-center gap-2 border border-gray-200 hover:border-gray-400 text-[#000000] font-bold text-xs px-5 py-3 rounded-xl transition-colors"
          >
            Enviar por e-mail
          </a>
        </div>
        <p className="text-xs text-gray-400 mt-3 text-center">
          {CONTACT_CONFIG.businessHours.replace('\n', ' · ')}
        </p>
      </Card>

      <Card title="Condições do Produto para Devolução">
        <p className="mb-3">Para que a devolução seja aceita por arrependimento, o produto precisa atender às seguintes condições:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { ok: true,  label: 'Lacrado e sem uso' },
            { ok: true,  label: 'Na embalagem original intacta' },
            { ok: true,  label: 'Com todos os acessórios inclusos' },
            { ok: true,  label: 'Acompanhado da nota fiscal' },
            { ok: false, label: 'Produto aberto ou com lacre violado' },
            { ok: false, label: 'Com sinais evidentes de uso' },
            { ok: false, label: 'Sem embalagem original' },
            { ok: false, label: 'Fora do prazo de 7 dias corridos' },
          ].map(c => (
            <div key={c.label} className="flex items-center gap-2.5 text-sm">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[0.6rem] font-black flex-shrink-0 ${
                c.ok ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-500'
              }`}>
                {c.ok ? '✓' : '✕'}
              </span>
              <span className={c.ok ? 'text-gray-700' : 'text-gray-500'}>{c.label}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-4 border-t border-gray-100 pt-3">
          Para devoluções por defeito, produto errado ou avaria no transporte, as condições acima
          não se aplicam — basta entrar em contato e enviar fotos.
        </p>
      </Card>

      <Card title="Frete de Devolução">
        <Item icon="◈" title="Arrependimento (Art. 49, CDC)">
          A Lacquavi arca com o frete de retorno. Após a aprovação da solicitação, enviamos uma etiqueta
          de postagem pré-paga para você entregar no Correios mais próximo, sem nenhum custo.
        </Item>
        <Item icon="◈" title="Defeito de fabricação (Art. 18/26, CDC)">
          O frete de retorno é integralmente por conta da Lacquavi. A etiqueta de postagem é enviada
          por WhatsApp após a confirmação do caso.
        </Item>
        <Item icon="◈" title="Produto errado ou danificado no transporte">
          Frete de retorno por conta da Lacquavi. Resolução prioritária com postagem ainda no mesmo
          dia útil da aprovação.
        </Item>
      </Card>

      <Card title="Reembolso">
        <Item icon="◎" title="PIX — até 2 dias úteis (recomendado)">
          O reembolso é feito via PIX para a chave de sua preferência, em até 2 dias úteis após a
          confirmação do recebimento e análise do produto devolvido.
        </Item>
        <Item icon="◎" title="Cartão de crédito — até 2 faturas">
          O estorno é solicitado ao Mercado Pago, que o repassa à operadora do cartão. O valor pode
          aparecer em até 2 faturas seguintes, conforme política da operadora.
        </Item>
        <p className="text-xs text-gray-400 mt-3 border-t border-gray-100 pt-3">
          O prazo começa a contar após a confirmação de recebimento e avaliação do item devolvido.
          Em casos de produto errado ou avaria, o reembolso ou reenvio pode ser processado sem
          necessidade de devolução, a critério da Lacquavi.
        </p>
      </Card>

      <Card title="Casos Especiais e Exceções">
        <Item icon="◇" title="Perfumes e fragrâncias — higiene pessoal">
          Perfumes são produtos de higiene pessoal. Uma vez abertos e utilizados, não há possibilidade
          de troca por arrependimento, pois o produto perde suas condições originais. Contudo, o direito
          de arrependimento se aplica normalmente enquanto o frasco estiver lacrado e sem uso.
        </Item>
        <Item icon="◇" title="Kits e produtos com brinde">
          Para solicitar devolução de um kit, todos os itens que o compõem devem ser devolvidos
          juntos — incluindo brindes e amostras, caso tenham sido enviados junto ao pedido.
        </Item>
        <Item icon="◇" title="Promoções e liquidações">
          Produtos adquiridos em promoção têm os mesmos direitos legais garantidos pelo CDC. O valor
          do reembolso é o efetivamente pago, não o preço original.
        </Item>
        <Item icon="◇" title="Produtos personalizados">
          Produtos com personalização sob encomenda (ex.: gravação em frasco) não são elegíveis para
          devolução por arrependimento, mas o direito por defeito permanece integralmente garantido.
        </Item>
      </Card>

      <Card title="Canais de Atendimento">
        <p className="mb-4">Para iniciar uma troca ou devolução, entre em contato por um dos canais abaixo:</p>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#F5F5F5] border border-gray-100">
            <span className="text-[#2a7e51] text-sm mt-0.5">✦</span>
            <div>
              <p className="font-semibold text-[#000000] text-sm">WhatsApp — canal preferencial</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Mais rápido para resolver — envie fotos e receba a etiqueta de postagem na hora.
                Respondemos durante o horário comercial.
              </p>
              <p className="text-xs font-semibold text-[#000000] mt-1">{CONTACT_CONFIG.displayPhone}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#F5F5F5] border border-gray-100">
            <span className="text-[#000000] text-sm mt-0.5">◎</span>
            <div>
              <p className="font-semibold text-[#000000] text-sm">E-mail</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Ideal para documentar o caso. Resposta em até 1 dia útil.
              </p>
              <a
                href="mailto:contato@lacquavi.com.br"
                className="text-xs font-semibold text-[#2a7e51] hover:underline mt-1 block"
              >
                contato@lacquavi.com.br
              </a>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-4 border-t border-gray-100 pt-3">
          Horário de atendimento: {CONTACT_CONFIG.businessHours.replace('\n', ' · ')}
        </p>
      </Card>

      <Card title="Órgãos de Defesa do Consumidor">
        <p>
          Caso não consigamos resolver sua solicitação de forma satisfatória, você pode acionar os
          órgãos de defesa do consumidor:
        </p>
        <div className="space-y-2 mt-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="text-[#2a7e51] text-xs">◎</span>
            <span><strong className="text-[#000000]">PROCON</strong> — Programa de Proteção e Defesa do Consumidor do seu estado</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="text-[#2a7e51] text-xs">◎</span>
            <span><strong className="text-[#000000]">consumidor.gov.br</strong> — Plataforma federal de resolução de conflitos (SENACON/MJ)</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="text-[#2a7e51] text-xs">◎</span>
            <span><strong className="text-[#000000]">Juizado Especial Cível</strong> — Para causas de até 20 salários mínimos, sem necessidade de advogado</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Fazemos de tudo para resolver internamente antes que isso seja necessário.
        </p>
      </Card>

      <ContactCTA message="Precisa iniciar uma troca ou devolução? Fale com a gente." />
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
