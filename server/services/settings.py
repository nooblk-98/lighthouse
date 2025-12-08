import json
import os
import logging

SETTINGS_FILE = "settings.json"
logger = logging.getLogger(__name__)

DEFAULT_SETTINGS = {
    "check_interval_minutes": 60,
    "auto_update_enabled": False,
    "cleanup_enabled": False
}

class SettingsManager:
    def __init__(self):
        self.settings = DEFAULT_SETTINGS.copy()
        self.load()

    def load(self):
        if os.path.exists(SETTINGS_FILE):
            try:
                with open(SETTINGS_FILE, "r") as f:
                    data = json.load(f)
                    self.settings.update(data)
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
        self.save()
        return self.settings
