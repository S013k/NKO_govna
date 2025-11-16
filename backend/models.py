from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple

from pydantic import BaseModel, ConfigDict
from sqlalchemy import Column, Integer, String, Text, SmallInteger, BigInteger, ForeignKey
from sqlalchemy.dialects.postgresql import ENUM, JSONB
from sqlalchemy.types import TIMESTAMP, UserDefinedType

from database import Base


# Кастомный тип для PostgreSQL POINT
class Point(UserDefinedType):
    cache_ok = True
    
    def get_col_spec(self):
        return "POINT"
    
    def bind_processor(self, dialect):
        def process(value):
            if value is None:
                return None
            if isinstance(value, (tuple, list)) and len(value) == 2:
                return f"({value[0]},{value[1]})"
            return value
        return process
    
    def result_processor(self, dialect, coltype):
        def process(value):
            if value is None:
                return None
            # PostgreSQL возвращает POINT как строку "(x,y)"
            if isinstance(value, str):
                coords = value.strip("()").split(",")
                return (float(coords[0]), float(coords[1]))
            return value
        return process


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


class UserInDB(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    login = Column(String(100), nullable=False, unique=True, index=True)
    hash = Column(String(100), nullable=False)
    salt = Column(String(10), nullable=False)
    role = Column(
        ENUM(UsersRoles, name="users_roles", create_type=False), nullable=False
    )

class NKOCategoryInDB(Base):
    __tablename__ = "nko_categories"
    id = Column(SmallInteger, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default="now()")


class CityInDB(Base):
    __tablename__ = "cities"
    id = Column(SmallInteger, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)


class NKOInDB(Base):
    __tablename__ = "nko"
    id = Column(BigInteger, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    logo = Column(Text)
    address = Column(Text, nullable=False)
    city_id = Column(SmallInteger, ForeignKey("cities.id"), nullable=False)
    coords = Column(Point, nullable=False)
    meta = Column(JSONB)
    created_at = Column(TIMESTAMP(timezone=True), server_default="now()")


class NKOCategoriesLinkInDB(Base):
    __tablename__ = "nko_categories_link"
    nko_id = Column(BigInteger, ForeignKey("nko.id", ondelete="CASCADE"), primary_key=True)
    category_id = Column(SmallInteger, ForeignKey("nko_categories.id", ondelete="RESTRICT"), primary_key=True)


class NKOUsersLinkInDB(Base):
    __tablename__ = "nko_users_link"
    nko_id = Column(BigInteger, ForeignKey("nko.id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)


class EventsCategoryInDB(Base):
    __tablename__ = "events_categories"
    id = Column(SmallInteger, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    description = Column(String(255), nullable=False, unique=True)


class EventInDB(Base):
    __tablename__ = "events"
    id = Column(BigInteger, primary_key=True, index=True)
    nko_id = Column(BigInteger, ForeignKey("nko.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    address = Column(Text)
    city_id = Column(SmallInteger, ForeignKey("cities.id"), nullable=False)
    picture = Column(Text)
    coords = Column(Point)
    starts_at = Column(TIMESTAMP(timezone=True))
    finish_at = Column(TIMESTAMP(timezone=True))
    created_by = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    approved_by = Column(BigInteger, ForeignKey("users.id"))
    state = Column(ENUM(EventsStates, name="events_states", create_type=False), nullable=False)
    meta = Column(Text)
    created_at = Column(TIMESTAMP(timezone=True), server_default="now()")


class EventsCategoriesLinkInDB(Base):
    __tablename__ = "events_categories_link"
    events_id = Column(BigInteger, ForeignKey("events.id", ondelete="CASCADE"), primary_key=True)
    category_id = Column(SmallInteger, ForeignKey("events_categories.id", ondelete="RESTRICT"), primary_key=True)

class FavoriteNewsInDB(Base):
    __tablename__ = "favorite_news"
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    news_id = Column(BigInteger, primary_key=True)


class FavoriteEventsInDB(Base):
    __tablename__ = "favorite_events"
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    event_id = Column(BigInteger, ForeignKey("events.id", ondelete="CASCADE"), primary_key=True)


class FavoriteNKOInDB(Base):
    __tablename__ = "favorite_nko"
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    nko_id = Column(BigInteger, ForeignKey("nko.id", ondelete="CASCADE"), primary_key=True)


class NewsInDB(Base):
    __tablename__ = "news"
    id = Column(BigInteger, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    image = Column(Text)
    city_id = Column(SmallInteger, ForeignKey("cities.id"))
    created_by = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    approved_by = Column(BigInteger, ForeignKey("users.id"))
    meta = Column(Text)
    created_at = Column(TIMESTAMP(timezone=True), server_default="now()")

