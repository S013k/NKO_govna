from typing import Any, Dict, List, Optional

from fastapi import Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import and_, func, or_
from sqlalchemy.orm import Session

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


def fetch_nko(filters: NKOFilterRequest, db: Session) -> List[NKOResponse]:
    """
    Получение списка НКО с фильтрацией

    Args:
        filters: Параметры фильтрации
        db: Сессия базы данных

    Returns:
        Список НКО с их категориями
    """
<<<<<<< HEAD

    # Базовый SQL запрос с агрегацией категорий
=======
    
<<<<<<< HEAD
    # Базовый SQL запрос с агрегацией категорий и JOIN с таблицей cities
>>>>>>> 475e2bf (fix get nko)
    query_parts = [
        """
        SELECT DISTINCT
            n.id,
            n.name,
            n.description,
            n.logo,
            n.address,
            c.name as city,
            n.coords[0] as latitude,
            n.coords[1] as longitude,
            n.meta,
            n.created_at,
            COALESCE(
                ARRAY_AGG(DISTINCT nc.name) FILTER (WHERE nc.name IS NOT NULL),
                ARRAY[]::VARCHAR[]
            ) as categories
        FROM nko n
        LEFT JOIN cities c ON n.city_id = c.id
        LEFT JOIN nko_categories_link ncl ON n.id = ncl.nko_id
        LEFT JOIN nko_categories nc ON ncl.category_id = nc.id
        """
    ]

    conditions = []
    params = {}
<<<<<<< HEAD

    # Фильтр по городу (поиск в адресе)
    if filters.city:
        conditions.append("n.address ILIKE :city")
        params["city"] = f"%{filters.city}%"

=======
    
    # Фильтр по городу (поиск по имени города)
    if filters.city:
        conditions.append("c.name ILIKE :city")
        params['city'] = f"%{filters.city}%"
    
>>>>>>> 475e2bf (fix get nko)
    # Фильтр по категориям
    if filters.category and len(filters.category) > 0:
        conditions.append("nc.name = ANY(:categories)")
        params["categories"] = filters.category

    # Фильтр по regex (поиск в имени и описании)
    if filters.regex:
        conditions.append("(n.name ~* :regex OR n.description ~* :regex)")
        params["regex"] = filters.regex

    # TODO: Фильтр по избранным (требует таблицы favorites и user_id из JWT)
    # if filters.favorite and filters.jwt_token:
    #     user_id = decode_jwt(filters.jwt_token)
    #     conditions.append("EXISTS (SELECT 1 FROM favorites WHERE nko_id = n.id AND user_id = :user_id)")
    #     params['user_id'] = user_id

    # Добавление условий в запрос
    if conditions:
        query_parts.append("WHERE " + " AND ".join(conditions))

    # Группировка для агрегации категорий
    query_parts.append(
        """
        GROUP BY n.id, n.name, n.description, n.logo, n.address, c.name, n.coords[0], n.coords[1], n.meta, n.created_at
        ORDER BY n.created_at DESC
        """
    )

    query_sql = " ".join(query_parts)

=======
>>>>>>> 4bf97ca (use orm models in nko)
    try:
        # Базовый запрос с JOIN к городам
        query = (
            db.query(NKOInDB, CityInDB.name.label("city_name"))
            .join(CityInDB, NKOInDB.city_id == CityInDB.id)
        )
        
        # Фильтр по городу (поиск по имени города)
        if filters.city:
            query = query.filter(CityInDB.name.ilike(f"%{filters.city}%"))
        
        # Фильтр по категориям
        if filters.category and len(filters.category) > 0:
            # Подзапрос для фильтрации по категориям
            subquery = (
                db.query(NKOCategoriesLinkInDB.nko_id)
                .join(NKOCategoryInDB, NKOCategoriesLinkInDB.category_id == NKOCategoryInDB.id)
                .filter(NKOCategoryInDB.name.in_(filters.category))
            )
            query = query.filter(NKOInDB.id.in_(subquery))
        
        # Фильтр по regex (поиск в имени и описании)
        if filters.regex:
            query = query.filter(
                or_(
                    NKOInDB.name.op("~*")(filters.regex),
                    NKOInDB.description.op("~*")(filters.regex)
                )
            )
        
        # TODO: Фильтр по избранным (требует таблицы favorites и user_id из JWT)
        # if filters.favorite and filters.jwt_token:
        #     user_id = decode_jwt(filters.jwt_token)
        #     query = query.filter(exists().where(
        #         and_(Favorites.nko_id == NKOInDB.id, Favorites.user_id == user_id)
        #     ))
        
        # Сортировка по дате создания
        query = query.order_by(NKOInDB.created_at.desc())
        
        # Выполнение запроса
        rows = query.all()
        
        # Получение категорий для каждого НКО
        nko_list = []
<<<<<<< HEAD
        for row in rows:
<<<<<<< HEAD
            # Парсинг координат из POINT типа PostgreSQL
            coords_str = str(row.coords) if row.coords else "(0,0)"
            coords_parts = coords_str.strip("()").split(",")

=======
>>>>>>> 475e2bf (fix get nko)
=======
        for nko, city_name in rows:
            # Запрос категорий для текущего НКО
            categories = (
                db.query(NKOCategoryInDB.name)
                .join(NKOCategoriesLinkInDB, NKOCategoryInDB.id == NKOCategoriesLinkInDB.category_id)
                .filter(NKOCategoriesLinkInDB.nko_id == nko.id)
                .all()
            )
            categories = [cat[0] for cat in categories]
            
            # Извлечение координат из POINT
            # coords уже обработан result_processor и возвращается как tuple
            if nko.coords and isinstance(nko.coords, (tuple, list)) and len(nko.coords) == 2:
                latitude, longitude = float(nko.coords[0]), float(nko.coords[1])
            else:
                latitude, longitude = 0.0, 0.0
            
>>>>>>> 4bf97ca (use orm models in nko)
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
