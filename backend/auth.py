from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from pydantic import BaseModel, ConfigDict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

import security
from database import get_db
from models import UserInDB, UsersRoles


class UserCreate(BaseModel):
    full_name: str
    login: str
    password: str
    role: UsersRoles


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

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


async def get_user(db: AsyncSession, login: str):
    result = await db.execute(select(UserInDB).filter(UserInDB.login == login))
    return result.scalar_one_or_none()


@router.post("/auth/register", response_model=User)
async def register_user(user: UserCreate, db: AsyncSession = Depends(get_db)):
    db_user = await get_user(db, login=user.login)
    if db_user:
        raise HTTPException(status_code=400, detail="Login already registered")

    hashed_password, salt = security.get_password_hash_and_salt(user.password)

    db_user = UserInDB(
        full_name=user.full_name,
        login=user.login,
        role=user.role,
        hash=hashed_password,
        salt=salt,
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user


@router.post("/auth/login", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)
):
    user = await get_user(db, login=form_data.username)
    if not user or not security.verify_password(
        form_data.password, user.salt, user.hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = security.create_access_token(data={"sub": user.login})
    return {"access_token": access_token, "token_type": "bearer"}


async def get_current_user(
    token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, security.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        login: str = payload.get("sub")
        if login is None:
            raise credentials_exception
        token_data = TokenData(login=login)
    except JWTError:
        raise credentials_exception
    user = await get_user(db, login=token_data.login)
    if user is None:
        raise credentials_exception
    return user


@router.get("/users/me/", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user
