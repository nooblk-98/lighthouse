import io
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import docker
import smtplib
from pydantic import BaseModel
from typing import List, Optional
from services.history import HistoryService

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

# Docker Client
try:
    client = docker.from_env()
except Exception as e:
    print(f"Error connecting to Docker: {e}")
    client = None


class ContainerInfo(BaseModel):
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
    excluded: bool

class RegistryCredentials(BaseModel):
    provider: str
    username: str
    token: str

class SmtpCredentials(BaseModel):
    host: str
    port: int
    username: Optional[str] = None
    password: Optional[str] = None
    use_tls: bool = True

class SettingsExport(BaseModel):
    password: str
    format: Optional[str] = "json"

class SettingsImport(BaseModel):
    password: str
    content: str


@app.get("/")
def read_root():
    return {"status": "ok", "message": "Light House Backend Running"}


def get_container_or_404(container_id: str):
    if not client:
        raise HTTPException(status_code=500, detail="Docker client not connected")
    try:
        return client.containers.get(container_id)
    except docker.errors.NotFound:
        raise HTTPException(status_code=404, detail="Container not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/containers", response_model=List[ContainerInfo])
def list_containers():
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


from services.updater import UpdateService
from services.notifications import NotificationService

from services.cache import StatusCache
status_cache = StatusCache()

from services.settings import SettingsManager
settings_manager = SettingsManager()
history_service = HistoryService()

notifier = NotificationService(settings_manager)
updater = UpdateService(settings_manager)
from services.backup import SettingsBackup
backup_service = SettingsBackup(settings_manager)


@app.post("/api/containers/{container_id}/check-update")
def check_update(container_id: str):
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


from services.scheduler import SchedulerService

# Pass updater to scheduler
scheduler = SchedulerService(settings_manager, updater, status_cache, notifier, history_service)


@app.on_event("startup")
def start_scheduler():
    scheduler.start()


@app.get("/api/settings")
def get_settings():
    return settings_manager.get_all()


@app.get("/api/schedule")
def get_schedule():
    return scheduler.get_schedule_info()


@app.get("/api/history")
def get_history(action: str = None, status: str = None, limit: int = 100):
    return history_service.get_history(action=action, status=status, limit=limit)


@app.delete("/api/history")
def clear_history():
    history_service.clear()
    return {"cleared": True}


@app.post("/api/settings")
def update_settings(new_settings: dict):
    updated = settings_manager.update(new_settings)
    scheduler.update_settings()
    return updated


@app.post("/api/registries/validate")
def validate_registry(creds: RegistryCredentials):
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
def validate_smtp(creds: SmtpCredentials):
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


@app.post("/api/settings/export")
def export_settings(payload: SettingsExport):
    try:
        content, media_type, filename = backup_service.export_encrypted(payload.password, payload.format)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    stream = io.BytesIO(content.encode("utf-8"))
    headers = {"Content-Disposition": f'attachment; filename=\"{filename}\"'}
    return StreamingResponse(stream, media_type=media_type, headers=headers)


@app.post("/api/settings/import")
def import_settings(payload: SettingsImport):
    try:
        restored = backup_service.import_encrypted(payload.content, payload.password)
        scheduler.update_settings()
        return {"restored": True, "settings": restored}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to import settings: {e}")


@app.post("/api/containers/{container_id}/update")
def perform_update(container_id: str):
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
def set_container_exclusion(container_id: str, payload: ContainerExclusion):
    container = get_container_or_404(container_id)
    settings_manager.set_excluded(container.name, payload.excluded)
    return {
        "id": container.id,
        "name": container.name,
        "excluded": settings_manager.is_excluded(container.name),
        "excluded_containers": settings_manager.get_exclusions(),
    }


@app.post("/api/containers/update-all")
def update_all_containers():
    if not client:
        raise HTTPException(status_code=500, detail="Docker client not connected")

    results = []
    for c in client.containers.list(all=True):
        name = c.name
        if settings_manager.is_excluded(name):
            reason = "Container excluded from updates"
            results.append({
                "id": c.id,
                "name": name,
                "status": "skipped",
                "reason": reason,
            })
            status_cache.update(name, {"update_available": False, "skipped": True, "reason": reason})
            history_service.log_event(
                action="bulk_update",
                status="skipped",
                message=reason,
                container=name,
                trigger="manual",
            )
            continue

        try:
            check_result = updater.check_for_update(c.id)
            if check_result.get("error"):
                results.append({
                    "id": c.id,
                    "name": name,
                    "status": "error",
                    "message": check_result.get("error"),
                })
                status_cache.update(name, check_result)
                history_service.log_event(
                    action="bulk_update",
                    status="error",
                    message=check_result.get("error"),
                    container=name,
                    trigger="manual",
                )
                continue

            status_cache.update(name, check_result)

            if not check_result.get("update_available"):
                results.append({
                    "id": c.id,
                    "name": name,
                    "status": "up_to_date",
                    "message": "No updates found",
                })
                status_cache.update(name, check_result)
                history_service.log_event(
                    action="bulk_update",
                    status="up_to_date",
                    message="No updates found",
                    container=name,
                    trigger="manual",
                    details={"image": check_result.get("image")},
                )
                continue

            update_result = updater.update_container(c.id)
            if update_result.get("success"):
                results.append({
                    "id": c.id,
                    "name": name,
                    "status": "updated",
                    "message": update_result.get("message", "Updated successfully"),
                })
                notifier.send_update_notification(name, update_result)
                status_cache.update(name, {
                    "update_available": False,
                    "current_id": check_result.get("latest_id"),
                    "latest_id": check_result.get("latest_id"),
                })
                history_service.log_event(
                    action="bulk_update",
                    status="updated",
                    message=update_result.get("message", "Updated successfully"),
                    container=name,
                    trigger="manual",
                    details={"image": check_result.get("image"), "new_id": update_result.get("new_id")},
                )
            else:
                try:
                    notifier.send_update_notification(name, {**update_result, "success": False, "message": update_result.get("error", "Update failed")})
                except Exception:
                    pass
                results.append({
                    "id": c.id,
                    "name": name,
                    "status": "error",
                    "message": update_result.get("error", "Update failed"),
                })
                history_service.log_event(
                    action="bulk_update",
                    status="error",
                    message=update_result.get("error", "Update failed"),
                    container=name,
                    trigger="manual",
                    details={"image": check_result.get("image")},
                )
        except Exception as e:
            results.append({
                "id": c.id,
                "name": name,
                "status": "error",
                "message": str(e),
            })
            history_service.log_event(
                action="bulk_update",
                status="error",
                message=str(e),
                container=name,
                trigger="manual",
            )

    summary = {
        "updated": len([r for r in results if r["status"] == "updated"]),
        "up_to_date": len([r for r in results if r["status"] == "up_to_date"]),
        "skipped": len([r for r in results if r["status"] == "skipped"]),
        "errors": len([r for r in results if r["status"] == "error"]),
        "total": len(results),
    }

    return {"results": results, "summary": summary}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
