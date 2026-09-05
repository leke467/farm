import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useParams,
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
import SalesTracker from "./pages/dashboard/SalesTracker";
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
import Pricing from "./pages/public/Pricing";
import Features from "./pages/public/Features";
import About from "./pages/public/About";
import Contact from "./pages/public/Contact";
import SuperadminDashboard from "./pages/admin/SuperadminDashboard";
import SuperadminFarmSelect from "./pages/admin/SuperadminFarmSelect";
import Subscription from "./pages/dashboard/Subscription";

// Context
import { useUser } from "./context/UserContext";

import { toFarmSlug } from "./utils/formatters";
import { useFarmData } from "./context/FarmDataContext";

function FarmSlugRedirect({ target = "dashboard" }) {
  const { activeFarm } = useFarmData();
  const slug = toFarmSlug(activeFarm?.name || "farmname");
  return <Navigate to={`/${slug}/${target}`} replace />;
}

function FarmAnalyticsRedirect() {
  const { farmSlug } = useParams();
  return <Navigate to={`/${farmSlug}/analytics/financial`} replace />;
}

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
          <Route path="/features" element={<Features />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />

          {/* Superadmin Dedicated Routes */}
          <Route
            path="/admin/select-farm"
            element={
              !isAuthenticated ? (
                <Navigate to="/login" replace />
              ) : (user?.is_superuser || user?.is_staff || user?.is_admin || user?.isAdmin) ? (
                <SuperadminFarmSelect />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/admin/farms"
            element={
              !isAuthenticated ? (
                <Navigate to="/login" replace />
              ) : (user?.is_superuser || user?.is_staff || user?.is_admin || user?.isAdmin) ? (
                <SuperadminFarmSelect />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              !isAuthenticated ? (
                <Navigate to="/login" replace />
              ) : (user?.is_superuser || user?.is_staff || user?.is_admin || user?.isAdmin) ? (
                <SuperadminDashboard />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />

          {/* Auth routes */}
          <Route element={<AuthLayout />}>
            <Route
              path="/login"
              element={
                isAuthenticated ? (
                  <Navigate
                    to={
                      mustChangePassword
                        ? "/force-password-change"
                        : (user?.is_superuser || user?.is_staff || user?.is_admin || user?.isAdmin)
                        ? "/admin/select-farm"
                        : "/dashboard"
                    }
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
                    to={
                      mustChangePassword
                        ? "/force-password-change"
                        : (user?.is_superuser || user?.is_staff || user?.is_admin || user?.isAdmin)
                        ? "/admin/select-farm"
                        : "/dashboard"
                    }
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

          {/* Dashboard routes - protected with farm slug */}
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
            {/* Slug-prefixed routes */}
            <Route path="/:farmSlug/dashboard" element={<Dashboard />} />
            <Route path="/:farmSlug/animals" element={<AnimalManagement />} />
            <Route path="/:farmSlug/crops" element={<CropManagement />} />
            <Route path="/:farmSlug/tasks" element={<TaskScheduler />} />
            <Route path="/:farmSlug/inventory" element={<InventoryManagementFull />} />
            <Route path="/:farmSlug/inventory/audits" element={<InventoryAudits />} />
            <Route path="/:farmSlug/inventory/costs" element={<CostAnalysis />} />
            <Route path="/:farmSlug/expenses" element={<ExpenseTracker />} />
            <Route path="/:farmSlug/sales" element={<SalesTracker />} />
            <Route path="/:farmSlug/reports" element={<Reports />} />
            <Route path="/:farmSlug/health" element={<HealthAlerts />} />
            <Route path="/:farmSlug/settings" element={<Settings />} />
            <Route path="/:farmSlug/subscription" element={<Subscription />} />

            {/* Phase 2 Analytics Dashboards */}
            <Route path="/:farmSlug/analytics" element={<FarmAnalyticsRedirect />} />
            <Route path="/:farmSlug/analytics/forecasting" element={<DemandForecastingDashboard />} />
            <Route path="/:farmSlug/analytics/animals" element={<AnimalProductivityDashboard />} />
            <Route path="/:farmSlug/analytics/financial" element={<FinancialOverviewDashboard />} />
            <Route path="/:farmSlug/analytics/crops" element={<CropAnalyticsDashboard />} />
            <Route path="/:farmSlug/analytics/*" element={<FarmAnalyticsRedirect />} />

            {/* Fallback routes without slug (e.g. /dashboard) -> automatically redirects to /:activeFarmSlug/dashboard */}
            <Route path="/dashboard" element={<FarmSlugRedirect target="dashboard" />} />
            <Route path="/animals" element={<FarmSlugRedirect target="animals" />} />
            <Route path="/crops" element={<FarmSlugRedirect target="crops" />} />
            <Route path="/tasks" element={<FarmSlugRedirect target="tasks" />} />
            <Route path="/inventory" element={<FarmSlugRedirect target="inventory" />} />
            <Route path="/inventory/audits" element={<FarmSlugRedirect target="inventory/audits" />} />
            <Route path="/inventory/costs" element={<FarmSlugRedirect target="inventory/costs" />} />
            <Route path="/expenses" element={<FarmSlugRedirect target="expenses" />} />
            <Route path="/sales" element={<FarmSlugRedirect target="sales" />} />
            <Route path="/reports" element={<FarmSlugRedirect target="reports" />} />
            <Route path="/health" element={<FarmSlugRedirect target="health" />} />
            <Route path="/settings" element={<FarmSlugRedirect target="settings" />} />
            <Route path="/subscription" element={<FarmSlugRedirect target="subscription" />} />
            <Route path="/analytics" element={<FarmSlugRedirect target="analytics/financial" />} />
            <Route path="/analytics/*" element={<FarmSlugRedirect target="analytics/financial" />} />
          </Route>

            {/* Catch all route */}
            <Route
              path="*"
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
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
