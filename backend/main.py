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
from nko import (
    NKOFilterRequest, NKOCreateRequest, NKOResponse,
    fetch_nko, fetch_nko_by_id, create_nko, delete_nko,
    add_nko_to_favorites, remove_nko_from_favorites, get_favorite_nko
)
from city import CityCreateRequest, CityResponse, create_city, delete_city, fetch_cities, fetch_city_by_name
from event import (
    EventFilterRequest, EventCreateRequest, EventResponse,
    fetch_events, fetch_event_by_id, create_event, delete_event,
    add_event_to_favorites, remove_event_from_favorites, get_favorite_events
)
from news import (
    NewsFilterRequest, NewsCreateRequest, NewsResponse,
    fetch_news, fetch_news_by_id, create_news, delete_news,
    add_news_to_favorites, remove_news_from_favorites, get_favorite_news
)
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
    jwt_token: str = "",
    city: Optional[str] = None,
    favorite: Optional[bool] = None,
    category: Optional[List[str]] = Query(None),
    regex: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Получение списка НКО с фильтрацией

    Args:
        jwt_token: JWT токен пользователя (может быть пустой строкой, обязателен только для favorite)
        city: Фильтр по городу (опционально)
        favorite: Фильтр по избранным (опционально, требует jwt_token)
        category: Фильтр по категориям (опционально, можно передать несколько раз)
        regex: Регулярное выражение для поиска (опционально)
        db: Сессия базы данных

    Returns:
        Список НКО с их категориями
    
    Example:
        GET /nko?jwt_token=&category=Помощь детям&category=Образование
        GET /nko?jwt_token=TOKEN&favorite=true
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


@app.get("/city/{city_name}", response_model=CityResponse, tags=["City"])
def get_city_by_name(city_name: str, db: Session = Depends(get_db)):
    """
    Получение города по имени
    """
    return fetch_city_by_name(city_name, db)


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


@app.get("/event", response_model=List[EventResponse], tags=["Events"])
def get_events(
    jwt_token: str = "",
    nko_id: Optional[List[int]] = Query(None),
    city: Optional[str] = None,
    favorite: Optional[bool] = None,
    category: Optional[List[str]] = Query(None),
    regex: Optional[str] = None,
    time_from: Optional[str] = None,
    time_to: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Получение списка событий с фильтрацией

    Args:
        jwt_token: JWT токен пользователя (может быть пустой строкой, обязателен только для favorite)
        nko_id: Фильтр по НКО (опционально, можно передать несколько раз)
        city: Фильтр по городу (опционально)
        favorite: Фильтр по избранным (опционально, требует jwt_token)
        category: Фильтр по категориям (опционально, можно передать несколько раз)
        regex: Регулярное выражение для поиска (опционально)
        time_from: Фильтр по времени начала события (ISO format, опционально)
        time_to: Фильтр по времени окончания события (ISO format, опционально)
        db: Сессия базы данных

    Returns:
        Список событий с их категориями
    
    Example:
        GET /event?jwt_token=&nko_id=1&nko_id=2&city=Москва&category=Спорт&time_from=2024-01-01T00:00:00
        GET /event?jwt_token=TOKEN&favorite=true
    """
    filters = EventFilterRequest(
        jwt_token=jwt_token,
        nko_id=nko_id,
        city=city,
        favorite=favorite,
        category=category,
        regex=regex,
        time_from=time_from,
        time_to=time_to
    )
    return fetch_events(filters, db)


@app.get("/event/{event_id}", response_model=EventResponse, tags=["Events"])
def get_event_by_id(event_id: int, db: Session = Depends(get_db)):
    """
    Получение конкретного события по ID

    Args:
        event_id: ID события
        db: Сессия базы данных

    Returns:
        Данные события с категориями
    """
    return fetch_event_by_id(event_id, db)


@app.post("/event", response_model=EventResponse, status_code=status.HTTP_201_CREATED, tags=["Events"])
def add_event(event_data: EventCreateRequest, db: Session = Depends(get_db)):
    """
    Создание нового события

    Args:
        event_data: Данные для создания события
        db: Сессия базы данных

    Returns:
        Созданное событие с категориями
    """
    return create_event(event_data, db)


@app.delete("/event/{event_id}", status_code=status.HTTP_200_OK, tags=["Events"])
def remove_event(event_id: int, db: Session = Depends(get_db)):
    """
    Удаление события по ID

    Args:
        event_id: ID события для удаления
        db: Сессия базы данных

    Returns:
        Сообщение об успешном удалении
    """
    return delete_event(event_id, db)

# Favorites endpoints
@app.post("/nko/{nko_id}/favorite", tags=["Favorites"])
def add_nko_favorite(
    nko_id: int,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """Добавление НКО в избранное"""
    current_user = get_current_user(token, db)
    return add_nko_to_favorites(current_user.id, nko_id, db)


@app.delete("/nko/{nko_id}/favorite", tags=["Favorites"])
def remove_nko_favorite(
    nko_id: int,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """Удаление НКО из избранного"""
    current_user = get_current_user(token, db)
    return remove_nko_from_favorites(current_user.id, nko_id, db)


@app.post("/event/{event_id}/favorite", tags=["Favorites"])
def add_event_favorite(
    event_id: int,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """Добавление мероприятия в избранное"""
    current_user = get_current_user(token, db)
    return add_event_to_favorites(current_user.id, event_id, db)


@app.delete("/event/{event_id}/favorite", tags=["Favorites"])
def remove_event_favorite(
    event_id: int,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """Удаление мероприятия из избранного"""
    current_user = get_current_user(token, db)
    return remove_event_from_favorites(current_user.id, event_id, db)


# News endpoints
@app.get("/news", response_model=List[NewsResponse], tags=["News"])
def get_news_list(
    jwt_token: str = "",
    city: Optional[str] = None,
    favorite: Optional[bool] = None,
    regex: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Получение списка новостей с фильтрацией

    Args:
        jwt_token: JWT токен пользователя (может быть пустой строкой, обязателен только для favorite)
        city: Фильтр по городу (опционально)
        favorite: Фильтр по избранным (опционально, требует jwt_token)
        regex: Регулярное выражение для поиска (опционально)
        db: Сессия базы данных

    Returns:
        Список новостей
    
    Example:
        GET /news?jwt_token=&city=Москва
        GET /news?jwt_token=TOKEN&favorite=true
    """
    filters = NewsFilterRequest(
        jwt_token=jwt_token,
        city=city,
        favorite=favorite,
        regex=regex
    )
    return fetch_news(filters, db)


@app.get("/news/{news_id}", response_model=NewsResponse, tags=["News"])
def get_news_by_id(news_id: int, db: Session = Depends(get_db)):
    """
    Получение конкретной новости по ID

    Args:
        news_id: ID новости
        db: Сессия базы данных

    Returns:
        Данные новости
    """
    return fetch_news_by_id(news_id, db)


@app.post("/news", response_model=NewsResponse, status_code=status.HTTP_201_CREATED, tags=["News"])
def add_news(news_data: NewsCreateRequest, db: Session = Depends(get_db)):
    """
    Создание новой новости

    Args:
        news_data: Данные для создания новости
        db: Сессия базы данных

    Returns:
        Созданная новость
    """
    return create_news(news_data, db)


@app.delete("/news/{news_id}", status_code=status.HTTP_200_OK, tags=["News"])
def remove_news(news_id: int, db: Session = Depends(get_db)):
    """
    Удаление новости по ID

    Args:
        news_id: ID новости для удаления
        db: Сессия базы данных

    Returns:
        Сообщение об успешном удалении
    """
    return delete_news(news_id, db)


@app.post("/news/{news_id}/favorite", tags=["Favorites"])
def add_news_favorite(
    news_id: int,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """Добавление новости в избранное"""
    current_user = get_current_user(token, db)
    return add_news_to_favorites(current_user.id, news_id, db)


@app.delete("/news/{news_id}/favorite", tags=["Favorites"])
def remove_news_favorite(
    news_id: int,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """Удаление новости из избранного"""
    current_user = get_current_user(token, db)
    return remove_news_from_favorites(current_user.id, news_id, db)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
