import { useEffect } from 'react';
import { getSchemaPhone } from '../../config/contactConfig';

/**
 * ProductSchema - Renderiza Schema.org para produtos
 * Mostra preço, avaliações, disponibilidade no Google
 */
export function ProductSchema({
  product,
  ratingValue = '4.8',
  ratingCount = '150',
}: {
  product: {
    id?: string;
    name: string;
    description?: string | null;
    imageUrl?: string | null;
    price: number;
    brand?: string | null;
    inStock?: boolean;
  };
  ratingValue?: string;
  ratingCount?: string;
}) {
  useEffect(() => {
    const productSchema = {
      '@context': 'https://schema.org/',
      '@type': 'Product',
      name: product.name,
      description: product.description || `${product.name} - Fragrância Premium Lacqua Minas Shopping`,
      image: product.imageUrl || 'https://lacquaminas.com.br/logo.png',
      brand: {
        '@type': 'Brand',
        name: product.brand || 'Lacqua',
      },
      offers: {
        '@type': 'Offer',
        url: typeof window !== 'undefined' ? window.location.href : '',
        priceCurrency: 'BRL',
        price: product.price.toString(),
        availability: product.inStock !== false ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        seller: {
          '@type': 'Organization',
          name: 'Lacqua Minas Shopping',
        },
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue,
        ratingCount,
      },
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(productSchema);
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [product, ratingValue, ratingCount]);

  return null;
}

/**
 * BreadcrumbSchema - Renderiza breadcrumb para navegação
 * Ajuda SEO e aparece no Google
 */
export function BreadcrumbSchema({
  items,
}: {
  items: {
    name: string;
    url: string;
  }[];
}) {
  useEffect(() => {
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: `https://lacquaminas.com.br${item.url}`,
      })),
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(breadcrumbSchema);
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [items]);

  return null;
}

/**
 * FAQSchema - Renderiza FAQ estruturada
 * Aparece em "Perguntas Frequentes" no Google
 */
export function FAQSchema({
  items,
}: {
  items: {
    question: string;
    answer: string;
  }[];
}) {
  useEffect(() => {
    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: items.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(faqSchema);
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [items]);

  return null;
}

/**
 * LocalBusinessSchema - Informações da loja
 * Já está em index.html, mas pode ser usado dinamicamente se necessário
 */
export function LocalBusinessSchema() {
  useEffect(() => {
    const businessSchema = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: 'Lacqua Minas Shopping',
      description: 'Fragrâncias premium e originais - Perfumaria de luxo',
      url: 'https://lacquaminas.com.br',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Minas Shopping',
        addressLocality: 'Belo Horizonte',
        addressRegion: 'MG',
        postalCode: '30140-073',
        addressCountry: 'BR',
      },
      telephone: getSchemaPhone(),
      priceRange: 'R$ 100 - R$ 2000',
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        ratingCount: '150',
      },
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(businessSchema);
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return null;
}
