CREATE TABLE IF NOT EXISTS nko_categories (
    id SMALLSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nko_categories_link (
    nko_id BIGINT NOT NULL,
    category_id SMALLINT NOT NULL,
    PRIMARY KEY (nko_id, category_id),
    FOREIGN KEY (nko_id) REFERENCES nko(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES nko_categories(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS nko (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    url TEXT, -- сайт нко
    logo TEXT,
    address TEXT NOT NULL, -- адрес
    coords POINT NOT NULL, -- координаты (x=lon, y=lat)
    created_at TIMESTAMPTZ DEFAULT now()
);
