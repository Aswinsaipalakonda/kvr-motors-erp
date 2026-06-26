from django.utils import timezone
from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import Attendance
from .serializers import AttendanceSerializer
from config.cache import CacheResponseMixin

class AttendanceViewSet(CacheResponseMixin, viewsets.ModelViewSet):
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        # 1. Owners and Admins see all logs
        if user.role in ['owner', 'admin'] or user.is_staff:
            return Attendance.objects.all()
            
        # 2. Branch Supervisors see logs of their branch staff + their own logs
        elif user.role == 'supervisor':
            branch_users_q = Q(
                user__branch=user.branch, 
                user__role__in=['staff', 'sales', 'sales_executive', 'telecaller']
            )
            own_q = Q(user=user)
            return Attendance.objects.filter(branch_users_q | own_q)
            
        # 3. Regular employees only see their own logs
        return Attendance.objects.filter(user=user)

    def perform_create(self, serializer):
        user = self.request.user
        today = timezone.localdate()
        
        # Check if already checked in today
        if Attendance.objects.filter(user=user, date=today).exists():
            raise serializers.ValidationError({"detail": "You have already checked in for today."})
        
        try:
            serializer.save(user=user, date=today, check_in=timezone.now(), status='pending')
            self.clear_cache()
        except Exception as e:
            raise serializers.ValidationError({"detail": str(e)})

    @action(detail=True, methods=['patch', 'post'], url_path='verify')
    def verify_attendance(self, request, pk=None):
        attendance = self.get_object()
        user = request.user
        
        # Determine permission authorization
        is_authorized = False
        
        if user.role in ['owner', 'admin'] or user.is_staff:
            is_authorized = True
        elif user.role == 'supervisor':
            # Supervisor can verify branch staff, sales, telecallers (exclude supervisors & owners)
            if (attendance.user.branch == user.branch and 
                attendance.user.role in ['staff', 'sales', 'sales_executive', 'telecaller']):
                is_authorized = True

        if not is_authorized:
            return Response(
                {"detail": "You do not have permission to verify this attendance record."},
                status=status.HTTP_403_FORBIDDEN
            )

        new_status = request.data.get('status')
        if new_status not in ['verified', 'rejected']:
            return Response(
                {"detail": "Invalid status. Must be 'verified' or 'rejected'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        remarks = request.data.get('remarks', '')
        
        attendance.status = new_status
        attendance.verified_by = user
        attendance.verified_at = timezone.now()
        attendance.remarks = remarks
        attendance.save()
        self.clear_cache()

        serializer = self.get_serializer(attendance)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='bulk-verify')
    def bulk_verify_attendance(self, request):
        ids = request.data.get('ids', [])
        new_status = request.data.get('status')
        remarks = request.data.get('remarks', '')
        user = request.user

        if new_status not in ['verified', 'rejected']:
            return Response(
                {"detail": "Invalid status. Must be 'verified' or 'rejected'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not ids:
            return Response(
                {"detail": "No attendance IDs provided."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Retrieve records
        queryset = self.get_queryset().filter(id__in=ids, status='pending')
        updated_count = 0

        for attendance in queryset:
            is_authorized = False
            if user.role in ['owner', 'admin'] or user.is_staff:
                is_authorized = True
            elif user.role == 'supervisor':
                if (attendance.user.branch == user.branch and 
                    attendance.user.role in ['staff', 'sales', 'sales_executive', 'telecaller']):
                    is_authorized = True

            if is_authorized:
                attendance.status = new_status
                attendance.verified_by = user
                attendance.verified_at = timezone.now()
                attendance.remarks = remarks
                attendance.save()
                updated_count += 1

        if updated_count > 0:
            self.clear_cache()

        return Response(
            {"detail": f"Successfully updated {updated_count} attendance records."},
            status=status.HTTP_200_OK
        )

