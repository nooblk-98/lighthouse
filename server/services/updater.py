import docker
import logging
from typing import Optional, Tuple

logger = logging.getLogger(__name__)

class UpdateService:
    def __init__(self, settings_manager):
        self.client = docker.from_env()
        self.settings = settings_manager
        # Remember the last successful auth attempt to avoid re-authing on every pull
        self._auth_cache = {}

    def _detect_registry(self, image_name: str) -> Tuple[Optional[str], Optional[str]]:
        """
        Identify which registry provider/URL to use for auth based on the image reference.
        Returns (provider_key, registry_url) or (None, None) if not handled.
        """
        parts = image_name.split("/")
        registry_hint = parts[0].lower() if parts else ""

        if registry_hint in {"ghcr.io"}:
            return "ghcr", "ghcr.io"

        if registry_hint in {"docker.io", "index.docker.io"}:
            return "dockerhub", "https://index.docker.io/v1/"

        # If no registry host is present (no dot/colon), default to Docker Hub.
        if not (registry_hint and any(ch in registry_hint for ch in [".", ":"])):  # e.g. nginx or user/image
            return "dockerhub", "https://index.docker.io/v1/"

        # Unknown/unsupported registry host (e.g. quay.io); let Docker handle it without custom auth.
        return None, None

    def _ensure_registry_auth(self, image_name: str) -> Optional[str]:
        """
        Log in to Docker Hub or GHCR when credentials are configured.
        Returns an error string if auth fails, otherwise None.
        """
        provider, registry_url = self._detect_registry(image_name)
        if not provider or not registry_url:
            return None

        username = self.settings.get(f"{provider}_username")
        token = self.settings.get(f"{provider}_token")
        if not username or not token:
            return None

        cache_key = (provider, username, token, registry_url)
        if self._auth_cache.get(cache_key):
            return None

        try:
            logger.info(f"Authenticating to {registry_url} for {provider} images")
            self.client.login(username=username, password=token, registry=registry_url)
            self._auth_cache = {cache_key: True}
            return None
        except Exception as e:
            logger.error(f"Registry authentication failed for {registry_url}: {e}")
            return f"Registry authentication failed for {registry_url}: {e}"

    def check_for_update(self, container_id: str) -> dict:
        """
        Checks if a newer image exists for the container.
        Returns dict with update available status and details.
        """
        try:
            container = self.client.containers.get(container_id)
            image_name = container.attrs['Config']['Image']
            current_image_id = container.image.id

            # Ensure we are authenticated before pulling private images
            auth_error = self._ensure_registry_auth(image_name)
            if auth_error:
                return {"error": auth_error, "update_available": False}

            # Get current image details
            created_date = container.image.attrs.get('Created')

            # Pull the latest version of the image
            logger.info(f"Checking update for {container.name} ({image_name})...")
            try:
                # This pulls the image.
                pulled_image = self.client.images.pull(image_name)
            except Exception as e:
                logger.error(f"Failed to pull image {image_name}: {e}")
                return {"error": f"Failed to pull image: {str(e)}", "update_available": False}

            pulled_image_id = pulled_image.id

            result = {
                "update_available": pulled_image_id != current_image_id,
                "current_id": current_image_id,
                "latest_id": pulled_image_id,
                "image": image_name,
                "created": created_date
            }
            return result

        except docker.errors.NotFound:
            return {"error": "Container not found", "update_available": False}
        except Exception as e:
            return {"error": str(e), "update_available": False}

    def update_container(self, container_id: str):
        """
        Recreates the container with the new image.
        """
        try:
            old_container = self.client.containers.get(container_id)
            container_name = old_container.name
            image_name = old_container.attrs['Config']['Image']

            # Authenticate before pulling to support private registries
            auth_error = self._ensure_registry_auth(image_name)
            if auth_error:
                return {"success": False, "error": auth_error}

            # 1. Pull latest image
            logger.info(f"Pulling latest image for {container_name}...")
            self.client.images.pull(image_name)
            
            # 2. Capture configuration
            config = old_container.attrs['Config']
            host_config = old_container.attrs['HostConfig']
            
            # Map ports: ExposedPorts -> PortBindings
            # Actually, HostConfig.PortBindings is what we want to preserve?
            # Yes, usually we want to keep the same external ports.
            ports = host_config.get('PortBindings')
            
            # Volumes
            binds = host_config.get('Binds')
            
            # Environment
            env = config.get('Env')
            
            # Network
            # If on user defined network, we need to reconnect.
            # HostConfig.NetworkMode
            network_mode = host_config.get('NetworkMode')
            
            # Restart Policy
            restart_policy = host_config.get('RestartPolicy')
            
            logger.info(f"Stopping {container_name}...")
            old_container.stop()
            
            logger.info(f"Renaming old container {container_name}...")
            old_container.rename(f"{container_name}_old_{old_container.short_id}")
            
            logger.info(f"Creating new container {container_name}...")
            new_container = self.client.containers.run(
                image_name,
                name=container_name,
                detach=True,
                ports=ports,
                environment=env,
                volumes=binds,
                network_mode=network_mode,
                restart_policy=restart_policy,
                # Add other critical configs as needed (e.g. entrypoint, cmd if overridden)
                # For now, assuming basic usage.
            )
            
            logger.info(f"Removing old container...")
            old_container.remove()
            
            return {
                "success": True,
                "new_id": new_container.id,
                "message": f"Successfully updated {container_name}"
            }

        except Exception as e:
            logger.error(f"Update failed: {e}")
            return {"success": False, "error": str(e)}
