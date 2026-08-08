import React from 'react';

export default function Image({
  src,
  alt,
  width,
  height,
  fill,
  style,
  className,
  priority,
  ...props
}) {
  const imageStyle = fill
    ? {
        position: 'absolute',
        height: '100%',
        width: '100%',
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        objectFit: 'cover',
        ...style,
      }
    : {
        width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
        height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
        ...style,
      };

  // Determine lazy loading (Next.js defaults to lazy unless priority is true)
  const loadingProp = priority ? 'eager' : 'lazy';

  // Generate webp sources if it's a static path (e.g. /assets/logo.png)
  const isStaticAsset =
    typeof src === 'string' &&
    src.startsWith('/') &&
    src.match(/\.(png|jpe?g)$/i) &&
    !src.includes('@');

  if (isStaticAsset) {
    const basePath = src.substring(0, src.lastIndexOf('.'));
    // Generate responsive srcset using widths
    const srcsetWebp = `${basePath}-480w.webp 480w, ${basePath}-800w.webp 800w, ${basePath}-1200w.webp 1200w`;
    const defaultSizes =
      props.sizes || '(max-width: 600px) 480px, (max-width: 1024px) 800px, 1200px';

    // For picture, we need the parent to take the full space and img to fill it
    // The wrapper picture needs to adopt the display sizing
    const pictureStyle = {
      display: fill ? 'block' : 'inline-block',
      width: imageStyle.width,
      height: imageStyle.height,
      position: imageStyle.position,
      left: imageStyle.left,
      top: imageStyle.top,
      right: imageStyle.right,
      bottom: imageStyle.bottom,
    };

    const innerImgStyle = {
      width: '100%',
      height: '100%',
      objectFit: imageStyle.objectFit,
    };

    return (
      <picture className={className} style={pictureStyle}>
        <source srcSet={srcsetWebp} type="image/webp" />
        {/* Fallback to original image format for legacy browsers */}
        <img
          src={src}
          alt={alt}
          style={innerImgStyle}
          loading={loadingProp}
          srcSet={`${basePath}-480w.png 480w, ${basePath}-800w.png 800w, ${basePath}-1200w.png 1200w`}
          sizes={defaultSizes}
          {...props}
        />
      </picture>
    );
  }

  // Fallback for external URLs or SVGs
  return (
    <img
      src={src}
      alt={alt}
      style={imageStyle}
      className={className}
      loading={loadingProp}
      {...props}
    />
  );
}
