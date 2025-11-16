from typing import Optional
from datetime import datetime

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

import security
from models import UserInDB, UsersRoles


class UserCreate(BaseModel):
    full_name: str
    login: str
    password: str
    role: UsersRoles
    user_pic: Optional[str] = None


class User(BaseModel):
    id: int
    full_name: str
    login: str
    role: UsersRoles
    user_pic: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str


class TokenData(BaseModel):
    login: Optional[str] = None


class RefreshTokenRequest(BaseModel):
    refresh_token: str


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def get_user(db: Session, login: str):
    return db.query(UserInDB).filter(UserInDB.login == login).first()


def register_user(user: UserCreate, db: Session):
    db_user = get_user(db, login=user.login)
    if db_user:
        raise HTTPException(status_code=400, detail="Login already registered")

    hashed_password, salt = security.get_password_hash_and_salt(user.password)

    db_user = UserInDB(
        full_name=user.full_name,
        login=user.login,
        role=user.role,
        hash=hashed_password,
        salt=salt,
        user_pic=user.user_pic,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def login_for_access_token(form_data: OAuth2PasswordRequestForm, db: Session):
    user = get_user(db, login=form_data.username)
    if not user or not security.verify_password(
        form_data.password, user.salt, user.hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Создаем access token с коротким сроком жизни
    access_token = security.create_access_token(data={"sub": user.login, "id": user.id})
    
    # Создаем refresh token с длительным сроком жизни
    refresh_token, _ = security.create_refresh_token(data={"sub": user.login, "id": user.id})
    
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}


def refresh_access_token(refresh_token: str, db: Session):
    """Обновляет access token с помощью refresh token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Декодируем refresh token
        payload = jwt.decode(
            refresh_token, security.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        
        # Проверяем наличие необходимых данных
        login: str = payload.get("sub")
        user_id: int = payload.get("id")
        
        if login is None or user_id is None:
            raise credentials_exception
        
        # Проверяем существование пользователя
        user = get_user(db, login=login)
        if user is None or user.id != user_id:
            raise credentials_exception
        
        # Создаем новый access token
        access_token = security.create_access_token(data={"sub": user.login, "id": user.id})
        
        # Создаем новый refresh token
        new_refresh_token, _ = security.create_refresh_token(data={"sub": user.login, "id": user.id})
        
        return {"access_token": access_token, "refresh_token": new_refresh_token, "token_type": "bearer"}
        
    except JWTError:
        raise credentials_exception


def get_current_user(token: str, db: Session):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = jwt_decode(token)
    login: str = payload.get("sub")
    if login is None:
        raise credentials_exception
    token_data = TokenData(login=login)
    user = get_user(db, login=token_data.login)
    if user is None:
        raise credentials_exception
    return user


def read_users_me(current_user: User):
    return current_user

def jwt_decode(token: str):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        return jwt.decode(
            token, security.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
    except JWTError:
        raise credentials_exception
