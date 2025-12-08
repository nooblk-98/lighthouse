<div align="center">
  <img src="./images/full-logo.png" width="450" />
  
  # Lighthouse
  
  A process for automating Docker container base image updates ( alternative to watchtower ).
<br/><br/>

[![CI](https://github.com/nooblk-98/lighthouse/actions/workflows/ci.yml/badge.svg)](https://github.com/nooblk-98/lighthouse/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/nooblk-98/lighthouse/branch/main/graph/badge.svg)](https://codecov.io/gh/nooblk-98/lighthouse)
[![latest version](https://img.shields.io/github/v/tag/nooblk-98/lighthouse?label=release)](https://github.com/nooblk-98/lighthouse/releases)
[![MIT License](https://img.shields.io/github/license/nooblk-98/lighthouse.svg)](https://github.com/nooblk-98/lighthouse/blob/main/LICENSE)
[![All Contributors](https://img.shields.io/github/all-contributors/nooblk-98/lighthouse)](#contributors)
[![Pulls from DockerHub](https://img.shields.io/docker/pulls/lahiru98s/lighthouse-ui.svg)](https://hub.docker.com/r/lahiru98s/lighthouse-ui)
[![Pulls from DockerHub](https://img.shields.io/docker/pulls/lahiru98s/lighthouse-sv.svg)](https://hub.docker.com/r/lahiru98s/lighthouse-sv)

</div>

## 📋 Features

- **Real-time Container Monitoring** - View live container stats and status
- **Container Management** - Start, stop, restart, and remove containers
- **Multi-architecture Support** - Run on `linux/amd64`, `linux/arm64`, and `linux/arm/v7`
- **Modern Web UI** - Built with React and Tailwind CSS
- **RESTful API** - Full-featured Python backend for automation
- **Settings Management** - Persistent configuration storage
- **Docker Compose Ready** - Quick setup with docker-compose

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose (v3.8+)
- Port 80 (frontend) and 8000 (backend) available

### Installation

1. **Clone the repository**
	 ```bash
	 git clone https://github.com/nooblk-98/lighthouse.git
	 cd lighthouse
	 ```

2. **Run using pre-built images**
	 ```bash
	 docker-compose -f docker-compose.live.yml up -d
	 ```

3. **Access the application**
	 - Frontend: `http://localhost:8066`
	 - Backend API: reachable internally at `http://backend:8000` (not exposed externally)

## 🐳 Docker Compose (pre-built images)

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

### Services

**Backend Service**
- Python API for container control
- Internal only (no host port exposed); reachable as `http://backend:8000` from frontend
- Mounts Docker socket and loads `settings.json`

**Frontend Service**
- React + Nginx UI
- Exposed on host `http://localhost:8066`
- Communicates with backend over the internal network

## 📦 Using Pre-built Images

Instead of building locally, you can use pre-built images from Docker Hub or GitHub Container Registry:

### From Docker Hub
```bash
docker pull lahiru98s/lighthouse-ui:latest
docker pull lahiru98s/lighthouse-sv:latest
```

### From GitHub Container Registry
```bash
docker pull ghcr.io/nooblk-98/lighthouse-ui:latest
docker pull ghcr.io/nooblk-98/lighthouse-sv:latest
```

### Run with pre-built images (no build)
Use the provided compose file to pull and run the published images directly:

```bash
docker-compose -f docker-compose.live.yml up -d
```

This uses the published tags:
- `lahiru98s/lighthouse-ui:latest`
- `lahiru98s/lighthouse-sv:latest`

## 🔧 Configuration

### settings.json
Configure the backend behavior by editing `settings.json`:

```json
{
	"container_update_interval": 5,
	"log_level": "INFO",
	"api_port": 8000
}
```

## 📁 Project Structure

```
lighthouse/
├── client/                 # React frontend application
│   ├── src/
│   ├── Dockerfile
│   ├── package.json
│   └── vite.config.js
├── server/                 # Python backend API
│   ├── main.py
│   ├── Dockerfile
│   ├── requirements.txt
│   └── services/
├── docker-compose.yml
├── settings.json
└── README.md
```

## 🛠️ Development

### Run locally without Docker

**Backend:**
```bash
cd server
pip install -r requirements.txt
python main.py
```

**Frontend:**
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

## 🚢 Deployment

### Using GitHub Actions

The project includes automated CI/CD workflows that:
- Build multi-architecture Docker images on release
- Push to Docker Hub and GitHub Container Registry
- Support `linux/amd64`, `linux/arm64`, `linux/arm/v7`

To trigger a build, create a GitHub Release and the workflow will automatically:
1. Build images for all supported architectures
2. Push to Docker Hub (`lahiru98s/lighthouse-*`)
3. Push to GitHub Container Registry (`ghcr.io/nooblk-98/lighthouse-*`)

## 📊 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/containers` | GET | List all containers |
| `/api/containers/{id}` | GET | Get container details |
| `/api/containers/{id}/start` | POST | Start container |
| `/api/containers/{id}/stop` | POST | Stop container |
| `/api/containers/{id}/restart` | POST | Restart container |
| `/api/settings` | GET | Get settings |
| `/api/settings` | PUT | Update settings |

## 🐛 Troubleshooting

### Containers won't start
- Check Docker daemon is running
- Verify ports 80 and 8000 are available
- Check Docker socket is mounted correctly

### Backend can't access Docker
```bash
# Ensure Docker socket is properly mounted
docker-compose down
docker-compose up -d
```

### Frontend can't connect to backend
- Check backend service is running: `docker ps`
- Verify backend is accessible: `curl http://localhost:8000`
- Check network connectivity between containers

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues, questions, or suggestions, please open an issue on GitHub.

