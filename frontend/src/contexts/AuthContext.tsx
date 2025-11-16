'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { apiClient, ApiError } from '@/lib/api'
import { cookies } from '@/lib/cookies'

interface User {
  id: number
  full_name: string
  login: string
  role: 'nko' | 'admin' | 'moder' | 'user'
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (login: string, password: string) => Promise<void>
  register: (full_name: string, login: string, password: string, role: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Проверка авторизации при загрузке
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      // Сначала проверяем cookie
      const userInfo = cookies.getUserInfo()
      const token = cookies.getAccessToken()

      if (userInfo && token) {
        // Преобразуем тип role для соответствия интерфейсу User
        setUser({
          ...userInfo,
          role: userInfo.role as 'nko' | 'admin' | 'moder' | 'user'
        })
      } else {
        // Если в cookie нет данных, пробуем получить через API
        await refreshUser()
      }
    } catch (error) {
      console.error('Check auth status error:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (username: string, password: string) => {
    try {
      console.log('DEBUG: Login attempt with username:', username)
      const tokenResponse = await apiClient.login(username, password)
      console.log('DEBUG: Login successful, token received:', tokenResponse.access_token ? 'yes' : 'no')
      
      // Сохраняем токен в cookie
      cookies.setAccessToken(tokenResponse.access_token)
      console.log('DEBUG: Token saved to cookie')
      
      // Получаем данные пользователя через API
      await refreshUser()
    } catch (error) {
      console.error('Login error:', error)
      if (error instanceof ApiError) {
        console.log('DEBUG: ApiError message being thrown:', error.message)
        throw new Error(error.message)
      }
      console.log('DEBUG: Generic error being thrown: Ошибка входа')
      throw new Error('Ошибка входа')
    }
  }

  const register = async (full_name: string, username: string, password: string, role: string) => {
    try {
      await apiClient.register({
        full_name,
        login: username,
        password,
        role: role as 'nko' | 'admin' | 'moder' | 'user'
      })
      
      // После регистрации сразу входим
      await login(username, password)
    } catch (error) {
      console.error('Register error:', error)
      if (error instanceof ApiError) {
        throw new Error(error.message)
      }
      throw new Error('Ошибка регистрации')
    }
  }

  const logout = async () => {
    try {
      await apiClient.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Очищаем состояние пользователя
      setUser(null)
      // Очищаем авторизационные cookie
      cookies.clearAuthCookies()
      console.log('DEBUG: User logged out, cookies cleared')
    }
  }

  const refreshUser = async () => {
    try {
      console.log('DEBUG: Refreshing user data...')
      const userData = await apiClient.getCurrentUser()
      console.log('DEBUG: User data received:', userData)
      setUser(userData)
      cookies.setUserInfo(userData)
      console.log('DEBUG: User data saved to cookie')
    } catch (error) {
      console.error('Refresh user error:', error)
      setUser(null)
      cookies.clearAuthCookies()
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth должен использоваться внутри AuthProvider')
  }
  return context
}