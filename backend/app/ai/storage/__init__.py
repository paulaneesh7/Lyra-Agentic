from abc import ABC, abstractmethod
from pathlib import Path
from uuid import uuid4

from app.core.config import settings


class StorageProvider(ABC):
    @abstractmethod
    def save(self, data: bytes, content_type: str, folder: str) -> str:
        raise NotImplementedError

    @abstractmethod
    def load(self, key: str) -> bytes:
        raise NotImplementedError


class LocalStorageProvider(StorageProvider):
    def __init__(self) -> None:
        self.root = Path(settings.local_storage_dir)
        self.root.mkdir(parents=True, exist_ok=True)

    def save(self, data: bytes, content_type: str, folder: str) -> str:
        ext = {
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp",
        }.get(content_type, ".bin")
        key = f"{folder}/{uuid4().hex}{ext}"
        path = self.root / key
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
        return key

    def load(self, key: str) -> bytes:
        return (self.root / key).read_bytes()


class S3StorageProvider(StorageProvider):
    def __init__(self) -> None:
        import boto3

        self.client = boto3.client(
            "s3",
            region_name=settings.aws_region,
            aws_access_key_id=settings.aws_access_key_id or None,
            aws_secret_access_key=settings.aws_secret_access_key or None,
            endpoint_url=settings.s3_endpoint_url or None,
        )
        self.bucket = settings.s3_bucket

    def save(self, data: bytes, content_type: str, folder: str) -> str:
        from uuid import uuid4

        key = f"{folder}/{uuid4().hex}"
        self.client.put_object(Bucket=self.bucket, Key=key, Body=data, ContentType=content_type)
        return key

    def load(self, key: str) -> bytes:
        obj = self.client.get_object(Bucket=self.bucket, Key=key)
        return obj["Body"].read()


def get_storage() -> StorageProvider:
    if settings.storage_provider == "s3" and settings.s3_bucket:
        return S3StorageProvider()
    return LocalStorageProvider()
