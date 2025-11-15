import os
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

Base = declarative_base()

# Глобальные переменные для движка и фабрики сессий
engine = None
async_session_maker = None


async def init_db():
    """Инициализация подключения к базе данных"""
    global engine, async_session_maker

    database_url = os.getenv(
        "DATABASE_URL", "postgresql+asyncpg://user:password@localhost:5432/nko_db"
    )

    engine = create_async_engine(database_url, echo=False, pool_size=5, max_overflow=10)

    async_session_maker = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )


async def close_db():
    """Закрытие подключения к базе данных"""
    global engine
    if engine:
        await engine.dispose()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency для получения сессии базы данных

    Использование:
        async def my_endpoint(db: AsyncSession = Depends(get_db)):
            result = await db.execute(select(...))
    """
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()
