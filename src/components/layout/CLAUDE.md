# CLAUDE.md — `src/components/layout/`

## Responsabilidade

Componentes estruturais que formam o esqueleto visual da aplicação. Usados em todos (ou quase todos) os layouts de página.

## Componentes

| Arquivo | Descrição |
|---------|-----------|
| `Header.tsx` | Navegação principal, badge do carrinho, menu do usuário, comportamento de scroll |
| `Footer.tsx` | Rodapé com links, informações e SEO footer |
| `MiniCart.tsx` | Dropdown de prévia do carrinho acionado pelo Header |
| `LoginModal.tsx` | Modal de autenticação (login/registro) |
| `index.tsx` | Exporta `MainLayout` (cliente) e `AdminLayout` (admin) |

## Regras

- Nenhum componente aqui faz chamada HTTP direta — usam Context (`AuthContext`, `CartContext`).
- Mudanças no `Header` afetam todas as páginas — testar em mobile e desktop.
- `MainLayout` e `AdminLayout` são os únicos pontos de montagem do `Header` e `Footer`.
