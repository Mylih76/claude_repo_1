import type { ApiError } from './types';

// Get API URL - must include /api prefix to match backend
function getApiUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;

  // Debug: log what we got from env
  console.log('[API Client] Raw env value:', envUrl, 'Type:', typeof envUrl);

  if (envUrl && envUrl !== 'undefined') {
    // Ensure /api suffix exists
    return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
  }

  // Fallback for development
  return 'http://localhost:3000/api';
}

const API_URL = getApiUrl();
console.log('[API Client] Final API_URL:', API_URL);

// ============================================
// Token Storage
// ============================================

const TOKEN_KEY = 'auth_token';

export const tokenStorage = {
  get: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },
  set: (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
  },
  remove: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
  },
};

// ============================================
// Custom Error Class
// ============================================

export class ApiClientError extends Error {
  constructor(
    public status: number,
    public errorCode: string,
    public details?: string[]
  ) {
    super(errorCode);
    this.name = 'ApiClientError';
  }

  static fromApiError(status: number, error: ApiError): ApiClientError {
    return new ApiClientError(status, error.errorCode, error.details);
  }
}

// ============================================
// API Client
// ============================================

type RequestMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

interface RequestOptions<TBody = unknown> {
  method?: RequestMethod;
  body?: TBody;
  params?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  skipAuth?: boolean;
}

async function request<TResponse, TBody = unknown>(
  endpoint: string,
  options: RequestOptions<TBody> = {}
): Promise<TResponse> {
  const { method = 'GET', body, params, headers = {}, skipAuth = false } = options;

  // Defensive guard: check endpoint is valid
  if (!endpoint || endpoint.includes('undefined')) {
    throw new Error(`[API Client] Invalid endpoint: ${endpoint}`);
  }

  // Build URL with query params
  let url = `${API_URL}${endpoint}`;

  // Defensive guard: ensure URL is absolute and valid
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    throw new Error(`[API Client] Invalid URL (not absolute): ${url}. API_URL=${API_URL}, endpoint=${endpoint}`);
  }
  if (url.includes('undefined')) {
    throw new Error(`[API Client] URL contains undefined: ${url}. API_URL=${API_URL}, endpoint=${endpoint}`);
  }

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  // Build headers
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // Add auth token if available and not skipped
  if (!skipAuth) {
    const token = tokenStorage.get();
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  // Debug log - remove after fixing
  console.log('[API Client] Request:', method, url);

  // Make request
  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Handle response
  if (!response.ok) {
    let errorData: ApiError;
    try {
      errorData = await response.json();
    } catch {
      errorData = {
        errorCode: 'UNKNOWN_ERROR',
        message: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    // Handle 401 - clear token and potentially redirect
    if (response.status === 401) {
      tokenStorage.remove();
      // Let the auth context handle the redirect
    }

    throw ApiClientError.fromApiError(response.status, errorData);
  }

  // Handle empty responses (e.g., 204 No Content)
  if (response.status === 204) {
    return undefined as TResponse;
  }

  return response.json();
}

// ============================================
// HTTP Method Helpers
// ============================================

export const apiClient = {
  get<TResponse>(
    endpoint: string,
    options?: Omit<RequestOptions, 'method' | 'body'>
  ): Promise<TResponse> {
    return request<TResponse>(endpoint, { ...options, method: 'GET' });
  },

  post<TResponse, TBody = unknown>(
    endpoint: string,
    body?: TBody,
    options?: Omit<RequestOptions<TBody>, 'method' | 'body'>
  ): Promise<TResponse> {
    return request<TResponse, TBody>(endpoint, { ...options, method: 'POST', body });
  },

  patch<TResponse, TBody = unknown>(
    endpoint: string,
    body?: TBody,
    options?: Omit<RequestOptions<TBody>, 'method' | 'body'>
  ): Promise<TResponse> {
    return request<TResponse, TBody>(endpoint, { ...options, method: 'PATCH', body });
  },

  put<TResponse, TBody = unknown>(
    endpoint: string,
    body?: TBody,
    options?: Omit<RequestOptions<TBody>, 'method' | 'body'>
  ): Promise<TResponse> {
    return request<TResponse, TBody>(endpoint, { ...options, method: 'PUT', body });
  },

  delete<TResponse>(
    endpoint: string,
    options?: Omit<RequestOptions, 'method' | 'body'>
  ): Promise<TResponse> {
    return request<TResponse>(endpoint, { ...options, method: 'DELETE' });
  },
};
