import { apiClient, tokenStorage } from '../lib/client';
import {
  AuthUser,
  CheckPhoneResponse,
  CompleteProfilePayload,
  GenericResponse,
  GetMeResponse,
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
    if (payload.bio) formData.append('bio', payload.bio);
    if (payload.district) formData.append('district', payload.district);
    if (payload.upazila) formData.append('upazila', payload.upazila);
    if (payload.timezone) formData.append('timezone', payload.timezone);
    if (payload.dateOfBirth) formData.append('dateOfBirth', payload.dateOfBirth);
    if (payload.gender) formData.append('gender', payload.gender);
    if (payload.height !== undefined) formData.append('height', String(payload.height));
    if (payload.weight !== undefined) formData.append('weight', String(payload.weight));
    if (payload.activityLevel) formData.append('activityLevel', payload.activityLevel);

    // Feature flags: send only when explicitly set, so backend @Transform + defaults
    // still apply cleanly when the user hasn't touched a given toggle.
    if (payload.enableIslamicFeatures !== undefined) {
      formData.append('enableIslamicFeatures', String(payload.enableIslamicFeatures));
    }
    if (payload.enableMailAssistance !== undefined) {
      formData.append('enableMailAssistance', String(payload.enableMailAssistance));
    }
    if (payload.enableFinanceTracker !== undefined) {
      formData.append('enableFinanceTracker', String(payload.enableFinanceTracker));
    }
    if (payload.enableHealthTracking !== undefined) {
      formData.append('enableHealthTracking', String(payload.enableHealthTracking));
    }
    if (payload.enableScreenTimeTracking !== undefined) {
      formData.append('enableScreenTimeTracking', String(payload.enableScreenTimeTracking));
    }
    if (payload.enableAiBriefings !== undefined) {
      formData.append('enableAiBriefings', String(payload.enableAiBriefings));
    }

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

    // Extract accessToken and refreshToken from response.data
    if (response.success && response.data?.accessToken && response.data?.refreshToken) {
      await tokenStorage.setAuthData(
        response.data.accessToken,
        response.data.refreshToken,
        response.type
      );
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
  getMe: async (): Promise<GetMeResponse> => {
    return apiClient<GetMeResponse>('/auth/me', {
      method: 'GET',
      requiresAuth: true,
    });
  },

  /**
   * Update profile (PATCH /auth/update - Multipart/Form-Data)
   */
 updateProfile: async (
    payload: UpdateAuthPayload,
    image?: UpdateAuthPayload['image']
  ): Promise<AuthUser> => {
    const formData = new FormData();

    // Basic Text Fields
    if (payload.name !== undefined) formData.append('name', payload.name);
    if (payload.phone !== undefined && payload.phone !== null) formData.append('phone', payload.phone);
    if (payload.bio !== undefined && payload.bio !== null) formData.append('bio', payload.bio);
    if (payload.district !== undefined && payload.district !== null) formData.append('district', payload.district);
    if (payload.upazila !== undefined && payload.upazila !== null) formData.append('upazila', payload.upazila);
    if (payload.location !== undefined && payload.location !== null) formData.append('location', payload.location);
    if (payload.latitude !== undefined && payload.latitude !== null) formData.append('latitude', String(payload.latitude));
    if (payload.longitude !== undefined && payload.longitude !== null) formData.append('longitude', String(payload.longitude));
    if (payload.timezone !== undefined) formData.append('timezone', payload.timezone);
    if (payload.dateOfBirth !== undefined && payload.dateOfBirth !== null) formData.append('dateOfBirth', payload.dateOfBirth);
    if (payload.dailyTargetFocus !== undefined && payload.dailyTargetFocus !== null) {
      formData.append('dailyTargetFocus', payload.dailyTargetFocus);
    }

    // Routine & Personality Fields
    if (payload.defaultWakeTime !== undefined && payload.defaultWakeTime !== null) {
      formData.append('defaultWakeTime', payload.defaultWakeTime);
    }
    if (payload.defaultSleepTime !== undefined && payload.defaultSleepTime !== null) {
      formData.append('defaultSleepTime', payload.defaultSleepTime);
    }
    if (payload.personalityType !== undefined && payload.personalityType !== null) {
      formData.append('personalityType', payload.personalityType);
    }

    // Enums & Health Metrics
    if (payload.gender !== undefined && payload.gender !== null) formData.append('gender', payload.gender);
    if (payload.height !== undefined && payload.height !== null) formData.append('height', String(payload.height));
    if (payload.weight !== undefined && payload.weight !== null) formData.append('weight', String(payload.weight));
    if (payload.activityLevel !== undefined) formData.append('activityLevel', payload.activityLevel);

    // Feature Flags
    if (payload.enableIslamicFeatures !== undefined) {
      formData.append('enableIslamicFeatures', String(payload.enableIslamicFeatures));
    }
    if (payload.enableMailAssistance !== undefined) {
      formData.append('enableMailAssistance', String(payload.enableMailAssistance));
    }
    if (payload.enableFinanceTracker !== undefined) {
      formData.append('enableFinanceTracker', String(payload.enableFinanceTracker));
    }
    if (payload.enableHealthTracking !== undefined) {
      formData.append('enableHealthTracking', String(payload.enableHealthTracking));
    }
    if (payload.enableScreenTimeTracking !== undefined) {
      formData.append('enableScreenTimeTracking', String(payload.enableScreenTimeTracking));
    }
    if (payload.enableAiBriefings !== undefined) {
      formData.append('enableAiBriefings', String(payload.enableAiBriefings));
    }

    // Profile Image Upload
    const avatarImage = image || payload.image;
    if (avatarImage) {
      formData.append('image', {
        uri: avatarImage.uri,
        name: avatarImage.name || 'avatar.jpg',
        type: avatarImage.type || 'image/jpeg',
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