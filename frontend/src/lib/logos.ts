/**
 * Утилита для работы с логотипами из S3 хранилища
 */

export interface LogoConfig {
  name: string
  description: string
  path: string
}

// Конфигурация логотипов Росатома
export const ROSATOM_LOGOS: Record<string, LogoConfig> = {
  horizontalColor: {
    name: 'LOGO_ROSATOM_rus_HOR_COLOR_PNG.png',
    description: 'Горизонтальный логотип в цвете',
    path: '/api/s3/nko-logo/LOGO_ROSATOM_rus_HOR_COLOR_PNG.png'
  },
  horizontalWhite: {
    name: 'LOGO_ROSATOM_rus_HOR_WHITE_PNG.png',
    description: 'Горизонтальный белый логотип',
    path: '/api/s3/nko-logo/LOGO_ROSATOM_rus_HOR_WHITE_PNG.png'
  },
  verticalColor: {
    name: 'LOGO_ROSATOM_rus_VERT_COLOR_PNG.png',
    description: 'Вертикальный логотип в цвете',
    path: '/api/s3/nko-logo/LOGO_ROSATOM_rus_VERT_COLOR_PNG.png'
  },
  verticalWhite: {
    name: 'LOGO_ROSATOM_rus_VERT_WHITE_PNG.png',
    description: 'Вертикальный белый логотип',
    path: '/api/s3/nko-logo/LOGO_ROSATOM_rus_VERT_WHITE_PNG.png'
  }
}

// Типы логотипов Росатома для удобства
export type RosatomLogoType = keyof typeof ROSATOM_LOGOS

/**
 * Получить URL логотипа Росатома по типу
 */
export function getRosatomLogoUrl(type: RosatomLogoType): string {
  return ROSATOM_LOGOS[type]?.path || ROSATOM_LOGOS.horizontalColor.path
}

/**
 * Получить конфигурацию логотипа Росатома
 */
export function getRosatomLogoConfig(type: RosatomLogoType): LogoConfig {
  return ROSATOM_LOGOS[type] || ROSATOM_LOGOS.horizontalColor
}

/**
 * Получить все доступные логотипы Росатома
 */
export function getAllRosatomLogos(): LogoConfig[] {
  return Object.values(ROSATOM_LOGOS)
}

/**
 * Получить URL логотипа НКО
 */
export function getNKOLogoUrl(logoId: string): string {
  return `/api/s3/nko-logo/nko-logo-${logoId}.png`
}

/**
 * Получить URL логотипа НКО с запасным вариантом
 */
export function getNKOLogoUrlWithFallback(logoId: string, fallbackLogo?: string): string {
  const nkoLogoUrl = getNKOLogoUrl(logoId)
  return fallbackLogo || nkoLogoUrl
}

/**
 * Получить все логотипы НКО (для предзагрузки)
 */
export function getAllNKOLogos(): string[] {
  const logos = []
  for (let i = 1; i <= 12; i++) {
    logos.push(getNKOLogoUrl(i.toString()))
  }
  return logos
}

/**
 * Получить горизонтальные логотипы Росатома
 */
export function getHorizontalLogos(): LogoConfig[] {
  return Object.values(ROSATOM_LOGOS).filter(logo =>
    logo.name.includes('HOR')
  )
}

/**
 * Получить вертикальные логотипы Росатома
 */
export function getVerticalLogos(): LogoConfig[] {
  return Object.values(ROSATOM_LOGOS).filter(logo =>
    logo.name.includes('VERT')
  )
}

/**
 * Получить цветные логотипы Росатома
 */
export function getColorLogos(): LogoConfig[] {
  return Object.values(ROSATOM_LOGOS).filter(logo =>
    logo.name.includes('COLOR')
  )
}

/**
 * Получить белые логотипы Росатома
 */
export function getWhiteLogos(): LogoConfig[] {
  return Object.values(ROSATOM_LOGOS).filter(logo =>
    logo.name.includes('WHITE')
  )
}

// Константы для часто используемых логотипов
export const DEFAULT_LOGO = ROSATOM_LOGOS.horizontalColor.path
export const WHITE_LOGO = ROSATOM_LOGOS.horizontalWhite.path
export const VERTICAL_LOGO = ROSATOM_LOGOS.verticalColor.path

// Обратная совместимость
export const getLogoUrl = getRosatomLogoUrl
export const getLogoConfig = getRosatomLogoConfig
export const getAllLogos = getAllRosatomLogos
export type LogoType = RosatomLogoType