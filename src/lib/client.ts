import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

// Token Storage Keys
const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';

// Secure Store Utilities
export const tokenStorage = {
  getAccessToken: async () => await SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
  getRefreshToken: async () => await SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
  setTokens: async (accessToken: string, refreshToken: string) => {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  },
  clearTokens: async () => {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  },
};

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
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

  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...restOptions,
    headers: reqHeaders,
    body,
  });

  // Handle Token Expiration (401 Unauthorized) -> Attempt Refresh
  if (response.status === 401 && requiresAuth) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      // Retry the original request with the new access token
      const newAccessToken = await tokenStorage.getAccessToken();
      reqHeaders['Authorization'] = `Bearer ${newAccessToken}`;

      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...restOptions,
        headers: reqHeaders,
        body,
      });
    } else {
      await tokenStorage.clearTokens();
      throw new Error('Session expired. Please log in again.');
    }
  }

  const responseData = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMessage = responseData?.message || `Request failed with status ${response.status}`;
    throw new Error(errorMessage);
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