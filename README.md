# Lacquavi Frontend

Frontend do e-commerce **Lacquavi** — perfumaria premium.
Construído com **React + Vite + TypeScript + Tailwind CSS**.

---

## 🚀 Início Rápido

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# edite VITE_API_URL se necessário (padrão: http://localhost:3000)

# 3. Rodar em desenvolvimento
npm run dev
# Abre em http://localhost:5173
```

> A API backend deve estar rodando em `http://localhost:3000` antes de iniciar o frontend.

---

## 🏗️ Arquitetura

```
src/
├── api/
│   ├── httpClient.ts        # Cliente Axios centralizado com interceptors
│   ├── authApi.ts           # Módulo de Auth (/auth/*)
│   ├── catalogApi.ts        # Módulo de Catálogo (/api/categories + /products)
│   └── index.ts             # Módulos: Orders, Payments, Coupons, Health
│
├── context/
│   ├── AuthContext.tsx      # Estado global de autenticação + tokens JWT
│   ├── CartContext.tsx      # Carrinho (localStorage + reducer)
│   └── ToastContext.tsx     # Sistema de notificações
│
├── components/
│   ├── ui/index.tsx         # Button, Input, Badge, Skeleton, Modal, Toast…
│   ├── layout/
│   │   ├── Header.tsx       # Header com scroll, cart badge, user menu
│   │   ├── Footer.tsx       # Footer completo
│   │   └── index.tsx        # MainLayout + AdminLayout
│   └── product/
│       └── ProductCard.tsx  # Card de produto com quick-add
│
├── pages/
│   ├── HomePage.tsx         # Hero + Bestsellers + Categories + Promo
│   ├── ProductListPage.tsx  # Grid com filtros, busca, ordenação
│   ├── ProductDetailPage.tsx# PDP com galeria, quantidade, add-to-cart
│   ├── CartPage.tsx         # Carrinho com stepper de quantidade
│   ├── CheckoutPage.tsx     # Revisão + cupom + criação de pedido
│   ├── PaymentPage.tsx      # PIX QR Code + verificação de status
│   ├── general.tsx          # Login, Register, Profile, Orders, NotFound
│   └── admin/
│       └── index.tsx        # Dashboard, Produtos, Categorias, Pedidos,
│                            # Pagamentos, Cupons, Status
│
├── routes/
│   ├── AppRoutes.tsx        # Configuração de todas as rotas
│   └── guards.tsx           # ProtectedRoute + AdminRoute
│
├── types/index.ts           # Todos os tipos TypeScript alinhados com API
├── utils/index.ts           # Formatadores, UUID, status labels/colors
└── styles/global.css        # Tailwind + variáveis + classes @layer
```

---

## 🎨 Design System

### Paleta de Cores (tokens Tailwind)
| Token        | Hex       | Uso                              |
|--------------|-----------|----------------------------------|
| `obsidian-950` | `#18130f` | Backgrounds escuros, Admin sidebar |
| `champagne-500` | `#c9a26a` | Acento dourado, detalhes premium  |
| `vino-800`   | `#8c2f4a` | CTA primário (botões de compra)  |
| `cream`      | `#F9F5F0` | Background principal do site     |
| `ink`        | `#0D0B09` | Texto principal                  |

### Tipografia
- **Display** → `Cormorant Garamond` (headings, marca, preços)
- **Body/UI** → `DM Sans` (parágrafos, botões, labels)
- **Mono** → `DM Mono` (códigos, IDs, cupons)

### Classes Utilitárias Principais
- `.btn-primary` — botão vinho (CTA principal)
- `.btn-ghost` — botão dourado transparente
- `.btn-outline` — botão neutro com borda
- `.card-luxury` — card com hover elevation
- `.input-luxury` — input padronizado
- `.badge-gold` — badge dourado premium
- `.section-title` — título de seção (display font)
- `.container-page` — container 1280px com padding responsivo

---

## 📡 Integração com API

### Autenticação
- Tokens armazenados em `localStorage` (`lacquavi_access_token` / `lacquavi_refresh_token`)
- `httpClient` injeta automaticamente `Authorization: Bearer <token>`
- Em `401`: `AuthContext` faz logout automático
- Bootstrap da sessão: recupera tokens → chama `GET /auth/profile` → restaura usuário

### Idempotência
- Pedidos e pagamentos usam `Idempotency-Key` via `generateIdempotencyKey()` (UUID v4)

### Fluxo de Checkout
1. Carrinho (CartContext) → `/cart`
2. Revisão + cupom → `POST /api/coupons/validate` → `/checkout`
3. Criação do pedido → `POST /orders` → `/checkout/payment/:orderId`
4. Pagamento PIX → `POST /api/payments` (com Idempotency-Key)
5. Verificação → `GET /api/payments/:id` → `/checkout/payment/:orderId/result`

---

## 📋 Páginas

### Públicas
| Rota            | Página               |
|-----------------|----------------------|
| `/`             | Home (Hero + Destaques) |
| `/products`     | Listagem com filtros |
| `/products/:id` | Detalhe do produto   |
| `/cart`         | Carrinho             |
| `/login`        | Login                |
| `/register`     | Cadastro             |

### Cliente Autenticado
| Rota                              | Página            |
|-----------------------------------|-------------------|
| `/checkout`                       | Checkout          |
| `/checkout/payment/:orderId`      | Pagamento         |
| `/checkout/payment/:id/result`    | Resultado         |
| `/account/profile`                | Minha Conta       |
| `/account/orders`                 | Meus Pedidos      |
| `/account/orders/:id`             | Detalhe do Pedido |

### Admin (requer `role: admin`)
| Rota                        | Página                  |
|-----------------------------|-------------------------|
| `/admin`                    | Dashboard               |
| `/admin/products`           | Listagem de Produtos    |
| `/admin/products/new`       | Criar Produto           |
| `/admin/products/:id/edit`  | Editar Produto          |
| `/admin/categories`         | Gerenciar Categorias    |
| `/admin/orders`             | Todos os Pedidos        |
| `/admin/orders/:id`         | Detalhe + Atualizar     |
| `/admin/payments`           | Todos os Pagamentos     |
| `/admin/payments/:id`       | Detalhe + Estorno       |
| `/admin/coupons`            | Gerenciar Cupons        |
| `/admin/coupons/new`        | Criar Cupom             |
| `/admin/coupons/:id/edit`   | Editar Cupom            |
| `/status`                   | Status da API           |

---

## ✨ Sugestões Futuras

1. **Busca em tempo real** com debounce (`useDebounce` hook)
2. **Paginação server-side** quando a API suportar `page`/`limit`
3. **Wishlist / Favoritos** (requer endpoint de backend)
4. **Zoom de imagem** no produto (biblioteca `react-image-magnifiers`)
5. **Modo offline** com Service Worker para catálogo
6. **Analytics** de conversão (GA4 ou Plausible)
7. **Internacionalização** (i18n com `react-i18next`)
8. **Testes** com Vitest + React Testing Library
9. **Storybook** para o design system
10. **Lazy loading de rotas** com `React.lazy` + `Suspense`

---

## 🔧 Variáveis de Ambiente

| Variável        | Padrão                  | Descrição         |
|-----------------|-------------------------|-------------------|
| `VITE_API_URL`  | `http://localhost:3000` | URL base da API   |
