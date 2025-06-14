import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './App.css';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Pages - Auth
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Pages - Dashboard
import Dashboard from './pages/dashboard/Dashboard';
import AnimalManagement from './pages/dashboard/AnimalManagement';
import CropManagement from './pages/dashboard/CropManagement';
import TaskScheduler from './pages/dashboard/TaskScheduler';
import Inventory from './pages/dashboard/Inventory';
import ExpenseTracker from './pages/dashboard/ExpenseTracker';
import Reports from './pages/dashboard/Reports';
import Settings from './pages/dashboard/Settings';

// Pages - Public
import Landing from './pages/public/Landing';

// Context
import { UserProvider } from './context/UserContext';
import { FarmDataProvider } from './context/FarmDataContext';
import { ApiProvider } from './context/ApiContext';
import apiService from './services/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          // Verify token by fetching user profile
          await apiService.getProfile();
          setIsAuthenticated(true);
        } catch (error) {
          // Token is invalid, remove it
          localStorage.removeItem('authToken');
          apiService.removeToken();
          setIsAuthenticated(false);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Handle login
  const handleLogin = async (credentials) => {
    try {
      const response = await apiService.login(credentials);
      setIsAuthenticated(true);
      return response;
    } catch (error) {
      throw error;
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsAuthenticated(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <ApiProvider>
      <UserProvider value={{ isAuthenticated, handleLogin, handleLogout }}>
        <FarmDataProvider>
          <Router>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Landing />} />
              
              {/* Auth routes */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={
                  isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
                } />
                <Route path="/register" element={
                  isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />
                } />
              </Route>
              
              {/* Dashboard routes - protected */}
              <Route element={
                isAuthenticated 
                  ? <DashboardLayout onLogout={handleLogout} /> 
                  : <Navigate to="/login" replace />
              }>
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
      </UserProvider>
    </ApiProvider>
  );
}

export default App;