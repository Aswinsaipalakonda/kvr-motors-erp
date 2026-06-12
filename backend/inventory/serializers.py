from rest_framework import serializers
from .models import StockTransfer
from vehicles.models import VehicleUnit
import datetime
import random
from users.models import User
from .notifications import send_expo_push_notification

class StockTransferSerializer(serializers.ModelSerializer):
    vin_number = serializers.CharField(source='vehicle_unit.vin_number', read_only=True)
    model_name = serializers.CharField(source='vehicle_unit.model.model_name', read_only=True)
    from_location_name = serializers.CharField(source='from_location.name', read_only=True)
    to_location_name = serializers.CharField(source='to_location.name', read_only=True)
    requester_name = serializers.CharField(source='requested_by.full_name', read_only=True)
    approver_name = serializers.CharField(source='approved_by.full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    from_branch_name = serializers.CharField(source='from_location.branch.name', read_only=True)
    to_branch_name = serializers.CharField(source='to_location.branch.name', read_only=True)
    from_showroom_name = serializers.SerializerMethodField()
    to_showroom_name = serializers.SerializerMethodField()

    def get_from_showroom_name(self, obj):
        return obj.from_location.showroom.name if (obj.from_location and obj.from_location.showroom) else ''

    def get_to_showroom_name(self, obj):
        return obj.to_location.showroom.name if (obj.to_location and obj.to_location.showroom) else ''

    class Meta:
        model = StockTransfer
        fields = '__all__'

    def validate(self, data):
        vehicle_unit = data.get('vehicle_unit')
        from_location = data.get('from_location')
        request = self.context.get('request')
        user = request.user if (request and hasattr(request, 'user')) else None
        
        # 1. On creation, validate from_location matches vehicle unit current location
        if not self.instance:
            if vehicle_unit and from_location and vehicle_unit.location != from_location:
                raise serializers.ValidationError({
                    "from_location": f"Selected vehicle unit is located at '{vehicle_unit.location.name}', not '{from_location.name}'."
                })
            
            if vehicle_unit and vehicle_unit.stock_status != 'available':
                raise serializers.ValidationError({
                    "vehicle_unit": f"Vehicle unit is not available for transfer (current status: {vehicle_unit.get_stock_status_display()})."
                })
        else:
            # Updating a transfer
            old_status = self.instance.status
            new_status = data.get('status', old_status)
            
            if old_status != new_status and user:
                # 1. To approve/reject/dispatch: User must be owner/admin or supervisor of the source showroom/branch
                if new_status in ['approved', 'rejected', 'in_transit']:
                    is_authorized = (
                        user.role in ['owner', 'admin'] or user.is_staff or
                        (user.role == 'supervisor' and (
                            (self.instance.from_location.showroom and user.showroom == self.instance.from_location.showroom.name) or
                            (user.branch == self.instance.from_location.branch.name)
                        ))
                    )
                    if not is_authorized:
                        raise serializers.ValidationError({
                            "status": "You are not authorized to approve/reject transfer requests originating from another branch/showroom."
                        })
                
                # 2. To mark as received: User must be owner/admin or supervisor of the target showroom/branch
                elif new_status == 'received':
                    is_authorized = (
                        user.role in ['owner', 'admin'] or user.is_staff or
                        (user.role == 'supervisor' and (
                            (self.instance.to_location.showroom and user.showroom == self.instance.to_location.showroom.name) or
                            (user.branch == self.instance.to_location.branch.name)
                        ))
                    )
                    if not is_authorized:
                        raise serializers.ValidationError({
                            "status": "You are not authorized to mark this transfer as received (only target branch supervisors can receive it)."
                        })
        return data

    def create(self, validated_data):
        if not validated_data.get('transfer_id'):
            validated_data['transfer_id'] = f"TRF-{datetime.date.today().strftime('%Y')}-{random.randint(10000, 99999)}"
            
        instance = super().create(validated_data)
        
        # Dispatch push notification to source supervisors
        try:
            from_location = instance.from_location
            supervisors = User.objects.filter(role='supervisor', is_active=True)
            if from_location.showroom:
                supervisors = supervisors.filter(showroom=from_location.showroom.name)
            else:
                supervisors = supervisors.filter(branch=from_location.branch.name)
                
            tokens = [u.expo_push_token for u in supervisors if u.expo_push_token]
            if tokens:
                vehicle_desc = f"{instance.vehicle_unit.model.brand.name} {instance.vehicle_unit.model.model_name}"
                if instance.vehicle_unit.color:
                    vehicle_desc += f" ({instance.vehicle_unit.color})"
                
                requester_name = instance.requested_by.full_name or instance.requested_by.username
                
                title = "New Vehicle Request 🚗"
                body = f"{requester_name} has requested {vehicle_desc} from your location."
                
                send_expo_push_notification(
                    tokens=tokens,
                    title=title,
                    body=body,
                    data={
                        "type": "stock_transfer_requested",
                        "transfer_id": instance.id,
                        "code": instance.transfer_id
                    }
                )
        except Exception as e:
            # Silently catch notification failures to ensure transaction completes
            import logging
            logging.getLogger(__name__).error(f"Failed to trigger transfer request notification: {e}")
            
        return instance

    def update(self, instance, validated_data):
        request = self.context.get('request')
        current_user = request.user if (request and hasattr(request, 'user')) else None
        
        old_status = instance.status
        new_status = validated_data.get('status', old_status)
        
        # If transitioning from pending to approved/rejected/in_transit, record who approved it
        if old_status == 'pending' and new_status in ['approved', 'rejected', 'in_transit'] and current_user:
            instance.approved_by = current_user
        
        # Save modifications
        instance = super().update(instance, validated_data)
        
        # Synchronize vehicle unit status and location fields
        if old_status != new_status:
            vu = instance.vehicle_unit
            
            if new_status in ['approved', 'in_transit']:
                vu.stock_status = 'in_transit'
                vu.save()
            elif new_status == 'received':
                # Complete the transfer
                vu.location = instance.to_location
                vu.branch = instance.to_location.branch
                if instance.to_location.showroom:
                    vu.showroom = instance.to_location.showroom
                vu.stock_status = 'available'
                vu.save()
            elif new_status in ['rejected', 'cancelled']:
                vu.stock_status = 'available'
                vu.save()
                
            # Send push notifications on status change
            try:
                vehicle_desc = f"{instance.vehicle_unit.model.brand.name} {instance.vehicle_unit.model.model_name}"
                if instance.vehicle_unit.color:
                    vehicle_desc += f" ({instance.vehicle_unit.color})"
                    
                if new_status == 'approved':
                    title = "Request Approved! ✅"
                    body = f"Your request for {vehicle_desc} has been approved."
                    tokens = [instance.requested_by.expo_push_token] if instance.requested_by.expo_push_token else []
                    send_expo_push_notification(tokens, title, body, data={"type": "stock_transfer_approved", "transfer_id": instance.id})
                    
                elif new_status == 'in_transit':
                    title = "Vehicle Dispatched! 🚚"
                    body = f"Vehicle {vehicle_desc} is now in transit."
                    tokens = [instance.requested_by.expo_push_token] if instance.requested_by.expo_push_token else []
                    send_expo_push_notification(tokens, title, body, data={"type": "stock_transfer_in_transit", "transfer_id": instance.id})
                    
                elif new_status == 'rejected':
                    title = "Request Rejected ❌"
                    body = f"Your request for {vehicle_desc} was rejected."
                    tokens = [instance.requested_by.expo_push_token] if instance.requested_by.expo_push_token else []
                    send_expo_push_notification(tokens, title, body, data={"type": "stock_transfer_rejected", "transfer_id": instance.id})
                    
                elif new_status == 'received' and instance.approved_by:
                    title = "Vehicle Received! 🎉"
                    body = f"The {vehicle_desc} has been received at the destination location."
                    tokens = [instance.approved_by.expo_push_token] if instance.approved_by.expo_push_token else []
                    send_expo_push_notification(tokens, title, body, data={"type": "stock_transfer_received", "transfer_id": instance.id})
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(f"Failed to trigger transfer update notification: {e}")
                
        return instance
