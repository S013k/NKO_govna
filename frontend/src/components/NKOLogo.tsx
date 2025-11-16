'use client'

import { getNKOLogoUrlWithFallback } from '@/lib/logos'
import { S3Image } from '@/components/S3Image'

interface NKOLogoProps {
  logoData?: string  // Actual logo data from database (S3 path or external URL)
  logoId?: string    // Legacy logoId for backward compatibility
  width?: number
  height?: number
  className?: string
  alt?: string
  fallback?: string
  priority?: boolean
}

/**
 * Компонент для отображения логотипа НКО из статических изображений или S3
 */
export function NKOLogo({
  logoData,
  logoId,
  width = 60,
  height = 60,
  className = '',
  alt,
  fallback,
  priority = false
}: NKOLogoProps) {
  // Используем logoData если доступно, иначе fallback на logoId для обратной совместимости
  const logoUrl = logoData
    ? getNKOLogoUrlWithFallback(logoData, fallback)
    : getNKOLogoUrlWithFallback(logoId || '', fallback)
  
  const logoAlt = alt || `Логотип НКО ${logoId || 'unknown'}`
  

  return (
    <S3Image
      src={logoUrl}
      alt={logoAlt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      fallback={fallback}
    />
  )
}

export default NKOLogo