import io
import os
import secrets
from fastapi import FastAPI, HTTPException, Header, Security
from fastapi.security import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import docker
import smtplib
from pydantic import BaseModel
from typing import List, Optional
from services.history import HistoryService
from services.updater import UpdateService
from services.notifications import NotificationService
from services.cache import StatusCache
from services.settings import SettingsManager
from services.backup import SettingsBackup
from services.scheduler import SchedulerService

app = FastAPI(title="Light House API", description="Docker Watchtower-like Monitor")

# CORS Configuration
origins = [
    "http://localhost:5173",  # Vite default port
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Key Security
API_KEY = os.environ.get("API_KEY")
if not API_KEY:
    print("WARNING: API_KEY environment variable not set. Generating a random key.")
    API_KEY = secrets.token_hex(32)
    print(f"Generated API_KEY: {API_KEY}")

api_key_header = APIKeyHeader(name="X-API-Key")

async def get_api_key(api_key: str = Security(api_key_header)):
    if api_key == API_KEY:
        return api_key
    else:
        raise HTTPException(status_code=403, detail="Could not validate credentials")

# Docker Client
try:
    client = docker.from_env()
except Exception as e:
    print(f"Error connecting to Docker: {e}")
    client = None


# Pydantic Models for API Data Structures

class ContainerInfo(BaseModel):
    """Represents information about a Docker container."""
    id: str
    short_id: str
    name: str
    image: str
    status: str
    state: str
    created: str
    excluded: bool = False
    update_status: Optional[dict] = None


class ContainerExclusion(BaseModel):
    """Represents the exclusion status of a container."""
    excluded: bool

class RegistryCredentials(BaseModel):
    """Represents credentials for a container registry."""
    provider: str
    username: str
    token: str

class SmtpCredentials(BaseModel):
    """Represents credentials for an SMTP server."""
    host: str
    port: int
    username: Optional[str] = None
    password: Optional[str] = None
    use_tls: bool = True

class SettingsExport(BaseModel):
    """Represents the payload for exporting settings."""
    password: str
    format: Optional[str] = "json"

class SettingsImport(BaseModel):
    """Represents the payload for importing settings."""
    password: str
    content: str

class TestNotification(BaseModel):
    """Represents the payload for sending a test notification."""
    message: str | None = None

class WebhookUpdateRequest(BaseModel):
    """Represents the payload for a webhook update request."""
    container_id: Optional[str] = None
    container_name: Optional[str] = None
    update_all: bool = False


@app.get("/")
def read_root():
    """Returns the status of the backend."""
    return {"status": "ok", "message": "Light House Backend Running"}


def get_container_or_404(container_id: str):
    """
    Retrieves a Docker container by its ID or raises a 404 exception if not found.

    Args:
        container_id: The ID of the container to retrieve.

    Returns:
        The Docker container object.
    """
    if not client:
        raise HTTPException(status_code=500, detail="Docker client not connected")
    try:
        return client.containers.get(container_id)
    except docker.errors.NotFound:
        raise HTTPException(status_code=404, detail="Container not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def get_webhook_token() -> str:
    """
    Retrieves the webhook token from environment variables or settings.

    Returns:
        The webhook token.
    """
    token = os.environ.get("WEBHOOK_TOKEN")
    if token:
        return token
    return settings_manager.get("webhook_token") or ""


def extract_webhook_token(x_webhook_token: Optional[str], authorization: Optional[str]) -> str:
    """
    Extracts the webhook token from the request headers.

    Args:
        x_webhook_token: The value of the X-Webhook-Token header.
        authorization: The value of the Authorization header.

    Returns:
        The extracted webhook token.
    """
    if x_webhook_token:
        return x_webhook_token.strip()
    if authorization and authorization.lower().startswith("bearer "):
        return authorization.split(" ", 1)[1].strip()
    return ""


@app.get("/api/containers", response_model=List[ContainerInfo])
def list_containers(api_key: str = Security(get_api_key)):
    """
    Lists all Docker containers.

    Returns:
        A list of ContainerInfo objects.
    """
    if not client:
        raise HTTPException(status_code=500, detail="Docker client not connected")

    containers = []
    try:
        # List all containers (running and stopped)
        for c in client.containers.list(all=True):
            containers.append(ContainerInfo(
                id=c.id,
                short_id=c.short_id,
                name=c.name,
                image=str(c.image.tags[0]) if c.image.tags else c.image.id,
                status=c.status,
                state=c.attrs['State']['Status'],
                created=c.attrs.get('Created') or c.image.attrs.get('Created'),
                excluded=settings_manager.is_excluded(c.name),
                update_status=status_cache.get(c.name)
            ))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return containers


status_cache = StatusCache()
settings_manager = SettingsManager()
history_service = HistoryService()
notifier = NotificationService(settings_manager)
updater = UpdateService(settings_manager)
backup_service = SettingsBackup(settings_manager)


@app.post("/api/containers/{container_id}/check-update")
def check_update(container_id: str, api_key: str = Security(get_api_key)):
    """
    Checks for updates for a specific container.

    Args:
        container_id: The ID of the container to check.

    Returns:
        A dictionary with the update status.
    """
    container = get_container_or_404(container_id)
    if settings_manager.is_excluded(container.name):
        skipped = {"update_available": False, "skipped": True, "reason": "Container excluded from updates"}
        status_cache.update(container.name, skipped)
        history_service.log_event(
            action="check_update",
            status="skipped",
            message=skipped["reason"],
            container=container.name,
            trigger="manual",
        )
        return skipped

    result = updater.check_for_update(container_id)
    if result.get("error"):
        history_service.log_event(
            action="check_update",
            status="error",
            message=result.get("error"),
            container=container.name,
            trigger="manual",
        )
    else:
        status_cache.update(container.name, result)
        history_service.log_event(
            action="check_update",
            status="update_available" if result.get("update_available") else "up_to_date",
            message="Update available" if result.get("update_available") else "No updates found",
            container=container.name,
            trigger="manual",
            details={
                "image": result.get("image"),
                "latest_id": result.get("latest_id"),
                "current_id": result.get("current_id"),
            },
        )
    return result


# Pass updater to scheduler
scheduler = SchedulerService(settings_manager, updater, status_cache, notifier, history_service)


@app.on_event("startup")
def start_scheduler():
    """Starts the scheduler service on application startup."""
    scheduler.start()


@app.get("/api/settings")
def get_settings(api_key: str = Security(get_api_key)):
    """
    Retrieves the application settings.

    Returns:
        A dictionary with the application settings.
    """
    return settings_manager.get_all()


@app.get("/api/schedule")
def get_schedule(api_key: str = Security(get_api_key)):
    """
    Retrieves the schedule information.

    Returns:
        A dictionary with the schedule information.
    """
    return scheduler.get_schedule_info()


@app.get("/api/history")
def get_history(action: str = None, status: str = None, limit: int = 100, api_key: str = Security(get_api_key)):
    """
    Retrieves the history of actions.

    Args:
        action: The action to filter by.
        status: The status to filter by.
        limit: The maximum number of history entries to return.

    Returns:
        A list of history entries.
    """
    return history_service.get_history(action=action, status=status, limit=limit)


@app.delete("/api/history")
def clear_history(api_key: str = Security(get_api_key)):
    """
    Clears the history of actions.

    Returns:
        A dictionary indicating that the history was cleared.
    """
    history_service.clear()
    return {"cleared": True}


@app.post("/api/settings")
def update_settings(new_settings: dict, api_key: str = Security(get_api_key)):
    """
    Updates the application settings.

    Args:
        new_settings: A dictionary with the new settings.

    Returns:
        A dictionary with the updated settings.
    """
    updated = settings_manager.update(new_settings)
    scheduler.update_settings()
    return updated


@app.post("/api/registries/validate")
def validate_registry(creds: RegistryCredentials, api_key: str = Security(get_api_key)):
    """
    Validates the credentials for a container registry.

    Args:
        creds: A RegistryCredentials object with the registry credentials.

    Returns:
        A dictionary indicating that the credentials are valid.
    """
    if not client:
        raise HTTPException(status_code=500, detail="Docker client not connected")

    provider = creds.provider.lower()
    registry_url = "https://index.docker.io/v1/" if provider == "dockerhub" else "ghcr.io" if provider == "ghcr" else None
    if provider not in {"dockerhub", "ghcr"} or not registry_url:
        raise HTTPException(status_code=400, detail="Unsupported registry provider")

    try:
        client.login(username=creds.username, password=creds.token, registry=registry_url)
        return {"valid": True, "message": "Credentials are valid."}
    except docker.errors.APIError as e:
        raise HTTPException(status_code=400, detail=f"Registry authentication failed: {e.explanation or str(e)}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Registry authentication failed: {str(e)}")


@app.post("/api/notifications/validate")
def validate_smtp(creds: SmtpCredentials, api_key: str = Security(get_api_key)):
    """
    Validates the credentials for an SMTP server.

    Args:
        creds: An SmtpCredentials object with the SMTP credentials.

    Returns:
        A dictionary indicating that the SMTP connection was successful.
    """
    if not creds.host or not creds.port:
        raise HTTPException(status_code=400, detail="SMTP host and port are required")

    try:
        server = smtplib.SMTP(creds.host, creds.port, timeout=10)
        server.ehlo()
        if creds.use_tls:
            server.starttls()
            server.ehlo()
        if creds.username:
            server.login(creds.username, creds.password or "")
        server.noop()
        server.quit()
        return {"valid": True, "message": "SMTP connection successful."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"SMTP validation failed: {str(e)}")

@app.post("/api/notifications/test")
def send_test_notification(payload: TestNotification = None, api_key: str = Security(get_api_key)):
    """
    Sends a test notification.

    Args:
        payload: A TestNotification object with the message to send.

    Returns:
        A dictionary indicating that the test notification was sent successfully.
    """
    try:
        msg = payload.message if payload else None
        return notifier.send_test_notification(msg or "Test email from Lighthouse.")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send test email: {e}")


@app.post("/api/settings/export")
def export_settings(payload: SettingsExport, api_key: str = Security(get_api_key)):
    """
    Exports the application settings.

    Args:
        payload: A SettingsExport object with the password and format.

    Returns:
        A StreamingResponse with the encrypted settings file.
    """
    try:
        content, media_type, filename = backup_service.export_encrypted(payload.password, payload.format)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    stream = io.BytesIO(content.encode("utf-8"))
    headers = {"Content-Disposition": f'attachment; filename=\"{filename}\"'}
    return StreamingResponse(stream, media_type=media_type, headers=headers)


@app.post("/api/settings/import")
def import_settings(payload: SettingsImport, api_key: str = Security(get_api_key)):
    """
    Imports the application settings.

    Args:
        payload: A SettingsImport object with the encrypted settings content and password.

    Returns:
        A dictionary indicating that the settings were restored.
    """
    try:
        restored = backup_service.import_encrypted(payload.content, payload.password)
        scheduler.update_settings()
        return {"restored": True, "settings": restored}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to import settings: {e}")


@app.post("/api/containers/{container_id}/update")
def perform_update(container_id: str, api_key: str = Security(get_api_key)):
    """
    Updates a specific container.

    Args:
        container_id: The ID of the container to update.

    Returns:
        A dictionary with the update result.
    """
    container = get_container_or_404(container_id)
    if settings_manager.is_excluded(container.name):
        raise HTTPException(status_code=400, detail="Updates are disabled for this container")

    result = updater.update_container(container_id)
    if not result.get("success"):
        try:
            notifier.send_update_notification(container.name, {**result, "success": False, "message": result.get("error", "Update failed")})
        except Exception:
            pass
        history_service.log_event(
            action="update",
            status="error",
            message=result.get("error", "Update failed"),
            container=container.name,
            trigger="manual",
        )
        raise HTTPException(status_code=500, detail=result.get("error"))
    notifier.send_update_notification(container.name, result)
    history_service.log_event(
        action="update",
        status="updated",
        message=result.get("message", "Updated successfully"),
        container=container.name,
        trigger="manual",
        details={
            "new_id": result.get("new_id"),
            "image": container.attrs['Config'].get('Image'),
        },
    )
    status_cache.update(container.name, {
        "update_available": False,
        "latest_id": result.get("new_id"),
    })
    return result


@app.post("/api/containers/{container_id}/exclusion")
def set_container_exclusion(container_id: str, payload: ContainerExclusion, api_key: str = Security(get_api_key)):
    """
    Sets the exclusion status for a specific container.

    Args:
        container_id: The ID of the container to set the exclusion status for.
        payload: A ContainerExclusion object with the exclusion status.

    Returns:
        A dictionary with the updated exclusion status.
    """
    container = get_container_or_404(container_id)
    settings_manager.set_excluded(container.name, payload.excluded)
    return {
        "id": container.id,
        "name": container.name,
        "excluded": settings_manager.is_excluded(container.name),
        "excluded_containers": settings_manager.get_exclusions(),
    }


def _process_container_update(c):
    name = c.name
    if settings_manager.is_excluded(name):
        reason = "Container excluded from updates"
        status_cache.update(name, {"update_available": False, "skipped": True, "reason": reason})
        history_service.log_event("bulk_update", "skipped", reason, name, "manual")
        return {"id": c.id, "name": name, "status": "skipped", "reason": reason}

    try:
        check_result = updater.check_for_update(c.id)
        if error := check_result.get("error"):
            try:
                notifier.send_update_notification(name, {**check_result, "success": False, "message": error})
            except Exception:
                pass
            status_cache.update(name, check_result)
            history_service.log_event("bulk_update", "error", error, name, "manual")
            return {"id": c.id, "name": name, "status": "error", "message": error}

        status_cache.update(name, check_result)

        if not check_result.get("update_available"):
            history_service.log_event("bulk_update", "up_to_date", "No updates found", name, "manual", details={"image": check_result.get("image")})
            return {"id": c.id, "name": name, "status": "up_to_date", "message": "No updates found"}

        update_result = updater.update_container(c.id)
        if update_result.get("success"):
            notifier.send_update_notification(name, update_result)
            status_cache.update(name, {"update_available": False, "current_id": check_result.get("latest_id"), "latest_id": check_result.get("latest_id")})
            history_service.log_event("bulk_update", "updated", update_result.get("message", "Updated successfully"), name, "manual", details={"image": check_result.get("image"), "new_id": update_result.get("new_id")})
            return {"id": c.id, "name": name, "status": "updated", "message": update_result.get("message", "Updated successfully")}
        else:
            error = update_result.get("error", "Update failed")
            try:
                notifier.send_update_notification(name, {**update_result, "success": False, "message": error})
            except Exception:
                pass
            history_service.log_event("bulk_update", "error", error, name, "manual", details={"image": check_result.get("image")})
            return {"id": c.id, "name": name, "status": "error", "message": error}

    except Exception as e:
        history_service.log_event("bulk_update", "error", str(e), name, "manual")
        return {"id": c.id, "name": name, "status": "error", "message": str(e)}


@app.post("/api/containers/update-all")
def update_all_containers(api_key: str = Security(get_api_key)):
    """
    Updates all containers.

    Returns:
        A dictionary with the results of the update.
    """
    if not client:
        raise HTTPException(status_code=500, detail="Docker client not connected")

    results = [_process_container_update(c) for c in client.containers.list(all=True)]
    summary = {
        "updated": len([r for r in results if r["status"] == "updated"]),
        "up_to_date": len([r for r in results if r["status"] == "up_to_date"]),
        "skipped": len([r for r in results if r["status"] == "skipped"]),
        "errors": len([r for r in results if r["status"] == "error"]),
        "total": len(results),
    }
    return {"results": results, "summary": summary}


@app.post("/api/webhook/update")
def webhook_update(
    payload: WebhookUpdateRequest,
    x_webhook_token: Optional[str] = Header(default=None, alias="X-Webhook-Token"),
    authorization: Optional[str] = Header(default=None),
):
    """
    Updates containers via a webhook.

    Args:
        payload: A WebhookUpdateRequest object with the container to update.
        x_webhook_token: The webhook token from the X-Webhook-Token header.
        authorization: The webhook token from the Authorization header.

    Returns:
        A dictionary with the results of the update.
    """
    configured_token = get_webhook_token()
    if not configured_token:
        raise HTTPException(status_code=400, detail="Webhook token not configured")

    provided_token = extract_webhook_token(x_webhook_token, authorization)
    if not provided_token or provided_token != configured_token:
        raise HTTPException(status_code=401, detail="Invalid webhook token")

    if payload.update_all:
        return update_all_containers()
    if payload.container_id:
        return perform_update(payload.container_id)
    if payload.container_name:
        return perform_update(payload.container_name)

    raise HTTPException(status_code=400, detail="Provide container_id, container_name, or update_all=true")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
