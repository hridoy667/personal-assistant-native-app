import React, { createContext, useContext, useEffect, useState } from 'react';
import { router, Href } from 'expo-router';
import { authApi, AuthUser, LoginPayload, RegisterPayload } from '../services/api/auth';
import { tokenStorage } from '../services/api/client';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check stored token and initialize user session on app start
  useEffect(() => {
    async function loadStoredSession() {
      try {
        const token = await tokenStorage.getAccessToken();
        if (token) {
          // Token exists - consider user authenticated on start
          setUser({ id: '', email: '' });
        }
      } catch (error) {
        console.error('Failed to load auth session:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadStoredSession();
  }, []);

  const login = async (payload: LoginPayload) => {
    setIsLoading(true);
    try {
      const res = await authApi.login(payload);
      if (res.success) {
        setUser({ id: '', email: payload.email });
        router.replace('/(app)' as Href); // Safely typecast route
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload) => {
    setIsLoading(true);
    try {
      const res = await authApi.register(payload);
      if (res.success) {
        // Navigate to OTP verification screen passing the email
        router.push({
          pathname: '/(auth)/verify-otp' as Href,
          params: { email: payload.email },
        } as Href);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setIsLoading(false);
      router.replace('/(auth)/login' as Href); // Safely typecast route
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
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