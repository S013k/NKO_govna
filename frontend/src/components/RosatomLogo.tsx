'use client'

import { S3Image } from '@/components/S3Image'
import { RosatomLogoType, getRosatomLogoUrl, getRosatomLogoConfig } from '@/lib/logos'

interface RosatomLogoProps {
  type?: RosatomLogoType
  width?: number
  height?: number
  className?: string
  alt?: string
  priority?: boolean
  fallback?: string
}

/**
 * Компонент для отображения логотипа Росатома из S3 хранилища
 */
export function RosatomLogo({
  type = 'horizontalColor',
  width = 120,
  height = 40,
  className = '',
  alt = 'Росатом',
  priority = false,
  fallback = '/images/LOGO_ROSATOM_rus_HOR_COLOR_PNG.png'
}: RosatomLogoProps) {
  const logoUrl = getRosatomLogoUrl(type)
  const logoConfig = getRosatomLogoConfig(type)

  return (
    <S3Image
      src={logoUrl}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      fallback={fallback}
      title={logoConfig.description}
    />
  )
}

export default RosatomLogo