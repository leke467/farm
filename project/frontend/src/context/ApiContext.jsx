import { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';

// Create context
const ApiContext = createContext();

// Context provider
export function ApiProvider({ children }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Generic API call wrapper with loading and error handling
  const apiCall = async (apiFunction, ...args) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await apiFunction(...args);
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Clear error
  const clearError = () => setError(null);

  return (
    <ApiContext.Provider value={{ 
      apiService,
      apiCall,
      isLoading,
      error,
      clearError
    }}>
      {children}
    </ApiContext.Provider>
  );
}

// Custom hook to use the context
export function useApi() {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
}

export default ApiContext;