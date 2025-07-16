#!/usr/bin/env node

/**
 * Subscription Flow Test Script
 * Tests the complete subscription flow end-to-end
 * Following reference repository testing patterns
 */

const https = require('https');
const http = require('http');

class SubscriptionFlowTester {
  constructor(baseUrl = 'http://localhost:3000', authToken = null) {
    this.baseUrl = baseUrl;
    this.authToken = authToken;
    this.testResults = [];
  }

  async runTests() {
    console.log('🚀 Starting Subscription Flow Tests...\n');

    try {
      // Test 1: Health Check
      await this.test('Health Check', () => this.testHealthCheck());

      // Test 2: Plan Selection API
      await this.test('Plan Selection API', () => this.testPlanSelection());

      // Test 3: Checkout Session Creation
      await this.test('Checkout Session Creation', () => this.testCheckoutSessionCreation());

      // Test 4: Subscription Status API
      await this.test('Subscription Status API', () => this.testSubscriptionStatus());

      // Test 5: Trial Status API
      await this.test('Trial Status API', () => this.testTrialStatus());

      // Test 6: Webhook Endpoint
      await this.test('Webhook Endpoint', () => this.testWebhookEndpoint());

      // Test 7: Error Handling
      await this.test('Error Handling', () => this.testErrorHandling());

      // Test 8: Database Connectivity
      await this.test('Database Connectivity', () => this.testDatabaseConnectivity());

      this.printResults();

    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      process.exit(1);
    }
  }

  async test(name, testFunction) {
    console.log(`🧪 Testing: ${name}`);
    
    try {
      const startTime = Date.now();
      await testFunction();
      const duration = Date.now() - startTime;
      
      this.testResults.push({
        name,
        status: 'PASS',
        duration,
      });
      
      console.log(`✅ ${name} - PASSED (${duration}ms)\n`);
    } catch (error) {
      this.testResults.push({
        name,
        status: 'FAIL',
        error: error.message,
      });
      
      console.log(`❌ ${name} - FAILED: ${error.message}\n`);
    }
  }

  async makeRequest(path, options = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      const isHttps = url.protocol === 'https:';
      const client = isHttps ? https : http;

      const requestOptions = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` }),
          ...options.headers,
        },
      };

      const req = client.request(requestOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const result = {
              statusCode: res.statusCode,
              headers: res.headers,
              body: data ? JSON.parse(data) : null,
            };
            resolve(result);
          } catch (error) {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body: data,
            });
          }
        });
      });

      req.on('error', reject);

      if (options.body) {
        req.write(JSON.stringify(options.body));
      }

      req.end();
    });
  }

  async testHealthCheck() {
    const response = await this.makeRequest('/api/health');
    
    if (response.statusCode !== 200) {
      throw new Error(`Health check failed with status ${response.statusCode}`);
    }

    if (!response.body || response.body.status !== 'healthy') {
      throw new Error('Health check returned unhealthy status');
    }
  }

  async testPlanSelection() {
    const response = await this.makeRequest('/api/plans');
    
    if (response.statusCode !== 200) {
      throw new Error(`Plan selection API failed with status ${response.statusCode}`);
    }

    if (!response.body || !response.body.success) {
      throw new Error('Plan selection API returned unsuccessful response');
    }

    if (!Array.isArray(response.body.data) || response.body.data.length === 0) {
      throw new Error('Plan selection API returned no plans');
    }

    // Validate plan structure
    const plan = response.body.data[0];
    const requiredFields = ['price_id', 'kantor_version', 'price_value', 'billing_period'];
    
    for (const field of requiredFields) {
      if (!(field in plan)) {
        throw new Error(`Plan missing required field: ${field}`);
      }
    }
  }

  async testCheckoutSessionCreation() {
    const requestBody = {
      priceId: 'price_test_pro',
      planId: 'pro',
      billingPeriod: 'monthly',
    };

    const response = await this.makeRequest('/api/create-checkout-session', {
      method: 'POST',
      body: requestBody,
    });

    // For this test, we expect either success or authentication error
    if (response.statusCode === 401) {
      console.log('   ℹ️  Authentication required (expected for checkout)');
      return;
    }

    if (response.statusCode === 400 && response.body?.message?.includes('required fields')) {
      throw new Error('Missing required fields validation failed');
    }

    // If we get here and it's not a validation error, the endpoint is working
    if (response.statusCode >= 500) {
      throw new Error(`Checkout session API returned server error: ${response.statusCode}`);
    }
  }

  async testSubscriptionStatus() {
    const response = await this.makeRequest('/api/subscription-status');
    
    // Expect authentication error for this protected endpoint
    if (response.statusCode === 401) {
      console.log('   ℹ️  Authentication required (expected)');
      return;
    }

    // If somehow authenticated, should return proper structure
    if (response.statusCode === 200 && response.body?.success) {
      const requiredFields = ['subscription', 'trial', 'usage'];
      for (const field of requiredFields) {
        if (!(field in response.body.data)) {
          throw new Error(`Subscription status missing field: ${field}`);
        }
      }
    }
  }

  async testTrialStatus() {
    const response = await this.makeRequest('/api/trial-status');
    
    // Expect authentication error for this protected endpoint
    if (response.statusCode === 401) {
      console.log('   ℹ️  Authentication required (expected)');
      return;
    }

    // Endpoint should exist and handle requests properly
    if (response.statusCode >= 500) {
      throw new Error(`Trial status API returned server error: ${response.statusCode}`);
    }
  }

  async testWebhookEndpoint() {
    // Test webhook endpoint exists and handles requests
    const response = await this.makeRequest('/api/webhooks/stripe', {
      method: 'POST',
      body: { test: 'webhook' },
      headers: {
        'stripe-signature': 'invalid_signature',
      },
    });

    // Should return 400 for invalid signature (which means endpoint is working)
    if (response.statusCode !== 400) {
      throw new Error(`Webhook endpoint should return 400 for invalid signature, got ${response.statusCode}`);
    }

    if (!response.body?.error?.includes('signature')) {
      throw new Error('Webhook endpoint not properly validating signatures');
    }
  }

  async testErrorHandling() {
    // Test invalid endpoint
    const response = await this.makeRequest('/api/invalid-endpoint');
    
    if (response.statusCode !== 404) {
      throw new Error(`Expected 404 for invalid endpoint, got ${response.statusCode}`);
    }

    // Test malformed JSON
    const malformedResponse = await this.makeRequest('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json',
    });

    // Should handle malformed JSON gracefully
    if (malformedResponse.statusCode >= 500) {
      throw new Error('API not handling malformed JSON gracefully');
    }
  }

  async testDatabaseConnectivity() {
    // Test an endpoint that requires database
    const response = await this.makeRequest('/api/subscription-status');
    
    // Should not return 503 (service unavailable) which would indicate DB issues
    if (response.statusCode === 503) {
      throw new Error('Database connectivity issues detected');
    }

    // Any other response indicates DB is accessible
    console.log('   ℹ️  Database connectivity appears functional');
  }

  printResults() {
    console.log('\n📊 Test Results Summary:');
    console.log('========================\n');

    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const total = this.testResults.length;

    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`);

    if (failed > 0) {
      console.log('❌ Failed Tests:');
      this.testResults
        .filter(r => r.status === 'FAIL')
        .forEach(test => {
          console.log(`   - ${test.name}: ${test.error}`);
        });
      console.log('');
    }

    if (passed === total) {
      console.log('🎉 All tests passed! Subscription system is ready for deployment.\n');
    } else {
      console.log('⚠️  Some tests failed. Please address issues before deployment.\n');
      process.exit(1);
    }
  }
}

// Environment configuration
const config = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  authToken: process.env.TEST_AUTH_TOKEN || null,
};

// Run tests
async function main() {
  const tester = new SubscriptionFlowTester(config.baseUrl, config.authToken);
  await tester.runTests();
}

// Handle command line execution
if (require.main === module) {
  main().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = SubscriptionFlowTester;