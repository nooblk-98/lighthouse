import docker
import logging

logger = logging.getLogger(__name__)

class UpdateService:
    def __init__(self):
        self.client = docker.from_env()

    def check_for_update(self, container_id: str) -> dict:
        """
        Checks if a newer image exists for the container.
        Returns dict with update available status and details.
        """
        try:
            container = self.client.containers.get(container_id)
            image_name = container.attrs['Config']['Image']
            current_image_id = container.image.id

            # Pull the latest version of the image
            logger.info(f"Checking update for {container.name} ({image_name})...")
            try:
                # This pulls the image. 
                # Note: This might take time and bandwidth.
                # In a real app, maybe only check manifest digest to save bandwidth?
                # But Docker SDK pull uses 'latest' by default if no tag, 
                # or uses the existing tag.
                pulled_image = self.client.images.pull(image_name)
            except Exception as e:
                logger.error(f"Failed to pull image {image_name}: {e}")
                return {"error": f"Failed to pull image: {str(e)}", "update_available": False}

            pulled_image_id = pulled_image.id

            if pulled_image_id != current_image_id:
                return {
                    "update_available": True,
                    "current_id": current_image_id,
                    "latest_id": pulled_image_id,
                    "image": image_name
                }
            else:
                return {
                    "update_available": False,
                    "ids_match": True
                }

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
