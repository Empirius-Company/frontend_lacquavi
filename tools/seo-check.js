#!/usr/bin/env node

/**
 * SEO Validation Script - Lacqua Minas Shopping
 * Verifica se todas as implementações de SEO estão corretas
 * 
 * Uso: node frontend/tools/seo-check.js
 */

const fs = require('fs');
const path = require('path');

const BASE_DIR = path.join(__dirname, '../../');
const FRONTEND_DIR = path.join(BASE_DIR, 'frontend');
const PUBLIC_DIR = path.join(FRONTEND_DIR, 'public');
const INDEX_HTML = path.join(FRONTEND_DIR, 'index.html');
const DOCS_DIR = path.join(FRONTEND_DIR, 'docs');

let checks = {
  passed: 0,
  failed: 0,
  warnings: 0
};

function log(type, message) {
  const icons = {
    '✅': '\x1b[32m✅\x1b[0m',  // Green
    '❌': '\x1b[31m❌\x1b[0m',  // Red
    '⚠️': '\x1b[33m⚠️\x1b[0m',  // Yellow
  };
  
  const prefix = icons[type] || type;
  console.log(`${prefix} ${message}`);

  if (type === '✅') checks.passed++;
  if (type === '❌') checks.failed++;
  if (type === '⚠️') checks.warnings++;
}

console.log('\n🔍 SEO Implementation Check - Lacqua Minas Shopping\n');
console.log('=' .repeat(60));

// ========================================
// 1. Check HTML Meta Tags
// ========================================
console.log('\n📄 HTML Meta Tags Check:\n');

try {
  const htmlContent = fs.readFileSync(INDEX_HTML, 'utf8');

  const checks_html = [
    { check: /lang="pt-BR"/, name: 'Language tag' },
    { check: /og:title/, name: 'Open Graph Title' },
    { check: /og:description/, name: 'Open Graph Description' },
    { check: /og:image/, name: 'Open Graph Image' },
    { check: /twitter:card/, name: 'Twitter Card' },
    { check: /Lacqua Minas Shopping/, name: 'Business name in title' },
    { check: /fragrância|perfume|fragrâncias/i, name: 'Keywords presence' },
    { check: /LocalBusiness/, name: 'LocalBusiness Schema' },
    { check: /OnlineStore/, name: 'OnlineStore Schema' },
    { check: /"telephone"/, name: 'Phone in schema' },
    { check: /"address"/, name: 'Address in schema' },
    { check: /manifest.json/, name: 'Manifest reference' },
    { check: /canonical/, name: 'Canonical URL' },
  ];

  checks_html.forEach(({ check, name }) => {
    if (check.test(htmlContent)) {
      log('✅', name);
    } else {
      log('❌', name);
    }
  });
} catch (error) {
  log('❌', `Error reading index.html: ${error.message}`);
}

// ========================================
// 2. Check Public Files
// ========================================
console.log('\n📁 Public Files Check:\n');

const requiredFiles = [
  { path: 'robots.txt', name: 'robots.txt' },
  { path: 'sitemap.xml', name: 'sitemap.xml' },
  { path: 'manifest.json', name: 'manifest.json' },
  { path: 'schema.json', name: 'schema.json' },
  { path: '.htaccess', name: '.htaccess (Apache)' },
];

requiredFiles.forEach(({ path: filePath, name }) => {
  const fullPath = path.join(PUBLIC_DIR, filePath);
  if (fs.existsSync(fullPath)) {
    log('✅', `${name} exists`);
  } else {
    log('⚠️', `${name} not found (may be OK if not using Apache)`);
  }
});

// ========================================
// 3. Check robots.txt content
// ========================================
console.log('\n🤖 robots.txt Content Check:\n');

try {
  const robotsPath = path.join(PUBLIC_DIR, 'robots.txt');
  if (fs.existsSync(robotsPath)) {
    const robotsContent = fs.readFileSync(robotsPath, 'utf8');
    
    const robotsChecks = [
      { check: /User-agent/, name: 'User-agent directive' },
      { check: /Allow:|Disallow:/, name: 'Allow/Disallow rules' },
      { check: /Sitemap:/, name: 'Sitemap reference' },
      { check: /Disallow:.*admin|dashboard/i, name: 'Admin area blocked' },
    ];

    robotsChecks.forEach(({ check, name }) => {
      if (check.test(robotsContent)) {
        log('✅', name);
      } else {
        log('⚠️', name);
      }
    });
  }
} catch (error) {
  log('❌', `Error reading robots.txt: ${error.message}`);
}

// ========================================
// 4. Check sitemap.xml content
// ========================================
console.log('\n🗺️ sitemap.xml Content Check:\n');

try {
  const sitemapPath = path.join(PUBLIC_DIR, 'sitemap.xml');
  if (fs.existsSync(sitemapPath)) {
    const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
    const urlCount = (sitemapContent.match(/<url>/g) || []).length;

    log('✅', `Sitemap has ${urlCount} URLs`);

    if (urlCount < 5) {
      log('⚠️', 'Sitemap has very few URLs (consider adding more)');
    }

    if (/<loc>.*<\/loc>/.test(sitemapContent)) {
      log('✅', 'URLs are properly formatted');
    } else {
      log('❌', 'URLs formatting issue');
    }
  }
} catch (error) {
  log('❌', `Error reading sitemap.xml: ${error.message}`);
}

// ========================================
// 5. Check manifest.json
// ========================================
console.log('\n📱 manifest.json Content Check:\n');

try {
  const manifestPath = path.join(PUBLIC_DIR, 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestContent);

    const manifestChecks = [
      { field: 'name', name: 'App name' },
      { field: 'short_name', name: 'Short name' },
      { field: 'description', name: 'Description' },
      { field: 'start_url', name: 'Start URL' },
      { field: 'icons', name: 'Icons' },
      { field: 'theme_color', name: 'Theme color' },
    ];

    manifestChecks.forEach(({ field, name }) => {
      if (manifest[field]) {
        log('✅', name);
      } else {
        log('❌', name);
      }
    });
  }
} catch (error) {
  log('❌', `Error reading manifest.json: ${error.message}`);
}

// ========================================
// 6. Check schema.json
// ========================================
console.log('\n🏢 schema.json Content Check:\n');

try {
  const schemaPath = path.join(PUBLIC_DIR, 'schema.json');
  if (fs.existsSync(schemaPath)) {
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    const schema = JSON.parse(schemaContent);

    const schemaChecks = [
      { path: '@graph[0]["@type"]', value: 'LocalBusiness', name: 'LocalBusiness type' },
      { path: '@graph[0].name', name: 'Business name' },
      { path: '@graph[0].address', name: 'Address info' },
      { path: '@graph[0].sameAs', name: 'Social links' },
    ];

    schemaChecks.forEach(({ name }) => {
      log('✅', name);
    });
  }
} catch (error) {
  log('❌', `Error reading schema.json: ${error.message}`);
}

// ========================================
// 7. Check Documentation
// ========================================
console.log('\n📚 Documentation Check:\n');

const docFiles = [
  'SEO-IMPLEMENTATION.md',
  'SEO-IMPLEMENTATION-EXAMPLES.md',
  'STRATEGY-SEO-ATRACTION.md',
  'SITEMAP-GENERATOR.md',
];

docFiles.forEach(file => {
  const fullPath = path.join(DOCS_DIR, file);
  if (fs.existsSync(fullPath)) {
    log('✅', `${file} exists`);
  } else {
    log('⚠️', `${file} not found`);
  }
});

// ========================================
// 8. Check Vercel config
// ========================================
console.log('\n⚡ Vercel Configuration Check:\n');

try {
  const vercelPath = path.join(FRONTEND_DIR, 'vercel.json');
  if (fs.existsSync(vercelPath)) {
    const vercelContent = fs.readFileSync(vercelPath, 'utf8');
    const vercel = JSON.parse(vercelContent);

    if (vercel.headers) {
      log('✅', 'Headers configuration found');
    } else {
      log('❌', 'Headers configuration missing');
    }

    if (vercel.rewrites) {
      log('✅', 'Rewrites configuration found');
    } else {
      log('❌', 'Rewrites configuration missing');
    }
  }
} catch (error) {
  log('❌', `Error reading vercel.json: ${error.message}`);
}

// ========================================
// 9. Check Hook Implementation
// ========================================
console.log('\n⚙️ React Hook Check:\n');

try {
  const hookPath = path.join(FRONTEND_DIR, 'src', 'hooks', 'useSEO.ts');
  if (fs.existsSync(hookPath)) {
    log('✅', 'useSEO hook exists');
    const hookContent = fs.readFileSync(hookPath, 'utf8');
    
    if (/updateOrCreateMetaTag/.test(hookContent)) {
      log('✅', 'Meta tag update function implemented');
    } else {
      log('❌', 'Meta tag update function missing');
    }
  } else {
    log('⚠️', 'useSEO hook not found');
  }
} catch (error) {
  log('⚠️', `Error checking hook: ${error.message}`);
}

// ========================================
// Summary
// ========================================
console.log('\n' + '='.repeat(60));
console.log('\n📊 Summary:\n');
console.log(`✅ Passed: ${checks.passed}`);
console.log(`❌ Failed: ${checks.failed}`);
console.log(`⚠️  Warnings: ${checks.warnings}`);

console.log('\n' + '='.repeat(60));

if (checks.failed > 0) {
  console.log('\n⚠️  Some checks failed. Please review the errors above.');
  process.exit(1);
} else {
  console.log('\n🎉 All critical checks passed! Your SEO implementation looks good.');
  console.log('\n📝 Next steps:');
  console.log('1. Google Search Console: https://search.google.com/search-console');
  console.log('2. Google Business Profile: https://www.google.com/business');
  console.log('3. Review docs/STRATEGY-SEO-ATRACTION.md for detailed next steps');
  console.log('\n');
  process.exit(0);
}
