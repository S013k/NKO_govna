// Утилиты для работы с cookie

export interface CookieOptions {
  maxAge?: number
  expires?: Date
  path?: string
  domain?: string
  secure?: boolean
  httpOnly?: boolean
  sameSite?: 'strict' | 'lax' | 'none'
}

export class CookieManager {
  // Установка cookie
  static set(name: string, value: string, options: CookieOptions = {}): void {
    let cookieString = `${name}=${encodeURIComponent(value)}`

    if (options.maxAge) {
      cookieString += `; max-age=${options.maxAge}`
    }

    if (options.expires) {
      cookieString += `; expires=${options.expires.toUTCString()}`
    }

    if (options.path) {
      cookieString += `; path=${options.path}`
    }

    if (options.domain) {
      cookieString += `; domain=${options.domain}`
    }

    if (options.secure) {
      cookieString += '; secure'
    }

    if (options.httpOnly) {
      cookieString += '; httponly'
    }

    if (options.sameSite) {
      cookieString += `; samesite=${options.sameSite}`
    }

    document.cookie = cookieString
  }

  // Получение cookie
  static get(name: string): string | null {
    const nameEQ = `${name}=`
    const cookies = document.cookie.split(';')

    for (let cookie of cookies) {
      cookie = cookie.trim()
      if (cookie.startsWith(nameEQ)) {
        return decodeURIComponent(cookie.substring(nameEQ.length))
      }
    }

    return null
  }

  // Удаление cookie
  static delete(name: string, options: Pick<CookieOptions, 'path' | 'domain'> = {}): void {
    this.set(name, '', {
      ...options,
      maxAge: -1,
    })
  }

  // Проверка наличия cookie
  static exists(name: string): boolean {
    return this.get(name) !== null
  }

  // Установка токена доступа с безопасными параметрами
  static setAccessToken(token: string): void {
    const isProduction = process.env.NODE_ENV === 'production'
    
    this.set('access_token', token, {
      maxAge: 30 * 60, // 30 минут
      path: '/',
      secure: isProduction,
      httpOnly: false, // Должно быть false для доступа из JavaScript
      sameSite: 'lax',
    })
  }

  // Получение токена доступа
  static getAccessToken(): string | null {
    return this.get('access_token')
  }

  // Удаление токена доступа
  static removeAccessToken(): void {
    this.delete('access_token', { path: '/' })
  }
  
  // Установка refresh токена
  static setRefreshToken(token: string): void {
    const isProduction = process.env.NODE_ENV === 'production'
    
    this.set('refresh_token', token, {
      maxAge: 7 * 24 * 60 * 60, // 7 дней
      path: '/',
      secure: isProduction,
      httpOnly: false, // Должно быть false для доступа из JavaScript
      sameSite: 'lax',
    })
  }

  // Получение refresh токена
  static getRefreshToken(): string | null {
    return this.get('refresh_token')
  }

  // Удаление refresh токена
  static removeRefreshToken(): void {
    this.delete('refresh_token', { path: '/' })
  }

  // Установка информации о пользователе (не чувствительные данные)
  static setUserInfo(user: { id: number; full_name: string; login: string; role: string }): void {
    this.set('user_info', JSON.stringify(user), {
      maxAge: 30 * 60, // 30 минут
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    })
  }

  // Получение информации о пользователе
  static getUserInfo(): { id: number; full_name: string; login: string; role: string } | null {
    const userInfo = this.get('user_info')
    if (!userInfo) return null

    try {
      return JSON.parse(userInfo)
    } catch {
      return null
    }
  }

  // Удаление информации о пользователе
  static removeUserInfo(): void {
    this.delete('user_info', { path: '/' })
  }

  // Очистка всех авторизационных cookie
  static clearAuthCookies(): void {
    this.removeAccessToken()
    this.removeRefreshToken()
    this.removeUserInfo()
  }

  // Проверка авторизации
  static isAuthenticated(): boolean {
    return this.exists('access_token') && this.exists('user_info')
  }
}

// Экспорт для удобного использования
export const cookies = CookieManager