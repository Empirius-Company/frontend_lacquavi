# CLAUDE.md — `src/hooks/`

## Responsabilidade

Custom hooks React que encapsulam lógica reutilizável de estado e efeitos colaterais.

## Arquivos

| Hook | Descrição |
|------|-----------|
| `useProductsReviewStats.ts` | Agrega estatísticas de avaliações de um produto (média, total) |
| `useSEO.ts` | Atualiza `<title>`, meta tags e dados estruturados por página |

## Regras

- Hooks seguem a convenção `use<NomeEmPascalCase>`.
- Não fazem chamadas HTTP diretas — usam funções de `src/api/`.
- Retornam dados e handlers, nunca JSX.
- Tipagem explícita no retorno — sem `any`.
- Estado derivado deve ser calculado dentro do hook, não na página.
