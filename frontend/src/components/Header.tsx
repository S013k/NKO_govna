'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RosatomLogo } from '@/components/RosatomLogo'
import { cities } from '@/data/nko'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [selectedCity, setSelectedCity] = useState('Москва')

  return (
    <header className="bg-white border-b border-[var(--color-border)] sticky top-0 z-50">
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
              className="text-[var(--color-text-primary)] hover:text-[var(--color-primary)] transition-colors font-medium"
            >
              НКО
            </Link>
            <Link 
              href="/news" 
              className="text-[var(--color-text-primary)] hover:text-[var(--color-primary)] transition-colors font-medium"
            >
              Новости
            </Link>
            <Link 
              href="/knowledge" 
              className="text-[var(--color-text-primary)] hover:text-[var(--color-primary)] transition-colors font-medium"
            >
              База знаний
            </Link>
            <Link 
              href="/calendar" 
              className="text-[var(--color-text-primary)] hover:text-[var(--color-primary)] transition-colors font-medium"
            >
              Календарь
            </Link>
          </nav>

          {/* Выбор города */}
          <div className="hidden md:flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-[var(--color-primary)]" />
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="w-32 border-[var(--color-border)] focus:ring-[var(--color-primary)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              
              {/* Мобильный выбор города */}
              <div className="flex items-center space-x-2 pt-2 border-t border-[var(--color-border)]">
                <MapPin className="h-4 w-4 text-[var(--color-primary)]" />
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger className="w-32 border-[var(--color-border)] focus:ring-[var(--color-primary)]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}