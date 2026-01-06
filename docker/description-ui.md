# Lighthouse UI

Modern web interface for managing and monitoring Docker containers.

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
			- ./data:/app/data
		environment:
			- SETTINGS_DB=/app/data/settings.db
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
- Container dashboard and controls
- Live status and metrics
- Settings management

## Docs
Full project README: https://github.com/nooblk-98/lighthouse
