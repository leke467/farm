"""
API Views for AI Agent
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .engine import FarmAIEngine
from .gemini_service import GeminiAIService
from farms.models import Farm

class AIAgentViewSet(viewsets.ViewSet):
    """
    AI Agent API endpoints
    - /api/ai-agent/analyze/ - Full farm analysis
    - /api/ai-agent/recommendations/ - Just recommendations
    - /api/ai-agent/forecast/ - Profitability forecast
    """
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def analyze(self, request):
        """Full farm analysis with all insights"""
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            logger.info("Analyze request received")
            # Get user's active farm
            farm = request.user.owned_farms.first()
            if not farm:
                logger.warning(f"No farm found for user {request.user.id}")
                return Response(
                    {'error': 'No active farm found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            logger.info(f"Running analysis for farm: {farm.id}")
            # Run AI analysis
            ai = FarmAIEngine(farm_id=farm.id, user_id=request.user.id)
            insights = ai.analyze()
            logger.info(f"Analysis complete. Recommendations: {len(insights.get('recommendations', []))}")
            
            return Response(insights, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Analysis error: {str(e)}", exc_info=True)
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def recommendations(self, request):
        """Get only recommendations"""
        try:
            farm = request.user.owned_farms.first()
            if not farm:
                return Response(
                    {'error': 'No active farm found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            ai = FarmAIEngine(farm_id=farm.id, user_id=request.user.id)
            insights = ai.analyze()
            
            return Response({
                'recommendations': insights['recommendations'],
                'total_count': len(insights['recommendations'])
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def alerts(self, request):
        """Get only alerts"""
        try:
            farm = request.user.owned_farms.first()
            if not farm:
                return Response(
                    {'error': 'No active farm found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            ai = FarmAIEngine(farm_id=farm.id, user_id=request.user.id)
            insights = ai.analyze()
            
            return Response({
                'alerts': insights['alerts'],
                'total_count': len(insights['alerts'])
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def forecast(self, request):
        """Get financial forecast"""
        try:
            farm = request.user.owned_farms.first()
            if not farm:
                return Response(
                    {'error': 'No active farm found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            ai = FarmAIEngine(farm_id=farm.id, user_id=request.user.id)
            insights = ai.analyze()
            
            return Response({
                'forecast': insights['forecast'],
                'metrics': insights['metrics']
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def chat(self, request):
        """
        Chat with Gemini AI about farm recommendations
        
        Expected request JSON:
        {
            "message": "Why should I reduce feed costs?",
            "recommendation_title": "Optional - specific recommendation to ask about"
        }
        """
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            logger.info("Chat request received")
            farm = request.user.owned_farms.first()
            if not farm:
                logger.warning(f"No farm found for user {request.user.id}")
                return Response(
                    {'error': 'No active farm found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get user message
            message = request.data.get('message', '').strip()
            if not message:
                return Response(
                    {'error': 'Message cannot be empty'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            logger.info(f"Processing message: {message[:50]}...")
            
            # Get farm analysis context
            ai = FarmAIEngine(farm_id=farm.id, user_id=request.user.id)
            logger.info("Running farm analysis...")
            farm_data = ai.analyze()
            logger.info(f"Farm analysis complete. Found {len(farm_data.get('recommendations', []))} recommendations")
            
            # Get Gemini response
            logger.info("Initializing Gemini service...")
            gemini = GeminiAIService()
            logger.info("Calling Gemini chat...")
            result = gemini.chat(message, farm_data)
            logger.info(f"Gemini response received: {result['status']}")
            
            if result['status'] == 'error':
                logger.error(f"Gemini error: {result['error']}")
                return Response(
                    {'error': result['error']},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            return Response({
                'response': result['response'],
                'status': 'success'
            }, status=status.HTTP_200_OK)
        
        except Exception as e:
            logger.error(f"Chat error: {str(e)}", exc_info=True)
            return Response(
                {'error': f"Chat error: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
