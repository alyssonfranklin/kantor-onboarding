import { NextResponse, type NextRequest } from 'next/server';
import { getEnvironment, isDevelopment } from '@/lib/environment';

/**
 * API Middleware Configuration
 * 
 * This middleware handles:
 * 1. API versioning with /api/v1/ prefix
 * 2. CORS headers for cross-domain requests
 * 3. Domain-specific behavior during transition
 */

// Define allowed origins for CORS
const getAllowedOrigins = () => {
  const env = getEnvironment();
  
  // Default allowed origins
  let origins = [
    'http://localhost:3000',
    'https://app.voxerion.com',
  ];
  
  // In development, allow more testing origins
  if (isDevelopment()) {
    origins = [
      ...origins,
      'http://localhost:8000',
      'http://127.0.0.1:3000',
    ];
  }
  
  return origins;
};

// Match all API routes
export const config = {
  matcher: ['/api/:path*'],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();
  
  // Skip version prefixing for special endpoints
  if (pathname === '/api/health' || 
      pathname.startsWith('/api/admin/') || 
      pathname === '/api/verify-password') {
    return response;
  }
  
  // Special handling for login route
  if (pathname === '/api/users/login') {
    // Redirect to the auth login endpoint
    const url = request.nextUrl.clone();
    url.pathname = '/api/v1/auth/login';
    return NextResponse.rewrite(url);
  }
  
  // 1. Handle API versioning 
  // Check if request already has version prefix
  if (!pathname.match(/^\/api\/v[0-9]+\//)) {
    // Rewrite the URL to include v1 prefix
    const url = request.nextUrl.clone();
    url.pathname = `/api/v1${pathname.substring(4)}`;
    
    // Return a rewrite response
    return NextResponse.rewrite(url);
  }
  
  // 2. Add CORS headers for all API responses
  const origin = request.headers.get('origin');
  const allowedOrigins = getAllowedOrigins();
  
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    const preflightResponse = new NextResponse(null, { status: 204 });
    
    preflightResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    preflightResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    preflightResponse.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
    
    // Allow the origin if it's in our allowed list
    if (origin && allowedOrigins.includes(origin)) {
      preflightResponse.headers.set('Access-Control-Allow-Origin', origin);
      preflightResponse.headers.set('Access-Control-Allow-Credentials', 'true');
    }
    
    return preflightResponse;
  }
  
  // For non-preflight requests, set CORS headers
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }
  
  // Add a custom header to indicate the environment
  response.headers.set('X-Voxerion-Environment', getEnvironment());
  
  return response;
}