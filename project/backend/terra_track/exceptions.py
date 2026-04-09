"""
Custom exception handlers for Terra Track API
"""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    """
    Custom exception handler that returns consistent error responses
    """
    response = exception_handler(exc, context)

    if response is not None:
        # Validation errors
        if response.status_code == status.HTTP_400_BAD_REQUEST:
            if isinstance(response.data, dict):
                if 'detail' in response.data:
                    # Standard Django REST Framework error
                    return response
                # Serializer validation errors
                errors = []
                for field, messages in response.data.items():
                    if isinstance(messages, list):
                        error_message = messages[0] if messages else "Invalid value"
                    else:
                        error_message = str(messages)
                    
                    errors.append({
                        "field": field,
                        "message": error_message
                    })
                
                return Response(
                    {
                        "status": "error",
                        "message": "Validation failed",
                        "errors": errors
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Permission denied
        elif response.status_code == status.HTTP_403_FORBIDDEN:
            return Response(
                {
                    "status": "error",
                    "message": "You don't have permission to perform this action"
                },
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Not found
        elif response.status_code == status.HTTP_404_NOT_FOUND:
            return Response(
                {
                    "status": "error",
                    "message": "Resource not found"
                },
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Server error
        elif response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR:
            return Response(
                {
                    "status": "error",
                    "message": "Internal server error. Please try again later."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    return response
