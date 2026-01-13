import requests
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

def send_sms(to_phone, message_body):
    """
    Sends an SMS using Fast2SMS API.
    Fast2SMS is India-focused, DLT compliant, and cost-effective.
    
    Args:
        to_phone: Phone number (10 digits or with +91)
        message_body: SMS message content
    
    Returns:
        tuple: (success: bool, result: str)
    """
    try:
        # Get Fast2SMS API key from settings
        api_key = str(settings.FAST2SMS_API_KEY).strip()
        
        # Validate API key
        if not api_key or "your_" in api_key.lower() or len(api_key) < 10:
            error_msg = "Fast2SMS API key is not configured! Please set FAST2SMS_API_KEY in environment variables."
            logger.error(error_msg)
            print(f"DEBUG ERROR: {error_msg}")
            return False, error_msg

        # Format phone number (Fast2SMS accepts 10-digit Indian numbers)
        formatted_phone = str(to_phone).strip().replace(" ", "").replace("-", "")
        
        # Remove country code if present
        if formatted_phone.startswith('+91'):
            formatted_phone = formatted_phone[3:]
        elif formatted_phone.startswith('91') and len(formatted_phone) == 12:
            formatted_phone = formatted_phone[2:]
        
        # Validate 10-digit number
        if not (len(formatted_phone) == 10 and formatted_phone.isdigit()):
            error_msg = f"Invalid phone number format: {to_phone}. Expected 10-digit Indian number."
            logger.error(error_msg)
            return False, error_msg
        
        # Fast2SMS API endpoint
        url = "https://www.fast2sms.com/dev/bulkV2"
        
        # Prepare payload
        payload = {
            'authorization': api_key,
            'route': 'q',  # 'q' for quick/promotional, 'dlt' for transactional (requires DLT)
            'message': message_body,
            'language': 'english',
            'flash': 0,
            'numbers': formatted_phone
        }
        
        # For DLT-registered messages, use this format instead:
        # payload = {
        #     'authorization': api_key,
        #     'route': 'dlt',
        #     'sender_id': 'IESCHOL',  # Your registered sender ID
        #     'message': message_body,
        #     'variables_values': '',  # Template variables if any
        #     'numbers': formatted_phone
        # }
        
        print(f"DEBUG: Sending SMS via Fast2SMS to {formatted_phone}...")
        
        # Send request
        response = requests.post(
            url,
            data=payload,
            timeout=15
        )
        
        # Parse response
        if response.status_code == 200:
            result = response.json()
            
            # Fast2SMS returns success in 'return' field
            if result.get('return'):
                message_id = result.get('message_id', 'N/A')
                logger.info(f"SMS sent successfully to {formatted_phone}. Message ID: {message_id}")
                print(f"DEBUG: SMS sent successfully. Message ID: {message_id}")
                return True, message_id
            else:
                error_msg = result.get('message', 'Unknown error from Fast2SMS')
                logger.error(f"Fast2SMS Error: {error_msg}")
                print(f"DEBUG ERROR: Fast2SMS returned error: {error_msg}")
                return False, error_msg
        else:
            error_msg = f"Fast2SMS API Error {response.status_code}: {response.text}"
            logger.error(error_msg)
            print(f"DEBUG ERROR: {error_msg}")
            return False, error_msg
            
    except requests.exceptions.Timeout:
        error_msg = "Fast2SMS request timeout. Please check your internet connection."
        logger.error(error_msg)
        print(f"DEBUG ERROR: {error_msg}")
        return False, error_msg
    except requests.exceptions.RequestException as e:
        error_msg = f"Network error while connecting to Fast2SMS: {str(e)}"
        logger.error(error_msg)
        print(f"DEBUG ERROR: {error_msg}")
        return False, error_msg
    except Exception as e:
        error_msg = f"Unexpected error sending SMS: {str(e)}"
        logger.error(error_msg)
        print(f"DEBUG ERROR: {error_msg}")
        return False, error_msg
