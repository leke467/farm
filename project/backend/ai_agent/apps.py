"""
Django app for Farm AI Agent
Analyzes farm data and generates recommendations
"""
from django.apps import AppConfig

class AiAgentConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'ai_agent'
    verbose_name = 'AI Agent'
