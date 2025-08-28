/**
 * Course Completion Workflow Automation Tests
 * 
 * Tests the entire course completion lifecycle including progress tracking,
 * milestone achievement, completion verification, and post-completion workflows.
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { 
  CourseCompletionService,
  MilestoneTrackingService,
  CompletionVerificationService,
  CertificationService,
  PostCompletionService
} from '../../../jung-edu-app/src/services/completion';
import { NotificationService } from '../../../jung-edu-app/src/services/notifications';
import { AnalyticsService } from '../../../jung-edu-app/src/services/analytics';
import { BadgeService } from '../../../jung-edu-app/src/services/gamification';

// Mock external services
jest.mock('../../../jung-edu-app/src/services/notifications');
jest.mock('../../../jung-edu-app/src/services/analytics');
jest.mock('../../../jung-edu-app/src/services/gamification');

interface Course {
  id: string;
  title: string;
  description: string;
  modules: Module[];
  requirements: CompletionRequirements;
  certification: CertificationConfig;
  metadata: {
    estimatedDuration: number; // hours
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    prerequisites: string[];
    learningOutcomes: string[];
  };
}

interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
  assessments: Assessment[];
  requiredForCompletion: boolean;
  weight: number; // For overall course grade calculation
  estimatedDuration: number; // minutes
}

interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'reading' | 'interactive' | 'quiz';
  content: any;
  duration: number;
  completionCriteria: {
    minTimeSpent?: number;
    minScore?: number;
    requiredInteractions?: string[];
    viewPercentage?: number;
  };
}

interface Assessment {
  id: string;
  type: 'quiz' | 'assignment' | 'project' | 'peer_review';
  title: string;
  points: number;
  passingScore: number;
  attempts: number;
  timeLimit?: number;
  rubric?: any;
}

interface CompletionRequirements {
  minimumGrade: number; // Percentage
  requiredModules: string[]; // Module IDs that must be completed
  optionalModules: string[]; // Module IDs that are optional
  minimumTimeSpent: number; // Hours
  requiredAssessments: string[]; // Assessment IDs that must be passed
  participationRequirements?: {
    forumPosts?: number;
    peerReviews?: number;
    discussionParticipation?: number;
  };
}

interface CertificationConfig {
  enabled: boolean;
  template: string;
  requirements: {
    minimumScore: number;
    completionPercentage: number;
    timeFrame?: number; // Days within which course must be completed
  };
  verification: {
    blockchain?: boolean;
    digitalSignature: boolean;
    uniqueId: boolean;
  };
}

interface StudentProgress {
  studentId: string;
  courseId: string;
  enrollmentDate: Date;
  lastActivityDate: Date;
  completedLessons: string[];
  completedAssessments: Record<string, {
    score: number;
    attempts: number;
    completedAt: Date;
    timeSpent: number;
  }>;
  moduleProgress: Record<string, {
    completion: number; // 0-1
    grade: number;
    timeSpent: number;
    status: 'not_started' | 'in_progress' | 'completed';
  }>;
  overallProgress: {
    completion: number;
    grade: number;
    timeSpent: number; // Total time in minutes
    milestones: string[]; // Achieved milestone IDs
  };
  engagementMetrics: {
    loginFrequency: number; // Days per week
    sessionDuration: number; // Average minutes per session
    contentInteraction: number; // Interaction score 0-1
    forumParticipation: number;
  };
}

interface CompletionResult {
  isCompleted: boolean;
  completionDate: Date;
  finalGrade: number;
  certificateId?: string;
  achievements: string[];
  timeToCompletion: number; // Days
  completionPath: {
    modulesCompleted: string[];
    assessmentScores: Record<string, number>;
    milestones: Array<{
      id: string;
      achievedAt: Date;
      description: string;
    }>;
  };
  postCompletionRecommendations: string[];
}

describe('Course Completion Workflow Automation Tests', () => {
  let completionService: CourseCompletionService;
  let milestoneService: MilestoneTrackingService;
  let verificationService: CompletionVerificationService;
  let certificationService: CertificationService;
  let postCompletionService: PostCompletionService;
  let notificationService: jest.Mocked<NotificationService>;
  let analyticsService: jest.Mocked<AnalyticsService>;
  let badgeService: jest.Mocked<BadgeService>;

  const mockCourse: Course = {
    id: 'jung-fundamentals',
    title: 'Fundamentals of Jungian Psychology',
    description: 'Comprehensive introduction to Carl Jung\'s analytical psychology',
    modules: [
      {
        id: 'module1',
        title: 'Introduction to Jung',
        lessons: [
          {
            id: 'lesson1-1',
            title: 'Jung\'s Life and Work',
            type: 'video',
            content: {},
            duration: 45,
            completionCriteria: { minTimeSpent: 35, viewPercentage: 85 }
          },
          {
            id: 'lesson1-2',
            title: 'Historical Context',
            type: 'reading',
            content: {},
            duration: 30,
            completionCriteria: { minTimeSpent: 25 }
          }
        ],
        assessments: [
          {
            id: 'quiz1',
            type: 'quiz',
            title: 'Jung Basics Quiz',
            points: 100,
            passingScore: 70,
            attempts: 3,
            timeLimit: 30
          }
        ],
        requiredForCompletion: true,
        weight: 0.25,
        estimatedDuration: 120
      },
      {
        id: 'module2',
        title: 'The Collective Unconscious',
        lessons: [
          {
            id: 'lesson2-1',
            title: 'Collective vs Personal Unconscious',
            type: 'interactive',
            content: {},
            duration: 60,
            completionCriteria: { requiredInteractions: ['drag-drop', 'quiz-embedded'] }
          }
        ],
        assessments: [
          {
            id: 'project1',
            type: 'project',
            title: 'Archetype Analysis',
            points: 200,
            passingScore: 75,
            attempts: 2
          }
        ],
        requiredForCompletion: true,
        weight: 0.35,
        estimatedDuration: 180
      }
    ],
    requirements: {
      minimumGrade: 75,
      requiredModules: ['module1', 'module2'],
      optionalModules: [],
      minimumTimeSpent: 4, // hours
      requiredAssessments: ['quiz1', 'project1'],
      participationRequirements: {
        forumPosts: 5,
        peerReviews: 2,
        discussionParticipation: 3
      }
    },
    certification: {
      enabled: true,
      template: 'jung-fundamentals-certificate',
      requirements: {
        minimumScore: 80,
        completionPercentage: 100,
        timeFrame: 90 // days
      },
      verification: {
        blockchain: true,
        digitalSignature: true,
        uniqueId: true
      }
    },
    metadata: {
      estimatedDuration: 6,
      difficulty: 'beginner',
      prerequisites: [],
      learningOutcomes: [
        'Understand Jung\'s key concepts',
        'Analyze archetypal patterns',
        'Apply Jungian theory to case studies'
      ]
    }
  };

  beforeEach(() => {
    notificationService = new NotificationService() as jest.Mocked<NotificationService>;
    analyticsService = new AnalyticsService() as jest.Mocked<AnalyticsService>;
    badgeService = new BadgeService() as jest.Mocked<BadgeService>;

    completionService = new CourseCompletionService(
      notificationService,
      analyticsService
    );
    milestoneService = new MilestoneTrackingService();
    verificationService = new CompletionVerificationService();
    certificationService = new CertificationService();
    postCompletionService = new PostCompletionService(badgeService);

    jest.clearAllMocks();
  });

  describe('Course Progress Tracking', () => {
    test('should track student progress across all modules', async () => {
      const studentId = 'student123';
      const courseId = mockCourse.id;

      // Simulate student completing first lesson
      await completionService.recordLessonCompletion(studentId, courseId, {
        lessonId: 'lesson1-1',
        timeSpent: 45,
        viewPercentage: 95,
        interactionsCompleted: ['play', 'pause', 'seek'],
        completedAt: new Date()
      });

      const progress = await completionService.getStudentProgress(studentId, courseId);

      expect(progress.completedLessons).toContain('lesson1-1');
      expect(progress.moduleProgress['module1'].completion).toBe(0.5); // 1 of 2 lessons
      expect(progress.overallProgress.completion).toBeCloseTo(0.125); // 1 of 8 total activities
    });

    test('should calculate weighted grades correctly', async () => {
      const studentId = 'student123';
      const courseId = mockCourse.id;

      // Complete module 1 with 80% grade
      await completionService.recordAssessmentCompletion(studentId, courseId, {
        assessmentId: 'quiz1',
        score: 80,
        maxScore: 100,
        timeSpent: 25,
        attempt: 1,
        answers: {},
        completedAt: new Date()
      });

      // Complete module 2 with 90% grade
      await completionService.recordAssessmentCompletion(studentId, courseId, {
        assessmentId: 'project1',
        score: 180,
        maxScore: 200,
        timeSpent: 120,
        attempt: 1,
        answers: {},
        completedAt: new Date()
      });

      const progress = await completionService.calculateOverallGrade(studentId, courseId);

      // Weighted calculation: (80 * 0.25) + (90 * 0.35) = 20 + 31.5 = 51.5
      // But need to account for remaining modules
      expect(progress.currentGrade).toBeCloseTo(85.83); // Average of completed modules
      expect(progress.projectedFinalGrade).toBeDefined();
    });

    test('should handle partial lesson completion', async () => {
      const studentId = 'student123';
      
      // Student watches only 60% of video (below 85% requirement)
      await completionService.recordLessonProgress(studentId, mockCourse.id, {
        lessonId: 'lesson1-1',
        timeSpent: 25, // Below 35 minute requirement
        viewPercentage: 60,
        exitPoint: 25, // minutes
        resumable: true
      });

      const progress = await completionService.getStudentProgress(studentId, mockCourse.id);

      expect(progress.completedLessons).not.toContain('lesson1-1');
      expect(progress.moduleProgress['module1'].completion).toBe(0);
      expect(progress.overallProgress.completion).toBe(0);
      
      // Should track partial progress for resume functionality
      const lessonProgress = await completionService.getLessonProgress(studentId, 'lesson1-1');
      expect(lessonProgress.percentageWatched).toBe(60);
      expect(lessonProgress.canResume).toBe(true);
    });

    test('should track engagement metrics over time', async () => {
      const studentId = 'student123';
      const engagementData = [
        { date: '2024-01-01', sessionDuration: 45, interactions: 15 },
        { date: '2024-01-02', sessionDuration: 60, interactions: 20 },
        { date: '2024-01-03', sessionDuration: 30, interactions: 10 }
      ];

      for (const data of engagementData) {
        await completionService.recordEngagementMetrics(studentId, mockCourse.id, {
          date: new Date(data.date),
          sessionDuration: data.sessionDuration,
          interactions: data.interactions,
          pagesVisited: 5,
          resourcesAccessed: 3
        });
      }

      const metrics = await completionService.getEngagementAnalytics(studentId, mockCourse.id);

      expect(metrics.averageSessionDuration).toBe(45);
      expect(metrics.totalInteractions).toBe(45);
      expect(metrics.engagementTrend).toBeOneOf(['increasing', 'decreasing', 'stable']);
      expect(metrics.riskScore).toBeDefined(); // Risk of dropping out
    });
  });

  describe('Milestone Achievement', () => {
    test('should detect and award milestone achievements', async () => {
      const studentId = 'student123';
      
      // Complete first module
      await completionService.completeModule(studentId, mockCourse.id, 'module1');
      
      const milestones = await milestoneService.checkMilestones(studentId, mockCourse.id);

      expect(milestones.achieved).toContain('first_module_complete');
      expect(milestones.next).toHaveProperty('half_course_complete');
      
      expect(badgeService.awardBadge).toHaveBeenCalledWith(studentId, {
        type: 'milestone',
        name: 'First Module Complete',
        description: 'Completed your first course module',
        points: 50
      });
    });

    test('should track consecutive learning streaks', async () => {
      const studentId = 'student123';
      
      // Simulate 7 consecutive days of activity
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        
        await completionService.recordDailyActivity(studentId, mockCourse.id, {
          date,
          activitiesCompleted: 2,
          timeSpent: 30
        });
      }

      const streakInfo = await milestoneService.calculateLearningStreak(studentId);

      expect(streakInfo.currentStreak).toBe(7);
      expect(streakInfo.longestStreak).toBe(7);
      expect(streakInfo.milestoneAchieved).toBe('week_streak');
      
      expect(badgeService.awardBadge).toHaveBeenCalledWith(studentId, 
        expect.objectContaining({ name: 'Learning Streak - 7 Days' })
      );
    });

    test('should recognize performance-based achievements', async () => {
      const studentId = 'student123';
      
      // Complete assessments with high scores
      const assessmentResults = [
        { assessmentId: 'quiz1', score: 95, maxScore: 100 },
        { assessmentId: 'project1', score: 190, maxScore: 200 }
      ];

      for (const result of assessmentResults) {
        await completionService.recordAssessmentCompletion(studentId, mockCourse.id, {
          ...result,
          timeSpent: 60,
          attempt: 1,
          answers: {},
          completedAt: new Date()
        });
      }

      const achievements = await milestoneService.evaluatePerformanceAchievements(
        studentId, 
        mockCourse.id
      );

      expect(achievements).toContain('high_achiever'); // >90% average
      expect(achievements).toContain('first_try_success'); // All passed on first attempt
      
      expect(badgeService.awardBadge).toHaveBeenCalledWith(studentId, 
        expect.objectContaining({ name: 'High Achiever' })
      );
    });

    test('should award collaborative learning milestones', async () => {
      const studentId = 'student123';
      
      // Record forum participation
      await completionService.recordForumActivity(studentId, mockCourse.id, {
        posts: 8, // Exceeds requirement of 5
        replies: 12,
        helpfulVotes: 15,
        peerReviews: 3 // Exceeds requirement of 2
      });

      const socialMilestones = await milestoneService.evaluateSocialMilestones(
        studentId,
        mockCourse.id
      );

      expect(socialMilestones).toContain('active_participant');
      expect(socialMilestones).toContain('helpful_peer');
      
      expect(badgeService.awardBadge).toHaveBeenCalledWith(studentId, 
        expect.objectContaining({ name: 'Community Contributor' })
      );
    });
  });

  describe('Completion Verification', () => {
    test('should verify all completion requirements are met', async () => {
      const studentId = 'student123';
      const mockProgress: StudentProgress = {
        studentId,
        courseId: mockCourse.id,
        enrollmentDate: new Date('2024-01-01'),
        lastActivityDate: new Date('2024-02-01'),
        completedLessons: ['lesson1-1', 'lesson1-2', 'lesson2-1'],
        completedAssessments: {
          'quiz1': { score: 85, attempts: 1, completedAt: new Date(), timeSpent: 25 },
          'project1': { score: 160, attempts: 1, completedAt: new Date(), timeSpent: 120 }
        },
        moduleProgress: {
          'module1': { completion: 1, grade: 85, timeSpent: 120, status: 'completed' },
          'module2': { completion: 1, grade: 80, timeSpent: 180, status: 'completed' }
        },
        overallProgress: {
          completion: 1,
          grade: 82,
          timeSpent: 300, // 5 hours
          milestones: ['first_module_complete', 'half_course_complete']
        },
        engagementMetrics: {
          loginFrequency: 4,
          sessionDuration: 45,
          contentInteraction: 0.85,
          forumParticipation: 7
        }
      };

      const verification = await verificationService.verifyCompletion(mockCourse, mockProgress);

      expect(verification.isComplete).toBe(true);
      expect(verification.requirementsMet.minimumGrade).toBe(true);
      expect(verification.requirementsMet.requiredModules).toBe(true);
      expect(verification.requirementsMet.minimumTimeSpent).toBe(true);
      expect(verification.requirementsMet.requiredAssessments).toBe(true);
      expect(verification.overallGrade).toBe(82);
    });

    test('should identify incomplete requirements', async () => {
      const incompleteProgress: StudentProgress = {
        studentId: 'student123',
        courseId: mockCourse.id,
        enrollmentDate: new Date('2024-01-01'),
        lastActivityDate: new Date('2024-02-01'),
        completedLessons: ['lesson1-1'], // Missing lesson1-2, lesson2-1
        completedAssessments: {
          'quiz1': { score: 65, attempts: 2, completedAt: new Date(), timeSpent: 25 } // Below passing
          // Missing project1
        },
        moduleProgress: {
          'module1': { completion: 0.5, grade: 65, timeSpent: 60, status: 'in_progress' },
          'module2': { completion: 0, grade: 0, timeSpent: 0, status: 'not_started' }
        },
        overallProgress: {
          completion: 0.25,
          grade: 65,
          timeSpent: 120, // 2 hours - below 4 hour requirement
          milestones: []
        },
        engagementMetrics: {
          loginFrequency: 2,
          sessionDuration: 30,
          contentInteraction: 0.6,
          forumParticipation: 2 // Below requirement
        }
      };

      const verification = await verificationService.verifyCompletion(mockCourse, incompleteProgress);

      expect(verification.isComplete).toBe(false);
      expect(verification.requirementsMet.minimumGrade).toBe(false);
      expect(verification.requirementsMet.requiredModules).toBe(false);
      expect(verification.requirementsMet.minimumTimeSpent).toBe(false);
      expect(verification.requirementsMet.requiredAssessments).toBe(false);
      
      expect(verification.missingRequirements).toContain('Complete module2');
      expect(verification.missingRequirements).toContain('Retake quiz1 (need 70%, got 65%)');
      expect(verification.missingRequirements).toContain('Complete project1');
      expect(verification.missingRequirements).toContain('Spend 2 more hours studying');
    });

    test('should handle grace periods and extensions', async () => {
      const courseWithDeadline = {
        ...mockCourse,
        certification: {
          ...mockCourse.certification,
          requirements: {
            ...mockCourse.certification.requirements,
            timeFrame: 30 // 30 days
          }
        }
      };

      const lateProgress: StudentProgress = {
        studentId: 'student123',
        courseId: mockCourse.id,
        enrollmentDate: new Date('2024-01-01'),
        lastActivityDate: new Date('2024-02-15'), // 45 days later, past deadline
        completedLessons: ['lesson1-1', 'lesson1-2', 'lesson2-1'],
        completedAssessments: {
          'quiz1': { score: 85, attempts: 1, completedAt: new Date('2024-02-15'), timeSpent: 25 },
          'project1': { score: 160, attempts: 1, completedAt: new Date('2024-02-15'), timeSpent: 120 }
        },
        moduleProgress: {
          'module1': { completion: 1, grade: 85, timeSpent: 120, status: 'completed' },
          'module2': { completion: 1, grade: 80, timeSpent: 180, status: 'completed' }
        },
        overallProgress: {
          completion: 1,
          grade: 82,
          timeSpent: 300,
          milestones: []
        },
        engagementMetrics: {
          loginFrequency: 3,
          sessionDuration: 45,
          contentInteraction: 0.85,
          forumParticipation: 5
        }
      };

      const verification = await verificationService.verifyCompletion(
        courseWithDeadline,
        lateProgress,
        { allowGracePeriod: true, gracePeriodDays: 7 }
      );

      expect(verification.isComplete).toBe(false);
      expect(verification.requirementsMet.timeFrame).toBe(false);
      expect(verification.gracePeriodExpired).toBe(true);
      expect(verification.canRequestExtension).toBe(true);
    });
  });

  describe('Certificate Generation', () => {
    test('should generate certificate for completed course', async () => {
      const completionData: CompletionResult = {
        isCompleted: true,
        completionDate: new Date('2024-02-01'),
        finalGrade: 87,
        certificateId: '',
        achievements: ['first_module_complete', 'high_achiever'],
        timeToCompletion: 31, // days
        completionPath: {
          modulesCompleted: ['module1', 'module2'],
          assessmentScores: { 'quiz1': 85, 'project1': 180 },
          milestones: [
            { id: 'milestone1', achievedAt: new Date(), description: 'First module completed' }
          ]
        },
        postCompletionRecommendations: []
      };

      const certificate = await certificationService.generateCertificate({
        studentId: 'student123',
        course: mockCourse,
        completionData,
        template: 'jung-fundamentals-certificate'
      });

      expect(certificate.certificateId).toMatch(/^cert-[a-zA-Z0-9]{12}$/);
      expect(certificate.verificationUrl).toContain(certificate.certificateId);
      expect(certificate.digitalSignature).toBeDefined();
      expect(certificate.blockchainHash).toBeDefined();
      expect(certificate.issuedDate).toEqual(completionData.completionDate);
      expect(certificate.grade).toBe('87%');
      expect(certificate.studentName).toBeDefined();
      expect(certificate.courseName).toBe(mockCourse.title);
    });

    test('should create blockchain verification record', async () => {
      const certificateData = {
        certificateId: 'cert-abc123def456',
        studentId: 'student123',
        courseId: mockCourse.id,
        completionDate: new Date(),
        finalGrade: 87,
        issuerSignature: 'digital_signature_hash'
      };

      const blockchainRecord = await certificationService.createBlockchainRecord(certificateData);

      expect(blockchainRecord.transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(blockchainRecord.blockNumber).toBeGreaterThan(0);
      expect(blockchainRecord.verified).toBe(true);
      expect(blockchainRecord.immutable).toBe(true);
      expect(blockchainRecord.publicVerificationUrl).toContain('blockchain-verify');
    });

    test('should handle certificate template customization', async () => {
      const customTemplate = {
        template: 'jung-advanced-certificate',
        customizations: {
          logoUrl: 'https://example.com/custom-logo.png',
          signatureText: 'Advanced Certification in Jungian Psychology',
          additionalText: 'With distinction for exceptional performance',
          colorScheme: 'gold'
        }
      };

      const certificate = await certificationService.generateCertificate({
        studentId: 'student123',
        course: mockCourse,
        completionData: {
          isCompleted: true,
          completionDate: new Date(),
          finalGrade: 95,
          certificateId: '',
          achievements: ['high_achiever', 'perfectionist'],
          timeToCompletion: 25,
          completionPath: { modulesCompleted: [], assessmentScores: {}, milestones: [] },
          postCompletionRecommendations: []
        },
        template: customTemplate.template,
        customizations: customTemplate.customizations
      });

      expect(certificate.templateUsed).toBe('jung-advanced-certificate');
      expect(certificate.customizations).toEqual(customTemplate.customizations);
      expect(certificate.distinction).toBe('With distinction for exceptional performance');
    });
  });

  describe('Post-Completion Workflows', () => {
    test('should trigger post-completion recommendations and next steps', async () => {
      const completionData: CompletionResult = {
        isCompleted: true,
        completionDate: new Date(),
        finalGrade: 82,
        certificateId: 'cert-abc123',
        achievements: ['first_module_complete', 'active_participant'],
        timeToCompletion: 35,
        completionPath: {
          modulesCompleted: ['module1', 'module2'],
          assessmentScores: { 'quiz1': 85, 'project1': 160 },
          milestones: []
        },
        postCompletionRecommendations: []
      };

      const nextSteps = await postCompletionService.generateNextSteps({
        studentId: 'student123',
        completedCourse: mockCourse,
        completionData,
        studentInterests: ['advanced-jung', 'dream-analysis', 'therapeutic-applications']
      });

      expect(nextSteps.recommendedCourses).toHaveLength(3);
      expect(nextSteps.recommendedCourses[0].title).toContain('Advanced');
      expect(nextSteps.skills).toContain('dream analysis');
      expect(nextSteps.careerPaths).toBeDefined();
      expect(nextSteps.communityRecommendations).toBeDefined();
    });

    test('should send completion celebration and follow-up communications', async () => {
      const studentId = 'student123';
      
      await postCompletionService.triggerCompletionCelebration({
        studentId,
        course: mockCourse,
        completionData: {
          isCompleted: true,
          completionDate: new Date(),
          finalGrade: 88,
          certificateId: 'cert-xyz789',
          achievements: ['high_achiever', 'community_contributor'],
          timeToCompletion: 28,
          completionPath: { modulesCompleted: [], assessmentScores: {}, milestones: [] },
          postCompletionRecommendations: []
        }
      });

      expect(notificationService.sendEmail).toHaveBeenCalledWith({
        to: expect.any(String),
        template: 'course_completion_celebration',
        data: expect.objectContaining({
          courseName: mockCourse.title,
          finalGrade: 88,
          certificateId: 'cert-xyz789'
        })
      });

      expect(notificationService.scheduleEmail).toHaveBeenCalledWith({
        to: expect.any(String),
        template: 'post_completion_survey',
        scheduleDate: expect.any(Date),
        data: expect.any(Object)
      });
    });

    test('should update learner profile with completed competencies', async () => {
      const competenciesGained = [
        { skill: 'jungian-theory', level: 'intermediate', evidence: 'quiz1:85,project1:80' },
        { skill: 'archetype-analysis', level: 'beginner', evidence: 'project1:80' },
        { skill: 'critical-thinking', level: 'intermediate', evidence: 'overall:82' }
      ];

      await postCompletionService.updateLearnerCompetencies({
        studentId: 'student123',
        courseId: mockCourse.id,
        competencies: competenciesGained
      });

      expect(analyticsService.updateProfile).toHaveBeenCalledWith('student123', {
        completedCourses: expect.arrayContaining([mockCourse.id]),
        competencies: expect.arrayContaining(competenciesGained),
        lastCompletionDate: expect.any(Date)
      });
    });

    test('should provide performance analytics and insights', async () => {
      const performanceData = {
        studentId: 'student123',
        courseId: mockCourse.id,
        timeToCompletion: 32,
        finalGrade: 84,
        engagementMetrics: { averageSessionTime: 42, totalSessions: 15 },
        strugglePoints: ['complex-theory', 'project-deadlines'],
        strengths: ['visual-learning', 'peer-interaction']
      };

      const analytics = await postCompletionService.generateCompletionAnalytics(performanceData);

      expect(analytics.performanceComparison.percentile).toBeDefined();
      expect(analytics.learningPatterns.optimalStudyTimes).toBeDefined();
      expect(analytics.recommendations.futureLearning).toBeDefined();
      expect(analytics.strengths).toEqual(performanceData.strengths);
      expect(analytics.areasForImprovement).toEqual(performanceData.strugglePoints);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle incomplete course data gracefully', async () => {
      const incompleteCourse = {
        ...mockCourse,
        modules: [] // No modules defined
      };

      await expect(
        completionService.getStudentProgress('student123', incompleteCourse.id)
      ).rejects.toThrow('Course has no modules defined');
    });

    test('should handle concurrent completion attempts', async () => {
      const studentId = 'student123';
      const courseId = mockCourse.id;

      // Simulate concurrent completion checks
      const completionPromises = Array.from({ length: 5 }, () => 
        completionService.checkAndProcessCompletion(studentId, courseId)
      );

      const results = await Promise.allSettled(completionPromises);
      const successful = results.filter(r => r.status === 'fulfilled');

      expect(successful).toHaveLength(1); // Only one should succeed
      expect(results.some(r => 
        r.status === 'rejected' && 
        r.reason.message.includes('completion already in progress')
      )).toBe(true);
    });

    test('should handle certificate generation failures', async () => {
      // Mock certificate service failure
      jest.spyOn(certificationService, 'generateCertificate')
        .mockRejectedValue(new Error('Certificate template not found'));

      const result = await completionService.completeStudentCourse('student123', mockCourse.id);

      expect(result.isCompleted).toBe(true);
      expect(result.certificateId).toBeUndefined();
      expect(result.errors).toContain('Certificate generation failed');
      
      // Should still record completion even if certificate fails
      expect(analyticsService.trackEvent).toHaveBeenCalledWith('course_completed', 
        expect.objectContaining({ studentId: 'student123' })
      );
    });

    test('should validate completion data integrity', async () => {
      const suspiciousProgress: StudentProgress = {
        studentId: 'student123',
        courseId: mockCourse.id,
        enrollmentDate: new Date('2024-01-01'),
        lastActivityDate: new Date('2024-01-01T00:05:00Z'), // 5 minutes after enrollment
        completedLessons: ['lesson1-1', 'lesson1-2', 'lesson2-1'], // All lessons
        completedAssessments: {
          'quiz1': { score: 100, attempts: 1, completedAt: new Date('2024-01-01T00:03:00Z'), timeSpent: 1 },
          'project1': { score: 200, attempts: 1, completedAt: new Date('2024-01-01T00:04:00Z'), timeSpent: 1 }
        },
        moduleProgress: {
          'module1': { completion: 1, grade: 100, timeSpent: 2, status: 'completed' },
          'module2': { completion: 1, grade: 100, timeSpent: 2, status: 'completed' }
        },
        overallProgress: {
          completion: 1,
          grade: 100,
          timeSpent: 4, // Impossibly fast completion
          milestones: []
        },
        engagementMetrics: {
          loginFrequency: 7,
          sessionDuration: 1,
          contentInteraction: 0,
          forumParticipation: 0
        }
      };

      const validation = await verificationService.validateCompletionIntegrity(
        mockCourse,
        suspiciousProgress
      );

      expect(validation.isValid).toBe(false);
      expect(validation.suspiciousActivities).toContain('unrealistic_completion_speed');
      expect(validation.suspiciousActivities).toContain('minimal_engagement');
      expect(validation.requiresReview).toBe(true);
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.restoreAllMocks();
  });
});

// Helper interfaces for testing
interface CompletionCheckOptions {
  allowGracePeriod?: boolean;
  gracePeriodDays?: number;
}

interface VerificationResult {
  isComplete: boolean;
  requirementsMet: Record<string, boolean>;
  missingRequirements: string[];
  overallGrade: number;
  gracePeriodExpired?: boolean;
  canRequestExtension?: boolean;
}

export { CompletionCheckOptions, VerificationResult };