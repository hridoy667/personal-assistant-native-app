import { apiClient, tokenStorage } from '../lib/client';
import {
  AuthUser,
  CheckPhoneResponse,
  CompleteProfilePayload,
  GenericResponse,
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  RegisterResponse,
  UpdateAuthPayload,
  VerifyEmailPayload,
} from '../types/auth';

export const authApi = {
  /**
   * Check if phone number exists (POST /auth/check-phone)
   */
  checkPhoneExists: async (phone: string): Promise<CheckPhoneResponse> => {
    return apiClient<CheckPhoneResponse>('/auth/check-phone', {
      method: 'POST',
      body: JSON.stringify({ phone }),
      requiresAuth: false,
    });
  },

  /**
   * Register a new user (POST /auth/register - Multipart/Form-Data)
   */
  register: async (payload: RegisterPayload): Promise<RegisterResponse> => {
    const formData = new FormData();

    formData.append('email', payload.email);
    formData.append('name', payload.name);
    if (payload.phone) formData.append('phone', payload.phone);
    if (payload.password) formData.append('password', payload.password);
    if (payload.district) formData.append('district', payload.district);
    if (payload.location) formData.append('location', payload.location);
    if (payload.is_agreed_to_terms_and_policy !== undefined) {
      formData.append('is_agreed_to_terms_and_policy', String(payload.is_agreed_to_terms_and_policy));
    }

    if (payload.image) {
      formData.append('image', {
        uri: payload.image.uri,
        name: payload.image.name || 'avatar.jpg',
        type: payload.image.type || 'image/jpeg',
      } as unknown as Blob);
    }

    return apiClient<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: formData,
      requiresAuth: false,
    });
  },

  /**
   * Verify OTP (POST /auth/verify-email)
   */
  verifyEmail: async (payload: VerifyEmailPayload): Promise<RegisterResponse> => {
    return apiClient<RegisterResponse>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify(payload),
      requiresAuth: false,
    });
  },

  /**
   * Resend Verification OTP (POST /auth/resend-otp)
   */
  resendOtp: async (email: string): Promise<GenericResponse> => {
    return apiClient<GenericResponse>('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
      requiresAuth: false,
    });
  },

  /**
   * Login user (POST /auth/login)
   */
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const response = await apiClient<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
      requiresAuth: false,
    });

    if (response.data?.accessToken) {
      await tokenStorage.setTokens(response.data.accessToken, response.data.refreshToken);
    }

    return response;
  },

  /**
   * Refresh Access & Refresh Tokens (POST /auth/refresh)
   */
  refreshToken: async (refreshToken: string): Promise<LoginResponse> => {
    const response = await apiClient<LoginResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
      requiresAuth: false,
    });

    if (response.data?.accessToken) {
      await tokenStorage.setTokens(response.data.accessToken, response.data.refreshToken);
    }

    return response;
  },

  /**
   * Fetch logged-in user profile (GET /auth/me)
   */
  getMe: async (): Promise<AuthUser> => {
    return apiClient<AuthUser>('/auth/me', {
      method: 'GET',
      requiresAuth: true,
    });
  },

  /**
   * Update profile (PATCH /auth/update - Multipart/Form-Data)
   */
  updateProfile: async (
    payload: UpdateAuthPayload,
    image?: RegisterPayload['image']
  ): Promise<AuthUser> => {
    const formData = new FormData();

    if (payload.name) formData.append('name', payload.name);
    if (payload.phone) formData.append('phone', payload.phone);
    if (payload.district) formData.append('district', payload.district);
    if (payload.location) formData.append('location', payload.location);

    if (image) {
      formData.append('image', {
        uri: image.uri,
        name: image.name || 'avatar.jpg',
        type: image.type || 'image/jpeg',
      } as unknown as Blob);
    }

    return apiClient<AuthUser>('/auth/update', {
      method: 'PATCH',
      body: formData,
      requiresAuth: true,
    });
  },

  /**
   * Complete OAuth Profile (POST /auth/complete-profile - Multipart/Form-Data)
   */
  completeProfile: async (payload: CompleteProfilePayload): Promise<AuthUser> => {
    const formData = new FormData();

    if (payload.name) formData.append('name', payload.name);
    if (payload.phone) formData.append('phone', payload.phone);
    if (payload.district) formData.append('district', payload.district);
    if (payload.location) formData.append('location', payload.location);

    if (payload.image) {
      formData.append('image', {
        uri: payload.image.uri,
        name: payload.image.name || 'avatar.jpg',
        type: payload.image.type || 'image/jpeg',
      } as unknown as Blob);
    }

    return apiClient<AuthUser>('/auth/complete-profile', {
      method: 'POST',
      body: formData,
      requiresAuth: true,
    });
  },

  /**
   * Logout user and clear tokens from SecureStore (POST /auth/logout)
   */
  logout: async (): Promise<void> => {
    try {
      await apiClient('/auth/logout', { method: 'POST', requiresAuth: true });
    } catch {
      // Ignore network errors during logout flow
    } finally {
      await tokenStorage.clearTokens();
    }
  },
};