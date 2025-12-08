import smtplib
import ssl
from email.message import EmailMessage
import logging

logger = logging.getLogger(__name__)


class NotificationService:
    def __init__(self, settings_manager):
        self.settings_manager = settings_manager

    def send_update_notification(self, container_name: str, update_result: dict):
        settings = self.settings_manager.get_all()
        if not settings.get("notifications_enabled"):
            return

        required = [
            settings.get("smtp_host"),
            settings.get("smtp_port"),
            settings.get("smtp_from"),
            settings.get("smtp_to"),
        ]
        if any(v in (None, "") for v in required):
            logger.warning("Notifications enabled but SMTP settings are incomplete. Skipping email.")
            return

        try:
            smtp_host = settings.get("smtp_host")
            smtp_port = int(settings.get("smtp_port") or 0)
            smtp_user = settings.get("smtp_username") or None
            smtp_pass = settings.get("smtp_password") or None
            smtp_from = settings.get("smtp_from")
            smtp_to = settings.get("smtp_to")
            use_tls = bool(settings.get("smtp_use_tls", True))

            subject = f"Lighthouse update result for {container_name}"
            status = "SUCCESS" if update_result.get("success") else "FAILED"
            body = (
                f"Container: {container_name}\n"
                f"Status: {status}\n"
                f"Message: {update_result.get('message') or update_result.get('error', '')}\n"
                f"New ID: {update_result.get('new_id', '')}\n"
            )

            msg = EmailMessage()
            msg["Subject"] = subject
            msg["From"] = smtp_from
            msg["To"] = smtp_to
            msg.set_content(body)

            if use_tls:
                context = ssl.create_default_context()
                with smtplib.SMTP(smtp_host, smtp_port) as server:
                    server.starttls(context=context)
                    if smtp_user and smtp_pass:
                        server.login(smtp_user, smtp_pass)
                    server.send_message(msg)
            else:
                with smtplib.SMTP(smtp_host, smtp_port) as server:
                    if smtp_user and smtp_pass:
                        server.login(smtp_user, smtp_pass)
                    server.send_message(msg)
            logger.info(f"Notification sent for {container_name}")
        except Exception as e:
            logger.error(f"Failed to send notification: {e}")
