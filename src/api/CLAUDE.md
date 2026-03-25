# CLAUDE.md — `src/api/`

## Responsabilidade

Camada de comunicação HTTP do frontend. Todos os acessos à API REST do backend passam por aqui.

## Arquivos

| Arquivo | Domínio |
|---------|---------|
| `httpClient.ts` | Instância Axios base com interceptors JWT |
| `authApi.ts` | Login, registro, perfil, refresh token |
| `catalogApi.ts` | Produtos e categorias |
| `bannerApi.ts` | Banners promocionais |
| `storageApi.ts` | Operações de storage |
| `index.ts` | Barrel export (orders, payments, coupons, health) |

## Padrão

Cada módulo exporta um objeto com métodos nomeados:

```ts
export const catalogApi = {
  list: (): Promise<ProductsResponse> =>
    httpClient.get<ProductsResponse>('/products'),

  getById: (id: string): Promise<ProductResponse> =>
    httpClient.get<ProductResponse>(`/products/${id}`),
}
```

## `httpClient.ts`

- Instância Axios com `baseURL` da variável de ambiente
- **Interceptor de request**: anexa `Authorization: Bearer <token>` do `localStorage`
- **Interceptor de response**: em 401, tenta refresh token; se falhar, faz logout e redireciona para `/login`

## Regras

- **Nunca** usar `axios` ou `fetch` diretamente nos componentes/páginas.
- Sempre tipar o retorno com interfaces de `src/types/`.
- Erros HTTP são propagados como exceções — o componente trata com `try/catch` ou `.catch()`.
- Não adicionar lógica de negócio aqui, apenas chamadas HTTP.
