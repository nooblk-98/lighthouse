import json
import os
import logging
import copy

SETTINGS_FILE = "settings.json"
logger = logging.getLogger(__name__)

DEFAULT_SETTINGS = {
    "check_interval_minutes": 60,
    "auto_update_enabled": False,
    "cleanup_enabled": False,
    "excluded_containers": [
        "lighthouse-frontend",
        "lighthouse-backend",
    ],
}

class SettingsManager:
    def __init__(self):
        self.settings = copy.deepcopy(DEFAULT_SETTINGS)
        self.load()

    def load(self):
        if os.path.exists(SETTINGS_FILE):
            try:
                with open(SETTINGS_FILE, "r") as f:
                    data = json.load(f)
                    self.settings.update(data)
                    self._normalize()
            except Exception as e:
                logger.error(f"Failed to load settings: {e}")
        else:
            self.save()

    def save(self):
        try:
            with open(SETTINGS_FILE, "w") as f:
                json.dump(self.settings, f, indent=4)
        except Exception as e:
            logger.error(f"Failed to save settings: {e}")

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
