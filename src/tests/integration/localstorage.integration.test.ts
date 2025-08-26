/**
 * Simple localStorage Test to debug Jest environment
 */

export {}; // Make this file a module

describe('LocalStorage Test', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should be able to store and retrieve from localStorage', () => {
    console.log('Testing localStorage...');
    
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

  afterEach(() => {
    localStorage.clear();
  });
});