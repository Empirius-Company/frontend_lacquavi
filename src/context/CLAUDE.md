# CLAUDE.md — `src/context/`

## Responsabilidade

Estado global da aplicação via React Context API. Três contextos independentes.

## Contextos

### `AuthContext.tsx`

Gerencia sessão do usuário.

- Armazena: `user`, `accessToken`, `isAuthenticated`, `isAdmin`
- Funções expostas: `login()`, `logout()`, `refreshToken()`
- Token de acesso no `localStorage`; refresh token em cookie HttpOnly
- Em 401, o `httpClient` chama `refreshToken()` automaticamente

### `CartContext.tsx`

Gerencia o carrinho de compras.

- Estado persistido no `localStorage`
- Padrão reducer (Redux-like) com actions: `ADD_ITEM`, `REMOVE_ITEM`, `UPDATE_QUANTITY`, `CLEAR_CART`
- Funções expostas: `addItem()`, `removeItem()`, `updateQuantity()`, `clearCart()`
- Calcula automaticamente: `itemCount`, `subtotal`

### `ToastContext.tsx`

Sistema de notificações.

- Funções expostas: `showToast(message, type)` — tipos: `success`, `error`, `info`
- Toasts somem automaticamente após timeout
- Renderizados pelo `App.tsx` globalmente

## Como consumir

```tsx
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { useToast } from '@/context/ToastContext'

function MyComponent() {
  const { user, isAuthenticated } = useAuth()
  const { addItem, itemCount } = useCart()
  const { showToast } = useToast()
}
```

## Regras

- Não adicionar novos contextos sem necessidade clara de estado global.
- Dados de servidor (produtos, pedidos) **não** ficam em Context — são estado local de cada página.
- Context é para estado de sessão, carrinho e notificações apenas.
- Provedores são aninhados em `App.tsx` na ordem: `AuthProvider > CartProvider > ToastProvider`.
