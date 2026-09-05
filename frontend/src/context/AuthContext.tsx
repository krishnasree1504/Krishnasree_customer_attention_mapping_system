import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../lib/api';
import { clearActiveVideoAnalysis } from '../lib/videoAnalysisSync';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (
    name: string,
    email: string,
    password: string,
    role: UserRole,
    assignedStoreId?: string,
    assignedStoreName?: string
  ) => Promise<User>;
  logout: () => void;
  updateUser: (user: User) => void;
  updateProfile: (data: { name?: string; phone?: string; avatar?: string }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isCancelled = false;

    const verifyExistingSession = async () => {
      let storedToken: string | null = null;
      try {
        storedToken = localStorage.getItem('cams_token');
      } catch {
        storedToken = null;
      }

      // If no stored token exists, user is strictly unauthenticated
      if (!storedToken) {
        if (!isCancelled) {
          setUser(null);
          setToken(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const res = await api.get('/auth/me');
        if (!isCancelled) {
          if (res.data?.user) {
            setUser(res.data.user);
            setToken(storedToken);
          } else {
            throw new Error('No user data in response');
          }
        }
      } catch {
        // Stored token is invalid or expired - clear it and ensure logged-out state
        try {
          localStorage.removeItem('cams_token');
        } catch {
          // ignore
        }
        if (!isCancelled) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    verifyExistingSession();

    return () => {
      isCancelled = true;
    };
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    // Fresh login starts with a fresh analysis context
    clearActiveVideoAnalysis();
    const res = await api.post('/auth/login', { email, password });
    const { token: newToken, user: newUser } = res.data;
    try {
      localStorage.setItem('cams_token', newToken);
    } catch {
      // ignore
    }
    setToken(newToken);
    setUser(newUser);
    return newUser;
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: UserRole,
    assignedStoreId?: string,
    assignedStoreName?: string
  ): Promise<User> => {
    // Fresh registration starts with a fresh analysis context
    clearActiveVideoAnalysis();
    const res = await api.post('/auth/register', {
      name,
      email,
      password,
      role,
      assignedStoreId,
      assignedStoreName,
    });
    const { token: newToken, user: newUser } = res.data;
    try {
      localStorage.setItem('cams_token', newToken);
    } catch {
      // ignore
    }
    setToken(newToken);
    setUser(newUser);
    return newUser;
  };

  const logout = () => {
    // Logout clears the current active analysis context completely
    clearActiveVideoAnalysis(user?.id);
    try {
      localStorage.removeItem('cams_token');
    } catch {
      // ignore
    }
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const updateProfile = async (data: { name?: string; phone?: string; avatar?: string }) => {
    const res = await api.put('/auth/profile', data);
    setUser(res.data.user);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    await api.put('/auth/change-password', { currentPassword, newPassword });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        register,
        logout,
        updateUser,
        updateProfile,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
