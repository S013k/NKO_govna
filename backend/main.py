from datetime import datetime
from typing import List

from fastapi import Depends, FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
<<<<<<< HEAD
<<<<<<< HEAD
from datetime import datetime
<<<<<<< HEAD
from .config import settings
from .s3 import router as s3_router
from . import auth
=======
from contextlib import asynccontextmanager
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession

from db import init_db, close_db, get_db
from nko import fetch_nko, NKOFilterRequest, NKOResponse
=======
from sqlalchemy.ext.asyncio import AsyncSession
=======
from sqlalchemy.orm import Session
>>>>>>> 779ff8c (move auth ручки to main)

from auth import (
    User, UserCreate, Token, oauth2_scheme,
    register_user, login_for_access_token,
    get_current_user, read_users_me
)
from config import settings
from database import close_db, get_db, init_db
from nko import NKOFilterRequest, NKOResponse, fetch_nko
from s3 import router as s3_router
>>>>>>> ba6c48a (black+isort)


def lifespan_startup():
    """Инициализация при запуске приложения"""
    init_db()


def lifespan_shutdown():
    """Очистка при остановке приложения"""
    close_db()


<<<<<<< HEAD
from config import settings
from s3 import router as s3_router

>>>>>>> 127080d (add get nko)
=======
>>>>>>> ba6c48a (black+isort)
app = FastAPI(
    title="НКО Добрые дела Росатома API",
    description="Backend API для портала Добрые дела Росатома",
    version="1.0.0",
)

# События жизненного цикла
@app.on_event("startup")
def startup_event():
    lifespan_startup()

@app.on_event("shutdown")
def shutdown_event():
    lifespan_shutdown()

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
        "docs": "/docs",
    }


@app.get("/ping", response_model=PingResponse)
async def ping():
    """Проверка работоспособности API"""
    return PingResponse(
        status="ok", message="pong", timestamp=datetime.utcnow().isoformat()
    )


@app.get("/health")
async def health_check():
    """Health check эндпоинт для мониторинга"""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


@app.post("/nko", response_model=List[NKOResponse])
def get_nko(filters: NKOFilterRequest, db: Session = Depends(get_db)):
    """
    Получение списка НКО с фильтрацией

    Args:
        filters: Параметры фильтрации (jwt_token, city, favorite, category, regex)
        db: Сессия базы данных

    Returns:
        Список НКО с их категориями
    """
    return fetch_nko(filters, db)


# Auth endpoints
@app.post("/auth/register", response_model=User, tags=["Authentication"])
def register(user: UserCreate, db: Session = Depends(get_db)):
    """Регистрация нового пользователя"""
    return register_user(user, db)


@app.post("/auth/login", response_model=Token, tags=["Authentication"])
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Вход пользователя и получение токена"""
    return login_for_access_token(form_data, db)


@app.get("/users/me/", response_model=User, tags=["Users"])
def get_me(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Получение информации о текущем пользователе"""
    current_user = get_current_user(token, db)
    return read_users_me(current_user)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
