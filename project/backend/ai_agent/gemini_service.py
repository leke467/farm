"""
Gemini AI Service - Intelligent farm conversation and analysis
Uses Google Gemini with round-robin key rotation for optimal rate limits
"""
try:
    import google.generativeai as genai
    HAS_GENAI = True
except ImportError:
    genai = None
    HAS_GENAI = False

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
    
    # Load Gemini API keys from environment variable (comma-separated list GEMINI_API_KEYS or single GEMINI_API_KEY)
    _keys_str = config('GEMINI_API_KEYS', default='') or config('GEMINI_API_KEY', default='')
    GEMINI_API_KEYS = [k.strip() for k in _keys_str.split(',') if k.strip()]
    
    # Fallback to empty list gracefully if no keys found
    if not GEMINI_API_KEYS:
        logger.warning("No Gemini API keys found in environment variables (GEMINI_API_KEYS or GEMINI_API_KEY)")
    
    _key_index = 0  # Class variable for round-robin rotation
    
    def __init__(self):
        self.conversation_history = []
    
    @classmethod
    def get_gemini_api_key(cls):
        """Get next API key in round-robin rotation"""
        if not cls.GEMINI_API_KEYS:
            return None
        key = cls.GEMINI_API_KEYS[cls._key_index]
        cls._key_index = (cls._key_index + 1) % len(cls.GEMINI_API_KEYS)
        return key
    
    def create_farm_context(self, farm_data: Dict[str, Any]) -> str:
        """Create system prompt with rich farm context"""
        metrics = farm_data.get('metrics', {})
        recommendations = farm_data.get('recommendations', [])
        alerts = farm_data.get('alerts', [])
        
        low_stock_items = [f"{i['name']} ({i['quantity']} {i['unit']})" for i in metrics.get('low_stock_items', [])]
        high_cost_cats = [f"{c['category']}: ${c['amount']:,.2f} ({c['percentage']}%)" for c in metrics.get('high_cost_categories', [])]
        
        context = f"""You are an expert agricultural AI advisor for Livesteads (livesteads.com) Farm Management System.
You have access to real-time, comprehensive data for this farm:

FARM FINANCIAL METRICS:
- Total Expenses: ${metrics.get('total_expenses', 0):,.2f}
- Total Revenue: ${metrics.get('total_revenue', 0):,.2f}
- Net Profit: ${metrics.get('profit', 0):,.2f}
- Profit Margin: {metrics.get('profit_margin_percent', 0):.1f}%
- High Cost Categories: {', '.join(high_cost_cats) if high_cost_cats else 'None'}
- Active Debt Balance: ${metrics.get('total_debt_balance', 0):,.2f} ({metrics.get('active_debts_count', 0)} active loans)

HERD & PRODUCTION METRICS:
- Total Animals: {metrics.get('total_animals', 0)}
- Total Feed Consumed: {metrics.get('total_feed_consumed', 0):,.2f} units
- Overdue Vaccinations: {metrics.get('overdue_vaccines_count', 0)}
- Upcoming Vaccinations (14 days): {metrics.get('upcoming_vaccines_count', 0)}
- Total Medical Cost: ${metrics.get('total_medical_cost', 0):,.2f}
- Upcoming Deliveries (30 days): {metrics.get('upcoming_deliveries_count', 0)}

INVENTORY & SUPPLY CHAIN:
- Items Below Minimum Stock: {metrics.get('low_stock_count', 0)} ({', '.join(low_stock_items) if low_stock_items else 'All stocked'})

ACTIVE SYSTEM ALERTS:
{chr(10).join([f"{a.get('emoji', '•')} {a.get('message', '')}" for a in alerts[:5]]) if alerts else 'No critical alerts.'}

AI RECOMMENDATIONS GENERATED:
{chr(10).join([f"• [{r.get('priority', 'medium').upper()}] {r.get('title', '')}: {r.get('description', '')} -> Action: {r.get('action', '')} (Impact: {r.get('impact', '')})" for r in recommendations[:5]]) if recommendations else 'No pending recommendations.'}

You are helpful, knowledgeable, and provide specific, actionable advice based on exact farm metrics.
When answering questions about costs, profitability, feed, health, or optimization, reference actual farm metrics.
Be conversational, concise, professional, and practical."""
        
        return context
    
    def chat(self, user_message: str, farm_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Send a message and get AI response with farm context.
        Rotates keys on failure to guarantee maximum uptime.
        """
        try:
            # Build context if farm data provided
            if farm_data:
                system_prompt = self.create_farm_context(farm_data)
            else:
                system_prompt = """You are an expert agricultural AI advisor for Livesteads (livesteads.com) Farm Management System.
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
            
            logger.info(f"Sending prompt to AI engine (length: {len(full_prompt)})")
            
            ai_response = None
            if HAS_GENAI and self.GEMINI_API_KEYS:
                max_attempts = len(self.GEMINI_API_KEYS)
                for attempt in range(max_attempts):
                    api_key = self.get_gemini_api_key()
                    try:
                        genai.configure(api_key=api_key)
                        model = genai.GenerativeModel('gemini-1.5-flash')
                        response = model.generate_content(full_prompt)
                        if response and response.text:
                            ai_response = response.text
                            logger.info(f"Successfully generated response with key index {self._key_index}")
                            break
                    except Exception as genai_err:
                        logger.warning(f"Gemini API call failed with key attempt {attempt + 1}/{max_attempts}: {genai_err}")

            if not ai_response:
                ai_response = self._generate_fallback(user_message, farm_data)
            
            logger.info(f"Got response from AI: {len(ai_response)} chars")
            
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

    def _generate_fallback(self, user_message: str, farm_data: Optional[Dict[str, Any]] = None) -> str:
        """Intelligent rule-based fallback response when Gemini key is unconfigured or rate limited."""
        if farm_data:
            metrics = farm_data.get('metrics', {})
            recs = farm_data.get('recommendations', [])
            rev = metrics.get('total_revenue', 0)
            exp = metrics.get('total_expenses', 0)
            margin = metrics.get('profit_margin_percent', 0)
            
            rec_text = ""
            if recs:
                rec_text = f"\n\nTop Recommendation: {recs[0]['title']} — {recs[0]['description']}. Action: {recs[0]['action']}"
            
            return (
                f"Here is your farm performance breakdown:\n"
                f"• Total Revenue: {rev:,.2f}\n"
                f"• Total Expenses: {exp:,.2f}\n"
                f"• Profit Margin: {margin:.1f}%{rec_text}\n\n"
                f"Regarding your query ('{user_message}'): We advise focusing on reducing costs in high-expense categories and ensuring prompt sales tracking to maintain target profit margins."
            )
        return f"Regarding '{user_message}': Efficient farm management requires regular monitoring of feed, crop yields, inventory levels, and financial records."
    
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
