from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from services.settings import SettingsManager
from services.updater import UpdateService
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

from services.cache import StatusCache

class SchedulerService:
    def __init__(
        self,
        settings_manager: SettingsManager,
        update_service: UpdateService,
        status_cache: StatusCache,
        notifier=None,
        history=None,
    ):
        self.scheduler = BackgroundScheduler()
        self.settings = settings_manager
        self.updater = update_service
        self.cache = status_cache
        self.notifier = notifier
        self.history = history
        self.job = None
        self.last_check_time = None
        self.next_check_time = None

    def _record(self, **payload):
        """Safely record a history entry if a history service is available."""
        if not self.history:
            return
        try:
            self.history.log_event(**payload)
        except Exception as e:
            logger.error(f"Failed to record history entry: {e}")

    def start(self):
        self.scheduler.start()
        self.schedule_job()
        # Schedule an immediate scan so the UI has data right away
        self.scheduler.add_job(self.run_scheduled_scan, 'date', run_date=datetime.now(), id="initial_scan")
        logger.info("Scheduler started.")

    def schedule_job(self):
        # Remove existing job if any
        if self.job:
            self.job.remove()
        
        interval = self.settings.get("check_interval_minutes")
        logger.info(f"Scheduling scan every {interval} minutes.")
        
        self.job = self.scheduler.add_job(
            self.run_scheduled_scan,
            trigger=IntervalTrigger(minutes=int(interval)),
            id="auto_scan",
            replace_existing=True
        )
        self.next_check_time = self.job.next_run_time.isoformat() if self.job.next_run_time else None

    def run_scheduled_scan(self):
        logger.info("Running scheduled scan...")
        self.last_check_time = datetime.utcnow().isoformat()
        auto_update = self.settings.get("auto_update_enabled")
        cleanup = self.settings.get("cleanup_enabled")
        
        # 1. List all containers
        # We need a way to enlist containers.
        # But UpdateService doesn't have list_containers.
        # We should probably expose list_containers in UpdateService or reuse client.
        try:
            containers = self.updater.client.containers.list(all=True)
            for container in containers:
                try:
                    if self.settings.is_excluded(container.name):
                        self.cache.update(container.id, {"update_available": False, "skipped": True, "reason": "Container excluded from updates"})
                        self._record(
                            action="auto_scan",
                            status="skipped",
                            message="Container excluded from updates",
                            container=container.name,
                            trigger="auto",
                        )
                        continue

                    # Check for update
                    result = self.updater.check_for_update(container.id)
                    # Update cache
                    self.cache.update(container.id, result)
                    
                    if result.get("error"):
                        self._record(
                            action="auto_scan",
                            status="error",
                            message=result.get("error"),
                            container=container.name,
                            trigger="auto",
                        )
                        continue

                    if result.get("update_available"):
                        logger.info(f"Update available for {container.name}")
                        if auto_update:
                            logger.info(f"Auto-updating {container.name}...")
                            update_res = self.updater.update_container(container.id)
                            logger.info(f"Update result: {update_res}")
                            if update_res.get("success"):
                                self.cache.update(container.name, {
                                    "update_available": False,
                                    "latest_id": update_res.get("new_id"),
                                })
                                self._record(
                                    action="auto_update",
                                    status="updated",
                                    message=update_res.get("message", "Updated successfully"),
                                    container=container.name,
                                    trigger="auto",
                                    details={"image": result.get("image"), "new_id": update_res.get("new_id")},
                                )
                            else:
                                self._record(
                                    action="auto_update",
                                    status="error",
                                    message=update_res.get("error", "Update failed"),
                                    container=container.name,
                                    trigger="auto",
                                    details={"image": result.get("image")},
                                )
                            if self.notifier:
                                try:
                                    self.notifier.send_update_notification(container.name, update_res)
                                except Exception as notify_err:
                                    logger.error(f"Notification failed for {container.name}: {notify_err}")
                            
                            if update_res.get("success") and cleanup:
                                # Prune old image?
                                # This is tricky because we need the old ID.
                                # UpdateService returns new_id, but handles removal of old container.
                                # Image prunning is separate.
                                pass
                        else:
                            self._record(
                                action="auto_scan",
                                status="update_available",
                                message="Update available; auto-update disabled",
                                container=container.name,
                                trigger="auto",
                                details={"image": result.get("image"), "latest_id": result.get("latest_id")},
                            )
                except Exception as e:
                    logger.error(f"Error processing container {container.name}: {e}")
                    self._record(
                        action="auto_scan",
                        status="error",
                        message=str(e),
                        container=container.name,
                        trigger="auto",
                    )
                    
        except Exception as e:
            logger.error(f"Scan failed: {e}")
        # Update next run time after completion
        if self.job:
            self.next_check_time = self.job.next_run_time.isoformat() if self.job.next_run_time else None

    def update_settings(self):
        """Called when settings change to reschedule job"""
        self.schedule_job()

    def get_schedule_info(self):
        return {
            "last_check_time": self.last_check_time,
            "next_check_time": self.next_check_time,
            "interval_minutes": self.settings.get("check_interval_minutes"),
        }
