import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'outpass_system.settings')
django.setup()

from apps.notifications.utils import send_sms
from django.conf import settings

def test_sms_utility():
    print("--- Testing SMS Utility (Raw HTTP) ---")
    
    # Test number (Jayanthi's phone from previous debug)
    test_phone = "8147528594"
    test_message = "This is a test notification from the Outpass System via RAW HTTP."
    
    print(f"Attempting to send SMS to {test_phone}...")
    success, result = send_sms(test_phone, test_message)
    
    if success:
        print(f"SUCCESS! Message SID: {result}")
    else:
        print(f"FAILED! Error: {result}")

if __name__ == "__main__":
    test_sms_utility()
