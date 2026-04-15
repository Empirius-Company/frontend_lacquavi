// hooks/useSEO.ts
// Hook para gerenciar meta tags dinamicamente no React
// Uso: useSEO({ title, description, image, canonical })

import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  image?: string;
  canonical?: string;
  twitterHandle?: string;
  type?: 'website' | 'article' | 'product' | 'business.business';
}

function updateOrCreateMetaTag(name: string, content: string, isProperty: boolean = false) {
  const attribute = isProperty ? 'property' : 'name';
  let element = document.querySelector(`meta[${attribute}="${name}"]`);

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }

  element.setAttribute('content', content);
}

export function useSEO({
  title,
  description,
  image = 'https://lacquaminas.com.br/og-image.png',
  canonical = typeof window !== 'undefined' ? window.location.href : '',
  twitterHandle = '@lacquaminas',
  type = 'website',
}: SEOProps) {
  useEffect(() => {
    // Title
    document.title = `${title} | Lacqua Minas Shopping`;

    // Meta Tags
    updateOrCreateMetaTag('description', description);
    updateOrCreateMetaTag('viewport', 'width=device-width, initial-scale=1.0');

    // Open Graph
    updateOrCreateMetaTag('og:title', `${title} | Lacqua Minas Shopping`, true);
    updateOrCreateMetaTag('og:description', description, true);
    updateOrCreateMetaTag('og:image', image, true);
    updateOrCreateMetaTag('og:type', type, true);
    updateOrCreateMetaTag('og:url', canonical, true);
    updateOrCreateMetaTag('og:site_name', 'Lacqua Minas Shopping', true);

    // Twitter Card
    updateOrCreateMetaTag('twitter:card', 'summary_large_image');
    updateOrCreateMetaTag('twitter:title', title);
    updateOrCreateMetaTag('twitter:description', description);
    updateOrCreateMetaTag('twitter:image', image);
    updateOrCreateMetaTag('twitter:creator', twitterHandle);

    // Canonical
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link') as HTMLLinkElement;
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonical;

    // Additional SEO
    updateOrCreateMetaTag('robots', 'index, follow');
    updateOrCreateMetaTag('googlebot', 'index, follow');

  }, [title, description, image, canonical, type, twitterHandle]);
}

export default useSEO;
