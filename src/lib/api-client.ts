/**
 * API Client Configuration
 * 
 * A centralized API client utility with environment-aware configuration,
 * authentication handling, and response parsing.
 * Optimized for domain transitions with relative path support.
 */

import { getApiUrl, getEnvironment, isDevelopment } from './environment';

interface FetchOptions extends RequestInit {
  token?: string;
  params?: Record<string, string>;
  useAbsoluteUrl?: boolean; // New flag to control absolute vs. relative URL usage
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  status?: number;
}

/**
 * Handle API errors consistently
 */
class ApiError extends Error {
  public readonly status: number;
  public readonly data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Generate a full API URL, preferring relative paths when possible
 * @param {string} endpoint - The API endpoint
 * @param {Record<string, string>} [params] - Query parameters
 * @param {boolean} [useAbsoluteUrl=false] - Force using absolute URL even if not needed
 * @returns {string} The API URL (relative or absolute)
 */
function getUrl(endpoint: string, params?: Record<string, string>, useAbsoluteUrl = false): string {
  // Clean up the endpoint
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // Ensure endpoint starts with /api/v1 if it doesn't already
  let formattedEndpoint = cleanEndpoint;
  if (!formattedEndpoint.startsWith('/api/v1/') && !formattedEndpoint.startsWith('/api/v')) {
    formattedEndpoint = formattedEndpoint.startsWith('/api/')
      ? `/api/v1${formattedEndpoint.substring(4)}`
      : `/api/v1${formattedEndpoint}`;
  }
  
  // Use relative URL if we're in the browser and not forcing absolute URL
  if (typeof window !== 'undefined' && !useAbsoluteUrl) {
    const url = new URL(formattedEndpoint, window.location.origin);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    
    // Return only the path + query string for relative URLs
    return `${url.pathname}${url.search}`;
  }
  
  // Otherwise use absolute URL with environment-specific base
  const baseUrl = getApiUrl();
  const url = new URL(formattedEndpoint.startsWith('/') 
    ? formattedEndpoint.slice(1) 
    : formattedEndpoint, baseUrl);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }
  
  return url.toString();
}

/**
 * Make an API request with consistent error handling and response parsing
 * @param {string} endpoint - The API endpoint
 * @param {FetchOptions} options - Request options
 * @returns {Promise<T>} The API response data
 */
async function request<T = any>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { token, params, useAbsoluteUrl, ...fetchOptions } = options;
  const url = getUrl(endpoint, params, useAbsoluteUrl);
  
  // Default headers
  const headers = new Headers(fetchOptions.headers);
  headers.set('Content-Type', 'application/json');
  
  // Add authorization header if token provided
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  // Add development tracking header if in development
  if (isDevelopment()) {
    headers.set('X-Environment', getEnvironment());
  }
  
  // Make the request
  const response = await fetch(url, {
    ...fetchOptions,
    headers,
    // Include credentials for cross-domain requests
    credentials: 'include',
  });
  
  // Parse the response
  let data: ApiResponse<T>;
  try {
    data = await response.json();
  } catch (error) {
    throw new ApiError(`Failed to parse response from ${endpoint}`, response.status);
  }
  
  // Handle errors
  if (!response.ok) {
    throw new ApiError(
      data.message || data.error || `API error: ${response.statusText}`,
      response.status,
      data
    );
  }
  
  // Return the data
  return data.data as T;
}

// Export convenience methods for each HTTP method
const apiClient = {
  get: <T = any>(endpoint: string, options: FetchOptions = {}) => 
    request<T>(endpoint, { method: 'GET', ...options }),
    
  post: <T = any>(endpoint: string, data: any, options: FetchOptions = {}) => 
    request<T>(endpoint, { 
      method: 'POST', 
      body: JSON.stringify(data), 
      ...options 
    }),
    
  put: <T = any>(endpoint: string, data: any, options: FetchOptions = {}) => 
    request<T>(endpoint, { 
      method: 'PUT', 
      body: JSON.stringify(data), 
      ...options 
    }),
    
  patch: <T = any>(endpoint: string, data: any, options: FetchOptions = {}) => 
    request<T>(endpoint, { 
      method: 'PATCH', 
      body: JSON.stringify(data), 
      ...options 
    }),
    
  delete: <T = any>(endpoint: string, options: FetchOptions = {}) => 
    request<T>(endpoint, { method: 'DELETE', ...options }),
};

export default apiClient;
export { ApiError };