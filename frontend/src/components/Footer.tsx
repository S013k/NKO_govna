'use client'

import Link from 'next/link'
import { MapPin, Phone, Mail, Globe, Facebook, Twitter, Linkedin, Youtube } from 'lucide-react'
import { RosatomLogo } from '@/components/RosatomLogo'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-[var(--color-bg-secondary)] border-t border-[var(--color-border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* О проекте */}
          <div className="lg:col-span-1">
            <div className="mb-4">
              <RosatomLogo
                type="horizontalColor"
                width={120}
                height={40}
                className="h-10 w-auto"
              />
            </div>
            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
              Единый портал для жителей, волонтёров и НКО, где собрана вся информация о социальных инициативах в городах присутствия Росатома.
            </p>
            <div className="flex space-x-3">
              <a 
                href="#" 
                className="w-8 h-8 bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center hover:bg-[var(--color-primary-hover)] transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a 
                href="#" 
                className="w-8 h-8 bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center hover:bg-[var(--color-primary-hover)] transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a 
                href="#" 
                className="w-8 h-8 bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center hover:bg-[var(--color-primary-hover)] transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a 
                href="#" 
                className="w-8 h-8 bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center hover:bg-[var(--color-primary-hover)] transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Разделы сайта */}
          <div>
            <h3 className="font-bold text-[var(--color-text-primary)] text-lg mb-4">
              Разделы сайта
            </h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/nko" 
                  className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors text-sm"
                >
                  Некоммерческие организации
                </Link>
              </li>
              <li>
                <Link 
                  href="/news" 
                  className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors text-sm"
                >
                  Новости
                </Link>
              </li>
              <li>
                <Link 
                  href="/knowledge" 
                  className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors text-sm"
                >
                  База знаний
                </Link>
              </li>
              <li>
                <Link 
                  href="/calendar" 
                  className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors text-sm"
                >
                  Календарь событий
                </Link>
              </li>
            </ul>
          </div>

          {/* Категории НКО */}
          <div>
            <h3 className="font-bold text-[var(--color-text-primary)] text-lg mb-4">
              Категории НКО
            </h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/nko?category=Социальная помощь" 
                  className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors text-sm"
                >
                  Социальная помощь
                </Link>
              </li>
              <li>
                <Link 
                  href="/nko?category=Экология" 
                  className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors text-sm"
                >
                  Экология
                </Link>
              </li>
              <li>
                <Link 
                  href="/nko?category=Образование" 
                  className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors text-sm"
                >
                  Образование
                </Link>
              </li>
              <li>
                <Link 
                  href="/nko?category=Спорт" 
                  className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors text-sm"
                >
                  Спорт
                </Link>
              </li>
              <li>
                <Link 
                  href="/nko?category=Культура" 
                  className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors text-sm"
                >
                  Культура
                </Link>
              </li>
            </ul>
          </div>

          {/* Контакты */}
          <div>
            <h3 className="font-bold text-[var(--color-text-primary)] text-lg mb-4">
              Контакты
            </h3>
            <div className="space-y-3">
              <div className="flex items-center text-[var(--color-text-secondary)] text-sm">
                <MapPin className="h-4 w-4 mr-2 flex-shrink-0 text-[var(--color-primary)]" />
                <span>г. Москва, ул. Большая Ордынка, д. 24/26</span>
              </div>
              <div className="flex items-center text-[var(--color-text-secondary)] text-sm">
                <Phone className="h-4 w-4 mr-2 flex-shrink-0 text-[var(--color-primary)]" />
                <a href="tel:+74959999999" className="hover:text-[var(--color-primary)] transition-colors">
                  +7 (495) 999-99-99
                </a>
              </div>
              <div className="flex items-center text-[var(--color-text-secondary)] text-sm">
                <Mail className="h-4 w-4 mr-2 flex-shrink-0 text-[var(--color-primary)]" />
                <a href="mailto:info@rosatom-gooddeeds.ru" className="hover:text-[var(--color-primary)] transition-colors">
                  info@rosatom-gooddeeds.ru
                </a>
              </div>
              <div className="flex items-center text-[var(--color-text-secondary)] text-sm">
                <Globe className="h-4 w-4 mr-2 flex-shrink-0 text-[var(--color-primary)]" />
                <a 
                  href="https://rosatom.ru" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-[var(--color-primary)] transition-colors"
                >
                  rosatom.ru
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Нижняя часть футера */}
        <div className="border-t border-[var(--color-border)] mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 md:mb-0">
              © {currentYear} Государственная корпорация по атомной энергии "Росатом". Все права защищены.
            </p>
            <div className="flex flex-wrap items-center space-x-4 text-sm">
              <Link 
                href="/privacy" 
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
              >
                Политика конфиденциальности
              </Link>
              <Link 
                href="/terms" 
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
              >
                Условия использования
              </Link>
              <Link 
                href="/accessibility" 
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
              >
                Доступность
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}