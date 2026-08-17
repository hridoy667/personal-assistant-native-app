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

  // Check stored token and initialize user session on app start
  useEffect(() => {
    async function loadStoredSession() {
      try {
        const token = await tokenStorage.getAccessToken();
        if (token) {
          const me = await authApi.getMe();
          setUser(me);
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
      if (res.success && res.data) {
        // If API returns user object on login
        if (res.data.user) {
          setUser(res.data.user);
        } else {
          // Fallback: Fetch profile using newly saved tokens
          const me = await authApi.getMe();
          setUser(me);
        }
        router.replace('/(app)' as Href);
      }
    } finally {
      setIsLoading(false);
    }
  };

const register = async (payload: RegisterPayload): Promise<RegisterResponse> => {
    // DO NOT trigger global AuthContext isLoading here if it remounts screens
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
    } finally {
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