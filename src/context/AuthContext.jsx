import React, { createContext, useContext, useState, useEffect } from 'react';
import modernAuthService from '../utils/modernAuthService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth mora biti korišten unutar AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    setLoading(true);
    try {
      const currentUser = await modernAuthService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Greška pri provjeri auth statusa:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (type, credentials) => {
    try {
      let loginResult;
      
      if (type === 'driver') {
        loginResult = await modernAuthService.loginDriver(credentials.turaCode);
      } else {
        loginResult = await modernAuthService.loginAdmin(credentials.username, credentials.password);
      }

      if (loginResult.success) {
        setUser(loginResult.user);
        setIsAuthenticated(true);
        return { success: true };
      } else {
        return { success: false, error: loginResult.error };
      }
    } catch (error) {
      console.error('Login greška:', error);
      return { success: false, error: 'Greška pri prijavi' };
    }
  };

  const logout = async () => {
    try {
      await modernAuthService.logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout greška:', error);
    }
  };

  const refreshUser = async () => {
    try {
      const currentUser = await modernAuthService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Greška pri refresh korisnika:', error);
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    refreshUser,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};