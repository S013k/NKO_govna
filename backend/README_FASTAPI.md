# FastAPI Backend - Добрые дела Росатома

## Быстрый старт

### Установка зависимостей

```bash
cd backend
pip install -r requirements.txt
```

### Запуск сервера разработки

```bash
# Из директории backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Или напрямую через Python:

```bash
python main.py
```

### Доступные эндпоинты

После запуска сервер будет доступен по адресу: `http://localhost:8000`

- **GET /** - Корневой эндпоинт с информацией об API
- **GET /ping** - Проверка работоспособности (возвращает "pong")
- **GET /health** - Health check для мониторинга
- **GET /docs** - Автоматическая документация Swagger UI
- **GET /redoc** - Альтернативная документация ReDoc

### Пример запроса

```bash
curl http://localhost:8000/api/ping
```

Ответ:
```json
{
  "status": "ok",
  "message": "pong",
  "timestamp": "2025-11-15T14:00:00.000000"
}
```

## Запуск через Docker

### Сборка образа

```bash
# Из корневой директории проекта
docker build -f deploy/Dockerfile.backend -t nko-backend .
```

### Запуск контейнера

```bash
docker run -p 8000:8000 nko-backend
```

## Структура проекта

```
backend/
├── main.py              # Главный файл приложения FastAPI
├── requirements.txt     # Зависимости Python
├── .env.example        # Пример переменных окружения
└── README_FASTAPI.md   # Эта документация
```

## Технологии

- **FastAPI** - современный веб-фреймворк для создания API
- **Uvicorn** - ASGI сервер для запуска приложения
- **Pydantic** - валидация данных и настройки

## Разработка

### Автоматическая документация

FastAPI автоматически генерирует интерактивную документацию:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Горячая перезагрузка

При запуске с флагом `--reload` сервер автоматически перезагружается при изменении кода.

## Следующие шаги

1. Добавить подключение к базе данных PostgreSQL
2. Реализовать эндпоинты для НКО, новостей и событий
3. Добавить аутентификацию JWT
4. Настроить CORS для фронтенда
5. Добавить валидацию данных
6. Написать тесты

## Полезные команды

```bash
# Установка зависимостей
pip install -r requirements.txt

# Запуск с автоперезагрузкой
uvicorn main:app --reload

# Запуск на другом порту
uvicorn main:app --port 8080

# Запуск с логированием
uvicorn main:app --log-level debug