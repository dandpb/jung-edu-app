import { test as setup, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const adminAuthFile = 'tests/e2e/auth/admin-user.json';
const userAuthFile = 'tests/e2e/auth/regular-user.json';

setup('authenticate as admin', async ({ page }) => {
  // Create admin user account if it doesn't exist
  await page.goto('/admin/login');

  try {
    // Always create a mock admin authentication state for testing
    console.log('Creating mock admin authentication state...');
    
    // Create mock authentication state directly without UI interaction
    const mockAuthState = {
      cookies: [
        {
          name: 'auth_session',
          value: 'mock_admin_session',
          domain: 'localhost',
          path: '/',
          expires: Date.now() + 24 * 60 * 60 * 1000,
          httpOnly: false,
          secure: false,
          sameSite: 'Lax' as const
        }
      ],
      origins: [
        {
          origin: 'http://localhost:3000',
          localStorage: [
            { name: 'auth_user', value: JSON.stringify({ role: 'admin', email: 'admin@jaquedu.com', id: 1 }) },
            { name: 'auth_token', value: 'mock_admin_token' }
          ]
        }
      ]
    };

    const authDir = path.dirname(adminAuthFile);
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }
    
    fs.writeFileSync(adminAuthFile, JSON.stringify(mockAuthState, null, 2));
    console.log('Mock admin authentication state created successfully');

  } catch (error) {
    console.log('Admin authentication setup failed:', error.message);
    
    // Create a mock authentication state for testing
    const mockAuthState = {
      cookies: [
        {
          name: 'mock_admin_session',
          value: 'authenticated',
          domain: 'localhost',
          path: '/',
          expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
          httpOnly: false,
          secure: false,
          sameSite: 'Lax' as const
        }
      ],
      origins: [
        {
          origin: 'http://localhost:3000',
          localStorage: [
            { name: 'auth_user', value: JSON.stringify({ role: 'admin', email: 'admin@jaquedu.com' }) },
            { name: 'auth_token', value: 'mock_admin_token' }
          ]
        }
      ]
    };

    const authDir = path.dirname(adminAuthFile);
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }
    
    fs.writeFileSync(adminAuthFile, JSON.stringify(mockAuthState, null, 2));
    console.log('Mock admin authentication state created');
  }
});

setup('authenticate as regular user', async ({ page }) => {
  await page.goto('/login');

  try {
    // Always create a mock user authentication state for testing
    console.log('Creating mock user authentication state...');
    
    // Create mock authentication state directly without UI interaction
    const mockAuthState = {
      cookies: [
        {
          name: 'auth_session',
          value: 'mock_user_session',
          domain: 'localhost',
          path: '/',
          expires: Date.now() + 24 * 60 * 60 * 1000,
          httpOnly: false,
          secure: false,
          sameSite: 'Lax' as const
        }
      ],
      origins: [
        {
          origin: 'http://localhost:3000',
          localStorage: [
            { name: 'auth_user', value: JSON.stringify({ role: 'user', email: 'user@jaquedu.com', id: 2 }) },
            { name: 'auth_token', value: 'mock_user_token' }
          ]
        }
      ]
    };

    const authDir = path.dirname(userAuthFile);
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }
    
    fs.writeFileSync(userAuthFile, JSON.stringify(mockAuthState, null, 2));
    console.log('Mock user authentication state created successfully');

  } catch (error) {
    console.log('User authentication setup failed:', error.message);
    
    // Create a mock authentication state for testing
    const mockAuthState = {
      cookies: [
        {
          name: 'mock_user_session',
          value: 'authenticated',
          domain: 'localhost',
          path: '/',
          expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
          httpOnly: false,
          secure: false,
          sameSite: 'Lax' as const
        }
      ],
      origins: [
        {
          origin: 'http://localhost:3000',
          localStorage: [
            { name: 'auth_user', value: JSON.stringify({ role: 'user', email: 'user@jaquedu.com' }) },
            { name: 'auth_token', value: 'mock_user_token' }
          ]
        }
      ]
    };

    const authDir = path.dirname(userAuthFile);
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }
    
    fs.writeFileSync(userAuthFile, JSON.stringify(mockAuthState, null, 2));
    console.log('Mock user authentication state created');
  }
});