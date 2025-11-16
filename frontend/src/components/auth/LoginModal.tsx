'use client'

import React, { useState } from 'react'
import { Loader2, AlertCircle, Lock, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/contexts/AuthContext'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSwitchToRegister: () => void
}

interface FormData {
  login: string
  password: string
}

interface FormErrors {
  login?: string
  password?: string
  general?: string
}

export function LoginModal({ isOpen, onClose, onSwitchToRegister }: LoginModalProps) {
  const [formData, setFormData] = useState<FormData>({
    login: '',
    password: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [touched, setTouched] = useState<{ login: boolean; password: boolean }>({
    login: false,
    password: false
  });

  const { login: authLogin } = useAuth()

  const validateField = (name: keyof FormData, value: string): string | undefined => {
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
    newErrors.login = validateField('login', formData.login)
    newErrors.password = validateField('password', formData.password)
    
    setErrors(newErrors)
    setTouched({ login: true, password: true })
    
    return !newErrors.login && !newErrors.password
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setErrors({})

     try {
      await authLogin(formData.login, formData.password)
      onClose()
      // Очищаем форму после успешного входа
      setFormData({ login: '', password: '' })
      setTouched({ login: false, password: false })
    } catch (err) {
      console.log('DEBUG: LoginModal caught error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Ошибка входа'
      console.log('DEBUG: LoginModal setting error message:', errorMessage)
      setErrors({ general: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      console.log('DEBUG: handleClose called with formData:', formData)
      setErrors({})
      setFormData({ login: '', password: '' })
      setTouched({ login: false, password: false })
      onClose()
    }
  }

  const handleSwitchToRegister = () => {
    if (!isLoading) {
      setErrors({})
      setFormData({ login: '', password: '' })
      setTouched({ login: false, password: false })
      onSwitchToRegister()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[440px] bg-background border-border">
        <DialogHeader>
          <DialogTitle className="modal-title">
            Вход в систему
          </DialogTitle>
          <DialogDescription className="modal-subtitle">
            Войдите в свой аккаунт для продолжения
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          {errors.general && (
            <div className="form-error">
              {errors.general}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="login" className="form-label">
              Email
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                id="login"
                name="login"
                type="email"
                placeholder="Введите ваш email"
                value={formData.login}
                onChange={handleInputChange}
                onBlur={handleBlur}
                disabled={isLoading}
                className={`form-input pl-10 pr-4 ${
                  errors.login && touched.login ? 'error' : ''
                }`}
                style={{ paddingLeft: '40px' }}
              />
            </div>
            {errors.login && touched.login && (
              <div className="form-error">
                {errors.login}
              </div>
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
                placeholder="Введите ваш пароль"
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
                Вход...
              </>
            ) : (
              'Войти'
            )}
            </Button>
          </div>

          <div className="relative mt-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Нет аккаунта?
              </span>
            </div>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={handleSwitchToRegister}
              disabled={isLoading}
              className="text-sm font-medium hover:underline"
              style={{ color: '#0066B3' }}
            >
              Зарегистрироваться
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}