import { ImgHTMLAttributes, useState, useEffect, useRef } from 'react';

interface LazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  width?: number | string;
  height?: number | string;
}

/**
 * LazyImage - Componente de imagem com lazy loading
 * Melhora performance e Core Web Vitals
 */
export function LazyImage({
  src,
  alt,
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"%3E%3Crect fill="%23f3f4f6" width="400" height="400"/%3E%3C/svg%3E',
  className = '',
  width,
  height,
  ...props
}: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            img.src = src;
            setImageSrc(src);
            observer.unobserve(img);
          }
        });
      },
      {
        rootMargin: '50px',
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [src]);

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-75'} transition-opacity duration-300`}
      width={width}
      height={height}
      onLoad={() => setIsLoaded(true)}
      {...props}
    />
  );
}

/**
 * Componente Picture com Lazy Loading
 * Para imagens responsivas/art direction
 */
export function LazyPicture({
  alt,
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"%3E%3Crect fill="%23f3f4f6" width="400" height="400"/%3E%3C/svg%3E',
  sources,
  defaultSrc,
  className = '',
  width,
  height,
}: {
  alt: string;
  placeholder?: string;
  sources: {
    srcset: string;
    media?: string;
    type?: string;
  }[];
  defaultSrc: string;
  className?: string;
  width?: number | string;
  height?: number | string;
}) {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && imgRef.current) {
            imgRef.current.src = defaultSrc;
            setImageSrc(defaultSrc);
            observer.unobserve(imgRef.current);
          }
        });
      },
      {
        rootMargin: '50px',
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [defaultSrc]);

  return (
    <picture>
      {sources.map((source, idx) => (
        <source
          key={idx}
          srcSet={source.srcset}
          media={source.media}
          type={source.type}
        />
      ))}
      <img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-75'} transition-opacity duration-300`}
        width={width}
        height={height}
        onLoad={() => setIsLoaded(true)}
      />
    </picture>
  );
}
