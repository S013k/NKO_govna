'use client'

import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { MapPin, Phone, Mail, Globe, Users, Calendar, ArrowLeft, Heart, Share2, Star, Clock, Building } from 'lucide-react'
import { S3Image } from '@/components/S3Image'
import Link from 'next/link'
import { fetchEventById, EventResponse } from '@/lib/api'
import { notFound } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useParams } from 'next/navigation'

export default function EventDetailPage() {
  const params = useParams()
  const id = params.id as string
  const { user } = useAuth()
  
  const [event, setEvent] = useState<EventResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  
  console.log('EventDetailPage - id:', id)
  
  useEffect(() => {
    const loadEvent = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const eventId = parseInt(id)
        console.log('EventDetailPage - parsed ID:', eventId)
        
        if (isNaN(eventId)) {
          throw new Error('Invalid ID')
        }
        
        const eventData = await fetchEventById(eventId)
        console.log('EventDetailPage - fetched Event:', eventData)
        setEvent(eventData)
      } catch (err) {
        console.error('Error fetching Event:', err)
        setError('Не удалось загрузить данные события')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      loadEvent()
    }
  }, [id])

  // Format date and time
  const formatDateTime = (dateString?: string) => {
    if (!dateString) return ''
    
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    
    return `${day}.${month}.${year} ${hours}:${minutes}`
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    
    return `${day}.${month}.${year}`
  }

  const formatTime = (dateString?: string) => {
    if (!dateString) return ''
    
    const date = new Date(dateString)
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    
    return `${hours}:${minutes}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[var(--color-text-secondary)]">Загрузка события...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">
              Событие не найдено
            </h2>
            <p className="text-[var(--color-text-secondary)] mb-6">
              {error || 'Запрошенное событие не существует'}
            </p>
            <Link href="/events">
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
      
      {/* Hero секция события */}
      <section className="bg-gradient-to-r from-[#15256D] to-[var(--color-primary)] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Link 
              href="/events"
              className="inline-flex items-center text-white/80 hover:text-white transition-colors mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Вернуться к списку событий
            </Link>
          </div>
          
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
            {/* Изображение события */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                {event.picture ? (
                  <S3Image
                    src={`/api/s3/event-pics/${event.picture}`}
                    width={128}
                    height={128}
                    className="w-24 h-24 object-contain rounded-xl"
                    alt={event.name}
                  />
                ) : (
                  <div className="w-24 h-24 bg-white/20 rounded-xl flex items-center justify-center">
                    <Calendar className="h-12 w-12 text-white" />
                  </div>
                )}
              </div>
            </div>
            
            {/* Информация о событии */}
            <div className="flex-1 text-center lg:text-left">
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-4">
                <h1 className="text-3xl lg:text-4xl font-bold text-white">
                  {event.name}
                </h1>
                <div className="flex flex-wrap gap-2">
                  {event.categories.map((category, index) => (
                    <span key={index} className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                      {category}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Дата и время */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mb-4">
                {event.starts_at && (
                  <div className="flex items-center text-white/90">
                    <Calendar className="h-5 w-5 mr-2" />
                    <span>{formatDate(event.starts_at)}</span>
                  </div>
                )}
                
                {event.starts_at && (
                  <div className="flex items-center text-white/90">
                    <Clock className="h-5 w-5 mr-2" />
                    <span>{formatTime(event.starts_at)}</span>
                  </div>
                )}
              </div>
              
              <p className="text-xl text-white/90 mb-6 max-w-3xl">
                {event.description}
              </p>
              
              {/* Кнопки действий */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button size="lg" className="bg-white text-[var(--color-primary)] hover:bg-gray-100">
                  <Users className="h-4 w-4 mr-2" />
                  Участвовать
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
                      Чтобы добавлять события в избранное, пожалуйста, войдите в свой аккаунт.
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

      {/* Информация о событии */}
      <section className="py-12 bg-[var(--color-bg-secondary)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Контактная информация */}
            <Card className="border-[var(--color-border)]">
              <CardHeader>
                <h3 className="text-xl font-bold text-[var(--color-text-primary)]">
                  Информация о событии
                </h3>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Организатор */}
                {event.nko_name && (
                  <div className="flex items-start">
                    <Building className="h-5 w-5 text-[var(--color-primary)] mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[var(--color-text-secondary)] block">Организатор</span>
                      {event.nko_id ? (
                        <Link href={`/nko/${event.nko_id}`} className="text-[var(--color-primary)] hover:underline">
                          {event.nko_name}
                        </Link>
                      ) : (
                        <span className="text-[var(--color-text-primary)]">{event.nko_name}</span>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Адрес */}
                {event.address && (
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-[var(--color-primary)] mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-[var(--color-text-secondary)]">{event.address}</span>
                  </div>
                )}
                
                {/* Дата начала */}
                {event.starts_at && (
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-[var(--color-primary)] mr-3 flex-shrink-0" />
                    <div>
                      <span className="text-[var(--color-text-secondary)] block">Дата начала</span>
                      <span className="text-[var(--color-text-primary)]">{formatDateTime(event.starts_at)}</span>
                    </div>
                  </div>
                )}
                
                {/* Дата окончания */}
                {event.finish_at && (
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-[var(--color-primary)] mr-3 flex-shrink-0" />
                    <div>
                      <span className="text-[var(--color-text-secondary)] block">Дата окончания</span>
                      <span className="text-[var(--color-text-primary)]">{formatDateTime(event.finish_at)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Описание события */}
            <Card className="border-[var(--color-border)] lg:col-span-2">
              <CardHeader>
                <h3 className="text-xl font-bold text-[var(--color-text-primary)]">
                  Описание события
                </h3>
              </CardHeader>
              <CardContent>
                <p className="text-[var(--color-text-secondary)] leading-relaxed">
                  {event.description || 'Описание события отсутствует'}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Участие в событии */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-[var(--color-border)]">
            <CardHeader>
              <h3 className="text-xl font-bold text-[var(--color-text-primary)]">
                Участие в событии
              </h3>
            </CardHeader>
            <CardContent>
              <p className="text-[var(--color-text-secondary)] leading-relaxed mb-6">
                Чтобы принять участие в этом событии, нажмите кнопку "Участвовать" выше. 
                Организатор свяжется с вами для подтверждения участия.
              </p>
              <Button size="lg" className="btn-primary">
                <Users className="h-4 w-4 mr-2" />
                Участвовать в событии
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  )
}