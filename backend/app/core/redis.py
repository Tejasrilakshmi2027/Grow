import json
import time
import logging
from typing import Optional, Any
from app.core.config import settings

logger = logging.getLogger(__name__)

class MemoryCache:
    """Thread-safe in-memory cache fallback when Redis is offline."""
    def __init__(self):
        self._store = {}

    def get(self, key: str) -> Optional[str]:
        if key in self._store:
            val, expire_at = self._store[key]
            if expire_at is not None and time.time() > expire_at:
                del self._store[key]
                return None
            return val
        return None

    def set(self, key: str, value: str, ex: Optional[int] = None):
        expire_at = time.time() + ex if ex else None
        self._store[key] = (value, expire_at)

    def delete(self, key: str):
        self._store.pop(key, None)

class CacheService:
    def __init__(self):
        self.redis_client = None
        self.memory_cache = MemoryCache()
        if settings.USE_REDIS:
            try:
                import redis
                self.redis_client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
                self.redis_client.ping()
                logger.info("Successfully connected to Redis.")
            except Exception as e:
                logger.warning(f"Redis connection failed ({e}). Falling back to In-Memory Cache.")
                self.redis_client = None

    def get_json(self, key: str) -> Optional[Any]:
        try:
            if self.redis_client:
                data = self.redis_client.get(key)
            else:
                data = self.memory_cache.get(key)
            return json.loads(data) if data else None
        except Exception as e:
            logger.error(f"Error fetching key {key} from cache: {e}")
            return None

    def set_json(self, key: str, value: Any, ttl_seconds: int = 60):
        try:
            serialized = json.dumps(value, default=str)
            if self.redis_client:
                self.redis_client.set(key, serialized, ex=ttl_seconds)
            else:
                self.memory_cache.set(key, serialized, ex=ttl_seconds)
        except Exception as e:
            logger.error(f"Error setting key {key} in cache: {e}")

    def delete(self, key: str):
        try:
            if self.redis_client:
                self.redis_client.delete(key)
            else:
                self.memory_cache.delete(key)
        except Exception as e:
            logger.error(f"Error deleting key {key} from cache: {e}")

cache = CacheService()
