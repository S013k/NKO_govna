'use client'

import { useState } from 'react'

interface S3ImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  fallback?: string
  title?: string
}

/**
 * Компонент для отображения изображений из S3 с поддержкой запасных вариантов
 */
export function S3Image({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  fallback,
  title
}: S3ImageProps) {
  const [imgSrc, setImgSrc] = useState(src)
  const [hasError, setHasError] = useState(false)

  // DEBUG: Log S3Image initialization
  console.log('DEBUG: S3Image - initial src:', src, 'fallback:', fallback)

  const handleError = () => {
    console.log('DEBUG: S3Image - handleError called, hasError:', hasError, 'fallback:', fallback)
    if (!hasError && fallback) {
      setImgSrc(fallback)
      setHasError(true)
      console.log('DEBUG: S3Image - switched to fallback:', fallback)
    }
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      title={title}
      onError={handleError}
      loading={priority ? 'eager' : 'lazy'}
      style={{
        objectFit: 'contain'
      }}
    />
  )
}

export default S3Image