#!/bin/bash

# Получение списка НКО с фильтром по городу
curl -X GET "http://localhost/api/nko?jwt_token=test-token&city=Москва"

# Получение списка НКО с фильтром по категории
curl -X GET "http://localhost/api/nko?jwt_token=test-token&category=Экологические%20инициативы"

# Получение списка НКО с фильтром по regex
curl -X GET "http://localhost/api/nko?jwt_token=test-token&regex=инициативы"

# Получение всех НКО без фильтров
curl -X GET "http://localhost/api/nko?jwt_token=test-token"

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
