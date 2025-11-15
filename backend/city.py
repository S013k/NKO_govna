from typing import Any, Dict, List, Optional

from fastapi import Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import and_, func, or_
from sqlalchemy.orm import Session

from database import get_db
from models import (
    CityInDB,
)


class CityCreateRequest(BaseModel):
    """Модель запроса для создания города"""
    name: str


class CityResponse(BaseModel):
    """Модель ответа с данными города"""

    id: int
    name: str


def fetch_cities(regex: Optional[str], db: Session) -> List[CityResponse]:
    """
    Получение списка городов с фильтрацией
    """
    
    try:
        query = db.query(CityInDB)
        
        if regex:
            query = query.filter(CityInDB.name.op("~*")(regex))
        
        rows = query.all()
        
        city_list = [CityResponse(id=city.id, name=city.name) for city in rows]
        
        return city_list
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


def create_city(city_data: CityCreateRequest, db: Session) -> CityResponse:
    """
    Создание нового города
    """
    
    try:
        existing_city = db.query(CityInDB).filter(CityInDB.name == city_data.name).first()
        if existing_city:
            raise HTTPException(status_code=400, detail="City already exists")
        
        new_city = CityInDB(name=city_data.name)
        db.add(new_city)
        db.commit()
        db.refresh(new_city)
        
        return CityResponse(id=new_city.id, name=new_city.name)
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


def fetch_city_by_id(city_id: int, db: Session) -> CityResponse:
    """
    Получение города по ID
    """
    
    try:
        city = db.query(CityInDB).filter(CityInDB.id == city_id).first()
        
        if not city:
            raise HTTPException(status_code=404, detail="City not found")
        
        return CityResponse(id=city.id, name=city.name)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


def delete_city(city_id: int, db: Session) -> Dict[str, str]:
    """
    Удаление города по ID
    """
    
    try:
        city = db.query(CityInDB).filter(CityInDB.id == city_id).first()
        
        if not city:
            raise HTTPException(status_code=404, detail="City not found")
        
        db.delete(city)
        db.commit()
        
        return {"status": "success", "message": f"City with id {city_id} has been deleted."}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")