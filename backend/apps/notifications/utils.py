import requests
from requests.auth import HTTPBasicAuth
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

def send_sms(to_phone, message_body):
    """
    Sends an SMS using Twilio via raw HTTP requests.
    This avoids library-specific hangs on certain Windows environments.
    """
    try:
        # Standardize phone number format (E.164)
        formatted_phone = str(to_phone).strip()
        if not formatted_phone.startswith('+'):
            formatted_phone = f"+91{formatted_phone}"
            
        sid = settings.TWILIO_ACCOUNT_SID
        token = settings.TWILIO_AUTH_TOKEN
        from_number = settings.TWILIO_FROM_NUMBER
        
        url = f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json"
        
        payload = {
            'To': formatted_phone,
            'From': from_number,
            'Body': message_body,
        }
        
        print(f"DEBUG: Attempting raw SMS request to {formatted_phone}...")
        
        response = requests.post(
            url, 
            data=payload, 
            auth=HTTPBasicAuth(sid, token),
            timeout=15
        )
        
        if response.status_code in [200, 201]:
            result = response.json()
            logger.info(f"SMS sent successfully to {formatted_phone}. SID: {result.get('sid')}")
            print(f"DEBUG: SMS sent successfully. SID: {result.get('sid')}")
            return True, result.get('sid')
        else:
            error_msg = f"HTTP {response.status_code}: {response.text}"
            logger.error(f"Twilio API Error: {error_msg}")
            print(f"DEBUG ERROR: {error_msg}")
            return False, error_msg
            
    except Exception as e:
        logger.error(f"Failed to send SMS to {to_phone}: {str(e)}")
        print(f"DEBUG ERROR: Connection failed: {str(e)}")
        return False, str(e)
