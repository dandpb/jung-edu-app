"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiAssertions = exports.setupAuthenticatedClient = exports.authenticatedAPIClient = exports.defaultAPIClient = exports.createAPIClient = exports.APITestClient = void 0;
const axios_1 = __importDefault(require("axios"));
const test_config_1 = require("../setup/test-config");
/**
 * API Test Client for jaqEdu Platform
 * Provides a consistent interface for making API calls during testing
 */
class APITestClient {
    constructor(baseURL) {
        this.authToken = null;
        this.baseURL = baseURL || test_config_1.testConfig.api.baseUrl;
        this.client = axios_1.default.create({
            baseURL: this.baseURL,
            timeout: test_config_1.testConfig.api.timeout,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        this.setupInterceptors();
    }
    setupInterceptors() {
        // Request interceptor to add auth token
        this.client.interceptors.request.use((config) => {
            if (this.authToken && config.headers) {
                config.headers.Authorization = `Bearer ${this.authToken}`;
            }
            return config;
        }, (error) => Promise.reject(error));
        // Response interceptor for error handling
        this.client.interceptors.response.use((response) => response, (error) => {
            if (error.response?.status === 401) {
                this.authToken = null; // Clear invalid token
            }
            return Promise.reject(error);
        });
    }
    // Authentication methods
    setAuthToken(token) {
        this.authToken = token;
    }
    clearAuthToken() {
        this.authToken = null;
    }
    async authenticate(credentials) {
        const response = await this.post('/auth/login', credentials);
        const token = response.data.data.accessToken;
        this.setAuthToken(token);
        return token;
    }
    async authenticateAsTestUser(role = 'student') {
        const testCredentials = {
            student: { email: 'test.student@example.com', password: 'TestPass123!' },
            teacher: { email: 'test.teacher@example.com', password: 'TestPass123!' },
            admin: { email: 'test.admin@example.com', password: 'TestPass123!' }
        };
        return this.authenticate(testCredentials[role]);
    }
    // HTTP methods
    async get(url, config) {
        return this.client.get(url, config);
    }
    async post(url, data, config) {
        return this.client.post(url, data, config);
    }
    async put(url, data, config) {
        return this.client.put(url, data, config);
    }
    async patch(url, data, config) {
        return this.client.patch(url, data, config);
    }
    async delete(url, config) {
        return this.client.delete(url, config);
    }
    // File upload methods
    async uploadFile(url, file, fieldName = 'file') {
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
    async createUser(userData) {
        return this.post('/users', userData);
    }
    async getUser(userId) {
        return this.get(`/users/${userId}`);
    }
    async updateUser(userId, userData) {
        return this.put(`/users/${userId}`, userData);
    }
    async deleteUser(userId) {
        return this.delete(`/users/${userId}`);
    }
    async getUserProfile() {
        return this.get('/users/profile');
    }
    async updateUserProfile(profileData) {
        return this.put('/users/profile', profileData);
    }
    // Course API methods
    async createCourse(courseData) {
        return this.post('/courses', courseData);
    }
    async getCourse(courseId) {
        return this.get(`/courses/${courseId}`);
    }
    async getCourses(params) {
        return this.get('/courses', { params });
    }
    async updateCourse(courseId, courseData) {
        return this.put(`/courses/${courseId}`, courseData);
    }
    async deleteCourse(courseId) {
        return this.delete(`/courses/${courseId}`);
    }
    async publishCourse(courseId) {
        return this.post(`/courses/${courseId}/publish`);
    }
    async unpublishCourse(courseId) {
        return this.post(`/courses/${courseId}/unpublish`);
    }
    // Lesson API methods
    async createLesson(courseId, lessonData) {
        return this.post(`/courses/${courseId}/lessons`, lessonData);
    }
    async getLesson(courseId, lessonId) {
        return this.get(`/courses/${courseId}/lessons/${lessonId}`);
    }
    async getLessons(courseId, params) {
        return this.get(`/courses/${courseId}/lessons`, { params });
    }
    async updateLesson(courseId, lessonId, lessonData) {
        return this.put(`/courses/${courseId}/lessons/${lessonId}`, lessonData);
    }
    async deleteLesson(courseId, lessonId) {
        return this.delete(`/courses/${courseId}/lessons/${lessonId}`);
    }
    // Enrollment API methods
    async enrollInCourse(courseId) {
        return this.post(`/courses/${courseId}/enroll`);
    }
    async unenrollFromCourse(courseId) {
        return this.delete(`/courses/${courseId}/enroll`);
    }
    async getEnrollment(courseId) {
        return this.get(`/courses/${courseId}/enrollment`);
    }
    async getEnrollments(params) {
        return this.get('/enrollments', { params });
    }
    async updateProgress(courseId, lessonId, progressData) {
        return this.post(`/courses/${courseId}/lessons/${lessonId}/progress`, progressData);
    }
    // Quiz API methods
    async submitQuiz(courseId, lessonId, answers) {
        return this.post(`/courses/${courseId}/lessons/${lessonId}/quiz/submit`, { answers });
    }
    async getQuizResults(courseId, lessonId) {
        return this.get(`/courses/${courseId}/lessons/${lessonId}/quiz/results`);
    }
    // Rating and Review API methods
    async rateCourse(courseId, rating, comment) {
        return this.post(`/courses/${courseId}/rating`, { rating, comment });
    }
    async getCourseRatings(courseId, params) {
        return this.get(`/courses/${courseId}/ratings`, { params });
    }
    // Search API methods
    async searchCourses(query, filters) {
        return this.get('/search/courses', { params: { q: query, ...filters } });
    }
    async searchUsers(query, filters) {
        return this.get('/search/users', { params: { q: query, ...filters } });
    }
    // Analytics API methods
    async getAnalytics(type, params) {
        return this.get(`/analytics/${type}`, { params });
    }
    async getUserAnalytics() {
        return this.get('/analytics/user');
    }
    async getCourseAnalytics(courseId) {
        return this.get(`/analytics/courses/${courseId}`);
    }
    // Utility methods
    async healthCheck() {
        return this.get('/health');
    }
    async getServerInfo() {
        return this.get('/info');
    }
    // Test-specific methods
    async resetTestData() {
        if (process.env.NODE_ENV !== 'test') {
            throw new Error('resetTestData can only be called in test environment');
        }
        return this.post('/test/reset');
    }
    async seedTestData(data) {
        if (process.env.NODE_ENV !== 'test') {
            throw new Error('seedTestData can only be called in test environment');
        }
        return this.post('/test/seed', data);
    }
    // Performance testing methods
    async measureResponseTime(request) {
        const start = performance.now();
        const response = await request();
        const duration = performance.now() - start;
        return { response, duration };
    }
    async concurrentRequests(requests, maxConcurrency = 5) {
        const results = [];
        for (let i = 0; i < requests.length; i += maxConcurrency) {
            const batch = requests.slice(i, i + maxConcurrency);
            const batchResults = await Promise.all(batch.map(request => request()));
            results.push(...batchResults);
        }
        return results;
    }
    // Error simulation methods for testing error handling
    async simulateNetworkError() {
        this.client.defaults.timeout = 1; // Very short timeout
        throw new Error('Simulated network error');
    }
    async simulateServerError(statusCode = 500) {
        return this.get(`/test/error/${statusCode}`);
    }
    async simulateSlowResponse(delay = 5000) {
        return this.get(`/test/slow?delay=${delay}`);
    }
    // Cleanup method
    async cleanup() {
        this.clearAuthToken();
        // Additional cleanup if needed
    }
}
exports.APITestClient = APITestClient;
// Factory function to create API client instances
const createAPIClient = (baseURL) => {
    return new APITestClient(baseURL);
};
exports.createAPIClient = createAPIClient;
// Pre-configured client instances
exports.defaultAPIClient = new APITestClient();
exports.authenticatedAPIClient = new APITestClient();
// Helper function to setup authenticated client for tests
const setupAuthenticatedClient = async (role = 'student') => {
    const client = new APITestClient();
    await client.authenticateAsTestUser(role);
    return client;
};
exports.setupAuthenticatedClient = setupAuthenticatedClient;
// Response assertion helpers
exports.apiAssertions = {
    expectSuccessResponse: (response, expectedStatus = 200) => {
        expect(response.status).toBe(expectedStatus);
        expect(response.data).toHaveProperty('success', true);
        expect(response.data).toHaveProperty('data');
    },
    expectErrorResponse: (response, expectedStatus, expectedMessage) => {
        expect(response.status).toBe(expectedStatus);
        expect(response.data).toHaveProperty('success', false);
        expect(response.data).toHaveProperty('error');
        if (expectedMessage) {
            expect(response.data.error.message).toContain(expectedMessage);
        }
    },
    expectPaginatedResponse: (response) => {
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('success', true);
        expect(response.data).toHaveProperty('data');
        expect(response.data).toHaveProperty('pagination');
        expect(response.data.pagination).toHaveProperty('page');
        expect(response.data.pagination).toHaveProperty('limit');
        expect(response.data.pagination).toHaveProperty('total');
        expect(response.data.pagination).toHaveProperty('pages');
    },
    expectValidationErrorResponse: (response, field) => {
        expect(response.status).toBe(400);
        expect(response.data).toHaveProperty('success', false);
        expect(response.data).toHaveProperty('error');
        expect(response.data.error).toHaveProperty('code', 400);
        if (field) {
            expect(response.data.error.details).toHaveProperty(field);
        }
    },
    expectUnauthorizedResponse: (response) => {
        expect(response.status).toBe(401);
        expect(response.data).toHaveProperty('success', false);
        expect(response.data.error.message).toContain('Unauthorized');
    },
    expectForbiddenResponse: (response) => {
        expect(response.status).toBe(403);
        expect(response.data).toHaveProperty('success', false);
        expect(response.data.error.message).toContain('Forbidden');
    },
    expectNotFoundResponse: (response) => {
        expect(response.status).toBe(404);
        expect(response.data).toHaveProperty('success', false);
        expect(response.data.error.message).toContain('Not found');
    }
};
exports.default = APITestClient;
//# sourceMappingURL=api-client.js.map