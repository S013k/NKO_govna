from datetime import datetime
from typing import Dict, List, Optional

from fastapi import Depends, FastAPI, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy.orm import Session

from auth import (
    User, UserCreate, Token, oauth2_scheme,
    register_user, login_for_access_token,
    get_current_user, read_users_me
)
from config import settings
from database import close_db, get_db, init_db
from nko import NKOFilterRequest, NKOCreateRequest, NKOResponse, fetch_nko, fetch_nko_by_id, create_nko, delete_nko
from city import CityCreateRequest, CityResponse, create_city, delete_city, fetch_cities, fetch_city_by_id
from s3 import router as s3_router


def lifespan_startup():
    """Инициализация при запуске приложения"""
    init_db()


def lifespan_shutdown():
    """Очистка при остановке приложения"""
    close_db()


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


@app.get("/nko", response_model=List[NKOResponse])
def get_nko(
    jwt_token: str,
    city: Optional[str] = None,
    favorite: Optional[bool] = None,
    category: Optional[List[str]] = Query(None),
    regex: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Получение списка НКО с фильтрацией

    Args:
        jwt_token: JWT токен пользователя
        city: Фильтр по городу (опционально)
        favorite: Фильтр по избранным (опционально)
        category: Фильтр по категориям (опционально, можно передать несколько раз)
        regex: Регулярное выражение для поиска (опционально)
        db: Сессия базы данных

    Returns:
        Список НКО с их категориями
    
    Example:
        GET /nko?jwt_token=test&category=Помощь детям&category=Образование
    """
    filters = NKOFilterRequest(
        jwt_token=jwt_token,
        city=city,
        favorite=favorite,
        category=category,
        regex=regex
    )
    return fetch_nko(filters, db)


@app.get("/city", response_model=List[CityResponse], tags=["City"])
def get_cities(regex: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Получение списка городов с фильтрацией по regex
    """
    return fetch_cities(regex, db)


@app.post("/city", response_model=CityResponse, tags=["City"])
def add_city(city_data: CityCreateRequest, db: Session = Depends(get_db)):
    """
    Добавление нового города
    """
    return create_city(city_data, db)


@app.get("/city/{city_id}", response_model=CityResponse, tags=["City"])
def get_city_by_id(city_id: int, db: Session = Depends(get_db)):
    """
    Получение города по ID
    """
    return fetch_city_by_id(city_id, db)


@app.delete("/city/{city_id}", response_model=Dict[str, str], tags=["City"])
def remove_city(city_id: int, db: Session = Depends(get_db)):
    """
    Удаление города по ID
    """
    return delete_city(city_id, db)

@app.get("/nko/{nko_id}", response_model=NKOResponse)
def get_nko_by_id(nko_id: int, db: Session = Depends(get_db)):
    """
    Получение конкретного НКО по ID

    Args:
        nko_id: ID НКО
        db: Сессия базы данных

    Returns:
        Данные НКО с категориями
    """
    return fetch_nko_by_id(nko_id, db)


# Auth endpoints
@app.post("/auth/register", response_model=User, tags=["Authentication"])
def register(user: UserCreate, db: Session = Depends(get_db)):
    """Регистрация нового пользователя"""
    return register_user(user, db)


@app.post("/auth/login", response_model=Token, tags=["Authentication"])
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Вход пользователя и получение токена"""
    return login_for_access_token(form_data, db)


@app.post("/nko", response_model=NKOResponse, status_code=status.HTTP_201_CREATED)
def add_nko(nko_data: NKOCreateRequest, db: Session = Depends(get_db)):
    """
    Создание нового НКО

    Args:
        nko_data: Данные для создания НКО (name, description, logo, address, city, coordinates, meta, categories)
        db: Сессия базы данных

    Returns:
        Созданное НКО с категориями
    """
    return create_nko(nko_data, db)


@app.delete("/nko/{nko_id}", status_code=status.HTTP_200_OK)
def remove_nko(nko_id: int, db: Session = Depends(get_db)):
    """
    Удаление НКО по ID

    Args:
        nko_id: ID НКО для удаления
        db: Сессия базы данных

    Returns:
        Сообщение об успешном удалении
    """
    return delete_nko(nko_id, db)


@app.get("/users/me/", response_model=User, tags=["Users"])
def get_me(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Получение информации о текущем пользователе"""
    current_user = get_current_user(token, db)
    return read_users_me(current_user)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
