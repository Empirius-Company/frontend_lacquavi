# Frete Melhor Envio — Documentação Ponta a Ponta

> Estado desta documentação: **Mar/2026**
> 
> Este documento descreve a implementação **real em produção de código** no backend Lacqua para frete/etiquetas via Melhor Envio.

## 1) Objetivo

Cobrir todo o ciclo de frete no backend:
- cotação de frete no checkout,
- seleção de serviço,
- compra de etiqueta,
- rastreio por webhook,
- retries automáticos via worker,
- OAuth/token lifecycle,
- segurança, observabilidade e troubleshooting.

---

## 2) Arquitetura funcional

### 2.1 Camadas
- **Rotas/controllers**: recebem requests e retornam resposta HTTP.
- **`shippingService`**: regras de negócio (ownership, validade de cotação, lock, retries).
- **`melhorEnvioProvider`**: integração HTTP com Melhor Envio (mock e real).
- **Prisma/Postgres**: persistência de cotações, shipments e eventos.
- **Shipping worker**: processa shipments pendentes/falhos em background.
- **OAuth service + token store**: emissão/refresh de token e armazenamento seguro em runtime.

### 2.2 Arquivos principais
- `apps/api/src/routes/shippingRoutes.js`
- `apps/api/src/routes/shippingWebhookRoutes.js`
- `apps/api/src/controllers/shippingController.js`
- `apps/api/src/services/shipping/shippingService.js`
- `apps/api/src/services/shipping/providers/melhorEnvioProvider.js`
- `apps/api/src/services/shipping/shippingWorkerService.js`
- `apps/api/src/services/shipping/melhorEnvioOAuthService.js`
- `apps/api/src/services/shipping/melhorEnvioTokenStore.js`
- `prisma/schema.prisma`

---

## 3) Modelo de dados (Prisma)

## 3.1 Campos de logística em `Order`/`OrderItem`

### `Order`
- `shippingProvider`
- `shippingServiceCode`
- `shippingServiceName`
- `shippingQuoteId`
- `shippingAmountCents`
- `shippingDiscountCents`
- `shippingDestinationZip`
- `shippingAddressHash`

### `OrderItem`
Snapshot físico por item no momento do pedido:
- `requiresShipping`
- `weightGrams`
- `lengthCm`
- `widthCm`
- `heightCm`

## 3.2 `ShipmentQuote`
Armazena a cotação retornada pelo provider:
- identificação: `id`, `orderDraftId`, `provider`
- serviço: `serviceCode`, `serviceName`, `priceCents`, `deliveryDays`
- pacote consolidado: `packageWeightGrams`, `packageLengthCm`, `packageWidthCm`, `packageHeightCm`
- consistência: `addressHash`, `requestHash`, `expiresAt`, `invalidatedAt`
- bruto provider: `payload`

## 3.3 `Shipment`
Execução da etiqueta e status operacional:
- identificação: `id`, `orderId`, `provider`
- provider ids: `providerShipmentId`, `providerLabelId`, `trackingCode`
- status: `pending`, `label_purchased`, `posted`, `in_transit`, `delivered`, `failed`, `cancelled`
- etiqueta: `labelUrl`, `labelPdfUrl`
- pacote: pesos/dimensões consolidadas
- resiliência: `retryCount`, `nextRetryAt`, `lastAttemptAt`, `dlqAt`, `lastError`
- metadata enxuta: `metadata`

## 3.4 `ShipmentEvent`
Histórico de eventos de rastreio:
- `providerEventId` (deduplicação)
- `eventType`, `description`, `occurredAt`, `payload`
- unique index: `@@unique([provider, providerEventId])`

---

## 4) Endpoints e contratos

## 4.1 Cotação
`POST /shipping/quotes` (auth: customer/admin)

Body:
```json
{
  "orderId": "<uuid>",
  "destination": {
    "zip": "88010-000",
    "street": "Rua Teste",
    "number": "100",
    "complement": "Apto 1",
    "district": "Centro",
    "city": "Florianopolis",
    "state": "SC"
  }
}
```

Resposta:
```json
{
  "quotes": [
    {
      "quoteId": "<uuid>",
      "provider": "MELHOR_ENVIO",
      "serviceCode": "2",
      "serviceName": "SEDEX",
      "priceCents": 2372,
      "deliveryDays": 6,
      "expiresAt": "2026-03-03T20:15:00.000Z"
    }
  ]
}
```

## 4.2 Seleção
`POST /shipping/selection` (auth: customer/admin)

Body:
```json
{
  "orderId": "<uuid>",
  "quoteId": "<uuid>",
  "destination": {
    "zip": "88010-000",
    "street": "Rua Teste",
    "number": "100",
    "complement": "Apto 1",
    "district": "Centro",
    "city": "Florianopolis",
    "state": "SC"
  }
}
```

Resposta:
```json
{
  "message": "Frete selecionado com sucesso",
  "selection": {
    "orderId": "<uuid>",
    "quoteId": "<uuid>",
    "serviceCode": "2",
    "serviceName": "SEDEX",
    "shippingAmountCents": 2372,
    "shippingDiscountCents": 0,
    "total": 323.62
  }
}
```

## 4.3 Consulta de shipment
`GET /shipping/orders/:id/shipment` (auth: customer/admin)

Compatibilidade também disponível em `GET /orders/:id/shipment`.

## 4.4 Compra de etiqueta
`POST /shipping/orders/:id/label` (auth: **admin**) 

Regras:
- precisa `shippingQuoteId` selecionada,
- pagamento aprovado (`paymentStatus = paid`) para usuário não-admin,
- para admin, fluxo operacional pode forçar processamento.

## 4.5 Cancelamento
`POST /shipping/orders/:id/cancel` (auth: **admin**)

## 4.6 Webhook de rastreio
`POST /webhooks/shipping/melhor-envio` (sem auth JWT)
- protegido por `webhookRateLimit`,
- exige assinatura HMAC válida,
- responde `202` para processado/ignorado.

Header aceito:
- `x-melhorenvio-signature` (prioritário)
- `x-signature` (fallback)

---

## 5) Fluxo de negócio ponta a ponta

## 5.1 Cotação (`createQuotes`)
1. Valida `orderId`.
2. Valida ownership (`customer` só no próprio pedido; `admin` pode todos).
3. Normaliza CEP destino.
4. Carrega itens físicos do pedido (`requiresShipping=true`).
5. Consolida todos os itens em **1 volume**:
   - peso = soma dos pesos,
   - comprimento/largura = maiores dimensões + 1,
   - altura = soma das menores dimensões + 1.
6. Calcula `requestHash` (snapshot carrinho) e `addressHash` (snapshot destino).
7. Invalida cotações anteriores ainda válidas.
8. Chama provider (`quote`) e persiste `ShipmentQuote` com TTL.

## 5.2 Seleção (`selectQuote`)
1. Valida ownership.
2. Busca quote e contexto do pedido.
3. Rejeita quote inexistente, inválida ou expirada.
4. Recalcula `requestHash` e `addressHash`; se divergir, invalida quote.
5. Atualiza `Order` com frete escolhido e recalcula `total`.

## 5.3 Compra de etiqueta (`createLabelForOrder` + `processPendingShipment`)
1. Garante acesso ao pedido.
2. Garante quote selecionada.
3. Sobe/recupera `Shipment` pendente (se pagamento aprovado).
4. Aplica **lease** de processamento (lock otimista por janela) para evitar dupla compra.
5. Revalida hash de carrinho e endereço antes de comprar.
6. Chama provider `buyLabel`.
7. Em sucesso:
   - salva IDs de provider,
   - `trackingCode`, `labelUrl`,
   - status `label_purchased`,
   - zera retry/DLQ.
8. Em falha:
   - incrementa `retryCount`,
   - agenda `nextRetryAt` com backoff,
   - move para DLQ quando permanente ou excede máximo.

## 5.4 Rastreio via webhook (`processTrackingWebhook`)
1. Extrai `providerEventId`, `trackingCode`, `providerLabelId`.
2. Se payload de validação (sem ids), ignora com `202`.
3. Valida assinatura HMAC (`timingSafeEqual`).
4. Localiza `Shipment` por tracking/label.
5. Salva evento deduplicado (`providerEventId`).
6. Mapeia status para enum interno e atualiza shipment.

---

## 6) Integração com Melhor Envio (provider)

## 6.1 Modo mock vs real
- `MELHOR_ENVIO_MOCK=true`: simulação local de quote/label/track.
- `MELHOR_ENVIO_MOCK=false`: chamadas reais HTTP no `MELHOR_ENVIO_BASE_URL`.

## 6.2 Fluxo real de etiqueta
Com `MELHOR_ENVIO_MOCK=false`, o provider executa:
1. `POST /cart`
2. `POST /shipment/checkout`
3. `POST /shipment/generate`
4. `POST /shipment/print`

## 6.3 Timeout/retry
Todas as chamadas externas usam:
- timeout por request (`MELHOR_ENVIO_HTTP_TIMEOUT_MS`, default 12s),
- retry exponencial com jitter (`MELHOR_ENVIO_HTTP_RETRY_MAX`, `MELHOR_ENVIO_HTTP_RETRY_BASE_MS`),
- retry para status transitórios (408, 425, 429, 5xx).

## 6.4 Mapeamento de status
Provider -> interno:
- `posted` -> `posted`
- `in_transit`/`em_transito` -> `in_transit`
- `delivered`/`entregue` -> `delivered`
- `cancelled` -> `cancelled`
- `failed`/`erro` -> `failed`
- default -> `label_purchased`

---

## 7) OAuth e token lifecycle

## 7.1 Endpoints
- `GET /auth/melhor-envio/connect` (admin): gera URL OAuth com `state`.
- `GET /auth/melhor-envio/callback` (público): troca `code` por token e valida `state`.

## 7.2 Segurança de OAuth
- `state` aleatório com TTL (`MELHOR_ENVIO_OAUTH_STATE_TTL_MS`), consumo único.
- Callback sem `state` válido falha com `MELHOR_ENVIO_OAUTH_STATE_INVALID`.

## 7.3 Persistência de token
- Não grava em `.env`.
- Persiste em store criptografado runtime (`.runtime-secrets/melhor-envio-token-store.json`) via AES-256-GCM.
- Chave: `MELHOR_ENVIO_TOKEN_STORE_KEY`.

## 7.4 Refresh automático
- `getValidAccessToken()` usa token atual.
- Se perto de expirar, executa `refresh_token` automaticamente.
- Skew configurável: `MELHOR_ENVIO_REFRESH_SKEW_SECONDS`.

---

## 8) Segurança implementada

- **Autorização de domínio**: customer só opera no próprio pedido (`ORDER_FORBIDDEN`).
- **Webhook com assinatura obrigatória**: sem secret em produção é erro.
- **Comparação timing-safe** para assinatura HMAC.
- **Rate limit no webhook** para proteção de flood.
- **Guard rails em produção**:
  - exige envs críticos,
  - bloqueia `MELHOR_ENVIO_MOCK=true` em produção,
  - exige token de acesso ou refresh token.

---

## 9) Worker e operação

- Worker de shipping é habilitado por `ENABLE_SHIPPING_WORKER=true`.
- Polling configurável:
  - `SHIPPING_WORKER_POLL_MS` (default 10s)
  - `SHIPPING_WORKER_BATCH_SIZE` (default 20)
- A cada ciclo:
  1. cria shipments pendentes para pedidos pagos sem shipment,
  2. busca shipments due (`pending`/`failed`, fora de DLQ),
  3. processa compra de etiqueta.

---

## 10) Variáveis de ambiente

## 10.1 Obrigatórias (mínimo funcional)
- `MELHOR_ENVIO_MOCK`
- `MELHOR_ENVIO_BASE_URL`
- `MELHOR_ENVIO_ACCESS_TOKEN` (ou fluxo OAuth + refresh)
- `MELHOR_ENVIO_FROM_POSTAL_CODE`
- `MELHOR_ENVIO_WEBHOOK_SECRET`

## 10.2 OAuth
- `MELHOR_ENVIO_CLIENT_ID`
- `MELHOR_ENVIO_CLIENT_SECRET`
- `MELHOR_ENVIO_REDIRECT_URI`
- `MELHOR_ENVIO_OAUTH_BASE_URL` (default `https://www.melhorenvio.com.br`)
- `MELHOR_ENVIO_TOKEN_STORE_KEY` (obrigatória em produção)

## 10.3 Resiliência
- `SHIPPING_QUOTE_TTL_MINUTES`
- `SHIPPING_LABEL_MAX_RETRIES`
- `SHIPPING_LABEL_RETRY_BASE_MS`
- `SHIPPING_PROCESSING_LEASE_MS`
- `MELHOR_ENVIO_HTTP_TIMEOUT_MS`
- `MELHOR_ENVIO_HTTP_RETRY_MAX`
- `MELHOR_ENVIO_HTTP_RETRY_BASE_MS`

## 10.4 Endereço remetente/destinatário (provider)
- `MELHOR_ENVIO_FROM_*` (name, phone, email, document, address, number, district, city, state_abbr, etc.)
- `MELHOR_ENVIO_TO_*` (fallback para payload)

---

## 11) Sandbox x produção

## 11.1 Sandbox
Exemplo de base:
- `MELHOR_ENVIO_BASE_URL=https://sandbox.melhorenvio.com.br/api/v2/me`

## 11.2 Produção
Exemplo de base:
- `MELHOR_ENVIO_BASE_URL=https://www.melhorenvio.com.br/api/v2/me`

## 11.3 Regra crítica
Token, OAuth app e base URL precisam estar no **mesmo ambiente**.
- Token de sandbox com base `www` => `401 Unauthenticated`.
- OAuth app inválido => `invalid_client`.

---

## 12) Script de validação ponta a ponta

Arquivo:
- `apps/api/scripts/shipping-smoke.js`

Executar:
```bash
cd apps/api
node scripts/shipping-smoke.js
```

Passos do script:
1. login,
2. cria produto físico,
3. cria pedido,
4. cota frete,
5. seleciona frete,
6. cria etiqueta,
7. envia webhook assinado,
8. valida status final.

Saída esperada:
- `SMOKE_OK` com `orderId`, `quoteId`, `trackingCode`, `finalStatus`.

---

## 13) Erros comuns e correção rápida

### `MELHOR_ENVIO_FROM_POSTAL_CODE não configurado`
- Falta CEP de origem no `.env`.

### `Unauthenticated.` em quote/carrinho
- Token inválido para a base atual (sandbox/prod cruzados) ou token expirado.

### `invalid_client` no callback OAuth
- `client_id/client_secret` do app OAuth não aceitos.
- `redirect_uri` não bate exatamente com a configurada no painel.

### `SHIPPING_WEBHOOK_INVALID_SIGNATURE`
- Assinatura não confere com `MELHOR_ENVIO_WEBHOOK_SECRET`.

### `SHIPPING_QUOTE_CART_CHANGED` / `SHIPPING_QUOTE_ADDRESS_CHANGED`
- Carrinho/endereço mudou após cotação; gerar nova quote.

### `SHIPPING_NO_PHYSICAL_ITEMS`
- Pedido só com itens digitais (`requiresShipping=false`).

---

## 14) Checklist de go-live

- [ ] `MELHOR_ENVIO_MOCK=false`
- [ ] base URL alinhada ao ambiente correto
- [ ] token válido no mesmo ambiente
- [ ] webhook cadastrado com secret e endpoint público
- [ ] `MELHOR_ENVIO_TOKEN_STORE_KEY` configurada
- [ ] worker habilitado (`ENABLE_SHIPPING_WORKER=true`)
- [ ] smoke test com `SMOKE_OK`
- [ ] monitorar logs de `Falha ao comprar etiqueta` e `Webhook inválido`

---

## 15) Resultado atual no projeto

- Fluxo de frete/etiqueta validado em sandbox ponta a ponta.
- Segurança hardening aplicado (authz, webhook strict, OAuth state, token store criptografado).
- Operação com retry/backoff, DLQ e lock de processamento.
- Script de smoke cobrindo o fluxo principal e webhook assinado.
