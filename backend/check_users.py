import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'outpass_system.settings')
django.setup()

from apps.users.models import User

def check():
    print("Checking users...")
    
    # Check 9999999999
    try:
        u = User.objects.get(phone='9999999999')
        print(f"User 9999999999: Role={u.role}, Superuser={u.is_superuser}, Staff={u.is_staff}")
        if u.check_password('9999999999'):
            print("Password for 9999999999 is '9999999999'")
        elif u.check_password('admin'):
            print("Password for 9999999999 is 'admin'")
        else:
            print("Password for 9999999999 is UNKNOWN")
    except User.DoesNotExist:
        print("User 9999999999 does not exist.")

    # Check 'admin'
    try:
        u = User.objects.get(phone='admin')
        print(f"User 'admin': Role={u.role}, Superuser={u.is_superuser}")
        if u.check_password('admin'):
            print("Password for 'admin' is 'admin'")
        elif u.check_password('admin@school.com'):
             print("Password for 'admin' is 'admin@school.com'")
        else:
            print("Password for 'admin' is UNKNOWN")
    except User.DoesNotExist:
        print("User 'admin' does not exist.")

if __name__ == '__main__':
    check()
