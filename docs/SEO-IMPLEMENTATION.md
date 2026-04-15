# 🎯 Guia SEO Completo - Lacqua Minas Shopping

## O que foi implementado

### 1. **Meta Tags Otimizadas** (`index.html`)
- ✅ Title otimizado com keywords principais
- ✅ Meta description com call-to-action
- ✅ Keywords relevantes para busca
- ✅ Open Graph (redes sociais)
- ✅ Twitter Card (compartilhamentos)
- ✅ Robotas e crawlers permitidos

### 2. **Schema.org Estruturado** - JSON-LD
**Benefício**: O Google entende melhor seu negócio e exibe em rich snippets

- **LocalBusiness**: Informações da loja física
  - Endereço (Minas Shopping, BH)
  - Telefone e email
  - Horários de funcionamento
  - Coordenadas geográficas
  - Avaliações agregadas

- **OnlineStore**: Plataforma de e-commerce
- **AggregateRating**: Estrelas e avaliações do negócio

### 3. **Favicon Melhorado**
- Ícone em alta resolução (192px + 512px)
- Suporte a Apple Touch e maskable
- Melhora visual no Google e navegadores

### 4. **Manifest PWA** (`manifest.json`)
- App name é mais descritivo
- Categorias de negócio
- Ícones em várias resoluções
- Suporte a Web App Install
- Shortcuts de acesso rápido

### 5. **Robots.txt** (`robots.txt`)
- ✅ Permite indexação de páginas públicas
- ✅ Bloqueia áreas administrativas
- ✅ Referencia o sitemap
- ✅ Controle de crawl-delay para bots

### 6. **Sitemap XML** (`sitemap.xml`)
- ✅ URLs das páginas principais
- ✅ Prioridades e frequência de atualização
- ✅ Categorias de produtos
- ✅ Páginas informativas

### 7. **Schema.json Detalhado** (`schema.json`)
- Grafo de dados estruturados completo
- Informações de contato e endereço
- Links para redes sociais
- Horários estendidos

### 8. **Headers de Segurança & Performance**
- ✅ Gzip compression
- ✅ Browser caching inteligente
- ✅ HSTS (HTTPS seguro)
- ✅ Proteção XSS e clickjacking

---

## 🔧 PRÓXIMAS AÇÕES NECESSÁRIAS

### 1. **Google Search Console** (CRÍTICO!)
```
1. Acesse: https://search.google.com/search-console
2. Adicione sua propriedade (lacquaminas.com.br)
3. Verifique via meta tag (atualize index.html com seu código):
   <meta name="google-site-verification" content="SEU_CODIGO_AQUI" />
4. Envie o sitemap.xml
5. Monitore Google Search Console 2x por semana
```

### 2. **Google Business Profile** (PARA MINAS SHOPPING)
```
1. Acesse: https://www.google.com/business
2. Configure sua localização:
   - Nome: Lacqua Minas Shopping
   - Endereço: Minas Shopping, Belo Horizonte
   - Telefone: +55 31 XXXX-XXXX
   - Horários de funcionamento
3. Adicione fotos + vídeos
4. Responda às avaliações
5. Poste regularmente
```

### 3. **Atualizar Dados Estruturados**
No `index.html`, no schema JSON-LD, atualize:
```json
"telephone": "+55 31 XXXX-XXXX",  // ← Seu telefone real
"email": "contato@lacquaminas.com.br",  // ← Seu email
"address": {
  "streetAddress": "Minas Shopping - Loja XX",  // ← Número da loja
  "postalCode": "30140-073"  // ← CEP correto
},
"geo": {
  "latitude": "-19.9225",  // ← Coordenadas
  "longitude": "-43.9401"
}
```

### 4. **Google PageSpeed Insights**
```
1. Teste em: https://pagespeed.web.dev/
2. Otimize Core Web Vitals
3. Minimize CSS/JS
4. Comprima imagens com Cloudinary
5. Use lazy loading para imagens
```

### 5. **Atualizar Sitemap Dinamicamente**
Crie uma rota no backend que gere o sitemap dinamicamente com todos os produtos:
```bash
GET /api/sitemap/index.xml      # Sitemap principal
GET /api/sitemap/products.xml   # Produtos (pode ter múltiplos)
GET /api/sitemap/categories.xml # Categorias
```

### 6. **Meta Tags Dinâmicas por Página**
Implemente no React para cada página ter meta tags próprias:
```typescript
// hooks/useSEO.ts
export function useSEO({
  title,
  description,
  image,
  url,
}) {
  useEffect(() => {
    document.title = title;
    updateMetaTag('og:title', title);
    updateMetaTag('og:description', description);
    // ... etc
  }, [title, description, image, url]);
}
```

### 7. **Redes Sociais & Links**
Atualize os links de redes sociais no schema:
```json
"sameAs": [
  "https://www.instagram.com/lacquaminasshopping",
  "https://www.facebook.com/lacquaminasshopping",
  "https://www.tiktok.com/@lacquaminas"
]
```

---

## 📊 Monitoramento Contínuo

### Dashboard de Monitoramento
- **Google Search Console**: Cliques, impressões, CTR, posição média
- **Google Analytics 4**: Tráfego, conversões, comportamento
- **Bing Webmaster Tools**: Indexação secundária
- **Lighthouse**: Performance score

### KPIs Importantes
- ✅ Posição média no Google (target: top 3 para principais keywords)
- ✅ CTR no Search (target: >3%)
- ✅ Core Web Vitals (Bom: LCP <2.5s, FID <100ms, CLS <0.1)
- ✅ Taxa de cliques de rich snippets (+30%)

---

## 🔑 Palavras-chave principais para otimizar

### Na sua região & nicho:
1. "perfume original Belo Horizonte"
2. "fragrância premium BH"
3. "perfumaria Minas Shopping"
4. "perfume importado MG"
5. "cologne original Brasil"
6. "eau de parfum Belo Horizonte"
7. "loja de perfumes BH"

### Estratégia de conteúdo:
- Crie blog posts: "Guia de escolher perfume", "Tendências 2026", "Cuidados com fragrâncias"
- Adicione FAQ estruturada
- Faça resenhas de produtos com schema
- Inclua vídeos de produtos (YouTube)

---

## ✅ Checklist Técnico

- [x] Meta tags otimizadas
- [x] Schema.org JSON-LD
- [x] Favicon melhorado
- [x] Manifest.json PWA
- [x] robots.txt
- [x] sitemap.xml
- [x] Headers de segurança
- [ ] Google Search Console verificado
- [ ] Google Business Profile criado
- [ ] Dados estruturados atualizados
- [ ] Analytics 4 configurado
- [ ] Redes sociais linkadas
- [ ] Conteúdo otimizado
- [ ] Core Web Vitals otimizados
- [ ] SSL certificado (HTTPS)

---

## 📞 Suporte

Para mais informações:
- Google Search Central: https://developers.google.com/search
- Schema.org: https://schema.org
- Documente para Google: https://support.google.com/business
