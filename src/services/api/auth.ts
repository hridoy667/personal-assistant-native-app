import { apiClient, tokenStorage } from './client';

// ==========================================
// TYPES & INTERFACES (Mapped to backend)
// ==========================================

export interface CheckPhoneResponse {
  success: boolean;
  message: string;
  exists: boolean;
}

export interface RegisterPayload {
  email: string;
  name: string;
  phone: string;
  password?: string;
  district: string;
  location?: string;
  is_agreed_to_terms_and_policy: boolean;
  image?: {
    uri: string;
    name: string;
    type: string;
  };
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  type?: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  user: AuthUser;
}

export interface VerifyEmailPayload {
  email: string;
  otp: string;
}

export interface LoginPayload {
  email: string;
  password?: string;
  firebaseToken?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  type: string;
  data: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface GenericResponse {
  success: boolean;
  message: string;
}

// ==========================================
// AUTHENTICATION API METHODS
// ==========================================

export const authApi = {
  /**
   * Check if phone number is already registered
   */
  checkPhoneExists: async (phone: string): Promise<CheckPhoneResponse> => {
    return apiClient<CheckPhoneResponse>(`/auth/check-phone?phone=${encodeURIComponent(phone)}`, {
      method: 'GET',
      requiresAuth: false,
    });
  },

  /**
   * Register a new user (Supports Multipart/Form-Data for profile image upload)
   */
  register: async (payload: RegisterPayload): Promise<RegisterResponse> => {
    const formData = new FormData();

    formData.append('email', payload.email);
    formData.append('name', payload.name);
    formData.append('phone', payload.phone);
    if (payload.password) formData.append('password', payload.password);
    formData.append('district', payload.district);
    if (payload.location) formData.append('location', payload.location);
    formData.append('is_agreed_to_terms_and_policy', String(payload.is_agreed_to_terms_and_policy));

    // Attach profile picture file if available
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
   * Verify registration OTP
   */
  verifyEmail: async (payload: VerifyEmailPayload): Promise<RegisterResponse> => {
    return apiClient<RegisterResponse>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify(payload),
      requiresAuth: false,
    });
  },

  /**
   * Resend Verification OTP
   */
  resendOtp: async (email: string): Promise<GenericResponse> => {
    return apiClient<GenericResponse>('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
      requiresAuth: false,
    });
  },

  /**
   * Login user with credentials & save JWT tokens securely
   */
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const response = await apiClient<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
      requiresAuth: false,
    });

    if (response.success && response.data?.accessToken) {
      await tokenStorage.setTokens(response.data.accessToken, response.data.refreshToken);
    }

    return response;
  },

  /**
   * Handle backend response after Google OAuth login
   */
  googleLogin: async (googleToken: string): Promise<LoginResponse> => {
    const response = await apiClient<LoginResponse>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ token: googleToken }),
      requiresAuth: false,
    });

    if (response.data?.accessToken) {
      await tokenStorage.setTokens(response.data.accessToken, response.data.refreshToken);
    }

    return response;
  },

  /**
   * Logout user and clear tokens from Secure Store
   */
  logout: async (): Promise<void> => {
    try {
      await apiClient('/auth/logout', { method: 'POST', requiresAuth: true });
    } catch {
      // Ignore network errors during logout
    } finally {
      await tokenStorage.clearTokens();
    }
  },
};
