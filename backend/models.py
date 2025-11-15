from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple

from pydantic import BaseModel, ConfigDict
from sqlalchemy import Column, Integer, String, Text, SmallInteger, BigInteger, ForeignKey
from sqlalchemy.dialects.postgresql import ENUM, JSONB, POINT
from sqlalchemy.types import TIMESTAMP

from database import Base


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
    full_name = Column(String)
    login = Column(String, unique=True, index=True)
    hash = Column(String)
    salt = Column(String)
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
    coords = Column(POINT, nullable=False)
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
    picture = Column(Text)
    coords = Column(POINT)
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

