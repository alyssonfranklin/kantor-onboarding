/**
 * API Configuration Test Script
 * 
 * This script tests the API routes configuration, including:
 * 1. API versioning with /api/v1/ prefix
 * 2. CORS support for cross-domain requests
 * 3. Authentication cookie handling
 * 
 * Usage: node test-api-config.js
 */

const fetch = require('node-fetch');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const TEST_EMAIL = 'admin@voxerion.com';
const TEST_PASSWORD = 'admin123';

// Test functions
async function testHealthEndpoint() {
  console.log('Testing health endpoint...');
  
  try {
    // Test standard health endpoint
    const response = await fetch(`${BASE_URL}/api/health`);
    const data = await response.json();
    
    console.log('✓ Health endpoint status:', data.status);
    console.log('✓ Health endpoint environment:', data.environment);
    console.log('✓ Health endpoint path:', data.request.path);
    
    return true;
  } catch (error) {
    console.error('✗ Health endpoint test failed:', error.message);
    return false;
  }
}

async function testVersionedEndpoint() {
  console.log('\nTesting API versioning...');
  
  try {
    // Make request to /api/users endpoint which should be rewritten to /api/v1/users
    const response = await fetch(`${BASE_URL}/api/users`);
    
    console.log('✓ Response status:', response.status);
    console.log('✓ Final URL:', response.url);
    
    if (response.url.includes('/api/v1/')) {
      console.log('✓ API versioning is working correctly');
      return true;
    } else {
      console.log('✗ API versioning not detected in URL');
      return false;
    }
  } catch (error) {
    console.error('✗ API versioning test failed:', error.message);
    return false;
  }
}

async function testAuthentication() {
  console.log('\nTesting authentication and cookie handling...');
  
  try {
    // Login to get token and cookie
    const loginResponse = await fetch(`${BASE_URL}/api/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })
    });
    
    if (!loginResponse.ok) {
      console.log('✗ Login failed with status:', loginResponse.status);
      return false;
    }
    
    const loginData = await loginResponse.json();
    console.log('✓ Login successful');
    
    // Check if we got a token
    if (!loginData.token) {
      console.log('✗ No token returned from login');
      return false;
    }
    console.log('✓ Token received');
    
    // Get cookies from response
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('✓ Cookie information:', cookies ? 'Cookie set' : 'No cookie set');
    
    // Now test using the token for authentication
    const testAuthResponse = await fetch(`${BASE_URL}/api/users`, {
      headers: {
        'Authorization': `Bearer ${loginData.token}`
      }
    });
    
    if (testAuthResponse.ok) {
      console.log('✓ Authentication with token successful');
      return true;
    } else {
      console.log('✗ Authentication with token failed');
      return false;
    }
  } catch (error) {
    console.error('✗ Authentication test failed:', error.message);
    return false;
  }
}

async function testCrossOriginRequest() {
  console.log('\nTesting CORS configuration...');
  
  try {
    // Simulate a request from a different origin
    const response = await fetch(`${BASE_URL}/api/health`, {
      headers: {
        'Origin': 'https://app.voxerion.com'
      }
    });
    
    const corsHeader = response.headers.get('access-control-allow-origin');
    console.log('✓ CORS Allow-Origin header:', corsHeader || 'None');
    
    if (corsHeader) {
      console.log('✓ CORS is configured');
      return true;
    } else {
      console.log('✗ CORS headers not detected');
      return false;
    }
  } catch (error) {
    console.error('✗ CORS test failed:', error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('API Configuration Test Script');
  console.log('===========================');
  console.log('Testing against:', BASE_URL);
  console.log('');
  
  let results = {
    health: await testHealthEndpoint(),
    versioning: await testVersionedEndpoint(),
    authentication: await testAuthentication(),
    cors: await testCrossOriginRequest()
  };
  
  console.log('\nTest Results Summary');
  console.log('===================');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✓' : '✗'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const allPassed = Object.values(results).every(Boolean);
  console.log('\nOverall result:', allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED');
}

// Execute tests
runTests().catch(console.error);