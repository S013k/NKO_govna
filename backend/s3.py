import logging
import os
from datetime import datetime
from io import BytesIO
from typing import List, Optional
from hashlib import md5

from fastapi import APIRouter, File, HTTPException, Response, UploadFile
from fastapi.responses import StreamingResponse
from minio import Minio
from minio.error import S3Error
from pydantic import BaseModel

from config import settings

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.FileHandler("s3_operations.log"), logging.StreamHandler()],
)
logger = logging.getLogger(__name__)


# Pydantic модели
class UploadResponse(BaseModel):
    url: str
    bucket: str
    filename: str
    size: int
    content_type: str


class FileInfo(BaseModel):
    filename: str
    size: int
    content_type: str
    last_modified: str


class DeleteResponse(BaseModel):
    message: str
    filename: str


# S3 Client класс
class S3Client:
    def __init__(self):
        self.client = Minio(
            endpoint=settings.minio_endpoint,
            access_key=settings.minio_access_key,
            secret_key=settings.minio_secret_key,
            secure=settings.minio_secure,
        )
        self._ensure_buckets_exist()

    def _ensure_buckets_exist(self):
        """Проверяем существование всех бакетов при инициализации"""
        try:
            for bucket in settings.buckets:
                try:
                    if not self.client.bucket_exists(bucket):
                        self.client.make_bucket(bucket)
                        logger.info(f"Created bucket: {bucket}")
                    else:
                        logger.info(f"Bucket already exists: {bucket}")
                except S3Error as e:
                    if e.code == "InvalidBucketName":
                        logger.error(f"Invalid bucket name: {bucket}")
                        # Продолжаем работу с другими бакетами
                        continue
                    else:
                        raise
        except Exception as e:
            logger.error(f"Error ensuring buckets exist: {e}")
            # Не прерываем запуск приложения из-за проблем с бакетами

    def _log_operation(
        self, operation: str, bucket: str, filename: str, details: str = ""
    ):
        """Логирование операций"""
        timestamp = datetime.now().isoformat()
        log_message = f"[{timestamp}] {operation} - Bucket: {bucket}, File: {filename}"
        if details:
            log_message += f", Details: {details}"
        logger.info(log_message)

    async def upload_file(self, bucket: str, file: UploadFile) -> UploadResponse:
        """Загрузка файла в бакет"""
        if not settings.is_valid_bucket(bucket):
            raise HTTPException(status_code=400, detail=f"Invalid bucket: {bucket}")

        try:
            # Читаем файл
            file_content = await file.read()
            filename = md5(file_content).hexdigest()
            file_size = len(file_content)

            # Возвращаем указатель в начало для последующей загрузки
            await file.seek(0)

            # Загружаем в MinIO
            self.client.put_object(
                bucket_name=bucket,
                object_name=filename,
                data=BytesIO(file_content),
                length=file_size,
                content_type=file.content_type,
            )

            # Формируем URL для доступа
            file_url = f"{settings.s3_base_url}/{bucket}/{filename}"

            # Логируем операцию
            self._log_operation(
                "UPLOAD",
                bucket,
                filename,
                f"Size: {file_size}, ContentType: {file.content_type}",
            )

            return UploadResponse(
                url=file_url,
                bucket=bucket,
                filename=filename,
                size=file_size,
                content_type=file.content_type,
            )

        except S3Error as e:
            logger.error(
                f"Error uploading file {filename} to bucket {bucket}: {e}"
            )
            raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error uploading file {filename}: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    def get_file(self, bucket: str, filename: str) -> StreamingResponse:
        """Получение файла из бакета"""
        if not settings.is_valid_bucket(bucket):
            raise HTTPException(status_code=400, detail=f"Invalid bucket: {bucket}")

        try:
            # Получаем объект из MinIO
            response = self.client.get_object(bucket_name=bucket, object_name=filename)

            # Логируем операцию
            self._log_operation("DOWNLOAD", bucket, filename)

            # Создаем streaming response
            return StreamingResponse(
                BytesIO(response.read()),
                media_type=response.headers.get(
                    "content-type", "application/octet-stream"
                ),
                headers={"Content-Disposition": f"inline; filename={filename}"},
            )

        except S3Error as e:
            if e.code == "NoSuchKey":
                logger.warning(f"File not found: {bucket}/{filename}")
                raise HTTPException(status_code=404, detail="File not found")
            logger.error(f"Error getting file {filename} from bucket {bucket}: {e}")
            raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error getting file {filename}: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def delete_file(self, bucket: str, filename: str) -> DeleteResponse:
        """Удаление файла из бакета"""
        if not settings.is_valid_bucket(bucket):
            raise HTTPException(status_code=400, detail=f"Invalid bucket: {bucket}")

        try:
            # Проверяем существование файла
            try:
                self.client.stat_object(bucket_name=bucket, object_name=filename)
            except S3Error as e:
                if e.code == "NoSuchKey":
                    raise HTTPException(status_code=404, detail="File not found")
                raise

            # Удаляем файл
            self.client.remove_object(bucket_name=bucket, object_name=filename)

            # Логируем операцию
            self._log_operation("DELETE", bucket, filename)

            return DeleteResponse(
                message="File deleted successfully", filename=filename
            )

        except S3Error as e:
            logger.error(f"Error deleting file {filename} from bucket {bucket}: {e}")
            raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error deleting file {filename}: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    def list_files(self, bucket: str) -> List[FileInfo]:
        """Получение списка файлов в бакете"""
        if not settings.is_valid_bucket(bucket):
            raise HTTPException(status_code=400, detail=f"Invalid bucket: {bucket}")

        try:
            files = []
            objects = self.client.list_objects(bucket_name=bucket)

            for obj in objects:
                # Получаем статистику объекта для content-type
                try:
                    stat = self.client.stat_object(
                        bucket_name=bucket, object_name=obj.object_name
                    )
                    content_type = stat.content_type or "application/octet-stream"
                    last_modified = (
                        stat.last_modified.isoformat() if stat.last_modified else ""
                    )
                except:
                    content_type = "application/octet-stream"
                    last_modified = ""

                files.append(
                    FileInfo(
                        filename=obj.object_name,
                        size=obj.size,
                        content_type=content_type,
                        last_modified=last_modified,
                    )
                )

            # Логируем операцию
            self._log_operation("LIST", bucket, f"Found {len(files)} files")

            return files

        except S3Error as e:
            logger.error(f"Error listing files in bucket {bucket}: {e}")
            raise HTTPException(status_code=500, detail=f"List failed: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error listing files in bucket {bucket}: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")


# Инициализация S3 клиента
s3_client = S3Client()

# Создание роутера
router = APIRouter()


# Эндпоинты
@router.post("/upload/{bucket}", response_model=UploadResponse)
async def upload_file(bucket: str, file: UploadFile = File(...)):
    """Загрузка файла в указанный бакет"""
    return await s3_client.upload_file(bucket, file)


@router.get("/{bucket}/", response_model=List[FileInfo])
async def list_files(bucket: str):
    """Получение списка файлов в бакете"""
    return s3_client.list_files(bucket)


@router.get("/{bucket}/{filename:path}")
async def get_file(bucket: str, filename: str):
    """Получение файла из бакета"""
    return s3_client.get_file(bucket, filename)


@router.delete("/{bucket}/{filename:path}", response_model=DeleteResponse)
async def delete_file(bucket: str, filename: str):
    """Удаление файла из бакета"""
    return await s3_client.delete_file(bucket, filename)


@router.get("/buckets")
async def list_buckets():
    """Получение списка доступных бакетов"""
    return {
        "buckets": [
            {"name": bucket, "description": bucket.replace("_", " ").title()}
            for bucket in settings.buckets
        ]
    }


@router.get("/health")
async def s3_health():
    """Проверка здоровья S3 сервиса"""
    try:
        # Проверяем соединение с MinIO
        buckets = s3_client.client.list_buckets()
        return {
            "status": "healthy",
            "minio_connected": True,
            "available_buckets": len(settings.buckets),
            "timestamp": datetime.now().isoformat(),
        }
    except Exception as e:
        logger.error(f"S3 health check failed: {e}")
        return Response(
            content={"status": "unhealthy", "error": str(e)}, status_code=503
        )
