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

  const handleError = () => {
    if (!hasError && fallback) {
      setImgSrc(fallback)
      setHasError(true)
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