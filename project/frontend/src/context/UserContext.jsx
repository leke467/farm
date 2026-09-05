import { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';

// Create context
const UserContext = createContext();

const normalizeUser = (userData) => {
  if (!userData) return null;

  const first_name = userData.first_name || userData.firstName || '';
  const last_name = userData.last_name || userData.lastName || '';
  const isAdmin = Boolean(userData.is_admin ?? userData.isAdmin ?? false);
  const isSuperuser = Boolean(userData.is_superuser ?? userData.isSuperuser ?? false);
  const isStaff = Boolean(userData.is_staff ?? userData.isStaff ?? false);
  const mustChangePassword =
    Boolean(userData.must_change_password ?? userData.mustChangePassword ?? false);

  return {
    ...userData,
    first_name,
    last_name,
    firstName: first_name,
    lastName: last_name,
    isAdmin: isAdmin || isSuperuser || isStaff,
    is_admin: isAdmin || isSuperuser || isStaff,
    isSuperuser,
    is_superuser: isSuperuser,
    isStaff,
    is_staff: isStaff,
    mustChangePassword,
    must_change_password: mustChangePassword,
  };
};

// Context provider
export function UserProvider({ children }) {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('farmUser');
    return storedUser ? normalizeUser(JSON.parse(storedUser)) : null;
  });
  
  const [isAuthenticated, setIsAuthenticated] = useState(!!user);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      apiService.setToken(token);
      apiService.request('/auth/profile/')
        .then((profile) => {
          if (profile && profile.id) {
            setUser((prev) => {
              const updated = normalizeUser({ ...prev, ...profile });
              localStorage.setItem('farmUser', JSON.stringify(updated));
              return updated;
            });
          }
        })
        .catch(() => {});
    }
  }, []);

  // Login handler
  const handleLogin = (userData) => {
    localStorage.removeItem('activeFarmId');
    if (userData?.token) {
      apiService.setToken(userData.token);
    }
    const normalizedUser = normalizeUser(userData);
    setUser(normalizedUser);
    localStorage.setItem('farmUser', JSON.stringify(normalizedUser));
    setIsAuthenticated(true);
  };

  // Logout handler
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('farmUser');
    localStorage.removeItem('authToken');
    localStorage.removeItem('activeFarmId');
    apiService.removeToken();
    setIsAuthenticated(false);
  };

  // Update user profile
  const updateUserProfile = (updatedData) => {
    const updatedUser = normalizeUser({ ...user, ...updatedData });
    setUser(updatedUser);
    localStorage.setItem('farmUser', JSON.stringify(updatedUser));
    return updatedUser;
  };

  return (
    <UserContext.Provider value={{ 
      user, 
      isAuthenticated, 
      handleLogin, 
      handleLogout,
      updateUserProfile 
    }}>
      {children}
    </UserContext.Provider>
  );
}

// Custom hook to use the context
export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

export default UserContext;