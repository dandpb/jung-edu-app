/**
 * Educational Workflow Examples
 * Ready-to-use workflow templates for educational scenarios
 */

import { Workflow } from '../src/types/workflow';

// 1. Student Onboarding Workflow
export const studentOnboardingWorkflow: Workflow = {
  id: 'student-onboarding-v1',
  name: 'Complete Student Onboarding',
  description: 'Automated onboarding process for new students',
  type: 'educational',
  nodes: [
    {
      id: 'validate-enrollment',
      type: 'task',
      action: 'validateEnrollment',
      config: {
        required: ['studentId', 'email', 'courseIds'],
        validatePrerequisites: true
      }
    },
    {
      id: 'create-profile',
      type: 'task',
      action: 'createStudentProfile',
      config: {
        includePhoto: true,
        learningStyleAssessment: true
      }
    },
    {
      id: 'send-welcome',
      type: 'task',
      action: 'sendWelcomeEmail',
      config: {
        template: 'student-welcome',
        includeCalendar: true,
        includeResources: true
      }
    },
    {
      id: 'initial-assessment',
      type: 'task',
      action: 'scheduleInitialAssessment',
      config: {
        type: 'placement',
        duration: 45,
        subjects: ['math', 'english', 'science']
      }
    },
    {
      id: 'check-assessment',
      type: 'condition',
      condition: 'assessmentScore >= 70',
      truePath: 'advanced-track',
      falsePath: 'standard-track'
    },
    {
      id: 'advanced-track',
      type: 'parallel',
      children: [
        {
          id: 'enroll-advanced',
          type: 'task',
          action: 'enrollInAdvancedCourses'
        },
        {
          id: 'assign-mentor',
          type: 'task',
          action: 'assignAdvancedMentor'
        },
        {
          id: 'schedule-workshops',
          type: 'task',
          action: 'scheduleEnrichmentWorkshops'
        }
      ]
    },
    {
      id: 'standard-track',
      type: 'parallel',
      children: [
        {
          id: 'enroll-standard',
          type: 'task',
          action: 'enrollInStandardCourses'
        },
        {
          id: 'assign-tutor',
          type: 'task',
          action: 'assignPeerTutor'
        },
        {
          id: 'schedule-support',
          type: 'task',
          action: 'scheduleStudySupport'
        }
      ]
    },
    {
      id: 'orientation',
      type: 'task',
      action: 'scheduleOrientation',
      config: {
        type: 'virtual',
        duration: 120,
        mandatory: true
      }
    },
    {
      id: 'complete-onboarding',
      type: 'task',
      action: 'markOnboardingComplete',
      config: {
        generateCertificate: true,
        notifyInstructors: true
      }
    }
  ],
  edges: [
    { from: 'validate-enrollment', to: 'create-profile' },
    { from: 'create-profile', to: 'send-welcome' },
    { from: 'send-welcome', to: 'initial-assessment' },
    { from: 'initial-assessment', to: 'check-assessment' },
    { from: 'check-assessment', to: 'advanced-track', condition: 'true' },
    { from: 'check-assessment', to: 'standard-track', condition: 'false' },
    { from: 'advanced-track', to: 'orientation' },
    { from: 'standard-track', to: 'orientation' },
    { from: 'orientation', to: 'complete-onboarding' }
  ]
};

// 2. Automated Quiz Grading Workflow
export const quizGradingWorkflow: Workflow = {
  id: 'quiz-grading-v1',
  name: 'Automated Quiz Processing',
  description: 'AI-powered quiz grading with feedback generation',
  type: 'assessment',
  nodes: [
    {
      id: 'receive-submission',
      type: 'task',
      action: 'receiveQuizSubmission',
      config: {
        validateTimestamp: true,
        checkDeadline: true
      }
    },
    {
      id: 'plagiarism-check',
      type: 'task',
      action: 'runPlagiarismCheck',
      config: {
        threshold: 0.15,
        checkInternal: true,
        checkExternal: true
      }
    },
    {
      id: 'check-plagiarism-result',
      type: 'condition',
      condition: 'plagiarismScore < 0.15',
      truePath: 'auto-grade',
      falsePath: 'flag-review'
    },
    {
      id: 'auto-grade',
      type: 'task',
      action: 'performAutoGrading',
      config: {
        useAI: true,
        rubric: 'standard-quiz-rubric',
        partialCredit: true
      }
    },
    {
      id: 'confidence-check',
      type: 'condition',
      condition: 'gradingConfidence >= 0.85',
      truePath: 'generate-feedback',
      falsePath: 'manual-review-queue'
    },
    {
      id: 'flag-review',
      type: 'task',
      action: 'flagForManualReview',
      config: {
        reason: 'plagiarism-detected',
        priority: 'high',
        notifyInstructor: true
      }
    },
    {
      id: 'manual-review-queue',
      type: 'task',
      action: 'addToManualReviewQueue',
      config: {
        reason: 'low-confidence',
        priority: 'medium'
      }
    },
    {
      id: 'generate-feedback',
      type: 'task',
      action: 'generatePersonalizedFeedback',
      config: {
        useAI: true,
        includeCorrectAnswers: true,
        includeLearningResources: true,
        language: 'encouraging'
      }
    },
    {
      id: 'calculate-analytics',
      type: 'task',
      action: 'calculateQuizAnalytics',
      config: {
        trackTimePerQuestion: true,
        identifyWeakAreas: true,
        compareToClassAverage: true
      }
    },
    {
      id: 'update-gradebook',
      type: 'task',
      action: 'updateGradebook',
      config: {
        includeAnalytics: true,
        calculateRunningAverage: true
      }
    },
    {
      id: 'notify-student',
      type: 'task',
      action: 'sendGradeNotification',
      config: {
        channel: 'email',
        includeFeedback: true,
        includeNextSteps: true
      }
    }
  ],
  edges: [
    { from: 'receive-submission', to: 'plagiarism-check' },
    { from: 'plagiarism-check', to: 'check-plagiarism-result' },
    { from: 'check-plagiarism-result', to: 'auto-grade', condition: 'true' },
    { from: 'check-plagiarism-result', to: 'flag-review', condition: 'false' },
    { from: 'auto-grade', to: 'confidence-check' },
    { from: 'confidence-check', to: 'generate-feedback', condition: 'true' },
    { from: 'confidence-check', to: 'manual-review-queue', condition: 'false' },
    { from: 'generate-feedback', to: 'calculate-analytics' },
    { from: 'calculate-analytics', to: 'update-gradebook' },
    { from: 'update-gradebook', to: 'notify-student' }
  ]
};

// 3. Adaptive Learning Path Workflow
export const adaptiveLearningWorkflow: Workflow = {
  id: 'adaptive-learning-v1',
  name: 'Personalized Learning Path',
  description: 'Dynamically adjusts content based on student performance',
  type: 'educational',
  nodes: [
    {
      id: 'analyze-performance',
      type: 'task',
      action: 'analyzeStudentPerformance',
      config: {
        window: '30-days',
        metrics: ['accuracy', 'speed', 'consistency', 'engagement']
      }
    },
    {
      id: 'identify-learning-style',
      type: 'task',
      action: 'identifyLearningStyle',
      config: {
        methods: ['quiz-patterns', 'content-preferences', 'interaction-data']
      }
    },
    {
      id: 'detect-knowledge-gaps',
      type: 'task',
      action: 'detectKnowledgeGaps',
      config: {
        threshold: 0.7,
        checkPrerequisites: true
      }
    },
    {
      id: 'performance-level',
      type: 'condition',
      condition: 'performanceScore',
      branches: [
        { condition: '>= 90', path: 'advanced-content' },
        { condition: '>= 70', path: 'standard-content' },
        { condition: '< 70', path: 'remedial-content' }
      ]
    },
    {
      id: 'advanced-content',
      type: 'task',
      action: 'generateAdvancedContent',
      config: {
        includeProjects: true,
        includeChallenges: true,
        peerCollaboration: true
      }
    },
    {
      id: 'standard-content',
      type: 'task',
      action: 'generateStandardContent',
      config: {
        balancedDifficulty: true,
        includeExamples: true,
        practiceProblems: true
      }
    },
    {
      id: 'remedial-content',
      type: 'task',
      action: 'generateRemedialContent',
      config: {
        fillGaps: true,
        extraSupport: true,
        stepByStep: true
      }
    },
    {
      id: 'apply-learning-style',
      type: 'task',
      action: 'customizeForLearningStyle',
      config: {
        visual: ['videos', 'infographics', 'diagrams'],
        auditory: ['podcasts', 'discussions', 'lectures'],
        kinesthetic: ['simulations', 'labs', 'projects']
      }
    },
    {
      id: 'schedule-content',
      type: 'task',
      action: 'createPersonalizedSchedule',
      config: {
        spacedRepetition: true,
        optimalTiming: true,
        workloadBalance: true
      }
    },
    {
      id: 'monitor-progress',
      type: 'loop',
      loopType: 'for',
      iterations: 'weeklyCheckIns',
      body: [
        {
          id: 'weekly-assessment',
          type: 'task',
          action: 'conductWeeklyAssessment'
        },
        {
          id: 'adjust-difficulty',
          type: 'task',
          action: 'adjustContentDifficulty'
        },
        {
          id: 'provide-feedback',
          type: 'task',
          action: 'provideProgressFeedback'
        }
      ]
    }
  ]
};

// 4. Course Completion Workflow
export const courseCompletionWorkflow: Workflow = {
  id: 'course-completion-v1',
  name: 'Course Completion Process',
  description: 'Handles end-of-course requirements and certification',
  type: 'educational',
  nodes: [
    {
      id: 'check-requirements',
      type: 'parallel',
      children: [
        {
          id: 'check-attendance',
          type: 'task',
          action: 'verifyAttendanceRequirement',
          config: { minimum: 0.8 }
        },
        {
          id: 'check-assignments',
          type: 'task',
          action: 'verifyAssignmentCompletion',
          config: { minimum: 0.9 }
        },
        {
          id: 'check-exams',
          type: 'task',
          action: 'verifyExamScores',
          config: { passingGrade: 0.7 }
        }
      ]
    },
    {
      id: 'requirements-met',
      type: 'condition',
      condition: 'allRequirementsMet',
      truePath: 'final-assessment',
      falsePath: 'notify-incomplete'
    },
    {
      id: 'notify-incomplete',
      type: 'task',
      action: 'notifyIncompleteRequirements',
      config: {
        provideMakeupOptions: true,
        deadline: '7-days'
      }
    },
    {
      id: 'final-assessment',
      type: 'task',
      action: 'conductFinalAssessment',
      config: {
        type: 'comprehensive',
        duration: 120,
        proctored: true
      }
    },
    {
      id: 'grade-final',
      type: 'task',
      action: 'gradeFinalAssessment',
      config: {
        weight: 0.4,
        curve: 'normal'
      }
    },
    {
      id: 'calculate-final-grade',
      type: 'task',
      action: 'calculateFinalCourseGrade',
      config: {
        weights: {
          assignments: 0.3,
          midterm: 0.2,
          final: 0.4,
          participation: 0.1
        }
      }
    },
    {
      id: 'passed-course',
      type: 'condition',
      condition: 'finalGrade >= passingGrade',
      truePath: 'generate-certificate',
      falsePath: 'offer-retake'
    },
    {
      id: 'generate-certificate',
      type: 'task',
      action: 'generateCourseCertificate',
      config: {
        type: 'verified',
        blockchain: true,
        includeGrade: true,
        includeSkills: true
      }
    },
    {
      id: 'offer-retake',
      type: 'task',
      action: 'offerCourseRetake',
      config: {
        discount: 0.5,
        deadline: '30-days'
      }
    },
    {
      id: 'update-transcript',
      type: 'task',
      action: 'updateOfficialTranscript',
      config: {
        includeCredits: true,
        calculateGPA: true
      }
    },
    {
      id: 'course-feedback',
      type: 'task',
      action: 'collectCourseFeedback',
      config: {
        anonymous: true,
        incentive: 'bonus-points'
      }
    },
    {
      id: 'recommend-next',
      type: 'task',
      action: 'recommendNextCourses',
      config: {
        based: ['performance', 'interests', 'career-path'],
        count: 3
      }
    }
  ]
};

// 5. Virtual Classroom Session Workflow
export const virtualClassroomWorkflow: Workflow = {
  id: 'virtual-classroom-v1',
  name: 'Virtual Classroom Session',
  description: 'Manages live virtual classroom sessions',
  type: 'educational',
  nodes: [
    {
      id: 'schedule-session',
      type: 'task',
      action: 'scheduleVirtualSession',
      config: {
        platform: 'zoom',
        duration: 60,
        recurring: true
      }
    },
    {
      id: 'send-invitations',
      type: 'parallel',
      children: [
        {
          id: 'invite-students',
          type: 'task',
          action: 'sendStudentInvitations',
          config: {
            reminder: '24-hours'
          }
        },
        {
          id: 'invite-guests',
          type: 'task',
          action: 'sendGuestSpeakerInvitation'
        },
        {
          id: 'prepare-materials',
          type: 'task',
          action: 'uploadSessionMaterials'
        }
      ]
    },
    {
      id: 'pre-session',
      type: 'task',
      action: 'runPreSessionChecks',
      config: {
        testAudio: true,
        testVideo: true,
        loadContent: true
      }
    },
    {
      id: 'start-recording',
      type: 'task',
      action: 'startSessionRecording',
      config: {
        quality: 'HD',
        includeTranscript: true
      }
    },
    {
      id: 'take-attendance',
      type: 'task',
      action: 'recordAttendance',
      config: {
        automatic: true,
        gracePeriod: 10
      }
    },
    {
      id: 'monitor-engagement',
      type: 'loop',
      loopType: 'while',
      condition: 'sessionActive',
      body: [
        {
          id: 'track-participation',
          type: 'task',
          action: 'trackStudentParticipation'
        },
        {
          id: 'monitor-chat',
          type: 'task',
          action: 'moderateChatMessages'
        },
        {
          id: 'handle-questions',
          type: 'task',
          action: 'queueStudentQuestions'
        }
      ]
    },
    {
      id: 'end-session',
      type: 'task',
      action: 'endVirtualSession',
      config: {
        saveChat: true,
        savePolls: true
      }
    },
    {
      id: 'post-processing',
      type: 'parallel',
      children: [
        {
          id: 'process-recording',
          type: 'task',
          action: 'processRecording',
          config: {
            generateChapters: true,
            extractHighlights: true
          }
        },
        {
          id: 'generate-transcript',
          type: 'task',
          action: 'generateTranscript',
          config: {
            languages: ['en', 'es', 'fr']
          }
        },
        {
          id: 'analyze-engagement',
          type: 'task',
          action: 'analyzeEngagementMetrics'
        }
      ]
    },
    {
      id: 'distribute-materials',
      type: 'task',
      action: 'distributePostSessionMaterials',
      config: {
        recording: true,
        transcript: true,
        slides: true,
        additionalResources: true
      }
    }
  ]
};

// Helper function to execute workflows
export async function executeEducationalWorkflow(
  workflowService: any,
  workflow: Workflow,
  inputData: Record<string, any>
) {
  try {
    console.log(`🚀 Executing workflow: ${workflow.name}`);
    
    const result = await workflowService.executeWorkflow(
      workflow,
      inputData,
      {
        priority: 'high',
        timeout: 300000 // 5 minutes
      }
    );
    
    console.log(`✅ Workflow completed:`, result);
    return result;
    
  } catch (error) {
    console.error(`❌ Workflow failed:`, error);
    throw error;
  }
}

// Example usage
export const exampleUsage = `
import { createWorkflowService } from './src/WorkflowService';
import { 
  studentOnboardingWorkflow,
  quizGradingWorkflow,
  adaptiveLearningWorkflow,
  executeEducationalWorkflow 
} from './examples/educational-workflows';

// Initialize workflow service
const workflowService = createWorkflowService(config, dependencies);

// Execute student onboarding
await executeEducationalWorkflow(
  workflowService,
  studentOnboardingWorkflow,
  {
    studentId: 'student-123',
    email: 'student@university.edu',
    courseIds: ['CS101', 'MATH201', 'ENG105']
  }
);

// Execute quiz grading
await executeEducationalWorkflow(
  workflowService,
  quizGradingWorkflow,
  {
    submissionId: 'quiz-456',
    studentId: 'student-123',
    answers: [...],
    submittedAt: new Date()
  }
);

// Execute adaptive learning
await executeEducationalWorkflow(
  workflowService,
  adaptiveLearningWorkflow,
  {
    studentId: 'student-123',
    courseId: 'MATH201',
    currentModule: 'calculus-derivatives'
  }
);
`;