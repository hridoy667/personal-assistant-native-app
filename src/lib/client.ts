import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

// Token Storage Keys
const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const USER_TYPE_KEY = 'auth_user_type';

export const tokenStorage = {
  getAccessToken: async () => await SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
  getRefreshToken: async () => await SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
  getUserType: async () => await SecureStore.getItemAsync(USER_TYPE_KEY),

  // Original setTokens method expected by apiClient / refreshAccessToken
  setTokens: async (accessToken: string, refreshToken: string) => {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  },

  // Extended method to store user type along with tokens
  setAuthData: async (accessToken: string, refreshToken: string, userType?: string) => {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    if (userType) {
      await SecureStore.setItemAsync(USER_TYPE_KEY, userType);
    }
  },

  clearTokens: async () => {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_TYPE_KEY);
  },
};

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

// Helper: NestJS ValidationPipe (and some custom exceptions) return
// `message` as a string[] instead of a string. Normalize to a single string
// so callers always get a clean, displayable message.
function extractErrorMessage(responseData: any, status: number): string {
  const raw = responseData?.message;
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.join(', ');
  }
  if (typeof raw === 'string' && raw.trim().length > 0) {
    return raw;
  }
  return `Request failed with status ${status}`;
}

// De-dupe concurrent refresh attempts: if multiple requests 401 around the
// same time, they all share one in-flight refresh instead of each calling
// /auth/refresh separately (which can race and invalidate rotating tokens).
let refreshInFlight: Promise<boolean> | null = null;

function getOrStartRefresh(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = refreshAccessToken().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

/**
 * Base HTTP Request wrapper with JWT injection & automatic token refresh logic.
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { requiresAuth = true, headers, body, ...restOptions } = options;

  const reqHeaders: Record<string, string> = {
    ...(headers as Record<string, string>),
  };

  // Do not set Content-Type if uploading FormData (multipart/form-data)
  if (!(body instanceof FormData) && !reqHeaders['Content-Type']) {
    reqHeaders['Content-Type'] = 'application/json';
  }

  // Attach Access Token if authentication is required
  if (requiresAuth) {
    const accessToken = await tokenStorage.getAccessToken();
    if (accessToken) {
      reqHeaders['Authorization'] = `Bearer ${accessToken}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...restOptions,
      headers: reqHeaders,
      body,
    });
  } catch (networkError) {
    // fetch itself threw (offline, DNS failure, server unreachable, etc.)
    throw new Error('Unable to reach the server. Please check your connection and try again.');
  }

  // Handle Token Expiration (401 Unauthorized) -> Attempt Refresh
  if (response.status === 401 && requiresAuth) {
    const refreshed = await getOrStartRefresh();
    if (refreshed) {
      // Retry the original request with the new access token
      const newAccessToken = await tokenStorage.getAccessToken();
      reqHeaders['Authorization'] = `Bearer ${newAccessToken}`;

      try {
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...restOptions,
          headers: reqHeaders,
          body,
        });
      } catch (networkError) {
        throw new Error('Unable to reach the server. Please check your connection and try again.');
      }
    } else {
      await tokenStorage.clearTokens();
      throw new Error('Session expired. Please log in again.');
    }
  }

  const responseData = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(extractErrorMessage(responseData, response.status));
  }

  return responseData as T;
}

/**
 * Internal helper to send the Refresh Token to your NestJS `/auth/refresh` endpoint
 */
async function refreshAccessToken(): Promise<boolean> {
  try {
    const refreshToken = await tokenStorage.getRefreshToken();
    if (!refreshToken) return false;

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return false;

    const res = await response.json();
    if (res.success && res.data?.accessToken && res.data?.refreshToken) {
      await tokenStorage.setTokens(res.data.accessToken, res.data.refreshToken);
      return true;
    }

    return false;
  } catch {
    return false;
  }
}