/**
 * Student Onboarding Workflow Automation Tests
 * 
 * Tests the complete student registration, profile setup, and initial
 * course enrollment workflow with edge cases and real-world scenarios.
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { 
  StudentOnboardingService,
  ProfileCompletionService,
  WelcomeMessageService,
  InitialAssessmentService 
} from '../../../jung-edu-app/src/services/onboarding';
import { AuthService } from '../../../jung-edu-app/src/services/auth/authService';
import { NotificationService } from '../../../jung-edu-app/src/services/notifications';
import { AnalyticsService } from '../../../jung-edu-app/src/services/analytics';

// Mock services
jest.mock('../../../jung-edu-app/src/services/auth/authService');
jest.mock('../../../jung-edu-app/src/services/notifications');
jest.mock('../../../jung-edu-app/src/services/analytics');

interface StudentProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  learningPreferences: {
    style: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
    pace: 'slow' | 'moderate' | 'fast';
    difficulty: 'beginner' | 'intermediate' | 'advanced';
  };
  interests: string[];
  timezone: string;
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

interface OnboardingStep {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'failed';
  progress: number;
  estimatedTime: number;
  completedAt?: Date;
  data?: any;
}

describe('Student Onboarding Workflow Tests', () => {
  let onboardingService: StudentOnboardingService;
  let profileService: ProfileCompletionService;
  let welcomeService: WelcomeMessageService;
  let assessmentService: InitialAssessmentService;
  let authService: jest.Mocked<AuthService>;
  let notificationService: jest.Mocked<NotificationService>;
  let analyticsService: jest.Mocked<AnalyticsService>;

  const mockStudentData = {
    email: 'student@example.com',
    firstName: 'Jane',
    lastName: 'Doe',
    password: 'SecurePassword123!',
    dateOfBirth: '1995-03-15',
    country: 'US'
  };

  beforeEach(() => {
    authService = new AuthService() as jest.Mocked<AuthService>;
    notificationService = new NotificationService() as jest.Mocked<NotificationService>;
    analyticsService = new AnalyticsService() as jest.Mocked<AnalyticsService>;
    
    onboardingService = new StudentOnboardingService(
      authService,
      notificationService,
      analyticsService
    );
    profileService = new ProfileCompletionService();
    welcomeService = new WelcomeMessageService();
    assessmentService = new InitialAssessmentService();

    jest.clearAllMocks();
  });

  describe('Complete Onboarding Flow', () => {
    test('should complete full onboarding workflow successfully', async () => {
      // Mock successful auth registration
      authService.registerUser.mockResolvedValue({
        user: { id: 'user123', email: mockStudentData.email },
        session: { access_token: 'token123' }
      });

      const result = await onboardingService.startOnboarding(mockStudentData);

      expect(result.success).toBe(true);
      expect(result.userId).toBe('user123');
      expect(result.steps).toHaveLength(6);
      expect(result.currentStep).toBe('account_verification');
    });

    test('should handle onboarding with all steps completed', async () => {
      const userId = 'user123';
      
      // Complete all onboarding steps
      await onboardingService.completeStep(userId, 'account_verification');
      await onboardingService.completeStep(userId, 'profile_setup');
      await onboardingService.completeStep(userId, 'learning_preferences');
      await onboardingService.completeStep(userId, 'initial_assessment');
      await onboardingService.completeStep(userId, 'course_selection');
      await onboardingService.completeStep(userId, 'welcome_tour');

      const status = await onboardingService.getOnboardingStatus(userId);
      
      expect(status.isComplete).toBe(true);
      expect(status.completionPercentage).toBe(100);
      expect(status.completedAt).toBeDefined();
      expect(analyticsService.trackEvent).toHaveBeenCalledWith('onboarding_completed', {
        userId,
        timeToComplete: expect.any(Number),
        stepsCompleted: 6
      });
    });
  });

  describe('Account Registration and Verification', () => {
    test('should register student account with email verification', async () => {
      authService.registerUser.mockResolvedValue({
        user: { id: 'user123', email: mockStudentData.email, email_confirmed_at: null },
        session: null
      });

      const result = await onboardingService.registerStudent({
        ...mockStudentData,
        agreedToTerms: true,
        marketingConsent: false
      });

      expect(authService.registerUser).toHaveBeenCalledWith({
        email: mockStudentData.email,
        password: mockStudentData.password,
        options: {
          data: {
            first_name: mockStudentData.firstName,
            last_name: mockStudentData.lastName,
            date_of_birth: mockStudentData.dateOfBirth,
            country: mockStudentData.country
          }
        }
      });

      expect(notificationService.sendEmail).toHaveBeenCalledWith({
        to: mockStudentData.email,
        template: 'email_verification',
        data: expect.any(Object)
      });

      expect(result.requiresEmailVerification).toBe(true);
    });

    test('should handle registration with invalid email format', async () => {
      const invalidData = { ...mockStudentData, email: 'invalid-email' };

      await expect(onboardingService.registerStudent(invalidData)).rejects.toThrow(
        'Invalid email format'
      );

      expect(authService.registerUser).not.toHaveBeenCalled();
    });

    test('should handle registration with weak password', async () => {
      const weakPasswordData = { ...mockStudentData, password: '123' };

      await expect(onboardingService.registerStudent(weakPasswordData)).rejects.toThrow(
        'Password does not meet security requirements'
      );
    });

    test('should handle duplicate email registration', async () => {
      authService.registerUser.mockRejectedValue(new Error('User already exists'));

      await expect(onboardingService.registerStudent(mockStudentData)).rejects.toThrow(
        'Email address is already registered'
      );
    });
  });

  describe('Profile Setup', () => {
    test('should complete profile setup with all required fields', async () => {
      const userId = 'user123';
      const profileData: Partial<StudentProfile> = {
        firstName: 'Jane',
        lastName: 'Doe',
        timezone: 'America/New_York',
        language: 'en',
        interests: ['Psychology', 'Jung', 'Dream Analysis']
      };

      const result = await profileService.updateProfile(userId, profileData);

      expect(result.success).toBe(true);
      expect(result.completionPercentage).toBe(60); // Basic info completed
      expect(result.missingFields).toEqual(['learningPreferences', 'notifications']);
    });

    test('should handle profile setup with learning preferences', async () => {
      const userId = 'user123';
      const learningPrefs = {
        style: 'visual' as const,
        pace: 'moderate' as const,
        difficulty: 'intermediate' as const,
        studyTimePreference: 'evening',
        sessionDuration: 45 // minutes
      };

      const result = await profileService.setLearningPreferences(userId, learningPrefs);

      expect(result.success).toBe(true);
      expect(result.recommendations).toBeDefined();
      expect(result.suggestedCourses).toHaveLength(3);
    });

    test('should validate required profile fields', async () => {
      const userId = 'user123';
      const incompleteProfile = { firstName: 'Jane' }; // Missing required lastName

      await expect(
        profileService.updateProfile(userId, incompleteProfile)
      ).rejects.toThrow('Last name is required');
    });

    test('should handle profile photo upload', async () => {
      const userId = 'user123';
      const mockFile = new File(['profile-pic'], 'profile.jpg', { type: 'image/jpeg' });

      const result = await profileService.uploadProfilePhoto(userId, mockFile);

      expect(result.success).toBe(true);
      expect(result.photoUrl).toMatch(/^https:\/\/.*\/profile\.jpg$/);
      expect(result.thumbnailUrl).toBeDefined();
    });
  });

  describe('Initial Assessment', () => {
    test('should conduct knowledge assessment', async () => {
      const userId = 'user123';
      const assessmentAnswers = [
        { questionId: 'q1', answer: 'b', timeSpent: 30 },
        { questionId: 'q2', answer: 'a', timeSpent: 45 },
        { questionId: 'q3', answer: 'c', timeSpent: 60 }
      ];

      const result = await assessmentService.submitAssessment(userId, assessmentAnswers);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.level).toBeOneOf(['beginner', 'intermediate', 'advanced']);
      expect(result.strongAreas).toBeDefined();
      expect(result.improvementAreas).toBeDefined();
      expect(result.recommendedPath).toBeDefined();
    });

    test('should handle assessment timeout', async () => {
      const userId = 'user123';
      
      // Simulate assessment timeout
      jest.useFakeTimers();
      const assessmentPromise = assessmentService.startAssessment(userId);
      
      // Fast-forward past timeout
      jest.advanceTimersByTime(20 * 60 * 1000); // 20 minutes
      
      const result = await assessmentPromise;
      
      expect(result.status).toBe('timeout');
      expect(result.partialScore).toBeDefined();
      expect(result.questionsAnswered).toBeLessThan(result.totalQuestions);
      
      jest.useRealTimers();
    });

    test('should provide adaptive questions based on performance', async () => {
      const userId = 'user123';
      
      // Start assessment
      await assessmentService.startAssessment(userId);
      
      // Answer first question correctly
      await assessmentService.answerQuestion(userId, 'q1', 'correct_answer');
      
      const nextQuestion = await assessmentService.getNextQuestion(userId);
      
      // Should receive harder question
      expect(nextQuestion.difficulty).toBeGreaterThan(1);
      
      // Answer incorrectly
      await assessmentService.answerQuestion(userId, nextQuestion.id, 'wrong_answer');
      
      const subsequentQuestion = await assessmentService.getNextQuestion(userId);
      
      // Should receive easier question
      expect(subsequentQuestion.difficulty).toBeLessThan(nextQuestion.difficulty);
    });
  });

  describe('Course Selection and Enrollment', () => {
    test('should recommend courses based on assessment results', async () => {
      const userId = 'user123';
      const assessmentResults = {
        level: 'intermediate',
        strongAreas: ['analytical-psychology', 'archetypes'],
        interests: ['jung', 'dream-analysis']
      };

      const recommendations = await onboardingService.getCourseRecommendations(
        userId,
        assessmentResults
      );

      expect(recommendations).toHaveLength(5);
      expect(recommendations[0].matchScore).toBeGreaterThan(0.8);
      expect(recommendations[0].reason).toBeDefined();
      expect(recommendations.some(course => 
        course.topics.includes('dream-analysis')
      )).toBe(true);
    });

    test('should enroll student in selected courses', async () => {
      const userId = 'user123';
      const selectedCourses = ['course1', 'course2'];

      const result = await onboardingService.enrollInCourses(userId, selectedCourses);

      expect(result.enrolledCourses).toEqual(selectedCourses);
      expect(result.startDates).toHaveLength(2);
      expect(notificationService.sendEmail).toHaveBeenCalledWith({
        to: expect.any(String),
        template: 'enrollment_confirmation',
        data: { courses: selectedCourses }
      });
    });

    test('should handle course enrollment limits', async () => {
      const userId = 'user123';
      const tooManyCourses = Array.from({ length: 6 }, (_, i) => `course${i}`);

      await expect(
        onboardingService.enrollInCourses(userId, tooManyCourses)
      ).rejects.toThrow('Maximum enrollment limit exceeded (5 courses)');
    });
  });

  describe('Welcome Experience', () => {
    test('should provide personalized welcome tour', async () => {
      const userId = 'user123';
      const profile = {
        learningStyle: 'visual',
        experience: 'beginner',
        interests: ['psychology', 'jung']
      };

      const tour = await welcomeService.generatePersonalizedTour(userId, profile);

      expect(tour.steps).toHaveLength(7);
      expect(tour.estimatedDuration).toBe(15); // minutes
      expect(tour.personalizations).toBeDefined();
      expect(tour.steps.some(step => step.focus === 'visual-learning')).toBe(true);
    });

    test('should send welcome messages sequence', async () => {
      const userId = 'user123';
      
      await welcomeService.startWelcomeSequence(userId);

      // Immediate welcome
      expect(notificationService.sendEmail).toHaveBeenCalledWith({
        to: expect.any(String),
        template: 'welcome_immediate',
        data: expect.any(Object)
      });

      // Schedule follow-up messages
      expect(notificationService.scheduleEmail).toHaveBeenCalledTimes(3);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle network connectivity issues', async () => {
      authService.registerUser.mockRejectedValue(new Error('Network error'));

      const result = await onboardingService.registerStudent(mockStudentData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('network');
      expect(result.retryable).toBe(true);
    });

    test('should resume interrupted onboarding', async () => {
      const userId = 'user123';
      
      // Simulate interrupted onboarding
      await onboardingService.completeStep(userId, 'account_verification');
      await onboardingService.completeStep(userId, 'profile_setup');
      
      // Resume onboarding
      const status = await onboardingService.resumeOnboarding(userId);
      
      expect(status.currentStep).toBe('learning_preferences');
      expect(status.completedSteps).toHaveLength(2);
      expect(status.remainingSteps).toHaveLength(4);
    });

    test('should handle concurrent onboarding sessions', async () => {
      const userId = 'user123';
      
      const session1 = onboardingService.startOnboarding(mockStudentData);
      const session2 = onboardingService.startOnboarding(mockStudentData);
      
      const results = await Promise.allSettled([session1, session2]);
      
      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
    });

    test('should validate student age requirements', async () => {
      const underageStudent = {
        ...mockStudentData,
        dateOfBirth: '2010-01-01' // Too young
      };

      await expect(
        onboardingService.registerStudent(underageStudent)
      ).rejects.toThrow('Must be at least 13 years old to register');
    });

    test('should handle invalid country codes', async () => {
      const invalidCountryData = {
        ...mockStudentData,
        country: 'INVALID'
      };

      await expect(
        onboardingService.registerStudent(invalidCountryData)
      ).rejects.toThrow('Invalid country code');
    });
  });

  describe('Analytics and Tracking', () => {
    test('should track onboarding funnel metrics', async () => {
      const userId = 'user123';
      
      await onboardingService.startOnboarding(mockStudentData);
      await onboardingService.completeStep(userId, 'account_verification');
      
      expect(analyticsService.trackEvent).toHaveBeenCalledWith('onboarding_step_completed', {
        userId,
        step: 'account_verification',
        timeToComplete: expect.any(Number)
      });
    });

    test('should track conversion rates by traffic source', async () => {
      const studentWithSource = {
        ...mockStudentData,
        referralSource: 'google',
        utm_campaign: 'psychology-course-promo'
      };

      await onboardingService.registerStudent(studentWithSource);

      expect(analyticsService.trackConversion).toHaveBeenCalledWith({
        event: 'student_registered',
        source: 'google',
        campaign: 'psychology-course-promo'
      });
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.restoreAllMocks();
  });
});

// Test utilities and helpers
export const createMockStudent = (overrides: Partial<StudentProfile> = {}): StudentProfile => ({
  id: 'student123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'Student',
  learningPreferences: {
    style: 'visual',
    pace: 'moderate',
    difficulty: 'beginner'
  },
  interests: ['psychology'],
  timezone: 'UTC',
  language: 'en',
  notifications: {
    email: true,
    push: false,
    sms: false
  },
  ...overrides
});

export const waitForOnboardingCompletion = async (
  service: StudentOnboardingService,
  userId: string,
  timeout = 30000
): Promise<void> => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const status = await service.getOnboardingStatus(userId);
    if (status.isComplete) return;
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  throw new Error('Onboarding completion timeout');
};