CREATE TABLE IF NOT EXISTS events_categories (
    id SMALLSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(100) NOT NULL UNIQUE
);

CREATE TYPE events_states AS ENUM ('draft', 'approved', 'rejected', 'review');

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
    created_by BIGINT NOT NULL,
    approved_by BIGINT,
    state events_states NOT NULL,
    meta TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
    FOREIGN KEY (approved_by) REFERENCES users(id)
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS events_categories_link (
    events_id BIGINT NOT NULL,
    category_id SMALLINT NOT NULL,
    PRIMARY KEY (events_id, category_id),
    FOREIGN KEY (events_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES events_categories(id) ON DELETE RESTRICT
);
