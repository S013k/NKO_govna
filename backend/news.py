from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel
from sqlalchemy.orm import Session

from auth import get_current_user
from models import NewsInDB, CityInDB, UserInDB


class NewsFilterRequest(BaseModel):
    jwt_token: str = ""  # Может быть пустой строкой, обязателен только для favorite
    city: Optional[str] = None
    favorite: Optional[bool] = None
    regex: Optional[str] = None


class NewsCreateRequest(BaseModel):
    title: str
    description: str
    image: Optional[str] = None
    city_id: Optional[int] = None
    meta: Optional[str] = None


class NewsResponse(BaseModel):
    id: int
    title: str
    description: str
    image: Optional[str] = None
    city: Optional[str] = None
    created_by: Optional[str] = None
    approved_by: Optional[str] = None
    meta: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


def fetch_news(filters: NewsFilterRequest, db: Session) -> List[NewsResponse]:
    """
    Получение списка новостей с фильтрацией
    
    Args:
        filters: Параметры фильтрации
        db: Сессия базы данных
        
    Returns:
        Список новостей
    """
    # Базовый запрос
    query = db.query(NewsInDB)
    
    # Фильтр по городу
    if filters.city:
        city = db.query(CityInDB).filter(CityInDB.name.ilike(f"%{filters.city}%")).first()
        if city:
            query = query.filter(NewsInDB.city_id == city.id)
    
    # Фильтр по избранным
    if filters.favorite and filters.jwt_token:
        from models import FavoriteNewsInDB
        from auth import jwt_decode
        try:
            payload = jwt_decode(filters.jwt_token)
            user_id = payload.get("id")
            if user_id:
                favorite_news_ids = db.query(FavoriteNewsInDB.news_id).filter(
                    FavoriteNewsInDB.user_id == user_id
                ).all()
                favorite_news_ids = [id[0] for id in favorite_news_ids]
                if favorite_news_ids:
                    query = query.filter(NewsInDB.id.in_(favorite_news_ids))
                else:
                    # Если нет избранных, возвращаем пустой список
                    return []
        except Exception:
            # Если токен невалидный, просто игнорируем фильтр
            pass
    
    # Фильтр по регулярному выражению
    if filters.regex:
        query = query.filter(NewsInDB.title.op("~*")(filters.regex))
    
    # Выполняем запрос
    news_list = query.all()
    
    # Формируем ответ
    result = []
    for news in news_list:
        city_name = None
        if news.city_id:
            city = db.query(CityInDB).filter(CityInDB.id == news.city_id).first()
            if city:
                city_name = city.name
        
        created_by_name = None
        if news.created_by:
            creator = db.query(UserInDB).filter(UserInDB.id == news.created_by).first()
            if creator:
                created_by_name = creator.full_name
        
        approved_by_name = None
        if news.approved_by:
            approver = db.query(UserInDB).filter(UserInDB.id == news.approved_by).first()
            if approver:
                approved_by_name = approver.full_name
        
        result.append(NewsResponse(
            id=news.id,
            title=news.title,
            description=news.description,
            image=news.image,
            city=city_name,
            created_by=created_by_name,
            approved_by=approved_by_name,
            meta=news.meta,
            created_at=news.created_at
        ))
    
    return result


def fetch_news_by_id(news_id: int, db: Session) -> NewsResponse:
    """
    Получение новости по ID
    
    Args:
        news_id: ID новости
        db: Сессия базы данных
        
    Returns:
        Данные новости
    """
    news = db.query(NewsInDB).filter(NewsInDB.id == news_id).first()
    if not news:
        raise ValueError(f"Новость с ID {news_id} не найдена")
    
    city_name = None
    if news.city_id:
        city = db.query(CityInDB).filter(CityInDB.id == news.city_id).first()
        if city:
            city_name = city.name
    
    created_by_name = None
    if news.created_by:
        creator = db.query(UserInDB).filter(UserInDB.id == news.created_by).first()
        if creator:
            created_by_name = creator.full_name
    
    approved_by_name = None
    if news.approved_by:
        approver = db.query(UserInDB).filter(UserInDB.id == news.approved_by).first()
        if approver:
            approved_by_name = approver.full_name
    
    return NewsResponse(
        id=news.id,
        title=news.title,
        description=news.description,
        image=news.image,
        city=city_name,
        created_by=created_by_name,
        approved_by=approved_by_name,
        meta=news.meta,
        created_at=news.created_at
    )


def create_news(news_data: NewsCreateRequest, db: Session) -> NewsResponse:
    """
    Создание новой новости
    
    Args:
        news_data: Данные для создания новости
        db: Сессия базы данных
        
    Returns:
        Созданная новость
    """
    # Создаем новость
    new_news = NewsInDB(
        title=news_data.title,
        description=news_data.description,
        image=news_data.image,
        city_id=news_data.city_id,
        created_by=1,  # Временно используем ID=1, в реальном приложении нужно получать из токена
        meta=news_data.meta
    )
    
    db.add(new_news)
    db.commit()
    db.refresh(new_news)
    
    return fetch_news_by_id(new_news.id, db)


def delete_news(news_id: int, db: Session) -> Dict[str, str]:
    """
    Удаление новости по ID
    
    Args:
        news_id: ID новости для удаления
        db: Сессия базы данных
        
    Returns:
        Сообщение об успешном удалении
    """
    news = db.query(NewsInDB).filter(NewsInDB.id == news_id).first()
    if not news:
        raise ValueError(f"Новость с ID {news_id} не найдена")
    
    db.delete(news)
    db.commit()
    
    return {"message": f"Новость с ID {news_id} успешно удалена"}


def add_news_to_favorites(user_id: int, news_id: int, db: Session) -> Dict[str, str]:
    """
    Добавление новости в избранное
    
    Args:
        user_id: ID пользователя
        news_id: ID новости
        db: Сессия базы данных
        
    Returns:
        Сообщение об успешном добавлении
    """
    from models import FavoriteNewsInDB
    
    # Проверяем существование новости
    news = db.query(NewsInDB).filter(NewsInDB.id == news_id).first()
    if not news:
        raise ValueError(f"Новость с ID {news_id} не найдена")
    
    # Проверяем, не добавлена ли уже новость в избранное
    existing_favorite = db.query(FavoriteNewsInDB).filter(
        FavoriteNewsInDB.user_id == user_id,
        FavoriteNewsInDB.news_id == news_id
    ).first()
    
    if existing_favorite:
        raise ValueError(f"Новость с ID {news_id} уже добавлена в избранное")
    
    # Добавляем в избранное
    favorite = FavoriteNewsInDB(user_id=user_id, news_id=news_id)
    db.add(favorite)
    db.commit()
    
    return {"message": f"Новость с ID {news_id} добавлена в избранное"}


def remove_news_from_favorites(user_id: int, news_id: int, db: Session) -> Dict[str, str]:
    """
    Удаление новости из избранного
    
    Args:
        user_id: ID пользователя
        news_id: ID новости
        db: Сессия базы данных
        
    Returns:
        Сообщение об успешном удалении
    """
    from models import FavoriteNewsInDB
    
    # Ищем запись в избранном
    favorite = db.query(FavoriteNewsInDB).filter(
        FavoriteNewsInDB.user_id == user_id,
        FavoriteNewsInDB.news_id == news_id
    ).first()
    
    if not favorite:
        raise ValueError(f"Новость с ID {news_id} не найдена в избранном")
    
    # Удаляем из избранного
    db.delete(favorite)
    db.commit()
    
    return {"message": f"Новость с ID {news_id} удалена из избранного"}


def get_favorite_news(user_id: int, db: Session) -> List[NewsResponse]:
    """
    Получение избранных новостей пользователя
    
    Args:
        user_id: ID пользователя
        db: Сессия базы данных
        
    Returns:
        Список избранных новостей
    """
    from models import FavoriteNewsInDB
    
    # Получаем ID избранных новостей
    favorite_news_ids = db.query(FavoriteNewsInDB.news_id).filter(
        FavoriteNewsInDB.user_id == user_id
    ).all()
    favorite_news_ids = [id[0] for id in favorite_news_ids]
    
    if not favorite_news_ids:
        return []
    
    # Получаем новости
    news_list = db.query(NewsInDB).filter(NewsInDB.id.in_(favorite_news_ids)).all()
    
    # Формируем ответ
    result = []
    for news in news_list:
        city_name = None
        if news.city_id:
            city = db.query(CityInDB).filter(CityInDB.id == news.city_id).first()
            if city:
                city_name = city.name
        
        created_by_name = None
        if news.created_by:
            creator = db.query(UserInDB).filter(UserInDB.id == news.created_by).first()
            if creator:
                created_by_name = creator.full_name
        
        approved_by_name = None
        if news.approved_by:
            approver = db.query(UserInDB).filter(UserInDB.id == news.approved_by).first()
            if approver:
                approved_by_name = approver.full_name
        
        result.append(NewsResponse(
            id=news.id,
            title=news.title,
            description=news.description,
            image=news.image,
            city=city_name,
            created_by=created_by_name,
            approved_by=approved_by_name,
            meta=news.meta,
            created_at=news.created_at
        ))
    
    return result