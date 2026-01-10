import json
import os
import logging
import copy
import sqlite3

SETTINGS_DB = os.getenv("SETTINGS_DB", "settings.db")
logger = logging.getLogger(__name__)

DEFAULT_SETTINGS = {
    "check_interval_minutes": 60,
    "auto_update_enabled": False,
    "cleanup_enabled": False,
    "excluded_containers": [
        "lighthouse-frontend",
        "lighthouse-backend",
    ],
    "notifications_enabled": False,
    "smtp_host": "",
    "smtp_port": 587,
    "smtp_username": "",
    "smtp_password": "",
    "smtp_from": "",
    "smtp_to": "",
    "smtp_use_tls": True,
    "dockerhub_username": "",
    "dockerhub_token": "",
    "ghcr_username": "",
    "ghcr_token": "",
    "webhook_token": "",
}

class SettingsManager:
    def __init__(self):
        self.settings = copy.deepcopy(DEFAULT_SETTINGS)
        self._ensure_db()
        self.load()

    def _ensure_db(self):
        try:
            db_dir = os.path.dirname(SETTINGS_DB)
            if db_dir:
                os.makedirs(db_dir, exist_ok=True)
            with sqlite3.connect(SETTINGS_DB) as conn:
                conn.execute(
                    "CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)"
                )
        except Exception as e:
            logger.error(f"Failed to initialize settings database: {e}")

    def _load_from_db(self):
        try:
            with sqlite3.connect(SETTINGS_DB) as conn:
                rows = conn.execute("SELECT key, value FROM settings").fetchall()
        except Exception as e:
            logger.error(f"Failed to read settings database: {e}")
            return {}

        data = {}
        for key, value in rows:
            try:
                data[key] = json.loads(value)
            except Exception:
                data[key] = value
        return data

    def _save_to_db(self):
        try:
            with sqlite3.connect(SETTINGS_DB) as conn:
                conn.executemany(
                    "INSERT INTO settings (key, value) VALUES (?, ?) "
                    "ON CONFLICT(key) DO UPDATE SET value=excluded.value",
                    [(key, json.dumps(value)) for key, value in self.settings.items()],
                )
        except Exception as e:
            logger.error(f"Failed to save settings database: {e}")

    def load(self):
        data = self._load_from_db()
        if data:
            self.settings.update(data)
            self._normalize()
            return

        self._normalize()
        self.save()

    def save(self):
        self._save_to_db()

    def get(self, key):
        return self.settings.get(key)
        
    def get_all(self):
        return self.settings

    def update(self, new_settings: dict):
        self.settings.update(new_settings)
        self._normalize()
        self.save()
        return self.settings

    def _normalize(self):
        """Ensure settings contain valid shapes and defaults."""
        # Ensure all default keys exist with their default values if missing
        for key, default_value in DEFAULT_SETTINGS.items():
            if key not in self.settings:
                self.settings[key] = copy.deepcopy(default_value)
        
        excluded = self.settings.get("excluded_containers")
        if not isinstance(excluded, list):
            excluded = []

        # Remove empty/duplicate names while preserving order.
        seen = set()
        cleaned = []
        for name in excluded:
            if not isinstance(name, str):
                continue
            trimmed = name.strip()
            if not trimmed or trimmed in seen:
                continue
            seen.add(trimmed)
            cleaned.append(trimmed)

        # If no value is present (e.g. brand new settings file), seed defaults.
        if "excluded_containers" not in self.settings and not cleaned:
            cleaned = DEFAULT_SETTINGS["excluded_containers"].copy()

        self.settings["excluded_containers"] = cleaned

        # Normalize booleans that might come as strings from the UI
        for boolean_key in ["notifications_enabled", "smtp_use_tls", "auto_update_enabled", "cleanup_enabled"]:
            value = self.settings.get(boolean_key)
            if isinstance(value, str):
                self.settings[boolean_key] = value.lower() in ["true", "1", "yes", "on"]
            elif value is None:
                self.settings[boolean_key] = DEFAULT_SETTINGS.get(boolean_key, False)

        # Ensure registry credential keys exist
        for key in ["dockerhub_username", "dockerhub_token", "ghcr_username", "ghcr_token"]:
            if key not in self.settings:
                self.settings[key] = ""

    def is_excluded(self, container_name: str) -> bool:
        excluded = self.settings.get("excluded_containers", [])
        return container_name in excluded

    def set_excluded(self, container_name: str, excluded: bool):
        """Add or remove a container name from the exclusion list."""
        current = self.settings.get("excluded_containers", [])
        if excluded:
            if container_name not in current:
                current.append(container_name)
        else:
            current = [name for name in current if name != container_name]

        self.settings["excluded_containers"] = current
        self.save()
        return self.settings

    def get_exclusions(self):
        return self.settings.get("excluded_containers", [])
