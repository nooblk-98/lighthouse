# Lighthouse Developer Guide

Welcome to the Lighthouse developer guide! This document provides information to help new developers understand the project structure, development workflow, and contribution guidelines.

## Project Structure

The Lighthouse project is a full-stack application composed of a Python backend, a React frontend, and Docker for containerization. Below is an overview of the key directories and files:

```
lighthouse/
├── client/                     # React frontend source code
│   ├── public/                 # Public assets (e.g., icons, images)
│   ├── src/                    # Frontend source files (React components, styles)
│   ├── .dockerignore           # Files to ignore in the Docker build
│   ├── .gitignore              # Files to ignore in Git
│   ├── Dockerfile              # Dockerfile for the frontend service
│   ├── package.json            # NPM package configuration
│   └── vite.config.js          # Vite configuration
├── docker/                     # Docker-related descriptions
│   ├── description-sv.md       # Description for the server Docker image
│   └── description-ui.md       # Description for the UI Docker image
├── images/                     # Project images and logos
├── server/                     # Python backend source code
│   ├── services/               # Backend services (e.g., updater, scheduler)
│   ├── .dockerignore           # Files to ignore in the Docker build
│   ├── Dockerfile              # Dockerfile for the backend service
│   ├── main.py                 # FastAPI application entry point
│   └── requirements.txt        # Python dependencies
├── .gitignore                  # Global Git ignore rules
├── docker-compose.dev.yml      # Docker Compose for development
├── docker-compose.production.yml # Docker Compose for production
└── README.md                   # Main project README
```

### Key Components

-   **`client/`**: The frontend is a single-page application built with **React** and **Vite**. It provides the user interface for monitoring and managing Docker containers.
-   **`server/`**: The backend is an API built with **Python** and **FastAPI**. It communicates with the Docker daemon to manage containers and provides a RESTful API for the frontend.
-   **`docker-compose.*.yml`**: These files define the services, networks, and volumes for running the application in different environments.

## Development Workflow

To get started with Lighthouse development, you will need **Docker** and **Docker Compose** installed. The recommended way to run the application is with `docker-compose`.

### Running in Development

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/nooblk-98/lighthouse.git
    cd lighthouse
    ```

2.  **Run with Docker Compose**:
    ```bash
    docker compose -f docker-compose.dev.yml up --build
    ```

This command will build the images for the frontend and backend services and start the containers. The frontend will be available at `http://localhost:8066` and the backend at `http://localhost:8000`.

### QA Testing

Once the application is running, you can perform the following QA tests to ensure its stability and correctness:

1.  **Verify the frontend is accessible**:
    -   Open your web browser and navigate to `http://localhost:8066`.
    -   You should see the Lighthouse UI.

2.  **Verify the backend is accessible**:
    -   Open your web browser and navigate to `http://localhost:8000`.
    -   You should see the message `{"status":"ok","message":"Light House Backend Running"}`.

3.  **Verify the container list is displayed**:
    -   In the Lighthouse UI, you should see a list of all your running and stopped containers.

4.  **Verify the container update check works**:
    -   Click the "Check for Updates" button for a container.
    -   The UI should display the update status of the container.

5.  **Verify the container exclusion works**:
    -   Click the "Exclude" button for a container.
    -   The container should be marked as excluded and should not be updated.

### Docker Hub Rate Limiting

If you encounter a "Too Many Requests" error when running `docker compose`, you have reached the unauthenticated pull rate limit for Docker Hub. To resolve this, you can log in to Docker Hub with your account:

```bash
docker login
```

Alternatively, you can upgrade to a paid Docker Hub plan to increase your pull rate limit.

## Contribution Guidelines

We welcome contributions to Lighthouse! To contribute, please follow these steps:

1.  **Fork the repository**.
2.  **Create a new branch** for your feature or bug fix.
3.  **Make your changes** and commit them with descriptive messages.
4.  **Push your branch** to your fork.
5.  **Open a pull request** to the main Lighthouse repository.

Before submitting a pull request, please ensure that your code is well-tested and follows the existing coding style.
