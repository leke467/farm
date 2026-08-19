import json
import urllib.request
import urllib.error
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

def send_brevo_email(to_email, to_name, subject, html_content, sender_email=None, sender_name="Livesteads Farm Manager"):
    """
    Sends a transactional HTML email via Brevo REST API v3.
    """
    api_key = getattr(settings, 'BREVO_API_KEY', '')
    if not api_key:
        logger.warning("BREVO_API_KEY is missing. Skipping email dispatch.")
        return False

    sender_email = sender_email or getattr(settings, 'BREVO_SENDER_EMAIL', 'livesteads@apexlabs.it.com')

    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "accept": "application/json",
        "api-key": api_key,
        "content-type": "application/json"
    }

    payload = {
        "sender": {
            "name": sender_name,
            "email": sender_email
        },
        "to": [
            {
                "email": to_email,
                "name": to_name or to_email
            }
        ],
        "subject": subject,
        "htmlContent": html_content
    }

    try:
        data_bytes = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(url, data=data_bytes, headers=headers, method='POST')
        with urllib.request.urlopen(req, timeout=10) as resp:
            status_code = resp.getcode()
            if status_code in (200, 201, 202):
                logger.info(f"Brevo email successfully dispatched to {to_email} | Subject: '{subject}'")
                return True
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8') if e.fp else str(e)
        logger.error(f"Brevo API Error ({e.code}) for {to_email}: {body}")
    except Exception as e:
        logger.error(f"Failed to dispatch Brevo email to {to_email}: {str(e)}")

    return False


# ---------------------------------------------------------------------------
# TRANSACTIONAL EMAIL TEMPLATES
# ---------------------------------------------------------------------------

def send_welcome_email(user, farm_name="Your Farm"):
    """Sends a welcome email to newly registered farm owners."""
    subject = f"Welcome to Livesteads — {farm_name} is Live!"
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 32px; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #10b981; margin: 0; font-size: 28px;">Livesteads</h1>
        <p style="color: #94a3b8; font-size: 14px; margin-top: 4px;">Smart Farm Management & AI Agronomy Platform</p>
      </div>

      <div style="background: #1e293b; padding: 24px; border-radius: 12px; border: 1px solid #334155;">
        <h2 style="color: #ffffff; font-size: 20px; margin-top: 0;">Welcome, {user.first_name or user.username}! 🎉</h2>
        <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6;">
          Your new farm workspace <strong style="color: #10b981;">"{farm_name}"</strong> has been successfully set up on Livesteads.
        </p>
        <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6;">
          You can now start recording livestock assets, crop batches, inventory items, and expenses, or consult our built-in <strong>Livesteads AI Advisor</strong> for agronomy insights.
        </p>
        <div style="text-align: center; margin-top: 28px; margin-bottom: 12px;">
          <a href="https://livesteads.com/login" style="background: #10b981; color: #0f172a; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">
            Access Your Farm Dashboard →
          </a>
        </div>
      </div>

      <div style="text-align: center; margin-top: 24px; color: #64748b; font-size: 12px;">
        <p>Sent by Livesteads Farm Manager • Questions? Reply to this email or visit <a href="https://livesteads.com/contact" style="color: #10b981;">livesteads.com/contact</a></p>
      </div>
    </div>
    """
    return send_brevo_email(user.email, user.get_full_name() or user.username, subject, html)


def send_contact_inquiry_email(contact_msg):
    """Notifies admin/support of a new public contact inquiry."""
    subject = f"[Inquiry #{contact_msg.id}] {contact_msg.subject or 'New Contact Form Message'}"
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 32px; border-radius: 16px;">
      <h2 style="color: #10b981; margin-top: 0;">New Contact Form Message Received</h2>
      <div style="background: #1e293b; padding: 20px; border-radius: 12px; border: 1px solid #334155; font-size: 14px; line-height: 1.6;">
        <p><strong>Name:</strong> {contact_msg.name}</p>
        <p><strong>Email:</strong> {contact_msg.email}</p>
        <p><strong>Subject:</strong> {contact_msg.subject}</p>
        <hr style="border: 0; border-top: 1px solid #334155; margin: 16px 0;" />
        <p><strong>Message:</strong></p>
        <p style="white-space: pre-wrap; color: #cbd5e1; background: #0f172a; padding: 12px; border-radius: 8px;">{contact_msg.message}</p>
      </div>
    </div>
    """
    admin_email = getattr(settings, 'BREVO_SENDER_EMAIL', 'livesteads@apexlabs.it.com')
    return send_brevo_email(admin_email, "Livesteads Admin", subject, html)


def send_health_alert_email(user, farm_name, animal_name, alert_type, description):
    """Sends urgent health alert notifications to the farm owner."""
    subject = f"⚠️ Urgent Health Alert: {animal_name} ({farm_name})"
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 32px; border-radius: 16px;">
      <div style="background: #ef4444; color: #ffffff; padding: 12px 20px; border-radius: 8px; font-weight: bold; margin-bottom: 20px;">
        ⚠️ URGENT ANIMAL HEALTH ALERT
      </div>
      <div style="background: #1e293b; padding: 24px; border-radius: 12px; border: 1px solid #334155; line-height: 1.6;">
        <p style="margin-top: 0;"><strong>Farm:</strong> {farm_name}</p>
        <p><strong>Animal / Group:</strong> <span style="color: #f87171; font-weight: bold;">{animal_name}</span></p>
        <p><strong>Alert Type:</strong> {alert_type}</p>
        <p><strong>Details:</strong> {description}</p>
      </div>
      <div style="text-align: center; margin-top: 24px;">
        <a href="https://livesteads.com/login" style="background: #ef4444; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
          View Health Record & Take Action →
        </a>
      </div>
    </div>
    """
    return send_brevo_email(user.email, user.get_full_name() or user.username, subject, html)
