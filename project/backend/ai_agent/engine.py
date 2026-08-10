"""
Farm AI Engine - Analyzes farm data and generates recommendations
"""
from datetime import datetime, timedelta
from django.db.models import Sum, Avg, Count, Q
from decimal import Decimal

class FarmAIEngine:
    """
    Intelligent farm analysis engine for profitability optimization
    Analyzes: Animals, Crops, Expenses, Revenue, Trends
    """
    
    def __init__(self, farm_id, user_id):
        self.farm_id = farm_id
        self.user_id = user_id
        self.insights = {
            'recommendations': [],
            'alerts': [],
            'metrics': {},
            'forecast': {}
        }
    
    def analyze(self):
        """Run full farm analysis"""
        self._analyze_expenses()
        self._analyze_revenue()
        self._analyze_animals()
        self._analyze_crops()
        self._analyze_feed_and_inventory()
        self._analyze_health_and_vaccinations()
        self._analyze_breeding()
        self._analyze_budget_and_debt()
        self._generate_forecast()
        self._identify_alerts()
        return self.insights
    
    def _analyze_expenses(self):
        """Analyze cost structure and find savings"""
        from expenses.models import Expense
        
        expenses = Expense.objects.filter(farm_id=self.farm_id)
        total = float(expenses.aggregate(Sum('amount'))['amount__sum'] or 0)
        
        # Get top expense categories
        categories = expenses.values('category').annotate(
            total=Sum('amount'),
            count=Count('id')
        ).order_by('-total')[:5]
        
        # Find high-cost items
        high_cost = []
        for cat in categories:
            cat_total = float(cat['total'])
            if cat_total > total * 0.15:  # > 15% of total
                high_cost.append({
                    'category': cat['category'],
                    'amount': cat_total,
                    'percentage': round(cat_total / total * 100, 1) if total > 0 else 0
                })
        
        self.insights['metrics']['total_expenses'] = float(total)
        self.insights['metrics']['high_cost_categories'] = high_cost
        
        # Recommendation: Cost cutting
        if high_cost:
            for item in high_cost[:2]:
                self.insights['recommendations'].append({
                    'priority': 'high' if item['percentage'] > 20 else 'medium',
                    'title': f"🎯 {item['category'].title()} Optimization",
                    'description': f"Reduce {item['category']} costs by 15-20%",
                    'action': f"Review {item['category']} vendors and negotiate bulk rates",
                    'savings': f"${item['amount'] * 0.15:.0f}-${item['amount'] * 0.20:.0f}/month",
                    'impact': f"Could save {round(item['percentage'] * 0.18, 1)}% of total expenses"
                })
    
    def _analyze_revenue(self):
        """Analyze revenue streams and profitability"""
        from expenses.models import Revenue
        
        revenues = Revenue.objects.filter(farm_id=self.farm_id)
        total_revenue = float(revenues.aggregate(Sum('total_amount'))['total_amount__sum'] or 0)
        
        # Revenue by source
        sources = revenues.values('source').annotate(
            total=Sum('total_amount'),
            count=Count('id'),
            avg=Avg('total_amount')
        ).order_by('-total')[:5]
        
        self.insights['metrics']['total_revenue'] = total_revenue
        self.insights['metrics']['revenue_sources'] = [
            {
                'source': s['source'],
                'total': float(s['total']),
                'average': float(s['avg']),
                'transactions': s['count']
            } for s in sources
        ]
        
        # Calculate profit
        profit = total_revenue - self.insights['metrics']['total_expenses']
        margin = (profit / total_revenue * 100) if total_revenue > 0 else 0
        
        self.insights['metrics']['profit'] = float(profit)
        self.insights['metrics']['profit_margin_percent'] = round(margin, 2)
    
    def _analyze_animals(self):
        """Analyze animal productivity and ROI"""
        from animals.models import Animal, ProductionRecord
        
        animals = Animal.objects.filter(farm_id=self.farm_id)
        total_animals = animals.count()
        
        high_performers = []
        low_performers = []
        
        for animal in animals[:10]:
            productions = ProductionRecord.objects.filter(animal=animal)
            avg_production = float(productions.aggregate(Avg('quantity'))['quantity__avg'] or 0)
            count = productions.count()
            
            if count > 5:  # Only if enough data
                if avg_production > 0:
                    high_performers.append({
                        'id': animal.id,
                        'name': f"{animal.name} ({animal.breed})",
                        'production': avg_production,
                        'type': animal.animal_type
                    })
                elif count > 0:
                    low_performers.append({
                        'id': animal.id,
                        'name': f"{animal.name} ({animal.breed})",
                        'production': avg_production,
                        'type': animal.animal_type
                    })
        
        self.insights['metrics']['total_animals'] = total_animals
        self.insights['metrics']['high_performers'] = high_performers[:3]
        self.insights['metrics']['low_performers'] = low_performers[:3]
        
        # Recommendation: Cull low performers
        if low_performers:
            self.insights['recommendations'].append({
                'priority': 'medium',
                'title': '🐄 Herd Optimization',
                'description': f"Review {len(low_performers)} low-producing animals",
                'action': 'Consider culling or medical intervention for underperformers',
                'impact': f"Could increase average herd productivity by 15-25%"
            })
    
    def _analyze_crops(self):
        """Analyze crop yield and profitability"""
        from crops.models import Crop, CropYieldAnalysis
        
        crops = Crop.objects.filter(farm_id=self.farm_id)
        yields = CropYieldAnalysis.objects.filter(crop__farm_id=self.farm_id)
        
        crop_analysis = []
        for crop in crops[:10]:
            crop_yields = yields.filter(crop=crop)
            avg_yield = crop_yields.aggregate(Avg('actual_yield'))['actual_yield__avg'] or 0
            roi = crop_yields.aggregate(Avg('roi_percentage'))['roi_percentage__avg'] or 0
            
            crop_analysis.append({
                'id': crop.id,
                'name': crop.name,
                'yield': float(avg_yield),
                'roi': float(roi),
                'planted_area': float(crop.area) if crop.area else 0
            })
        
        # Sort by ROI
        high_roi = sorted(crop_analysis, key=lambda x: x['roi'], reverse=True)[:3]
        low_roi = sorted(crop_analysis, key=lambda x: x['roi'])[:3]
        
        self.insights['metrics']['crop_analysis'] = crop_analysis
        
        # Recommendation: Focus on high ROI crops
        if high_roi and low_roi and len(crop_analysis) > 1:
            reduction = low_roi[0]['planted_area'] * 0.3
            self.insights['recommendations'].append({
                'priority': 'medium',
                'title': '🌾 Crop Portfolio Optimization',
                'description': f"Reduce {low_roi[0]['name']} planting, increase {high_roi[0]['name']}",
                'action': f"Shift {reduction:.1f} acres from low to high ROI crops next season",
                'impact': f"Potential ROI improvement from {low_roi[0]['roi']:.1f}% to {high_roi[0]['roi']:.1f}%"
            })

    def _analyze_feed_and_inventory(self):
        """Analyze feed consumption and inventory levels"""
        from inventory.models import InventoryItem
        from animals.models import FeedRecord
        
        items = InventoryItem.objects.filter(farm_id=self.farm_id)
        low_stock = [item for item in items if item.is_low_stock]
        
        feed_records = FeedRecord.objects.filter(animal__farm_id=self.farm_id)
        total_feed_consumed = float(feed_records.aggregate(Sum('amount'))['amount__sum'] or 0)
        
        self.insights['metrics']['low_stock_count'] = len(low_stock)
        self.insights['metrics']['low_stock_items'] = [
            {'id': i.id, 'name': i.name, 'quantity': float(i.quantity), 'unit': i.unit, 'min_quantity': float(i.min_quantity)}
            for i in low_stock[:5]
        ]
        self.insights['metrics']['total_feed_consumed'] = total_feed_consumed

        if low_stock:
            item_names = ", ".join([i.name for i in low_stock[:3]])
            self.insights['recommendations'].append({
                'priority': 'high',
                'title': '📦 Inventory Reorder Required',
                'description': f"{len(low_stock)} items are below safety stock level ({item_names})",
                'action': 'Restock low inventory items to avoid feeding/operational disruptions',
                'impact': 'Prevents feed shortages and productivity drops'
            })

    def _analyze_health_and_vaccinations(self):
        """Analyze animal health, medical costs, and vaccinations"""
        from animals.models import Vaccination, MedicalRecord
        
        today = datetime.now().date()
        overdue_vaccines = Vaccination.objects.filter(
            animal__farm_id=self.farm_id,
            status='scheduled',
            scheduled_date__lt=today
        )
        upcoming_vaccines = Vaccination.objects.filter(
            animal__farm_id=self.farm_id,
            status='scheduled',
            scheduled_date__range=[today, today + timedelta(days=14)]
        )
        medical_costs = MedicalRecord.objects.filter(animal__farm_id=self.farm_id)
        total_med_cost = float(medical_costs.aggregate(Sum('cost'))['cost__sum'] or 0)

        self.insights['metrics']['overdue_vaccines_count'] = overdue_vaccines.count()
        self.insights['metrics']['upcoming_vaccines_count'] = upcoming_vaccines.count()
        self.insights['metrics']['total_medical_cost'] = total_med_cost

        if overdue_vaccines.exists():
            self.insights['recommendations'].append({
                'priority': 'high',
                'title': '💉 Overdue Vaccinations',
                'description': f"{overdue_vaccines.count()} vaccinations are past due date",
                'action': 'Schedule veterinarian visit for overdue herd/flock vaccinations',
                'impact': 'Mitigates disease risk and herd mortality'
            })

    def _analyze_breeding(self):
        """Analyze breeding calendars and upcoming births"""
        from animals.models import BreedingCalendar
        
        today = datetime.now().date()
        upcoming_deliveries = BreedingCalendar.objects.filter(
            animal__farm_id=self.farm_id,
            status='confirmed',
            expected_delivery_date__range=[today, today + timedelta(days=30)]
        )
        self.insights['metrics']['upcoming_deliveries_count'] = upcoming_deliveries.count()

    def _analyze_budget_and_debt(self):
        """Analyze budget status and upcoming debt commitments"""
        from expenses.models import Budget, DebtManagement
        
        debts = DebtManagement.objects.filter(farm_id=self.farm_id, status='active')
        total_debt_balance = float(debts.aggregate(Sum('remaining_balance'))['remaining_balance__sum'] or 0)
        
        self.insights['metrics']['active_debts_count'] = debts.count()
        self.insights['metrics']['total_debt_balance'] = total_debt_balance
    
    def _generate_forecast(self):
        """Generate profitability forecast"""
        revenue = self.insights['metrics'].get('total_revenue', 0)
        expenses = self.insights['metrics'].get('total_expenses', 0)
        profit = self.insights['metrics'].get('profit', 0)
        
        if revenue > 0:
            monthly_avg = revenue / 12 if revenue > 0 else 0
            expense_avg = expenses / 12 if expenses > 0 else 0
            
            self.insights['forecast'] = {
                'next_month': {
                    'revenue': float(monthly_avg),
                    'expenses': float(expense_avg),
                    'profit': float(monthly_avg - expense_avg)
                },
                'next_quarter': {
                    'revenue': float(monthly_avg * 3),
                    'expenses': float(expense_avg * 3),
                    'profit': float((monthly_avg - expense_avg) * 3)
                },
                'next_year': {
                    'revenue': float(revenue),
                    'expenses': float(expenses),
                    'profit': float(profit)
                }
            }
    
    def _identify_alerts(self):
        """Generate alerts for attention"""
        from animals.models import Animal
        from crops.models import Crop
        
        total_expenses = self.insights['metrics'].get('total_expenses', 0)
        total_revenue = self.insights['metrics'].get('total_revenue', 0)
        
        if total_expenses > total_revenue * 1.2 and total_revenue > 0:
            self.insights['alerts'].append({
                'type': 'warning',
                'emoji': '⚠️',
                'message': f"Expenses (${total_expenses:,.0f}) exceed revenue — unsustainable trajectory"
            })
        
        if total_revenue == 0:
            self.insights['alerts'].append({
                'type': 'warning',
                'emoji': '⚠️',
                'message': "No revenue recorded — check sales tracking"
            })
        
        # Alert: Good profit margin
        profit_margin = self.insights['metrics'].get('profit_margin_percent', 0)
        if profit_margin > 30:
            self.insights['alerts'].append({
                'type': 'success',
                'emoji': '✅',
                'message': f"Strong profit margin ({profit_margin:.1f}%) — farm is performing well!"
            })
        
        # Alert: Low stock
        low_stock_count = self.insights['metrics'].get('low_stock_count', 0)
        if low_stock_count > 0:
            self.insights['alerts'].append({
                'type': 'warning',
                'emoji': '📦',
                'message': f"{low_stock_count} inventory item(s) below minimum stock levels"
            })

        # Alert: Overdue vaccinations
        overdue_vax = self.insights['metrics'].get('overdue_vaccines_count', 0)
        if overdue_vax > 0:
            self.insights['alerts'].append({
                'type': 'danger',
                'emoji': '💉',
                'message': f"{overdue_vax} animal vaccination(s) are overdue!"
            })

        # Alert: Low performers
        if self.insights['metrics'].get('low_performers'):
            self.insights['alerts'].append({
                'type': 'info',
                'emoji': 'ℹ️',
                'message': f"{len(self.insights['metrics']['low_performers'])} animals with low productivity — review herd health"
            })

