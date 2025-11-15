# Компоненты фронтенда

## RosatomLogo

Компонент для отображения логотипа Росатома из S3 хранилища.

### Использование

```tsx
import { RosatomLogo } from '@/components/RosatomLogo'

// Базовое использование
<RosatomLogo />

// С указанием типа логотипа
<RosatomLogo type="verticalColor" />

// С кастомными размерами
<RosatomLogo
  type="horizontalWhite"
  width={150}
  height={50}
  className="custom-class"
/>

// Для главного логотипа с приоритетной загрузкой
<RosatomLogo
  type="horizontalColor"
  priority
/>
```

### Типы логотипов

- `horizontalColor` - Горизонтальный логотип в цвете (по умолчанию)
- `horizontalWhite` - Горизонтальный белый логотип
- `verticalColor` - Вертикальный логотип в цвете
- `verticalWhite` - Вертикальный белый логотип

## NKOLogo

Компонент для отображения логотипа НКО из S3 хранилища.

### Использование

```tsx
import { NKOLogo } from '@/components/NKOLogo'

// Базовое использование
<NKOLogo logoId="1" />

// С кастомными размерами
<NKOLogo
  logoId="2"
  width={80}
  height={80}
  className="custom-class"
  alt="Логотип организации"
/>

// С запасным вариантом
<NKOLogo
  logoId="3"
  fallback="/images/default-logo.png"
/>
```

### Утилиты для работы с логотипами

Файл: `@/lib/logos.ts`

```tsx
import {
  getRosatomLogoUrl,
  getRosatomLogoConfig,
  getAllRosatomLogos,
  getNKOLogoUrl,
  getNKOLogoUrlWithFallback,
  getAllNKOLogos,
  DEFAULT_LOGO,
  WHITE_LOGO
} from '@/lib/logos'

// Логотипы Росатома
const rosatomUrl = getRosatomLogoUrl('horizontalColor')
const rosatomConfig = getRosatomLogoConfig('verticalWhite')
const allRosatomLogos = getAllRosatomLogos()

// Логотипы НКО
const nkoUrl = getNKOLogoUrl('1')
const nkoUrlWithFallback = getNKOLogoUrlWithFallback('2', '/fallback.png')
const allNKOLogos = getAllNKOLogos()

// Использовать константы
const defaultLogo = DEFAULT_LOGO
const whiteLogo = WHITE_LOGO
```

## S3 Интеграция

### Проксирование в Nginx

Nginx уже настроен для проксирования S3 запросов:

```nginx
location /s3/ {
    proxy_pass http://cora:8000/s3/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### Доступные бакеты

- `nko-logo` - Логотипы Росатома и НКО
- `userpic` - Аватары пользователей
- `docs` - Документы
- `videos` - Видео
- `event_pics` - Изображения мероприятий
- `news_pics` - Изображения новостей

### URL формат

```
/api/s3/{bucket_name}/{object_name}
```

Примеры:
```
/api/s3/nko-logo/LOGO_ROSATOM_rus_HOR_COLOR_PNG.png
/api/s3/nko-logo/nko-logo-1.png
/api/s3/userpic/avatar_123.jpg
/api/s3/news_pics/news_image_456.png
```

## Загрузка логотипов

Для загрузки логотипов в S3 используйте скрипт:

```bash
./scripts/upload_logos.sh
```

Скрипт автоматически:
- Найдет логотипы в директориях проекта
- Проверит наличие в S3
- Загрузит только отсутствующие файлы
- Создаст бакет при необходимости