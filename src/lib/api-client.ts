/**
 * API Client Configuration
 * 
 * A centralized API client utility with environment-aware configuration,
 * authentication handling, and response parsing.
 */

import { getApiUrl, getEnvironment, isDevelopment } from './environment';

interface FetchOptions extends RequestInit {
  token?: string;
  params?: Record<string, string>;
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
 * Generate a full API URL
 * @param {string} endpoint - The API endpoint
 * @param {Record<string, string>} [params] - Query parameters
 * @returns {string} The full API URL
 */
function getUrl(endpoint: string, params?: Record<string, string>): string {
  const baseUrl = getApiUrl();
  const url = new URL(endpoint.startsWith('/') ? endpoint.slice(1) : endpoint, baseUrl);
  
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
  const { token, params, ...fetchOptions } = options;
  const url = getUrl(endpoint, params);
  
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