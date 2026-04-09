import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "./App.css";

// Layouts
import AuthLayout from "./layouts/AuthLayout";
import DashboardLayout from "./layouts/DashboardLayout";

// Pages - Auth
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForcePasswordChange from "./pages/auth/ForcePasswordChange";

// Pages - Dashboard
import Dashboard from "./pages/dashboard/Dashboard";
import AnimalManagement from "./pages/dashboard/AnimalManagement";
import CropManagement from "./pages/dashboard/CropManagement";
import TaskScheduler from "./pages/dashboard/TaskScheduler";
import InventoryManagementFull from "./pages/dashboard/InventoryManagementFull";
import InventoryAudits from "./pages/dashboard/InventoryAudits";
import CostAnalysis from "./pages/dashboard/CostAnalysis";
import ExpenseTracker from "./pages/dashboard/ExpenseTracker";
import Reports from "./pages/dashboard/Reports";
import HealthAlerts from "./pages/dashboard/HealthAlerts";
import Settings from "./pages/dashboard/Settings";

// Phase 2 Dashboards
import DemandForecastingDashboard from "./pages/dashboard/DemandForecastingDashboard";
import AnimalProductivityDashboard from "./pages/dashboard/AnimalProductivityDashboard";
import FinancialOverviewDashboard from "./pages/dashboard/FinancialOverviewDashboard";
import CropAnalyticsDashboard from "./pages/dashboard/CropAnalyticsDashboard";

// Pages - Public
import Landing from "./pages/public/Landing";

// Context
import { useUser } from "./context/UserContext";

function App() {
  try {
    const { isAuthenticated, user, handleLogout } = useUser();
    const mustChangePassword = Boolean(
      user?.mustChangePassword ?? user?.must_change_password
    );

    return (
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
              {/* Public routes */}
              <Route path="/" element={<Landing />} />

            {/* Auth routes */}
            <Route element={<AuthLayout />}>
              <Route
                path="/login"
                element={
                  isAuthenticated ? (
                    <Navigate
                      to={mustChangePassword ? "/force-password-change" : "/dashboard"}
                      replace
                    />
                  ) : (
                    <Login />
                  )
                }
              />
              <Route
                path="/register"
                element={
                  isAuthenticated ? (
                    <Navigate
                      to={mustChangePassword ? "/force-password-change" : "/dashboard"}
                      replace
                    />
                  ) : (
                    <Register />
                  )
                }
              />
              <Route
                path="/force-password-change"
                element={
                  !isAuthenticated ? (
                    <Navigate to="/login" replace />
                  ) : mustChangePassword ? (
                    <ForcePasswordChange />
                  ) : (
                    <Navigate to="/dashboard" replace />
                  )
                }
              />
            </Route>

            {/* Dashboard routes - protected */}
            <Route
              element={
                !isAuthenticated ? (
                  <Navigate to="/login" replace />
                ) : mustChangePassword ? (
                  <Navigate to="/force-password-change" replace />
                ) : (
                  <DashboardLayout onLogout={handleLogout} />
                )
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/animals" element={<AnimalManagement />} />
              <Route path="/crops" element={<CropManagement />} />
              <Route path="/tasks" element={<TaskScheduler />} />
              <Route path="/inventory" element={<InventoryManagementFull />} />
              <Route path="/inventory/audits" element={<InventoryAudits />} />
              <Route path="/inventory/costs" element={<CostAnalysis />} />
              <Route path="/expenses" element={<ExpenseTracker />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/health" element={<HealthAlerts />} />
              <Route path="/settings" element={<Settings />} />

              {/* Phase 2 Analytics Dashboards */}
              <Route path="/analytics/forecasting" element={<DemandForecastingDashboard />} />
              <Route path="/analytics/animals" element={<AnimalProductivityDashboard />} />
              <Route path="/analytics/financial" element={<FinancialOverviewDashboard />} />
              <Route path="/analytics/crops" element={<CropAnalyticsDashboard />} />
            </Route>

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      );
    } catch (error) {
      console.error('App Error:', error);
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50">
          <div className="p-8 bg-white rounded-lg shadow-lg max-w-md">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
            <p className="text-gray-700 mb-4">{error?.message || 'An unexpected error occurred'}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
}

export default App;
