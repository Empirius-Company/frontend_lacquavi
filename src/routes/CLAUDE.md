# CLAUDE.md — `src/routes/`

## Responsabilidade

Definição de todas as rotas da aplicação e guards de acesso.

## Arquivos

### `AppRoutes.tsx`

Configuração central de rotas usando React Router v6. Monta a árvore de `<Route>` com layouts e guards.

### `guards.tsx`

Componentes de proteção de rota:

- **`ProtectedRoute`** — redireciona para `/login` se não autenticado
- **`AdminRoute`** — redireciona para `/` se não for admin (`role === 'admin'`)

```tsx
// Uso nos routes
<Route element={<ProtectedRoute />}>
  <Route path="/checkout" element={<CheckoutPage />} />
</Route>

<Route element={<AdminRoute />}>
  <Route path="/admin/*" element={<AdminDashboard />} />
</Route>
```

## Regras

- Toda rota que requer autenticação usa `<ProtectedRoute>`.
- Toda rota admin usa `<AdminRoute>` (que implica autenticação também).
- Não duplicar lógica de verificação de auth dentro das páginas.
- Adicionar novas rotas sempre em `AppRoutes.tsx`.
