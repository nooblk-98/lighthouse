import json
import logging
import os
from datetime import datetime
from typing import List, Optional
from uuid import uuid4

HISTORY_FILE = "history.json"
logger = logging.getLogger(__name__)


class HistoryService:
    def __init__(self, file_path: str = HISTORY_FILE, max_entries: int = 500):
        self.file_path = file_path
        self.max_entries = max_entries
        self._history: List[dict] = []
        self._load()

    def _load(self):
        if os.path.exists(self.file_path):
            try:
                with open(self.file_path, "r") as f:
                    self._history = json.load(f) or []
            except Exception as e:
                logger.error(f"Failed to load history: {e}")
                self._history = []

    def _save(self):
        try:
            with open(self.file_path, "w") as f:
                json.dump(self._history, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save history: {e}")

    def log_event(
        self,
        action: str,
        status: str,
        message: Optional[str] = None,
        container: Optional[str] = None,
        trigger: Optional[str] = None,
        details: Optional[dict] = None,
    ) -> dict:
        entry = {
            "id": str(uuid4()),
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "action": action,
            "status": status,
            "message": message or "",
            "container": container,
            "trigger": trigger,
            "details": details or {},
        }
        self._history.append(entry)
        if len(self._history) > self.max_entries:
            self._history = self._history[-self.max_entries :]
        self._save()
        return entry

    def get_history(self, action: Optional[str] = None, status: Optional[str] = None, limit: int = 100) -> List[dict]:
        records = self._history
        if action:
            records = [item for item in records if item.get("action") == action]
        if status:
            records = [item for item in records if item.get("status") == status]
        if limit:
            records = records[-limit:]
        return list(reversed(records))
