# CLAUDE.md — `src/styles/`

## Responsabilidade

CSS global e variáveis base do design system. Complementa a configuração do Tailwind.

## Arquivos

| Arquivo | Conteúdo |
|---------|----------|
| `global.css` | Reset, variáveis CSS, classes utilitárias globais, import das fontes |

## Regras

- Classes globais aqui apenas para padrões que **não podem** ser expressos como utilitário Tailwind.
- Novas classes de componente ficam no próprio componente (Tailwind inline), não aqui.
- Variáveis CSS (ex.: `--color-vino`) devem ser espelhadas em `tailwind.config.js`.
- Não usar `!important` — resolver especificidade com estrutura Tailwind.
