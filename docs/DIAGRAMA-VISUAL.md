# 📊 Diagrama: Como Funciona a Estratégia SEO Completa

## 1️⃣ PESSOA BUSCA NO GOOGLE

```
┌──────────────────────────────┐
│ Busca: "perfume original BH" │
└──────────────────────────────┘
           ↓
        Google
        Analisa
           ↓
┌────────────────────────────────────┐
│  1. Relevância (Meta tags + Schema) │
│  2. Velocidade (Core Web Vitals)   │
│  3. Autoridade (Reviews + Links)   │
│  4. Engajamento (CTR + Tempo)      │
└────────────────────────────────────┘
           ↓
    Ranking nos resultados
```

---

## 2️⃣ ESTRUTURA TÉCNICA IMPLEMENTADA

```
FRONTEND (React + TypeScript)
│
├─ index.html
│  ├─ Meta tags <title>, <description>
│  ├─ Open Graph (redes sociais)
│  ├─ Twitter Card (Twitter/X)
│  ├─ Schema.org JSON-LD (LocalBusiness)
│  └─ Favicon (ícone com logo Lacqua)
│
├─ public/
│  ├─ robots.txt → Guia para Google crawler
│  ├─ sitemap.xml → Mapa de URLs
│  ├─ manifest.json → PWA app
│  ├─ schema.json → Dados estruturados
│  └─ .htaccess → Headers de segurança
│
├─ src/hooks/useSEO.ts
│  └─ Hook React para meta dinâmicas por página
│
├─ vercel.json
│  └─ Headers HTTP otimizados (Vercel)
│
└─ docs/
   ├─ SEO-IMPLEMENTATION.md
   ├─ SEO-IMPLEMENTATION-EXAMPLES.md
   ├─ STRATEGY-SEO-ATRACTION.md
   ├─ SITEMAP-GENERATOR.md
   ├─ QUICK-START.md
   └─ SEO-REFERENCIA-RAPIDA.md

BACKEND (Express + Node.js)
│
└─ routes/sitemaps.js (PRÓXIMO)
   ├─ GET /api/sitemaps/index.xml (dinâmico)
   ├─ GET /api/sitemaps/pages.xml
   ├─ GET /api/sitemaps/products-X.xml
   └─ GET /api/sitemaps/categories.xml
```

---

## 3️⃣ JORNADA DO USUÁRIO (COM SEO)

```
┌─────────────────┐
│ Pessoa busca BH │
│  "perfume"      │
└────────┬────────┘
         │
         ↓
    ┌───────────────────┐
    │  Google processa  │ ← HTML meta tags
    │  Relevância       │ ← Schema.org
    │  Qualidade        │ ← Google Business
    │  Local            │ ← Localização
    └────────┬──────────┘
         │
         ↓
    ┌──────────────────────────────┐
    │ RESULTADO DO GOOGLE          │
    │ ┌───────────────────────────┐│
    │ │🌟 Lacqua Minas Shopping   ││
    │ │Fragrâncias premium original││
    │ │📍 Minas Shopping, BH | ⭐4.8│
    │ │🎯 lacquaminas.com.br      ││
    │ └───────────────────────────┘│
    └────────┬──────────────────────┘
         │
         ↓
    ┌────────────────────┐
    │ Clica no link +    │
    │ vê avaliações      │
    │ local em Maps      │
    └────────┬───────────┘
         │
         ↓
    ┌──────────────────────────────┐
    │ Vai à loja ou                │
    │ Compra online                │
    │ 💰 CONVERSÃO!                │
    └──────────────────────────────┘
```

---

## 4️⃣ FLUXO DE INDEXAÇÃO

```
DIA 1: Google descobre seu site
    ├─ robots.txt → "Ei Google, aqui está!"
    ├─ sitemap.xml → "Essas são todas as páginas"
    └─ Schema → "Somos loja de perfume em BH"

DIAS 2-7: Google analisa conteúdo
    ├─ Verifica meta tags ✅
    ├─ Lê schema.org ✅
    ├─ Testa velocidade ✅
    ├─ Checa mobile ✅
    └─ Indexa URLs

SEMANAS 2-4: Começa a ranquear
    ├─ Palavras-chave: 50-200ª posição
    ├─ CTR sobe conforme review melhora
    ├─ Posição ajusta dinamicamente
    └─ Dados no Google Search Console

MESES 2-6: Consolidação
    ├─ Posição sobe pra 10-50
    ├─ Google vê engagement
    ├─ Links/backlinks aumentam
    └─ Autoridade cresce

MESES 6-12: Solidificação
    ├─ Top 3 para keywords principais
    ├─ Brand recognition sobe
    ├─ Traffic orgânico forte
    └─ ROI positivo
```

---

## 5️⃣ O QUE CADA ARQUIVO FAZ

### `index.html` (NÚCLEO)
```html
<!-- TITULO: Aparece no Google + aba do navegador -->
<title>Lacqua Minas Shopping | Fragrâncias Premium - Perfumaria Luxo BH</title>

<!-- DESCRIÇÃO: 160 caracteres que aparecem embaixo do título no Google -->
<meta name="description" content="Lacqua Minas Shopping - Fragrâncias premium...">

<!-- OPEN GRAPH: Quando compartilha no WhatsApp/Instagram -->
<meta property="og:title" content="...">
<meta property="og:image" content="...">

<!-- SCHEMA.ORG: Google entende natureza do negócio -->
<script type="application/ld+json">
{
  "@type": "LocalBusiness",
  "name": "Lacqua Minas Shopping",
  "address": "Minas Shopping, BH",
  "telephone": "+55 31 ...",
  ...
}
</script>

<!-- FAVICON: Ícone da aba -->
<link rel="icon" href="data:image/svg+xml,...">
```

### `robots.txt` (INSTRUÇÕES)
```
User-agent: *
Allow: /                        # Permite tudo
Disallow: /admin                # Menos admin
Sitemap: https://.../sitemap.xml # Onde está o mapa
```

### `sitemap.xml` (MAPA)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset>
  <url>
    <loc>https://lacquaminas.com.br/</loc>
    <lastmod>2026-04-15</lastmod>
    <priority>1.0</priority>      <!-- Mais importante -->
  </url>
  <url>
    <loc>https://lacquaminas.com.br/products</loc>
    <priority>0.9</priority>
  </url>
  ...
</urlset>
```

### `manifest.json` (APP PWA)
```json
{
  "name": "Lacqua Minas Shopping - Fragrâncias Premium",
  "short_name": "Lacqua",
  "icons": [...],
  "start_url": "/",
  "display": "standalone"  // Abre como app, não navegador
}
```

### `useSEO.ts` (DINÂMICO NO REACT)
```typescript
// Importa em qualquer página importante
import { useSEO } from '@/hooks/useSEO';

export function ProductPage() {
  useSEO({
    title: "Perfume X | Lacqua",
    description: "Descrição do produto...",
    image: product.image,
    type: "product"  // Schema type específico
  });
  
  // Atualiza automaticamente meta tags
  // Cada produto tem suas meta tags próprias!
}
```

---

## 6️⃣ CHECKLIST: PRÓXIMOS 7 DIAS

### DIA 1 (AGORA)
- [ ] Ler QUICK-START.md
- [ ] Validar tudo com `node frontend/tools/seo-check.js`
- [ ] Copiar código da meta tag Google Search Console

### DIA 2
- [ ] Atualizar `index.html` com seu código Google
- [ ] Criar conta Google Business Profile
- [ ] Começar a preencher informações

### DIA 3
- [ ] Verificar no Google Search Console
- [ ] Submeter sitemap
- [ ] Monitorar "Resultados da Pesquisa"

### DIA 4-5
- [ ] Coletar 5+ avaliações de clientes
- [ ] Postar 5 fotos da loja / produtos
- [ ] Responder às reviewsexistentes

### DIA 6-7
- [ ] Criar 1º post de blog
- [ ] Publicar no Instagram (4+ posts)
- [ ] Compartilhar no TikTok

---

## 7️⃣ MÉTRICAS PARA MONITORAR

### No Google Search Console (2x/semana)
```
IMPRESSÕES (visibilidade)
└─ Alvo: 100+ impressões na 1ª semana
└─ Alvo: 1000+ impressões em 3 meses
└─ Alvo: 10000+ em 12 meses

CLIQUES (tráfego)
└─ Alvo: 10+ cliques na 1ª semana
└─ Alvo: 500+ cliques em 3 meses

CTR (qualidade do título/descrição)
└─ Alvo: >3% em 6 meses

POSIÇÃO (ranking)
└─ Semana 1: posição 50-200
└─ Mês 2-3: posição 10-50
└─ Mês 6-12: posição 1-3 (top keywords)
```

### No Google Analytics 4
```
USUÁRIOS ÚNICOS
└─ Alvo: crescimento 10%/mês

SESSÕES ORGÂNICAS
└─ Alvo: 50% do tráfego é orgânico (Google)

TAXA REJEIÇÃO
└─ Alvo: <60%

CONVERSÃO
└─ Alvo: 2-5% de cliques em compra
```

---

## 8️⃣ DIFERENÇA ANTES vs DEPOIS

### ANTES (Sem SEO)
```
┌──────────────────────────────┐
│ Pessoa busca: "perfume BH"   │
├──────────────────────────────┤
│ Resultados do Google:        │
│ 1. Site genérico de perfume  │
│ 2. Wikipedia sobre perfume   │
│ 3. Loja concorrente          │
│ 4. Artigo de blog genérico   │
│ 5. ...                       │
│ 100. Lacqua (em algum lugar) │
│ ❌ Ninguém encontra vocês!   │
└──────────────────────────────┘
```

### DEPOIS (Com SEO)
```
┌──────────────────────────────┐
│ Pessoa busca: "perfume BH"   │
├──────────────────────────────┤
│ Resultados do Google:        │
│ 🌟 Lacqua Minas Shopping     │
│ Fragrâncias premium original │
│ 📍 Minas Shopping | ⭐⭐⭐⭐⭐│
│ ✅ PRIMEIRO RESULTADO!       │
│                              │
│ Clica → vai à loja / compra  │
│ 💰 VENDA!                    │
└──────────────────────────────┘
```

---

## 9️⃣ PRÓXIMOS PASSOS APÓS SEO BÁSICO

```
SEMANA 1-2: Indexação + Basics
└─ ✅ FEITO (está aqui em cima)

SEMANA 3-4: Conteúdo
├─ Post 1: "Como escolher perfume"
├─ Post 2: "Diferença entre Eau de Toilette e Eau de Parfum"
└─ Post 3: "Melhores perfumes 2026"

SEMANA 5-8: Engajamento
├─ Instagram: 4+ posts/semana
├─ TikTok: 2+ vídeos/semana
├─ Newsletter: 2x por mês
└─ Blog: 1-2 posts por semana

MÊS 3+: Expansão
├─ Contatar influenciadores locais
├─ Parcerias com outras lojas
├─ Google Ads opcional (R$500+)
└─ Análise competitiva

MESES 6-12: Dominação
├─ Você é #1 em "perfume BH"
├─ Brand awareness alto
├─ Tráfego orgânico forte
└─ Retorno financeiro positivo
```

---

## 🔟 CONCLUSÃO

Você agora tem:
✅ **Estrutura técnica completa** para Google entender seu site  
✅ **Meta tags otimizadas** que aparecem bonito nas buscas  
✅ **Schema.org** que gera rich snippets (estrelas, avaliações)  
✅ **Favicon e PWA** pra parecer profissional  
✅ **Documentação completa** pra sua equipe entender  
✅ **Próximos passos claros** pra continuar crescendo  

**Próximo:** Leia `STRATEGY-SEO-ATRACTION.md` pra executar tudo passo-a-passo!

---

**Este diagrama foi atualizado**: Abril 2026  
**Objetivo**: Lacqua Minas Shopping #1 no Google para "perfume BH" em 12 meses
