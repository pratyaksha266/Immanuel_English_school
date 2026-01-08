import os
import django
import sys
from django.contrib.auth import authenticate

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'outpass_system.settings')
django.setup()

from apps.users.models import User

def check_creds(phone, password):
    user = authenticate(phone=phone, password=password)
    if user:
        print(f"SUCCESS: Phone='{phone}', Password='{password}'")
        return True
    else:
        print(f"FAILED: Phone='{phone}', Password='{password}'")
        return False

def verify():
    print("Checking admin credentials...")
    
    # Check if user exists first
    try:
        u = User.objects.get(phone='9999999999')
        print(f"User found: {u.phone} (Role: {u.role})")
    except User.DoesNotExist:
        print("User 9999999999 does not exist.")
        return

    # Try 'admin'
    if check_creds('9999999999', 'admin'):
        return
    
    # Try '9999999999'
    if check_creds('9999999999', '9999999999'):
        return

if __name__ == '__main__':
    verify()
