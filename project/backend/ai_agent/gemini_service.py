"""
Gemini AI Service - Intelligent farm conversation and analysis
Uses Google Gemini with round-robin key rotation for optimal rate limits
"""
import google.generativeai as genai
import logging
from typing import Optional, Dict, Any
from decouple import config

logger = logging.getLogger(__name__)


class GeminiAIService:
    """
    Google Gemini AI service for intelligent farm conversations
    Provides contextual responses about farm profitability, recommendations, and strategies
    Uses round-robin rotation for API keys to maximize free tier usage
    """
    
    # Load Gemini API keys from environment variable (comma-separated list)
    _keys_str = config('GEMINI_API_KEYS', default='')
    GEMINI_API_KEYS = [k.strip() for k in _keys_str.split(',') if k.strip()]
    
    # Fallback to empty list gracefully if no keys found
    if not GEMINI_API_KEYS:
        logger.warning("No Gemini API keys found in environment variables (GEMINI_API_KEYS)")
    
    _key_index = 0  # Class variable for round-robin rotation
    
    def __init__(self):
        # Get next API key using round-robin rotation
        api_key = self.get_gemini_api_key()
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash')
        self.conversation_history = []
    
    @classmethod
    def get_gemini_api_key(cls):
        """Get next API key in round-robin rotation"""
        if not cls.GEMINI_API_KEYS:
            raise ValueError("No Gemini API keys configured. Please add GEMINI_API_KEYS to your .env file.")
            
        key = cls.GEMINI_API_KEYS[cls._key_index]
        cls._key_index = (cls._key_index + 1) % len(cls.GEMINI_API_KEYS)
        return key
    
    def create_farm_context(self, farm_data: Dict[str, Any]) -> str:
        """Create system prompt with farm context"""
        metrics = farm_data.get('metrics', {})
        recommendations = farm_data.get('recommendations', [])
        
        context = f"""You are an expert agricultural AI advisor for TerraTrack Farm Management System.
You have access to this farm's data:

FARM METRICS:
- Total Expenses: ${metrics.get('total_expenses', 0):,.2f}
- Total Revenue: ${metrics.get('total_revenue', 0):,.2f}
- Profit: ${metrics.get('profit', 0):,.2f}
- Profit Margin: {metrics.get('profit_margin_percent', 0):.1f}%
- Total Animals: {metrics.get('total_animals', 0)}
- High Cost Categories: {', '.join([c.get('category', 'Unknown') for c in metrics.get('high_cost_categories', [])])}

AI RECOMMENDATIONS IDENTIFIED:
{chr(10).join([f"• {r.get('title', '')}: {r.get('description', '')} (Priority: {r.get('priority', '')}) - {r.get('savings', r.get('impact', ''))}" for r in recommendations[:5]])}

You are helpful, knowledgeable, and provide specific, actionable advice based on the farm's data.
When answering questions about costs, profitability, or optimization, reference the actual farm metrics.
Be conversational and ask clarifying questions when needed.
Provide detailed explanations for all recommendations.
Focus on practical, immediately implementable solutions."""
        
        return context
    
    def chat(self, user_message: str, farm_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Send a message and get AI response with farm context
        
        Args:
            user_message: User's question or message
            farm_data: Optional farm metrics and recommendations for context
        
        Returns:
            Dict with 'response' text and 'status' code
        """
        try:
            # Build context if farm data provided
            if farm_data:
                system_prompt = self.create_farm_context(farm_data)
            else:
                system_prompt = """You are an expert agricultural AI advisor for TerraTrack Farm Management System.
Provide helpful, practical advice about farm management, profitability, and optimization."""
            
            # Add user message to history
            self.conversation_history.append({
                'role': 'user',
                'parts': [user_message]
            })
            
            # Build full prompt with history
            full_prompt = system_prompt + "\n\n"
            for msg in self.conversation_history:
                if msg['role'] == 'user':
                    full_prompt += f"User: {msg['parts'][0]}\n"
                else:
                    full_prompt += f"Assistant: {msg['parts'][0]}\n"
            
            logger.info(f"Sending prompt to Gemini (length: {len(full_prompt)})")
            
            # Get response using google.generativeai API
            response = self.model.generate_content(full_prompt)
            ai_response = response.text
            
            logger.info(f"Got response from Gemini: {len(ai_response)} chars")
            
            # Add to history
            self.conversation_history.append({
                'role': 'assistant',
                'parts': [ai_response]
            })
            
            return {
                'status': 'success',
                'response': ai_response,
                'error': None
            }
        
        except Exception as e:
            error_msg = f"AI Service Error: {str(e)}"
            logger.error(error_msg, exc_info=True)
            return {
                'status': 'error',
                'response': None,
                'error': error_msg
            }
    
    def analyze_recommendation(self, recommendation_title: str, farm_data: Dict[str, Any]) -> str:
        """
        Provide detailed analysis of a specific recommendation
        
        Args:
            recommendation_title: The recommendation to analyze
            farm_data: Farm metrics and data
        
        Returns:
            Detailed explanation of the recommendation
        """
        prompt = f"""The user wants more details about this farm recommendation: "{recommendation_title}"

Farm Data:
{str(farm_data)}

Provide a detailed, actionable explanation of:
1. Why this recommendation is important for this specific farm
2. Step-by-step implementation plan
3. Expected timeline and results
4. Potential challenges and how to overcome them
5. Resources or tools needed"""
        
        response = self.model.generate_content(prompt)
        return response.text
