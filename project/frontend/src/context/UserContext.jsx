import { createContext, useContext, useState } from 'react';

// Create context
const UserContext = createContext();

const normalizeUser = (userData) => {
  if (!userData) return null;

  const firstName = userData.firstName ?? userData.first_name ?? '';
  const lastName = userData.lastName ?? userData.last_name ?? '';
  const isAdmin = userData.isAdmin ?? userData.is_admin ?? false;
  const mustChangePassword =
    userData.mustChangePassword ?? userData.must_change_password ?? false;

  return {
    ...userData,
    firstName,
    lastName,
    first_name: userData.first_name ?? firstName,
    last_name: userData.last_name ?? lastName,
    isAdmin,
    is_admin: userData.is_admin ?? isAdmin,
    mustChangePassword,
    must_change_password: userData.must_change_password ?? mustChangePassword,
  };
};

// Context provider
export function UserProvider({ children }) {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('farmUser');
    return storedUser ? normalizeUser(JSON.parse(storedUser)) : null;
  });
  
  const [isAuthenticated, setIsAuthenticated] = useState(!!user);

  // Login handler
  const handleLogin = (userData) => {
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