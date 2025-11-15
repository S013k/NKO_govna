DO
$$
DECLARE
    r RECORD;
BEGIN
    -- Перебираем все таблицы в схеме public
    FOR r IN
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END
$$;

-- Категории НКО
CREATE TABLE IF NOT EXISTS nko_categories (
    id SMALLSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 
CREATE TABLE IF NOT EXISTS cities (
    id SMALLSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- Организации (НКО)
CREATE TABLE IF NOT EXISTS nko (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    logo TEXT,
    address TEXT NOT NULL,
    city_id SMALLINT NOT NULL,
    coords POINT NOT NULL,
    meta JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    FOREIGN KEY (city_id) REFERENCES cities(id)
);

-- Связующая таблица для НКО и их категорий
CREATE TABLE IF NOT EXISTS nko_categories_link (
    nko_id BIGINT NOT NULL,
    category_id SMALLINT NOT NULL,
    PRIMARY KEY (nko_id, category_id),
    FOREIGN KEY (nko_id) REFERENCES nko(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES nko_categories(id) ON DELETE RESTRICT
);

-- Перечисление для ролей пользователей
-- CREATE TYPE users_roles AS ENUM ('nko', 'admin', 'moder', 'user');

-- Пользователи
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    hash VARCHAR(100) NOT NULL,
    salt VARCHAR(10) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    login VARCHAR(100) NOT NULL,
    role users_roles NOT NULL
);

-- Связующая таблица для НКО и их пользователей (представителей)
CREATE TABLE IF NOT EXISTS nko_users_link (
    nko_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    PRIMARY KEY (nko_id, user_id),
    FOREIGN KEY (nko_id) REFERENCES nko(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Категории мероприятий
CREATE TABLE IF NOT EXISTS events_categories (
    id SMALLSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255) NOT NULL UNIQUE -- Увеличена длина для соответствия данным
);

-- Перечисление для состояний мероприятий
-- CREATE TYPE events_states AS ENUM ('draft', 'approved', 'rejected', 'review');

-- Мероприятия
CREATE TABLE IF NOT EXISTS events (
    id BIGSERIAL PRIMARY KEY,
    nko_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT,
    picture TEXT,
    coords POINT,
    starts_at TIMESTAMPTZ,
    finish_at TIMESTAMPTZ,
    created_by BIGINT NOT NULL,
    approved_by BIGINT,
    state events_states NOT NULL,
    meta TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    FOREIGN KEY (nko_id) REFERENCES nko(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Связующая таблица для мероприятий и их категорий
CREATE TABLE IF NOT EXISTS events_categories_link (
    events_id BIGINT NOT NULL,
    category_id SMALLINT NOT NULL,
    PRIMARY KEY (events_id, category_id),
    FOREIGN KEY (events_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES events_categories(id) ON DELETE RESTRICT
);
