'use client'

import { S3Image } from '@/components/S3Image'
import { getNKOLogoUrlWithFallback } from '@/lib/logos'

interface NKOLogoProps {
  logoId: string
  width?: number
  height?: number
  className?: string
  alt?: string
  fallback?: string
  priority?: boolean
}

/**
 * Компонент для отображения логотипа НКО из S3 хранилища
 */
export function NKOLogo({
  logoId,
  width = 60,
  height = 60,
  className = '',
  alt,
  fallback,
  priority = false
}: NKOLogoProps) {
  const logoUrl = getNKOLogoUrlWithFallback(logoId, fallback)
  const logoAlt = alt || `Логотип НКО ${logoId}`

  return (
    <S3Image
      src={logoUrl}
      alt={logoAlt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      fallback={fallback || '/images/placeholder.png'}
    />
  )
}

export default NKOLogo