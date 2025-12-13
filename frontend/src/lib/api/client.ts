import type { ApiError } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  console.warn('NEXT_PUBLIC_API_URL environment variable is not set');
}

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

  // Build URL with query params
  let url = `${API_URL}${endpoint}`;
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
