// API утилиты для работы с бэкендом

import { cookies } from './cookies'

const API_BASE_URL = '/api'

export interface LoginRequest {
  login: string
  password: string
}

export interface RegisterRequest {
  full_name: string
  login: string
  password: string
  role: 'nko' | 'admin' | 'moder' | 'user'
}

export interface User {
  id: number
  full_name: string
  login: string
  role: 'nko' | 'admin' | 'moder' | 'user'
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public detail?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// API клиент с автоматическим обновлением токена
class ApiClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    // Добавляем Authorization заголовок если есть токен
    const token = cookies.getAccessToken()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    const defaultOptions: RequestInit = {
      credentials: 'include',
      headers,
    }

    console.log('DEBUG: Request to', endpoint, 'with headers:', headers)
    let response = await fetch(url, { ...defaultOptions, ...options })

    // Если получили 401, пробуем обновить токен
    if (response.status === 401 && !endpoint.includes('/auth/login')) {
      try {
        await this.refreshToken()
        // Повторяем оригинальный запрос
        response = await fetch(url, { ...defaultOptions, ...options })
      } catch (refreshError) {
        // Если не удалось обновить токен, пробрасываем ошибку
        throw new ApiError('Сессия истекла', 401, 'TOKEN_EXPIRED')
      }
    }

    if (!response.ok) {
      let errorMessage = 'Ошибка запроса'
      let detail = ''

      try {
        const errorData = await response.json()
        errorMessage = errorData.detail || errorMessage
        detail = errorData.detail || ''
      } catch {
        errorMessage = response.statusText || errorMessage
      }

      throw new ApiError(errorMessage, response.status, detail)
    }

    return response.json()
  }

  private async refreshToken(): Promise<void> {
    // Для обновления токена можно использовать специальный эндпоинт
    // или просто проверить текущий статус через /users/me
    console.log('DEBUG: refreshToken called')
    
    const token = cookies.getAccessToken()
    console.log('DEBUG: Token from cookies:', token ? 'exists' : 'missing')
    
    const headers: Record<string, string> = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    console.log('DEBUG: Headers for /users/me/:', headers)
    
    const response = await fetch(`${this.baseURL}/users/me/`, {
      credentials: 'include',
      headers,
    })

    console.log('DEBUG: /users/me/ response status:', response.status)

    if (!response.ok) {
      throw new Error('Не удалось обновить токен')
    }
  }

  // Методы авторизации
  async login(login: string, password: string): Promise<TokenResponse> {
    const formData = new FormData()
    formData.append('username', login)
    formData.append('password', password)

    return this.request<TokenResponse>('/auth/login', {
      method: 'POST',
      body: formData,
      headers: {}, // Не устанавливаем Content-Type для FormData
    })
  }

  async register(data: RegisterRequest): Promise<User> {
    return this.request<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/users/me/')
  }

  async logout(): Promise<void> {
    try {
      await this.request<void>('/auth/logout', {
        method: 'POST',
      })
    } catch (error) {
      // Игнорируем ошибку, если эндпоинт не существует
      console.warn('Logout endpoint not available:', error)
    }
  }

  // Общий метод для других запросов
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint)
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    })
  }
}

export const apiClient = new ApiClient(API_BASE_URL)
export { ApiError }