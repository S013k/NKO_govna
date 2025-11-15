CREATE TABLE IF NOT EXISTS events (
    id BIGSERIAL PRIMARY KEY,
    nko_id BIGINT NOT NULL REFERENCES nko(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    address TEXT, -- адрес
    coords POINT, -- координаты (x=lon, y=lat)
    starts_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);