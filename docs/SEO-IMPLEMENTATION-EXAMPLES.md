// Exemplo: Como implementar SEO dinâmico em páginas

/**
 * EXEMPLO 1: HomePage
 */
import { useSEO } from '@/hooks/useSEO';

export function HomePage() {
  useSEO({
    title: 'Fragrâncias Premium | Lacqua Minas Shopping',
    description: 'Descubra fragrâncias premium e originais no Minas Shopping, Belo Horizonte. Perfumaria de luxo com entrega rápida.',
    image: 'https://lacquaminas.com.br/og-image-home.png',
  });

  return (
    <div>
      {/* seu conteúdo */}
    </div>
  );
}

/**
 * EXEMPLO 2: Página de Categoria
 */
export function CategoryPage({ categoryName, categoryDescription }) {
  useSEO({
    title: `${categoryName} | Fragrâncias Premium`,
    description: categoryDescription || `Explore nossa coleção de ${categoryName} em Lacqua Minas Shopping. Perfumes importados e originais.`,
    image: 'https://lacquaminas.com.br/og-image-category.png',
    type: 'website',
  });

  return (
    <div>
      {/* listagem de produtos */}
    </div>
  );
}

/**
 * EXEMPLO 3: Página de Produto (MAIS IMPORTANTE)
 */
import { useEffect, useState } from 'react';

export function ProductPage({ productId }) {
  const [product, setProduct] = useState(null);

  useEffect(() => {
    // Buscar produto da API
    fetch(`/api/products/${productId}`)
      .then(res => res.json())
      .then(data => setProduct(data));
  }, [productId]);

  // Meta tags dinâmicas baseadas no produto
  useSEO({
    title: product?.name || 'Produto Lacqua',
    description: product?.description || 'Descubra este perfume premium em Lacqua Minas Shopping',
    image: product?.imageUrl || 'https://lacquaminas.com.br/og-image.png',
    type: 'product',
  });

  if (!product) return <div>Carregando...</div>;

  return (
    <div>
      <img src={product.imageUrl} alt={product.name} />
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <span>R$ {product.price}</span>
    </div>
  );
}

/**
 * EXEMPLO 4: Implementar Schema de Produto (JSON-LD)
 * Adicione isso no componente ProductPage
 */
export function ProductSchema({ product }) {
  useEffect(() => {
    if (!product) return;

    const schema = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": product.name,
      "description": product.description,
      "image": product.imageUrl,
      "brand": {
        "@type": "Brand",
        "name": product.brand || "Lacqua"
      },
      "offers": {
        "@type": "Offer",
        "url": window.location.href,
        "priceCurrency": "BRL",
        "price": product.price,
        "availability": "https://schema.org/InStock",
        "seller": {
          "@type": "Organization",
          "name": "Lacqua Minas Shopping"
        }
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": product.rating || "4.5",
        "ratingCount": product.reviewCount || "10"
      }
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [product]);

  return null;
}

/**
 * EXEMPLO 5: Breadcrumb Schema (para aparecer no Google)
 */
export function BreadcrumbSchema({ items }) {
  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": items.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": item.name,
        "item": `https://lacquaminas.com.br${item.url}`
      }))
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [items]);

  return null;
}

/**
 * EXEMPLO DE USO COMPLETO:
 */
export function ProductPageComplete({ productId }) {
  const [product, setProduct] = useState(null);

  useEffect(() => {
    fetch(`/api/products/${productId}`)
      .then(res => res.json())
      .then(data => setProduct(data));
  }, [productId]);

  if (!product) return <div>Carregando...</div>;

  return (
    <>
      {/* Meta tags dinâmicas */}
      <useSEO
        title={product.name}
        description={product.description}
        image={product.imageUrl}
        type="product"
      />

      {/* Schema de Produto */}
      <ProductSchema product={product} />

      {/* Breadcrumb */}
      <BreadcrumbSchema
        items={[
          { name: 'Início', url: '/' },
          { name: product.category, url: `/categories/${product.categoryId}` },
          { name: product.name, url: `/products/${productId}` }
        ]}
      />

      {/* Conteúdo visual */}
      <div className="product-container">
        <img src={product.imageUrl} alt={product.name} />
        <h1>{product.name}</h1>
        <p>{product.description}</p>
        <span>R$ {product.price}</span>
        <button>Adicionar ao Carrinho</button>
      </div>
    </>
  );
}
