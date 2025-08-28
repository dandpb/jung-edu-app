import { AxiosRequestConfig, AxiosResponse } from 'axios';
/**
 * API Test Client for jaqEdu Platform
 * Provides a consistent interface for making API calls during testing
 */
export declare class APITestClient {
    private client;
    private authToken;
    private baseURL;
    constructor(baseURL?: string);
    private setupInterceptors;
    setAuthToken(token: string): void;
    clearAuthToken(): void;
    authenticate(credentials: {
        email: string;
        password: string;
    }): Promise<string>;
    authenticateAsTestUser(role?: 'student' | 'teacher' | 'admin'): Promise<string>;
    get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
    post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
    put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
    patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
    delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
    uploadFile(url: string, file: File | Buffer, fieldName?: string): Promise<AxiosResponse>;
    createUser(userData: any): Promise<AxiosResponse>;
    getUser(userId: string): Promise<AxiosResponse>;
    updateUser(userId: string, userData: any): Promise<AxiosResponse>;
    deleteUser(userId: string): Promise<AxiosResponse>;
    getUserProfile(): Promise<AxiosResponse>;
    updateUserProfile(profileData: any): Promise<AxiosResponse>;
    createCourse(courseData: any): Promise<AxiosResponse>;
    getCourse(courseId: string): Promise<AxiosResponse>;
    getCourses(params?: any): Promise<AxiosResponse>;
    updateCourse(courseId: string, courseData: any): Promise<AxiosResponse>;
    deleteCourse(courseId: string): Promise<AxiosResponse>;
    publishCourse(courseId: string): Promise<AxiosResponse>;
    unpublishCourse(courseId: string): Promise<AxiosResponse>;
    createLesson(courseId: string, lessonData: any): Promise<AxiosResponse>;
    getLesson(courseId: string, lessonId: string): Promise<AxiosResponse>;
    getLessons(courseId: string, params?: any): Promise<AxiosResponse>;
    updateLesson(courseId: string, lessonId: string, lessonData: any): Promise<AxiosResponse>;
    deleteLesson(courseId: string, lessonId: string): Promise<AxiosResponse>;
    enrollInCourse(courseId: string): Promise<AxiosResponse>;
    unenrollFromCourse(courseId: string): Promise<AxiosResponse>;
    getEnrollment(courseId: string): Promise<AxiosResponse>;
    getEnrollments(params?: any): Promise<AxiosResponse>;
    updateProgress(courseId: string, lessonId: string, progressData: any): Promise<AxiosResponse>;
    submitQuiz(courseId: string, lessonId: string, answers: any): Promise<AxiosResponse>;
    getQuizResults(courseId: string, lessonId: string): Promise<AxiosResponse>;
    rateCourse(courseId: string, rating: number, comment?: string): Promise<AxiosResponse>;
    getCourseRatings(courseId: string, params?: any): Promise<AxiosResponse>;
    searchCourses(query: string, filters?: any): Promise<AxiosResponse>;
    searchUsers(query: string, filters?: any): Promise<AxiosResponse>;
    getAnalytics(type: string, params?: any): Promise<AxiosResponse>;
    getUserAnalytics(): Promise<AxiosResponse>;
    getCourseAnalytics(courseId: string): Promise<AxiosResponse>;
    healthCheck(): Promise<AxiosResponse>;
    getServerInfo(): Promise<AxiosResponse>;
    resetTestData(): Promise<AxiosResponse>;
    seedTestData(data: any): Promise<AxiosResponse>;
    measureResponseTime<T>(request: () => Promise<AxiosResponse<T>>): Promise<{
        response: AxiosResponse<T>;
        duration: number;
    }>;
    concurrentRequests<T>(requests: (() => Promise<AxiosResponse<T>>)[], maxConcurrency?: number): Promise<AxiosResponse<T>[]>;
    simulateNetworkError(): Promise<void>;
    simulateServerError(statusCode?: number): Promise<AxiosResponse>;
    simulateSlowResponse(delay?: number): Promise<AxiosResponse>;
    cleanup(): Promise<void>;
}
export declare const createAPIClient: (baseURL?: string) => APITestClient;
export declare const defaultAPIClient: APITestClient;
export declare const authenticatedAPIClient: APITestClient;
export declare const setupAuthenticatedClient: (role?: "student" | "teacher" | "admin") => Promise<APITestClient>;
export declare const apiAssertions: {
    expectSuccessResponse: (response: AxiosResponse, expectedStatus?: number) => void;
    expectErrorResponse: (response: AxiosResponse, expectedStatus: number, expectedMessage?: string) => void;
    expectPaginatedResponse: (response: AxiosResponse) => void;
    expectValidationErrorResponse: (response: AxiosResponse, field?: string) => void;
    expectUnauthorizedResponse: (response: AxiosResponse) => void;
    expectForbiddenResponse: (response: AxiosResponse) => void;
    expectNotFoundResponse: (response: AxiosResponse) => void;
};
export default APITestClient;
//# sourceMappingURL=api-client.d.ts.map