from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime

from config import settings
from s3 import router as s3_router

app = FastAPI(
    title="НКО Добрые дела Росатома API",
    description="Backend API для портала Добрые дела Росатома",
    version="1.0.0"
)

# CORS настройки
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,  # Используем настройки из config
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем S3 роутеры
app.include_router(s3_router, prefix="/s3", tags=["S3 Storage"])


class PingResponse(BaseModel):
    status: str
    message: str
    timestamp: str


@app.get("/")
async def root():
    """Корневой эндпоинт"""
    return {
        "message": "НКО Добрые дела Росатома API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/ping", response_model=PingResponse)
async def ping():
    """Проверка работоспособности API"""
    return PingResponse(
        status="ok",
        message="pong",
        timestamp=datetime.utcnow().isoformat()
    )


@app.get("/health")
async def health_check():
    """Health check эндпоинт для мониторинга"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)