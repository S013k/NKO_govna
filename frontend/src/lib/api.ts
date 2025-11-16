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
  refresh_token: string
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

// Function to translate common error messages
const translateErrorMessage = (message: string): string => {
  const translations: Record<string, string> = {
    'Incorrect username or password': 'Неверный логин или пароль',
    'Could not validate credentials': 'Не удалось проверить учетные данные',
    'Login already registered': 'Логин уже зарегистрирован',
  }
  return translations[message] || message
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
    if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
      try {
        const refreshResult = await this.refreshToken()
        if (refreshResult) {
          // Повторяем оригинальный запрос с новым токеном
          const newHeaders = { ...headers };
          newHeaders['Authorization'] = `Bearer ${cookies.getAccessToken()}`;
          
          const newOptions = { ...options };
          if (newOptions.headers) {
            newOptions.headers = { ...newOptions.headers, ...newHeaders };
          } else {
            newOptions.headers = newHeaders;
          }
          
          response = await fetch(url, { ...defaultOptions, ...newOptions })
        } else {
          throw new Error('Не удалось обновить токен')
        }
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
        console.log('DEBUG: Backend error response:', errorData)
        errorMessage = errorData.detail || errorMessage
        detail = errorData.detail || ''
        console.log('DEBUG: Extracted error message:', errorMessage)
        
        // Translate the error message
        errorMessage = translateErrorMessage(errorMessage)
        console.log('DEBUG: Translated error message:', errorMessage)
      } catch {
        errorMessage = response.statusText || errorMessage
        console.log('DEBUG: Fallback error message:', errorMessage)
        
        // Translate the fallback error message as well
        errorMessage = translateErrorMessage(errorMessage)
        console.log('DEBUG: Translated fallback error message:', errorMessage)
      }

      throw new ApiError(errorMessage, response.status, detail)
    }

    return response.json()
  }

  private async refreshToken(): Promise<boolean> {
    console.log('DEBUG: refreshToken called')
    
    // Получаем refresh token из cookies
    const refreshToken = cookies.getRefreshToken()
    console.log('DEBUG: Refresh token from cookies:', refreshToken ? 'exists' : 'missing')
    
    if (!refreshToken) {
      console.log('DEBUG: No refresh token found')
      return false
    }
    
    try {
      // Отправляем запрос на обновление токена
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
        credentials: 'include',
      })
      
      console.log('DEBUG: /auth/refresh response status:', response.status)
      
      if (!response.ok) {
        console.log('DEBUG: Failed to refresh token')
        return false
      }
      
      // Получаем новые токены
      const tokenData: TokenResponse = await response.json()
      
      // Сохраняем новые токены в cookies
      cookies.setAccessToken(tokenData.access_token)
      cookies.setRefreshToken(tokenData.refresh_token)
      
      console.log('DEBUG: Token refreshed successfully')
      return true
    } catch (error) {
      console.error('DEBUG: Error refreshing token:', error)
      return false
    }
  }

  // Методы авторизации
  async login(login: string, password: string): Promise<TokenResponse> {
    const formData = new FormData()
    formData.append('username', login)
    formData.append('password', password)

    const response = await this.request<TokenResponse>('/auth/login', {
      method: 'POST',
      body: formData,
      headers: {}, // Не устанавливаем Content-Type для FormData
    })
    
    // Сохраняем refresh token в cookies
    if (response.refresh_token) {
      cookies.setRefreshToken(response.refresh_token)
    }
    
    return response
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

// NKO related interfaces
export interface NKOResponse {
  id: number
  name: string
  description?: string
  logo?: string
  address: string
  city?: string
  latitude: number
  longitude: number
  meta?: { url?: string }
  created_at?: string
  categories: string[]
}

export interface CityResponse {
  id: number
  name: string
}

export interface NKOFilters {
  city?: string
  category?: string[]
  regex?: string
}

// NKO API methods
export async function fetchNKO(filters?: NKOFilters): Promise<NKOResponse[]> {
  const params = new URLSearchParams()
  
  // Получаем токен из cookies или используем пустой
  const token = typeof window !== 'undefined' && window.localStorage
    ? localStorage.getItem('access_token')
    : null
  
  if (token) {
    params.append('jwt_token', token)
  } else {
    params.append('jwt_token', '') // Пустой токен для неавторизованных пользователей
  }
  
  if (filters?.city) {
    params.append('city', filters.city)
  }
  
  if (filters?.category && filters.category.length > 0) {
    filters.category.forEach(cat => params.append('category', cat))
  }
  
  if (filters?.regex) {
    params.append('regex', filters.regex)
  }
  
  const queryString = params.toString()
  const endpoint = `/nko${queryString ? `?${queryString}` : ''}`
  
  return apiClient.get<NKOResponse[]>(endpoint)
}

export async function fetchNKOById(id: number): Promise<NKOResponse> {
  // Добавляем JWT токен как в других функциях
  const token = typeof window !== 'undefined' && window.localStorage
    ? localStorage.getItem('access_token')
    : null
  
  const params = new URLSearchParams()
  if (token) {
    params.append('jwt_token', token)
  } else {
    params.append('jwt_token', '') // Пустой токен для неавторизованных пользователей
  }
  
  const queryString = params.toString()
  const endpoint = `/nko/${id}${queryString ? `?${queryString}` : ''}`
  
  console.log('DEBUG: fetchNKOById - ID:', id, 'Endpoint:', endpoint)
  
  return apiClient.get<NKOResponse>(endpoint)
}

export async function fetchCities(): Promise<CityResponse[]> {
  // Получаем токен из cookies или используем пустой
  const token = typeof window !== 'undefined' && window.localStorage
    ? localStorage.getItem('access_token')
    : null
  
  const params = new URLSearchParams()
  if (token) {
    params.append('jwt_token', token)
  } else {
    params.append('jwt_token', '') // Пустой токен для неавторизованных пользователей
  }
  
  const queryString = params.toString()
  const endpoint = `/city${queryString ? `?${queryString}` : ''}`
  
  return apiClient.get<CityResponse[]>(endpoint)
}
// Event related interfaces
export interface EventResponse {
  id: number
  nko_id: number
  nko_name?: string
  name: string
  description?: string
  address?: string
  picture?: string
  latitude?: number
  longitude?: number
  starts_at?: string
  finish_at?: string
  created_by: number
  approved_by?: number
  state: string
  meta?: string
  created_at?: string
  categories: string[]
}

export interface EventFilters {
  nko_id?: number[]
  category?: string[]
  regex?: string
  time_from?: string
  time_to?: string
}

// Event API methods
export async function fetchEvents(filters?: EventFilters): Promise<EventResponse[]> {
  const params = new URLSearchParams()
  
  // Получаем токен из cookies или используем пустой
  const token = typeof window !== 'undefined' && window.localStorage
    ? localStorage.getItem('access_token')
    : null
  
  if (token) {
    params.append('jwt_token', token)
  } else {
    params.append('jwt_token', '') // Пустой токен для неавторизованных пользователей
  }
  
  if (filters?.nko_id && filters.nko_id.length > 0) {
    filters.nko_id.forEach(id => params.append('nko_id', id.toString()))
  }
  
  if (filters?.category && filters.category.length > 0) {
    filters.category.forEach(cat => params.append('category', cat))
  }
  
  if (filters?.regex) {
    params.append('regex', filters.regex)
  }
  
  if (filters?.time_from) {
    params.append('time_from', filters.time_from)
  }
  
  if (filters?.time_to) {
    params.append('time_to', filters.time_to)
  }
  
  const queryString = params.toString()
  const endpoint = `/event${queryString ? `?${queryString}` : ''}`
  
  return apiClient.get<EventResponse[]>(endpoint)
}

export async function fetchEventById(id: number): Promise<EventResponse> {
  // Добавляем JWT токен как в других функциях
  const token = typeof window !== 'undefined' && window.localStorage
    ? localStorage.getItem('access_token')
    : null
  
  const params = new URLSearchParams()
  if (token) {
    params.append('jwt_token', token)
  } else {
    params.append('jwt_token', '') // Пустой токен для неавторизованных пользователей
  }
  
  const queryString = params.toString()
  const endpoint = `/event/${id}${queryString ? `?${queryString}` : ''}`
  
  console.log('DEBUG: fetchEventById - ID:', id, 'Endpoint:', endpoint)
  
  return apiClient.get<EventResponse>(endpoint)
}