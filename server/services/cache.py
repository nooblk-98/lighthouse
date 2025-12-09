class StatusCache:
    def __init__(self):
        self._cache = {}

    def update(self, key: str, status: dict):
        self._cache[key] = status

    def get(self, key: str):
        return self._cache.get(key)

    def get_all(self):
        return self._cache
