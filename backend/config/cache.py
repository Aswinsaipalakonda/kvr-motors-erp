import hashlib
import json
from django.core.cache import cache
from rest_framework.response import Response

class CacheResponseMixin:
    """
    Mixin to cache list and retrieve API responses using Redis.
    Automatically invalidates the cache when mutations (create, update, destroy) occur.
    """
    cache_timeout = 60 * 15  # 15 minutes default cache timeout

    def get_cache_key_prefix(self):
        """
        Generates a key prefix based on the model or class name.
        """
        if hasattr(self, 'get_queryset'):
            try:
                model = self.get_queryset().model
                return f"drf_cache:{model._meta.app_label}:{model._meta.model_name}"
            except Exception:
                pass
        return f"drf_cache:{self.__class__.__name__}"

    def get_cache_key(self, request, *args, **kwargs):
        """
        Constructs a cache key combining model prefix, action, query params, and user details.
        """
        prefix = self.get_cache_key_prefix()
        action = self.action

        # Isolate cache per user role to prevent cross-role data leaks, or group by user
        user_part = f"user_{request.user.id}" if request.user and request.user.is_authenticated else "anonymous"

        # Hash request query params to cache filtered states (like branch mappings, sorting, etc.)
        query_params = dict(request.query_params.items())
        query_hash = hashlib.md5(json.dumps(query_params, sort_keys=True).encode('utf-8')).hexdigest()

        if action == 'retrieve':
            lookup_field = self.lookup_url_kwarg or self.lookup_field or 'pk'
            lookup_val = kwargs.get(lookup_field, '')
            return f"{prefix}:retrieve:{lookup_val}:{user_part}"

        return f"{prefix}:list:{query_hash}:{user_part}"

    def _safe_cache_get(self, key):
        try:
            return cache.get(key)
        except Exception as e:
            # Fail-open: don't let cache backend issues break API responses
            print(f"Cache GET error for key {key}: {e}")
            return None

    def _safe_cache_set(self, key, value, timeout=None):
        try:
            cache.set(key, value, timeout)
        except Exception as e:
            # Log and continue — cache failures should not surface to clients
            print(f"Cache SET error for key {key}: {e}")

    def list(self, request, *args, **kwargs):
        if request.method != 'GET':
            return super().list(request, *args, **kwargs)

        cache_key = self.get_cache_key(request, *args, **kwargs)
        cached_data = self._safe_cache_get(cache_key)

        if cached_data is not None:
            return Response(cached_data)

        response = super().list(request, *args, **kwargs)
        if response.status_code == 200:
            self._safe_cache_set(cache_key, response.data, self.cache_timeout)
        return response

    def retrieve(self, request, *args, **kwargs):
        if request.method != 'GET':
            return super().retrieve(request, *args, **kwargs)

        cache_key = self.get_cache_key(request, *args, **kwargs)
        cached_data = self._safe_cache_get(cache_key)

        if cached_data is not None:
            return Response(cached_data)

        response = super().retrieve(request, *args, **kwargs)
        if response.status_code == 200:
            self._safe_cache_set(cache_key, response.data, self.cache_timeout)
        return response

    def clear_cache(self):
        """
        Clears all cached responses for this model by finding and deleting keys matching prefix.
        """
        prefix = self.get_cache_key_prefix()
        try:
            # For Django built-in RedisCache:
            # We access the raw redis client under the backend connection to delete patterns
            if hasattr(cache, '_cache') and hasattr(cache._cache, 'get_client'):
                client = cache._cache.get_client(None)
                # Redis key patterns contain django prefix (e.g. ":1:drf_cache:...")
                keys = client.keys(f"*{prefix}:*")
                if keys:
                    client.delete(*keys)
            else:
                # Fallback if another cache backend is configured
                pass
        except Exception as e:
            # Log error internally and fall through (don't break API mutations if cache clear fails)
            print(f"Error clearing cache keys for prefix {prefix}: {e}")

    # Hook into standard model mutations to invalidate cached data
    def perform_create(self, serializer):
        super().perform_create(serializer)
        self.clear_cache()

    def perform_update(self, serializer):
        super().perform_update(serializer)
        self.clear_cache()

    def perform_destroy(self, instance):
        super().perform_destroy(instance)
        self.clear_cache()
