// backend/apps/api/src/routes/sitemaps.js
// Rota para gerar sitemaps dinamicamente

const express = require('express');
const router = express.Router();
const { prisma } = require('../services/database');

/**
 * GET /api/sitemaps/index.xml
 * Retorna o sitemap index com referências aos outros sitemaps
 */
router.get('/index.xml', async (req, res) => {
  try {
    const baseUrl = process.env.FRONTEND_URL || 'https://lacquaminas.com.br';
    const productCount = await prisma.product.count();
    
    // Calcule quantos sitemaps de produtos são necessários (Google: max 50k URLs por arquivo)
    const productsPerFile = 50000;
    const productSitemaps = Math.ceil(productCount / productsPerFile);

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Sitemap de páginas estáticas
    xml += '  <sitemap>\n';
    xml += `    <loc>${baseUrl}/api/sitemaps/pages.xml</loc>\n`;
    xml += '    <lastmod>' + new Date().toISOString().split('T')[0] + '</lastmod>\n';
    xml += '  </sitemap>\n';

    // Sitemaps de produtos
    for (let i = 1; i <= productSitemaps; i++) {
      xml += '  <sitemap>\n';
      xml += `    <loc>${baseUrl}/api/sitemaps/products-${i}.xml</loc>\n`;
      xml += '    <lastmod>' + new Date().toISOString().split('T')[0] + '</lastmod>\n';
      xml += '  </sitemap>\n';
    }

    // Sitemap de categorias
    xml += '  <sitemap>\n';
    xml += `    <loc>${baseUrl}/api/sitemaps/categories.xml</loc>\n`;
    xml += '    <lastmod>' + new Date().toISOString().split('T')[0] + '</lastmod>\n';
    xml += '  </sitemap>\n';

    xml += '</sitemapindex>\n';

    res.type('application/xml').send(xml);
    res.set('Cache-Control', 'public, max-age=86400'); // 24 horas
  } catch (error) {
    console.error('Error generating sitemap index:', error);
    res.status(500).send('Error generating sitemap');
  }
});

/**
 * GET /api/sitemaps/pages.xml
 * Sitemap de páginas estáticas
 */
router.get('/pages.xml', (req, res) => {
  const baseUrl = process.env.FRONTEND_URL || 'https://lacquaminas.com.br';

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  const pages = [
    { path: '/', priority: 1.0, changefreq: 'weekly' },
    { path: '/products', priority: 0.9, changefreq: 'daily' },
    { path: '/about', priority: 0.7, changefreq: 'monthly' },
    { path: '/contact', priority: 0.7, changefreq: 'monthly' },
    { path: '/faq', priority: 0.6, changefreq: 'monthly' },
    { path: '/shipping', priority: 0.6, changefreq: 'monthly' },
    { path: '/returns', priority: 0.6, changefreq: 'monthly' },
  ];

  pages.forEach(page => {
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}${page.path}</loc>\n`;
    xml += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += '  </url>\n';
  });

  xml += '</urlset>\n';

  res.type('application/xml').send(xml);
  res.set('Cache-Control', 'public, max-age=604800'); // 7 dias
});

/**
 * GET /api/sitemaps/products-:page.xml
 * Sitemap de produtos (paginado)
 */
router.get('/products-:page.xml', async (req, res) => {
  try {
    const baseUrl = process.env.FRONTEND_URL || 'https://lacquaminas.com.br';
    const pageNum = parseInt(req.params.page) || 1;
    const itemsPerPage = 50000;
    const skip = (pageNum - 1) * itemsPerPage;

    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        updatedAt: true,
        imageUrl: true,
      },
      skip,
      take: itemsPerPage,
      orderBy: { updatedAt: 'desc' },
    });

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ';
    xml += 'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

    products.forEach(product => {
      const productUrl = `${baseUrl}/products/${product.slug || product.id}`;
      xml += '  <url>\n';
      xml += `    <loc>${productUrl}</loc>\n`;
      xml += `    <lastmod>${product.updatedAt.toISOString().split('T')[0]}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';

      // Adicione imagem do produto
      if (product.imageUrl) {
        xml += '    <image:image>\n';
        xml += `      <image:loc>${product.imageUrl}</image:loc>\n`;
        xml += `      <image:title>${product.name}</image:title>\n`;
        xml += '    </image:image>\n';
      }

      xml += '  </url>\n';
    });

    xml += '</urlset>\n';

    res.type('application/xml').send(xml);
    res.set('Cache-Control', 'public, max-age=86400'); // 24 horas
  } catch (error) {
    console.error('Error generating products sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
});

/**
 * GET /api/sitemaps/categories.xml
 * Sitemap de categorias
 */
router.get('/categories.xml', async (req, res) => {
  try {
    const baseUrl = process.env.FRONTEND_URL || 'https://lacquaminas.com.br';

    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        updatedAt: true,
      },
      orderBy: { name: 'asc' },
    });

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    categories.forEach(category => {
      const categoryUrl = `${baseUrl}/categories/${category.slug || category.id}`;
      xml += '  <url>\n';
      xml += `    <loc>${categoryUrl}</loc>\n`;
      xml += `    <lastmod>${category.updatedAt.toISOString().split('T')[0]}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    });

    xml += '</urlset>\n';

    res.type('application/xml').send(xml);
    res.set('Cache-Control', 'public, max-age=604800'); // 7 dias
  } catch (error) {
    console.error('Error generating categories sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
});

module.exports = router;

/**
 * ADIÇÃO ao main app.js:
 * 
 * const sitemapRoutes = require('./routes/sitemaps');
 * app.use('/api/sitemaps', sitemapRoutes);
 * 
 * CONFIGURAÇÃO NO robots.txt:
 * Sitemap: https://lacquaminas.com.br/api/sitemaps/index.xml
 */
