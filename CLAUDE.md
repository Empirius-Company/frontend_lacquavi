# CLAUDE.md — Frontend

## Responsabilidade

SPA React que serve como interface do e-commerce Lacqua. Consome a API REST do backend via proxy Vite (dev) ou URL direta (prod).

## Stack

- React 18 + TypeScript 5 (strict)
- Vite 5 (bundler)
- Tailwind CSS 3 (design system customizado)
- React Router v6
- Axios (HTTP client com interceptors JWT)

## Estrutura de `src/`

```
src/
├── api/           # Clientes HTTP por domínio
├── components/    # Componentes reutilizáveis (layout, product, ui)
├── context/       # Estado global (Auth, Cart, Toast)
├── hooks/         # Custom hooks
├── pages/         # Componentes de página (1 arquivo por rota)
│   └── admin/     # Painel administrativo
├── routes/        # Definição de rotas e guards
├── types/         # Interfaces TypeScript alinhadas com a API
├── utils/         # Formatadores, helpers, image pipeline
├── config/        # Constantes de configuração
└── styles/        # CSS global + variáveis Tailwind
```

## Design System

Cores da marca (definidas em `tailwind.config.js`):
- `vino-800`: #8c2f4a — CTA principal
- `champagne-500`: #c9a26a — destaque dourado
- `cream`: #F9F5F0 — fundo principal
- `obsidian-950`: #18130f — fundos escuros
- `ink`: #0D0B09 — texto

Fontes: `Inter` (UI), `Cormorant Garamond` (display/títulos)

Classes utilitárias customizadas: `.btn-primary`, `.card-luxury`, `.input-luxury`, `.badge-gold`

## Regras

- **Nunca** usar `any` em TypeScript sem comentário explicativo.
- Componentes de UI genéricos ficam em `components/ui/index.tsx`.
- Cada página tem seu próprio arquivo em `pages/`. Não criar sub-pastas por página.
- Estado global apenas via Context API — não adicionar Redux ou Zustand.
- Imagens de produto: usar sempre `getProductPrimaryImageUrl()` de `utils/productImages.ts`.
- Não fazer chamadas HTTP fora dos arquivos em `src/api/`.

## Path alias

```ts
import { Button } from '@/components/ui'  // @ → src/
```

## Variáveis de ambiente

```
VITE_API_BASE_URL=http://localhost:3000
```
