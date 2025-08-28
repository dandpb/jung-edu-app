import { v4 as uuidv4 } from 'uuid';
import { randomHelpers, authHelpers } from '../utils/test-helpers';

/**
 * Data Factory for jaqEdu Test Data Generation
 * Provides consistent test data creation with realistic values
 */

// User data factory
export const UserFactory = {
  build: (overrides: Partial<User> = {}): User => ({
    id: uuidv4(),
    email: randomHelpers.randomEmail(),
    username: randomHelpers.randomString(8),
    firstName: randomHelpers.randomArrayElement(['John', 'Jane', 'Alice', 'Bob', 'Charlie', 'Diana']),
    lastName: randomHelpers.randomArrayElement(['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia']),
    password: 'TestPass123!',
    role: randomHelpers.randomArrayElement(['student', 'teacher', 'admin']),
    isActive: true,
    isVerified: true,
    profileImage: null,
    bio: `Test user bio for ${randomHelpers.randomString(5)}`,
    dateOfBirth: randomHelpers.randomDate(1990, 2005),
    phoneNumber: `+1${randomHelpers.randomNumber(1000000000, 9999999999)}`,
    address: {
      street: `${randomHelpers.randomNumber(1, 999)} ${randomHelpers.randomArrayElement(['Main', 'Oak', 'First', 'Second'])} St`,
      city: randomHelpers.randomArrayElement(['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix']),
      state: randomHelpers.randomArrayElement(['NY', 'CA', 'IL', 'TX', 'AZ']),
      zipCode: randomHelpers.randomNumber(10000, 99999).toString(),
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
    lastLoginAt: randomHelpers.randomDate(2024, 2024),
    ...overrides
  }),
  
  buildMany: (count: number, overrides: Partial<User> = {}): User[] => {
    return Array.from({ length: count }, () => UserFactory.build(overrides));
  },
  
  buildStudent: (overrides: Partial<User> = {}): User => {
    return UserFactory.build({ role: 'student', ...overrides });
  },
  
  buildTeacher: (overrides: Partial<User> = {}): User => {
    return UserFactory.build({ role: 'teacher', ...overrides });
  },
  
  buildAdmin: (overrides: Partial<User> = {}): User => {
    return UserFactory.build({ role: 'admin', ...overrides });
  }
};

// Course data factory
export const CourseFactory = {
  build: (overrides: Partial<Course> = {}): Course => ({
    id: uuidv4(),
    title: `${randomHelpers.randomArrayElement(['Introduction to', 'Advanced', 'Fundamentals of', 'Mastering'])} ${randomHelpers.randomArrayElement(['Mathematics', 'Science', 'Programming', 'History', 'Literature'])}`,
    description: `A comprehensive course covering essential topics in ${randomHelpers.randomString(10)}`,
    shortDescription: `Learn the basics of ${randomHelpers.randomString(8)}`,
    category: randomHelpers.randomArrayElement(['technology', 'science', 'mathematics', 'language', 'arts']),
    subcategory: randomHelpers.randomArrayElement(['programming', 'data-science', 'web-development', 'mobile-development']),
    level: randomHelpers.randomArrayElement(['beginner', 'intermediate', 'advanced']),
    language: 'en',
    duration: randomHelpers.randomNumber(4, 52), // weeks
    estimatedHours: randomHelpers.randomNumber(10, 200),
    price: randomHelpers.randomNumber(0, 299.99),
    currency: 'USD',
    isPublished: true,
    isFree: randomHelpers.randomBoolean(),
    thumbnailUrl: `https://example.com/thumbnails/${randomHelpers.randomString(8)}.jpg`,
    videoPreviewUrl: `https://example.com/previews/${randomHelpers.randomString(8)}.mp4`,
    instructorId: uuidv4(),
    tags: randomHelpers.randomArrayElement([
      ['javascript', 'web-development'],
      ['python', 'data-science'],
      ['react', 'frontend'],
      ['node.js', 'backend']
    ]),
    prerequisites: randomHelpers.randomArrayElement([
      ['Basic programming knowledge'],
      ['High school mathematics'],
      ['No prerequisites'],
      ['HTML and CSS basics']
    ]),
    learningObjectives: [
      `Understand key concepts of ${randomHelpers.randomString(8)}`,
      `Apply practical skills in ${randomHelpers.randomString(8)}`,
      `Build real-world projects using ${randomHelpers.randomString(8)}`
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
    enrollmentCount: randomHelpers.randomNumber(0, 10000),
    rating: {
      average: randomHelpers.randomNumber(3.5, 5.0),
      count: randomHelpers.randomNumber(10, 1000)
    },
    status: randomHelpers.randomArrayElement(['draft', 'published', 'archived']),
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: randomHelpers.randomDate(2023, 2024),
    ...overrides
  }),
  
  buildMany: (count: number, overrides: Partial<Course> = {}): Course[] => {
    return Array.from({ length: count }, () => CourseFactory.build(overrides));
  },
  
  buildPublished: (overrides: Partial<Course> = {}): Course => {
    return CourseFactory.build({ isPublished: true, status: 'published', ...overrides });
  },
  
  buildDraft: (overrides: Partial<Course> = {}): Course => {
    return CourseFactory.build({ isPublished: false, status: 'draft', ...overrides });
  },
  
  buildFree: (overrides: Partial<Course> = {}): Course => {
    return CourseFactory.build({ isFree: true, price: 0, ...overrides });
  },
  
  buildPaid: (overrides: Partial<Course> = {}): Course => {
    return CourseFactory.build({ isFree: false, price: randomHelpers.randomNumber(49.99, 299.99), ...overrides });
  }
};

// Lesson data factory
export const LessonFactory = {
  build: (overrides: Partial<Lesson> = {}): Lesson => ({
    id: uuidv4(),
    courseId: uuidv4(),
    title: `${randomHelpers.randomArrayElement(['Introduction to', 'Understanding', 'Working with', 'Advanced'])} ${randomHelpers.randomString(8)}`,
    description: `Detailed lesson covering ${randomHelpers.randomString(10)} concepts`,
    content: `This lesson will teach you about ${randomHelpers.randomString(15)}. You will learn practical skills and theoretical knowledge.`,
    type: randomHelpers.randomArrayElement(['video', 'text', 'interactive', 'quiz', 'assignment']),
    order: randomHelpers.randomNumber(1, 20),
    duration: randomHelpers.randomNumber(5, 60), // minutes
    isPublished: true,
    isFree: randomHelpers.randomBoolean(),
    videoUrl: `https://example.com/videos/${randomHelpers.randomString(8)}.mp4`,
    videoThumbnail: `https://example.com/thumbnails/${randomHelpers.randomString(8)}.jpg`,
    videoDuration: randomHelpers.randomNumber(300, 3600), // seconds
    attachments: [
      {
        id: uuidv4(),
        name: `${randomHelpers.randomString(8)}.pdf`,
        url: `https://example.com/attachments/${randomHelpers.randomString(8)}.pdf`,
        size: randomHelpers.randomNumber(1024, 10485760), // bytes
        type: 'pdf'
      }
    ],
    quiz: randomHelpers.randomBoolean() ? {
      id: uuidv4(),
      questions: [
        {
          id: uuidv4(),
          question: `What is the main concept of ${randomHelpers.randomString(6)}?`,
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
    notes: `Important notes about ${randomHelpers.randomString(8)}`,
    tags: [randomHelpers.randomString(5), randomHelpers.randomString(6)],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),
  
  buildMany: (count: number, courseId?: string, overrides: Partial<Lesson> = {}): Lesson[] => {
    const lessons = Array.from({ length: count }, (_, index) => 
      LessonFactory.build({ 
        courseId: courseId || uuidv4(), 
        order: index + 1,
        ...overrides 
      })
    );
    return lessons;
  },
  
  buildVideoLesson: (overrides: Partial<Lesson> = {}): Lesson => {
    return LessonFactory.build({ 
      type: 'video',
      videoUrl: `https://example.com/videos/${randomHelpers.randomString(8)}.mp4`,
      videoDuration: randomHelpers.randomNumber(600, 1800),
      ...overrides 
    });
  },
  
  buildTextLesson: (overrides: Partial<Lesson> = {}): Lesson => {
    return LessonFactory.build({ 
      type: 'text',
      content: `This is a comprehensive text lesson about ${randomHelpers.randomString(10)}. It includes detailed explanations and examples.`,
      videoUrl: null,
      ...overrides 
    });
  },
  
  buildQuizLesson: (overrides: Partial<Lesson> = {}): Lesson => {
    return LessonFactory.build({ 
      type: 'quiz',
      quiz: {
        id: uuidv4(),
        questions: Array.from({ length: 5 }, (_, i) => ({
          id: uuidv4(),
          question: `Question ${i + 1}: What is ${randomHelpers.randomString(6)}?`,
          type: 'multiple-choice',
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: randomHelpers.randomNumber(0, 3),
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
export const EnrollmentFactory = {
  build: (overrides: Partial<Enrollment> = {}): Enrollment => ({
    id: uuidv4(),
    userId: uuidv4(),
    courseId: uuidv4(),
    status: randomHelpers.randomArrayElement(['active', 'completed', 'dropped', 'paused']),
    progress: {
      completedLessons: randomHelpers.randomNumber(0, 20),
      totalLessons: randomHelpers.randomNumber(20, 50),
      completionPercentage: randomHelpers.randomNumber(0, 100),
      lastAccessedLessonId: uuidv4(),
      timeSpent: randomHelpers.randomNumber(3600, 86400), // seconds
      quizScores: [
        { lessonId: uuidv4(), score: randomHelpers.randomNumber(70, 100), attempts: 1 },
        { lessonId: uuidv4(), score: randomHelpers.randomNumber(80, 100), attempts: 2 }
      ]
    },
    enrolledAt: randomHelpers.randomDate(2023, 2024),
    startedAt: randomHelpers.randomDate(2023, 2024),
    completedAt: randomHelpers.randomBoolean() ? randomHelpers.randomDate(2023, 2024) : null,
    lastAccessedAt: randomHelpers.randomDate(2024, 2024),
    paymentStatus: randomHelpers.randomArrayElement(['paid', 'free', 'refunded', 'pending']),
    certificateIssued: randomHelpers.randomBoolean(),
    rating: randomHelpers.randomBoolean() ? {
      score: randomHelpers.randomNumber(3, 5),
      comment: `Great course! ${randomHelpers.randomString(20)}`,
      createdAt: new Date()
    } : null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),
  
  buildMany: (count: number, overrides: Partial<Enrollment> = {}): Enrollment[] => {
    return Array.from({ length: count }, () => EnrollmentFactory.build(overrides));
  },
  
  buildActive: (overrides: Partial<Enrollment> = {}): Enrollment => {
    return EnrollmentFactory.build({ status: 'active', completedAt: null, ...overrides });
  },
  
  buildCompleted: (overrides: Partial<Enrollment> = {}): Enrollment => {
    return EnrollmentFactory.build({ 
      status: 'completed', 
      completedAt: randomHelpers.randomDate(2023, 2024),
      progress: {
        completedLessons: 25,
        totalLessons: 25,
        completionPercentage: 100,
        lastAccessedLessonId: uuidv4(),
        timeSpent: randomHelpers.randomNumber(18000, 36000),
        quizScores: []
      },
      certificateIssued: true,
      ...overrides 
    });
  }
};

// Authentication data factory
export const AuthFactory = {
  buildLoginRequest: (overrides: Partial<LoginRequest> = {}): LoginRequest => ({
    email: randomHelpers.randomEmail(),
    password: 'TestPass123!',
    rememberMe: randomHelpers.randomBoolean(),
    ...overrides
  }),
  
  buildRegisterRequest: (overrides: Partial<RegisterRequest> = {}): RegisterRequest => ({
    email: randomHelpers.randomEmail(),
    password: 'TestPass123!',
    confirmPassword: 'TestPass123!',
    firstName: randomHelpers.randomArrayElement(['John', 'Jane', 'Alice', 'Bob']),
    lastName: randomHelpers.randomArrayElement(['Smith', 'Johnson', 'Williams', 'Brown']),
    username: randomHelpers.randomString(8),
    agreeToTerms: true,
    ...overrides
  }),
  
  buildTokenPair: (): TokenPair => ({
    accessToken: authHelpers.generateTestToken(),
    refreshToken: authHelpers.generateTestToken({ type: 'refresh' }),
    expiresIn: 3600,
    tokenType: 'Bearer'
  }),
  
  buildExpiredTokenPair: (): TokenPair => ({
    accessToken: authHelpers.generateExpiredToken(),
    refreshToken: authHelpers.generateExpiredToken({ type: 'refresh' }),
    expiresIn: -1,
    tokenType: 'Bearer'
  })
};

// API Response data factory
export const ResponseFactory = {
  buildSuccessResponse: <T>(data: T, meta?: any): APIResponse<T> => ({
    success: true,
    data,
    meta,
    timestamp: new Date().toISOString(),
    requestId: uuidv4()
  }),
  
  buildErrorResponse: (message: string, code: number = 400, details?: any): APIErrorResponse => ({
    success: false,
    error: {
      message,
      code,
      details
    },
    timestamp: new Date().toISOString(),
    requestId: uuidv4()
  }),
  
  buildPaginatedResponse: <T>(data: T[], page: number = 1, limit: number = 10, total?: number): PaginatedResponse<T> => {
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
      requestId: uuidv4()
    };
  }
};

// Type definitions (these would typically be in separate type files)
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

export default {
  UserFactory,
  CourseFactory,
  LessonFactory,
  EnrollmentFactory,
  AuthFactory,
  ResponseFactory
};
