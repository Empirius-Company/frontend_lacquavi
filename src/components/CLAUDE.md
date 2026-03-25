# CLAUDE.md — `src/components/`

## Responsabilidade

Componentes React reutilizáveis. Não contêm lógica de negócio nem chamadas HTTP diretas.

## Estrutura

```
components/
├── layout/     # Estrutura da página (Header, Footer, MiniCart, layouts)
├── product/    # Componentes de produto (card, carrossel, modal de adição rápida)
├── store/      # Componentes da loja física
└── ui/         # Design system (botões, inputs, badges, modais, toasts, etc.)
```

## `layout/`

- **Header.tsx** — Navegação principal, badge do carrinho, menu do usuário, comportamento de scroll
- **Footer.tsx** — Rodapé com links e informações
- **MiniCart.tsx** — Dropdown de prévia do carrinho
- **index.tsx** — Exporta `MainLayout` e `AdminLayout`

## `product/`

- **ProductCard.tsx** — Card usado no grid de produtos. Recebe `Product` como prop.
- **ProductCarousel.tsx** — Carrossel de produtos em destaque
- **QuickAddModal.tsx** — Modal de adição rápida ao carrinho

## `ui/`

Componentes do design system Lacqua. Exportados via `ui/index.tsx`.

Componentes disponíveis: `Button`, `Input`, `Badge`, `Skeleton`, `Modal`, `Toast`, `ScrollReveal`, `BestSellersHero`, `HitHero`

Sempre usar estes ao invés de elementos HTML puros para manter consistência visual.

## Regras

- Componentes são **puros** ou usam apenas hooks de estado local e Context.
- Props tipadas com interfaces TypeScript explícitas — nunca usar `any`.
- Não fazer chamadas HTTP dentro de componentes. Dados chegam via props ou Context.
- Estilização apenas com classes Tailwind. Evitar `style={{}}` inline.
- Novos componentes genéricos de UI vão em `ui/index.tsx`.
- Componentes específicos de uma página ficam dentro da própria página, não aqui.

## Exemplo de estrutura de componente

```tsx
interface ProductCardProps {
  product: Product
  onAddToCart?: (product: Product) => void
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  // ...
}
```
