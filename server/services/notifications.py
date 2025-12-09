import smtplib
import ssl
from email.message import EmailMessage
import logging

logger = logging.getLogger(__name__)


class NotificationService:
    def __init__(self, settings_manager):
        self.settings_manager = settings_manager

    def _send_email(self, smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from, smtp_to, use_tls, msg):
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
                f"Image: {update_result.get('image', '')}\n"
            )
            badge_color = "#059669" if status == "SUCCESS" else "#dc2626"
            status_label = "Updated" if status == "SUCCESS" else "Failed"
            message_text = update_result.get('message') or update_result.get('error', 'No message provided')
            image_text = update_result.get('image') or 'N/A'
            badge_bg = f"{badge_color}1A"
            badge_text = badge_color if status == "SUCCESS" else "#dc2626"
            badge_dot = badge_color if status == "SUCCESS" else "#ef4444"
            html_body = f"""
            <div style="margin:0;padding:0;background:#f5f7fb;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;background:#f5f7fb;padding:24px 0;">
                <tr>
                  <td align="center">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="640" style="max-width:640px;background:#0f172a; color:#e2e8f0; border-radius:16px; overflow:hidden; box-shadow:0 12px 40px rgba(15,23,42,0.25);">
                      <tr>
                        <td style="padding:20px 24px; background:linear-gradient(135deg, #312e81, #0f172a);">
                          <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="font-family:'Segoe UI', Arial, sans-serif; font-size:18px; font-weight:700; color:#fff;">Lighthouse update result</td>
                              <td align="right">
                                <div style="display:inline-flex; align-items:center; gap:8px; padding:8px 12px; border-radius:999px; background:{badge_bg}; color:{badge_text}; font-weight:700; font-size:12px; letter-spacing:0.5px; text-transform:uppercase;">
                                  <span style="display:inline-block; width:8px; height:8px; border-radius:999px; background:{badge_dot};"></span>
                                  {status_label}
                                </div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="background:#ffffff; color:#0f172a; padding:24px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="font-family:'Segoe UI', Arial, sans-serif; font-size:14px; line-height:1.6; color:#0f172a;">
                            <tr>
                              <td style="padding:10px 0; width:140px; font-weight:700;">Container</td>
                              <td style="padding:10px 0;">{container_name}</td>
                            </tr>
                            <tr>
                              <td style="padding:10px 0; width:140px; font-weight:700;">Image</td>
                              <td style="padding:10px 0;">{image_text}</td>
                            </tr>
                            <tr>
                              <td style="padding:10px 0; width:140px; font-weight:700;">Message</td>
                              <td style="padding:10px 0; color:#0f172a;">{message_text}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:16px 24px; background:#0f172a; color:#cbd5e1; font-family:'Segoe UI', Arial, sans-serif; font-size:12px; text-align:left; border-top:1px solid rgba(148,163,184,0.2);">
                          You received this email because notifications are enabled in Lighthouse.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </div>
            """

            msg = EmailMessage()
            msg["Subject"] = subject
            msg["From"] = smtp_from
            msg["To"] = smtp_to
            msg.set_content(body)
            msg.add_alternative(html_body, subtype="html")

            self._send_email(smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from, smtp_to, use_tls, msg)
            logger.info(f"Notification sent for {container_name}")
        except Exception as e:
            logger.error(f"Failed to send notification: {e}")

    def send_test_notification(self, message: str = "This is a test email from Lighthouse."):
        settings = self.settings_manager.get_all()
        if not settings.get("notifications_enabled"):
            raise ValueError("Notifications are disabled. Enable them to send a test email.")

        required = [
            settings.get("smtp_host"),
            settings.get("smtp_port"),
            settings.get("smtp_from"),
            settings.get("smtp_to"),
        ]
        if any(v in (None, "") for v in required):
            raise ValueError("SMTP settings are incomplete. Please set host, port, from, and to.")

        smtp_host = settings.get("smtp_host")
        smtp_port = int(settings.get("smtp_port") or 0)
        smtp_user = settings.get("smtp_username") or None
        smtp_pass = settings.get("smtp_password") or None
        smtp_from = settings.get("smtp_from")
        smtp_to = settings.get("smtp_to")
        use_tls = bool(settings.get("smtp_use_tls", True))

        subject = "Lighthouse test email"
        body = f"Test email successful.\n\n{message}"
        html_body = f"""
        <div style="font-family: 'Segoe UI', Arial, sans-serif; background:#f8fafc; padding:24px; color:#0f172a;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:640px; margin:0 auto; background:#ffffff; border:1px solid #e2e8f0; border-radius:10px;">
            <tr>
              <td style="padding:24px;">
                <h2 style="margin:0 0 12px; font-size:20px; color:#0f172a;">Lighthouse SMTP test</h2>
                <p style="margin:0; font-size:14px; color:#0f172a;">{message}</p>
              </td>
            </tr>
          </table>
        </div>
        """

        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = smtp_from
        msg["To"] = smtp_to
        msg.set_content(body)
        msg.add_alternative(html_body, subtype="html")

        self._send_email(smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from, smtp_to, use_tls, msg)
        return {"sent": True}
