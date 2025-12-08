class StatusCache:
    def __init__(self):
        self._cache = {}

    def update(self, container_id: str, status: dict):
        self._cache[container_id] = status

    def get(self, container_id: str):
        return self._cache.get(container_id)

    def get_all(self):
        return self._cache
