# Lighthouse Server

Backend API for container management and monitoring.

## Quick start
- Pull: `docker pull lahiru98s/lighthouse-sv:latest`
- Run (with Docker socket mount): `docker run --name lighthouse-backend -p 8000:8000 -v /var/run/docker.sock:/var/run/docker.sock lahiru98s/lighthouse-sv:latest`

## Features
- Container lifecycle operations
- Metrics and status API
- Configurable settings

## Docs
Full project README: https://github.com/nooblk-98/lighthouse
