CREATE TYPE users_roles AS ENUM ('nko', 'admin', 'moder', 'user');

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    hash TEXT(100) NOT NULL,
    salt TEXT(10) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    login TEXT(100) NOT NULL,
    role users_roles NOT NULL,
);

CREATE TABLE IF NOT EXISTS nko_users_link (
    nko_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    PRIMARY KEY (nko_id, user_id),
    FOREIGN KEY (nko_id) REFERENCES nko(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
