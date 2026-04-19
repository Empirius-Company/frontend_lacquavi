# CLAUDE.md — `src/components/ui/`

## Responsabilidade

Design system da Lacqua. Componentes primitivos e compostos usados em toda a aplicação para garantir consistência visual.

## Componentes (exportados via `index.tsx`)

| Componente | Descrição |
|------------|-----------|
| `Button` | Botão com variantes (primary, secondary, ghost) e estado de loading |
| `Input` | Campo de texto estilizado com label e mensagem de erro |
| `Badge` | Etiqueta para status, categorias e destaques |
| `Skeleton` | Placeholder animado para carregamento |
| `Modal` | Overlay com conteúdo genérico |
| `Toast` | Notificação temporária (sucesso, erro, info) |
| `ScrollReveal` | Animação de entrada ao scroll |
| `BestSellersHero` | Seção hero dos mais vendidos |
| `WhatsAppFloatingButton` | Botão flutuante de WhatsApp |
| `PaymentMethodIcons` | Ícones dos métodos de pagamento aceitos |

## Regras

- Novos componentes **genéricos** (não atrelados a domínio) vão em `index.tsx`.
- Usar `Button` ao invés de `<button>`, `Input` ao invés de `<input>`, etc.
- Não adicionar lógica de negócio — apenas props de apresentação.
- Variantes de estilo via Tailwind + props — nunca `style={{}}` inline.
- Não importar de `src/api/` ou `src/context/`.
