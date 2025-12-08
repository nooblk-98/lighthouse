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

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Light House Backend Running"}

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
                created=c.attrs['Created']
            ))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    return containers

from services.updater import UpdateService
updater = UpdateService()

@app.post("/api/containers/{container_id}/check-update")
def check_update(container_id: str):
    result = updater.check_for_update(container_id)
    if "error" in result:
        # If error is critical, maybe raise HTTPException?
        # But we return the error in JSON for UI to show
        pass
    return result

@app.post("/api/containers/{container_id}/update")
def perform_update(container_id: str):
    result = updater.update_container(container_id)
    if not result.get("success"):
         raise HTTPException(status_code=500, detail=result.get("error"))
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
