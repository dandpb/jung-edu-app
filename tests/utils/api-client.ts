import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { testConfig } from '../setup/test-config';
import { authHelpers } from './test-helpers';

/**
 * API Test Client for jaqEdu Platform
 * Provides a consistent interface for making API calls during testing
 */

export class APITestClient {
  private client: AxiosInstance;
  private authToken: string | null = null;
  private baseURL: string;
  
  constructor(baseURL?: string) {
    this.baseURL = baseURL || testConfig.api.baseUrl;
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: testConfig.api.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    this.setupInterceptors();
  }
  
  private setupInterceptors(): void {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        if (this.authToken && config.headers) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.authToken = null; // Clear invalid token
        }
        return Promise.reject(error);
      }
    );
  }
  
  // Authentication methods
  setAuthToken(token: string): void {
    this.authToken = token;
  }
  
  clearAuthToken(): void {
    this.authToken = null;
  }
  
  async authenticate(credentials: { email: string; password: string }): Promise<string> {
    const response = await this.post('/auth/login', credentials);
    const token = response.data.data.accessToken;
    this.setAuthToken(token);
    return token;
  }
  
  async authenticateAsTestUser(role: 'student' | 'teacher' | 'admin' = 'student'): Promise<string> {
    const testCredentials = {
      student: { email: 'test.student@example.com', password: 'TestPass123!' },
      teacher: { email: 'test.teacher@example.com', password: 'TestPass123!' },
      admin: { email: 'test.admin@example.com', password: 'TestPass123!' }
    };
    
    return this.authenticate(testCredentials[role]);
  }
  
  // HTTP methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.get<T>(url, config);
  }
  
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.post<T>(url, data, config);
  }
  
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.put<T>(url, data, config);
  }
  
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.patch<T>(url, data, config);
  }
  
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.delete<T>(url, config);
  }
  
  // File upload methods
  async uploadFile(url: string, file: File | Buffer, fieldName: string = 'file'): Promise<AxiosResponse> {
    const formData = new FormData();
    formData.append(fieldName, file);
    
    return this.client.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
  
  // Specialized API methods for jaqEdu
  
  // User API methods
  async createUser(userData: any): Promise<AxiosResponse> {
    return this.post('/users', userData);
  }
  
  async getUser(userId: string): Promise<AxiosResponse> {
    return this.get(`/users/${userId}`);
  }
  
  async updateUser(userId: string, userData: any): Promise<AxiosResponse> {
    return this.put(`/users/${userId}`, userData);
  }
  
  async deleteUser(userId: string): Promise<AxiosResponse> {
    return this.delete(`/users/${userId}`);
  }
  
  async getUserProfile(): Promise<AxiosResponse> {
    return this.get('/users/profile');
  }
  
  async updateUserProfile(profileData: any): Promise<AxiosResponse> {
    return this.put('/users/profile', profileData);
  }
  
  // Course API methods
  async createCourse(courseData: any): Promise<AxiosResponse> {
    return this.post('/courses', courseData);
  }
  
  async getCourse(courseId: string): Promise<AxiosResponse> {
    return this.get(`/courses/${courseId}`);
  }
  
  async getCourses(params?: any): Promise<AxiosResponse> {
    return this.get('/courses', { params });
  }
  
  async updateCourse(courseId: string, courseData: any): Promise<AxiosResponse> {
    return this.put(`/courses/${courseId}`, courseData);
  }
  
  async deleteCourse(courseId: string): Promise<AxiosResponse> {
    return this.delete(`/courses/${courseId}`);
  }
  
  async publishCourse(courseId: string): Promise<AxiosResponse> {
    return this.post(`/courses/${courseId}/publish`);
  }
  
  async unpublishCourse(courseId: string): Promise<AxiosResponse> {
    return this.post(`/courses/${courseId}/unpublish`);
  }
  
  // Lesson API methods
  async createLesson(courseId: string, lessonData: any): Promise<AxiosResponse> {
    return this.post(`/courses/${courseId}/lessons`, lessonData);
  }
  
  async getLesson(courseId: string, lessonId: string): Promise<AxiosResponse> {
    return this.get(`/courses/${courseId}/lessons/${lessonId}`);
  }
  
  async getLessons(courseId: string, params?: any): Promise<AxiosResponse> {
    return this.get(`/courses/${courseId}/lessons`, { params });
  }
  
  async updateLesson(courseId: string, lessonId: string, lessonData: any): Promise<AxiosResponse> {
    return this.put(`/courses/${courseId}/lessons/${lessonId}`, lessonData);
  }
  
  async deleteLesson(courseId: string, lessonId: string): Promise<AxiosResponse> {
    return this.delete(`/courses/${courseId}/lessons/${lessonId}`);
  }
  
  // Enrollment API methods
  async enrollInCourse(courseId: string): Promise<AxiosResponse> {
    return this.post(`/courses/${courseId}/enroll`);
  }
  
  async unenrollFromCourse(courseId: string): Promise<AxiosResponse> {
    return this.delete(`/courses/${courseId}/enroll`);
  }
  
  async getEnrollment(courseId: string): Promise<AxiosResponse> {
    return this.get(`/courses/${courseId}/enrollment`);
  }
  
  async getEnrollments(params?: any): Promise<AxiosResponse> {
    return this.get('/enrollments', { params });
  }
  
  async updateProgress(courseId: string, lessonId: string, progressData: any): Promise<AxiosResponse> {
    return this.post(`/courses/${courseId}/lessons/${lessonId}/progress`, progressData);
  }
  
  // Quiz API methods
  async submitQuiz(courseId: string, lessonId: string, answers: any): Promise<AxiosResponse> {
    return this.post(`/courses/${courseId}/lessons/${lessonId}/quiz/submit`, { answers });
  }
  
  async getQuizResults(courseId: string, lessonId: string): Promise<AxiosResponse> {
    return this.get(`/courses/${courseId}/lessons/${lessonId}/quiz/results`);
  }
  
  // Rating and Review API methods
  async rateCourse(courseId: string, rating: number, comment?: string): Promise<AxiosResponse> {
    return this.post(`/courses/${courseId}/rating`, { rating, comment });
  }
  
  async getCourseRatings(courseId: string, params?: any): Promise<AxiosResponse> {
    return this.get(`/courses/${courseId}/ratings`, { params });
  }
  
  // Search API methods
  async searchCourses(query: string, filters?: any): Promise<AxiosResponse> {
    return this.get('/search/courses', { params: { q: query, ...filters } });
  }
  
  async searchUsers(query: string, filters?: any): Promise<AxiosResponse> {
    return this.get('/search/users', { params: { q: query, ...filters } });
  }
  
  // Analytics API methods
  async getAnalytics(type: string, params?: any): Promise<AxiosResponse> {
    return this.get(`/analytics/${type}`, { params });
  }
  
  async getUserAnalytics(): Promise<AxiosResponse> {
    return this.get('/analytics/user');
  }
  
  async getCourseAnalytics(courseId: string): Promise<AxiosResponse> {
    return this.get(`/analytics/courses/${courseId}`);
  }
  
  // Utility methods
  async healthCheck(): Promise<AxiosResponse> {
    return this.get('/health');
  }
  
  async getServerInfo(): Promise<AxiosResponse> {
    return this.get('/info');
  }
  
  // Test-specific methods
  async resetTestData(): Promise<AxiosResponse> {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('resetTestData can only be called in test environment');
    }
    return this.post('/test/reset');
  }
  
  async seedTestData(data: any): Promise<AxiosResponse> {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('seedTestData can only be called in test environment');
    }
    return this.post('/test/seed', data);
  }
  
  // Performance testing methods
  async measureResponseTime<T>(request: () => Promise<AxiosResponse<T>>): Promise<{ response: AxiosResponse<T>; duration: number }> {
    const start = performance.now();
    const response = await request();
    const duration = performance.now() - start;
    return { response, duration };
  }
  
  async concurrentRequests<T>(requests: (() => Promise<AxiosResponse<T>>)[], maxConcurrency: number = 5): Promise<AxiosResponse<T>[]> {
    const results: AxiosResponse<T>[] = [];
    
    for (let i = 0; i < requests.length; i += maxConcurrency) {
      const batch = requests.slice(i, i + maxConcurrency);
      const batchResults = await Promise.all(batch.map(request => request()));
      results.push(...batchResults);
    }
    
    return results;
  }
  
  // Error simulation methods for testing error handling
  async simulateNetworkError(): Promise<void> {
    this.client.defaults.timeout = 1; // Very short timeout
    throw new Error('Simulated network error');
  }
  
  async simulateServerError(statusCode: number = 500): Promise<AxiosResponse> {
    return this.get(`/test/error/${statusCode}`);
  }
  
  async simulateSlowResponse(delay: number = 5000): Promise<AxiosResponse> {
    return this.get(`/test/slow?delay=${delay}`);
  }
  
  // Cleanup method
  async cleanup(): Promise<void> {
    this.clearAuthToken();
    // Additional cleanup if needed
  }
}

// Factory function to create API client instances
export const createAPIClient = (baseURL?: string): APITestClient => {
  return new APITestClient(baseURL);
};

// Pre-configured client instances
export const defaultAPIClient = new APITestClient();
export const authenticatedAPIClient = new APITestClient();

// Helper function to setup authenticated client for tests
export const setupAuthenticatedClient = async (role: 'student' | 'teacher' | 'admin' = 'student'): Promise<APITestClient> => {
  const client = new APITestClient();
  await client.authenticateAsTestUser(role);
  return client;
};

// Response assertion helpers
export const apiAssertions = {
  expectSuccessResponse: (response: AxiosResponse, expectedStatus: number = 200): void => {
    expect(response.status).toBe(expectedStatus);
    expect(response.data).toHaveProperty('success', true);
    expect(response.data).toHaveProperty('data');
  },
  
  expectErrorResponse: (response: AxiosResponse, expectedStatus: number, expectedMessage?: string): void => {
    expect(response.status).toBe(expectedStatus);
    expect(response.data).toHaveProperty('success', false);
    expect(response.data).toHaveProperty('error');
    
    if (expectedMessage) {
      expect(response.data.error.message).toContain(expectedMessage);
    }
  },
  
  expectPaginatedResponse: (response: AxiosResponse): void => {
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('success', true);
    expect(response.data).toHaveProperty('data');
    expect(response.data).toHaveProperty('pagination');
    expect(response.data.pagination).toHaveProperty('page');
    expect(response.data.pagination).toHaveProperty('limit');
    expect(response.data.pagination).toHaveProperty('total');
    expect(response.data.pagination).toHaveProperty('pages');
  },
  
  expectValidationErrorResponse: (response: AxiosResponse, field?: string): void => {
    expect(response.status).toBe(400);
    expect(response.data).toHaveProperty('success', false);
    expect(response.data).toHaveProperty('error');
    expect(response.data.error).toHaveProperty('code', 400);
    
    if (field) {
      expect(response.data.error.details).toHaveProperty(field);
    }
  },
  
  expectUnauthorizedResponse: (response: AxiosResponse): void => {
    expect(response.status).toBe(401);
    expect(response.data).toHaveProperty('success', false);
    expect(response.data.error.message).toContain('Unauthorized');
  },
  
  expectForbiddenResponse: (response: AxiosResponse): void => {
    expect(response.status).toBe(403);
    expect(response.data).toHaveProperty('success', false);
    expect(response.data.error.message).toContain('Forbidden');
  },
  
  expectNotFoundResponse: (response: AxiosResponse): void => {
    expect(response.status).toBe(404);
    expect(response.data).toHaveProperty('success', false);
    expect(response.data.error.message).toContain('Not found');
  }
};

export default APITestClient;
