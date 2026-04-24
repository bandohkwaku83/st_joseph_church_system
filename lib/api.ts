
const API_BASE =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) ||
  '';

export function getApiBase(): string {
  return API_BASE;
}

export interface ApiFetchOptions extends Omit<RequestInit, 'credentials'> {
  /** Default true – always send credentials so auth cookie is included */
  credentials?: RequestInit['credentials'];
  /** Whether this request requires authentication */
  requireAuth?: boolean;
  /** Whether to retry on auth failure */
  retryOnAuth?: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, any>;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: ApiError;
  status: number;
}

export async function apiFetch(
  path: string,
  options: ApiFetchOptions = {}
): Promise<Response> {
  let url: string;
  
  if (path.startsWith('http')) {
    url = path;
  } else {
    // Check if API base is configured
    if (!API_BASE) {
      throw new Error('API base URL not configured. Please set NEXT_PUBLIC_API_URL in your environment variables.');
    }
    
    // Properly join API_BASE and path, handling trailing/leading slashes
    const base = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
    const endpoint = path.startsWith('/') ? path : `/${path}`;
    url = `${base}${endpoint}`;
  }
  
  // Prepare headers with automatic Bearer token inclusion
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  
  // Automatically include Bearer token if available (unless already provided in headers)
  if (typeof window !== 'undefined' && !headers.Authorization) {
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      credentials: options.credentials ?? 'include',
      headers,
    });
    
    return response;
  } catch (error) {
    console.error('Fetch error:', error);
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Unable to connect to the server at ${url}. Please check if the backend is running and accessible.`);
    }
    
    // Re-throw other errors
    throw error;
  }
}

export async function apiRequest<T = any>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await apiFetch(path, options);
    
    let data: T | undefined;
    let error: ApiError | undefined;
    
    // Try to parse JSON response
    try {
      const json = await response.json();
      if (response.ok) {
        data = json;
      } else {
        error = {
          message: json.message || json.error || 'An error occurred',
          code: json.code,
          details: json.details,
        };
      }
    } catch (parseError) {
      // If JSON parsing fails, create error from status
      if (!response.ok) {
        error = {
          message: `Request failed with status ${response.status}`,
          code: response.status.toString(),
        };
      }
    }
    
    return {
      data,
      error,
      status: response.status,
    };
  } catch (networkError) {
    return {
      error: {
        message: networkError instanceof Error ? networkError.message : 'Network error occurred',
        code: 'NETWORK_ERROR',
      },
      status: 0,
    };
  }
}
