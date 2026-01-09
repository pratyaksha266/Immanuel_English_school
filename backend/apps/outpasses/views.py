from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Outpass, Approval
from .serializers import (
    OutpassSerializer, DashboardOutpassSerializer, 
    FeePendingSerializer, MeetingSerializer, VacateSerializer
)
from apps.users.models import User
from apps.notifications.utils import send_sms
import uuid
import datetime
import logging

logger = logging.getLogger(__name__)

class OutpassViewSet(viewsets.ModelViewSet):
    serializer_class = OutpassSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == User.Roles.PARENT:
            return Outpass.objects.filter(
                student__parent_relationships__parent=user
            ).distinct().order_by('-created_at')
        return Outpass.objects.all()

    def perform_create(self, serializer):
        serializer.save(parent=self.request.user)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        outpass = self.get_object()
        cancellable_statuses = [
            Outpass.Status.PENDING, 
            Outpass.Status.FEE_PENDING, 
            Outpass.Status.APPROVED, 
            Outpass.Status.MEETING,
            Outpass.Status.READY_FOR_EXIT
        ]
        if outpass.status in cancellable_statuses:
            outpass.status = Outpass.Status.CANCELLED
            outpass.save()
            return Response({'status': 'outpass cancelled'})
        return Response({'error': f'cannot cancel outpass in {outpass.status} status'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        from apps.students.models import Student
        from django.db.models import Count
        from datetime import timedelta
        
        # Simple stats implementation
        total_students = Student.objects.count()
        active_outpasses = Outpass.objects.filter(status='OUT').count()
        pending_approvals = Outpass.objects.filter(status=Outpass.Status.PENDING).count()
        overdue_returns = Outpass.objects.filter(status='OUT', expected_return_date__lt=timezone.now().date()).count()
        
        # Empty trends for now to keep it simple or implement if needed
        return Response({
            'total_students': total_students,
            'active_outpasses': active_outpasses,
            'pending_approvals': pending_approvals,
            'overdue_returns': overdue_returns,
            'trends': []
        })


class StaffDashboardViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = DashboardOutpassSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        role = user.role
        queryset = Outpass.objects.all()

        if self.action != 'list':
            return queryset

        print(f"StaffDashboard List Request - User: {user.phone}, Role: {role}")

        status_param = self.request.query_params.get('status')
        date_param = self.request.query_params.get('date')
        priority_param = self.request.query_params.get('priority')
        history_param = self.request.query_params.get('history')
        search_param = self.request.query_params.get('search')

        class_name = self.request.query_params.get('class_name')
        section = self.request.query_params.get('section')
        roll_no = self.request.query_params.get('roll_no')
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')

        if status_param:
            status_param = status_param.lower()

        # Handle Search first if provided
        if search_param:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(student__first_name__icontains=search_param) |
                Q(student__last_name__icontains=search_param) |
                Q(student__roll_number__icontains=search_param) |
                Q(student__class_obj__name__icontains=search_param) |
                Q(student__section__name__icontains=search_param) |
                Q(student__hostel__name__icontains=search_param)
            )

        # Precise Filters
        if class_name:
            queryset = queryset.filter(student__class_obj__name__iexact=class_name)
        if section:
            queryset = queryset.filter(student__section__name__iexact=section)
        if roll_no:
            queryset = queryset.filter(student__roll_number__icontains=roll_no)
        if start_date:
            queryset = queryset.filter(outgoing_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(outgoing_date__lte=end_date)

        # Common Filters
        if priority_param == 'true':
            return queryset.filter(is_priority=True).exclude(status__in=[Outpass.Status.COMPLETED, Outpass.Status.CANCELLED, Outpass.Status.REJECTED]).order_by('-created_at')

        if history_param == 'true' and not status_param:
            return queryset.order_by('-created_at')

        if status_param == 'returned':
            queryset = queryset.filter(status=Outpass.Status.COMPLETED)
            if date_param:
                queryset = queryset.filter(actual_return_date__date=date_param)
            return queryset.order_by('-actual_return_date')
        
        elif status_param == 'not_returned':
            queryset = queryset.filter(status__in=[Outpass.Status.CHECKED_OUT, Outpass.Status.OVERDUE])
            if date_param:
                queryset = queryset.filter(expected_return_date=date_param)
            return queryset.order_by('expected_return_date')
        
        elif status_param == 'approved':
            return queryset.filter(status=Outpass.Status.APPROVED).order_by('-updated_at')
        
        elif status_param == 'meeting':
            return queryset.filter(status=Outpass.Status.MEETING).order_by('meeting_date')
        
        elif status_param == 'pending':
            return queryset.filter(status__in=[Outpass.Status.PENDING, Outpass.Status.FEE_PENDING]).order_by('outgoing_date')

        # Role-based default views
        if role == User.Roles.ACCOUNTANT:
            # Accountant dashboard: pending fee tasks
            if not status_param and not search_param:
                return queryset.filter(
                    status__in=[Outpass.Status.PENDING, Outpass.Status.FEE_PENDING]
                ).order_by('outgoing_date')
            return queryset # Return filtered queryset if params were present
        
        elif role == User.Roles.HM:
            if not status_param and not search_param:
                return queryset.filter(
                    status__in=[Outpass.Status.PENDING, Outpass.Status.FEE_PENDING]
                ).order_by('outgoing_date')
            return queryset

        if role == User.Roles.WARDEN:
            if hasattr(user, 'staff_profile') and user.staff_profile.assigned_hostel:
                queryset = queryset.filter(student__hostel=user.staff_profile.assigned_hostel)
            
            # Apply dashboard filters only for list action
            if self.action == 'list':
                if status_param == 'in_hostel':
                    return queryset.filter(status=Outpass.Status.APPROVED).order_by('outgoing_date')
                elif status_param == 'checked_out':
                    return queryset.filter(status=Outpass.Status.READY_FOR_EXIT).order_by('-updated_at')
                elif status_param == 'outside':
                    return queryset.filter(status__in=[Outpass.Status.CHECKED_OUT, Outpass.Status.OVERDUE]).order_by('-checkout_time')
                elif not status_param and not search_param:
                    # Default for Warden: Today's pending departures and recent checkouts
                    today = timezone.now().date()
                    return queryset.filter(
                        status__in=[Outpass.Status.APPROVED, Outpass.Status.READY_FOR_EXIT],
                        outgoing_date=today
                    ).order_by('outgoing_date')
            return queryset

        elif role == User.Roles.GATE_STAFF:
            return queryset.filter(
                status__in=[Outpass.Status.READY_FOR_EXIT, Outpass.Status.CHECKED_OUT]
            ).order_by('-updated_at')
        
        return queryset.order_by('-created_at')

    @action(detail=True, methods=['post'], url_path='hm/reject')
    def hm_reject(self, request, pk=None):
        try:
            print(f"DEBUG: HM Reject Request by {request.user.phone} for Outpass {pk}")
            
            if request.user.role not in [User.Roles.HM, User.Roles.ADMIN]:
                return Response({'error': 'Only HM or Admin can perform this action'}, status=status.HTTP_403_FORBIDDEN)
            
            reason = request.data.get('reason', 'No reason provided')
            outpass = self.get_object()
            outpass.status = Outpass.Status.REJECTED
            outpass.save()
            
            Approval.objects.update_or_create(
                outpass=outpass,
                approver_role=User.Roles.HM,
                defaults={
                    'approver': request.user,
                    'status': Approval.Status.REJECTED,
                    'comments': reason
                }
            )
            
            # Notify Parent
            student_name = f"{outpass.student.first_name} {outpass.student.last_name}"
            parent_phone = outpass.parent.phone
            msg = f"Immanuel English School: The outpass for {student_name} is REJECTED. Reason: {reason}"
            
            success, result = send_sms(parent_phone, msg)
            print(f"DEBUG SMS: HM Reject attempt to {parent_phone}. Success: {success}, Result: {result}")
            
            return Response({'status': 'rejected by HM', 'sms_sent': success})
            
        except Exception as e:
            logger.exception(f"Error in hm_reject for outpass {pk}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], url_path='accountant/approve')
    def accountant_approve(self, request, pk=None):
        if request.user.role != User.Roles.ACCOUNTANT:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        outpass = self.get_object()
        outpass.fee_paid = True
        outpass.fee_paid_at = timezone.now()
        if outpass.status == Outpass.Status.FEE_PENDING:
            outpass.status = Outpass.Status.PENDING
        outpass.save()
        
        Approval.objects.update_or_create(
            outpass=outpass,
            approver_role=User.Roles.ACCOUNTANT,
            defaults={
                'approver': request.user,
                'status': Approval.Status.APPROVED
            }
        )
        return Response({'status': 'fee marked paid'})

    @action(detail=True, methods=['post'], url_path='accountant/fee-pending')
    def mark_fee_pending(self, request, pk=None):
        if request.user.role != User.Roles.ACCOUNTANT:
           return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        outpass = self.get_object()
        serializer = FeePendingSerializer(data=request.data)
        if serializer.is_valid():
            outpass.fee_due = serializer.validated_data['amount']
            outpass.status = Outpass.Status.FEE_PENDING
            outpass.save()
            return Response({'status': 'marked as fee pending'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='hm/approve')
    def hm_approve(self, request, pk=None):
        try:
            print(f"DEBUG: HM Approval Request by {request.user.phone} (Role: {request.user.role}) for Outpass {pk}")
            
            if request.user.role not in [User.Roles.HM, User.Roles.ADMIN]:
                print(f"DEBUG: Permission Denied. Role {request.user.role} is not HM or ADMIN")
                return Response({'error': 'Only HM or Admin can perform this action'}, status=status.HTTP_403_FORBIDDEN)
            
            outpass = self.get_object()
            print(f"DEBUG: Found outpass {outpass.id} for student {outpass.student.first_name}")
            
            # Update status
            outpass.status = Outpass.Status.APPROVED
            outpass.save()
            print(f"DEBUG: Outpass status updated to APPROVED")

            # Create or update approval record
            Approval.objects.update_or_create(
                outpass=outpass,
                approver_role=User.Roles.HM,
                defaults={
                    'approver': request.user,
                    'status': Approval.Status.APPROVED
                }
            )
            print(f"DEBUG: Approval record created/updated")
            
            # Notify Parent
            student_name = f"{outpass.student.first_name} {outpass.student.last_name}"
            parent_phone = outpass.parent.phone
            msg = f"Immanuel English School: The outpass for {student_name} is APPROVED. You will receive an exit code once the Warden clears the departure."
            
            success, result = send_sms(parent_phone, msg)
            print(f"DEBUG SMS: HM Approval attempt to {parent_phone}. Success: {success}, Result: {result}")
            
            return Response({'status': 'approved by HM', 'sms_sent': success})
            
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            print(f"CRITICAL ERROR in hm_approve: {str(e)}\n{error_trace}")
            logger.exception(f"Error in hm_approve for outpass {pk}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], url_path='hm/meeting')
    def call_meeting(self, request, pk=None):
        try:
            print(f"DEBUG: HM Meeting Request by {request.user.phone} for Outpass {pk}")
            
            if request.user.role not in [User.Roles.HM, User.Roles.ADMIN]:
                return Response({'error': 'Only HM or Admin can perform this action'}, status=status.HTTP_403_FORBIDDEN)
            
            outpass = self.get_object()
            serializer = MeetingSerializer(data=request.data)
            
            if serializer.is_valid():
                outpass.meeting_scheduled = True
                outpass.meeting_date = serializer.validated_data['date']
                outpass.meeting_venue = serializer.validated_data['venue']
                outpass.meeting_notes = serializer.validated_data.get('reason', '')
                outpass.status = Outpass.Status.MEETING
                outpass.save()
                
                # Notify Parent
                student_name = f"{outpass.student.first_name} {outpass.student.last_name}"
                parent_phone = outpass.parent.phone
                msg = f"Immanuel English School: Meeting scheduled for {student_name}. Date: {outpass.meeting_date.strftime('%Y-%m-%d %H:%M')}, Venue: {outpass.meeting_venue}."
                
                success, result = send_sms(parent_phone, msg)
                print(f"DEBUG SMS: HM Meeting attempt to {parent_phone}. Success: {success}, Result: {result}")
                
                return Response({'status': 'meeting scheduled', 'sms_sent': success})
                
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.exception(f"Error in call_meeting for outpass {pk}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], url_path='mark-returned')
    def mark_returned(self, request, pk=None):
        if request.user.role not in [User.Roles.HM, User.Roles.WARDEN]:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        outpass = self.get_object()
        outpass.status = Outpass.Status.COMPLETED
        outpass.actual_return_date = timezone.now()
        outpass.save()
        
        return Response({'status': f'Marked as returned by {request.user.role}'})



    @action(detail=True, methods=['post'], url_path='warden/reject')
    def warden_reject(self, request, pk=None):
        if request.user.role != User.Roles.WARDEN:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        reason = request.data.get('reason', 'Rejected by Warden')
        outpass = self.get_object()
        outpass.status = Outpass.Status.REJECTED
        outpass.save()

        Approval.objects.update_or_create(
            outpass=outpass,
            approver_role=User.Roles.WARDEN,
            defaults={
                'approver': request.user,
                'status': Approval.Status.REJECTED,
                'comments': reason
            }
        )
        return Response({'status': 'rejected by Warden'})

    @action(detail=True, methods=['post'], url_path='gate/checkout')
    def gate_checkout(self, request, pk=None):
        if request.user.role != User.Roles.GATE_STAFF:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        outpass = self.get_object()
        if outpass.status != Outpass.Status.READY_FOR_EXIT:
             return Response({'error': 'Outpass not ready for exit (must be marked by Warden first)'}, status=status.HTTP_400_BAD_REQUEST)
             
        outpass.status = Outpass.Status.CHECKED_OUT
        outpass.checkout_time = timezone.now()
        outpass.checked_out_by = request.user
        outpass.save()

        return Response({
            'status': 'checked out from campus',
            'student_name': outpass.student.first_name,
            'time': outpass.checkout_time
        })

    @action(detail=True, methods=['post'], url_path='hm/cancel-meeting')
    def cancel_meeting(self, request, pk=None):
        if request.user.role != User.Roles.HM:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        outpass = self.get_object()
        outpass.meeting_scheduled = False
        outpass.meeting_date = None
        outpass.meeting_venue = ''
        outpass.meeting_notes = ''
        outpass.status = Outpass.Status.PENDING
        outpass.save()
        
        return Response({'status': 'Meeting cancelled and outpass reverted to pending'})

    @action(detail=False, methods=['get'], url_path='reports')
    def reports(self, request):
        if request.user.role != User.Roles.HM:
             return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
            
        period = request.query_params.get('period', 'daily') # daily, weekly, monthly
        # Mocking analytics data for now
        return Response({
            'period': period,
            'total_outpasses': Outpass.objects.count(),
            'approved': Outpass.objects.filter(status=Outpass.Status.APPROVED).count(),
            'rejected': Outpass.objects.filter(status=Outpass.Status.REJECTED).count(),
            'returned_on_time': Outpass.objects.filter(status=Outpass.Status.COMPLETED).count(),
            'late_returns': Outpass.objects.filter(status=Outpass.Status.OVERDUE).count(),
            'data': [
                {'name': 'Approved', 'value': 40},
                {'name': 'Rejected', 'value': 10},
                {'name': 'Pending', 'value': 20},
                {'name': 'Returned', 'value': 30},
            ]
        })

    @action(detail=True, methods=['post'], url_path='warden_vacate')
    def warden_vacate(self, request, pk=None):
        if request.user.role != User.Roles.WARDEN:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        outpass = self.get_object()
        
        # If already vacated, just return success with the exit code (idempotency)
        if outpass.status == Outpass.Status.READY_FOR_EXIT:
            return Response({'status': 'already vacated', 'exit_code': outpass.exit_code})

        if outpass.status != Outpass.Status.APPROVED:
            return Response({'error': 'Outpass must be APPROVED by HM first'}, status=status.HTTP_400_BAD_REQUEST)
        
        outpass.status = Outpass.Status.READY_FOR_EXIT
        # Generate 6-digit Exit Code (Random digits)
        import random
        outpass.exit_code = str(random.randint(100000, 999999))
        
        photo_url = request.data.get('verification_photo')
        if photo_url:
            outpass.verification_photo = photo_url
            
        outpass.save()
        
        Approval.objects.update_or_create(
            outpass=outpass,
            approver_role=User.Roles.WARDEN,
            defaults={
                'approver': request.user,
                'status': Approval.Status.APPROVED
            }
        )
        
        # Notify Parent with Exit Code
        student_name = f"{outpass.student.first_name} {outpass.student.last_name}"
        parent_phone = outpass.parent.phone
        msg = f"Immanuel English School: {student_name} is cleared to leave. Exit Code: {outpass.exit_code}. Please show this at the gate."
        send_sms(parent_phone, msg)
        
        return Response({'status': 'vacated and exit code generated', 'exit_code': outpass.exit_code})

    @action(detail=False, methods=['post'], url_path='gate/process-code')
    def gate_process_code(self, request):
        if request.user.role != User.Roles.GATE_STAFF:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        code = request.data.get('code')
        if not code:
            return Response({'error': 'Code required'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Try finding as Exit Code (Student Leaving)
        try:
            outpass = Outpass.objects.get(exit_code=code, status=Outpass.Status.READY_FOR_EXIT)
            outpass.status = Outpass.Status.CHECKED_OUT
            outpass.checkout_time = timezone.now()
            outpass.checked_out_by = request.user
            
            # Generate Return Code
            import random
            outpass.return_code = str(random.randint(100000, 999999))
            
            outpass.save()
            return Response({'status': 'Student Checked OUT', 'type': 'EXIT', 'student': outpass.student.first_name, 'return_code': outpass.return_code})
            
        except Outpass.DoesNotExist:
            pass
            
        # Try finding as Return Code (Student Returning)
        try:
            outpass = Outpass.objects.get(return_code=code, status=Outpass.Status.CHECKED_OUT)
            outpass.status = Outpass.Status.COMPLETED
            outpass.actual_return_date = timezone.now()
            outpass.save()
            return Response({'status': 'Student Checked IN (Returned)', 'type': 'ENTRY', 'student': outpass.student.first_name})
            
        except Outpass.DoesNotExist:
             return Response({'error': 'Invalid Code'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        from django.db.models import Count
        from datetime import date, timedelta

        # General stats for Staff
        total_outpasses = Outpass.objects.count()
        pending = Outpass.objects.filter(status=Outpass.Status.PENDING).count()
        approved = Outpass.objects.filter(status=Outpass.Status.APPROVED).count()
        out = Outpass.objects.filter(status=Outpass.Status.CHECKED_OUT).count()
        overdue = Outpass.objects.filter(status=Outpass.Status.OVERDUE).count()

        # Simple trend data (last 7 days)
        last_7_days = []
        for i in range(7):
            day = date.today() - timedelta(days=i)
            count = Outpass.objects.filter(outgoing_date=day).count()
            last_7_days.append({
                'date': day.strftime('%m-%d'),
                'count': count
            })
        
        return Response({
            'total': total_outpasses,
            'pending': pending,
            'approved': approved,
            'active': out,
            'overdue': overdue,
            'trends': last_7_days[::-1] # Reverse to chronological
        })
