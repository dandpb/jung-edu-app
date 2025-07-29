import React, { useState } from 'react';
import { authService } from '../services/auth/authService';
import { UserRole } from '../types/auth';

const CreateTestUser: React.FC = () => {
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');

  const createTestUser = async () => {
    try {
      setStatus('Creating test user...');
      setError('');
      
      const user = await authService.register({
        email: 'test@example.com',
        username: 'testuser',
        password: 'Test123!',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.STUDENT
      });
      
      setStatus(`Test user created successfully! Username: ${user.username}, Password: Test123!`);
    } catch (err: any) {
      setError(err.message || 'Failed to create test user');
      setStatus('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Create Test User</h1>
        
        <button
          onClick={createTestUser}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
        >
          Create Test User
        </button>
        
        {status && (
          <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {status}
          </div>
        )}
        
        {error && (
          <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <div className="mt-6 text-sm text-gray-600">
          <p><strong>Test User Credentials:</strong></p>
          <p>Username: testuser</p>
          <p>Password: Test123!</p>
          <p>Email: test@example.com</p>
        </div>
      </div>
    </div>
  );
};

export default CreateTestUser;