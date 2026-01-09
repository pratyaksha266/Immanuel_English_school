
import os
import django
from django.utils import timezone

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'outpass_system.settings')
django.setup()

from apps.users.models import User
from apps.outpasses.models import Outpass, Approval
from apps.notifications.utils import send_sms

def debug_hm_approve():
    print("--- Debugging HM Approval Logic ---")
    
    # Get HM user
    hm_user = User.objects.filter(role=User.Roles.HM).first()
    if not hm_user:
        print("ERROR: No HM user found!")
        return
    
    print(f"Using HM User: {hm_user.phone}")
    
    # Get a pending outpass or create one
    outpass = Outpass.objects.filter(status=Outpass.Status.PENDING).first()
    if not outpass:
        print("No pending outpass found. Creating a test one...")
        from apps.students.models import Student
        student = Student.objects.first()
        parent = User.objects.filter(role=User.Roles.PARENT).first()
        if not student or not parent:
            print("ERROR: Missing student or parent to create test outpass")
            return
            
        outpass = Outpass.objects.create(
            student=student,
            parent=parent,
            outgoing_date=timezone.now().date(),
            outgoing_time=timezone.now().time(),
            expected_return_date=timezone.now().date(),
            expected_return_time=timezone.now().time(),
            status=Outpass.Status.PENDING,
            reason="Debug Test"
        )
        print(f"Created test outpass: {outpass.id}")

    try:
        # Simulate logic in views.py
        print(f"Attempting to approve outpass {outpass.id}...")
        
        # 1. Update status
        outpass.status = Outpass.Status.APPROVED
        outpass.save()
        print("Status updated to APPROVED")
        
        # 2. Record approval
        Approval.objects.update_or_create(
            outpass=outpass,
            approver_role=User.Roles.HM,
            defaults={
                'approver': hm_user,
                'status': Approval.Status.APPROVED
            }
        )
        print("Approval record created/updated")
        
        # 3. Notify Parent
        student_name = f"{outpass.student.first_name} {outpass.student.last_name}"
        parent_phone = outpass.parent.phone
        msg = f"Immanuel English School: The outpass for {student_name} is APPROVED. You will receive an exit code once the Warden clears the departure."
        
        success, result = send_sms(parent_phone, msg)
        print(f"SMS Status: {success}, Result: {result}")
        
        print("HM Approval simulation COMPLETED SUCCESSFULLY")
        
    except Exception as e:
        print(f"CRITICAL ERROR in HM Approval Logic: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_hm_approve()
