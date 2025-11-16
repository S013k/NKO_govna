#!/bin/bash

# Получение всех новостей
curl -G "http://localhost/api/news" \
  --data-urlencode "jwt_token=test-token"

# Получение новостей с фильтром по городу
curl -G "http://localhost/api/news" \
  --data-urlencode "jwt_token=test-token" \
  --data-urlencode "city=Москва"

# Получение новостей с regex поиском
curl -G "http://localhost/api/news" \
  --data-urlencode "jwt_token=test-token" \
  --data-urlencode "regex=Росатом"

# Получение новостей с фильтром по избранным (заглушка)
curl -G "http://localhost/api/news" \
  --data-urlencode "jwt_token=test-token" \
  --data-urlencode "favorite=true"

# Комбинированный фильтр: город + regex
curl -G "http://localhost/api/news" \
  --data-urlencode "jwt_token=test-token" \
  --data-urlencode "city=Москва" \
  --data-urlencode "regex=фестиваль"

# Получение новости по ID
curl -X GET http://localhost/api/news/1

# Создание новой новости
curl -X POST http://localhost/api/news \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Тестовая новость",
    "description": "Описание тестовой новости для проверки API",
    "image": "https://example.com/news-test.jpg",
    "city_id": 2,
    "meta": "Дополнительная информация о новости"
  }'

# Удаление новости по ID

echo "=== Тестирование избранного для новостей ==="

# Регистрация нового пользователя для тестирования
echo "1. Регистрация нового пользователя..."
curl -X POST http://localhost/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Тестовый Пользователь Новости",
    "login": "test_news_user",
    "password": "test123",
    "role": "user"
  }'

echo -e "\n"

# Получение токена
echo "2. Получение токена..."
TOKEN=$(curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test_news_user&password=test123" \
  | jq -r '.access_token')

echo "Токен: $TOKEN"
echo -e "\n"

# Добавление новостей в избранное
echo "3. Добавление новости с ID 1 в избранное..."
curl -X POST http://localhost/api/news/1/favorite \
  -H "Authorization: Bearer $TOKEN"

echo -e "\n"

echo "4. Добавление новости с ID 3 в избранное..."
curl -X POST http://localhost/api/news/3/favorite \
  -H "Authorization: Bearer $TOKEN"

echo -e "\n"

echo "5. Добавление новости с ID 5 в избранное..."
curl -X POST http://localhost/api/news/5/favorite \
  -H "Authorization: Bearer $TOKEN"

echo -e "\n"

# Получение списка избранных новостей через фильтр
echo "6. Получение списка избранных новостей (должны быть ID 1, 3, 5)..."
curl -G "http://localhost/api/news" \
  --data-urlencode "jwt_token=$TOKEN" \
  --data-urlencode "favorite=true"

echo -e "\n"

# Удаление новости из избранного
echo "7. Удаление новости с ID 3 из избранного..."
curl -X DELETE http://localhost/api/news/3/favorite \
  -H "Authorization: Bearer $TOKEN"

echo -e "\n"

# Получение обновленного списка избранных новостей через фильтр
echo "8. Получение обновленного списка избранных новостей (должны быть только ID 1 и 5)..."
curl -G "http://localhost/api/news" \
  --data-urlencode "jwt_token=$TOKEN" \
  --data-urlencode "favorite=true"

echo -e "\n"
curl -X DELETE http://localhost/api/news/1