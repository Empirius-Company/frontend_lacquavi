# CLAUDE.md — `src/components/product/`

## Responsabilidade

Componentes específicos de produto. Recebem dados via props — não buscam dados da API diretamente.

## Componentes

| Arquivo | Descrição |
|---------|-----------|
| `ProductCard.tsx` | Card de produto usado em grids e listagens. Recebe `Product` como prop. |
| `ProductCarousel.tsx` | Carrossel de produtos em destaque (home, relacionados) |
| `QuickAddModal.tsx` | Modal de adição rápida ao carrinho sem sair da listagem |

## Regras

- Imagens de produto: sempre usar `getProductPrimaryImageUrl()` de `src/utils/productImages.ts`.
- `ProductCard` deve permanecer leve — lógica complexa vai em `QuickAddModal` ou na página.
- Props obrigatórias tipadas com interfaces de `src/types/` — nunca `any`.
- Eventos de carrinho disparam funções do `CartContext` — não chamar `cartApi` diretamente.
