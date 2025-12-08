import base64
import json
import os
from datetime import datetime
from typing import Tuple

import yaml
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC


class SettingsBackup:
    """
    Handles encrypted export/import of settings (including credentials).
    Files are JSON or YAML with an encrypted payload and plaintext metadata.
    """

    ITERATIONS = 390000

    def __init__(self, settings_manager):
        self.settings = settings_manager

    def _derive_key(self, password: str, salt: bytes) -> bytes:
        if not password:
            raise ValueError("A password is required for backup encryption.")
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=self.ITERATIONS,
        )
        return base64.urlsafe_b64encode(kdf.derive(password.encode("utf-8")))

    def _encrypt_settings(self, password: str) -> Tuple[dict, bytes]:
        salt = os.urandom(16)
        key = self._derive_key(password, salt)
        fernet = Fernet(key)
        payload = json.dumps(self.settings.get_all(), indent=2).encode("utf-8")
        token = fernet.encrypt(payload)
        metadata = {
            "kind": "lighthouse-settings",
            "version": 1,
            "cipher": "fernet",
            "kdf": {"name": "pbkdf2-sha256", "iterations": self.ITERATIONS},
            "salt": base64.b64encode(salt).decode("utf-8"),
            "created_at": datetime.utcnow().isoformat() + "Z",
        }
        return metadata, token

    def _serialize(self, doc: dict, fmt: str) -> str:
        fmt = (fmt or "json").lower()
        if fmt == "yml":
            fmt = "yaml"
        if fmt not in {"json", "yaml"}:
            raise ValueError("Format must be 'json' or 'yaml'.")
        if fmt == "yaml":
            return yaml.safe_dump(doc, sort_keys=False)
        return json.dumps(doc, indent=2)

    def export_encrypted(self, password: str, fmt: str = "json") -> Tuple[str, str, str]:
        """
        Returns (content, media_type, filename).
        """
        metadata, token = self._encrypt_settings(password)
        doc = {**metadata, "format": fmt if fmt != "yml" else "yaml", "payload": token.decode("utf-8")}
        content = self._serialize(doc, fmt)
        ext = "yaml" if fmt in {"yaml", "yml"} else "json"
        filename = f"lighthouse-settings-backup-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}.{ext}"
        media_type = "application/x-yaml" if ext == "yaml" else "application/json"
        return content, media_type, filename

    def import_encrypted(self, content: str, password: str) -> dict:
        try:
            doc = yaml.safe_load(content)
        except Exception as e:
            raise ValueError(f"Invalid backup file: {e}")

        if not isinstance(doc, dict):
            raise ValueError("Backup content is invalid.")
        if doc.get("kind") != "lighthouse-settings":
            raise ValueError("Backup file type is not supported.")
        if doc.get("cipher") != "fernet":
            raise ValueError("Unsupported cipher.")

        try:
            salt = base64.b64decode(doc["salt"])
            token = doc["payload"].encode("utf-8")
        except Exception:
            raise ValueError("Backup file is missing required fields.")

        key = self._derive_key(password, salt)
        fernet = Fernet(key)
        try:
            decrypted = fernet.decrypt(token)
        except Exception as e:
            raise ValueError(f"Decryption failed: {e}")

        try:
            settings = json.loads(decrypted.decode("utf-8"))
        except Exception:
            settings = yaml.safe_load(decrypted.decode("utf-8"))

        if not isinstance(settings, dict):
            raise ValueError("Backup payload is invalid.")

        updated = self.settings.update(settings)
        return updated
