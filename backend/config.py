from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Application
    app_name: str = "НКО Добрые дела Росатома API"
    app_version: str = "1.0.0"
    debug: bool = True
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    
    # CORS
    cors_origins: List[str] = ["http://localhost:3000", "http://localhost:3001"]
    
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
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()