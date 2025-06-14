# Terra Track - Farm Management System

A comprehensive farm management solution built with React frontend and Django backend.

## Features

- **Animal Management**: Track livestock health, breeding, and productivity
- **Crop Planning**: Monitor crop growth stages and harvest planning
- **Task Management**: Schedule and track farm activities
- **Inventory Management**: Monitor supplies and equipment
- **Expense Tracking**: Financial management and budgeting
- **Reports & Analytics**: Comprehensive reporting and data visualization
- **Multi-user Support**: Role-based access control

## Tech Stack

### Frontend
- React 18 with Vite
- Tailwind CSS for styling
- React Router for navigation
- Chart.js for data visualization
- Framer Motion for animations

### Backend
- Django 4.2 with Django REST Framework
- SQLite database (easily configurable to PostgreSQL)
- Token-based authentication
- Celery for background tasks
- Redis for caching and task queue

## Quick Start

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Run the setup script:
```bash
python setup.py
```

4. Start the development server:
```bash
python manage.py runserver
```

The Django backend will be available at `http://localhost:8000`

### Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The React frontend will be available at `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/auth/login/` - User login
- `POST /api/auth/register/` - User registration
- `POST /api/auth/logout/` - User logout
- `GET /api/auth/profile/` - Get user profile
- `PUT /api/auth/profile/update/` - Update user profile

### Farms
- `GET /api/farms/` - List user's farms
- `POST /api/farms/` - Create new farm
- `GET /api/farms/{id}/` - Get farm details
- `PUT /api/farms/{id}/` - Update farm
- `DELETE /api/farms/{id}/` - Delete farm

### Animals
- `GET /api/animals/` - List animals
- `POST /api/animals/` - Create new animal
- `GET /api/animals/{id}/` - Get animal details
- `PUT /api/animals/{id}/` - Update animal
- `DELETE /api/animals/{id}/` - Delete animal

### Crops
- `GET /api/crops/` - List crops
- `POST /api/crops/` - Create new crop
- `GET /api/crops/{id}/` - Get crop details
- `PUT /api/crops/{id}/` - Update crop
- `DELETE /api/crops/{id}/` - Delete crop

### Tasks
- `GET /api/tasks/` - List tasks
- `POST /api/tasks/` - Create new task
- `GET /api/tasks/{id}/` - Get task details
- `PUT /api/tasks/{id}/` - Update task
- `DELETE /api/tasks/{id}/` - Delete task

### Inventory
- `GET /api/inventory/` - List inventory items
- `POST /api/inventory/` - Create new inventory item
- `GET /api/inventory/{id}/` - Get inventory item details
- `PUT /api/inventory/{id}/` - Update inventory item
- `DELETE /api/inventory/{id}/` - Delete inventory item
- `GET /api/inventory/low-stock/` - Get low stock items

### Expenses
- `GET /api/expenses/` - List expenses
- `POST /api/expenses/` - Create new expense
- `GET /api/expenses/{id}/` - Get expense details
- `PUT /api/expenses/{id}/` - Update expense
- `DELETE /api/expenses/{id}/` - Delete expense
- `GET /api/expenses/summary/` - Get expense summary

### Reports
- `GET /api/reports/analytics/` - Dashboard analytics
- `GET /api/reports/production/` - Production reports
- `GET /api/reports/` - List saved reports
- `POST /api/reports/` - Create new report

## Environment Variables

Create a `.env` file in the backend directory:

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
REDIS_URL=redis://localhost:6379
DATABASE_URL=sqlite:///db.sqlite3
```

## Database Models

### Core Models
- **User**: Extended Django user model with farm-specific fields
- **Farm**: Farm information and settings
- **FarmMember**: User roles within farms

### Operational Models
- **Animal**: Individual animals or groups with health tracking
- **Crop**: Crop planning and growth stage tracking
- **Task**: Farm task management with assignments
- **InventoryItem**: Supply and equipment tracking
- **Expense**: Financial transaction recording

### Supporting Models
- **WeightRecord**: Animal weight tracking
- **MedicalRecord**: Animal health records
- **GrowthStage**: Crop development stages
- **Harvest**: Crop yield recording

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.