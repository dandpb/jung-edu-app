import { test as setup, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const adminAuthFile = 'tests/e2e/auth/admin-user.json';
const userAuthFile = 'tests/e2e/auth/regular-user.json';

setup('authenticate as admin', async ({ page }) => {
  console.log('Creating admin authentication state...');
  
  // Create mock authentication state for test mode
  const mockAuthState = {
    cookies: [],
    origins: [
      {
        origin: 'http://localhost:3000',
        localStorage: [
          { name: 'test-mode', value: 'true' },
          { 
            name: 'auth_user', 
            value: JSON.stringify({ 
              id: 'admin-test-user', 
              role: 'admin', 
              email: 'admin@jaquedu.com',
              name: 'Test Admin',
              permissions: ['manage_users', 'manage_modules', 'manage_content', 'view_analytics']
            }) 
          },
          { name: 'auth_token', value: 'mock_admin_token_' + Date.now() },
          { name: 'auth_refresh_token', value: 'mock_admin_refresh_token_' + Date.now() }
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
});

setup('authenticate as regular user', async ({ page }) => {
  console.log('Creating regular user authentication state...');
  
  // Create mock authentication state for test mode
  const mockAuthState = {
    cookies: [],
    origins: [
      {
        origin: 'http://localhost:3000',
        localStorage: [
          { name: 'test-mode', value: 'true' },
          { 
            name: 'auth_user', 
            value: JSON.stringify({ 
              id: 'user-test-user', 
              role: 'user', 
              email: 'user@jaquedu.com',
              name: 'Test User',
              permissions: ['view_content', 'take_quizzes', 'view_progress']
            }) 
          },
          { name: 'auth_token', value: 'mock_user_token_' + Date.now() },
          { name: 'auth_refresh_token', value: 'mock_user_refresh_token_' + Date.now() },
          { 
            name: 'jungAppProgress', 
            value: JSON.stringify({
              userId: 'user-test-user',
              completedModules: ['intro-psychology'],
              quizScores: { 'intro-psychology': 85 },
              totalTime: 3600,
              lastAccessed: Date.now(),
              notes: [
                { id: '1', moduleId: 'intro-psychology', content: 'Test note', timestamp: Date.now() }
              ]
            })
          }
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
});