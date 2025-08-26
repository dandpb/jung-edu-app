/**
 * Fixed localStorage Integration Test
 */

import { setupIntegrationTestEnvironment, clearIntegrationTestStorage } from '../../test-utils/integrationTestSetup';

describe('Fixed LocalStorage Test', () => {
  beforeAll(() => {
    // Setup proper localStorage mock for integration tests
    setupIntegrationTestEnvironment();
  });

  beforeEach(() => {
    clearIntegrationTestStorage();
  });

  it('should be able to store and retrieve from localStorage', () => {
    console.log('Testing localStorage with proper mock...');
    
    // Test basic localStorage functionality
    localStorage.setItem('test_key', 'test_value');
    const retrieved = localStorage.getItem('test_key');
    
    console.log('Stored: test_value');
    console.log('Retrieved:', retrieved);
    
    expect(retrieved).toBe('test_value');
  });

  it('should persist complex JSON data', () => {
    const testData = {
      user1: { id: '1', name: 'User 1', email: 'user1@test.com' },
      user2: { id: '2', name: 'User 2', email: 'user2@test.com' }
    };
    
    localStorage.setItem('test_users', JSON.stringify(testData));
    const retrieved = localStorage.getItem('test_users');
    
    console.log('Stored JSON:', JSON.stringify(testData));
    console.log('Retrieved:', retrieved);
    
    expect(retrieved).toBeTruthy();
    
    const parsed = JSON.parse(retrieved!);
    expect(parsed.user1.name).toBe('User 1');
    expect(parsed.user2.email).toBe('user2@test.com');
  });

  it('should persist data between calls within same test', () => {
    // Store some data
    localStorage.setItem('persist_key', 'persist_value');
    
    // Verify it's there
    expect(localStorage.getItem('persist_key')).toBe('persist_value');
    
    // Add more data
    localStorage.setItem('another_key', 'another_value');
    
    // Verify both are still there
    expect(localStorage.getItem('persist_key')).toBe('persist_value');
    expect(localStorage.getItem('another_key')).toBe('another_value');
    
    // Check length
    expect(localStorage.length).toBe(2);
  });

  afterEach(() => {
    clearIntegrationTestStorage();
  });
});