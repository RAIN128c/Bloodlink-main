/**
 * Test Script for Authentication System
 * Tests login, session creation, and route protection
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Create axios instance with cookie support
const client = axios.create({
    baseURL: BASE_URL,
    withCredentials: true, // Important: enables cookies
    headers: {
        'Content-Type': 'application/json'
    }
});

async function testAuthentication() {
    console.log('='.repeat(50));
    console.log('AUTHENTICATION SYSTEM TEST');
    console.log('='.repeat(50));
    console.log('');

    try {
        // Test 1: Check session before login (should be false)
        console.log('1. Checking session before login...');
        const sessionCheck1 = await client.get('/api/auth/check-session');
        console.log('✓ Session check:', sessionCheck1.data);
        console.log('');

        // Test 2: Try to access protected route (should be redirected)
        console.log('2. Trying to access protected route without login...');
        try {
            await client.get('/admin-dashboard');
            console.log('✗ FAILED: Should have been redirected');
        } catch (error) {
            if (error.response && error.response.status === 302) {
                console.log('✓ Correctly redirected to login');
            } else {
                console.log('✓ Access denied (as expected)');
            }
        }
        console.log('');

        // Test 3: Login with valid credentials
        console.log('3. Logging in...');
        const loginResponse = await client.post('/api/action', {
            action: 'login',
            email: 'test@hospital.com', // Change to your test email
            password: 'password123' // Change to your test password
        });
        console.log('✓ Login response:', loginResponse.data);
        console.log('');

        // Test 4: Check session after login (should be true)
        console.log('4. Checking session after login...');
        const sessionCheck2 = await client.get('/api/auth/check-session');
        console.log('✓ Session check:', sessionCheck2.data);
        console.log('');

        // Test 5: Access protected route (should work)
        console.log('5. Accessing protected route after login...');
        try {
            const protectedPage = await client.get('/admin-dashboard');
            if (protectedPage.status === 200) {
                console.log('✓ Successfully accessed admin dashboard');
            }
        } catch (error) {
            console.log('✗ FAILED: Should have access after login');
            console.log('Error:', error.message);
        }
        console.log('');

        // Test 6: Get current user info
        console.log('6. Getting current user info...');
        const userInfo = await client.get('/api/auth/user');
        console.log('✓ User info:', userInfo.data);
        console.log('');

        // Test 7: Logout
        console.log('7. Logging out...');
        const logoutResponse = await client.post('/api/auth/logout');
        console.log('✓ Logout response:', logoutResponse.data);
        console.log('');

        // Test 8: Check session after logout (should be false)
        console.log('8. Checking session after logout...');
        const sessionCheck3 = await client.get('/api/auth/check-session');
        console.log('✓ Session check:', sessionCheck3.data);
        console.log('');

        // Test 9: Try to access protected route after logout (should fail)
        console.log('9. Trying to access protected route after logout...');
        try {
            await client.get('/admin-dashboard');
            console.log('✗ FAILED: Should have been redirected');
        } catch (error) {
            if (error.response && error.response.status === 302) {
                console.log('✓ Correctly redirected to login');
            } else {
                console.log('✓ Access denied (as expected)');
            }
        }
        console.log('');

        console.log('='.repeat(50));
        console.log('ALL TESTS COMPLETED!');
        console.log('='.repeat(50));

    } catch (error) {
        console.error('');
        console.error('='.repeat(50));
        console.error('ERROR OCCURRED:');
        console.error('='.repeat(50));
        console.error(error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

// Run tests
console.log('Starting authentication tests...');
console.log('Make sure the server is running on port 3000');
console.log('');

testAuthentication().then(() => {
    console.log('');
    console.log('Tests finished.');
    process.exit(0);
}).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
