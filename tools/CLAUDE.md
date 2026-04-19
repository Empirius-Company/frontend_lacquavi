# CLAUDE.md — `tools/`

## Responsabilidade

Scripts de desenvolvimento e utilitários usados localmente — não fazem parte do bundle de produção.

## Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `seo-check.js` | Verifica presença de meta tags SEO nas páginas geradas |

## Regras

- Scripts são executados via `node tools/<arquivo>.js` ou via `package.json` scripts.
- Não importar módulos de `src/` — são ambientes diferentes (Node.js vs. browser).
- Manter dependências mínimas; preferir APIs nativas do Node.
