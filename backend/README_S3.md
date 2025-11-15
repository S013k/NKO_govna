# S3/MinIO модуль для FastAPI

## Обзор

S3 модуль предоставляет FastAPI обёртку над MinIO для работы с файловым хранилищем. Модуль поддерживает 6 преднастроенных бакетов:

- `userpic` - аватары пользователей
- `docs` - документы
- `videos` - видеофайлы
- `nko-logo` - логотипы НКО
- `event-pics` - изображения мероприятий
- `news-pics` - изображения новостей

## 🚀 Быстрый старт с Docker

### 1. Запуск всех сервисов

```bash
cd deploy
docker-compose up --build -d
```

Это запустит:
- PostgreSQL + pgAdmin
- MinIO S3 хранилище (порт 9990)
- FastAPI бэкенд
- Next.js фронтенд
- Nginx прокси

### 2. Проверка работоспособности

```bash
# Проверка API
curl http://localhost/api/ping

# Проверка S3 здоровья
curl http://localhost/api/s3/health

# Просмотр документации API
open http://localhost/api/docs
```

## 📁 Доступные бакеты

При запуске автоматически создаются следующие бакеты:

| Бакет | Назначение | Пример URL |
|-------|------------|------------|
| `userpic` | Аватары пользователей | `/api/s3/userpic/avatar.jpg` |
| `docs` | Документы PDF, DOCX | `/api/s3/docs/document.pdf` |
| `videos` | Видеофайлы MP4, AVI | `/api/s3/videos/presentation.mp4` |
| `nko-logo` | Логотипы НКО | `/api/s3/nko-logo/logo.png` |
| `event-pics` | Фото мероприятий | `/api/s3/event-pics/event1.jpg` |
| `news-pics` | Изображения новостей | `/api/s3/news-pics/news1.jpg` |

## 🔧 API Эндпоинты

### Загрузка файла

```http
POST /api/s3/upload/{bucket}
Content-Type: multipart/form-data
```

**Параметры:**
- `bucket` - имя бакета из списка выше
- `file` - файл для загрузки

**Пример запроса:**
```bash
curl -X POST "http://localhost/api/s3/upload/nko-logo" \
  -F "file=@logo.png"
```

**Ответ:**
```json
{
  "url": "http://localhost:8000/s3/nko-logo/logo.png",
  "bucket": "nko-logo",
  "filename": "logo.png",
  "size": 24997,
  "content_type": "image/png"
}
```

### Получение файла

```http
GET /api/s3/{bucket}/{filename}
```

**Пример:**
```bash
curl "http://localhost/api/s3/nko-logo/logo.png"
```

### Удаление файла

```http
DELETE /api/s3/{bucket}/{filename}
```

**Пример:**
```bash
curl -X DELETE "http://localhost/api/s3/nko-logo/logo.png"
```

**Ответ:**
```json
{
  "message": "File deleted successfully",
  "filename": "logo.png"
}
```

### Список файлов в бакете

```http
GET /api/s3/{bucket}/
```

**Пример:**
```bash
curl "http://localhost/api/s3/nko-logo/"
```

**Ответ:**
```json
[
  {
    "filename": "logo.png",
    "size": 24997,
    "content_type": "image/png",
    "last_modified": "2025-11-15T16:30:19Z"
  }
]
```

### Список доступных бакетов

```http
GET /api/s3/buckets
```

**Ответ:**
```json
{
  "buckets": [
    {
      "name": "userpic",
      "description": "Userpic"
    },
    {
      "name": "docs", 
      "description": "Docs"
    },
    {
      "name": "videos",
      "description": "Videos"
    },
    {
      "name": "nko-logo",
      "description": "NKO Logo"
    },
    {
      "name": "event-pics",
      "description": "Event Pictures"
    },
    {
      "name": "news-pics",
      "description": "News Pictures"
    }
  ]
}
```

### Проверка здоровья S3 сервиса

```http
GET /api/s3/health
```

**Ответ:**
```json
{
  "status": "healthy",
  "minio": "connected",
  "buckets_created": 6
}
```

## 💻 Использование на фронтенде

### React/Next.js компоненты

Проект включает готовые компоненты для работы с S3:

```jsx
// Универсальный компонент для изображений
import { S3Image } from '@/components/S3Image';

<S3Image 
  src="/api/s3/nko-logo/logo.png"
  alt="Логотип НКО"
  width={60}
  height={60}
  fallback="/images/placeholder.png"
/>

// Специализированный компонент для логотипов Росатома
import { RosatomLogo } from '@/components/RosatomLogo';

<RosatomLogo 
  type="horizontalColor"
  width={200}
  height={60}
/>

// Компонент для логотипов НКО
import { NKOLogo } from '@/components/NKOLogo';

<NKOLogo 
  logoId="1"
  width={60}
  height={60}
  fallback="/images/placeholder.png"
/>
```

### JavaScript функции

```javascript
// Загрузка файла
const uploadFile = async (bucket, file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`/api/s3/upload/${bucket}`, {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  return result.url; // /api/s3/nko-logo/filename.png
};

// Удаление файла
const deleteFile = async (bucket, filename) => {
  const response = await fetch(`/api/s3/${bucket}/${filename}`, {
    method: 'DELETE'
  });
  
  return await response.json();
};

// Получение списка файлов
const listFiles = async (bucket) => {
  const response = await fetch(`/api/s3/${bucket}/`);
  return await response.json();
};
```

## 🐳 Docker Конфигурация

### Структура контейнеров

```yaml
services:
  minio-cora:
    image: minio/minio
    ports:
      - "9990:9000"  # API
      - "9991:9001"  # Console
    environment:
      MINIO_ROOT_USER: ${MINIO_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_PASSWORD}
  
  cora:
    build:
      context: ..
      dockerfile: deploy/Dockerfile.backend
    environment:
      MINIO_ENDPOINT: minio-cora:9000
      MINIO_ACCESS_KEY: ${MINIO_ACCESS_KEY}
      MINIO_SECRET_KEY: ${MINIO_SECRET_KEY}
      MINIO_SECURE: ${MINIO_SECURE}
  
  nginx:
    image: nginx:latest
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf
```

### Переменные окружения

```env
# MinIO Configuration
MINIO_USER=admin
MINIO_PASSWORD=qwerty123321
MINIO_ACCESS_KEY=admin
MINIO_SECRET_KEY=qwerty123321
MINIO_SECURE=False

# Buckets
BUCKET_USERPIC=userpic
BUCKET_DOCS=docs
BUCKET_VIDEOS=videos
BUCKET_NKO_LOGO=nko-logo
BUCKET_EVENT_PICS=event-pics
BUCKET_NEWS_PICS=news-pics

# Base URL для доступа к файлам
S3_BASE_URL=http://localhost:8000/s3
```

## 📝 Логирование

Все операции логируются в файл `s3_operations.log` и в консоль:

```
2025-11-15 16:30:19,123 - s3 - INFO - [2025-11-15T16:30:19] UPLOAD - Bucket: nko-logo, File: logo.png, Details: Size: 24997, ContentType: image/png
2025-11-15 16:30:25,456 - s3 - INFO - [2025-11-15T16:30:25] DOWNLOAD - Bucket: nko-logo, File: logo.png
2025-11-15 16:30:30,789 - s3 - INFO - [2025-11-15T16:30:30] DELETE - Bucket: nko-logo, File: logo.png
```

## 🗂️ Структура проекта

```
backend/
├── main.py                 # Основной FastAPI app
├── s3.py                  # S3/MinIO модуль
├── config.py              # Конфигурация приложения
├── requirements.txt       # Зависимости
├── .env.example          # Пример конфигурации
├── s3_operations.log     # Лог операций (создаётся автоматически)
└── README_S3.md          # Этот файл

deploy/
├── docker-compose.yaml   # Docker конфигурация
├── Dockerfile.backend    # Dockerfile для бэкенда
├── Dockerfile.frontend   # Dockerfile для фронтенда
└── nginx/
    └── nginx.conf        # Nginx конфигурация

scripts/
├── upload_logos.sh       # Скрипт загрузки логотипов
└── README.md            # Документация скриптов

frontend/src/components/
├── S3Image.tsx          # Универсальный компонент изображений
├── RosatomLogo.tsx      # Логотипы Росатома
└── NKOLogo.tsx          # Логотипы НКО
```

## 🔒 Безопасность

- Валидация имён бакетов через белый список
- Проверка существования файлов перед удалением
- Обработка ошибок S3 с детальными сообщениями
- CORS настройки для фронтенда
- Ограничение типов файлов для разных бакетов

## ⚠️ Обработка ошибок

Модуль обрабатывает следующие типы ошибок:

- `400 Bad Request` - неверное имя бакета или отсутствует файл
- `404 Not Found` - файл не найден
- `413 Payload Too Large` - файл слишком большой
- `500 Internal Server Error` - ошибки S3 или внутренние ошибки

**Пример ответа с ошибкой:**
```json
{
  "detail": "Bucket 'invalid-bucket' is not allowed. Allowed buckets: userpic, docs, videos, nko-logo, event-pics, news-pics"
}
```

## 📋 Минимальные требования

- Python 3.11+
- Docker & Docker Compose
- MinIO сервер (включен в Docker Compose)
- FastAPI 0.104.1+
- Next.js 14+ (для фронтенда)

## 🔗 Полезные ссылки

- **Приложение:** http://localhost
- **API документация:** http://localhost/api/docs
- **MinIO Console:** http://localhost:9991 (admin/qwerty123321)
- **Пример логотипа:** http://localhost/api/s3/nko-logo/LOGO_ROSATOM_rus_HOR_COLOR_PNG.png

## 🛠️ Скрипты

Дополнительные скрипты для управления файлами находятся в папке [`scripts/`](../scripts/):

- `upload_logos.sh` - загрузка логотипов Росатома в S3
- `README.md` - документация скриптов

## 📞 Поддержка

При возникновении проблем:

1. Проверьте статус контейнеров: `docker-compose ps`
2. Посмотрите логи: `docker-compose logs cora`
3. Проверьте доступность MinIO: http://localhost:9991
4. Изучите логи операций: `tail -f backend/s3_operations.log`