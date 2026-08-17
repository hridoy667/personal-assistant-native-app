export interface CheckPhoneResponse {
  success: boolean;
  message: string;
  exists: boolean;
}

export interface RegisterPayload {
  email: string;
  name: string;
  phone?: string;
  password?: string;
  bio?: string;
  district?: string;
  upazila?: string;
  timezone?: string;
  dateOfBirth?: string; // ISO date string, e.g. '2000-01-01'
  gender?: 'MALE' | 'FEMALE'; // matches backend Gender enum exactly
  height?: number; // meters
  weight?: number; // kg
  activityLevel?: 'SEDENTARY' | 'LIGHTLY_ACTIVE' | 'MODERATELY_ACTIVE' | 'VERY_ACTIVE';
  enableIslamicFeatures?: boolean;
  enableMailAssistance?: boolean;
  enableFinanceTracker?: boolean;
  enableHealthTracking?: boolean;
  enableScreenTimeTracking?: boolean;
  enableAiBriefings?: boolean;
  is_agreed_to_terms_and_policy?: boolean;
  image?: {
    uri: string;
    name?: string;
    type?: string;
  };
}

export interface AuthUser {
  id?: string;
  sub?: string; // Standard JWT subject claim mapping to user ID
  email?: string;
  name?: string;
  phone?: string;
  type?: string;
  district?: string;
  location?: string;
  avatarUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  timezone?: string;
  timzone?: string; // Accounts for backend payload key spelling variant
  
  // Feature Flags
  enableIslamicFeatures?: boolean;
  enableMailAssistance?: boolean;
  enableFinanceTracker?: boolean;
  enableHealthTracking?: boolean;
  enableScreenTimeTracking?: boolean;
  enableAiBriefings?: boolean;
  
  shop?: any;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  user?: AuthUser;
}

export interface VerifyEmailPayload {
  email: string;
  otp: string;
}

export interface ResendOtpPayload {
  email: string;
}

export interface LoginPayload {
  email: string;
  password?: string;
  firebaseToken?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  type?: string;
  data: {
    accessToken: string;
    refreshToken: string;
    user?: AuthUser;
  };
}

export interface RefreshTokenResponse {
  success: boolean;
  message?: string;
  data?: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface CompleteProfilePayload {
  name?: string;
  phone?: string;
  district?: string;
  location?: string;
  image?: {
    uri: string;
    name?: string;
    type?: string;
  };
}

export interface UpdateAuthPayload {
  name?: string;
  phone?: string;
  district?: string;
  location?: string;
}

export interface GenericResponse {
  success: boolean;
  message: string;
}