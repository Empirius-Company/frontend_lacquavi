# CLAUDE.md — `src/pages/admin/`

## Responsabilidade

Páginas do painel administrativo da Lacqua. Acessíveis apenas por usuários com role `admin`.

## Arquivo

| Arquivo | Descrição |
|---------|-----------|
| `index.tsx` | Dashboard admin — ponto de entrada do painel |

## Proteção de Acesso

Todas as rotas desta pasta são protegidas em `src/routes/` por `authMiddleware` + verificação de role `admin`. Não adicionar checagem de role dentro das páginas.

## Regras

- Seguir as mesmas regras de `src/pages/` (um arquivo por seção, sem sub-pastas).
- Dados chegam via Context ou chamadas à `src/api/` — nunca chamadas HTTP diretas.
- Usar `AdminLayout` de `src/components/layout/index.tsx`.
