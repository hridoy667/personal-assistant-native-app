import * as SecureStore from 'expo-secure-store';

// Set your active localtunnel URL here
const LOCAL_TUNNEL_URL = 'https://chilly-hornets-take.loca.lt/api';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || LOCAL_TUNNEL_URL;

console.log('[API Client] Initialized with Base URL:', API_BASE_URL);

// Token Storage Keys
const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const USER_TYPE_KEY = 'auth_user_type';

export const tokenStorage = {
  getAccessToken: async () => await SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
  getRefreshToken: async () => await SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
  getUserType: async () => await SecureStore.getItemAsync(USER_TYPE_KEY),

  setTokens: async (accessToken: string, refreshToken: string) => {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  },

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
    'Bypass-Tunnel-Reminder': 'true', // Bypasses localtunnel's splash warning page
    'ngrok-skip-browser-warning': 'true', // Bypasses ngrok's warning page if used later
    ...(headers as Record<string, string>),
  };

  if (!(body instanceof FormData) && !reqHeaders['Content-Type']) {
    reqHeaders['Content-Type'] = 'application/json';
  }

  if (requiresAuth) {
    const accessToken = await tokenStorage.getAccessToken();
    if (accessToken) {
      reqHeaders['Authorization'] = `Bearer ${accessToken}`;
    }
  }

  const targetUrl = `${API_BASE_URL}${endpoint}`;
  let response: Response;

  try {
    response = await fetch(targetUrl, {
      ...restOptions,
      headers: reqHeaders,
      body,
    });
  } catch (networkError) {
    console.error(`[API Network Error] Failed to fetch from: ${targetUrl}`, networkError);
    throw new Error(`Unable to reach server at ${API_BASE_URL}. Check network connection.`);
  }

  // Handle Token Expiration (401 Unauthorized) -> Attempt Refresh
  if (response.status === 401 && requiresAuth) {
    const refreshed = await getOrStartRefresh();
    if (refreshed) {
      const newAccessToken = await tokenStorage.getAccessToken();
      reqHeaders['Authorization'] = `Bearer ${newAccessToken}`;

      try {
        response = await fetch(targetUrl, {
          ...restOptions,
          headers: reqHeaders,
          body,
        });
      } catch (networkError) {
        console.error(`[API Network Error Retry] Failed to fetch from: ${targetUrl}`, networkError);
        throw new Error('Unable to reach the server on retry. Check your connection.');
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

async function refreshAccessToken(): Promise<boolean> {
  try {
    const refreshToken = await tokenStorage.getRefreshToken();
    if (!refreshToken) return false;

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Bypass-Tunnel-Reminder': 'true',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return false;

    const res = await response.json();
    if (res.success && res.data?.accessToken && res.data?.refreshToken) {
      await tokenStorage.setTokens(res.data.accessToken, res.data.refreshToken);
      return true;
    }

    return false;
  } catch (err) {
    console.error('[Token Refresh Error]', err);
    return false;
  }
}