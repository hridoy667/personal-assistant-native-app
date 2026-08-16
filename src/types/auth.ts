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
  district?: string;
  location?: string;
  is_agreed_to_terms_and_policy?: boolean;
  image?: {
    uri: string;
    name?: string;
    type?: string;
  };
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  type?: string;
  district?: string;
  location?: string;
  avatarUrl?: string;
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
}

export interface LoginResponse {
  success: boolean;
  message: string;
  type?: string;
  data: {
    accessToken: string;
    refreshToken: string;
    user?: AuthUser; // Added user property here
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