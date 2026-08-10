import logging
from django.conf import settings

logger = logging.getLogger(__name__)

class MonnifyGateway:
    def __init__(self):
        config = getattr(settings, 'MONNIFY', {})
        self._api_key = config.get('API_KEY', '')
        self._secret_key = config.get('SECRET_KEY', '')
        self._contract_code = config.get('CONTRACT_CODE', '')
        self._base_url = config.get('BASE_URL', 'https://sandbox.monnify.com').rstrip('/')

    def _get_access_token(self) -> str | None:
        import base64
        import requests

        if not self._api_key or not self._secret_key:
            logger.warning("Monnify API_KEY or SECRET_KEY missing")
            return None

        auth_str = f"{self._api_key}:{self._secret_key}"
        encoded = base64.b64encode(auth_str.encode()).decode()

        for attempt in range(2):
            try:
                resp = requests.post(
                    f"{self._base_url}/api/v1/auth/login",
                    headers={"Authorization": f"Basic {encoded}"},
                    timeout=15,
                    verify=False,
                )
                data = resp.json()
                if data.get("requestSuccessful") and data.get("responseBody"):
                    token = data["responseBody"].get("accessToken")
                    if token:
                        return token
                logger.error("Monnify auth login failed (attempt %d): %s", attempt + 1, data)
            except Exception as e:
                logger.exception("Monnify auth exception (attempt %d)", attempt + 1)
                import time
                time.sleep(1)

        return None

    def initialize_transaction(self, amount, customer_name, customer_email, payment_reference, payment_description, currency='NGN', redirect_url=''):
        import requests
        import urllib3
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

        token = self._get_access_token()
        if not token:
            logger.error("Monnify: could not obtain access token, aborting charge")
            return {"success": False, "error_message": "Could not authenticate with Monnify. Please try again."}

        try:
            resp = requests.post(
                f"{self._base_url}/api/v1/merchant/transactions/init-transaction",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                json={
                    "amount": float(amount),
                    "customerName": customer_name,
                    "customerEmail": customer_email,
                    "paymentReference": str(payment_reference),
                    "paymentDescription": payment_description,
                    "currencyCode": currency,
                    "contractCode": self._contract_code,
                    "redirectUrl": redirect_url,
                    "paymentMethods": ["CARD", "ACCOUNT_TRANSFER"],
                },
                timeout=15,
                verify=False,
            )
            data = resp.json()
            if data.get("requestSuccessful") and data.get("responseBody"):
                body = data["responseBody"]
                return {
                    "success": True,
                    "checkout_url": body.get("checkoutUrl", ""),
                    "transaction_reference": body.get("transactionReference", ""),
                    "payment_reference": body.get("paymentReference", str(payment_reference)),
                }
            return {
                "success": False,
                "error_message": data.get("responseMessage", "Monnify initialization failed"),
                "raw_response": data,
            }
        except Exception as e:
            logger.exception("Monnify initialize_transaction failed")
            return {"success": False, "error_message": str(e)}

    def verify_transaction(self, payment_reference):
        import urllib.parse
        import urllib3
        import requests
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

        token = self._get_access_token()
        if not token:
            return {"success": False, "error_message": "Failed to authenticate with Monnify."}

        encoded_ref = urllib.parse.quote(str(payment_reference))
        urls = [
            f"{self._base_url}/api/v1/merchant/transactions/query?paymentReference={encoded_ref}",
            f"{self._base_url}/api/v2/transactions/searchByPaymentReference?paymentReference={encoded_ref}",
        ]

        for url in urls:
            try:
                resp = requests.get(
                    url,
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Content-Type": "application/json",
                    },
                    timeout=15,
                    verify=False,
                )
                data = resp.json()
                if data.get("requestSuccessful") and data.get("responseBody"):
                    body = data.get("responseBody", {})
                    return {
                        "success": True,
                        "payment_status": body.get("paymentStatus", "PENDING"),
                        "amount_paid": body.get("amountPaid"),
                        "transaction_reference": body.get("transactionReference"),
                    }
            except Exception as e:
                logger.warning("Monnify verify_transaction error for %s: %s", url, e)

        return {"success": False, "error_message": "Transaction verification failed on Monnify"}

    def verify_webhook_signature(self, request_body, monnify_signature):
        import hashlib
        import hmac
        import json

        data = json.loads(request_body)
        event_data = data.get("eventData", {})

        payment_ref = event_data.get("paymentReference", "")
        amount_paid = str(event_data.get("amountPaid", ""))
        paid_on = str(event_data.get("paidOn", ""))
        txn_ref = event_data.get("transactionReference", "")

        computed = hashlib.sha512(
            f"{self._secret_key}|{payment_ref}|{amount_paid}|{paid_on}|{txn_ref}".encode()
        ).hexdigest()

        if monnify_signature and not hmac.compare_digest(computed.lower(), monnify_signature.lower()):
            logger.warning("Monnify webhook signature mismatch")
            return None

        return {
            "event_id": txn_ref or payment_ref,
            "event_type": data.get("eventType", "SUCCESSFUL_TRANSACTION"),
            "data": event_data,
        }
