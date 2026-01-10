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
- Docker & Docker Compose
- Ports 8066 (frontend) and 8000 (backend) available

### Installation
To get started with Lighthouse, run the following command:
```bash
docker compose -f docker-compose.production.yml up -d
```

This will pull the latest pre-built images from Docker Hub and start the application in detached mode. Once the containers are running, you can access the Lighthouse UI at `http://localhost:8066`.


## Security

The Lighthouse API is protected by API key authentication. To access the API, you must provide a valid API key in the `X-API-Key` header of your requests.

By default, a random API key is generated when the application starts. You can set your own API key by setting the `API_KEY` environment variable in the `docker-compose.production.yml` file.

## Development

To run Lighthouse in a development environment, you can use the `docker-compose.dev.yml` file. This will build the images from the local source code and start the containers with hot-reloading enabled.

```bash
docker compose -f docker-compose.dev.yml up --build
```

### Running Locally

You can also run the frontend and backend services locally without Docker.

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

## Contributing

We welcome contributions to Lighthouse! Please see the `DEVELOPER.md` file for more information on how to contribute.

## TODO / Ideas
- Create login page for UI
- ~~Support custom registry credentials~~
- Improve scheduler UI: show detailed history and allow pause/resume.
- Add image cleanup after updates (configurable retention).
