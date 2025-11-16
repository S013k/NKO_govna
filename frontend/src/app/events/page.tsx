'use client'

import { Header } from '@/components/Header'
import { EventCard } from '@/components/EventCard'
import { Footer } from '@/components/Footer'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search, Filter, Calendar } from 'lucide-react'
import { fetchEvents, fetchCities, fetchNKO, EventResponse, CityResponse, EventFilters, NKOResponse } from '@/lib/api'
import { useState, useMemo, useEffect } from 'react'

export default function EventsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedCity, setSelectedCity] = useState<string>('all')
  const [selectedNKO, setSelectedNKO] = useState<string>('all')
  const [selectedDateFrom, setSelectedDateFrom] = useState<string>('')
  const [selectedDateTo, setSelectedDateTo] = useState<string>('')
  const [eventsData, setEventsData] = useState<EventResponse[]>([])
  const [cities, setCities] = useState<CityResponse[]>([])
  const [nkoList, setNkoList] = useState<NKOResponse[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Параллельно загружаем события, города и НКО
        const [eventsResponse, citiesResponse, nkoResponse] = await Promise.all([
          fetchEvents(),
          fetchCities(),
          fetchNKO()
        ])
        
        // Сортируем события по дате (ближайшие первые)
        const sortedEvents = eventsResponse.sort((a, b) => {
          const dateA = new Date(a.starts_at || 0)
          const dateB = new Date(b.starts_at || 0)
          return dateA.getTime() - dateB.getTime()
        })
        
        setEventsData(sortedEvents)
        setCities(citiesResponse)
        setNkoList(nkoResponse)
        
        // Извлекаем уникальные категории из событий
        const uniqueCategories = Array.from(
          new Set(eventsResponse.flatMap(event => event.categories))
        ).sort()
        setCategories(uniqueCategories)
        
      } catch (err) {
        console.error('Error loading data:', err)
        setError('Не удалось загрузить данные. Попробуйте обновить страницу.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const filteredEvents = useMemo(() => {
    return eventsData.filter(event => {
      const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesCategory = selectedCategory === 'all' || event.categories.includes(selectedCategory)
      
      // Фильтр по городу (через НКО)
      const matchesCity = selectedCity === 'all' || (event.nko_name && event.nko_name.includes(selectedCity))
      
      // Фильтр по НКО
      const matchesNKO = selectedNKO === 'all' || event.nko_id.toString() === selectedNKO
      
      // Фильтр по дате
      let matchesDateFrom = true
      let matchesDateTo = true
      
      if (selectedDateFrom && event.starts_at) {
        matchesDateFrom = new Date(event.starts_at) >= new Date(selectedDateFrom)
      }
      
      if (selectedDateTo && event.starts_at) {
        matchesDateTo = new Date(event.starts_at) <= new Date(selectedDateTo + 'T23:59:59')
      }
      
      return matchesSearch && matchesCategory && matchesCity && matchesNKO && matchesDateFrom && matchesDateTo
    })
  }, [eventsData, searchTerm, selectedCategory, selectedCity, selectedNKO, selectedDateFrom, selectedDateTo])

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Заголовок страницы */}
      <section className="bg-[var(--color-bg-secondary)] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-[var(--color-text-primary)] mb-4">
              События
            </h1>
            <p className="text-xl text-[var(--color-text-secondary)] max-w-3xl mx-auto">
              Узнайте о предстоящих мероприятиях, событиях и инициативах в вашем городе
            </p>
          </div>
          
          {/* Фильтры */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-[var(--color-border)]">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Поиск */}
              <div className="md:col-span-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--color-text-secondary)]" />
                  <Input
                    placeholder="Поиск событий..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-[var(--color-border)] focus:ring-[var(--color-primary)]"
                  />
                </div>
              </div>
              
              {/* Фильтр по категории */}
              <div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="border-[var(--color-border)] focus:ring-[var(--color-primary)]">
                    <SelectValue placeholder="Все категории" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все категории</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Фильтр по городу */}
              <div>
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger className="border-[var(--color-border)] focus:ring-[var(--color-primary)]">
                    <SelectValue placeholder="Все города" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все города</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city.name} value={city.name}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Фильтр по НКО */}
              <div>
                <Select value={selectedNKO} onValueChange={setSelectedNKO}>
                  <SelectTrigger className="border-[var(--color-border)] focus:ring-[var(--color-primary)]">
                    <SelectValue placeholder="Все НКО" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все НКО</SelectItem>
                    {nkoList.map((nko) => (
                      <SelectItem key={nko.id} value={nko.id.toString()}>
                        {nko.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Фильтр по датам */}
              <div className="md:col-span-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--color-text-secondary)]">Период событий</label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        type="date"
                        placeholder="От"
                        value={selectedDateFrom}
                        onChange={(e) => setSelectedDateFrom(e.target.value)}
                        className="border-[var(--color-border)] focus:ring-[var(--color-primary)]"
                      />
                      </div>
                    <div className="flex items-center text-[var(--color-text-secondary)]">
                      —
                    </div>
                    <div className="flex-1">
                      <Input
                        type="date"
                        placeholder="До"
                        value={selectedDateTo}
                        onChange={(e) => setSelectedDateTo(e.target.value)}
                        className="border-[var(--color-border)] focus:ring-[var(--color-primary)]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Сброс фильтров */}
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('')
                  setSelectedCategory('all')
                  setSelectedCity('all')
                  setSelectedNKO('all')
                  setSelectedDateFrom('')
                  setSelectedDateTo('')
                }}
                className="btn-secondary"
              >
                <Filter className="h-4 w-4 mr-2" />
                Сбросить фильтры
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Результаты поиска */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Индикатор загрузки */}
          {loading && (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-[var(--color-bg-secondary)] rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
                <Calendar className="h-8 w-8 text-[var(--color-text-secondary)]" />
              </div>
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
                Загрузка событий...
              </h3>
            </div>
          )}

          {/* Сообщение об ошибке */}
          {error && (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
                Ошибка загрузки
              </h3>
              <p className="text-[var(--color-text-secondary)] mb-6">
                {error}
              </p>
              <Button
                onClick={() => window.location.reload()}
                className="btn-primary"
              >
                Обновить страницу
              </Button>
            </div>
          )}

          {/* Результаты когда данные загружены */}
          {!loading && !error && (
            <>
              {/* Количество результатов */}
              <div className="mb-8">
                <p className="text-[var(--color-text-secondary)]">
                  Найдено событий: <span className="font-semibold text-[var(--color-text-primary)]">{filteredEvents.length}</span>
                </p>
              </div>

              {/* Сетка карточек */}
              {filteredEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-[var(--color-bg-secondary)] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-8 w-8 text-[var(--color-text-secondary)]" />
                  </div>
                  <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
                    События не найдены
                  </h3>
                  <p className="text-[var(--color-text-secondary)] mb-6">
                    Попробуйте изменить параметры поиска или фильтры
                  </p>
                  <Button
                    onClick={() => {
                      setSearchTerm('')
                      setSelectedCategory('all')
                      setSelectedCity('all')
                      setSelectedNKO('all')
                      setSelectedDateFrom('')
                      setSelectedDateTo('')
                    }}
                    className="btn-primary"
                  >
                    Сбросить фильтры
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}