'use client'

import { Header } from '@/components/Header'
import { Hero } from '@/components/Hero'
import { NKOCard } from '@/components/NKOCard'
import { NewsCard } from '@/components/NewsCard'
import { Footer } from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { fetchNKO, NKOResponse } from '@/lib/api'
import { newsData } from '@/data/news'
import { Heart, Users, Calendar, Award, ArrowRight, MapPin } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function HomePage() {
  console.log('=== HomePage: Полная версия ===')
  
  const [nkoData, setNKOData] = useState<NKOResponse[]>([])
  const [loading, setLoading] = useState(true)
  
  // Получаем первые 6 НКО для главной страницы
  const featuredNKO = nkoData.slice(0, 6)
  
  // Получаем последние 3 новости
  const latestNews = newsData.slice(0, 3)

  // Загрузка данных при монтировании
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchNKO()
        setNKOData(data)
      } catch (error) {
        console.error('Error loading NKO data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <Hero />
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
        </div>
        <Footer />
      </div>
    )
  }

  try {
    console.log('✅ Начало рендеринга полной версии')
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <Hero />
        
        {/* Call-to-action блоки */}
        <section className="py-16 bg-[var(--color-bg-secondary)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-4">
                Как вы можете помочь
              </h2>
              <p className="text-[var(--color-text-secondary)] text-lg max-w-2xl mx-auto">
                Каждый может внести вклад в развитие наших городов. Выберите удобный для вас формат участия.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Стать волонтером */}
              <div className="bg-white p-6 rounded-xl border border-[var(--color-border)] hover-lift transition-all duration-300">
                <div className="w-12 h-12 bg-[var(--color-primary)] rounded-lg flex items-center justify-center mb-4">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold text-lg text-[var(--color-text-primary)] mb-3">
                  Стать волонтером
                </h3>
                <p className="text-[var(--color-text-secondary)] text-sm mb-4">
                  Помогайте организациям в проведении мероприятий, доставке гуманитарной помощи и других задачах.
                </p>
                <Link href="/volunteer">
                  <Button variant="outline" className="w-full btn-secondary">
                    Узнать больше
                  </Button>
                </Link>
              </div>

              {/* Поддержать проект */}
              <div className="bg-white p-6 rounded-xl border border-[var(--color-border)] hover-lift transition-all duration-300">
                <div className="w-12 h-12 bg-[var(--color-secondary)] rounded-lg flex items-center justify-center mb-4">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold text-lg text-[var(--color-text-primary)] mb-3">
                  Поддержать проект
                </h3>
                <p className="text-[var(--color-text-secondary)] text-sm mb-4">
                  Оказывайте финансовую поддержку социальным проектам и благотворительным инициативам.
                </p>
                <Link href="/donate">
                  <Button variant="outline" className="w-full btn-secondary">
                    Поддержать
                  </Button>
                </Link>
              </div>

              {/* Принять участие */}
              <div className="bg-white p-6 rounded-xl border border-[var(--color-border)] hover-lift transition-all duration-300">
                <div className="w-12 h-12 bg-[var(--color-success)] rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold text-lg text-[var(--color-text-primary)] mb-3">
                  Принять участие
                </h3>
                <p className="text-[var(--color-text-secondary)] text-sm mb-4">
                  Участвуйте в городских мероприятиях, акциях и социальных инициативах.
                </p>
                <Link href="/events">
                  <Button variant="outline" className="w-full btn-secondary">
                    Календарь событий
                  </Button>
                </Link>
              </div>

              {/* Рассказать о проблеме */}
              <div className="bg-white p-6 rounded-xl border border-[var(--color-border)] hover-lift transition-all duration-300">
                <div className="w-12 h-12 bg-[var(--color-warning)] rounded-lg flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold text-lg text-[var(--color-text-primary)] mb-3">
                  Сообщить о проблеме
                </h3>
                <p className="text-[var(--color-text-secondary)] text-sm mb-4">
                  Расскажите о социальных проблемах в вашем городе, которые требуют внимания.
                </p>
                <Link href="/report">
                  <Button variant="outline" className="w-full btn-secondary">
                    Сообщить
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Список НКО */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-12">
              <div>
                <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-4">
                  Некоммерческие организации
                </h2>
                <p className="text-[var(--color-text-secondary)] text-lg">
                  Познакомьтесь с организациями, которые меняют жизнь в наших городах к лучшему.
                </p>
              </div>
              <Link href="/nko">
                <Button className="btn-primary group">
                  Все организации
                  <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredNKO.map((nko) => (
                <NKOCard key={nko.id} nko={nko} />
              ))}
            </div>
          </div>
        </section>

        {/* Новости */}
        <section className="py-16 bg-[var(--color-bg-secondary)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-12">
              <div>
                <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-4">
                  Последние новости
                </h2>
                <p className="text-[var(--color-text-secondary)] text-lg">
                  Будьте в курсе последних событий и инициатив в городах присутствия Росатома.
                </p>
              </div>
              <Link href="/news">
                <Button variant="outline" className="btn-secondary group">
                  Все новости
                  <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {latestNews.map((news) => (
                <NewsCard key={news.id} news={news} />
              ))}
            </div>
          </div>
        </section>

        {/* Статистика */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-4">
                Наши достижения в цифрах
              </h2>
              <p className="text-[var(--color-text-secondary)] text-lg">
                Вместе мы делаем наши города лучше.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-[var(--color-primary)] mb-2">
                  150+
                </div>
                <p className="text-[var(--color-text-secondary)] text-sm">
                  Активных НКО
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-[var(--color-secondary)] mb-2">
                  5000+
                </div>
                <p className="text-[var(--color-text-secondary)] text-sm">
                  Волонтеров
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-[var(--color-success)] mb-2">
                  1000+
                </div>
                <p className="text-[var(--color-text-secondary)] text-sm">
                  Проведенных мероприятий
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-[var(--color-warning)] mb-2">
                  10
                </div>
                <p className="text-[var(--color-text-secondary)] text-sm">
                  Городов присутствия
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Призыв к действию */}
        <section className="py-16 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Присоединяйтесь к добрым делам Росатома
            </h2>
            <p className="text-white/90 text-lg mb-8">
              Вместе мы можем сделать больше. Начните свое участие в социальных инициативах уже сегодня.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/volunteer">
                <Button size="lg" className="bg-white text-[var(--color-primary)] hover:bg-gray-100 font-medium">
                  Стать волонтером
                </Button>
              </Link>
              <Link href="/nko">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-[var(--color-primary)] font-medium">
                  Найти организацию
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    )
  } catch (error) {
    console.error('❌ Ошибка в HomePage:', error)
    return (
      <div className="min-h-screen bg-white p-8">
        <h1 className="text-4xl font-bold text-red-600 mb-4">Ошибка</h1>
        <pre className="text-red-500">
          {error instanceof Error ? error.message : 'Произошла неизвестная ошибка'}
        </pre>
      </div>
    )
  }
}