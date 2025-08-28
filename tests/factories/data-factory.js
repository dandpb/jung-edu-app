"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseFactory = exports.AuthFactory = exports.EnrollmentFactory = exports.LessonFactory = exports.CourseFactory = exports.UserFactory = void 0;
const uuid_1 = require("uuid");
const test_helpers_1 = require("../utils/test-helpers");
/**
 * Data Factory for jaqEdu Test Data Generation
 * Provides consistent test data creation with realistic values
 */
// User data factory
exports.UserFactory = {
    build: (overrides = {}) => ({
        id: (0, uuid_1.v4)(),
        email: test_helpers_1.randomHelpers.randomEmail(),
        username: test_helpers_1.randomHelpers.randomString(8),
        firstName: test_helpers_1.randomHelpers.randomArrayElement(['John', 'Jane', 'Alice', 'Bob', 'Charlie', 'Diana']),
        lastName: test_helpers_1.randomHelpers.randomArrayElement(['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia']),
        password: 'TestPass123!',
        role: test_helpers_1.randomHelpers.randomArrayElement(['student', 'teacher', 'admin']),
        isActive: true,
        isVerified: true,
        profileImage: null,
        bio: `Test user bio for ${test_helpers_1.randomHelpers.randomString(5)}`,
        dateOfBirth: test_helpers_1.randomHelpers.randomDate(1990, 2005),
        phoneNumber: `+1${test_helpers_1.randomHelpers.randomNumber(1000000000, 9999999999)}`,
        address: {
            street: `${test_helpers_1.randomHelpers.randomNumber(1, 999)} ${test_helpers_1.randomHelpers.randomArrayElement(['Main', 'Oak', 'First', 'Second'])} St`,
            city: test_helpers_1.randomHelpers.randomArrayElement(['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix']),
            state: test_helpers_1.randomHelpers.randomArrayElement(['NY', 'CA', 'IL', 'TX', 'AZ']),
            zipCode: test_helpers_1.randomHelpers.randomNumber(10000, 99999).toString(),
            country: 'USA'
        },
        preferences: {
            language: 'en',
            timezone: 'America/New_York',
            notifications: {
                email: true,
                push: true,
                sms: false
            },
            privacy: {
                profileVisible: true,
                activityVisible: false
            }
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: test_helpers_1.randomHelpers.randomDate(2024, 2024),
        ...overrides
    }),
    buildMany: (count, overrides = {}) => {
        return Array.from({ length: count }, () => exports.UserFactory.build(overrides));
    },
    buildStudent: (overrides = {}) => {
        return exports.UserFactory.build({ role: 'student', ...overrides });
    },
    buildTeacher: (overrides = {}) => {
        return exports.UserFactory.build({ role: 'teacher', ...overrides });
    },
    buildAdmin: (overrides = {}) => {
        return exports.UserFactory.build({ role: 'admin', ...overrides });
    }
};
// Course data factory
exports.CourseFactory = {
    build: (overrides = {}) => ({
        id: (0, uuid_1.v4)(),
        title: `${test_helpers_1.randomHelpers.randomArrayElement(['Introduction to', 'Advanced', 'Fundamentals of', 'Mastering'])} ${test_helpers_1.randomHelpers.randomArrayElement(['Mathematics', 'Science', 'Programming', 'History', 'Literature'])}`,
        description: `A comprehensive course covering essential topics in ${test_helpers_1.randomHelpers.randomString(10)}`,
        shortDescription: `Learn the basics of ${test_helpers_1.randomHelpers.randomString(8)}`,
        category: test_helpers_1.randomHelpers.randomArrayElement(['technology', 'science', 'mathematics', 'language', 'arts']),
        subcategory: test_helpers_1.randomHelpers.randomArrayElement(['programming', 'data-science', 'web-development', 'mobile-development']),
        level: test_helpers_1.randomHelpers.randomArrayElement(['beginner', 'intermediate', 'advanced']),
        language: 'en',
        duration: test_helpers_1.randomHelpers.randomNumber(4, 52), // weeks
        estimatedHours: test_helpers_1.randomHelpers.randomNumber(10, 200),
        price: test_helpers_1.randomHelpers.randomNumber(0, 299.99),
        currency: 'USD',
        isPublished: true,
        isFree: test_helpers_1.randomHelpers.randomBoolean(),
        thumbnailUrl: `https://example.com/thumbnails/${test_helpers_1.randomHelpers.randomString(8)}.jpg`,
        videoPreviewUrl: `https://example.com/previews/${test_helpers_1.randomHelpers.randomString(8)}.mp4`,
        instructorId: (0, uuid_1.v4)(),
        tags: test_helpers_1.randomHelpers.randomArrayElement([
            ['javascript', 'web-development'],
            ['python', 'data-science'],
            ['react', 'frontend'],
            ['node.js', 'backend']
        ]),
        prerequisites: test_helpers_1.randomHelpers.randomArrayElement([
            ['Basic programming knowledge'],
            ['High school mathematics'],
            ['No prerequisites'],
            ['HTML and CSS basics']
        ]),
        learningObjectives: [
            `Understand key concepts of ${test_helpers_1.randomHelpers.randomString(8)}`,
            `Apply practical skills in ${test_helpers_1.randomHelpers.randomString(8)}`,
            `Build real-world projects using ${test_helpers_1.randomHelpers.randomString(8)}`
        ],
        syllabus: [
            {
                week: 1,
                title: 'Introduction and Basics',
                topics: ['Overview', 'Getting Started', 'Basic Concepts'],
                duration: '2 hours'
            },
            {
                week: 2,
                title: 'Intermediate Topics',
                topics: ['Advanced Concepts', 'Practical Applications'],
                duration: '3 hours'
            }
        ],
        enrollmentCount: test_helpers_1.randomHelpers.randomNumber(0, 10000),
        rating: {
            average: test_helpers_1.randomHelpers.randomNumber(3.5, 5.0),
            count: test_helpers_1.randomHelpers.randomNumber(10, 1000)
        },
        status: test_helpers_1.randomHelpers.randomArrayElement(['draft', 'published', 'archived']),
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedAt: test_helpers_1.randomHelpers.randomDate(2023, 2024),
        ...overrides
    }),
    buildMany: (count, overrides = {}) => {
        return Array.from({ length: count }, () => exports.CourseFactory.build(overrides));
    },
    buildPublished: (overrides = {}) => {
        return exports.CourseFactory.build({ isPublished: true, status: 'published', ...overrides });
    },
    buildDraft: (overrides = {}) => {
        return exports.CourseFactory.build({ isPublished: false, status: 'draft', ...overrides });
    },
    buildFree: (overrides = {}) => {
        return exports.CourseFactory.build({ isFree: true, price: 0, ...overrides });
    },
    buildPaid: (overrides = {}) => {
        return exports.CourseFactory.build({ isFree: false, price: test_helpers_1.randomHelpers.randomNumber(49.99, 299.99), ...overrides });
    }
};
// Lesson data factory
exports.LessonFactory = {
    build: (overrides = {}) => ({
        id: (0, uuid_1.v4)(),
        courseId: (0, uuid_1.v4)(),
        title: `${test_helpers_1.randomHelpers.randomArrayElement(['Introduction to', 'Understanding', 'Working with', 'Advanced'])} ${test_helpers_1.randomHelpers.randomString(8)}`,
        description: `Detailed lesson covering ${test_helpers_1.randomHelpers.randomString(10)} concepts`,
        content: `This lesson will teach you about ${test_helpers_1.randomHelpers.randomString(15)}. You will learn practical skills and theoretical knowledge.`,
        type: test_helpers_1.randomHelpers.randomArrayElement(['video', 'text', 'interactive', 'quiz', 'assignment']),
        order: test_helpers_1.randomHelpers.randomNumber(1, 20),
        duration: test_helpers_1.randomHelpers.randomNumber(5, 60), // minutes
        isPublished: true,
        isFree: test_helpers_1.randomHelpers.randomBoolean(),
        videoUrl: `https://example.com/videos/${test_helpers_1.randomHelpers.randomString(8)}.mp4`,
        videoThumbnail: `https://example.com/thumbnails/${test_helpers_1.randomHelpers.randomString(8)}.jpg`,
        videoDuration: test_helpers_1.randomHelpers.randomNumber(300, 3600), // seconds
        attachments: [
            {
                id: (0, uuid_1.v4)(),
                name: `${test_helpers_1.randomHelpers.randomString(8)}.pdf`,
                url: `https://example.com/attachments/${test_helpers_1.randomHelpers.randomString(8)}.pdf`,
                size: test_helpers_1.randomHelpers.randomNumber(1024, 10485760), // bytes
                type: 'pdf'
            }
        ],
        quiz: test_helpers_1.randomHelpers.randomBoolean() ? {
            id: (0, uuid_1.v4)(),
            questions: [
                {
                    id: (0, uuid_1.v4)(),
                    question: `What is the main concept of ${test_helpers_1.randomHelpers.randomString(6)}?`,
                    type: 'multiple-choice',
                    options: [
                        'Option A',
                        'Option B',
                        'Option C',
                        'Option D'
                    ],
                    correctAnswer: 0,
                    explanation: 'This is the correct answer because...'
                }
            ],
            passingScore: 80,
            timeLimit: 600 // seconds
        } : null,
        notes: `Important notes about ${test_helpers_1.randomHelpers.randomString(8)}`,
        tags: [test_helpers_1.randomHelpers.randomString(5), test_helpers_1.randomHelpers.randomString(6)],
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides
    }),
    buildMany: (count, courseId, overrides = {}) => {
        const lessons = Array.from({ length: count }, (_, index) => exports.LessonFactory.build({
            courseId: courseId || (0, uuid_1.v4)(),
            order: index + 1,
            ...overrides
        }));
        return lessons;
    },
    buildVideoLesson: (overrides = {}) => {
        return exports.LessonFactory.build({
            type: 'video',
            videoUrl: `https://example.com/videos/${test_helpers_1.randomHelpers.randomString(8)}.mp4`,
            videoDuration: test_helpers_1.randomHelpers.randomNumber(600, 1800),
            ...overrides
        });
    },
    buildTextLesson: (overrides = {}) => {
        return exports.LessonFactory.build({
            type: 'text',
            content: `This is a comprehensive text lesson about ${test_helpers_1.randomHelpers.randomString(10)}. It includes detailed explanations and examples.`,
            videoUrl: null,
            ...overrides
        });
    },
    buildQuizLesson: (overrides = {}) => {
        return exports.LessonFactory.build({
            type: 'quiz',
            quiz: {
                id: (0, uuid_1.v4)(),
                questions: Array.from({ length: 5 }, (_, i) => ({
                    id: (0, uuid_1.v4)(),
                    question: `Question ${i + 1}: What is ${test_helpers_1.randomHelpers.randomString(6)}?`,
                    type: 'multiple-choice',
                    options: ['Option A', 'Option B', 'Option C', 'Option D'],
                    correctAnswer: test_helpers_1.randomHelpers.randomNumber(0, 3),
                    explanation: `This is the explanation for question ${i + 1}`
                })),
                passingScore: 80,
                timeLimit: 900
            },
            ...overrides
        });
    }
};
// Enrollment data factory
exports.EnrollmentFactory = {
    build: (overrides = {}) => ({
        id: (0, uuid_1.v4)(),
        userId: (0, uuid_1.v4)(),
        courseId: (0, uuid_1.v4)(),
        status: test_helpers_1.randomHelpers.randomArrayElement(['active', 'completed', 'dropped', 'paused']),
        progress: {
            completedLessons: test_helpers_1.randomHelpers.randomNumber(0, 20),
            totalLessons: test_helpers_1.randomHelpers.randomNumber(20, 50),
            completionPercentage: test_helpers_1.randomHelpers.randomNumber(0, 100),
            lastAccessedLessonId: (0, uuid_1.v4)(),
            timeSpent: test_helpers_1.randomHelpers.randomNumber(3600, 86400), // seconds
            quizScores: [
                { lessonId: (0, uuid_1.v4)(), score: test_helpers_1.randomHelpers.randomNumber(70, 100), attempts: 1 },
                { lessonId: (0, uuid_1.v4)(), score: test_helpers_1.randomHelpers.randomNumber(80, 100), attempts: 2 }
            ]
        },
        enrolledAt: test_helpers_1.randomHelpers.randomDate(2023, 2024),
        startedAt: test_helpers_1.randomHelpers.randomDate(2023, 2024),
        completedAt: test_helpers_1.randomHelpers.randomBoolean() ? test_helpers_1.randomHelpers.randomDate(2023, 2024) : null,
        lastAccessedAt: test_helpers_1.randomHelpers.randomDate(2024, 2024),
        paymentStatus: test_helpers_1.randomHelpers.randomArrayElement(['paid', 'free', 'refunded', 'pending']),
        certificateIssued: test_helpers_1.randomHelpers.randomBoolean(),
        rating: test_helpers_1.randomHelpers.randomBoolean() ? {
            score: test_helpers_1.randomHelpers.randomNumber(3, 5),
            comment: `Great course! ${test_helpers_1.randomHelpers.randomString(20)}`,
            createdAt: new Date()
        } : null,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides
    }),
    buildMany: (count, overrides = {}) => {
        return Array.from({ length: count }, () => exports.EnrollmentFactory.build(overrides));
    },
    buildActive: (overrides = {}) => {
        return exports.EnrollmentFactory.build({ status: 'active', completedAt: null, ...overrides });
    },
    buildCompleted: (overrides = {}) => {
        return exports.EnrollmentFactory.build({
            status: 'completed',
            completedAt: test_helpers_1.randomHelpers.randomDate(2023, 2024),
            progress: {
                completedLessons: 25,
                totalLessons: 25,
                completionPercentage: 100,
                lastAccessedLessonId: (0, uuid_1.v4)(),
                timeSpent: test_helpers_1.randomHelpers.randomNumber(18000, 36000),
                quizScores: []
            },
            certificateIssued: true,
            ...overrides
        });
    }
};
// Authentication data factory
exports.AuthFactory = {
    buildLoginRequest: (overrides = {}) => ({
        email: test_helpers_1.randomHelpers.randomEmail(),
        password: 'TestPass123!',
        rememberMe: test_helpers_1.randomHelpers.randomBoolean(),
        ...overrides
    }),
    buildRegisterRequest: (overrides = {}) => ({
        email: test_helpers_1.randomHelpers.randomEmail(),
        password: 'TestPass123!',
        confirmPassword: 'TestPass123!',
        firstName: test_helpers_1.randomHelpers.randomArrayElement(['John', 'Jane', 'Alice', 'Bob']),
        lastName: test_helpers_1.randomHelpers.randomArrayElement(['Smith', 'Johnson', 'Williams', 'Brown']),
        username: test_helpers_1.randomHelpers.randomString(8),
        agreeToTerms: true,
        ...overrides
    }),
    buildTokenPair: () => ({
        accessToken: test_helpers_1.authHelpers.generateTestToken(),
        refreshToken: test_helpers_1.authHelpers.generateTestToken({ type: 'refresh' }),
        expiresIn: 3600,
        tokenType: 'Bearer'
    }),
    buildExpiredTokenPair: () => ({
        accessToken: test_helpers_1.authHelpers.generateExpiredToken(),
        refreshToken: test_helpers_1.authHelpers.generateExpiredToken({ type: 'refresh' }),
        expiresIn: -1,
        tokenType: 'Bearer'
    })
};
// API Response data factory
exports.ResponseFactory = {
    buildSuccessResponse: (data, meta) => ({
        success: true,
        data,
        meta,
        timestamp: new Date().toISOString(),
        requestId: (0, uuid_1.v4)()
    }),
    buildErrorResponse: (message, code = 400, details) => ({
        success: false,
        error: {
            message,
            code,
            details
        },
        timestamp: new Date().toISOString(),
        requestId: (0, uuid_1.v4)()
    }),
    buildPaginatedResponse: (data, page = 1, limit = 10, total) => {
        const totalItems = total || data.length;
        const totalPages = Math.ceil(totalItems / limit);
        return {
            success: true,
            data,
            pagination: {
                page,
                limit,
                total: totalItems,
                pages: totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            },
            timestamp: new Date().toISOString(),
            requestId: (0, uuid_1.v4)()
        };
    }
};
exports.default = {
    UserFactory: exports.UserFactory,
    CourseFactory: exports.CourseFactory,
    LessonFactory: exports.LessonFactory,
    EnrollmentFactory: exports.EnrollmentFactory,
    AuthFactory: exports.AuthFactory,
    ResponseFactory: exports.ResponseFactory
};
//# sourceMappingURL=data-factory.js.map