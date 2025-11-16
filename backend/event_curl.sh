#!/bin/bash

# Получение всех событий (БЕЗ токена)
curl -G "http://localhost/api/event"

# Получение событий с фильтром по одному НКО (БЕЗ токена)
curl -G "http://localhost/api/event" \
  --data-urlencode "nko_id=1"

# Получение событий с фильтром по нескольким НКО (БЕЗ токена)
curl -G "http://localhost/api/event" \
  --data-urlencode "nko_id=1" \
  --data-urlencode "nko_id=2"

# Получение событий с фильтром по категории (БЕЗ токена)
curl -G "http://localhost/api/event" \
  --data-urlencode "category=Спорт"

# Получение событий с фильтром по нескольким категориям (БЕЗ токена)
curl -G "http://localhost/api/event" \
  --data-urlencode "category=Спорт" \
  --data-urlencode "category=Культура"

# Получение событий с фильтром по временному диапазону (БЕЗ токена)
curl -G "http://localhost/api/event" \
  --data-urlencode "time_from=2024-01-01T00:00:00" \
  --data-urlencode "time_to=2024-12-31T23:59:59"

# Получение событий с regex поиском (БЕЗ токена)
curl -G "http://localhost/api/event" \
  --data-urlencode "regex=концерт"

# Комбинированный фильтр: НКО + категория + время (БЕЗ токена)
curl -G "http://localhost/api/event" \
  --data-urlencode "nko_id=1" \
  --data-urlencode "category=Спорт" \
  --data-urlencode "time_from=2024-06-01T00:00:00"

# Получение события по ID
curl -X GET http://localhost/api/event/1

# Создание нового события
curl -X POST http://localhost/api/event \
  -H "Content-Type: application/json" \
  -d '{
    "nko_id": 1,
    "name": "Тестовое событие",
    "description": "Описание тестового события",
    "address": "ул. Тестовая, д. 1",
    "picture": "https://example.com/picture.jpg",
    "latitude": 55.751244,
    "longitude": 37.618423,
    "starts_at": "2024-12-01T10:00:00",
    "finish_at": "2024-12-01T18:00:00",
    "created_by": 1,
    "state": "draft",
    "meta": "{}",
    "categories": ["Спорт", "Культура"]
  }'

# Удаление события по ID

echo "=== Тестирование избранного для мероприятий ==="

# Регистрация нового пользователя для тестирования
echo "1. Регистрация нового пользователя..."
curl -X POST http://localhost/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Тестовый Пользователь События",
    "login": "test_events_user",
    "password": "test123",
    "role": "user"
  }'

echo -e "\n"

# Получение токена
echo "2. Получение токена..."
TOKEN=$(curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test_events_user&password=test123" \
  | jq -r '.access_token')

echo "Токен: $TOKEN"
echo -e "\n"

# Добавление мероприятий в избранное
echo "3. Добавление мероприятия с ID 1 в избранное..."
curl -X POST http://localhost/api/event/1/favorite \
  -H "Authorization: Bearer $TOKEN"

echo -e "\n"

echo "4. Добавление мероприятия с ID 4 в избранное..."
curl -X POST http://localhost/api/event/4/favorite \
  -H "Authorization: Bearer $TOKEN"

echo -e "\n"

echo "5. Добавление мероприятия с ID 7 в избранное..."
curl -X POST http://localhost/api/event/7/favorite \
  -H "Authorization: Bearer $TOKEN"

echo -e "\n"

# Получение списка избранных мероприятий через фильтр
echo "6. Получение списка избранных мероприятий (должны быть ID 1, 4, 7)..."
curl -G "http://localhost/api/event" \
  --data-urlencode "jwt_token=$TOKEN" \
  --data-urlencode "favorite=true"

echo -e "\n"

# Удаление мероприятия из избранного
echo "7. Удаление мероприятия с ID 4 из избранного..."
curl -X DELETE http://localhost/api/event/4/favorite \
  -H "Authorization: Bearer $TOKEN"

echo -e "\n"

# Получение обновленного списка избранных мероприятий через фильтр
echo "8. Получение обновленного списка избранных мероприятий (должны быть только ID 1 и 7)..."
curl -G "http://localhost/api/event" \
  --data-urlencode "jwt_token=$TOKEN" \
  --data-urlencode "favorite=true"

echo -e "\n"
curl -X DELETE http://localhost/api/event/1