CREATE TABLE IF NOT EXISTS events_categories (
    id SMALLSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS events_categories_link (
    events_id BIGINT NOT NULL,
    category_id SMALLINT NOT NULL,
    PRIMARY KEY (events_id, category_id),
    FOREIGN KEY (events_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES events_categories(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS events (
    id BIGSERIAL PRIMARY KEY,
    nko_id BIGINT NOT NULL REFERENCES nko(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT, -- адрес
    picture TEXT,
    coords POINT, -- координаты (x=lon, y=lat)
    starts_at TIMESTAMPTZ,
    finish_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);
