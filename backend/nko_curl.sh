#!/bin/bash

curl -X POST http://localhost/api/nko \
  -H "Content-Type: application/json" \
  -d '{"jwt_token": "test-token", "city": "Москва"}'

curl -X POST http://localhost/api/nko \
  -H "Content-Type: application/json" \
  -d '{"jwt_token": "test-token", "category": "Экологические инициативы"}'

curl -X POST http://localhost/api/nko \
  -H "Content-Type: application/json" \
  -d '{"jwt_token": "test-token", "regex": "инициативы"}'

# Получение конкретного НКО по ID
curl -X GET http://localhost/api/nko/1

# Создание нового НКО
curl -X POST http://localhost/api/nko/add \
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
