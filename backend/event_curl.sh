#!/bin/bash

# Получение всех событий
curl -G "http://localhost/api/event" \
  --data-urlencode "jwt_token=test-token"

# Получение событий с фильтром по одному НКО
curl -G "http://localhost/api/event" \
  --data-urlencode "jwt_token=test-token" \
  --data-urlencode "nko_id=1"

# Получение событий с фильтром по нескольким НКО
curl -G "http://localhost/api/event" \
  --data-urlencode "jwt_token=test-token" \
  --data-urlencode "nko_id=1" \
  --data-urlencode "nko_id=2"

# Получение событий с фильтром по категории
curl -G "http://localhost/api/event" \
  --data-urlencode "jwt_token=test-token" \
  --data-urlencode "category=Спорт"

# Получение событий с фильтром по нескольким категориям
curl -G "http://localhost/api/event" \
  --data-urlencode "jwt_token=test-token" \
  --data-urlencode "category=Спорт" \
  --data-urlencode "category=Культура"

# Получение событий с фильтром по временному диапазону
curl -G "http://localhost/api/event" \
  --data-urlencode "jwt_token=test-token" \
  --data-urlencode "time_from=2024-01-01T00:00:00" \
  --data-urlencode "time_to=2024-12-31T23:59:59"

# Получение событий с regex поиском
curl -G "http://localhost/api/event" \
  --data-urlencode "jwt_token=test-token" \
  --data-urlencode "regex=концерт"

# Получение событий с фильтром по избранным (заглушка)
curl -G "http://localhost/api/event" \
  --data-urlencode "jwt_token=test-token" \
  --data-urlencode "favorite=true"

# Комбинированный фильтр: НКО + категория + время
curl -G "http://localhost/api/event" \
  --data-urlencode "jwt_token=test-token" \
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
curl -X DELETE http://localhost/api/event/1