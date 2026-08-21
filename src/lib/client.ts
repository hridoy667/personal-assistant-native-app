import * as SecureStore from 'expo-secure-store';

// Define the root tunnel host without /api attached
const LOCAL_TUNNEL_URL = 'http://192.168.1.4:5000/api';

// Strip trailing slash if present
const RAW_BASE = (process.env.EXPO_PUBLIC_API_URL || LOCAL_TUNNEL_URL).replace(/\/$/, '');
// Ensure base ends with /api
const API_BASE_URL = RAW_BASE.endsWith('/api') ? RAW_BASE : `${RAW_BASE}/api`;

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
  const { requiresAuth = true, headers, body, method = 'GET', ...restOptions } = options;

  // Format path endpoint
  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  // Prevent duplicate /api/api occurrences
  const cleanEndpoint = formattedEndpoint.startsWith('/api/')
    ? formattedEndpoint.replace('/api', '')
    : formattedEndpoint;

  const targetUrl = `${API_BASE_URL}${cleanEndpoint}`;

  const reqHeaders: Record<string, string> = {
    'Bypass-Tunnel-Reminder': 'true',
    'ngrok-skip-browser-warning': 'true',
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

  // LOG OUTGOING REQUEST
  console.log(`[API Request] ${method} -> ${targetUrl}`);

  let response: Response;

  try {
    response = await fetch(targetUrl, {
      method,
      ...restOptions,
      headers: reqHeaders,
      body,
    });
  } catch (networkError) {
    console.error(`[API Network Error] Failed to fetch from: ${targetUrl}`, networkError);
    throw new Error(`Unable to reach server at ${API_BASE_URL}. Check network connection.`);
  }

  console.log(`[API Response Status] ${response.status} from ${targetUrl}`);

  // Handle Token Expiration (401 Unauthorized) -> Attempt Refresh
  if (response.status === 401 && requiresAuth) {
    console.log('[API Auth] 401 Received. Attempting token refresh...');
    const refreshed = await getOrStartRefresh();
    if (refreshed) {
      const newAccessToken = await tokenStorage.getAccessToken();
      reqHeaders['Authorization'] = `Bearer ${newAccessToken}`;

      try {
        response = await fetch(targetUrl, {
          method,
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

  const rawText = await response.text();

  // Guard against completely empty response bodies (e.g., HTTP 200 with no content)
  if (!rawText || rawText.trim() === '') {
    if (!response.ok) {
      const errorMsg = extractErrorMessage({}, response.status);
      console.error(`[API Error] ${response.status}:`, errorMsg);
      throw new Error(errorMsg);
    }
    return null as T;
  }

  let responseData: any = null;
  let isJson = true;

  try {
    responseData = JSON.parse(rawText);
  } catch {
    isJson = false;
  }

  if (!response.ok) {
    // If response was non-JSON, pass rawText so error extraction receives context
    const errorMsg = extractErrorMessage(isJson ? responseData : rawText, response.status);
    console.error(`[API Error] ${response.status}:`, errorMsg);
    throw new Error(errorMsg);
  }

  if (!isJson) {
    console.warn('[API Client] Non-JSON Response received:', rawText.slice(0, 150));
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