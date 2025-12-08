# Lighthouse Server

Backend API for container management and monitoring.

## Quick start
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

## Features
- Container lifecycle operations
- Metrics and status API
- Configurable settings

## Docs
Full project README: https://github.com/nooblk-98/lighthouse
