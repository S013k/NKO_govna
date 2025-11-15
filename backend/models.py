from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple

from pydantic import BaseModel, ConfigDict
from sqlalchemy import Column, Integer, String
from sqlalchemy.dialects.postgresql import ENUM

from .database import Base


class UsersRoles(str, Enum):
    nko = "nko"
    admin = "admin"
    moder = "moder"
    user = "user"


class EventsStates(str, Enum):
    draft = "draft"
    approved = "approved"
    rejected = "rejected"
    review = "review"


class UserCreate(BaseModel):
    full_name: str
    login: str
    password: str
    role: UsersRoles


class UserInDB(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String)
    login = Column(String, unique=True, index=True)
    hash = Column(String)
    salt = Column(String)
    role = Column(
        ENUM(UsersRoles, name="users_roles", create_type=False), nullable=False
    )


class User(BaseModel):
    id: int
    full_name: str
    login: str
    role: UsersRoles

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    login: Optional[str] = None


class NKOCategory(BaseModel):
    id: int
    name: str
    created_at: datetime


class City(BaseModel):
    id: int
    name: str


class NKO(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    logo: Optional[str] = None
    address: str
    city_id: int
    coords: Tuple[float, float]
    meta: Optional[Dict[str, Any]] = None
    created_at: datetime


class EventCategory(BaseModel):
    id: int
    name: str
    description: str


class Event(BaseModel):
    id: int
    nko_id: int
    name: str
    description: Optional[str] = None
    address: Optional[str] = None
    picture: Optional[str] = None
    coords: Optional[Tuple[float, float]] = None
    starts_at: Optional[datetime] = None
    finish_at: Optional[datetime] = None
    created_by: int
    approved_by: Optional[int] = None
    state: EventsStates
    meta: Optional[str] = None
    created_at: datetime
