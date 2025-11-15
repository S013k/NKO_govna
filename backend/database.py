import os
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session

Base = declarative_base()

# Глобальные переменные для движка и фабрики сессий
engine = None
SessionLocal = None


def init_db():
    """Инициализация подключения к базе данных"""
    global engine, SessionLocal

    database_url = os.getenv(
        "DATABASE_URL", "postgresql://user:password@localhost:5432/nko_db"
    )

    engine = create_engine(
        database_url, 
        echo=False, 
        pool_size=5, 
        max_overflow=10,
        pool_pre_ping=True
    )

    SessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine
    )


def close_db():
    """Закрытие подключения к базе данных"""
    global engine
    if engine:
        engine.dispose()


def get_db() -> Generator[Session, None, None]:
    """
    Dependency для получения сессии базы данных
    
    Использование:
        def my_endpoint(db: Session = Depends(get_db)):
            result = db.query(Model).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
