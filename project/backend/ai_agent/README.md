# AI Agent - Farm Profitability Analysis System

## Overview
The AI Agent system provides real-time profitability analysis, recommendations, and financial forecasting for farm operations. It analyzes all farm data (animals, crops, expenses, revenue) and generates intelligent suggestions to optimize profit margins.

## Features

### Core Analysis Modules
1. **Expense Analysis** - Identifies cost structure, high-cost categories, and cost-cutting opportunities
2. **Revenue Analysis** - Tracks revenue streams, calculates profit, and analyzes profitability
3. **Animal Production** - Ranks animals by productivity, identifies high/low performers
4. **Crop Performance** - Compares crop ROI, analyzes yields, recommends portfolio optimization
5. **Financial Forecasting** - Projects 1-month, 1-quarter, 1-year profit forecasts
6. **Alert System** - Identifies warnings, successes, and actionable insights

## Backend Implementation

### Files Created
- `engine.py` - Core AI analysis engine (FarmAIEngine class)
- `views.py` - Django REST Framework viewset with API endpoints
- `serializers.py` - Response serializers for consistent formatting
- `urls.py` - URL routing configuration
- `apps.py` - Django app configuration
- `admin.py` - Django admin configuration
- `models.py` - Django models (currently no database models)

### API Endpoints
The AI service is exposed at `/api/ai-agent/` with the following endpoints:

#### 1. Full Analysis
```
GET /api/ai-agent/analyze/
```
Returns complete farm analysis with recommendations, alerts, metrics, and forecast.

**Response:**
```json
{
  "recommendations": [
    {
      "priority": "high|medium|low",
      "title": "🎯 Recommendation Title",
      "description": "What to do",
      "action": "Specific implementation steps",
      "savings": "Quantified benefit (or 'impact')"
    }
  ],
  "alerts": [
    {
      "type": "warning|success|info",
      "emoji": "⚠️|✅|ℹ️",
      "message": "Alert message"
    }
  ],
  "metrics": {
    "total_expenses": float,
    "total_revenue": float,
    "profit": float,
    "profit_margin_percent": float,
    "high_cost_categories": [array],
    "total_animals": int,
    "high_performers": [array],
    "low_performers": [array],
    "crop_analysis": [array]
  },
  "forecast": {
    "next_month": {"revenue": float, "expenses": float, "profit": float},
    "next_quarter": {"revenue": float, "expenses": float, "profit": float},
    "next_year": {"revenue": float, "expenses": float, "profit": float}
  }
}
```

#### 2. Just Recommendations
```
GET /api/ai-agent/recommendations/
```
Returns only recommendations with count.

#### 3. Just Alerts
```
GET /api/ai-agent/alerts/
```
Returns only alerts with count.

#### 4. Financial Forecast
```
GET /api/ai-agent/forecast/
```
Returns forecast and metrics data.

## Frontend Integration

### Updated Component
**AIAgentPanel.jsx** - Floating AI chat widget that:
- Auto-analyzes on open via backend API
- Displays "Terra AI Suggests" branded section
- Shows live alerts, top opportunities, and action items
- Provides interactive chat for asking about recommendations
- Converts recommendations into clickable queries

### Key Changes
1. `generateInsights()` now calls `GET /api/ai-agent/analyze/`
2. `handleSendMessage()` uses real insights data from backend
3. Responsive AI responses based on actual farm metrics

## Data Sources

The AI engine queries the following Django models:
- `expenses.Expense` - All farm expenses
- `expenses.Revenue` - All income sources
- `animals.Animal` - All animals in the farm
- `animals.ProductionRecord` - Animal production records
- `crops.Crop` - All crops
- `crops.CropYieldAnalysis` - Crop yield and ROI data

## Configuration

### Django Settings
The app is registered in `settings.INSTALLED_APPS`:
```python
INSTALLED_APPS = [
    ...
    'ai_agent',
]
```

### URL Configuration
Added to `terra_track/urls.py`:
```python
path('api/ai-agent/', include('ai_agent.urls')),
```

## How It Works

1. **Frontend Request**: User opens AI panel → calls `GET /api/ai-agent/analyze/`
2. **Backend Processing**: 
   - FarmAIEngine receives farm_id and user_id
   - Queries all farm data from ORM
   - Runs 6 analysis modules sequentially
   - Aggregates data into insights
   - Generates recommendations with priority
3. **Response**: Returns structured JSON with all analysis
4. **UI Display**: AIAgentPanel renders recommendations and enables chat
5. **User Interaction**: Chat responses personalized based on insights data

## Testing

### Test with cURL
```bash
curl -H "Authorization: Token YOUR_TOKEN" \
  http://localhost:8000/api/ai-agent/analyze/
```

### Test with Postman
1. GET http://localhost:8000/api/ai-agent/analyze/
2. Add auth header with your token
3. View full farm analysis

### Test Frontend
1. Open farm app
2. Click AI button (bottom-right)
3. Panel auto-analyzes and shows "Terra AI Suggests"
4. Ask questions like "What are my top profits?" or "How to reduce costs?"

## Error Handling

### No Farm Found
```json
{"error": "No active farm found"}
```
Ensure user is assigned to a farm.

### Empty Data
The engine gracefully handles empty datasets:
- Returns 0 for missing totals
- Skips analysis for missing data
- Returns empty arrays for no recommendations

## Future Enhancements

1. **Machine Learning Models** - Replace rule-based analysis with ML predictions
2. **Trend Analysis** - Track recommendation effectiveness over time
3. **Scheduled Analysis** - Background tasks to auto-generate daily insights
4. **User Feedback Learning** - Improve recommendations based on user actions
5. **Peer Comparison** - Benchmark against similar farms
6. **Advanced Forecasting** - Seasonal adjustments and weather integration
7. **Alert Notifications** - Real-time push notifications for critical alerts
8. **Recommendation History** - Store and track recommendation adoption

## Dependencies

- Django + Django REST Framework
- Python datetime, decimal modules
- Farm app (Animals, Crops, Expenses, etc.)

## Troubleshooting

**Empty recommendations?**
- Ensure farm has animals, crops, or expenses data
- Check farm_id is correctly set in request

**Model not found errors?**
- Verify all app dependencies are in INSTALLED_APPS
- Run Django migrations for related apps

**API returns 401 Unauthorized?**
- Add authentication token to request headers
- Ensure user is logged in and has farm access
