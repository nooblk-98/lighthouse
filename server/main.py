from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import docker
from pydantic import BaseModel
from typing import List, Optional

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
                update_status=status_cache.get(c.id)
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

notifier = NotificationService(settings_manager)
updater = UpdateService()


@app.post("/api/containers/{container_id}/check-update")
def check_update(container_id: str):
    container = get_container_or_404(container_id)
    if settings_manager.is_excluded(container.name):
        skipped = {"update_available": False, "skipped": True, "reason": "Container excluded from updates"}
        status_cache.update(container_id, skipped)
        return skipped

    result = updater.check_for_update(container_id)
    if "error" not in result:
        status_cache.update(container_id, result)
    return result


from services.scheduler import SchedulerService

# Pass updater to scheduler
scheduler = SchedulerService(settings_manager, updater, status_cache, notifier)


@app.on_event("startup")
def start_scheduler():
    scheduler.start()


@app.get("/api/settings")
def get_settings():
    return settings_manager.get_all()


@app.get("/api/schedule")
def get_schedule():
    return scheduler.get_schedule_info()


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


@app.post("/api/containers/{container_id}/update")
def perform_update(container_id: str):
    container = get_container_or_404(container_id)
    if settings_manager.is_excluded(container.name):
        raise HTTPException(status_code=400, detail="Updates are disabled for this container")

    result = updater.update_container(container_id)
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error"))
    notifier.send_update_notification(container.name, result)
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
            status_cache.update(c.id, {"update_available": False, "skipped": True, "reason": reason})
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
                continue

            status_cache.update(c.id, check_result)

            if not check_result.get("update_available"):
                results.append({
                    "id": c.id,
                    "name": name,
                    "status": "up_to_date",
                    "message": "No updates found",
                })
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
                status_cache.update(c.id, {
                    "update_available": False,
                    "current_id": check_result.get("latest_id"),
                    "latest_id": check_result.get("latest_id"),
                })
            else:
                results.append({
                    "id": c.id,
                    "name": name,
                    "status": "error",
                    "message": update_result.get("error", "Update failed"),
                })
        except Exception as e:
            results.append({
                "id": c.id,
                "name": name,
                "status": "error",
                "message": str(e),
            })

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
