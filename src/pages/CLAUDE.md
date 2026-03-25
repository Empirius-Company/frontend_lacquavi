# CLAUDE.md — `src/pages/`

## Responsabilidade

Componentes de página — cada arquivo corresponde a uma rota da aplicação. Aqui sim ocorrem chamadas à API e orquestração de estado local.

## Páginas públicas

| Arquivo | Rota | Descrição |
|---------|------|-----------|
| `HomePage.tsx` | `/` | Landing page: hero, bestsellers, categorias, banners |
| `ProductListPage.tsx` | `/products` | Grid com filtros, busca e ordenação |
| `ProductDetailPage.tsx` | `/products/:id` | Detalhe do produto, galeria, avaliações |
| `CartPage.tsx` | `/cart` | Carrinho com quantidades e subtotal |
| `CheckoutPage.tsx` | `/checkout` | Revisão do pedido, cupom, frete |
| `PaymentPage.tsx` | `/payment/:orderId` | QR code PIX e verificação de pagamento |
| `StorePage.tsx` | `/store` | Informações da loja física |

## Páginas autenticadas (`general.tsx`)

Um único arquivo exporta múltiplas páginas de conta do usuário:
- Login / Registro
- Perfil e dados pessoais
- Lista de pedidos e detalhe do pedido
- Página 404

## Admin (`admin/index.tsx`)

Painel administrativo completo (requer role `admin`):
- Dashboard com KPIs
- CRUD de produtos (com upload de imagens)
- CRUD de categorias e subcategorias
- Gestão de pedidos e pagamentos (incluindo reembolso)
- Gestão de cupons
- Monitoramento de status da API

## `HomePage.tsx` — Seção "Explore nossas categorias"

O componente `CategoryTiles` busca categorias do banco e monta até **4 tiles**:
1. Perfumes Femininos (categoria com "perfume" → filtra por "lacqua di fiori")
2. Perfumes Masculinos (categoria com "perfume" → filtra por "arabe")
3. Kits & Presentes (categoria com "kit")
4. Preenche com outras categorias cadastradas no banco até completar 4

Tiles só aparecem se a categoria existir no banco.

## Regras

- Chamadas à API ficam no `useEffect` ou em handlers — nunca no corpo do componente.
- Estado de loading/error sempre tratado com feedback visual.
- Não criar sub-pastas dentro de `pages/` (exceto `admin/` que já existe).
- Lógica de negócio complexa deve ser extraída para um custom hook em `hooks/`.
- Rotas protegidas usam os guards em `routes/guards.tsx` — não reimplementar proteção de rota na página.
