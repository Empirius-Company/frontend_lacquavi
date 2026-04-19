# CLAUDE.md — `src/config/`

## Responsabilidade

Constantes de configuração da aplicação. Centraliza valores que variam por ambiente ou que são usados em múltiplos lugares.

## Arquivos

| Arquivo | Conteúdo |
|---------|----------|
| `store.ts` | Dados da loja física: endereço, horários, coordenadas |
| `contactConfig.ts` | Canais de contato: WhatsApp, e-mail, redes sociais |

## Regras

- Valores hardcoded que aparecem em mais de um componente **devem** vir daqui.
- Variáveis de ambiente (`VITE_*`) ficam em `.env` — não duplicar aqui.
- Não importar nada de `src/api/` nesta pasta.
- Exportar como `const` nomeadas, não `default`.
