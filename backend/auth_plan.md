# План реализации аутентификации на основе JWT

## 1. Обзор

Этот документ описывает шаги, необходимые для реализации системы аутентификации на основе JWT (JSON Web Token) в FastAPI-приложении.

## 2. Изменения в базе данных

- **Таблица `users`**:
- Поле `hash` заменить на `hashed_password` для ясности.
- Удалить поле `salt`, так как современные библиотеки для хеширования паролей включают соль в хеш.

```sql
-- Обновленная схема таблицы users
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    login VARCHAR(100) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    role users_roles NOT NULL
);
```

- **Перечисление `users_roles`**:
- Раскомментировать и использовать для стандартизации ролей.

```sql
CREATE TYPE users_roles AS ENUM ('nko', 'admin', 'moder', 'user');
```

## 3. Новые зависимости

- Добавить в `requirements.txt`:

```
passlib[bcrypt]
python-jose[cryptography]
```

## 4. Модели Pydantic

- Создать файл `models.py` для определения следующих моделей:
- **`UserCreate`**: для регистрации новых пользователей.
- **`User`**: для возврата данных о пользователе.
- **`Token`**: для возврата JWT-токена.
- **`TokenData`**: для данных, хранящихся в токене.

## 5. Эндпоинты API

- **`/auth/register` (POST)**: Регистрация нового пользователя.
- **`/auth/login` (POST)**: Аутентификация и выдача JWT-токена.
- **`/users/me` (GET)**: Получение данных о текущем пользователе (защищенный эндпоинт).

## 6. Логика аутентификации

- Создать файл `security.py` для реализации:
- **`create_access_token`**: функция для создания JWT-токена.
- **`verify_password`**: функция для проверки хешированного пароля.
- **`get_password_hash`**: функция для хеширования пароля.
- **`get_current_user`**: зависимость для защищенных эндпоинтов.
