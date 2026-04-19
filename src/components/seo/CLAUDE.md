# CLAUDE.md — `src/components/seo/`

## Responsabilidade

Componentes e utilitários de SEO: dados estruturados (Schema.org), imagens lazy e otimização de performance.

## Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `SchemaComponents.tsx` | Injeta JSON-LD (Product, BreadcrumbList, Organization) via `<script>` |
| `LazyImage.tsx` | Imagem com lazy loading, placeholder e `srcset` para diferentes resoluções |
| `index.ts` | Barrel export dos componentes deste diretório |

## Regras

- `SchemaComponents` é renderizado apenas no `<head>` — não usar em corpo de página fora do lugar correto.
- `LazyImage` deve substituir `<img>` em qualquer imagem que não esteja acima do fold.
- Não adicionar lógica de negócio aqui — apenas transformação de dados para markup SEO.
- Consultar `docs/SEO-IMPLEMENTACAO-CONCLUIDA.md` antes de alterar schemas.
