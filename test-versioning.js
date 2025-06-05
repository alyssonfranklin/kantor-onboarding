/**
 * API Versioning Test
 * 
 * This script validates that requests to non-versioned API endpoints 
 * are properly redirected to the versioned endpoints.
 */

// Mock Next.js request and middleware
const mockRequest = (path) => {
  const url = new URL(`http://localhost:3000${path}`);
  
  return {
    nextUrl: url,
    url: url.toString(),
    method: 'GET',
    headers: new Map([
      ['host', 'localhost:3000'],
      ['origin', 'http://localhost:3000']
    ]),
    cookies: {
      get: () => null
    }
  };
};

const mockNext = () => {
  return {
    rewrite: (url) => {
      return { type: 'rewrite', url };
    },
    next: () => {
      return { type: 'next' };
    }
  };
};

// Import middleware code inline for testing
const isHealthEndpoint = (pathname) => {
  return pathname === '/api/health';
};

const handler = (req) => {
  const { pathname } = req.nextUrl;
  
  // Skip version prefixing for health check endpoints
  if (isHealthEndpoint(pathname)) {
    return { type: 'next' };
  }
  
  // 1. Handle API versioning 
  // Check if request already has version prefix
  if (!pathname.match(/^\/api\/v[0-9]+\//)) {
    // Rewrite the URL to include v1 prefix
    const url = req.nextUrl.clone();
    url.pathname = `/api/v1${pathname.substring(4)}`;
    
    // Return a rewrite response
    return { type: 'rewrite', url };
  }
  
  return { type: 'next' };
};

// Test cases
const testCases = [
  {
    path: '/api/health',
    expected: 'next',
    description: 'Health endpoint should skip versioning'
  },
  {
    path: '/api/users',
    expected: '/api/v1/users',
    description: 'API endpoint should be rewritten to include v1'
  },
  {
    path: '/api/companies/domain',
    expected: '/api/v1/companies/domain',
    description: 'Nested API endpoint should be rewritten to include v1'
  },
  {
    path: '/api/v1/users',
    expected: 'next',
    description: 'Already versioned endpoint should not be rewritten'
  },
  {
    path: '/api/v2/users',
    expected: 'next',
    description: 'Different version should not be rewritten'
  }
];

// Run tests
console.log('API Versioning Test');
console.log('==================\n');

let passedTests = 0;

testCases.forEach((test, index) => {
  console.log(`Test #${index + 1}: ${test.description}`);
  console.log(`Path: ${test.path}`);
  
  const req = mockRequest(test.path);
  const result = handler(req);
  
  if (result.type === 'next' && test.expected === 'next') {
    console.log('✓ PASSED: Request was passed through as expected\n');
    passedTests++;
  } else if (result.type === 'rewrite' && result.url.pathname === test.expected) {
    console.log(`✓ PASSED: Request was rewritten to ${result.url.pathname}\n`);
    passedTests++;
  } else {
    console.log(`✗ FAILED: Expected ${test.expected}, got ${result.type === 'rewrite' ? result.url.pathname : 'next'}\n`);
  }
});

console.log(`Results: ${passedTests}/${testCases.length} tests passed`);

if (passedTests === testCases.length) {
  console.log('All tests passed! The API versioning middleware is working correctly.');
} else {
  console.log('Some tests failed. Please check the implementation.');
}