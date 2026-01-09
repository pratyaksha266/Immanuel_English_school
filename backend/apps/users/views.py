import random
import csv
from django.utils import timezone
from django.http import HttpResponse
from rest_framework import status, views
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .models import OtpVerification, StaffProfile, ParentProfile
from .serializers import (
    LoginSerializer, OtpVerifySerializer, 
    ChangePasswordSerializer, PasswordResetSerializer
)

User = get_user_model()

class AdminLoginView(views.APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        phone = str(request.data.get('phone', '')).strip()
        password = str(request.data.get('password', '')).strip()
        
        print(f"DEBUG ADMIN LOGIN: Attempting login for Phone='{phone}'")
        
        user = User.objects.filter(phone=phone).first()
        
        if user and user.check_password(password):
            allowed_roles = ['ADMIN', 'HM', 'ACCOUNTANT', 'WARDEN', 'GATE_STAFF']
            if user.role not in allowed_roles:
                 print(f"DEBUG ADMIN LOGIN: Access denied for role {user.role}")
                 return Response({"error": "Access denied. Admin portal is for staff/admin only."}, status=status.HTTP_403_FORBIDDEN)
            
            print(f"DEBUG ADMIN LOGIN: Success for user {phone}")
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'role': user.role,
                'user_id': user.id
            }, status=status.HTTP_200_OK)
        
        print(f"DEBUG ADMIN LOGIN: Failed for Phone='{phone}'. User found: {bool(user)}")
        if user:
            print(f"DEBUG ADMIN LOGIN: Password check failed for {phone}")
            
        return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

print("VIEWS.PY LOADED --------------------------------")

class PasswordLoginView(views.APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        phone = str(request.data.get('phone', '')).strip()
        password = str(request.data.get('password', '')).strip()
        role = request.data.get('role')
        
        print(f"DEBUG LOGIN: Phone='{phone}', Pass='{password}', Role='{role}'")

        user = User.objects.filter(phone=phone).first()
        print(f"DEBUG LOGIN: User found: {user}")
        if user:
             print(f"DEBUG LOGIN: User Role: {user.role}, CheckPass: {user.check_password(password)}")
        
        if user and user.check_password(password):
            # Optional: Check if user role matches requested role
            if role and user.role != role:
                 return Response({"error": f"User is not a {role}"}, status=status.HTTP_403_FORBIDDEN)

            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'role': user.role,
                'user_id': user.id,
                'parent_profile': getattr(user, 'parent_profile', None) and {
                    "occupation": user.parent_profile.occupation
                } or None
            }, status=status.HTTP_200_OK)
        
        return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

class SendOtpView(views.APIView):
    permission_classes = []

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            phone = serializer.validated_data['phone']
            # Check if user exists
            if not User.objects.filter(phone=phone).exists():
                 return Response({"error": "Phone number not registered. Please contact admin."}, status=status.HTTP_404_NOT_FOUND)
            
            otp = str(random.randint(100000, 999999))
            expires_at = timezone.now() + timezone.timedelta(minutes=10)
            

            OtpVerification.objects.create(
                phone=phone,
                otp=otp,
                purpose='LOGIN',
                expires_at=expires_at
            )
            
            # Send SMS via Twilio
            from twilio.rest import Client
            from django.conf import settings
            
            try:
                client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
                
                # Format phone number for Twilio (E.164)
                # Assuming Indian numbers if no country code provided
                to_number = phone
                if not to_number.startswith('+'):
                    to_number = f"+91{to_number}"
                
                message = client.messages.create(
                    body=f"Your Outpass App Login OTP is: {otp}",
                    from_=settings.TWILIO_FROM_NUMBER,
                    to=to_number
                )
                print(f"====== Twilio SMS Sent to {to_number}: SID={message.sid} ======")
                return Response({"message": "OTP sent successfully via SMS", "dev_otp": otp}, status=status.HTTP_200_OK)
            except Exception as e:
                print(f"!!!!!! Twilio Error: {e}")
                # Fallback to dev_otp in response if Twilio fails
                return Response({"message": "Failed to send SMS, check console", "dev_otp": otp, "error": str(e)}, status=status.HTTP_200_OK)
        print("!!! Serializer Errors:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerifyOtpView(views.APIView):
    permission_classes = []

    def post(self, request):
        serializer = OtpVerifySerializer(data=request.data)
        if serializer.is_valid():
            phone = serializer.validated_data['phone']
            otp = serializer.validated_data['otp']
            
            otp_record = OtpVerification.objects.filter(
                phone=phone,
                otp=otp,
                purpose='LOGIN',
                verified=False,
                expires_at__gt=timezone.now()
            ).first()
            
            if otp_record:
                otp_record.verified = True
                otp_record.verified_at = timezone.now()
                otp_record.save()
                
                # Get or Create User (For dev simplicity, auto-create. In prod, strict check)
                user, created = User.objects.get_or_create(phone=phone)
                if created:
                    user.role = 'PARENT' # Default
                    user.save()
                
                user.is_verified = True
                user.save()
                
                refresh = RefreshToken.for_user(user)
                return Response({
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'role': user.role,
                    'user_id': user.id
                }, status=status.HTTP_200_OK)
            
            return Response({"error": "Invalid or expired OTP"}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

from rest_framework import viewsets, permissions
from .serializers import UserSerializer


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ['phone', 'role', 'first_name', 'last_name']
    filterset_fields = ['role', 'is_verified']

class ChangePasswordView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            if not user.check_password(serializer.validated_data['old_password']):
                return Response({"error": "Wrong old password"}, status=status.HTTP_400_BAD_REQUEST)
            
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({"message": "Password updated successfully"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ForgotPasswordView(views.APIView):
    permission_classes = []

    def post(self, request):
        phone = request.data.get('phone')
        if not phone:
            return Response({"error": "Phone number is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        user = User.objects.filter(phone=phone).first()
        if not user:
            return Response({"error": "User with this phone number does not exist"}, status=status.HTTP_404_NOT_FOUND)
        
        otp = str(random.randint(100000, 999999))
        expires_at = timezone.now() + timezone.timedelta(minutes=10)
        
        OtpVerification.objects.create(
            phone=phone,
            otp=otp,
            purpose='PASSWORD_RESET',
            expires_at=expires_at
        )
        
        # In a real app, send OTP via Twilio here. For now, mirroring SendOtpView logic.
        print(f"PASSWORD RESET OTP for {phone}: {otp}")
        
        return Response({
            "message": "OTP sent to your phone number",
            "dev_otp": otp  # For easier testing/dev
        }, status=status.HTTP_200_OK)

class ResetPasswordView(views.APIView):
    permission_classes = []

    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        if serializer.is_valid():
            phone = serializer.validated_data['phone']
            otp = serializer.validated_data['otp']
            new_password = serializer.validated_data['new_password']
            
            otp_record = OtpVerification.objects.filter(
                phone=phone,
                otp=otp,
                purpose='PASSWORD_RESET',
                verified=False,
                expires_at__gt=timezone.now()
            ).first()
            
            if not otp_record:
                return Response({"error": "Invalid or expired OTP"}, status=status.HTTP_400_BAD_REQUEST)
            
            user = User.objects.filter(phone=phone).first()
            if not user:
                return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
            
            user.set_password(new_password)
            user.save()
            
            otp_record.verified = True
            otp_record.verified_at = timezone.now()
            otp_record.save()
            
            return Response({"message": "Password has been reset successfully"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ExportDataView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        export_type = request.query_params.get('type')
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{export_type}.csv"'
        
        writer = csv.writer(response)
        
        if export_type == 'students':
            writer.writerow(['Student ID', 'Admission No', 'First Name', 'Last Name', 'Class', 'Section', 'Roll No', 'Hostel', 'Room'])
            from apps.students.models import Student
            students = Student.objects.select_related('class_obj', 'section', 'hostel', 'room').order_by('class_obj__name', 'section__name', 'roll_number')
            for s in students:
                writer.writerow([
                    s.student_id, 
                    s.admission_number, 
                    s.first_name, 
                    s.last_name, 
                    s.class_obj.name if s.class_obj else '', 
                    s.section.name if s.section else '', 
                    s.roll_number,
                    s.hostel.name if s.hostel else '',
                    s.room.number if s.room else ''
                ])

        elif export_type == 'staff':
            writer.writerow(['Name', 'Phone', 'Role', 'Designation', 'Assigned Hostel'])
            staff_users = User.objects.filter(role__in=['WARDEN', 'HM', 'ACCOUNTANT', 'GATE_STAFF']).select_related('staff_profile', 'staff_profile__assigned_hostel').order_by('role', 'first_name')
            for u in staff_users:
                designation = ''
                hostel = ''
                if hasattr(u, 'staff_profile'):
                    designation = u.staff_profile.designation
                    hostel = u.staff_profile.assigned_hostel.name if u.staff_profile.assigned_hostel else ''
                
                writer.writerow([
                    f"{u.first_name} {u.last_name}",
                    u.phone,
                    u.role,
                    designation,
                    hostel
                ])
            
        elif export_type == 'parents':
            writer.writerow(['Student Name', 'Class', 'Section', 'Roll No', 'Parent Name', 'Parent Phone', 'Relation'])
            from apps.students.models import StudentParentRelationship
            
            rels = StudentParentRelationship.objects.select_related('student', 'parent', 'student__class_obj', 'student__section').order_by('student__class_obj__name', 'student__section__name', 'student__roll_number')
            
            for r in rels:
                s = r.student
                p = r.parent
                writer.writerow([
                    f"{s.first_name} {s.last_name}",
                    s.class_obj.name if s.class_obj else '',
                    s.section.name if s.section else '',
                    s.roll_number,
                    f"{p.first_name} {p.last_name}",
                    p.phone,
                    r.relationship
                ])
             
        else:
            return Response({"error": "Invalid type"}, status=400)
            
        return response
