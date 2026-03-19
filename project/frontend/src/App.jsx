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
import Inventory from "./pages/dashboard/Inventory";
import ExpenseTracker from "./pages/dashboard/ExpenseTracker";
import Reports from "./pages/dashboard/Reports";
import Settings from "./pages/dashboard/Settings";

// Pages - Public
import Landing from "./pages/public/Landing";

// Context
import { useUser } from "./context/UserContext";

function App() {
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
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/expenses" element={<ExpenseTracker />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
  );
}

export default App;
