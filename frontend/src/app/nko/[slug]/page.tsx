'use client'

import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { MapPin, Phone, Mail, Globe, Users, Calendar, ArrowLeft, Heart, Share2, Star } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { fetchNKOById, NKOResponse } from '@/lib/api'
import { notFound } from 'next/navigation'
import { NKOLogo } from '@/components/NKOLogo'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function NKODetailPage() {
  const params = useParams()
  const slug = params.slug as string
  const { user } = useAuth()
  
  const [nko, setNko] = useState<NKOResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  
  console.log('NKODetailPage - slug:', slug)
  
  useEffect(() => {
    const loadNKO = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const id = parseInt(slug)
        console.log('NKODetailPage - parsed ID:', id)
        
        if (isNaN(id)) {
          throw new Error('Invalid ID')
        }
        
        const nkoData = await fetchNKOById(id)
        console.log('NKODetailPage - fetched NKO:', nkoData)
        setNko(nkoData)
      } catch (err) {
        console.error('Error fetching NKO:', err)
        setError('Не удалось загрузить данные организации')
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      loadNKO()
    }
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[var(--color-text-secondary)]">Загрузка организации...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !nko) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">
              Организация не найдена
            </h2>
            <p className="text-[var(--color-text-secondary)] mb-6">
              {error || 'Запрошенная организация не существует'}
            </p>
            <Link href="/nko">
              <Button className="btn-primary">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Вернуться к списку
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero секция организации */}
      <section className="bg-gradient-to-r from-[#15256D] to-[#003274] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Link 
              href="/nko"
              className="inline-flex items-center text-white/80 hover:text-white transition-colors mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Вернуться к списку организаций
            </Link>
          </div>
          
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
            {/* Логотип */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                {nko.logo ? (
                  <NKOLogo
                    logoId={nko.id.toString()}
                    width={128}
                    height={128}
                    className="w-24 h-24 object-contain"
                    alt={nko.name}
                  />
                ) : (
                  <div className="w-24 h-24 bg-white/20 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-3xl">
                      {nko.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Информация об организации */}
            <div className="flex-1 text-center lg:text-left">
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-4">
                <h1 className="text-3xl lg:text-4xl font-bold text-white">
                  {nko.name}
                </h1>
                <div className="flex flex-wrap gap-2">
                  {nko.categories.map((category, index) => (
                    <span key={index} className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                      {category}
                    </span>
                  ))}
                </div>
              </div>
              
              <p className="text-xl text-white/90 mb-6 max-w-3xl">
                {nko.description}
              </p>
              
              {/* Кнопки действий */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button size="lg" className="bg-white text-[var(--color-primary)] hover:bg-gray-100">
                  <Users className="h-4 w-4 mr-2" />
                  Стать волонтером
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white bg-transparent hover:bg-white hover:text-[var(--color-primary)]"
                  onClick={() => {
                    console.log('Button clicked - user:', user)
                    if (!user) {
                      console.log('Showing auth modal')
                      setShowAuthModal(true)
                    } else {
                      console.log('Toggling favorite:', !isFavorite)
                      setIsFavorite(!isFavorite)
                    }
                  }}
                >
                  <Star className={`h-4 w-4 mr-2 ${isFavorite ? 'fill-current' : ''}`} />
                  {isFavorite ? 'В избранном' : 'В избранное'}
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white bg-transparent hover:bg-white hover:text-[var(--color-primary)]">
                  <Share2 className="h-4 w-4 mr-2" />
                  Поделиться
                </Button>
              </div>

              {/* Модальное окно авторизации */}
              {showAuthModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                      Требуется авторизация
                    </h3>
                    <p className="text-[var(--color-text-secondary)] mb-4">
                      Чтобы добавлять организации в избранное, пожалуйста, войдите в свой аккаунт.
                    </p>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => setShowAuthModal(false)}
                        variant="outline"
                        className="flex-1"
                      >
                        Отмена
                      </Button>
                      <Button
                        onClick={() => {
                          setShowAuthModal(false)
                          // Здесь можно добавить логику перехода на страницу входа
                        }}
                        className="flex-1 btn-primary"
                      >
                        Войти
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Контактная информация */}
      <section className="py-12 bg-[var(--color-bg-secondary)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Контактные данные */}
            <Card className="border-[var(--color-border)]">
              <CardHeader>
                <h3 className="text-xl font-bold text-[var(--color-text-primary)]">
                  Контактная информация
                </h3>
              </CardHeader>
              <CardContent className="space-y-4">
                {nko.address && (
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-[var(--color-primary)] mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-[var(--color-text-secondary)]">{nko.address}</span>
                  </div>
                )}
                
                {nko.meta?.url && (
                  <div className="flex items-center">
                    <Globe className="h-5 w-5 text-[var(--color-primary)] mr-3 flex-shrink-0" />
                    <a
                      href={nko.meta.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
                    >
                      {nko.meta.url}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Описание деятельности */}
            <Card className="border-[var(--color-border)] lg:col-span-2">
              <CardHeader>
                <h3 className="text-xl font-bold text-[var(--color-text-primary)]">
                  Описание деятельности
                </h3>
              </CardHeader>
              <CardContent>
                <p className="text-[var(--color-text-secondary)] leading-relaxed">
                  {nko.description}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Волонтерские возможности */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-[var(--color-border)]">
            <CardHeader>
              <h3 className="text-xl font-bold text-[var(--color-text-primary)]">
                Что могут делать волонтеры
              </h3>
            </CardHeader>
            <CardContent>
              <p className="text-[var(--color-text-secondary)] leading-relaxed">
                Информация о волонтерских возможностях будет доступна скоро.
              </p>
              <div className="mt-6">
                <Button size="lg" className="btn-primary">
                  <Users className="h-4 w-4 mr-2" />
                  Стать волонтером
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>


      <Footer />
    </div>
  )
}