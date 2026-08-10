# 🌾 Livesteads (livesteads.com) — Smart Farm Management System

**Livesteads** is a modern, comprehensive, full-stack farm management application designed to empower farm owners, managers, and workers to efficiently track livestock, crop lifecycles, inventory stock, farm financial transactions, sales & income, and automated health alerts.

---

## 🚀 Key Features

* **🐄 Livestock Management**: Complete tracking of animal herds, breeding schedules, medical records, vaccinations, daily feed consumption logs, and multi-product harvest tracking (Eggs, Milk, Wool, Honey, Meat).
* **🌾 Crop Management**: Crop lifecycle tracking, planting schedules, harvest records, and yield monitoring.
* **📦 Smart Inventory & Stock In**: Real-time stock levels, low-stock threshold alerts, compound unit tracking (Crates + Loose Pieces), and automatic stock-in when harvesting animal production.
* **💵 Financial & Expense Tracker**: Detailed expense breakdown, cost allocation per flock/crop vs general farm overhead, active debt tracking, and revenue analytics.
* **📈 Sales & Income Management**: Dedicated sales module to log farm produce sales, bulk animal sales with auto-stock deduction, customer order tracking, and revenue logs.
* **💳 Per-Farm Monnify Subscription**: Integrated Monnify payment gateway for farm subscription plans (Free Trial, Pro Monthly, Pro Yearly). Subscriptions are tied per farm — all farm workers and managers automatically inherit full active access when the farm owner subscribes.
* **🔐 Multi-Role Access & Permissions**: Fine-grained role-based permissions (`Owner`, `Manager`, `Worker`, `Viewer`) with customizable per-user override matrix in Settings.
* **🤖 AI Farm Assistant**: Embedded Gemini-powered AI engine for instant agricultural recommendations, financial forecasting, and health diagnostics.

---

## 📋 Prerequisites & System Requirements

Ensure you have the following installed on your machine before setting up Livesteads:

| Tool | Recommended Version | Note |
| :--- | :--- | :--- |
| **Python** | `3.10.x` or `3.12.x` | Tested on **Python 3.12.8** |
| **Node.js** | `v18.0.0` or higher | Tested on **Node.js v24.18.0** |
| **npm** | `v9.0.0` or higher | Ships with Node.js |
| **Git** | Latest | Version control |

---

## 📁 Project Architecture

```text
farm/
├── project/
│   ├── backend/               # Django 5.x REST Framework Backend
│   │   ├── accounts/          # User Auth & Token Management
│   │   ├── ai_agent/          # Gemini AI Assistant API Engine
│   │   ├── animals/           # Livestock, Feed, Health Alerts & Production
│   │   ├── crops/             # Crop Cycles & Harvest Tracking
│   │   ├── expenses/          # Expense Logs & Allocation
│   │   ├── farms/             # Farm Profiles, Members & Role Permissions
│   │   ├── inventory/         # Stock Items, Transactions & Audits
│   │   ├── reports/           # Financial & Operational Analytics
│   │   ├── subscriptions/     # Monnify Checkout & Farm Subscription Plans
│   │   ├── tasks/             # Scheduled Farm Tasks & Reminders
│   │   ├── manage.py
│   │   └── requirements.txt
│   │
│   └── frontend/              # React 18 + Vite 7 + Vanilla CSS App
│       ├── src/
│       │   ├── components/    # Reusable UI & Modal Components
│       │   ├── context/       # React Context (User, Farm, Toast, Api)
│       │   ├── layouts/       # Auth & Dashboard Layouts
│       │   ├── pages/         # Dashboard & Public Landing Pages
│       │   ├── services/      # Axios / Fetch API Service Layer
│       │   └── utils/         # Currency & Unit Helper Utilities
│       ├── package.json
│       └── vite.config.js
└── README.md
```

---

## 🛠️ Installation & Setup Guide

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/leke467/farm.git
cd farm
```

---

### 2️⃣ Backend Setup (Django REST Framework)

1. **Navigate to the backend directory**:
   ```bash
   cd project/backend
   ```

2. **Create a Python Virtual Environment**:
   * **Windows**:
     ```bash
     python -m venv venv
     venv\Scripts\activate
     ```
   * **macOS / Linux**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables**:
   Create a `.env` file inside `project/backend/`:
   ```ini
   SECRET_KEY=your-django-secret-key
   DEBUG=True
   ALLOWED_HOSTS=localhost,127.0.0.1
   GEMINI_API_KEY=your-google-gemini-api-key
   MONNIFY_API_KEY=your-monnify-api-key
   MONNIFY_SECRET_KEY=your-monnify-secret-key
   MONNIFY_CONTRACT_CODE=your-monnify-contract-code
   MONNIFY_BASE_URL=https://sandbox.monnify.com
   ```

5. **Apply Database Migrations**:
   ```bash
   python manage.py migrate
   ```

6. **Create Superuser (Admin Account)**:
   ```bash
   python manage.py createsuperuser
   ```

7. **Start the Django Development Server**:
   ```bash
   python manage.py runserver 8000
   ```
   The backend API will run live at `http://127.0.0.1:8000/api/`.

---

### 💾 Database Seed Data & Fixtures (`datadump.json`)

A complete database dump containing initial demo data, default permission catalogs, user accounts, livestock, crops, inventory items, expense logs, sales records, and subscription plans is included in the project repository.

* **File Locations**:
  * Root Directory: `datadump.json`
  * Backend Directory: `project/backend/datadump.json`

* **What the Data Contains**:
  1. **Farms & Settings**: Default farm profile (`Adehi Farm`), currency setup (`NGN / ₦`), and farm branding metadata.
  2. **Users & Credentials**: Owner, manager, and worker test accounts with initial password change flags.
  3. **Role & Menu Permissions**: System menu catalog (`MENU_CHOICES`), role permission matrices (`Owner`, `Manager`, `Worker`, `Viewer`), and user-specific permission overrides.
  4. **Livestock & Production**: Herd registries (Cattle, Layers, Broilers, Goats, Pigs), daily feed logs, feed mix recipes, medical/vaccination records, breeding calendars, and multi-product harvest records (Eggs, Milk, Wool, Honey, Meat).
  5. **Crops & Yields**: Active crop cycles, planting dates, harvest logs, and growth stage metrics.
  6. **Inventory & Compound Units**: Stock inventory items (Crates & Loose Units), stock movement logs, low-stock thresholds, auto-stock-in records, and audit logs.
  7. **Financials & Sales Tracker**: Expense records allocated per flock vs general overheads, active debts/loans, customer orders, sales revenue entries, and auto-deducted animal sales.
  8. **Subscription Plans**: Monnify subscription plans (Free Trial, Pro Monthly, Pro Yearly) and active farm subscription state.

* **How to Load Seed Data into Database**:
  ```bash
  cd project/backend
  python manage.py loaddata datadump.json
  ```

---

### 3️⃣ Frontend Setup (React 18 + Vite)

1. **Open a new terminal and navigate to the frontend directory**:
   ```bash
   cd project/frontend
   ```

2. **Install Node Dependencies**:
   ```bash
   npm install
   ```

3. **Start the Vite Development Server**:
   ```bash
   npm run dev
   ```
   The application web interface will launch at `http://localhost:5173`.

4. **Build Production Bundle**:
   To test or deploy the production build:
   ```bash
   npm run build
   ```

---

## 🔑 Default Roles & Access Hierarchy

| Role | Access Level | Description |
| :--- | :--- | :--- |
| **Owner** | Full Admin Access | Complete control over farm settings, member management, permissions, and billing. |
| **Manager** | Operational Control | Can manage animals, crops, inventory, tasks, expenses, and sales records. |
| **Worker** | Day-to-Day Logger | Can log production, feed, and tasks. Subscription and farm settings are hidden. |
| **Viewer** | Read-Only | Read-only view for auditors or temporary observers. |

---

## 🧪 Verification & Health Check

After launching both servers:
1. Access the app frontend at `http://localhost:5173`.
2. Register a new user or log in with your superuser credentials.
3. Verify backend status at `http://127.0.0.1:8000/api/farms/`.

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.