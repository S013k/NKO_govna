#!/bin/bash

# Получение списка НКО с фильтром по городу (с пустым токеном)
curl -G "http://localhost/api/nko" \
  --data-urlencode "jwt_token=" \
  --data-urlencode "city=Москва"

# Получение списка НКО с фильтром по категории (с пустым токеном)
curl -G "http://localhost/api/nko" \
  --data-urlencode "jwt_token=" \
  --data-urlencode "category=Экологические инициативы"

# Получение списка НКО с фильтром по нескольким категориям (с пустым токеном)
curl -G "http://localhost/api/nko" \
  --data-urlencode "jwt_token=" \
  --data-urlencode "category=Помощь детям" \
  --data-urlencode "category=Образование"

# Получение списка НКО с фильтром по regex (с пустым токеном)
curl -G "http://localhost/api/nko" \
  --data-urlencode "jwt_token=" \
  --data-urlencode "regex=инициативы"

# Получение всех НКО без фильтров (с пустым токеном)
curl -G "http://localhost/api/nko" \
  --data-urlencode "jwt_token="

# Получение конкретного НКО по ID
curl -X GET http://localhost/api/nko/1

# Создание нового НКО
curl -X POST http://localhost/api/nko \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Тестовый фонд помощи",
    "description": "Описание тестового фонда для проверки API",
    "logo": "https://test-fond.ru/logo.png",
    "address": "г. Москва, ул. Тестовая, д. 1",
    "city": "Москва",
    "latitude": 55.7558,
    "longitude": 37.6173,
    "meta": {"url": "https://test-fond.ru", "phone": "+7 (495) 123-45-67"},
    "categories": ["Помощь детям", "Образование"]
  }'

# Удаление НКО по ID

echo "=== Тестирование избранного ==="

# Регистрация нового пользователя для тестирования
echo "1. Регистрация нового пользователя..."
curl -X POST http://localhost/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Тестовый Пользователь",
    "login": "test_favorites_user",
    "password": "test123",
    "role": "user"
  }'

echo -e "\n"

# Получение токена
echo "2. Получение токена..."
TOKEN=$(curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test_favorites_user&password=test123" \
  | jq -r '.access_token')

echo "Токен: $TOKEN"
echo -e "\n"

# Добавление НКО в избранное
echo "3. Добавление НКО с ID 1 в избранное..."
curl -X POST http://localhost/api/nko/1/favorite \
  -H "Authorization: Bearer $TOKEN"

echo -e "\n"

echo "4. Добавление НКО с ID 2 в избранное..."
curl -X POST http://localhost/api/nko/2/favorite \
  -H "Authorization: Bearer $TOKEN"

echo -e "\n"

echo "5. Добавление НКО с ID 5 в избранное..."
curl -X POST http://localhost/api/nko/5/favorite \
  -H "Authorization: Bearer $TOKEN"

echo -e "\n"

# Получение списка избранных НКО через фильтр
echo "6. Получение списка избранных НКО (должны быть ID 1, 2, 5)..."
curl -G "http://localhost/api/nko" \
  --data-urlencode "jwt_token=$TOKEN" \
  --data-urlencode "favorite=true"

echo -e "\n"

# Удаление НКО из избранного
echo "7. Удаление НКО с ID 2 из избранного..."
curl -X DELETE http://localhost/api/nko/2/favorite \
  -H "Authorization: Bearer $TOKEN"

echo -e "\n"

# Получение обновленного списка избранных НКО через фильтр
echo "8. Получение обновленного списка избранных НКО (должны быть только ID 1 и 5)..."
curl -G "http://localhost/api/nko" \
  --data-urlencode "jwt_token=$TOKEN" \
  --data-urlencode "favorite=true"

echo -e "\n"
curl -X DELETE http://localhost/api/nko/1
