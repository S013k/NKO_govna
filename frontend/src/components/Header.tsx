'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RosatomLogo } from '@/components/RosatomLogo'
import { cities } from '@/data/nko'
import { useAuth } from '@/contexts/AuthContext'
import { LoginModal } from '@/components/auth/LoginModal'
import { RegisterModal } from '@/components/auth/RegisterModal'
import { UserDropdown } from '@/components/auth/UserDropdown'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [selectedCity, setSelectedCity] = useState('Москва')
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const { user, isLoading } = useAuth()

  return (
    <header className="bg-background border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Логотип */}
          <Link href="/" className="flex items-center">
            <RosatomLogo
              type="horizontalColor"
              width={120}
              height={40}
              className="h-10 w-auto"
              priority
            />
          </Link>

          {/* Десктопная навигация */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/nko"
              className="text-secondary hover:text-primary transition-colors font-medium"
            >
              НКО
            </Link>
            <Link
              href="/events"
              className="text-secondary hover:text-primary transition-colors font-medium"
            >
              События
            </Link>
            <Link
              href="/news"
              className="text-secondary hover:text-primary transition-colors font-medium"
            >
              Новости
            </Link>
            <Link
              href="/knowledge"
              className="text-secondary hover:text-primary transition-colors font-medium"
            >
              База знаний
            </Link>
            <Link
              href="/calendar"
              className="text-secondary hover:text-primary transition-colors font-medium"
            >
              Календарь
            </Link>
          </nav>

          {/* Авторизация или выбор города */}
          <div className="hidden md:flex items-center space-x-2">
            {isLoading ? (
              <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
            ) : user ? (
              <UserDropdown />
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowLoginModal(true)}
                  className="border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white"
                >
                  Войти
                </Button>
                <Button
                  onClick={() => setShowRegisterModal(true)}
                  className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white"
                >
                  Зарегистрироваться
                </Button>
              </>
            )}
          </div>

          {/* Мобильное меню */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-[var(--color-text-primary)]"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Мобильная навигация */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-[var(--color-border)] py-4">
            <nav className="flex flex-col space-y-4">
              <Link
                href="/nko"
                className="text-[var(--color-text-primary)] hover:text-[var(--color-primary)] font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                НКО
              </Link>
              <Link
                href="/events"
                className="text-[var(--color-text-primary)] hover:text-[var(--color-primary)] font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                События
              </Link>
              <Link
                href="/news"
                className="text-[var(--color-text-primary)] hover:text-[var(--color-primary)] font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Новости
              </Link>
              <Link 
                href="/knowledge" 
                className="text-[var(--color-text-primary)] hover:text-[var(--color-primary)] font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                База знаний
              </Link>
              <Link 
                href="/calendar" 
                className="text-[var(--color-text-primary)] hover:text-[var(--color-primary)] font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Календарь
              </Link>
              
              {/* Мобильная авторизация или выбор города */}
              <div className="flex items-center space-x-2 pt-2 border-t border-[var(--color-border)]">
                {isLoading ? (
                  <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
                ) : user ? (
                  <UserDropdown />
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setShowLoginModal(true)}
                      className="border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white"
                    >
                      Войти
                    </Button>
                    <Button
                      onClick={() => setShowRegisterModal(true)}
                      className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white"
                    >
                      Зарегистрироваться
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>

      {/* Модальные окна авторизации */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToRegister={() => {
          setShowLoginModal(false)
          setShowRegisterModal(true)
        }}
      />
      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSwitchToLogin={() => {
          setShowRegisterModal(false)
          setShowLoginModal(true)
        }}
      />
    </header>
  )
}