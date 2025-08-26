import { APIRequestContext, Page } from '@playwright/test';

/**
 * API Helper
 * Provides utilities for making API calls during E2E tests
 */
export class ApiHelper {
  private apiContext?: APIRequestContext;
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(page?: Page) {
    this.baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    if (page) {
      this.apiContext = page.request;
    }
  }

  // Authentication API calls
  async login(email: string, password: string): Promise<any> {
    const response = await this.post('/api/auth/login', {
      email,
      password
    });
    
    if (response.token) {
      this.setAuthToken(response.token);
    }
    
    return response;
  }

  async logout(): Promise<void> {
    await this.post('/api/auth/logout');
    this.removeAuthToken();
  }

  async getCurrentUser(): Promise<any> {
    return await this.get('/api/auth/me');
  }

  async refreshToken(): Promise<any> {
    return await this.post('/api/auth/refresh');
  }

  // User management API calls
  async createUser(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
  }): Promise<any> {
    return await this.post('/api/users', userData);
  }

  async getUser(userId: string): Promise<any> {
    return await this.get(`/api/users/${userId}`);
  }

  async updateUser(userId: string, userData: Record<string, any>): Promise<any> {
    return await this.put(`/api/users/${userId}`, userData);
  }

  async deleteUser(userId: string): Promise<void> {
    await this.delete(`/api/users/${userId}`);
  }

  async getUserList(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  } = {}): Promise<any> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    const url = queryParams.toString() ? `/api/users?${queryParams}` : '/api/users';
    return await this.get(url);
  }

  // Module management API calls
  async createModule(moduleData: {
    title: string;
    description: string;
    content: string;
    difficulty?: string;
    language?: string;
  }): Promise<any> {
    return await this.post('/api/modules', moduleData);
  }

  async getModule(moduleId: string): Promise<any> {
    return await this.get(`/api/modules/${moduleId}`);
  }

  async updateModule(moduleId: string, moduleData: Record<string, any>): Promise<any> {
    return await this.put(`/api/modules/${moduleId}`, moduleData);
  }

  async deleteModule(moduleId: string): Promise<void> {
    await this.delete(`/api/modules/${moduleId}`);
  }

  async getModuleList(params: {
    page?: number;
    limit?: number;
    search?: string;
    difficulty?: string;
    language?: string;
  } = {}): Promise<any> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    const url = queryParams.toString() ? `/api/modules?${queryParams}` : '/api/modules';
    return await this.get(url);
  }

  // Quiz API calls
  async createQuiz(quizData: {
    moduleId: string;
    questions: Array<{
      question: string;
      options: string[];
      correctAnswer: number;
    }>;
  }): Promise<any> {
    return await this.post('/api/quizzes', quizData);
  }

  async getQuiz(quizId: string): Promise<any> {
    return await this.get(`/api/quizzes/${quizId}`);
  }

  async submitQuizAnswer(quizId: string, answersData: {
    answers: Array<{ questionId: string; answer: number }>;
  }): Promise<any> {
    return await this.post(`/api/quizzes/${quizId}/submit`, answersData);
  }

  // Progress tracking API calls
  async getUserProgress(userId?: string): Promise<any> {
    const endpoint = userId ? `/api/progress/${userId}` : '/api/progress/me';
    return await this.get(endpoint);
  }

  async updateModuleProgress(moduleId: string, progressData: {
    completed?: boolean;
    progress?: number;
    timeSpent?: number;
  }): Promise<any> {
    return await this.put(`/api/progress/modules/${moduleId}`, progressData);
  }

  async getModuleProgress(moduleId: string): Promise<any> {
    return await this.get(`/api/progress/modules/${moduleId}`);
  }

  // System and health API calls
  async getHealthStatus(): Promise<any> {
    return await this.get('/api/health');
  }

  async getSystemMetrics(): Promise<any> {
    return await this.get('/api/admin/metrics');
  }

  async getSystemLogs(params: {
    level?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {}): Promise<any> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    const url = queryParams.toString() ? `/api/admin/logs?${queryParams}` : '/api/admin/logs';
    return await this.get(url);
  }

  // AI Resource Generation API calls
  async generateModule(params: {
    topic: string;
    difficulty: string;
    language: string;
    type: string;
  }): Promise<any> {
    return await this.post('/api/ai/generate-module', params);
  }

  async generateQuiz(moduleId: string, params: {
    questionCount?: number;
    difficulty?: string;
  }): Promise<any> {
    return await this.post(`/api/ai/generate-quiz/${moduleId}`, params);
  }

  async generateContent(params: {
    type: string;
    topic: string;
    parameters: Record<string, any>;
  }): Promise<any> {
    return await this.post('/api/ai/generate-content', params);
  }

  // File upload API calls
  async uploadFile(filePath: string, fieldName: string = 'file'): Promise<any> {
    const formData = new FormData();
    // In a real implementation, you'd read the file and append it
    // This is a placeholder for the upload functionality
    
    return await this.postFormData('/api/upload', formData);
  }

  // Base HTTP methods
  private async get(endpoint: string): Promise<any> {
    if (!this.apiContext) {
      throw new Error('API context not available');
    }

    const response = await this.apiContext.get(`${this.baseURL}${endpoint}`, {
      headers: this.getHeaders()
    });

    return await this.handleResponse(response);
  }

  private async post(endpoint: string, data?: any): Promise<any> {
    if (!this.apiContext) {
      throw new Error('API context not available');
    }

    const response = await this.apiContext.post(`${this.baseURL}${endpoint}`, {
      headers: this.getHeaders(),
      data: JSON.stringify(data)
    });

    return await this.handleResponse(response);
  }

  private async put(endpoint: string, data?: any): Promise<any> {
    if (!this.apiContext) {
      throw new Error('API context not available');
    }

    const response = await this.apiContext.put(`${this.baseURL}${endpoint}`, {
      headers: this.getHeaders(),
      data: JSON.stringify(data)
    });

    return await this.handleResponse(response);
  }

  private async delete(endpoint: string): Promise<any> {
    if (!this.apiContext) {
      throw new Error('API context not available');
    }

    const response = await this.apiContext.delete(`${this.baseURL}${endpoint}`, {
      headers: this.getHeaders()
    });

    return await this.handleResponse(response);
  }

  private async postFormData(endpoint: string, formData: FormData): Promise<any> {
    if (!this.apiContext) {
      throw new Error('API context not available');
    }

    const headers = { ...this.getHeaders() };
    delete headers['Content-Type']; // Let browser set it for FormData

    const response = await this.apiContext.post(`${this.baseURL}${endpoint}`, {
      headers,
      multipart: formData as any
    });

    return await this.handleResponse(response);
  }

  // Response handling
  private async handleResponse(response: any): Promise<any> {
    const contentType = response.headers()['content-type'] || '';
    
    if (!response.ok()) {
      const errorText = await response.text();
      throw new Error(`API call failed: ${response.status()} ${response.statusText()} - ${errorText}`);
    }

    if (contentType.includes('application/json')) {
      return await response.json();
    } else {
      return await response.text();
    }
  }

  // Header management
  private getHeaders(): Record<string, string> {
    return { ...this.defaultHeaders };
  }

  setAuthToken(token: string): void {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  removeAuthToken(): void {
    delete this.defaultHeaders['Authorization'];
  }

  setCustomHeader(key: string, value: string): void {
    this.defaultHeaders[key] = value;
  }

  removeCustomHeader(key: string): void {
    delete this.defaultHeaders[key];
  }

  // Utility methods
  async waitForApiResponse(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    expectedStatus: number = 200,
    timeout: number = 30000
  ): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        let response;
        switch (method) {
          case 'GET':
            response = await this.apiContext?.get(`${this.baseURL}${endpoint}`);
            break;
          case 'POST':
            response = await this.apiContext?.post(`${this.baseURL}${endpoint}`);
            break;
          case 'PUT':
            response = await this.apiContext?.put(`${this.baseURL}${endpoint}`);
            break;
          case 'DELETE':
            response = await this.apiContext?.delete(`${this.baseURL}${endpoint}`);
            break;
        }
        
        if (response && response.status() === expectedStatus) {
          return;
        }
      } catch (error) {
        // Continue waiting
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error(`API endpoint ${endpoint} did not return expected status ${expectedStatus} within ${timeout}ms`);
  }

  async isApiHealthy(): Promise<boolean> {
    try {
      const health = await this.getHealthStatus();
      return health.status === 'healthy' || health.status === 'ok';
    } catch {
      return false;
    }
  }

  async waitForApiToBeHealthy(timeout: number = 60000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (await this.isApiHealthy()) {
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    throw new Error(`API did not become healthy within ${timeout}ms`);
  }

  // Test data helpers
  async cleanupTestData(): Promise<void> {
    // Clean up test data created during tests
    try {
      // This would typically call cleanup endpoints or directly clean the database
      await this.post('/api/test/cleanup');
    } catch (error) {
      console.warn('Failed to cleanup test data:', error);
    }
  }

  async seedTestData(): Promise<void> {
    // Seed necessary test data
    try {
      await this.post('/api/test/seed');
    } catch (error) {
      console.warn('Failed to seed test data:', error);
    }
  }

  async createTestUser(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
  }): Promise<any> {
    return await this.post('/api/test/users', userData);
  }

  async deleteTestUser(userId: string): Promise<void> {
    await this.delete(`/api/test/users/${userId}`);
  }
}