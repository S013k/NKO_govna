from pydantic import BaseModel
from typing import Optional, Tuple, List, Dict, Any
from datetime import datetime
from enum import Enum

class UsersRoles(str, Enum):
    nko = 'nko'
    admin = 'admin'
    moder = 'moder'
    user = 'user'

class EventsStates(str, Enum):
    draft = 'draft'
    approved = 'approved'
    rejected = 'rejected'
    review = 'review'

class UserCreate(BaseModel):
    full_name: str
    login: str
    password: str
    role: UsersRoles

class UserInDB(BaseModel):
    id: int
    full_name: str
    login: str
    role: UsersRoles
    hash: str
    salt: str

class User(BaseModel):
    id: int
    full_name: str
    login: str
    role: UsersRoles

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