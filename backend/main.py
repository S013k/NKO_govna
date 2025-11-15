from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
<<<<<<< HEAD
from .config import settings
from .s3 import router as s3_router
from . import auth
=======
from contextlib import asynccontextmanager
from typing import List

from db import init_db, close_db
from nko import fetch_nko, NKOFilterRequest, NKOResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Управление жизненным циклом приложения"""
    # Startup
    await init_db()
    yield
    # Shutdown
    await close_db()


from config import settings
from s3 import router as s3_router

>>>>>>> 127080d (add get nko)
app = FastAPI(
    title="НКО Добрые дела Росатома API",
    description="Backend API для портала Добрые дела Росатома",
    version="1.0.0",
    lifespan=lifespan
)

# CORS настройки
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,  # Используем настройки из config
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем S3 роутеры
app.include_router(s3_router, prefix="/s3", tags=["S3 Storage"])
app.include_router(auth.router)

class PingResponse(BaseModel):
    status: str
    message: str
    timestamp: str


@app.get("/")
async def root():
    """Корневой эндпоинт"""
    return {
        "message": "НКО Добрые дела Росатома API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/ping", response_model=PingResponse)
async def ping():
    """Проверка работоспособности API"""
    return PingResponse(
        status="ok",
        message="pong",
        timestamp=datetime.utcnow().isoformat()
    )


@app.get("/health")
async def health_check():
    """Health check эндпоинт для мониторинга"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.post("/api/nko", response_model=List[NKOResponse])
async def get_nko(filters: NKOFilterRequest):
    """
    Получение списка НКО с фильтрацией
    
    Args:
        filters: Параметры фильтрации (jwt_token, city, favorite, category, regex)
        
    Returns:
        Список НКО с их категориями
    """
    return await fetch_nko(filters)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)