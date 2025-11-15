<<<<<<< HEAD
from typing import List
=======
from pydantic_settings import BaseSettings
from typing import List, Union
import os
>>>>>>> a362388 (depends_on)

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Application
    app_name: str = "НКО Добрые дела Росатома API"
    app_version: str = "1.0.0"
    debug: bool = True

    # Server
    host: str = "0.0.0.0"
    port: int = 8000
<<<<<<< HEAD

    # CORS
    cors_origins: List[str] = ["http://localhost:3000", "http://localhost:3001"]

=======
    
    # CORS - Handle both comma-separated and JSON formats
    @property
    def cors_origins(self) -> List[str]:
        cors_env = os.getenv("CORS_ORIGINS", "")
        if not cors_env:
            return ["http://localhost:3000", "http://localhost:3001"]
        
        # Try to parse as JSON first
        try:
            import json
            return json.loads(cors_env)
        except (json.JSONDecodeError, TypeError):
            # Fall back to comma-separated format
            return [origin.strip() for origin in cors_env.split(",") if origin.strip()]
    
>>>>>>> a362388 (depends_on)
    # MinIO/S3 Configuration
    minio_endpoint: str = "localhost:9990"
    minio_access_key: str = "admin"
    minio_secret_key: str = "qwerty123321"
    minio_secure: bool = False

    # Buckets
    bucket_userpic: str = "userpic"
    bucket_docs: str = "docs"
    bucket_videos: str = "videos"
    bucket_nko_logo: str = "nko-logo"
    bucket_event_pics: str = "event-pics"
    bucket_news_pics: str = "news-pics"

    # Base URL для доступа к файлам
    s3_base_url: str = "http://localhost:8000/s3"

    # Database (для будущего использования)
    database_url: str = "postgresql://user:password@localhost:5432/nko_db"

    # JWT (для будущего использования)
    jwt_secret: str = "your-secret-key-here"
    jwt_algorithm: str = "HS256"
    jwt_expiration: int = 3600

    @property
    def buckets(self) -> List[str]:
        """Список всех бакетов"""
        return [
            self.bucket_userpic,
            self.bucket_docs,
            self.bucket_videos,
            self.bucket_nko_logo,
            self.bucket_event_pics,
            self.bucket_news_pics,
        ]

    def is_valid_bucket(self, bucket_name: str) -> bool:
        """Проверка валидности имени бакета"""
        return bucket_name in self.buckets
<<<<<<< HEAD

    class Config:
        env_file = ".env"
        case_sensitive = False
=======
    
    model_config = {
        "extra": "ignore",
        "env_file": ".env",
        "case_sensitive": False
    }
>>>>>>> a362388 (depends_on)


settings = Settings()
