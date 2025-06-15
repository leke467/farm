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
import { UserProvider, useUser } from "./context/UserContext";
import { FarmDataProvider } from "./context/FarmDataContext";
import { ApiProvider } from "./context/ApiContext";
import apiService from "./services/api";

function App() {
  const { isAuthenticated, handleLogout } = useUser();

  return (
    <ApiProvider>
      <FarmDataProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />

            {/* Auth routes */}
            <Route element={<AuthLayout />}>
              <Route
                path="/login"
                element={
                  isAuthenticated ? (
                    <Navigate to="/dashboard" replace />
                  ) : (
                    <Login />
                  )
                }
              />
              <Route
                path="/register"
                element={
                  isAuthenticated ? (
                    <Navigate to="/dashboard" replace />
                  ) : (
                    <Register />
                  )
                }
              />
            </Route>

            {/* Dashboard routes - protected */}
            <Route
              element={
                isAuthenticated ? (
                  <DashboardLayout onLogout={handleLogout} />
                ) : (
                  <Navigate to="/login" replace />
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
      </FarmDataProvider>
    </ApiProvider>
  );
}

export default App;
