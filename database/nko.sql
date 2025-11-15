CREATE TABLE IF NOT EXISTS nko (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    url TEXT,
    logo TEXT,
    address TEXT, -- адрес
    coords POINT, -- координаты (x=lon, y=lat)
    created_at TIMESTAMPTZ DEFAULT now()
);