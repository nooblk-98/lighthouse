<div align="center">
  <img src="./images/full-logo.png" width="360" alt="Lighthouse logo" />

  # Lighthouse

  A process for automating Docker container base image updates (alternative to watchtower).

  <div>
    <a href="https://hub.docker.com/r/lahiru98s/lighthouse-ui"><img src="https://img.shields.io/docker/pulls/lahiru98s/lighthouse-ui.svg" alt="Docker UI pulls" /></a>
    <a href="https://github.com/nooblk-98/lighthouse/releases"><img src="https://img.shields.io/github/v/release/nooblk-98/lighthouse?logo=github" alt="Latest release" /></a>
    <a href="https://github.com/nooblk-98/lighthouse/actions/workflows/docker-build-push.yml"><img src="https://github.com/nooblk-98/lighthouse/actions/workflows/docker-build-push.yml/badge.svg" alt="CI" /></a>
     <a href="https://creativecommons.org/licenses/by-nc/2.0/">
    <img src="https://img.shields.io/badge/License-CC%20BY--NC%202.0-blue.svg" alt="License: CC BY-NC 2.0" />
  </div>
</div>

---

## Features

- **Real-time Container Monitoring** - View live container stats and status
- **Manual & Auto Updates** - Check/update containers and skip exclusions
- **Email Notifications** - Optional SMTP alerts after updates
- **Multi-architecture Support** - `linux/amd64`, `linux/arm64`, `linux/arm/v7`
- **Modern Web UI** - React + Tailwind
- **RESTful API** - Python backend
- **Docker Compose Ready** - Quick setup with docker-compose

## Quick Start

### Prerequisites
- Docker & Docker Compose (v3.8+)
- Port 8066 (frontend) and 8000 (backend) available

### Installation

Run using pre-built images
   ```bash
   docker-compose -f docker-compose.live.yml up -d
   ```


## Docker Compose (pre-built images)

Use `docker-compose.live.yml` to run the published images without building:

```yaml
version: '3.8'

services:
  backend:
    image: lahiru98s/lighthouse-sv:latest
    container_name: lighthouse-backend
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./settings.json:/app/settings.json
    restart: always
    networks:
      - lighthouse-net

  frontend:
    image: lahiru98s/lighthouse-ui:latest
    container_name: lighthouse-frontend
    ports:
      - "8066:80"
    depends_on:
      - backend
    restart: always
    networks:
      - lighthouse-net

networks:
  lighthouse-net:
```

## Using Pre-built Images

Instead of building locally, pull the published images:

```bash
# Docker Hub
docker pull lahiru98s/lighthouse-ui:latest
docker pull lahiru98s/lighthouse-sv:latest

# GitHub Container Registry
docker pull ghcr.io/nooblk-98/lighthouse-ui:latest
docker pull ghcr.io/nooblk-98/lighthouse-sv:latest
```

Run with compose:
```bash
docker-compose -f docker-compose.live.yml up -d
```

Dev with compose:
```bash
docker compose build --no-cache && docker compose up
```

## UI Preview

<div align="center">
  <img src="./images/ui/ui_1.png" alt="Lighthouse UI preview 1" width="800" />
  <br/><br/>
  <img src="./images/ui/ui_2.png" alt="Lighthouse UI preview 2" width="800" />
</div>

## Development

### Run locally without Docker

**Backend**
```bash
cd server
pip install -r requirements.txt
python main.py
```

**Frontend**
```bash
cd client
npm install
npm run dev
```

### Build images locally
```bash
docker-compose build
```

### View logs
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```
## TODO / Ideas
- Create login page for UI
- ~~Support custom registry credentials~~
- Improve scheduler UI: show detailed history and allow pause/resume.
- Add image cleanup after updates (configurable retention).
