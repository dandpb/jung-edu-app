/**
 * Data Factory for jaqEdu Test Data Generation
 * Provides consistent test data creation with realistic values
 */
export declare const UserFactory: {
    build: (overrides?: Partial<User>) => User;
    buildMany: (count: number, overrides?: Partial<User>) => User[];
    buildStudent: (overrides?: Partial<User>) => User;
    buildTeacher: (overrides?: Partial<User>) => User;
    buildAdmin: (overrides?: Partial<User>) => User;
};
export declare const CourseFactory: {
    build: (overrides?: Partial<Course>) => Course;
    buildMany: (count: number, overrides?: Partial<Course>) => Course[];
    buildPublished: (overrides?: Partial<Course>) => Course;
    buildDraft: (overrides?: Partial<Course>) => Course;
    buildFree: (overrides?: Partial<Course>) => Course;
    buildPaid: (overrides?: Partial<Course>) => Course;
};
export declare const LessonFactory: {
    build: (overrides?: Partial<Lesson>) => Lesson;
    buildMany: (count: number, courseId?: string, overrides?: Partial<Lesson>) => Lesson[];
    buildVideoLesson: (overrides?: Partial<Lesson>) => Lesson;
    buildTextLesson: (overrides?: Partial<Lesson>) => Lesson;
    buildQuizLesson: (overrides?: Partial<Lesson>) => Lesson;
};
export declare const EnrollmentFactory: {
    build: (overrides?: Partial<Enrollment>) => Enrollment;
    buildMany: (count: number, overrides?: Partial<Enrollment>) => Enrollment[];
    buildActive: (overrides?: Partial<Enrollment>) => Enrollment;
    buildCompleted: (overrides?: Partial<Enrollment>) => Enrollment;
};
export declare const AuthFactory: {
    buildLoginRequest: (overrides?: Partial<LoginRequest>) => LoginRequest;
    buildRegisterRequest: (overrides?: Partial<RegisterRequest>) => RegisterRequest;
    buildTokenPair: () => TokenPair;
    buildExpiredTokenPair: () => TokenPair;
};
export declare const ResponseFactory: {
    buildSuccessResponse: <T>(data: T, meta?: any) => APIResponse<T>;
    buildErrorResponse: (message: string, code?: number, details?: any) => APIErrorResponse;
    buildPaginatedResponse: <T>(data: T[], page?: number, limit?: number, total?: number) => PaginatedResponse<T>;
};
type User = {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    password: string;
    role: 'student' | 'teacher' | 'admin';
    isActive: boolean;
    isVerified: boolean;
    profileImage: string | null;
    bio: string;
    dateOfBirth: Date;
    phoneNumber: string;
    address: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };
    preferences: {
        language: string;
        timezone: string;
        notifications: {
            email: boolean;
            push: boolean;
            sms: boolean;
        };
        privacy: {
            profileVisible: boolean;
            activityVisible: boolean;
        };
    };
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt: Date;
};
type Course = {
    id: string;
    title: string;
    description: string;
    shortDescription: string;
    category: string;
    subcategory: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    language: string;
    duration: number;
    estimatedHours: number;
    price: number;
    currency: string;
    isPublished: boolean;
    isFree: boolean;
    thumbnailUrl: string;
    videoPreviewUrl: string;
    instructorId: string;
    tags: string[];
    prerequisites: string[];
    learningObjectives: string[];
    syllabus: any[];
    enrollmentCount: number;
    rating: {
        average: number;
        count: number;
    };
    status: 'draft' | 'published' | 'archived';
    createdAt: Date;
    updatedAt: Date;
    publishedAt: Date;
};
type Lesson = {
    id: string;
    courseId: string;
    title: string;
    description: string;
    content: string;
    type: 'video' | 'text' | 'interactive' | 'quiz' | 'assignment';
    order: number;
    duration: number;
    isPublished: boolean;
    isFree: boolean;
    videoUrl: string | null;
    videoThumbnail: string | null;
    videoDuration: number;
    attachments: any[];
    quiz: any | null;
    notes: string;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
};
type Enrollment = {
    id: string;
    userId: string;
    courseId: string;
    status: 'active' | 'completed' | 'dropped' | 'paused';
    progress: {
        completedLessons: number;
        totalLessons: number;
        completionPercentage: number;
        lastAccessedLessonId: string;
        timeSpent: number;
        quizScores: any[];
    };
    enrolledAt: Date;
    startedAt: Date;
    completedAt: Date | null;
    lastAccessedAt: Date;
    paymentStatus: 'paid' | 'free' | 'refunded' | 'pending';
    certificateIssued: boolean;
    rating: any | null;
    createdAt: Date;
    updatedAt: Date;
};
type LoginRequest = {
    email: string;
    password: string;
    rememberMe: boolean;
};
type RegisterRequest = {
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    username: string;
    agreeToTerms: boolean;
};
type TokenPair = {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
};
type APIResponse<T> = {
    success: boolean;
    data: T;
    meta?: any;
    timestamp: string;
    requestId: string;
};
type APIErrorResponse = {
    success: boolean;
    error: {
        message: string;
        code: number;
        details?: any;
    };
    timestamp: string;
    requestId: string;
};
type PaginatedResponse<T> = {
    success: boolean;
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
    timestamp: string;
    requestId: string;
};
declare const _default: {
    UserFactory: {
        build: (overrides?: Partial<User>) => User;
        buildMany: (count: number, overrides?: Partial<User>) => User[];
        buildStudent: (overrides?: Partial<User>) => User;
        buildTeacher: (overrides?: Partial<User>) => User;
        buildAdmin: (overrides?: Partial<User>) => User;
    };
    CourseFactory: {
        build: (overrides?: Partial<Course>) => Course;
        buildMany: (count: number, overrides?: Partial<Course>) => Course[];
        buildPublished: (overrides?: Partial<Course>) => Course;
        buildDraft: (overrides?: Partial<Course>) => Course;
        buildFree: (overrides?: Partial<Course>) => Course;
        buildPaid: (overrides?: Partial<Course>) => Course;
    };
    LessonFactory: {
        build: (overrides?: Partial<Lesson>) => Lesson;
        buildMany: (count: number, courseId?: string, overrides?: Partial<Lesson>) => Lesson[];
        buildVideoLesson: (overrides?: Partial<Lesson>) => Lesson;
        buildTextLesson: (overrides?: Partial<Lesson>) => Lesson;
        buildQuizLesson: (overrides?: Partial<Lesson>) => Lesson;
    };
    EnrollmentFactory: {
        build: (overrides?: Partial<Enrollment>) => Enrollment;
        buildMany: (count: number, overrides?: Partial<Enrollment>) => Enrollment[];
        buildActive: (overrides?: Partial<Enrollment>) => Enrollment;
        buildCompleted: (overrides?: Partial<Enrollment>) => Enrollment;
    };
    AuthFactory: {
        buildLoginRequest: (overrides?: Partial<LoginRequest>) => LoginRequest;
        buildRegisterRequest: (overrides?: Partial<RegisterRequest>) => RegisterRequest;
        buildTokenPair: () => TokenPair;
        buildExpiredTokenPair: () => TokenPair;
    };
    ResponseFactory: {
        buildSuccessResponse: <T>(data: T, meta?: any) => APIResponse<T>;
        buildErrorResponse: (message: string, code?: number, details?: any) => APIErrorResponse;
        buildPaginatedResponse: <T>(data: T[], page?: number, limit?: number, total?: number) => PaginatedResponse<T>;
    };
};
export default _default;
//# sourceMappingURL=data-factory.d.ts.map