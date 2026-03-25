# CLAUDE.md — `src/types/`

## Responsabilidade

Interfaces TypeScript que espelham os modelos e respostas da API do backend. Ponto único de verdade para os tipos do frontend.

## Arquivo principal: `index.ts`

Contém todas as interfaces. Modelos principais:

```ts
User        — id, name, email, role, phone
Product     — id, name, slug, price, discount, stock, categoryId, images[]
Category    — id, name, slug
Order       — id, userId, status, items[], total, paymentStatus
Payment     — id, orderId, provider, status, amount
Coupon      — code, discountType, discountValue, minOrderAmount
Cart        — items[], subtotal, itemCount
```

## Regras

- Toda interface nova vai em `index.ts`. Não criar arquivos de tipo separados.
- Os tipos devem refletir o que a API realmente retorna — verificar com a resposta real antes de definir.
- Não duplicar interfaces — se um tipo já existe, reutilizá-lo.
- Interfaces de resposta seguem o padrão: `{ success: boolean; data: T }` ou `{ success: boolean; products: Product[] }`.
- Usar `interface` para objetos, `type` para unions/aliases simples.
