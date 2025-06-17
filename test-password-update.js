// Simple test script for password update API
const fetch = require('node-fetch');

async function testPasswordUpdate() {
  try {
    console.log('Testing password update API...');
    
    // Test the API endpoint (this will fail without proper auth, but we can see if it's responding)
    const response = await fetch('http://localhost:3000/api/v1/users/test-id/update-password', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({ 
        newPassword: 'testpassword123' 
      })
    });
    
    const result = await response.text();
    console.log('Response status:', response.status);
    console.log('Response body:', result);
    
    // We expect a 401 (unauthorized) response, which means the endpoint is working
    if (response.status === 401) {
      console.log('✅ API endpoint is responding correctly (401 Unauthorized as expected)');
    } else {
      console.log('❓ Unexpected response status');
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

// Only run if this script is executed directly
if (require.main === module) {
  testPasswordUpdate();
}

module.exports = { testPasswordUpdate };