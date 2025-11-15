from typing import Any, Dict, List, Optional

from fastapi import Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from models import (
    NKOInDB,
    CityInDB,
    NKOCategoryInDB,
    NKOCategoriesLinkInDB,
)


class NKOFilterRequest(BaseModel):
    """Модель запроса для фильтрации НКО"""

    jwt_token: str  # Пока просто строка
    city: Optional[str] = None
    favorite: Optional[bool] = None
    category: Optional[List[str]] = None
    regex: Optional[str] = None


class NKOResponse(BaseModel):
    """Модель ответа с данными НКО"""

    id: int
    name: str
    description: Optional[str]
    logo: Optional[str]
    address: str
    city: Optional[str]
    latitude: float
    longitude: float
    meta: Optional[Dict[str, Any]]
    created_at: Optional[str]
    categories: List[str]


async def fetch_nko(filters: NKOFilterRequest, db: AsyncSession) -> List[NKOResponse]:
    """
    Получение списка НКО с фильтрацией

    Args:
        filters: Параметры фильтрации
        db: Сессия базы данных

    Returns:
        Список НКО с их категориями
    """
    
    try:
        # Базовый запрос с JOIN к городам
        query = (
            select(NKOInDB, CityInDB.name.label("city_name"))
            .join(CityInDB, NKOInDB.city_id == CityInDB.id)
        )
        
        # Фильтр по городу (поиск по имени города)
        if filters.city:
            query = query.where(CityInDB.name.ilike(f"%{filters.city}%"))
        
        # Фильтр по категориям
        if filters.category and len(filters.category) > 0:
            # Подзапрос для фильтрации по категориям
            subquery = (
                select(NKOCategoriesLinkInDB.nko_id)
                .join(NKOCategoryInDB, NKOCategoriesLinkInDB.category_id == NKOCategoryInDB.id)
                .where(NKOCategoryInDB.name.in_(filters.category))
            )
            query = query.where(NKOInDB.id.in_(subquery))
        
        # Фильтр по regex (поиск в имени и описании)
        if filters.regex:
            query = query.where(
                or_(
                    NKOInDB.name.op("~*")(filters.regex),
                    NKOInDB.description.op("~*")(filters.regex)
                )
            )
        
        # TODO: Фильтр по избранным (требует таблицы favorites и user_id из JWT)
        # if filters.favorite and filters.jwt_token:
        #     user_id = decode_jwt(filters.jwt_token)
        #     query = query.where(exists(select(1).where(
        #         and_(Favorites.nko_id == NKOInDB.id, Favorites.user_id == user_id)
        #     )))
        
        # Сортировка по дате создания
        query = query.order_by(NKOInDB.created_at.desc())
        
        # Выполнение запроса
        result = await db.execute(query)
        rows = result.all()
        
        # Получение категорий для каждого НКО
        nko_list = []
        for nko, city_name in rows:
            # Запрос категорий для текущего НКО
            categories_query = (
                select(NKOCategoryInDB.name)
                .join(NKOCategoriesLinkInDB, NKOCategoryInDB.id == NKOCategoriesLinkInDB.category_id)
                .where(NKOCategoriesLinkInDB.nko_id == nko.id)
            )
            categories_result = await db.execute(categories_query)
            categories = [cat[0] for cat in categories_result.all()]
            
            # Извлечение координат из POINT
            # coords в PostgreSQL POINT хранится как строка "(x,y)"
            coords_str = str(nko.coords) if nko.coords else "(0,0)"
            coords_str = coords_str.strip("()")
            latitude, longitude = map(float, coords_str.split(","))
            
            nko_data = NKOResponse(
                id=nko.id,
                name=nko.name,
                description=nko.description,
                logo=nko.logo,
                address=nko.address,
                city=city_name,
                latitude=latitude,
                longitude=longitude,
                meta=nko.meta if nko.meta else None,
                created_at=nko.created_at.isoformat() if nko.created_at else None,
                categories=categories,
            )
            nko_list.append(nko_data)
        
        return nko_list
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
