/**
 * Mock factories and utilities for workflow system testing
 * Provides comprehensive mocks for workflow definitions, executions, and educational data
 */

import { 
  WorkflowDefinition,
  WorkflowExecution,
  ExecutionStatus,
  WorkflowCategory,
  StateType,
  ActionType,
  TriggerType,
  ExecutionEvent,
  StudentProgressWorkflowData,
  LearningPathWorkflowData,
  AssessmentWorkflowData,
  AdaptiveContentWorkflowData,
  Achievement,
  PerformanceMetrics,
  WorkflowMetrics,
  WorkflowHealth,
  ComponentHealth,
  WorkflowServices,
  AssessmentQuestion
} from '../../types/workflow';

/**
 * Creates a mock workflow definition with sensible defaults
 */
export const createMockWorkflowDefinition = (overrides?: Partial<WorkflowDefinition>): WorkflowDefinition => {
  const baseDefinition: WorkflowDefinition = {
    id: 'mock-workflow-' + Math.random().toString(36).substr(2, 9),
    name: 'Mock Workflow',
    description: 'A mock workflow for testing purposes',
    version: '1.0.0',
    category: 'learning_path',
    trigger: {
      type: 'event',
      event: 'test.event',
      conditions: [],
      immediate: false,
      enabled: true
    },
    states: [
      {
        id: 'start',
        name: 'Start State',
        type: 'task',
        isInitial: true,
        isFinal: false,
        actions: [
          {
            id: 'start-action',
            type: 'execute_plugin',
            name: 'Initialize Workflow',
            plugin: 'test-plugin',
            config: { testParam: 'value' }
          }
        ]
      },
      {
        id: 'process',
        name: 'Process State',
        type: 'task',
        isInitial: false,
        isFinal: false,
        actions: [
          {
            id: 'process-action',
            type: 'execute_plugin',
            name: 'Process Data',
            plugin: 'processing-plugin',
            config: { processType: 'test' }
          }
        ]
      },
      {
        id: 'end',
        name: 'End State',
        type: 'end',
        isInitial: false,
        isFinal: true,
        actions: []
      }
    ],
    transitions: [
      {
        id: 'start-to-process',
        from: 'start',
        to: 'process',
        priority: 1
      },
      {
        id: 'process-to-end',
        from: 'process',
        to: 'end',
        priority: 1
      }
    ],
    variables: [
      {
        name: 'testVariable',
        type: 'string',
        required: true,
        description: 'Test variable for workflow'
      }
    ],
    metadata: {
      tags: ['test', 'mock'],
      author: 'test-user',
      dependencies: []
    },
    created_at: new Date(),
    updated_at: new Date(),
    created_by: 'test-user',
    is_active: true
  };

  return { ...baseDefinition, ...overrides };
};

/**
 * Creates a mock workflow execution with sensible defaults
 */
export const createMockWorkflowExecution = (overrides?: Partial<WorkflowExecution>): WorkflowExecution => {
  const executionId = 'mock-exec-' + Math.random().toString(36).substr(2, 9);
  const now = new Date();
  const startTime = new Date(now.getTime() - Math.random() * 3600000); // Random start time within last hour

  const baseExecution: WorkflowExecution = {
    id: executionId,
    workflow_id: 'mock-workflow-123',
    user_id: 'test-user-1',
    status: 'running',
    current_state: 'process',
    variables: {
      testVariable: 'test-value',
      progress: Math.floor(Math.random() * 100),
      userId: 'test-user-1'
    },
    input_data: { testInput: 'value' },
    execution_history: [
      {
        id: 'event-1',
        execution_id: executionId,
        event_type: 'workflow.started',
        event_data: { initialState: 'start' },
        timestamp: startTime
      },
      {
        id: 'event-2',
        execution_id: executionId,
        event_type: 'state.entered',
        event_data: { state: 'process' },
        timestamp: new Date(startTime.getTime() + 30000)
      }
    ],
    retry_count: 0,
    started_at: startTime,
    created_at: startTime,
    updated_at: new Date(startTime.getTime() + 60000)
  };

  return { ...baseExecution, ...overrides };
};

/**
 * Creates Jung-specific student progress workflow data
 */
export const createMockStudentProgressData = (overrides?: Partial<StudentProgressWorkflowData>): StudentProgressWorkflowData => {
  const jungianSections = [
    'introduction',
    'collective-unconscious',
    'archetypes-overview',
    'shadow-work',
    'anima-animus',
    'individuation-process',
    'active-imagination',
    'dream-analysis'
  ];

  const progress = Math.floor(Math.random() * 100);
  const completedCount = Math.floor((progress / 100) * jungianSections.length);
  const completedSections = jungianSections.slice(0, completedCount);
  const currentSection = completedCount < jungianSections.length ? jungianSections[completedCount] : undefined;

  const baseData: StudentProgressWorkflowData = {
    userId: 'student-' + Math.random().toString(36).substr(2, 6),
    moduleId: 'analytical-psychology-' + Math.floor(Math.random() * 10 + 1).toString().padStart(3, '0'),
    progress,
    timeSpent: Math.floor(Math.random() * 7200) + 300, // 5 minutes to 2 hours
    completedSections,
    currentSection,
    achievements: createMockAchievements(Math.floor(progress / 25)),
    performanceMetrics: {
      accuracy: 0.6 + Math.random() * 0.4, // 60-100%
      speed: 0.5 + Math.random() * 0.5, // 50-100%
      consistency: 0.7 + Math.random() * 0.3, // 70-100%
      engagement: 0.8 + Math.random() * 0.2, // 80-100%
      retention: 0.6 + Math.random() * 0.4, // 60-100%
      difficulty_preference: Math.random() // 0-100%
    }
  };

  return { ...baseData, ...overrides };
};

/**
 * Creates mock learning path workflow data
 */
export const createMockLearningPathData = (overrides?: Partial<LearningPathWorkflowData>): LearningPathWorkflowData => {
  const jungianModules = [
    'psychology-foundations',
    'freud-vs-jung',
    'collective-unconscious-intro',
    'archetypes-deep-dive',
    'shadow-work-practice',
    'anima-animus-integration',
    'individuation-journey',
    'active-imagination-techniques',
    'dream-analysis-methods',
    'therapeutic-applications'
  ];

  const completedCount = Math.floor(Math.random() * 6) + 1;
  const completedModules = jungianModules.slice(0, completedCount);
  const currentModule = completedCount < jungianModules.length ? jungianModules[completedCount] : jungianModules[jungianModules.length - 1];
  const recommendedModules = jungianModules.slice(completedCount + 1, completedCount + 3);

  const baseData: LearningPathWorkflowData = {
    userId: 'learner-' + Math.random().toString(36).substr(2, 6),
    pathId: 'analytical-psychology-mastery',
    currentModule,
    completedModules,
    recommendedModules,
    adaptationTriggers: [
      {
        type: 'performance',
        condition: 'accuracy < 0.7',
        threshold: 0.7,
        action: { type: 'adjust_difficulty', parameters: { adjustment: -0.2 } }
      },
      {
        type: 'time',
        condition: 'timeSpent > 3600',
        threshold: 3600,
        action: { type: 'suggest_review', parameters: { topics: ['key-concepts'] } }
      }
    ],
    personalizations: [
      {
        aspect: 'content_type',
        value: Math.random() > 0.5 ? 'visual' : 'textual',
        confidence: 0.7 + Math.random() * 0.3,
        source: 'inferred'
      },
      {
        aspect: 'difficulty',
        value: Math.random() > 0.5 ? 'moderate' : 'challenging',
        confidence: 0.8 + Math.random() * 0.2,
        source: 'explicit'
      }
    ]
  };

  return { ...baseData, ...overrides };
};

/**
 * Creates mock assessment workflow data
 */
export const createMockAssessmentData = (overrides?: Partial<AssessmentWorkflowData>): AssessmentWorkflowData => {
  const jungianQuestions: AssessmentQuestion[] = [
    {
      id: 'q1',
      type: 'multiple-choice' as const,
      question: 'What is the collective unconscious according to Jung?',
      options: [
        { id: 'a', text: 'Personal repressed memories', isCorrect: false },
        { id: 'b', text: 'Shared unconscious content across humanity', isCorrect: true },
        { id: 'c', text: 'Conscious thoughts and feelings', isCorrect: false },
        { id: 'd', text: 'Individual behavioral patterns', isCorrect: false }
      ],
      correctAnswer: 'b',
      points: 10,
      difficulty: 'intermediate',
      explanation: 'The collective unconscious contains universal patterns and images called archetypes.'
    },
    {
      id: 'q2',
      type: 'true-false' as const,
      question: 'The Shadow represents the positive aspects of personality.',
      options: [
        { id: 'true', text: 'True', isCorrect: false },
        { id: 'false', text: 'False', isCorrect: true }
      ],
      correctAnswer: 'false',
      points: 5,
      difficulty: 'beginner',
      explanation: 'The Shadow represents the hidden, repressed, or denied aspects of the personality.'
    },
    {
      id: 'q3',
      type: 'multiple-choice' as const,
      question: 'Which archetype represents the idealized opposite-sex image?',
      options: [
        { id: 'a', text: 'Shadow', isCorrect: false },
        { id: 'b', text: 'Persona', isCorrect: false },
        { id: 'c', text: 'Anima/Animus', isCorrect: true },
        { id: 'd', text: 'Self', isCorrect: false }
      ],
      correctAnswer: 'c',
      points: 15,
      difficulty: 'advanced',
      explanation: 'The Anima (in men) and Animus (in women) represent the contrasexual aspect of the psyche.'
    }
  ];

  const currentQuestion = Math.floor(Math.random() * jungianQuestions.length);
  const answers = jungianQuestions.slice(0, currentQuestion).map((q, index) => ({
    questionId: q.id,
    answer: q.options[Math.floor(Math.random() * q.options.length)].id,
    isCorrect: Math.random() > 0.3, // 70% correct rate
    score: Math.random() > 0.3 ? q.points : 0,
    timeSpent: 20000 + Math.random() * 60000, // 20-80 seconds
    attempts: 1
  }));

  const baseData: AssessmentWorkflowData = {
    userId: 'student-' + Math.random().toString(36).substr(2, 6),
    assessmentId: 'jung-assessment-' + Math.floor(Math.random() * 100),
    sessionId: 'session-' + Date.now(),
    questions: jungianQuestions,
    currentQuestion,
    answers,
    timeLimit: 1800, // 30 minutes
    startTime: new Date(Date.now() - Math.random() * 1200000), // Started up to 20 minutes ago
    settings: {
      shuffleQuestions: Math.random() > 0.5,
      shuffleOptions: Math.random() > 0.5,
      allowRetries: Math.random() > 0.7,
      maxRetries: Math.floor(Math.random() * 3),
      showFeedback: ['immediate', 'after_question', 'after_completion', 'never'][Math.floor(Math.random() * 4)] as any,
      showScore: Math.random() > 0.3,
      allowReview: Math.random() > 0.5,
      proctoring: Math.random() > 0.8
    }
  };

  return { ...baseData, ...overrides };
};

/**
 * Creates mock achievements based on progress level
 */
export const createMockAchievements = (count: number = 3): Achievement[] => {
  const possibleAchievements = [
    {
      id: 'first-steps',
      title: 'First Steps',
      description: 'Started your journey into analytical psychology',
      icon: '👶',
      category: 'progress' as const,
      points: 50,
      rarity: 'common' as const,
      requirements: [{ type: 'complete_modules' as const, value: 1, operator: '>=' as const }]
    },
    {
      id: 'shadow-explorer',
      title: 'Shadow Explorer',
      description: 'Began exploring the shadow archetype',
      icon: '🌑',
      category: 'knowledge' as const,
      points: 100,
      rarity: 'common' as const,
      requirements: [{ type: 'complete_modules' as const, value: 2, operator: '>=' as const }]
    },
    {
      id: 'archetype-student',
      title: 'Archetype Student',
      description: 'Demonstrated understanding of major archetypes',
      icon: '🎭',
      category: 'knowledge' as const,
      points: 200,
      rarity: 'rare' as const,
      requirements: [{ type: 'quiz_score' as const, value: 80, operator: '>=' as const }]
    },
    {
      id: 'consistent-learner',
      title: 'Consistent Learner',
      description: 'Maintained regular study habits',
      icon: '📅',
      category: 'engagement' as const,
      points: 150,
      rarity: 'common' as const,
      requirements: [{ type: 'consecutive_days' as const, value: 7, operator: '>=' as const }]
    },
    {
      id: 'deep-thinker',
      title: 'Deep Thinker',
      description: 'Spent significant time in reflection',
      icon: '🧠',
      category: 'engagement' as const,
      points: 250,
      rarity: 'rare' as const,
      requirements: [{ type: 'time_spent' as const, value: 7200, operator: '>=' as const }]
    },
    {
      id: 'individuation-seeker',
      title: 'Individuation Seeker',
      description: 'Advanced to studying the individuation process',
      icon: '🦋',
      category: 'mastery' as const,
      points: 300,
      rarity: 'epic' as const,
      requirements: [{ type: 'complete_modules' as const, value: 5, operator: '>=' as const }]
    },
    {
      id: 'jungian-scholar',
      title: 'Jungian Scholar',
      description: 'Achieved comprehensive understanding of analytical psychology',
      icon: '🎓',
      category: 'mastery' as const,
      points: 500,
      rarity: 'legendary' as const,
      requirements: [{ type: 'complete_modules' as const, value: 8, operator: '>=' as const }]
    }
  ];

  return possibleAchievements.slice(0, Math.min(count, possibleAchievements.length)).map(achievement => ({
    ...achievement,
    unlockedAt: new Date(Date.now() - Math.random() * 86400000 * 7) // Random time in last week
  }));
};

/**
 * Creates mock workflow metrics
 */
export const createMockWorkflowMetrics = (overrides?: Partial<WorkflowMetrics>): WorkflowMetrics => {
  const total = 100 + Math.floor(Math.random() * 900); // 100-1000 executions
  const successful = Math.floor(total * (0.7 + Math.random() * 0.25)); // 70-95% success rate
  const failed = Math.floor(total * Math.random() * 0.15); // 0-15% failure rate
  const remaining = total - successful - failed;

  const baseMetrics: WorkflowMetrics = {
    totalExecutions: total,
    successfulExecutions: successful,
    failedExecutions: failed,
    averageExecutionTime: 300 + Math.random() * 2700, // 5 minutes to 50 minutes
    averageWaitTime: 10 + Math.random() * 290, // 10 seconds to 5 minutes
    activeExecutions: Math.floor(Math.random() * 20),
    queuedExecutions: Math.floor(Math.random() * 10),
    errorRate: failed / total
  };

  return { ...baseMetrics, ...overrides };
};

/**
 * Creates mock workflow health status
 */
export const createMockWorkflowHealth = (overrides?: Partial<WorkflowHealth>): WorkflowHealth => {
  const components = [
    'workflow-engine',
    'state-manager', 
    'plugin-system',
    'notification-service',
    'database-connection',
    'cache-service',
    'auth-service'
  ];

  const componentHealth: ComponentHealth[] = components.map(component => ({
    component,
    status: Math.random() > 0.1 ? 'healthy' : 'unhealthy' as 'healthy' | 'unhealthy', // 90% healthy
    latency: 50 + Math.random() * 200, // 50-250ms
    error: Math.random() > 0.9 ? 'Connection timeout' : undefined
  }));

  const allHealthy = componentHealth.every(c => c.status === 'healthy');
  const overallStatus = allHealthy ? 'healthy' : 
                       componentHealth.filter(c => c.status === 'unhealthy').length < 3 ? 'degraded' : 'unhealthy';

  const baseHealth: WorkflowHealth = {
    status: overallStatus as any,
    components: componentHealth,
    lastCheck: new Date(),
    uptime: 95 + Math.random() * 5 // 95-100% uptime
  };

  return { ...baseHealth, ...overrides };
};

/**
 * Creates mock workflow services for testing
 */
export const createMockWorkflowServices = (): jest.Mocked<WorkflowServices> => {
  return {
    database: {
      query: jest.fn().mockResolvedValue([]),
      transaction: jest.fn().mockImplementation((callback) => callback({})),
      close: jest.fn().mockResolvedValue(undefined)
    },
    notification: {
      send: jest.fn().mockResolvedValue(undefined),
      sendBatch: jest.fn().mockResolvedValue(undefined)
    },
    analytics: {
      track: jest.fn().mockResolvedValue(undefined),
      trackBatch: jest.fn().mockResolvedValue(undefined)
    },
    auth: {
      validateToken: jest.fn().mockResolvedValue(true),
      getUserById: jest.fn().mockResolvedValue({ id: 'test-user', role: 'student' }),
      hasPermission: jest.fn().mockResolvedValue(true)
    },
    ai: {
      generateContent: jest.fn().mockResolvedValue('Generated content'),
      analyzePerformance: jest.fn().mockResolvedValue({
        strengths: ['analytical thinking'],
        weaknesses: ['memorization'],
        recommendations: ['practice more'],
        difficulty_adjustment: 0.1,
        confidence: 0.8
      }),
      recommendContent: jest.fn().mockResolvedValue([
        { id: 'content-1', score: 0.9, reason: 'matches learning style' }
      ])
    },
    cache: {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      clear: jest.fn().mockResolvedValue(undefined)
    }
  };
};

/**
 * Creates a series of mock execution events for timeline testing
 */
export const createMockExecutionHistory = (executionId: string, eventCount: number = 5): ExecutionEvent[] => {
  const eventTypes = [
    'workflow.started',
    'state.entered',
    'action.executed',
    'plugin.completed',
    'milestone.reached',
    'section.completed',
    'assessment.started',
    'assessment.completed',
    'achievement.unlocked',
    'workflow.completed',
    'workflow.failed',
    'workflow.paused',
    'workflow.resumed'
  ];

  const events: ExecutionEvent[] = [];
  const startTime = new Date(Date.now() - eventCount * 300000); // Events spread over time

  for (let i = 0; i < eventCount; i++) {
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const eventData: Record<string, any> = {};

    // Add type-specific data
    switch (eventType) {
      case 'state.entered':
        eventData.state = ['start', 'process', 'validate', 'complete'][Math.floor(Math.random() * 4)];
        break;
      case 'section.completed':
        eventData.section = ['introduction', 'theory', 'practice', 'assessment'][Math.floor(Math.random() * 4)];
        eventData.progress = Math.floor(Math.random() * 100);
        break;
      case 'milestone.reached':
        eventData.milestone = ['Foundation', 'Intermediate', 'Advanced', 'Mastery'][Math.floor(Math.random() * 4)];
        eventData.progress = 25 * (Math.floor(Math.random() * 4) + 1);
        break;
      case 'achievement.unlocked':
        eventData.achievement = createMockAchievements(1)[0];
        break;
      case 'plugin.completed':
        eventData.plugin = ['student-progress', 'assessment-grader', 'notification-sender'][Math.floor(Math.random() * 3)];
        eventData.duration = 100 + Math.random() * 2000;
        break;
    }

    events.push({
      id: `event-${i + 1}`,
      execution_id: executionId,
      event_type: eventType,
      event_data: eventData,
      timestamp: new Date(startTime.getTime() + i * 300000), // 5 minutes apart
      duration_ms: Math.floor(100 + Math.random() * 5000)
    });
  }

  return events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
};

/**
 * Creates multiple mock executions for testing dashboards and lists
 */
export const createMockExecutionBatch = (count: number = 10): WorkflowExecution[] => {
  const statuses: ExecutionStatus[] = ['pending', 'running', 'waiting', 'paused', 'completed', 'failed', 'cancelled'];
  const workflowTypes = ['student_progress', 'learning_path', 'assessment', 'adaptive_content'];
  
  return Array.from({ length: count }, (_, index) => {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const isCompleted = ['completed', 'failed', 'cancelled'].includes(status);
    
    return createMockWorkflowExecution({
      id: `batch-exec-${index + 1}`,
      status,
      completed_at: isCompleted ? new Date() : undefined,
      variables: {
        ...createMockStudentProgressData(),
        workflowType: workflowTypes[Math.floor(Math.random() * workflowTypes.length)]
      },
      execution_history: createMockExecutionHistory(`batch-exec-${index + 1}`, 3 + Math.floor(Math.random() * 5))
    });
  });
};

/**
 * Educational workflow specific mock factory
 */
export const createEducationalWorkflowDefinition = (category: WorkflowCategory): WorkflowDefinition => {
  const categoryConfigs = {
    'progress_tracking': {
      name: 'Student Progress Tracker',
      description: 'Tracks student progress through Jung psychology modules',
      trigger: { event: 'module.progress_updated' },
      states: [
        { id: 'track', name: 'Track Progress', actions: [{ plugin: 'student-progress' }] },
        { id: 'check_milestones', name: 'Check Milestones', actions: [{ plugin: 'milestone-checker' }] },
        { id: 'update_achievements', name: 'Update Achievements', actions: [{ plugin: 'achievement-manager' }] }
      ]
    },
    'assessment': {
      name: 'Jung Psychology Assessment',
      description: 'Manages comprehensive assessments on Jungian concepts',
      trigger: { event: 'assessment.started' },
      states: [
        { id: 'initialize', name: 'Initialize Assessment', actions: [{ plugin: 'assessment-setup' }] },
        { id: 'present_questions', name: 'Present Questions', actions: [{ plugin: 'question-presenter' }] },
        { id: 'grade_responses', name: 'Grade Responses', actions: [{ plugin: 'jung-grader' }] },
        { id: 'provide_feedback', name: 'Provide Feedback', actions: [{ plugin: 'feedback-generator' }] }
      ]
    },
    'adaptive_learning': {
      name: 'Adaptive Jung Content',
      description: 'Dynamically adapts Jung psychology content based on learner profile',
      trigger: { event: 'content.requested' },
      states: [
        { id: 'analyze_learner', name: 'Analyze Learner Profile', actions: [{ plugin: 'learner-analyzer' }] },
        { id: 'select_content', name: 'Select Content Variant', actions: [{ plugin: 'content-selector' }] },
        { id: 'personalize', name: 'Personalize Content', actions: [{ plugin: 'jung-personalizer' }] },
        { id: 'deliver', name: 'Deliver Content', actions: [{ plugin: 'content-delivery' }] }
      ]
    },
    'learning_path': {
      name: 'Analytical Psychology Learning Path',
      description: 'Guides students through structured Jung psychology curriculum',
      trigger: { event: 'path.enrolled' },
      states: [
        { id: 'assess_prerequisites', name: 'Assess Prerequisites', actions: [{ plugin: 'prerequisite-checker' }] },
        { id: 'recommend_sequence', name: 'Recommend Sequence', actions: [{ plugin: 'sequence-optimizer' }] },
        { id: 'track_progression', name: 'Track Progression', actions: [{ plugin: 'progression-tracker' }] },
        { id: 'adapt_path', name: 'Adapt Path', actions: [{ plugin: 'path-adapter' }] }
      ]
    },
    'approval': {
      name: 'Content Approval Workflow',
      description: 'Manages approval process for Jung psychology content',
      trigger: { event: 'content.submitted' },
      states: [
        { id: 'review', name: 'Content Review', actions: [{ plugin: 'content-reviewer' }] },
        { id: 'approve', name: 'Approve Content', actions: [{ plugin: 'content-approver' }] }
      ]
    },
    'notification': {
      name: 'Notification Service',
      description: 'Manages notifications for Jung psychology learning',
      trigger: { event: 'notification.required' },
      states: [
        { id: 'send', name: 'Send Notification', actions: [{ plugin: 'notification-sender' }] }
      ]
    },
    'analytics': {
      name: 'Analytics Tracker',
      description: 'Tracks analytics for Jung psychology learning',
      trigger: { event: 'analytics.event' },
      states: [
        { id: 'track', name: 'Track Event', actions: [{ plugin: 'analytics-tracker' }] }
      ]
    },
    'content_generation': {
      name: 'Content Generator',
      description: 'Generates Jung psychology content',
      trigger: { event: 'content.generate' },
      states: [
        { id: 'generate', name: 'Generate Content', actions: [{ plugin: 'content-generator' }] }
      ]
    },
    'user_onboarding': {
      name: 'User Onboarding',
      description: 'Onboards new users to Jung psychology platform',
      trigger: { event: 'user.registered' },
      states: [
        { id: 'welcome', name: 'Welcome User', actions: [{ plugin: 'user-welcomer' }] }
      ]
    },
    'certification': {
      name: 'Certification Process',
      description: 'Manages Jung psychology certification',
      trigger: { event: 'certification.requested' },
      states: [
        { id: 'certify', name: 'Certify User', actions: [{ plugin: 'user-certifier' }] }
      ]
    }
  } as const;

  const config = categoryConfigs[category];
  if (!config) {
    throw new Error(`No configuration found for category: ${category}`);
  }

  return createMockWorkflowDefinition({
    category,
    name: config.name,
    description: config.description,
    trigger: {
      type: 'event',
      event: config.trigger.event,
      conditions: [],
      immediate: true,
      enabled: true
    },
    states: config.states.map((state, index) => ({
      id: state.id,
      name: state.name,
      type: 'task' as StateType,
      isInitial: index === 0,
      isFinal: index === config.states.length - 1,
      actions: state.actions.map(action => ({
        id: `${state.id}-action`,
        type: 'execute_plugin' as ActionType,
        name: `Execute ${action.plugin}`,
        plugin: action.plugin,
        config: { educational: true, jungian: true }
      }))
    })),
    metadata: {
      tags: ['jung', 'psychology', 'education', category],
      author: 'jaquedu-system',
      dependencies: []
    }
  });
};

/**
 * Performance testing utilities
 */
export const createLargeWorkflowDataset = (size: 'small' | 'medium' | 'large' = 'medium') => {
  const sizes = {
    small: { executions: 50, definitions: 10, events: 200 },
    medium: { executions: 200, definitions: 25, events: 1000 },
    large: { executions: 1000, definitions: 100, events: 5000 }
  };

  const config = sizes[size];
  
  return {
    executions: createMockExecutionBatch(config.executions),
    definitions: Array.from({ length: config.definitions }, () => 
      createEducationalWorkflowDefinition(
        ['progress_tracking', 'assessment', 'adaptive_learning', 'learning_path'][
          Math.floor(Math.random() * 4)
        ] as WorkflowCategory
      )
    ),
    totalEvents: config.events,
    metrics: createMockWorkflowMetrics({
      totalExecutions: config.executions,
      successfulExecutions: Math.floor(config.executions * 0.85),
      failedExecutions: Math.floor(config.executions * 0.1)
    })
  };
};

/**
 * Default export with all mock factories
 */
export default {
  createMockWorkflowDefinition,
  createMockWorkflowExecution,
  createMockStudentProgressData,
  createMockLearningPathData,
  createMockAssessmentData,
  createMockAchievements,
  createMockWorkflowMetrics,
  createMockWorkflowHealth,
  createMockWorkflowServices,
  createMockExecutionHistory,
  createMockExecutionBatch,
  createEducationalWorkflowDefinition,
  createLargeWorkflowDataset
};