from typing import Optional, List, Dict, Any
from fastapi import Depends, HTTPException
from sqlalchemy import select, func, or_, and_, text
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from db import get_db


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
    url: Optional[str]
    logo: Optional[str]
    address: str
    latitude: float
    longitude: float
    created_at: Optional[str]
    categories: List[str]


async def fetch_nko(
    filters: NKOFilterRequest,
    db: AsyncSession
) -> List[NKOResponse]:
    """
    Получение списка НКО с фильтрацией
    
    Args:
        filters: Параметры фильтрации
        db: Сессия базы данных
        
    Returns:
        Список НКО с их категориями
    """
    
    # Базовый SQL запрос с агрегацией категорий
    query_parts = [
        """
        SELECT DISTINCT
            n.id,
            n.name,
            n.description,
            n.url,
            n.logo,
            n.address,
            n.coords,
            n.created_at,
            COALESCE(
                ARRAY_AGG(DISTINCT nc.name) FILTER (WHERE nc.name IS NOT NULL),
                ARRAY[]::VARCHAR[]
            ) as categories
        FROM nko n
        LEFT JOIN nko_categories_link ncl ON n.id = ncl.nko_id
        LEFT JOIN nko_categories nc ON ncl.category_id = nc.id
        """
    ]
    
    conditions = []
    params = {}
    
    # Фильтр по городу (поиск в адресе)
    if filters.city:
        conditions.append("n.address ILIKE :city")
        params['city'] = f"%{filters.city}%"
    
    # Фильтр по категориям
    if filters.category and len(filters.category) > 0:
        conditions.append("nc.name = ANY(:categories)")
        params['categories'] = filters.category
    
    # Фильтр по regex (поиск в имени и описании)
    if filters.regex:
        conditions.append("(n.name ~* :regex OR n.description ~* :regex)")
        params['regex'] = filters.regex
    
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
        GROUP BY n.id, n.name, n.description, n.url, n.logo, n.address, n.coords, n.created_at
        ORDER BY n.created_at DESC
        """
    )
    
    query_sql = " ".join(query_parts)
    
    try:
        # Выполнение запроса
        result = await db.execute(text(query_sql), params)
        rows = result.fetchall()
        
        # Преобразование результатов в список объектов NKOResponse
        nko_list = []
        for row in rows:
            # Парсинг координат из POINT типа PostgreSQL
            coords_str = str(row.coords) if row.coords else '(0,0)'
            coords_parts = coords_str.strip('()').split(',')
            
            nko_data = NKOResponse(
                id=row.id,
                name=row.name,
                description=row.description,
                url=row.url,
                logo=row.logo,
                address=row.address,
                latitude=float(coords_parts[0]) if len(coords_parts) > 0 else 0.0,
                longitude=float(coords_parts[1]) if len(coords_parts) > 1 else 0.0,
                created_at=row.created_at.isoformat() if row.created_at else None,
                categories=list(row.categories) if row.categories else []
            )
            nko_list.append(nko_data)
        
        return nko_list
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")