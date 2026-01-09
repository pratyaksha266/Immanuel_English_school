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
        # Strip any accidental whitespace from credentials
        sid = str(settings.TWILIO_ACCOUNT_SID).strip()
        token = str(settings.TWILIO_AUTH_TOKEN).strip()
        from_number = str(settings.TWILIO_FROM_NUMBER).strip()
        
        # Detect if placeholders are still being used (production safety)
        if "your_" in sid.lower() or "your_" in token.lower() or "123456" in from_number:
            error_msg = "Twilio credentials are not configured! Please check Render environment variables."
            logger.error(error_msg)
            print(f"DEBUG ERROR: {error_msg}")
            return False, error_msg

        # Standardize phone number format (E.164)
        formatted_phone = str(to_phone).strip().replace(" ", "").replace("-", "")
        
        # Mask credentials for logging
        masked_sid = f"{sid[:4]}...{sid[-4:]}" if len(sid) > 8 else "****"
        print(f"DEBUG: Initializing SMS. SID={masked_sid}, From={from_number}")
        
        # If it's 10 digits, assume India
        if len(formatted_phone) == 10 and formatted_phone.isdigit():
            formatted_phone = f"+91{formatted_phone}"
        # If it starts with 91 but no +, add +
        elif formatted_phone.startswith('91') and len(formatted_phone) == 12:
            formatted_phone = f"+{formatted_phone}"
        # Ensure it starts with +
        elif not formatted_phone.startswith('+'):
            formatted_phone = f"+91{formatted_phone}"
            
        url = f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json"
        
        payload = {
            'To': formatted_phone,
            'From': from_number,
            'Body': message_body,
        }
        
        print(f"DEBUG: Attempting raw SMS request to {formatted_phone} from {from_number}...")
        
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
            error_details = response.text
            try:
                error_json = response.json()
                error_details = error_json.get('message', error_details)
            except:
                pass
            
            error_msg = f"Twilio API Error {response.status_code}: {error_details}"
            logger.error(error_msg)
            print(f"DEBUG ERROR: {error_msg}")
            return False, error_msg
            
    except Exception as e:
        logger.error(f"Failed to send SMS to {to_phone}: {str(e)}")
        print(f"DEBUG ERROR: Connection failed: {str(e)}")
        return False, str(e)
