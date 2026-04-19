# CLAUDE.md — `src/components/store/`

## Responsabilidade

Componentes relacionados à loja física Lacqua (endereço, horários, mapa, retirada em loja).

## Componentes

| Arquivo | Descrição |
|---------|-----------|
| `StoreTeaser.tsx` | Bloco de apresentação da loja física com localização e call-to-action |

## Regras

- Dados da loja (endereço, horários) vêm de `src/config/store.ts` — nunca hardcodar no componente.
- Não fazer chamadas HTTP nesta pasta.
- Manter responsivo para mobile (clientes frequentemente consultam no celular).
