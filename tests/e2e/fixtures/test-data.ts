/**
 * Test data fixtures for E2E tests
 * Centralized location for test data to ensure consistency
 */

export interface TestUser {
  id?: string;
  name: string;
  email: string;
  password: string;
  role: 'student' | 'instructor' | 'admin';
}

export interface TestModule {
  id?: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  topics: string[];
  estimatedDuration: number; // in minutes
  content: string;
}

export interface TestQuiz {
  id?: string;
  moduleId?: string;
  title: string;
  description: string;
  questions: TestQuestion[];
  timeLimit?: number; // in minutes
}

export interface TestQuestion {
  id?: string;
  type: 'multiple-choice' | 'true-false' | 'essay' | 'fill-blank';
  question: string;
  options?: string[];
  correctAnswer: string | number;
  explanation?: string;
  points: number;
}

/**
 * Test user accounts for different scenarios
 */
export const testUsers: { [key: string]: TestUser } = {
  student: {
    name: 'Test Student',
    email: 'student@jaqedu.com',
    password: 'StudentPass123!',
    role: 'student'
  },
  instructor: {
    name: 'Test Instructor',
    email: 'instructor@jaqedu.com',
    password: 'InstructorPass123!',
    role: 'instructor'
  },
  admin: {
    name: 'Test Admin',
    email: 'admin@jaqedu.com',
    password: 'AdminPass123!',
    role: 'admin'
  }
};

/**
 * Test modules for learning journey tests
 */
export const testModules: TestModule[] = [
  {
    title: 'Introduction to Psychology',
    description: 'Basic concepts and history of psychology',
    difficulty: 'beginner',
    topics: ['History', 'Basic Concepts', 'Research Methods'],
    estimatedDuration: 45,
    content: `# Introduction to Psychology

Psychology is the scientific study of mind and behavior. This module will introduce you to:

## Key Topics:
- **History of Psychology**: From ancient philosophy to modern science
- **Basic Concepts**: Understanding human behavior and mental processes
- **Research Methods**: How psychologists study the mind

## Learning Objectives:
By the end of this module, you will be able to:
1. Define psychology and its major subfields
2. Identify key historical figures and their contributions
3. Understand basic research methods in psychology

## Content:
Psychology emerged as a scientific discipline in the late 19th century...`
  },
  {
    title: 'Jungian Archetypes',
    description: 'Exploring Carl Jung\'s theory of archetypes',
    difficulty: 'intermediate',
    topics: ['Collective Unconscious', 'Archetypes', 'Shadow', 'Anima/Animus'],
    estimatedDuration: 60,
    content: `# Jungian Archetypes

Carl Jung's theory of archetypes forms a cornerstone of analytical psychology...`
  }
];

/**
 * Test quizzes for assessment functionality
 */
export const testQuizzes: TestQuiz[] = [
  {
    title: 'Psychology Basics Quiz',
    description: 'Test your understanding of basic psychology concepts',
    timeLimit: 15,
    questions: [
      {
        type: 'multiple-choice',
        question: 'Who is considered the father of modern psychology?',
        options: ['Sigmund Freud', 'William James', 'Wilhelm Wundt', 'Carl Jung'],
        correctAnswer: 2,
        explanation: 'Wilhelm Wundt established the first psychology laboratory in 1879.',
        points: 10
      },
      {
        type: 'true-false',
        question: 'Psychology is only concerned with mental illness.',
        correctAnswer: 'false',
        explanation: 'Psychology studies all aspects of human behavior and mental processes.',
        points: 5
      },
      {
        type: 'fill-blank',
        question: 'The _______ method involves systematic observation and measurement.',
        correctAnswer: 'scientific',
        explanation: 'The scientific method is fundamental to psychological research.',
        points: 10
      }
    ]
  }
];

/**
 * Test navigation paths and URLs
 */
export const testPaths = {
  // Public pages
  home: '/',
  about: '/about',
  
  // Authentication pages
  login: '/auth/login',
  register: '/auth/register',
  forgotPassword: '/auth/forgot-password',
  
  // Student dashboard
  dashboard: '/dashboard',
  modules: '/modules',
  progress: '/progress',
  notes: '/notes',
  
  // Module pages
  moduleView: (id: string) => `/modules/${id}`,
  quizTake: (moduleId: string, quizId: string) => `/modules/${moduleId}/quiz/${quizId}`,
  
  // Admin pages
  adminLogin: '/admin/login',
  adminDashboard: '/admin/dashboard',
  adminModules: '/admin/modules',
  adminUsers: '/admin/users',
  adminQuizzes: '/admin/quizzes',
  adminResources: '/admin/resources'
};

/**
 * Test selectors for common elements
 */
export const testSelectors = {
  // Common elements
  loadingSpinner: '[data-testid="loading-spinner"]',
  errorMessage: '[data-testid="error-message"]',
  successMessage: '[data-testid="success-message"]',
  
  // Navigation
  mainNav: '[data-testid="main-navigation"]',
  userMenu: '[data-testid="user-menu"]',
  logoutButton: '[data-testid="logout-button"]',
  
  // Forms
  loginForm: '[data-testid="login-form"]',
  registerForm: '[data-testid="register-form"]',
  emailInput: '[data-testid="email-input"]',
  passwordInput: '[data-testid="password-input"]',
  submitButton: '[data-testid="submit-button"]',
  
  // Dashboard
  dashboardHeader: '[data-testid="dashboard-header"]',
  moduleCard: '[data-testid="module-card"]',
  progressBar: '[data-testid="progress-bar"]',
  
  // Module viewer
  moduleContent: '[data-testid="module-content"]',
  nextButton: '[data-testid="next-button"]',
  prevButton: '[data-testid="prev-button"]',
  
  // Quiz
  quizContainer: '[data-testid="quiz-container"]',
  questionText: '[data-testid="question-text"]',
  answerOption: '[data-testid="answer-option"]',
  submitQuiz: '[data-testid="submit-quiz"]',
  
  // Admin
  adminNav: '[data-testid="admin-navigation"]',
  createModuleButton: '[data-testid="create-module-button"]',
  moduleEditor: '[data-testid="module-editor"]',
  saveButton: '[data-testid="save-button"]'
};

/**
 * Test environment configuration
 */
export const testConfig = {
  // Timeouts
  defaultTimeout: 30000,
  longTimeout: 60000,
  shortTimeout: 5000,
  
  // Retry settings
  retries: process.env.CI ? 2 : 0,
  
  // Database settings
  testDbName: 'jaqedu_test',
  
  // API endpoints
  apiBaseUrl: process.env.PLAYWRIGHT_API_URL || 'http://localhost:3000/api',
  
  // Feature flags
  enableVideoRecording: process.env.E2E_RECORD_VIDEO === 'true',
  enableSlowMo: process.env.E2E_SLOW_MO === 'true',
  
  // Test data cleanup
  cleanupAfterTests: process.env.E2E_CLEANUP !== 'false'
};

/**
 * Helper function to generate unique test data
 */
export function generateUniqueTestData() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  
  return {
    email: `test.user.${timestamp}.${random}@jaqedu.com`,
    username: `testuser${timestamp}${random}`,
    moduleName: `Test Module ${timestamp}-${random}`,
    quizName: `Test Quiz ${timestamp}-${random}`
  };
}