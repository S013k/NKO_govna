from typing import Any, Dict, List, Optional

from fastapi import Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import and_, func, or_
from sqlalchemy.orm import Session

from database import get_db
from models import (
    EventInDB,
    NKOInDB,
    EventsCategoryInDB,
    EventsCategoriesLinkInDB,
)


class EventFilterRequest(BaseModel):
    """Модель запроса для фильтрации событий"""

    jwt_token: Optional[str] = None  # Опциональный токен, обязателен только для favorite
    nko_id: Optional[List[int]] = None  # Фильтр по НКО (можно несколько)
    favorite: Optional[bool] = None  # Фильтр по избранным
    category: Optional[List[str]] = None
    regex: Optional[str] = None
    time_from: Optional[str] = None  # Фильтр по времени начала (ISO format)
    time_to: Optional[str] = None  # Фильтр по времени окончания (ISO format)


class EventCreateRequest(BaseModel):
    """Модель запроса для создания события"""

    nko_id: int
    name: str
    description: Optional[str] = None
    address: Optional[str] = None
    picture: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    starts_at: Optional[str] = None
    finish_at: Optional[str] = None
    created_by: int
    state: str
    meta: Optional[str] = None
    categories: List[str]  # Список названий категорий


class EventResponse(BaseModel):
    """Модель ответа с данными события"""

    id: int
    nko_id: int
    nko_name: Optional[str]
    name: str
    description: Optional[str]
    address: Optional[str]
    picture: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    starts_at: Optional[str]
    finish_at: Optional[str]
    created_by: int
    approved_by: Optional[int]
    state: str
    meta: Optional[str]
    created_at: Optional[str]
    categories: List[str]


def fetch_events(filters: EventFilterRequest, db: Session) -> List[EventResponse]:
    """
    Получение списка событий с фильтрацией

    Args:
        filters: Параметры фильтрации
        db: Сессия базы данных

    Returns:
        Список событий с их категориями
    """
    
    try:
        # Базовый запрос с JOIN к НКО
        query = (
            db.query(EventInDB, NKOInDB.name.label("nko_name"))
            .join(NKOInDB, EventInDB.nko_id == NKOInDB.id)
        )
        
        # Фильтр по НКО (можно несколько)
        if filters.nko_id and len(filters.nko_id) > 0:
            query = query.filter(EventInDB.nko_id.in_(filters.nko_id))
        
        # Фильтр по категориям
        if filters.category and len(filters.category) > 0:
            # Подзапрос для фильтрации по категориям
            subquery = (
                db.query(EventsCategoriesLinkInDB.events_id)
                .join(EventsCategoryInDB, EventsCategoriesLinkInDB.category_id == EventsCategoryInDB.id)
                .filter(EventsCategoryInDB.name.in_(filters.category))
            )
            query = query.filter(EventInDB.id.in_(subquery))
        
        # Фильтр по regex (поиск в имени и описании)
        if filters.regex:
            query = query.filter(
                or_(
                    EventInDB.name.op("~*")(filters.regex),
                    EventInDB.description.op("~*")(filters.regex)
                )
            )
        
        # Фильтр по временному диапазону
        if filters.time_from:
            query = query.filter(EventInDB.starts_at >= filters.time_from)
        
        if filters.time_to:
            query = query.filter(EventInDB.finish_at <= filters.time_to)
        
        # Фильтр по избранным
        if filters.favorite and filters.jwt_token:
            from models import FavoriteEventsInDB
            from auth import jwt_decode
            try:
                payload = jwt_decode(filters.jwt_token)
                user_id = payload.get("id")
                if user_id:
                    query = query.join(FavoriteEventsInDB, EventInDB.id == FavoriteEventsInDB.event_id)
                    query = query.filter(FavoriteEventsInDB.user_id == user_id)
            except Exception:
                # Если токен невалидный, просто игнорируем фильтр
                pass
        
        # Сортировка по дате создания
        query = query.order_by(EventInDB.created_at.desc())
        
        # Выполнение запроса
        rows = query.all()
        
        # Получение категорий для каждого события
        event_list = []
        for event, nko_name in rows:
            # Запрос категорий для текущего события
            categories = (
                db.query(EventsCategoryInDB.name)
                .join(EventsCategoriesLinkInDB, EventsCategoryInDB.id == EventsCategoriesLinkInDB.category_id)
                .filter(EventsCategoriesLinkInDB.events_id == event.id)
                .all()
            )
            categories = [cat[0] for cat in categories]
            
            # Извлечение координат из POINT
            if event.coords and isinstance(event.coords, (tuple, list)) and len(event.coords) == 2:
                latitude, longitude = float(event.coords[0]), float(event.coords[1])
            else:
                latitude, longitude = None, None
            
            event_data = EventResponse(
                id=event.id,
                nko_id=event.nko_id,
                nko_name=nko_name,
                name=event.name,
                description=event.description,
                address=event.address,
                picture=event.picture,
                latitude=latitude,
                longitude=longitude,
                starts_at=event.starts_at.isoformat() if event.starts_at else None,
                finish_at=event.finish_at.isoformat() if event.finish_at else None,
                created_by=event.created_by,
                approved_by=event.approved_by,
                state=event.state.value if hasattr(event.state, 'value') else str(event.state),
                meta=event.meta,
                created_at=event.created_at.isoformat() if event.created_at else None,
                categories=categories,
            )
            event_list.append(event_data)
        
        return event_list
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


def fetch_event_by_id(event_id: int, db: Session) -> EventResponse:
    """
    Получение конкретного события по ID

    Args:
        event_id: ID события
        db: Сессия базы данных

    Returns:
        Данные события с категориями

    Raises:
        HTTPException: Если событие не найдено или произошла ошибка БД
    """
    
    try:
        # Запрос события с JOIN к НКО
        result = (
            db.query(EventInDB, NKOInDB.name.label("nko_name"))
            .join(NKOInDB, EventInDB.nko_id == NKOInDB.id)
            .filter(EventInDB.id == event_id)
            .first()
        )
        
        if not result:
            raise HTTPException(status_code=404, detail=f"Событие с ID {event_id} не найдено")
        
        event, nko_name = result
        
        # Запрос категорий для события
        categories = (
            db.query(EventsCategoryInDB.name)
            .join(EventsCategoriesLinkInDB, EventsCategoryInDB.id == EventsCategoriesLinkInDB.category_id)
            .filter(EventsCategoriesLinkInDB.events_id == event.id)
            .all()
        )
        categories = [cat[0] for cat in categories]
        
        # Извлечение координат из POINT
        if event.coords and isinstance(event.coords, (tuple, list)) and len(event.coords) == 2:
            latitude, longitude = float(event.coords[0]), float(event.coords[1])
        else:
            latitude, longitude = None, None
        
        event_data = EventResponse(
            id=event.id,
            nko_id=event.nko_id,
            nko_name=nko_name,
            name=event.name,
            description=event.description,
            address=event.address,
            picture=event.picture,
            latitude=latitude,
            longitude=longitude,
            starts_at=event.starts_at.isoformat() if event.starts_at else None,
            finish_at=event.finish_at.isoformat() if event.finish_at else None,
            created_by=event.created_by,
            approved_by=event.approved_by,
            state=event.state.value if hasattr(event.state, 'value') else str(event.state),
            meta=event.meta,
            created_at=event.created_at.isoformat() if event.created_at else None,
            categories=categories,
        )
        
        return event_data
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


def create_event(event_data: EventCreateRequest, db: Session) -> EventResponse:
    """
    Создание нового события

    Args:
        event_data: Данные для создания события
        db: Сессия базы данных

    Returns:
        Созданное событие с категориями

    Raises:
        HTTPException: Если НКО не найдено, категории не найдены или произошла ошибка БД
    """
    
    try:
        # Проверяем существование НКО
        nko = db.query(NKOInDB).filter(NKOInDB.id == event_data.nko_id).first()
        if not nko:
            raise HTTPException(status_code=404, detail=f"НКО с ID {event_data.nko_id} не найдено")
        
        # Проверяем существование всех категорий
        categories = []
        for category_name in event_data.categories:
            category = db.query(EventsCategoryInDB).filter(EventsCategoryInDB.name == category_name).first()
            if not category:
                raise HTTPException(status_code=404, detail=f"Категория '{category_name}' не найдена")
            categories.append(category)
        
        # Создаем координаты если они указаны
        coords = None
        if event_data.latitude is not None and event_data.longitude is not None:
            coords = (event_data.latitude, event_data.longitude)
        
        # Создаем событие
        new_event = EventInDB(
            nko_id=event_data.nko_id,
            name=event_data.name,
            description=event_data.description,
            address=event_data.address,
            picture=event_data.picture,
            coords=coords,
            starts_at=event_data.starts_at,
            finish_at=event_data.finish_at,
            created_by=event_data.created_by,
            state=event_data.state,
            meta=event_data.meta,
        )
        
        db.add(new_event)
        db.flush()  # Получаем ID без коммита
        
        # Добавляем связи с категориями
        for category in categories:
            link = EventsCategoriesLinkInDB(
                events_id=new_event.id,
                category_id=category.id
            )
            db.add(link)
        
        db.commit()
        db.refresh(new_event)
        
        # Формируем ответ
        event_response = EventResponse(
            id=new_event.id,
            nko_id=new_event.nko_id,
            nko_name=nko.name,
            name=new_event.name,
            description=new_event.description,
            address=new_event.address,
            picture=new_event.picture,
            latitude=event_data.latitude,
            longitude=event_data.longitude,
            starts_at=new_event.starts_at.isoformat() if new_event.starts_at else None,
            finish_at=new_event.finish_at.isoformat() if new_event.finish_at else None,
            created_by=new_event.created_by,
            approved_by=new_event.approved_by,
            state=new_event.state.value if hasattr(new_event.state, 'value') else str(new_event.state),
            meta=new_event.meta,
            created_at=new_event.created_at.isoformat() if new_event.created_at else None,
            categories=event_data.categories,
        )
        
        return event_response
    
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


def delete_event(event_id: int, db: Session) -> dict:
    """
    Удаление события по ID

    Args:
        event_id: ID события для удаления
        db: Сессия базы данных

    Returns:
        Словарь с сообщением об успешном удалении

    Raises:
        HTTPException: Если событие не найдено или произошла ошибка БД
    """
    
    try:
        # Проверяем существование события
        event = db.query(EventInDB).filter(EventInDB.id == event_id).first()
        
        if not event:
            raise HTTPException(status_code=404, detail=f"Событие с ID {event_id} не найдено")
        
        # Удаляем связи с категориями
        db.query(EventsCategoriesLinkInDB).filter(EventsCategoriesLinkInDB.events_id == event_id).delete()
        
        # Удаляем само событие
        db.delete(event)
        db.commit()
        
        return {"message": f"Событие с ID {event_id} успешно удалено"}
    
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()


def add_event_to_favorites(user_id: int, event_id: int, db: Session) -> dict:
    """
    Добавление мероприятия в избранное пользователя

    Args:
        user_id: ID пользователя
        event_id: ID мероприятия
        db: Сессия базы данных

    Returns:
        Словарь с сообщением об успешном добавлении

    Raises:
        HTTPException: Если мероприятие не найдено или уже в избранном
    """
    from models import FavoriteEventsInDB
    
    try:
        # Проверяем существование мероприятия
        event = db.query(EventInDB).filter(EventInDB.id == event_id).first()
        if not event:
            raise HTTPException(status_code=404, detail=f"Мероприятие с ID {event_id} не найдено")
        
        # Проверяем, не добавлено ли уже в избранное
        existing = db.query(FavoriteEventsInDB).filter(
            FavoriteEventsInDB.user_id == user_id,
            FavoriteEventsInDB.event_id == event_id
        ).first()
        
        if existing:
            raise HTTPException(status_code=400, detail="Мероприятие уже в избранном")
        
        # Добавляем в избранное
        favorite = FavoriteEventsInDB(user_id=user_id, event_id=event_id)
        db.add(favorite)
        db.commit()
        
        return {"message": f"Мероприятие с ID {event_id} добавлено в избранное"}
    
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


def remove_event_from_favorites(user_id: int, event_id: int, db: Session) -> dict:
    """
    Удаление мероприятия из избранного пользователя

    Args:
        user_id: ID пользователя
        event_id: ID мероприятия
        db: Сессия базы данных

    Returns:
        Словарь с сообщением об успешном удалении

    Raises:
        HTTPException: Если мероприятие не найдено в избранном
    """
    from models import FavoriteEventsInDB
    
    try:
        # Проверяем существование в избранном
        favorite = db.query(FavoriteEventsInDB).filter(
            FavoriteEventsInDB.user_id == user_id,
            FavoriteEventsInDB.event_id == event_id
        ).first()
        
        if not favorite:
            raise HTTPException(status_code=404, detail="Мероприятие не найдено в избранном")
        
        # Удаляем из избранного
        db.delete(favorite)
        db.commit()
        
        return {"message": f"Мероприятие с ID {event_id} удалено из избранного"}
    
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


def get_favorite_events(user_id: int, db: Session) -> List[EventResponse]:
    """
    Получение списка избранных мероприятий пользователя

    Args:
        user_id: ID пользователя
        db: Сессия базы данных

    Returns:
        Список избранных мероприятий с их категориями
    """
    from models import FavoriteEventsInDB
    
    try:
        # Запрос избранных мероприятий с JOIN
        query = (
            db.query(EventInDB, NKOInDB.name.label("nko_name"))
            .join(NKOInDB, EventInDB.nko_id == NKOInDB.id)
            .join(FavoriteEventsInDB, EventInDB.id == FavoriteEventsInDB.event_id)
            .filter(FavoriteEventsInDB.user_id == user_id)
            .order_by(EventInDB.created_at.desc())
        )
        
        rows = query.all()
        
        # Получение категорий для каждого мероприятия
        event_list = []
        for event, nko_name in rows:
            # Запрос категорий для текущего мероприятия
            categories = (
                db.query(EventsCategoryInDB.name)
                .join(EventsCategoriesLinkInDB, EventsCategoryInDB.id == EventsCategoriesLinkInDB.category_id)
                .filter(EventsCategoriesLinkInDB.events_id == event.id)
                .all()
            )
            categories = [cat[0] for cat in categories]
            
            # Извлечение координат из POINT
            if event.coords and isinstance(event.coords, (tuple, list)) and len(event.coords) == 2:
                latitude, longitude = float(event.coords[0]), float(event.coords[1])
            else:
                latitude, longitude = None, None
            
            event_data = EventResponse(
                id=event.id,
                nko_id=event.nko_id,
                nko_name=nko_name,
                name=event.name,
                description=event.description,
                address=event.address,
                picture=event.picture,
                latitude=latitude,
                longitude=longitude,
                starts_at=event.starts_at.isoformat() if event.starts_at else None,
                finish_at=event.finish_at.isoformat() if event.finish_at else None,
                created_by=event.created_by,
                approved_by=event.approved_by,
                state=event.state.value if hasattr(event.state, 'value') else str(event.state),
                meta=event.meta,
                created_at=event.created_at.isoformat() if event.created_at else None,
                categories=categories,
            )
            event_list.append(event_data)
        
        return event_list
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")