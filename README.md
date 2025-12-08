<div align="center">
  <img src="./images/full-logo.png" width="360" alt="Lighthouse logo" />

  # Lighthouse

  A process for automating Docker container base image updates (alternative to watchtower).

  <div>
    <a href="https://hub.docker.com/r/lahiru98s/lighthouse-ui"><img src="https://img.shields.io/docker/pulls/lahiru98s/lighthouse-ui.svg" alt="Docker UI pulls" /></a>
    <a href="https://github.com/nooblk-98/lighthouse/releases"><img src="https://img.shields.io/github/v/release/nooblk-98/lighthouse?logo=github" alt="Latest release" /></a>
    <a href="https://github.com/nooblk-98/lighthouse/actions/workflows/docker-build-push.yml"><img src="https://github.com/nooblk-98/lighthouse/actions/workflows/docker-build-push.yml/badge.svg" alt="CI" /></a>
    <a href="https://github.com/nooblk-98/lighthouse/blob/main/LICENSE"><img src="https://img.shields.io/github/license/nooblk-98/lighthouse.svg" alt="License" /></a>
  </div>
</div>

---

## Features

- **Real-time Container Monitoring** - View live container stats and status
- **Container Management** - Start, stop, restart, and remove containers
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

## License

This project is released under the **Light House Source-Available License v1.0** (see `LICENSE`). You’re welcome to view, fork, modify, and contribute. Commercial redistribution, rebranding, or offering it as a hosted service without permission is not allowed.
