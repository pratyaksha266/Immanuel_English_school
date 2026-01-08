import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'outpass_system.settings')
django.setup()

from apps.users.models import User

def create():
    phone = '9999999900'
    password = 'admin'
    
    if User.objects.filter(phone=phone).exists():
        print(f"User {phone} already exists. Resetting password and permissions.")
        u = User.objects.get(phone=phone)
        u.set_password(password)
        u.is_staff = True
        u.is_superuser = True
        u.role = 'ADMIN'
        u.save()
    else:
        print(f"Creating new admin user {phone}...")
        User.objects.create_superuser(
            phone=phone,
            password=password,
            role='ADMIN'
        )
    print("Admin user ready.")

if __name__ == '__main__':
    create()
