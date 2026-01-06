import { createContext, useContext, useState } from 'react';

// Create context
const UserContext = createContext();

// Context provider
export function UserProvider({ children }) {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('farmUser');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  
  const [isAuthenticated, setIsAuthenticated] = useState(!!user);

  // Login handler
  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('farmUser', JSON.stringify(userData));
    setIsAuthenticated(true);
  };

  // Logout handler
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('farmUser');
    setIsAuthenticated(false);
  };

  // Update user profile
  const updateUserProfile = (updatedData) => {
    const updatedUser = { ...user, ...updatedData };
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