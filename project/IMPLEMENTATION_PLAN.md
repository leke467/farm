# Terra Track MVP - Implementation Plan
## Complete Phase-by-Phase Breakdown

**Timeline**: 6 weeks  
**Status**: Starting Phase 1  
**Last Updated**: April 9, 2026

---

## 📅 TIMELINE OVERVIEW

```
Week 1-2:  Phase 1 ✅ CORE FUNCTIONALITY (Start Now)
Week 3-4:  Phase 2    BUSINESS LOGIC
Week 5:    Phase 3    POLISH & UX  
Week 6-7:  Phase 4    TESTING
```

---

# 🔴 PHASE 1: CORE FUNCTIONALITY (Weeks 1-2) - CRITICAL

## Task 1.1: API Validation & Error Handling (3 days)

### Files to Modify/Create:
```
Backend:
├── requirements.txt                    [ADD: djangorestframework-validators]
├── terra_track/settings.py             [ADD: REST_FRAMEWORK exception handler]
├── accounts/serializers.py             [ADD: validators]
├── animals/serializers.py              [ADD: validators]
├── crops/serializers.py                [ADD: validators]
├── tasks/serializers.py                [ADD: validators]
├── expenses/serializers.py             [ADD: validators]
├── inventory/serializers.py            [ADD: validators]
└── → Create: shared/validators.py      [NEW: Custom validators]
```

### Specific Changes:

**1. Install validators package**
- Add to requirements.txt: `djangorestframework-validators`

**2. Create custom validators module**
```
tasks/validators.py:
  - validate_date_range() → due_date >= created_at
  - validate_positive_number() → amount > 0, quantity > 0
  - validate_farm_member() → user is member of farm
```

**3. Add exception handler**
```
terra_track/settings.py:
REST_FRAMEWORK = {
    'EXCEPTION_HANDLER': 'terra_track.exceptions.custom_exception_handler',
}

Create: terra_track/exceptions.py
```

### Deliverable:
- All serializers validate inputs
- Clear error messages returned
- Example: `{"field": "birth_date", "message": "Birth date cannot be in future"}`

### Tests:
```bash
python manage.py test accounts.tests.UserValidationTests
```

---

## Task 1.2: Reports & Charts (7 days)

### Backend (3 days)

**Files to Modify:**
```
├── reports/views.py                    [COMPLETE: dashboard_analytics_view]
├── reports/serializers.py              [ADD: ReportDataSerializer]
└── reports/urls.py                     [ADD: new endpoints]
```

**New Endpoints:**
```
GET /api/reports/analytics/            → Dashboard stats (mostly done)
GET /api/reports/analytics/animals/    → Animal stats
GET /api/reports/analytics/crops/      → Crop stats
GET /api/reports/analytics/expenses/   → Financial stats
GET /api/reports/production/           → Yield analysis
GET /api/reports/financial/            → Month/year summaries
```

**Data to Return:**
```json
{
  "animals": {
    "total_count": 45,
    "healthy_count": 40,
    "sick_count": 3,
    "by_type": [
      {"type": "cow", "count": 15},
      {"type": "goat", "count": 30}
    ]
  },
  "crops": {
    "total_count": 8,
    "total_acreage": 125.5,
    "by_status": [
      {"status": "growing", "count": 5},
      {"status": "planning", "count": 3}
    ]
  },
  "expenses": {
    "monthly_total": 2500,
    "yearly_total": 28000,
    "by_category": [
      {"category": "feed", "amount": 1500},
      {"category": "labor", "amount": 1000}
    ]
  },
  "trends": {
    "last_6_months": [
      {"month": "2026-03", "expenses": 2400},
      {"month": "2026-02", "expenses": 2300}
    ]
  }
}
```

### Frontend (4 days)

**Files to Create/Modify:**
```
├── src/services/api.js                 [ADD: getAnalytics() methods]
├── src/components/charts/              [CREATE NEW DIR]
│   ├── LineChart.jsx
│   ├── BarChart.jsx
│   ├── PieChart.jsx
│   └── index.js
├── src/pages/dashboard/Reports.jsx     [COMPLETE: Add charts]
└── package.json                        [ADD: chart.js, react-chartjs-2]
```

**Components to Create:**
```jsx
<LineChart 
  data={monthlyData}
  title="Monthly Expenses"
  yAxis="Amount ($)"
/>

<BarChart
  data={animalsByType}
  title="Animals by Type"
  categories={['Cows', 'Goats', 'Sheep']}
/>

<PieChart
  data={cropsByStatus}
  title="Crop Status Distribution"
/>
```

**Reports.jsx Sections:**
- Monthly expense trend (LineChart)
- Animal distribution (BarChart)
- Crop status (PieChart)
- Financial summary (SummaryCards)
- Production metrics (BarChart)

### Deliverable:
- API returns structured data
- Charts render correctly
- Reports page is fully functional

---

## Task 1.3: Health Alerts & Notifications (10 days)

### Backend (6 days)

**Files to Create:**
```
alerts/                                 [CREATE NEW APP]
├── models.py                          [Alert, AlertTemplate models]
├── serializers.py                     [AlertSerializer]
├── urls.py                            [Alert endpoints]
├── views.py                           [AlertViewSet]
├── signals.py                         [Alert triggers]
├── tasks.py                           [Celery tasks]
├── migrations/
│   └── 0001_initial.py
└── __init__.py
```

**Alert Model:**
```python
class Alert(models.Model):
    ALERT_TYPES = [
        ('animal_sick', 'Animal Sick'),
        ('low_stock', 'Low Stock'),
        ('overdue_task', 'Overdue Task'),
        ('vaccine_due', 'Vaccine Due'),
        ('breeding_ready', 'Breeding Ready'),
        ('extreme_weather', 'Extreme Weather'),
    ]
    
    SEVERITY = [
        ('critical', 'Critical'),
        ('high', 'High'),
        ('medium', 'Medium'),
        ('low', 'Low'),
    ]
    
    farm = FK(Farm)
    alert_type = CharField(choices=ALERT_TYPES)
    severity = CharField(choices=SEVERITY)
    title = CharField(max_length=200)
    message = TextField()
    related_object_id = IntegerField(null=True)  # Animal, Crop, Item id
    related_object_type = CharField(max_length=50)  # 'animal', 'crop', 'inventory'
    read_at = DateTimeField(null=True)
    created_at = DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [Index(fields=['farm', '-created_at'])]
```

**Endpoints:**
```
GET    /api/alerts/                 → List user's alerts
PATCH  /api/alerts/{id}/read/      → Mark as read
DELETE /api/alerts/{id}/           → Dismiss alert
GET    /api/alerts/unread-count/   → Quick count
```

**Alert Triggers (Celery Tasks):**
```python
# tasks.py
@shared_task
def check_animal_health():
    """Runs daily - check for sick animals"""
    sick_animals = Animal.objects.filter(status__in=['sick', 'injured'])
    for animal in sick_animals:
        create_alert(
            farm=animal.farm,
            alert_type='animal_sick',
            severity='high',
            title=f"{animal.name} is {animal.status}",
            related_object_id=animal.id,
            related_object_type='animal'
        )

@shared_task
def check_low_stock():
    """Runs daily - check inventory"""
    low_items = InventoryItem.objects.filter(
        quantity__lte=F('min_quantity')
    )
    for item in low_items:
        create_alert(
            farm=item.farm,
            alert_type='low_stock',
            severity='medium',
            title=f"Low stock: {item.name}",
            related_object_id=item.id,
            related_object_type='inventory'
        )

@shared_task  
def check_overdue_tasks():
    """Runs daily - check tasks"""
    overdue = Task.objects.filter(
        due_date__lt=now(),
        status!='completed'
    )
    # Create alerts for assigned users
```

**Setup Celery Beat (Scheduled Tasks):**
```python
# settings.py
CELERY_BEAT_SCHEDULE = {
    'check-animal-health': {
        'task': 'alerts.tasks.check_animal_health',
        'schedule': crontab(hour=6),  # 6 AM daily
    },
    'check-low-stock': {
        'task': 'alerts.tasks.check_low_stock',
        'schedule': crontab(hour=6),
    },
    'check-overdue-tasks': {
        'task': 'alerts.tasks.check_overdue_tasks',
        'schedule': crontab(hour=8),
    },
}
```

### Frontend (4 days)

**Files to Create/Modify:**
```
src/
├── components/alerts/                 [CREATE NEW DIR]
│   ├── AlertBell.jsx                 [Navbar bell icon]
│   ├── AlertItem.jsx                 [Single alert component]
│   └── AlertsList.jsx                [Full alerts view]
├── pages/dashboard/Alerts.jsx         [NEW: Alerts page]
├── context/FarmDataContext.jsx        [ADD: fetchAlerts()]
├── services/api.js                    [ADD: Alert endpoints]
└── layouts/DashboardLayout.jsx        [ADD: AlertBell]
```

**AlertBell Component:**
```jsx
function AlertBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [alerts, setAlerts] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Poll for new alerts every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAlerts();
    }, 30000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="relative">
      <button onClick={() => setShowDropdown(!showDropdown)}>
        🔔 <span className="badge">{unreadCount}</span>
      </button>
      {showDropdown && (
        <div className="dropdown">
          {alerts.slice(0, 5).map(alert => (
            <AlertItem key={alert.id} alert={alert} />
          ))}
          <Link to="/alerts">View all</Link>
        </div>
      )}
    </div>
  );
}
```

**Alerts Page:**
```jsx
function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('unread'); // unread, all, critical
  
  return (
    <div>
      <h1>Notifications</h1>
      <Filters onChange={setFilter} />
      <AlertsList 
        alerts={filteredAlerts}
        onRead={handleRead}
        onDelete={handleDelete}
      />
    </div>
  );
}
```

### Deliverable:
- Alerts system fully functional
- Celery tasks scheduled
- Frontend shows alerts in real-time
- Users can dismiss/mark as read

---

## Task 1.4: Frontend Form Validation (10 days)

### Files to Modify:
```
src/pages/dashboard/
├── AnimalManagement.jsx               [ADD: validation]
├── CropManagement.jsx                 [ADD: validation]
├── TaskScheduler.jsx                  [ADD: validation]
├── Inventory.jsx                      [ADD: validation]
├── ExpenseTracker.jsx                 [ADD: validation]
└── Settings.jsx                       [ADD: validation]

src/components/
└── forms/                             [CREATE: shared form components]
    ├── FormField.jsx                  [Reusable input with validation]
    ├── FormError.jsx                  [Error display]
    ├── DateInput.jsx                  [Date with validation]
    └── FileUpload.jsx                 [File upload with validation]
```

### Install Package:
```
npm install react-hook-form yup axios
```

### Example: AnimalForm Validation

```jsx
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

const animalSchema = yup.object().shape({
  name: yup.string().required('Animal name is required'),
  animal_type: yup.string().required('Type is required'),
  birth_date: yup
    .date()
    .max(new Date(), 'Birth date cannot be in future')
    .required('Birth date is required'),
  weight: yup
    .number()
    .positive('Weight must be positive')
    .required('Weight is required'),
  status: yup.string().required('Status is required'),
});

function AnimalForm({ farm_id }) {
  const { register, handleSubmit, formState: { errors } } = 
    useForm({ resolver: yupResolver(animalSchema) });
  
  const onSubmit = async (data) => {
    try {
      const response = await apiService.createAnimal(farm_id, data);
      toast.success('Animal added successfully');
    } catch (error) {
      toast.error(error.message);
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <input {...register('name')} placeholder="Animal name" />
        {errors.name && <span className="error">{errors.name.message}</span>}
      </div>
      
      <div>
        <input {...register('birth_date')} type="date" />
        {errors.birth_date && <span className="error">{errors.birth_date.message}</span>}
      </div>
      
      <button type="submit">Add Animal</button>
    </form>
  );
}
```

### All Forms Need:
- ✅ Field-level validation
- ✅ Error message display
- ✅ Loading state during submission
- ✅ Success/error toast notifications
- ✅ API error handling
- ✅ Retry on failure

### Deliverable:
- All forms fully validated
- Clear error messages
- Toast notifications working
- Proper loading states

---

## Task 1.5: Inventory Tracking Logic (7 days)

### Backend (3 days)

**Files to Modify:**
```
inventory/
├── models.py                         [Already has InventoryTransaction, enhance it]
├── views.py                          [ADD: transaction endpoints]
├── serializers.py                    [ADD: TransactionSerializer]
└── urls.py                           [ADD: transaction routes]
```

**New Endpoints:**
```
POST   /api/inventory/{id}/add/      → Add stock
POST   /api/inventory/{id}/consume/  → Use stock
POST   /api/inventory/{id}/discard/  → Remove damaged
POST   /api/inventory/{id}/adjust/   → Inventory correction
GET    /api/inventory/{id}/history/  → Transaction history
GET    /api/inventory/low-stock/     → All low items
GET    /api/inventory/expiring/      → Expiring soon (30 days)
```

**Implementation:**
```python
# views.py
class InventoryAddView(APIView):
    def post(self, request, item_id):
        item = get_object_or_404(InventoryItem, id=item_id)
        # Check permission
        quantity = request.data['quantity']
        
        # Validate
        if quantity <= 0:
            raise ValidationError("Quantity must be positive")
        
        # Create transaction
        transaction = InventoryTransaction.objects.create(
            item=item,
            type='add',
            quantity=quantity,
            date=now(),
            notes=request.data.get('notes', '')
        )
        
        # Update item quantity
        item.quantity += quantity
        item.save()
        
        return Response(InventoryItemSerializer(item).data)

class InventoryConsumeView(APIView):
    def post(self, request, item_id):
        item = get_object_or_404(InventoryItem, id=item_id)
        quantity = request.data['quantity']
        
        # Validate
        if quantity > item.quantity:
            raise ValidationError("Insufficient stock")
        if quantity <= 0:
            raise ValidationError("Quantity must be positive")
        
        # Create transaction
        InventoryTransaction.objects.create(
            item=item,
            type='consume',
            quantity=quantity,
            date=now(),
            notes=request.data.get('notes', '')
        )
        
        # Update quantity
        item.quantity -= quantity
        item.save()
        
        return Response(InventoryItemSerializer(item).data)
```

### Frontend (4 days)

**Files to Modify:**
```
src/pages/dashboard/Inventory.jsx      [COMPLETE: Add transaction UI]
src/components/inventory/              [CREATE: new components]
├── InventoryCard.jsx
├── TransactionModal.jsx
├── LowStockAlert.jsx
└── HistoryTable.jsx
```

**Inventory Page Features:**
- [ ] List all items with current quantities
- [ ] Highlight low-stock (red)
- [ ] Highlight expiring soon (yellow)
- [ ] Add stock modal
- [ ] Consume stock modal
- [ ] Transaction history table
- [ ] Filter by category/status

**LowStockAlert Component:**
```jsx
function LowStockAlert({ item }) {
  const percentFull = (item.quantity / item.min_quantity) * 100;
  const isExpiring = moment(item.expiry_date).diff(moment(), 'days') < 30;
  
  return (
    <div className={`${percentFull < 50 ? 'bg-red-100' : 'bg-yellow-100'}`}>
      <h4>{item.name}</h4>
      <p>Current: {item.quantity} {item.unit}</p>
      <p>Minimum: {item.min_quantity} {item.unit}</p>
      {isExpiring && <p className="text-orange-600">Expires: {item.expiry_date}</p>}
      <button onClick={() => openAddStock(item)}>Add Stock</button>
    </div>
  );
}
```

### Deliverable:
- Stock transactions working
- Low-stock alerts triggered
- Inventory history visible
- Expiry date tracking

---

## PHASE 1 COMPLETION CHECKLIST

- [ ] Task 1.1: API validation complete
- [ ] Task 1.2: Reports and charts working
- [ ] Task 1.3: Alerts system functional
- [ ] Task 1.4: Forms validated
- [ ] Task 1.5: Inventory transactions working

**Total Time**: 10-14 days  
**Go-Live**: Phase 1 only = basic but functional MVP

---

# 🟡 PHASE 2: BUSINESS LOGIC (Weeks 3-4)

Will be detailed after Phase 1 completion

---

# 🟡 PHASE 3: POLISH & UX (Week 5)

Will be detailed after Phase 2 completion

---

# 🟡 PHASE 4: TESTING (Weeks 6-7)

Will be detailed after Phase 3 completion

---

## HOW TO USE THIS DOCUMENT

1. **Follow sequentially**: Complete tasks in order (1.1 → 1.2 → 1.3 → 1.4 → 1.5)
2. **Can parallelize**: Tasks 1.1 and 1.4 can run simultaneously
3. **Check off as you go**: Mark ✅ when complete
4. **Test frequently**: Run tests after each task
5. **Deploy after Phase 1**: You'll have a functional MVP

---

**Next Step**: Start Task 1.1 - API Validation & Error Handling
