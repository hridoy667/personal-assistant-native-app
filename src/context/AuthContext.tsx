import { Href, router } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { tokenStorage } from '../lib/client';
import { authApi } from '../services/authapi';
import {
  AuthUser,
  GenericResponse,
  LoginPayload,
  RegisterPayload,
  RegisterResponse,
  VerifyEmailPayload,
} from '../types/auth';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<RegisterResponse>;
  verifyOtp: (payload: VerifyEmailPayload) => Promise<RegisterResponse>;
  resendOtp: (email: string) => Promise<GenericResponse>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session on startup
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const token = await tokenStorage.getAccessToken();
        if (token) {
          const userData = await authApi.getMe();
          if (isMounted) setUser(userData);
        }
      } catch (error) {
        // Clear invalid tokens if initial profile fetch fails (network timeout, 401, etc.)
        await tokenStorage.clearTokens();
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (payload: LoginPayload) => {
    setIsLoading(true);
    try {
      const res = await authApi.login(payload);

      if (!res.success) {
        throw new Error(res.message || 'Invalid credentials. Please try again.');
      }

      if (res.data) {
        if (res.data.user) {
          setUser(res.data.user);
        } else {
          const me = await authApi.getMe();
          setUser(me);
        }
        router.replace('/(app)' as Href);
      }
    } catch (error: any) {
      throw new Error(error?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload): Promise<RegisterResponse> => {
    const res = await authApi.register(payload);
    
    if (!res.success) {
      throw new Error(res.message || 'Registration failed. Please try again.');
    }
    
    return res;
  };

  const verifyOtp = async (payload: VerifyEmailPayload): Promise<RegisterResponse> => {
    setIsLoading(true);
    try {
      const res = await authApi.verifyEmail(payload);
      if (res.success) {
        router.replace('/(auth)/login' as Href);
      }
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const resendOtp = async (email: string): Promise<GenericResponse> => {
    setIsLoading(true);
    try {
      return await authApi.resendOtp(email);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } catch {
      // Ignore API logout errors to guarantee local state is cleared
    } finally {
      await tokenStorage.clearTokens();
      setUser(null);
      setIsLoading(false);
      router.replace('/(auth)/login' as Href);
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
        verifyOtp,
        resendOtp,
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