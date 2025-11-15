'use client'

import React, { useState } from 'react'
import { Loader2, AlertCircle, Lock, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/contexts/AuthContext'

interface RegisterModalProps {
  isOpen: boolean
  onClose: () => void
  onSwitchToLogin: () => void
}

interface FormData {
  full_name: string
  login: string
  password: string
  confirmPassword: string
}

interface FormErrors {
  full_name?: string
  login?: string
  password?: string
  confirmPassword?: string
  general?: string
}

export function RegisterModal({ isOpen, onClose, onSwitchToLogin }: RegisterModalProps) {
  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    login: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [touched, setTouched] = useState<{
    full_name: boolean
    login: boolean
    password: boolean
    confirmPassword: boolean
  }>({
    full_name: false,
    login: false,
    password: false,
    confirmPassword: false
  });

  const { register: authRegister } = useAuth()

  const validateField = (name: keyof FormData, value: string): string | undefined => {
    if (name === 'full_name') {
      if (!value.trim()) {
        return 'Полное имя обязательно'
      }
      if (value.length < 2) {
        return 'Имя должно содержать минимум 2 символа'
      }
    }
    if (name === 'login') {
      if (!value.trim()) {
        return 'Email обязателен'
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Введите корректный email адрес'
      }
    }
    if (name === 'password') {
      if (!value) {
        return 'Пароль обязателен'
      }
      if (value.length < 6) {
        return 'Пароль должен содержать минимум 6 символов'
      }
    }
    if (name === 'confirmPassword') {
      if (!value) {
        return 'Подтверждение пароля обязательно'
      }
      if (value !== formData.password) {
        return 'Пароли не совпадают'
      }
    }
    return undefined
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    if (touched[name as keyof typeof touched]) {
      const error = validateField(name as keyof FormData, value)
      setErrors(prev => ({ ...prev, [name]: error, general: undefined }))
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setTouched(prev => ({ ...prev, [name]: true }))
    const error = validateField(name as keyof FormData, value)
    setErrors(prev => ({ ...prev, [name]: error }))
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    newErrors.full_name = validateField('full_name', formData.full_name)
    newErrors.login = validateField('login', formData.login)
    newErrors.password = validateField('password', formData.password)
    newErrors.confirmPassword = validateField('confirmPassword', formData.confirmPassword)
    
    setErrors(newErrors)
    setTouched({
      full_name: true,
      login: true,
      password: true,
      confirmPassword: true
    })
    
    return !Object.values(newErrors).some(error => error !== undefined)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
     await authRegister(formData.full_name, formData.login, formData.password, 'user')
     onClose()
     // Очищаем форму после успешной регистрации
     setFormData({
       full_name: '',
       login: '',
       password: '',
       confirmPassword: ''
     })
     setTouched({
       full_name: false,
       login: false,
       password: false,
       confirmPassword: false
     })
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : 'Ошибка регистрации' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setErrors({})
      setFormData({
       full_name: '',
       login: '',
       password: '',
       confirmPassword: ''
      })
     setTouched({
       full_name: false,
       login: false,
       password: false,
       confirmPassword: false
      })
      onClose()
    }
  }

  const handleSwitchToLogin = () => {
    if (!isLoading) {
      setErrors({})
      setFormData({
       full_name: '',
       login: '',
       password: '',
       confirmPassword: ''
      })
     setTouched({
       full_name: false,
       login: false,
       password: false,
       confirmPassword: false
      })
      onSwitchToLogin()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px] bg-background border-border">
        <DialogHeader>
          <DialogTitle className="modal-title">
            Регистрация
          </DialogTitle>
          <DialogDescription className="modal-subtitle">
            Создайте новый аккаунт для доступа к системе
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          {errors.general && (
            <div className="form-error">
              {errors.general}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="full_name" className="form-label">
              Полное имя
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                id="full_name"
                name="full_name"
                type="text"
                placeholder="Введите ваше полное имя"
                value={formData.full_name}
                onChange={handleInputChange}
                onBlur={handleBlur}
                disabled={isLoading}
                className={`form-input pl-10 pr-4 ${
                  errors.full_name && touched.full_name ? 'error' : ''
                }`}
                style={{ paddingLeft: '40px' }}
              />
            </div>
            {errors.full_name && touched.full_name && (
              <div className="form-error">
                {errors.full_name}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="login" className="text-sm font-medium text-foreground">
              Email
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="login"
                name="login"
                type="email"
                placeholder="Введите ваш email"
                value={formData.login}
                onChange={handleInputChange}
                onBlur={handleBlur}
                disabled={isLoading}
                className={`pl-10 pr-4 h-11 ${
                  errors.login && touched.login
                    ? 'border-red-500 focus-visible:ring-red-500'
                    : 'focus-visible:ring-[#0066B3]'
                }`}
                style={{ paddingLeft: '40px' }}
              />
            </div>
            {errors.login && touched.login && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.login}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-foreground">
              Пароль
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Придумайте пароль"
                value={formData.password}
                onChange={handleInputChange}
                onBlur={handleBlur}
                disabled={isLoading}
                className={`pl-10 h-11 ${
                  errors.password && touched.password
                    ? 'border-red-500 focus-visible:ring-red-500'
                    : 'focus-visible:ring-[#0066B3]'
                }`}
              />
            </div>
            {errors.password && touched.password && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.password}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
              Подтвердите пароль
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Повторите пароль"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                onBlur={handleBlur}
                disabled={isLoading}
                className={`pl-10 h-11 ${
                  errors.confirmPassword && touched.confirmPassword
                    ? 'border-red-500 focus-visible:ring-red-500'
                    : 'focus-visible:ring-[#0066B3]'
                }`}
              />
            </div>
            {errors.confirmPassword && touched.confirmPassword && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <div className="mt-6">
            <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 text-base font-semibold text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#0066B3' }}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Регистрация...
              </>
            ) : (
              'Зарегистрироваться'
            )}
            </Button>
          </div>

          <div className="relative mt-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Уже есть аккаунт?
              </span>
            </div>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={handleSwitchToLogin}
              disabled={isLoading}
              className="text-sm font-medium hover:underline"
              style={{ color: '#0066B3' }}
            >
              Войти
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}