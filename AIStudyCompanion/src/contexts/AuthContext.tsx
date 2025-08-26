import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import authService, { UserAccount } from '../services/authService';
import canvasService from '../services/canvasService';

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: UserAccount | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  createAccount: (username: string, password: string, canvasUrl: string, accessToken: string) => Promise<{ success: boolean; error?: string }>;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    setIsLoading(true);
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
        
        // Load Canvas credentials and configure service
        const canvasCredentials = await authService.getCurrentUserCanvasCredentials();
        if (canvasCredentials) {
          await canvasService.setCanvasConfig(canvasCredentials.canvasUrl, canvasCredentials.accessToken);
        }
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setCurrentUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await authService.login(username, password);
      
      if (result.success && result.user) {
        setCurrentUser(result.user);
        setIsAuthenticated(true);
        
        // Configure Canvas service
        const canvasCredentials = await authService.getCurrentUserCanvasCredentials();
        if (canvasCredentials) {
          await canvasService.setCanvasConfig(canvasCredentials.canvasUrl, canvasCredentials.accessToken);
        }
        
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  };

  const createAccount = async (
    username: string, 
    password: string, 
    canvasUrl: string, 
    accessToken: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await authService.createAccount(username, password, canvasUrl, accessToken);
      
      if (result.success && result.user) {
        setCurrentUser(result.user);
        setIsAuthenticated(true);
        
        // Canvas service should already be configured from the creation process
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Account creation error:', error);
      return { success: false, error: 'Failed to create account. Please try again.' };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setCurrentUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    currentUser,
    isLoading,
    login,
    logout,
    createAccount,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};