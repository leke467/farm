"""
Custom validators for Terra Track
"""
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import datetime
from farms.models import Farm, FarmMember


class DateValidator:
    """Validators for date fields"""
    
    @staticmethod
    def validate_not_future_date(value):
        """Birth date, purchase date, etc. cannot be in future"""
        if value > timezone.now().date():
            raise ValidationError("Date cannot be in the future")
    
    @staticmethod
    def validate_date_range(start_date, end_date):
        """Start date must be before end date"""
        if start_date >= end_date:
            raise ValidationError("Start date must be before end date")
    
    @staticmethod
    def validate_planted_before_harvest(planted_date, expected_harvest_date):
        """Crop planted date must be before harvest date"""
        if planted_date >= expected_harvest_date:
            raise ValidationError("Planting date must be before expected harvest date")


class NumberValidator:
    """Validators for numeric fields"""
    
    @staticmethod
    def validate_positive(value):
        """Value must be greater than 0"""
        if value is not None and float(value) <= 0:
            raise ValidationError("Value must be greater than 0")
    
    @staticmethod
    def validate_non_negative(value):
        """Value must be >= 0"""
        if value is not None and float(value) < 0:
            raise ValidationError("Value cannot be negative")
    
    @staticmethod
    def validate_quantity_sufficient(available, needed):
        """Check if quantity is sufficient"""
        if available < needed:
            raise ValidationError(f"Insufficient quantity. Available: {available}")


class FarmValidator:
    """Validators for farm-related fields"""
    
    @staticmethod
    def validate_user_is_farm_member(farm_id, user):
        """Check if user is member of farm"""
        if not Farm.objects.filter(
            id=farm_id,
            members__user=user
        ).exists() and not Farm.objects.filter(
            id=farm_id,
            owner=user
        ).exists():
            raise ValidationError("You are not a member of this farm")
    
    @staticmethod
    def validate_farm_member_role(farm, user, required_role='manager'):
        """Check if user has required role in farm"""
        member = FarmMember.objects.filter(farm=farm, user=user).first()
        if member and member.role == 'viewer':
            raise ValidationError(f"You need {required_role} role to perform this action")
        if not member and farm.owner != user:
            raise ValidationError("You do not have permission to access this resource")


class StringValidator:
    """Validators for string fields"""
    
    @staticmethod
    def validate_not_empty(value):
        """String value cannot be empty or whitespace"""
        if not value or not str(value).strip():
            raise ValidationError("This field cannot be empty")
    
    @staticmethod
    def validate_min_length(value, min_length):
        """String must be at least min_length characters"""
        if len(str(value)) < min_length:
            raise ValidationError(f"Minimum {min_length} characters required")
    
    @staticmethod
    def validate_max_length(value, max_length):
        """String cannot exceed max_length characters"""
        if len(str(value)) > max_length:
            raise ValidationError(f"Maximum {max_length} characters allowed")


class AnimalValidator:
    """Validators specific to animals"""
    
    @staticmethod
    def validate_animal_birth_date(birth_date):
        """Animal birth date cannot be in future"""
        if birth_date and birth_date > timezone.now().date():
            raise ValidationError("Birth date cannot be in the future")
    
    @staticmethod
    def validate_animal_weight(weight):
        """Animal weight must be positive and reasonable"""
        if weight is not None:
            if float(weight) <= 0:
                raise ValidationError("Weight must be greater than 0")
            if float(weight) > 5000:  # Reasonable upper limit
                raise ValidationError("Weight seems unreasonably high")
    
    @staticmethod
    def validate_animal_group_count(count):
        """Group animal count must be at least 2"""
        if count is not None and int(count) < 2:
            raise ValidationError("Group must have at least 2 animals")


class CropValidator:
    """Validators specific to crops"""
    
    @staticmethod
    def validate_crop_area(area):
        """Crop area must be positive"""
        if area is not None and float(area) <= 0:
            raise ValidationError("Area must be greater than 0")
    
    @staticmethod
    def validate_crop_dates(planted_date, expected_harvest_date, actual_harvest_date=None):
        """Validate crop date sequence"""
        if planted_date >= expected_harvest_date:
            raise ValidationError("Planted date must be before expected harvest date")
        
        if actual_harvest_date:
            if actual_harvest_date < planted_date:
                raise ValidationError("Actual harvest date must be after planting date")
            if actual_harvest_date > timezone.now().date():
                raise ValidationError("Actual harvest date cannot be in future")


class ExpenseValidator:
    """Validators specific to expenses"""
    
    @staticmethod
    def validate_expense_amount(amount):
        """Expense amount must be positive"""
        if amount is not None and float(amount) <= 0:
            raise ValidationError("Amount must be greater than 0")
    
    @staticmethod
    def validate_expense_date(date):
        """Expense date cannot be in future"""
        if date > timezone.now().date():
            raise ValidationError("Expense date cannot be in the future")


class TaskValidator:
    """Validators specific to tasks"""
    
    @staticmethod
    def validate_task_due_date(due_date, created_at=None):
        """Task due date should be in future"""
        if due_date < timezone.now():
            # Allow past dates but warn
            pass  # Changed to allow editing completed tasks
    
    @staticmethod
    def validate_task_assigned_to_farm_member(farm, assigned_user):
        """Assigned user must be a member of the farm"""
        if assigned_user and not FarmMember.objects.filter(
            farm=farm,
            user=assigned_user
        ).exists() and farm.owner != assigned_user:
            raise ValidationError("Assigned user is not a member of this farm")


class InventoryValidator:
    """Validators specific to inventory"""
    
    @staticmethod
    def validate_inventory_quantity(quantity):
        """Quantity must be non-negative"""
        if quantity is not None and float(quantity) < 0:
            raise ValidationError("Quantity cannot be negative")
    
    @staticmethod
    def validate_min_quantity(quantity, min_quantity):
        """Min quantity must be less than current quantity"""
        if min_quantity is not None and quantity is not None:
            if float(min_quantity) > float(quantity):
                raise ValidationError("Minimum quantity cannot be greater than current quantity")
    
    @staticmethod
    def validate_expiry_date(expiry_date, purchase_date=None):
        """Expiry date must be after purchase date"""
        if expiry_date and purchase_date:
            if expiry_date <= purchase_date:
                raise ValidationError("Expiry date must be after purchase date")
    
    @staticmethod
    def validate_cost_per_unit(cost_per_unit):
        """Cost must be non-negative"""
        if cost_per_unit is not None and float(cost_per_unit) < 0:
            raise ValidationError("Cost cannot be negative")

class HealthAlertValidator:
    """Validators specific to health alerts and vaccinations"""
    
    @staticmethod
    def validate_vaccination_dates(scheduled_date, completed_date=None):
        """Validate vaccination dates"""
        today = timezone.now().date()
        
        if completed_date and completed_date > today:
            raise ValidationError("Completed date cannot be in the future")
        
        if completed_date and completed_date > scheduled_date:
            # Completed date should not be much after scheduled date
            pass  # Allow flexibility
    
    @staticmethod
    def validate_breeding_dates(breeding_date, expected_delivery):
        """Validate breeding calendar dates"""
        if expected_delivery and expected_delivery <= breeding_date:
            raise ValidationError("Expected delivery date must be after breeding date")
    
    @staticmethod
    def validate_health_alert_priority(priority):
        """Validate alert priority"""
        valid_priorities = ['low', 'medium', 'high', 'critical']
        if priority not in valid_priorities:
            raise ValidationError(f"Priority must be one of: {', '.join(valid_priorities)}")
    
    @staticmethod
    def validate_health_alert_status(status):
        """Validate alert status"""
        valid_statuses = ['active', 'acknowledged', 'resolved']
        if status not in valid_statuses:
            raise ValidationError(f"Status must be one of: {', '.join(valid_statuses)}")