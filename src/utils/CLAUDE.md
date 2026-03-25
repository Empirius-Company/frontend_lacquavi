# CLAUDE.md — `src/utils/`

## Responsabilidade

Funções auxiliares puras e utilitários sem estado.

## Arquivos

### `index.ts`
- `formatCurrency(value)` — formata número como BRL (R$ 99,90)
- `formatDate(date)` — formata datas para pt-BR
- `generateUUID()` — gerador de UUID v4
- `getStatusLabel(status)` / `getStatusColor(status)` — mapeamentos de status de pedido/pagamento para texto e cor

### `productImages.ts`
- `getProductPrimaryImageUrl(product)` — retorna a URL da imagem primária (`isPrimary: true`) ou a primeira imagem disponível. **Sempre usar esta função** ao exibir imagens de produto.

### `imagePipeline.ts`
- Processamento e otimização de URLs de imagem (Cloudinary transformations)

### `shippingLabelError.ts`
- Formata mensagens de erro de geração de etiqueta de frete para exibição ao usuário

## Regras

- Funções utilitárias são **puras** — sem side effects, sem chamadas HTTP.
- Não importar Context ou React neste diretório.
- Se uma função for usada em apenas uma página, colocá-la na própria página até precisar reutilizar.
