from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from services.settings import SettingsManager
from services.updater import UpdateService
import logging

logger = logging.getLogger(__name__)

from services.cache import StatusCache

class SchedulerService:
    def __init__(self, settings_manager: SettingsManager, update_service: UpdateService, status_cache: StatusCache, notifier=None):
        self.scheduler = BackgroundScheduler()
        self.settings = settings_manager
        self.updater = update_service
        self.cache = status_cache
        self.notifier = notifier
        self.job = None

    def start(self):
        self.scheduler.start()
        self.schedule_job()
        # Schedule an immediate scan so the UI has data right away
        from datetime import datetime
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

    def run_scheduled_scan(self):
        logger.info("Running scheduled scan...")
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
                        continue

                    # Check for update
                    result = self.updater.check_for_update(container.id)
                    # Update cache
                    self.cache.update(container.id, result)
                    
                    if result.get("update_available"):
                        logger.info(f"Update available for {container.name}")
                        if auto_update:
                            logger.info(f"Auto-updating {container.name}...")
                            update_res = self.updater.update_container(container.id)
                            logger.info(f"Update result: {update_res}")
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
                except Exception as e:
                    logger.error(f"Error processing container {container.name}: {e}")
                    
        except Exception as e:
            logger.error(f"Scan failed: {e}")

    def update_settings(self):
        """Called when settings change to reschedule job"""
        self.schedule_job()
