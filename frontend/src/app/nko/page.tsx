'use client'

import { Header } from '@/components/Header'
import { NKOCard } from '@/components/NKOCard'
import { Footer } from '@/components/Footer'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search, Filter, Heart, X } from 'lucide-react'
import { fetchNKO, fetchCities, NKOResponse, CityResponse, NKOFilters } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { useState, useMemo, useEffect } from 'react'

export default function NKOPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedCity, setSelectedCity] = useState<string>('all')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [nkoData, setNKOData] = useState<NKOResponse[]>([])
  const [cities, setCities] = useState<CityResponse[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // DEBUG: Log authentication state
  console.log('DEBUG: NKO Page - User auth state:', {
    user: user ? { id: user.id, login: user.login, role: user.role } : null,
    authLoading
  })
  console.log('DEBUG: NKO Page - Show favorites only:', showFavoritesOnly)

  // Загрузка данных при монтировании компонента и изменении фильтров
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // DEBUG: Log filter parameters
        const filters: NKOFilters = {}
        if (selectedCity !== 'all') {
          filters.city = selectedCity
        }
        if (selectedCategory !== 'all') {
          filters.category = [selectedCategory]
        }
        if (searchTerm) {
          filters.regex = searchTerm
        }
        
        // Добавляем фильтр по избранным только для авторизованных пользователей
        if (showFavoritesOnly && user) {
          filters.favorite = true
          console.log('DEBUG: NKO Page - Applying favorites filter for user:', user.id)
        } else if (showFavoritesOnly && !user) {
          console.warn('DEBUG: NKO Page - Cannot apply favorites filter - user not authenticated')
          // Не применяем фильтр если пользователь не авторизован
        }
        
        console.log('DEBUG: NKO Page - Loading data with filters:', filters)
        console.log('DEBUG: NKO Page - Show favorites only:', showFavoritesOnly)
        console.log('DEBUG: NKO Page - User authenticated:', !!user)
        
        // Параллельно загружаем НКО и города
        const [nkoResponse, citiesResponse] = await Promise.all([
          fetchNKO(filters),
          fetchCities()
        ])
        
        console.log('DEBUG: NKO Page - Loaded NKO count:', nkoResponse.length)
        setNKOData(nkoResponse)
        setCities(citiesResponse)
        
        // Извлекаем уникальные категории из НКО
        const uniqueCategories = Array.from(
          new Set(nkoResponse.flatMap(nko => nko.categories))
        ).sort()
        setCategories(uniqueCategories)
        
      } catch (err) {
        console.error('Error loading data:', err)
        setError('Не удалось загрузить данные. Попробуйте обновить страницу.')
      } finally {
        setLoading(false)
      }
    }

    // Ждем окончания загрузки авторизации перед загрузкой данных
    if (!authLoading) {
      loadData()
    }
  }, [authLoading, selectedCity, selectedCategory, searchTerm, showFavoritesOnly, user])

  const filteredNKO = useMemo(() => {
    return nkoData.filter(nko => {
      const matchesSearch = nko.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (nko.description && nko.description.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesCategory = selectedCategory === 'all' || nko.categories.includes(selectedCategory)
      const matchesCity = selectedCity === 'all' || nko.city === selectedCity
      
      return matchesSearch && matchesCategory && matchesCity
    })
  }, [nkoData, searchTerm, selectedCategory, selectedCity])

  // Модальное окно авторизации
  const AuthModal = () => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center min-h-screen z-50">
        <div className="bg-white rounded-lg p-6 max-w-md mx-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex-1"></div>
            <h3 className="text-lg font-semibold text-gray-900 text-center">Требуется авторизация</h3>
            <div className="flex-1 flex justify-end">
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
          
          <div className="text-center text-gray-600 mb-4">
            Чтобы добавлять организации в избранное, пожалуйста, войдите в систему
          </div>
          
          <div className="flex justify-center">
            <Button
              onClick={() => setShowAuthModal(false)}
              className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Закрыть
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Заголовок страницы */}
      <section className="bg-[var(--color-bg-secondary)] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-[var(--color-text-primary)] mb-4">
              Некоммерческие организации
            </h1>
            <p className="text-xl text-[var(--color-text-secondary)] max-w-3xl mx-auto">
              Найдите организации, которые занимаются благотворительностью, экологией, образованием и другими важными инициативами в вашем городе
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
                    placeholder="Поиск организаций..."
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
              
              {/* Фильтр по избранным (для всех пользователей) */}
              <div>
                <Button
                  variant={showFavoritesOnly ? "default" : "outline"}
                  onClick={() => {
                    if (!user) {
                      setShowAuthModal(true)
                    } else {
                      setShowFavoritesOnly(!showFavoritesOnly)
                    }
                  }}
                  className={`w-full ${showFavoritesOnly ? 'btn-primary' : 'btn-secondary'}`}
                >
                  <Heart className={`h-4 w-4 mr-2 ${showFavoritesOnly ? 'fill-current' : ''}`} />
                  Избранные
                </Button>
              </div>
              
              {/* Сброс фильтров */}
              <div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedCategory('all')
                    setSelectedCity('all')
                    setShowFavoritesOnly(false)
                    setShowAuthModal(false)
                  }}
                  className="w-full btn-secondary"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Сбросить
                </Button>
              </div>
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
                <Search className="h-8 w-8 text-[var(--color-text-secondary)]" />
              </div>
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
                Загрузка организаций...
              </h3>
            </div>
          )}

          {/* Сообщение об ошибке */}
          {error && (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-red-500" />
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
                  Найдено организаций: <span className="font-semibold text-[var(--color-text-primary)]">{filteredNKO.length}</span>
                </p>
              </div>

              {/* Сетка карточек */}
              {filteredNKO.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredNKO.map((nko) => (
                    <NKOCard key={nko.id} nko={nko} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-[var(--color-bg-secondary)] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-[var(--color-text-secondary)]" />
                  </div>
                  <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
                    Организации не найдены
                  </h3>
                  <p className="text-[var(--color-text-secondary)] mb-6">
                    Попробуйте изменить параметры поиска или фильтры
                  </p>
                  <Button
                    onClick={() => {
                      setSearchTerm('')
                      setSelectedCategory('all')
                      setSelectedCity('all')
                      setShowFavoritesOnly(false)
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

      {/* Модальное окно авторизации */}
      {showAuthModal && <AuthModal />}

      <Footer />
    </div>
  )
}