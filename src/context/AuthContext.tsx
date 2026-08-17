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
import { jwtDecode } from 'jwt-decode';

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

useEffect(() => {
  async function loadStoredSession() {
    try {
      const token = await tokenStorage.getAccessToken();
      const refreshToken = await tokenStorage.getRefreshToken();
      const userType = await tokenStorage.getUserType();

      console.log('=== 🛠️ STORAGE & JWT PAYLOAD VERIFICATION ===');
      console.log('1. Raw Access Token:', token ? `${token.substring(0, 25)}...` : '❌ MISSING');
      console.log('2. Raw Refresh Token:', refreshToken ? `${refreshToken.substring(0, 25)}...` : '❌ MISSING');
      console.log('3. Stored User Type:', userType || '❌ MISSING');

      if (token) {
        const decoded: any = jwtDecode(token);

        console.log('4. DECODED JWT PAYLOAD:');
        console.log('   - User ID (sub):', decoded.sub);
        console.log('   - Name:', decoded.name);
        console.log('   - District:', decoded.district);
        console.log('   - Timezone:', decoded.timzone || decoded.timezone);
        console.log('   - Avatar URL:', decoded.avatarUrl);
        console.log('   - Islamic Features:', decoded.enableIslamicFeatures);
        console.log('   - Mail Assistance:', decoded.enableMailAssistance);
        console.log('   - Finance Tracker:', decoded.enableFinanceTracker);
        console.log('   - Health Tracking:', decoded.enableHealthTracking);
        console.log('   - Screen Time Tracking:', decoded.enableScreenTimeTracking);
        console.log('   - AI Briefings:', decoded.enableAiBriefings);
        console.log('   - Entire Payload JSON:', JSON.stringify(decoded, null, 2));

        setUser(decoded as AuthUser);
      }
    } catch (error) {
      console.error('❌ Failed to restore session or decode token:', error);
      await tokenStorage.clearTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
      console.log('=============================================');
    }
  }

  loadStoredSession();
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