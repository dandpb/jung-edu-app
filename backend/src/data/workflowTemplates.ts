/**
 * Educational Workflow Templates for jaqEdu Platform
 * 
 * Comprehensive collection of workflow templates for:
 * - Course enrollment and management
 * - Assessment and grading workflows  
 * - Student progress tracking
 * - Jung psychology module completion
 * - Quiz and assessment workflows
 */

import { WorkflowTemplate, WorkflowDefinition } from '../types/workflow';

// ============================================================================
// Course Enrollment Workflow Template
// ============================================================================

const courseEnrollmentDefinition: WorkflowDefinition = {
  id: 'course-enrollment-wf',
  name: 'Course Enrollment Workflow',
  description: 'Complete student enrollment process with prerequisites and payments',
  version: '1.0.0',
  category: 'learning_path',
  trigger: {
    type: 'event',
    event: 'enrollment_requested',
    conditions: [
      {
        field: 'course_id',
        operator: 'is_not_null',
        value: null,
        type: 'string'
      }
    ],
    immediate: true,
    enabled: true
  },
  states: [
    {
      id: 'start',
      name: 'Enrollment Started',
      type: 'task',
      isInitial: true,
      isFinal: false,
      actions: [
        {
          id: 'log_enrollment_start',
          type: 'execute_plugin',
          name: 'Log Enrollment',
          config: {
            message: 'Student ${student_id} started enrollment for course ${course_id}'
          }
        }
      ]
    },
    {
      id: 'check_prerequisites',
      name: 'Check Prerequisites',
      type: 'decision',
      isInitial: false,
      isFinal: false,
      actions: [
        {
          id: 'validate_prerequisites',
          type: 'execute_plugin',
          name: 'Validate Prerequisites',
          config: {
            course_id: '${course_id}',
            student_id: '${student_id}'
          }
        }
      ]
    },
    {
      id: 'prerequisites_failed',
      name: 'Prerequisites Not Met',
      type: 'end',
      isInitial: false,
      isFinal: true,
      actions: [
        {
          id: 'notify_prerequisites_failed',
          type: 'send_notification',
          name: 'Notify Prerequisites Failed',
          config: {
            type: 'email',
            template: 'prerequisites_failed',
            recipient: '${student_email}',
            data: {
              course_name: '${course_name}',
              missing_prerequisites: '${missing_prerequisites}'
            }
          }
        }
      ]
    },
    {
      id: 'check_payment',
      name: 'Check Payment Required',
      type: 'decision',
      isInitial: false,
      isFinal: false,
      actions: [
        {
          id: 'check_course_payment',
          type: 'execute_plugin',
          name: 'Check Payment Requirements',
          config: {
            course_id: '${course_id}',
            enrollment_type: '${enrollment_type}'
          }
        }
      ]
    },
    {
      id: 'process_payment',
      name: 'Process Payment',
      type: 'task',
      isInitial: false,
      isFinal: false,
      actions: [
        {
          id: 'create_payment_session',
          type: 'call_api',
          name: 'Create Payment Session',
          config: {
            url: '/api/payments/create-session',
            method: 'POST',
            data: {
              course_id: '${course_id}',
              student_id: '${student_id}',
              amount: '${course_price}'
            }
          }
        }
      ],
      timeout: 300000 // 5 minutes for payment
    },
    {
      id: 'payment_failed',
      name: 'Payment Failed',
      type: 'end',
      isInitial: false,
      isFinal: true,
      actions: [
        {
          id: 'notify_payment_failed',
          type: 'send_notification',
          name: 'Payment Failed Notification',
          config: {
            type: 'email',
            template: 'payment_failed',
            recipient: '${student_email}'
          }
        }
      ]
    },
    {
      id: 'create_enrollment',
      name: 'Create Enrollment Record',
      type: 'task',
      isInitial: false,
      isFinal: false,
      actions: [
        {
          id: 'create_enrollment_record',
          type: 'update_database',
          name: 'Create Enrollment',
          config: {
            table: 'enrollments',
            operation: 'insert',
            data: {
              student_id: '${student_id}',
              course_id: '${course_id}',
              enrollment_type: '${enrollment_type}',
              enrolled_at: '${current_timestamp}',
              status: 'active'
            }
          }
        }
      ]
    },
    {
      id: 'setup_learning_path',
      name: 'Setup Learning Path',
      type: 'task',
      isInitial: false,
      isFinal: false,
      actions: [
        {
          id: 'create_learning_path',
          type: 'execute_plugin',
          name: 'Initialize Learning Path',
          config: {
            course_id: '${course_id}',
            student_id: '${student_id}',
            personalization_enabled: '${enable_personalization}'
          }
        }
      ]
    },
    {
      id: 'enrollment_complete',
      name: 'Enrollment Complete',
      type: 'end',
      isInitial: false,
      isFinal: true,
      actions: [
        {
          id: 'send_welcome_notification',
          type: 'send_notification',
          name: 'Welcome Email',
          config: {
            type: 'email',
            template: 'enrollment_welcome',
            recipient: '${student_email}',
            data: {
              course_name: '${course_name}',
              start_date: '${course_start_date}',
              access_url: '${course_access_url}'
            }
          }
        },
        {
          id: 'trigger_progress_tracking',
          type: 'execute_plugin',
          name: 'Start Progress Tracking',
          config: {
            template: 'student_progress_tracking',
            variables: {
              student_id: '${student_id}',
              course_id: '${course_id}'
            }
          }
        }
      ]
    }
  ],
  transitions: [
    {
      id: 'start_to_prerequisites',
      from: 'start',
      to: 'check_prerequisites',
      priority: 1
    },
    {
      id: 'prerequisites_pass',
      from: 'check_prerequisites',
      to: 'check_payment',
      condition: 'prerequisites_met == true',
      priority: 1
    },
    {
      id: 'prerequisites_fail',
      from: 'check_prerequisites',
      to: 'prerequisites_failed',
      condition: 'prerequisites_met == false',
      priority: 2
    },
    {
      id: 'payment_required',
      from: 'check_payment',
      to: 'process_payment',
      condition: 'payment_required == true',
      priority: 1
    },
    {
      id: 'payment_not_required',
      from: 'check_payment',
      to: 'create_enrollment',
      condition: 'payment_required == false',
      priority: 2
    },
    {
      id: 'payment_success',
      from: 'process_payment',
      to: 'create_enrollment',
      condition: 'payment_status == "completed"',
      priority: 1
    },
    {
      id: 'payment_failure',
      from: 'process_payment',
      to: 'payment_failed',
      condition: 'payment_status == "failed"',
      priority: 2
    },
    {
      id: 'enrollment_to_path',
      from: 'create_enrollment',
      to: 'setup_learning_path',
      priority: 1
    },
    {
      id: 'path_to_complete',
      from: 'setup_learning_path',
      to: 'enrollment_complete',
      priority: 1
    }
  ],
  variables: [
    {
      name: 'course_id',
      type: 'string',
      defaultValue: null,
      required: true,
      description: 'ID of the course to enroll in'
    },
    {
      name: 'student_id',
      type: 'string', 
      defaultValue: null,
      required: true,
      description: 'ID of the student enrolling'
    },
    {
      name: 'enrollment_type',
      type: 'string',
      defaultValue: 'full',
      required: true,
      description: 'Type of enrollment',
      validation: {
        enum: ['full', 'audit', 'premium']
      }
    }
  ],
  metadata: {
    tags: ['enrollment', 'education', 'students'],
    author: 'jaqEdu System',
    documentation: 'Handles complete student enrollment process including prerequisites, payment, and learning path setup.'
  },
  created_at: new Date(),
  updated_at: new Date(),
  created_by: 'system',
  is_active: true
};

// ============================================================================
// Assignment Submission and Grading Workflow Template
// ============================================================================

const assignmentWorkflowDefinition: WorkflowDefinition = {
  id: 'assignment-grading-wf',
  name: 'Assignment Submission and Grading',
  description: 'Complete workflow for assignment submission, auto-grading, and manual review',
  version: '1.0.0',
  category: 'assessment',
  trigger: {
    type: 'event',
    event: 'assignment_submitted',
    conditions: [],
    immediate: true,
    enabled: true
  },
  states: [
    {
      id: 'start',
      name: 'Assignment Submitted',
      type: 'task',
      isInitial: true,
      isFinal: false,
      actions: [
        {
          id: 'validate_submission',
          type: 'execute_plugin',
          name: 'Validate Submission',
          config: {
            assignment_id: '${assignment_id}',
            submission_data: '${submission_data}',
            required_format: '${required_format}'
          }
        }
      ]
    },
    {
      id: 'auto_grade',
      name: 'Auto-Grade Submission',
      type: 'task',
      isInitial: false,
      isFinal: false,
      actions: [
        {
          id: 'run_auto_grading',
          type: 'execute_plugin',
          name: 'Auto-Grade',
          config: {
            submission_id: '${submission_id}',
            grading_criteria: '${grading_criteria}',
            use_ai_grading: '${enable_ai_grading}'
          }
        }
      ]
    },
    {
      id: 'check_manual_review',
      name: 'Check Manual Review Required',
      type: 'decision',
      isInitial: false,
      isFinal: false,
      actions: [
        {
          id: 'evaluate_review_need',
          type: 'condition_check',
          name: 'Check Review Requirements',
          config: {
            conditions: [
              'auto_grade_confidence < ${manual_review_threshold}',
              'manual_review_always == true',
              'submission_type == "essay"'
            ]
          }
        }
      ]
    },
    {
      id: 'assign_reviewer',
      name: 'Assign Manual Reviewer',
      type: 'task',
      isInitial: false,
      isFinal: false,
      actions: [
        {
          id: 'find_reviewer',
          type: 'execute_plugin',
          name: 'Assign Reviewer',
          config: {
            assignment_id: '${assignment_id}',
            preferred_reviewer: '${preferred_reviewer}',
            workload_balancing: true
          }
        }
      ]
    },
    {
      id: 'manual_review',
      name: 'Manual Review',
      type: 'user_task',
      isInitial: false,
      isFinal: false,
      actions: [
        {
          id: 'create_review_task',
          type: 'user_task',
          name: 'Manual Review Task',
          config: {
            assignee: '${assigned_reviewer}',
            task_type: 'grading_review',
            due_date: '${review_due_date}',
            context: {
              submission_id: '${submission_id}',
              auto_grade: '${auto_grade}',
              grading_rubric: '${grading_rubric}'
            }
          }
        }
      ],
      timeout: 172800000 // 48 hours
    },
    {
      id: 'finalize_grade',
      name: 'Finalize Grade',
      type: 'task',
      isInitial: false,
      isFinal: false,
      actions: [
        {
          id: 'calculate_final_grade',
          type: 'execute_plugin',
          name: 'Calculate Final Grade',
          config: {
            auto_grade: '${auto_grade}',
            manual_grade: '${manual_grade}',
            grading_weights: '${grading_weights}'
          }
        }
      ]
    },
    {
      id: 'send_feedback',
      name: 'Send Feedback',
      type: 'task',
      isInitial: false,
      isFinal: false,
      actions: [
        {
          id: 'notify_student',
          type: 'send_notification',
          name: 'Grade Notification',
          config: {
            type: 'email',
            template: 'assignment_graded',
            recipient: '${student_email}',
            data: {
              assignment_name: '${assignment_name}',
              final_grade: '${final_grade}',
              feedback: '${feedback}',
              rubric_breakdown: '${rubric_breakdown}'
            }
          }
        }
      ]
    },
    {
      id: 'grading_complete',
      name: 'Grading Complete',
      type: 'end',
      isInitial: false,
      isFinal: true,
      actions: [
        {
          id: 'update_gradebook',
          type: 'update_database',
          name: 'Update Gradebook',
          config: {
            table: 'grades',
            operation: 'upsert',
            data: {
              student_id: '${student_id}',
              assignment_id: '${assignment_id}',
              grade: '${final_grade}',
              feedback: '${feedback}',
              graded_at: '${current_timestamp}'
            }
          }
        }
      ]
    }
  ],
  transitions: [
    {
      id: 'start_to_auto_grade',
      from: 'start',
      to: 'auto_grade',
      condition: 'submission_valid == true',
      priority: 1
    },
    {
      id: 'auto_grade_to_check',
      from: 'auto_grade',
      to: 'check_manual_review',
      priority: 1
    },
    {
      id: 'needs_manual_review',
      from: 'check_manual_review',
      to: 'assign_reviewer',
      condition: 'manual_review_required == true',
      priority: 1
    },
    {
      id: 'no_manual_review',
      from: 'check_manual_review',
      to: 'finalize_grade',
      condition: 'manual_review_required == false',
      priority: 2
    },
    {
      id: 'reviewer_to_review',
      from: 'assign_reviewer',
      to: 'manual_review',
      priority: 1
    },
    {
      id: 'review_to_finalize',
      from: 'manual_review',
      to: 'finalize_grade',
      priority: 1
    },
    {
      id: 'finalize_to_feedback',
      from: 'finalize_grade',
      to: 'send_feedback',
      priority: 1
    },
    {
      id: 'feedback_to_complete',
      from: 'send_feedback',
      to: 'grading_complete',
      priority: 1
    }
  ],
  variables: [
    {
      name: 'assignment_id',
      type: 'string',
      defaultValue: null,
      required: true,
      description: 'Assignment identifier'
    },
    {
      name: 'enable_ai_grading',
      type: 'boolean',
      defaultValue: true,
      required: false,
      description: 'Enable AI-powered auto-grading'
    },
    {
      name: 'manual_review_threshold',
      type: 'number',
      defaultValue: 0.8,
      required: false,
      description: 'Confidence threshold below which manual review is required'
    }
  ],
  metadata: {
    tags: ['assignment', 'grading', 'assessment', 'education'],
    author: 'jaqEdu System',
    documentation: 'Comprehensive assignment grading workflow with auto-grading and manual review capabilities.'
  },
  created_at: new Date(),
  updated_at: new Date(),
  created_by: 'system',
  is_active: true
};

// ============================================================================
// Student Progress Tracking Workflow Template
// ============================================================================

const progressTrackingDefinition: WorkflowDefinition = {
  id: 'student-progress-tracking-wf',
  name: 'Student Progress Tracking',
  description: 'Continuous monitoring and analysis of student learning progress',
  version: '1.0.0',
  category: 'progress_tracking',
  trigger: {
    type: 'schedule',
    event: 'progress_check',
    conditions: [],
    schedule: {
      expression: '0 */6 * * *', // Every 6 hours
      timezone: 'UTC',
      description: 'Check progress every 6 hours'
    },
    immediate: false,
    enabled: true
  },
  states: [
    {
      id: 'start',
      name: 'Progress Check Initiated',
      type: 'task',
      isInitial: true,
      isFinal: false,
      actions: [
        {
          id: 'collect_progress_data',
          type: 'execute_plugin',
          name: 'Collect Progress Data',
          config: {
            student_id: '${student_id}',
            course_id: '${course_id}',
            time_window: '${tracking_window}'
          }
        }
      ]
    },
    {
      id: 'analyze_progress',
      name: 'Analyze Learning Progress',
      type: 'task',
      isInitial: false,
      isFinal: false,
      actions: [
        {
          id: 'calculate_metrics',
          type: 'execute_plugin',
          name: 'Calculate Progress Metrics',
          config: {
            progress_data: '${progress_data}',
            include_predictions: true,
            analyze_patterns: true
          }
        }
      ]
    },
    {
      id: 'check_milestones',
      name: 'Check Milestone Achievement',
      type: 'decision',
      isInitial: false,
      isFinal: false,
      actions: [
        {
          id: 'evaluate_milestones',
          type: 'condition_check',
          name: 'Check Milestones',
          config: {
            milestones: '${course_milestones}',
            current_progress: '${current_progress}'
          }
        }
      ]
    },
    {
      id: 'milestone_achieved',
      name: 'Process Milestone Achievement',
      type: 'task',
      isInitial: false,
      isFinal: false,
      actions: [
        {
          id: 'award_achievement',
          type: 'execute_plugin',
          name: 'Award Achievement',
          config: {
            student_id: '${student_id}',
            milestone_id: '${achieved_milestone}',
            award_points: '${milestone_points}'
          }
        },
        {
          id: 'notify_milestone',
          type: 'send_notification',
          name: 'Milestone Notification',
          config: {
            type: 'in_app',
            template: 'milestone_achieved',
            recipient: '${student_id}',
            data: {
              milestone_name: '${milestone_name}',
              points_earned: '${milestone_points}',
              next_milestone: '${next_milestone}'
            }
          }
        }
      ]
    },
    {
      id: 'check_intervention',
      name: 'Check Intervention Need',
      type: 'decision',
      isInitial: false,
      isFinal: false,
      actions: [
        {
          id: 'evaluate_intervention',
          type: 'condition_check',
          name: 'Check Intervention Need',
          config: {
            conditions: [
              'progress_rate < ${min_progress_rate}',
              'engagement_score < ${min_engagement}',
              'time_since_activity > ${max_inactive_days}'
            ]
          }
        }
      ]
    },
    {
      id: 'trigger_intervention',
      name: 'Trigger Intervention',
      type: 'task',
      isInitial: false,
      isFinal: false,
      actions: [
        {
          id: 'create_intervention',
          type: 'execute_plugin',
          name: 'Create Intervention Plan',
          config: {
            student_id: '${student_id}',
            intervention_type: '${recommended_intervention}',
            priority: 'high'
          }
        },
        {
          id: 'notify_instructor',
          type: 'send_notification',
          name: 'Instructor Alert',
          config: {
            type: 'email',
            template: 'student_intervention_needed',
            recipient: '${instructor_email}',
            data: {
              student_name: '${student_name}',
              course_name: '${course_name}',
              intervention_reason: '${intervention_reason}'
            }
          }
        }
      ]
    },
    {
      id: 'update_analytics',
      name: 'Update Analytics Dashboard',
      type: 'task',
      isInitial: false,
      isFinal: false,
      actions: [
        {
          id: 'update_dashboard',
          type: 'update_database',
          name: 'Update Progress Analytics',
          config: {
            table: 'student_progress',
            operation: 'upsert',
            data: {
              student_id: '${student_id}',
              course_id: '${course_id}',
              progress_percentage: '${progress_percentage}',
              engagement_score: '${engagement_score}',
              last_activity: '${last_activity_date}',
              predicted_completion: '${predicted_completion}',
              updated_at: '${current_timestamp}'
            }
          }
        }
      ]
    },
    {
      id: 'complete',
      name: 'Progress Tracking Complete',
      type: 'end',
      isInitial: false,
      isFinal: true,
      actions: []
    }
  ],
  transitions: [
    {
      id: 'start_to_analyze',
      from: 'start',
      to: 'analyze_progress',
      priority: 1
    },
    {
      id: 'analyze_to_milestones',
      from: 'analyze_progress',
      to: 'check_milestones',
      priority: 1
    },
    {
      id: 'milestone_yes',
      from: 'check_milestones',
      to: 'milestone_achieved',
      condition: 'milestone_achieved == true',
      priority: 1
    },
    {
      id: 'milestone_no',
      from: 'check_milestones',
      to: 'check_intervention',
      condition: 'milestone_achieved == false',
      priority: 2
    },
    {
      id: 'milestone_to_intervention',
      from: 'milestone_achieved',
      to: 'check_intervention',
      priority: 1
    },
    {
      id: 'intervention_yes',
      from: 'check_intervention',
      to: 'trigger_intervention',
      condition: 'intervention_needed == true',
      priority: 1
    },
    {
      id: 'intervention_no',
      from: 'check_intervention',
      to: 'update_analytics',
      condition: 'intervention_needed == false',
      priority: 2
    },
    {
      id: 'intervention_to_analytics',
      from: 'trigger_intervention',
      to: 'update_analytics',
      priority: 1
    },
    {
      id: 'analytics_to_complete',
      from: 'update_analytics',
      to: 'complete',
      priority: 1
    }
  ],
  variables: [
    {
      name: 'student_id',
      type: 'string',
      defaultValue: null,
      required: true,
      description: 'Student identifier'
    },
    {
      name: 'course_id',
      type: 'string',
      defaultValue: null,
      required: true,
      description: 'Course identifier'
    },
    {
      name: 'tracking_window',
      type: 'string',
      defaultValue: '6h',
      required: false,
      description: 'Time window for progress tracking'
    },
    {
      name: 'min_progress_rate',
      type: 'number',
      defaultValue: 0.1,
      required: false,
      description: 'Minimum progress rate threshold'
    }
  ],
  metadata: {
    tags: ['progress', 'tracking', 'analytics', 'intervention'],
    author: 'jaqEdu System',
    documentation: 'Automated student progress tracking with milestone detection and intervention triggers.'
  },
  created_at: new Date(),
  updated_at: new Date(),
  created_by: 'system',
  is_active: true
};

// ============================================================================
// Jung Psychology Module Completion Workflow Template
// ============================================================================

const jungModuleDefinition: WorkflowDefinition = {
  id: 'jung-module-completion-wf',
  name: 'Jung Psychology Module Completion',
  description: 'Comprehensive workflow for Jung psychology module completion with reflection and integration',
  version: '1.0.0',
  category: 'jung_psychology',
  trigger: {
    type: 'event',
    event: 'module_started',
    conditions: [
      {
        field: 'module_category',
        operator: 'equals',
        value: 'jung_psychology',
        type: 'string'
      }
    ],
    immediate: true,
    enabled: true
  },
  states: [
    {
      id: 'start',
      name: 'Module Journey Begins',
      type: 'task',
      isInitial: true,
      isFinal: false,
      actions: [
        {
          id: 'personalize_content',
          type: 'execute_plugin',
          name: 'Personalize Content',
          config: {
            student_id: '${student_id}',
            module_id: '${module_id}',
            jung_concept: '${jung_concept}',
            difficulty_level: '${difficulty_level}'
          }
        }
      ]
    },
    {
      id: 'present_content',
      name: 'Present Learning Content',
      type: 'task',
      isInitial: false,
      isFinal: false,
      actions: [
        {
          id: 'deliver_content',
          type: 'execute_plugin',
          name: 'Content Delivery',
          config: {
            content_type: '${preferred_content_type}',
            include_examples: true,
            jung_concepts: '${jung_concepts}',
            interactive_elements: '${enable_interactive}'
          }
        }
      ]
    },
    {
      id: 'self_reflection',
      name: 'Self-Reflection Phase',
      type: 'user_task',
      isInitial: false,
      isFinal: false,
      actions: [
        {
          id: 'reflection_prompts',
          type: 'user_task',
          name: 'Self-Reflection Prompts',
          config: {
            assignee: '${student_id}',
            task_type: 'self_reflection',
            prompts: [
              'How does this Jung concept relate to your personal experiences?',
              'What aspects of ${jung_concept} resonate most with you?',
              'Can you identify examples of ${jung_concept} in your daily life?'
            ],
            min_reflection_time: 300 // 5 minutes
          }
        }
      ]
    },
    {
      id: 'knowledge_check',
      name: 'Knowledge Assessment',
      type: 'task',
      isInitial: false,
      isFinal: false,
      actions: [
        {
          id: 'adaptive_quiz',
          type: 'execute_plugin',
          name: 'Adaptive Knowledge Check',
          config: {
            module_id: '${module_id}',
            question_count: '${quiz_question_count}',
            difficulty_adaptation: true,
            jung_focus: '${jung_concept}'
          }
        }
      ]
    },
    {
      id: 'integration_exercise',
      name: 'Integration Exercise',
      type: 'task',
      isInitial: false,
      isFinal: false,
      actions: [
        {
          id: 'create_integration_task',
          type: 'execute_plugin',
          name: 'Integration Exercise',
          config: {
            exercise_type: '${integration_type}',
            jung_concept: '${jung_concept}',
            personalization: {
              student_interests: '${student_interests}',
              learning_style: '${learning_style}'
            }
          }
        }
      ]
    },
    {
      id: 'peer_discussion',
      name: 'Peer Discussion Forum',
      type: 'wait',
      isInitial: false,
      isFinal: false,
      actions: [
        {
          id: 'create_discussion_thread',
          type: 'execute_plugin',
          name: 'Create Discussion Thread',
          config: {
            forum_id: '${course_forum_id}',
            topic: 'Exploring ${jung_concept}: Personal Insights and Applications',
            student_id: '${student_id}',
            discussion_duration: '${discussion_duration}'
          }
        }
      ],
      timeout: 604800000 // 7 days
    },
    {
      id: 'evaluate_completion',
      name: 'Evaluate Module Completion',
      type: 'decision',
      isInitial: false,
      isFinal: false,
      actions: [
        {
          id: 'calculate_completion_score',
          type: 'execute_plugin',
          name: 'Calculate Completion Score',
          config: {
            content_engagement: '${content_engagement_score}',
            quiz_performance: '${quiz_score}',
            reflection_quality: '${reflection_score}',
            integration_completion: '${integration_score}',
            peer_participation: '${discussion_score}'
          }
        }
      ]
    },
    {
      id: 'additional_practice',
      name: 'Additional Practice Recommended',
      type: 'task',
      isInitial: false,
      isFinal: false,
      actions: [
        {
          id: 'recommend_practice',
          type: 'execute_plugin',
          name: 'Recommend Additional Practice',
          config: {
            weak_areas: '${identified_weak_areas}',
            practice_type: 'targeted_exercises',
            jung_concept: '${jung_concept}'
          }
        }
      ]
    },
    {
      id: 'module_mastery',
      name: 'Module Mastery Achieved',
      type: 'task',
      isInitial: false,
      isFinal: false,
      actions: [
        {
          id: 'award_mastery_badge',
          type: 'execute_plugin',
          name: 'Award Mastery Badge',
          config: {
            student_id: '${student_id}',
            badge_type: 'jung_mastery',
            concept: '${jung_concept}',
            level: '${mastery_level}'
          }
        },
        {
          id: 'unlock_advanced_content',
          type: 'execute_plugin',
          name: 'Unlock Advanced Content',
          config: {
            student_id: '${student_id}',
            concept: '${jung_concept}',
            unlock_type: 'advanced_applications'
          }
        }
      ]
    },
    {
      id: 'completion_celebration',
      name: 'Completion Celebration',
      type: 'end',
      isInitial: false,
      isFinal: true,
      actions: [
        {
          id: 'completion_notification',
          type: 'send_notification',
          name: 'Module Completion',
          config: {
            type: 'in_app',
            template: 'jung_module_completed',
            recipient: '${student_id}',
            data: {
              module_name: '${module_name}',
              jung_concept: '${jung_concept}',
              completion_score: '${final_score}',
              next_recommended: '${next_module}'
            }
          }
        },
        {
          id: 'update_learning_path',
          type: 'execute_plugin',
          name: 'Update Learning Path',
          config: {
            student_id: '${student_id}',
            completed_module: '${module_id}',
            proficiency_level: '${achieved_proficiency}',
            recommend_next: true
          }
        }
      ]
    }
  ],
  transitions: [
    {
      id: 'start_to_content',
      from: 'start',
      to: 'present_content',
      priority: 1
    },
    {
      id: 'content_to_reflection',
      from: 'present_content',
      to: 'self_reflection',
      condition: 'enable_self_reflection == true',
      priority: 1
    },
    {
      id: 'content_to_quiz',
      from: 'present_content',
      to: 'knowledge_check',
      condition: 'enable_self_reflection == false',
      priority: 2
    },
    {
      id: 'reflection_to_quiz',
      from: 'self_reflection',
      to: 'knowledge_check',
      priority: 1
    },
    {
      id: 'quiz_to_integration',
      from: 'knowledge_check',
      to: 'integration_exercise',
      priority: 1
    },
    {
      id: 'integration_to_discussion',
      from: 'integration_exercise',
      to: 'peer_discussion',
      condition: 'enable_peer_discussion == true',
      priority: 1
    },
    {
      id: 'integration_to_evaluation',
      from: 'integration_exercise',
      to: 'evaluate_completion',
      condition: 'enable_peer_discussion == false',
      priority: 2
    },
    {
      id: 'discussion_to_evaluation',
      from: 'peer_discussion',
      to: 'evaluate_completion',
      priority: 1
    },
    {
      id: 'evaluation_to_practice',
      from: 'evaluate_completion',
      to: 'additional_practice',
      condition: 'completion_score < ${mastery_threshold}',
      priority: 1
    },
    {
      id: 'evaluation_to_mastery',
      from: 'evaluate_completion',
      to: 'module_mastery',
      condition: 'completion_score >= ${mastery_threshold}',
      priority: 2
    },
    {
      id: 'practice_to_evaluation',
      from: 'additional_practice',
      to: 'evaluate_completion',
      priority: 1
    },
    {
      id: 'mastery_to_celebration',
      from: 'module_mastery',
      to: 'completion_celebration',
      priority: 1
    }
  ],
  variables: [
    {
      name: 'module_id',
      type: 'string',
      defaultValue: null,
      required: true,
      description: 'Jung psychology module identifier'
    },
    {
      name: 'jung_concept',
      type: 'string',
      defaultValue: null,
      required: true,
      description: 'Primary Jung concept covered',
      validation: {
        enum: ['shadow', 'anima', 'animus', 'individuation', 'collective_unconscious', 'archetypes', 'persona', 'self']
      }
    },
    {
      name: 'enable_self_reflection',
      type: 'boolean',
      defaultValue: true,
      required: false,
      description: 'Enable self-reflection exercises'
    },
    {
      name: 'mastery_threshold',
      type: 'number',
      defaultValue: 0.85,
      required: false,
      description: 'Score threshold for mastery achievement'
    }
  ],
  metadata: {
    tags: ['jung', 'psychology', 'individuation', 'learning', 'reflection'],
    author: 'jaqEdu Jung Psychology Team',
    documentation: 'Comprehensive Jung psychology module workflow with personalization, reflection, and peer interaction.'
  },
  created_at: new Date(),
  updated_at: new Date(),
  created_by: 'system',
  is_active: true
};

// ============================================================================
// Quiz and Assessment Workflow Template
// ============================================================================

const quizAssessmentDefinition: WorkflowDefinition = {
  id: 'quiz-assessment-wf',
  name: 'Adaptive Quiz and Assessment',
  description: 'Intelligent quiz workflow with adaptive questioning and comprehensive feedback',
  version: '1.0.0',
  category: 'assessment',
  trigger: {
    type: 'event',
    event: 'quiz_started',
    conditions: [],
    immediate: true,
    enabled: true
  },
  states: [
    {
      id: 'start',
      name: 'Quiz Initialization',
      type: 'task',
      isInitial: true,
      isFinal: false,
      actions: [
        {
          id: 'initialize_quiz',
          type: 'execute_plugin',
          name: 'Initialize Quiz Session',
          config: {
            quiz_id: '${quiz_id}',
            student_id: '${student_id}',
            adaptive_enabled: '${enable_adaptive_questioning}',
            question_pool_size: '${question_pool_size}'
          }
        }
      ]
    },
    {
      id: 'present_question',
      name: 'Present Question',
      type: 'user_task',
      isInitial: false,
      isFinal: false,
      actions: [
        {
          id: 'show_question',
          type: 'user_task',
          name: 'Present Quiz Question',
          config: {
            assignee: '${student_id}',
            task_type: 'quiz_question',
            question_data: '${current_question}',
            time_limit: '${question_time_limit}',
            hints_available: '${enable_hints}'
          }
        }
      ]
    },
    {
      id: 'process_answer',
      name: 'Process Answer',
      type: 'task',
      isInitial: false,
      isFinal: false,
      actions: [
        {
          id: 'evaluate_answer',
          type: 'execute_plugin',
          name: 'Evaluate Answer',
          config: {
            question_id: '${current_question_id}',
            student_answer: '${student_answer}',
            correct_answer: '${correct_answer}',
            partial_credit: '${allow_partial_credit}'
          }
        }
      ]
    },
    {
      id: 'provide_immediate_feedback',
      name: 'Immediate Feedback',
      type: 'task',
      isInitial: false,
      isFinal: false,
      actions: [
        {
          id: 'show_feedback',
          type: 'execute_plugin',
          name: 'Show Question Feedback',
          config: {
            feedback_type: '${feedback_timing}',
            show_correct_answer: '${show_correct_answers}',
            show_explanation: '${show_explanations}',
            answer_result: '${answer_correct}'
          }
        }
      ]
    },
    {
      id: 'adaptive_question_selection',
      name: 'Select Next Question',
      type: 'task',
      isInitial: false,
      isFinal: false,
      actions: [
        {
          id: 'select_next_question',
          type: 'execute_plugin',
          name: 'Adaptive Question Selection',
          config: {
            current_performance: '${current_score}',
            answered_questions: '${answered_questions}',
            difficulty_adjustment: '${enable_difficulty_adaptation}',
            topic_coverage: '${ensure_topic_coverage}'
          }
        }
      ]
    },
    {
      id: 'check_completion',
      name: 'Check Quiz Completion',
      type: 'decision',
      isInitial: false,
      isFinal: false,
      actions: [
        {
          id: 'evaluate_completion',
          type: 'condition_check',
          name: 'Check Completion Criteria',
          config: {
            conditions: [
              'questions_answered >= ${min_questions}',
              'time_elapsed >= ${min_time}',
              'confidence_level >= ${confidence_threshold}',
              'all_topics_covered == true'
            ]
          }
        }
      ]
    },
    {
      id: 'calculate_results',
      name: 'Calculate Quiz Results',
      type: 'task',
      isInitial: false,
      isFinal: false,
      actions: [
        {
          id: 'calculate_score',
          type: 'execute_plugin',
          name: 'Calculate Final Score',
          config: {
            scoring_method: '${scoring_method}',
            question_weights: '${question_weights}',
            time_bonus: '${include_time_bonus}',
            difficulty_bonus: '${include_difficulty_bonus}'
          }
        }
      ]
    },
    {
      id: 'generate_feedback_report',
      name: 'Generate Comprehensive Feedback',
      type: 'task',
      isInitial: false,
      isFinal: false,
      actions: [
        {
          id: 'create_feedback_report',
          type: 'execute_plugin',
          name: 'Create Detailed Feedback',
          config: {
            performance_analysis: true,
            strength_areas: '${identified_strengths}',
            improvement_areas: '${improvement_areas}',
            learning_recommendations: true,
            comparative_analysis: '${enable_peer_comparison}'
          }
        }
      ]
    },
    {
      id: 'determine_remediation',
      name: 'Determine Remediation Need',
      type: 'decision',
      isInitial: false,
      isFinal: false,
      actions: [
        {
          id: 'check_remediation_need',
          type: 'condition_check',
          name: 'Check Remediation Requirements',
          config: {
            conditions: [
              'final_score < ${remediation_threshold}',
              'weak_topic_count > ${max_weak_topics}',
              'time_spent < ${min_engagement_time}'
            ]
          }
        }
      ]
    },
    {
      id: 'create_remediation_plan',
      name: 'Create Remediation Plan',
      type: 'task',
      isInitial: false,
      isFinal: false,
      actions: [
        {
          id: 'generate_remediation',
          type: 'execute_plugin',
          name: 'Generate Remediation Plan',
          config: {
            weak_areas: '${weak_areas}',
            learning_style: '${student_learning_style}',
            recommended_resources: true,
            practice_questions: true
          }
        }
      ]
    },
    {
      id: 'quiz_complete',
      name: 'Quiz Complete',
      type: 'end',
      isInitial: false,
      isFinal: true,
      actions: [
        {
          id: 'save_results',
          type: 'update_database',
          name: 'Save Quiz Results',
          config: {
            table: 'quiz_results',
            operation: 'insert',
            data: {
              student_id: '${student_id}',
              quiz_id: '${quiz_id}',
              final_score: '${final_score}',
              time_taken: '${total_time}',
              questions_answered: '${questions_answered}',
              feedback_report: '${feedback_report}',
              completed_at: '${current_timestamp}'
            }
          }
        },
        {
          id: 'update_progress',
          type: 'execute_plugin',
          name: 'Update Learning Progress',
          config: {
            student_id: '${student_id}',
            assessment_result: '${final_score}',
            topics_mastered: '${mastered_topics}',
            next_recommendations: '${learning_recommendations}'
          }
        }
      ]
    }
  ],
  transitions: [
    {
      id: 'start_to_question',
      from: 'start',
      to: 'present_question',
      priority: 1
    },
    {
      id: 'question_to_process',
      from: 'present_question',
      to: 'process_answer',
      priority: 1
    },
    {
      id: 'process_to_feedback',
      from: 'process_answer',
      to: 'provide_immediate_feedback',
      condition: 'feedback_timing == "immediate"',
      priority: 1
    },
    {
      id: 'process_to_selection',
      from: 'process_answer',
      to: 'adaptive_question_selection',
      condition: 'feedback_timing != "immediate"',
      priority: 2
    },
    {
      id: 'feedback_to_selection',
      from: 'provide_immediate_feedback',
      to: 'adaptive_question_selection',
      priority: 1
    },
    {
      id: 'selection_to_completion',
      from: 'adaptive_question_selection',
      to: 'check_completion',
      priority: 1
    },
    {
      id: 'completion_continue',
      from: 'check_completion',
      to: 'present_question',
      condition: 'quiz_complete == false',
      priority: 1
    },
    {
      id: 'completion_finish',
      from: 'check_completion',
      to: 'calculate_results',
      condition: 'quiz_complete == true',
      priority: 2
    },
    {
      id: 'results_to_feedback',
      from: 'calculate_results',
      to: 'generate_feedback_report',
      priority: 1
    },
    {
      id: 'feedback_to_remediation_check',
      from: 'generate_feedback_report',
      to: 'determine_remediation',
      priority: 1
    },
    {
      id: 'remediation_needed',
      from: 'determine_remediation',
      to: 'create_remediation_plan',
      condition: 'remediation_needed == true',
      priority: 1
    },
    {
      id: 'remediation_not_needed',
      from: 'determine_remediation',
      to: 'quiz_complete',
      condition: 'remediation_needed == false',
      priority: 2
    },
    {
      id: 'remediation_to_complete',
      from: 'create_remediation_plan',
      to: 'quiz_complete',
      priority: 1
    }
  ],
  variables: [
    {
      name: 'quiz_id',
      type: 'string',
      defaultValue: null,
      required: true,
      description: 'Quiz identifier'
    },
    {
      name: 'enable_adaptive_questioning',
      type: 'boolean',
      defaultValue: true,
      required: false,
      description: 'Enable adaptive question selection'
    },
    {
      name: 'feedback_timing',
      type: 'string',
      defaultValue: 'immediate',
      required: false,
      description: 'When to show feedback',
      validation: {
        enum: ['immediate', 'after_question', 'end_of_quiz', 'never']
      }
    },
    {
      name: 'remediation_threshold',
      type: 'number',
      defaultValue: 0.7,
      required: false,
      description: 'Score below which remediation is recommended'
    }
  ],
  metadata: {
    tags: ['quiz', 'assessment', 'adaptive', 'feedback', 'remediation'],
    author: 'jaqEdu Assessment Team',
    documentation: 'Advanced adaptive quiz system with comprehensive feedback and remediation planning.'
  },
  created_at: new Date(),
  updated_at: new Date(),
  created_by: 'system',
  is_active: true
};

// ============================================================================
// Exported Templates Collection
// ============================================================================

export const workflowTemplates: WorkflowTemplate[] = [
  // Course Enrollment Template
  {
    id: 'course-enrollment-template',
    name: 'Course Enrollment Workflow',
    description: 'Complete student enrollment process with prerequisites, payment processing, and learning path setup',
    version: '1.0.0',
    category: 'enrollment',
    icon: '🎓',
    tags: ['enrollment', 'education', 'students', 'prerequisites', 'payment'],
    isPublic: true,
    difficulty: 'intermediate',
    estimatedDuration: 15,
    definition: courseEnrollmentDefinition,
    variables: [
      {
        name: 'course_id',
        type: 'string',
        displayName: 'Course ID',
        description: 'Identifier of the course to enroll in',
        defaultValue: null,
        required: true,
        validation: {
          pattern: '^[a-zA-Z0-9-_]+$'
        },
        group: 'course_info',
        order: 1
      },
      {
        name: 'student_id',
        type: 'string',
        displayName: 'Student ID', 
        description: 'Identifier of the enrolling student',
        defaultValue: null,
        required: true,
        group: 'course_info',
        order: 2
      },
      {
        name: 'enrollment_type',
        type: 'string',
        displayName: 'Enrollment Type',
        description: 'Type of course enrollment',
        defaultValue: 'full',
        required: true,
        options: [
          { label: 'Full Access', value: 'full', description: 'Complete course access with certification' },
          { label: 'Audit Only', value: 'audit', description: 'Course content access without certification' },
          { label: 'Premium', value: 'premium', description: 'Enhanced features and 1-on-1 support' }
        ],
        group: 'enrollment_settings',
        order: 3
      },
      {
        name: 'enable_personalization',
        type: 'boolean',
        displayName: 'Enable Personalization',
        description: 'Adapt learning path to student preferences and performance',
        defaultValue: true,
        required: false,
        group: 'enrollment_settings',
        order: 4
      }
    ],
    metadata: {
      tags: ['enrollment', 'education', 'students', 'prerequisites', 'payment'],
      author: 'jaqEdu System',
      authorEmail: 'system@jaqedu.com',
      documentation: 'This template handles the complete student enrollment process including prerequisite checking, payment processing (if required), and initial learning path setup. It includes automated notifications and handles various enrollment types.',
      version_notes: 'Initial version with basic enrollment flow',
      use_cases: [
        'New student enrollment',
        'Course re-enrollment',  
        'Premium upgrade enrollment',
        'Bulk enrollment processing'
      ],
      integration_points: ['payment_gateway', 'learning_management_system', 'notification_service'],
      examples: [
        {
          title: 'Basic Free Course Enrollment',
          description: 'Enroll student in a free course with no prerequisites',
          variables: {
            course_id: 'intro-jung-free',
            student_id: 'student_123',
            enrollment_type: 'audit',
            enable_personalization: false
          },
          expected_outcome: 'Student enrolled with immediate course access'
        }
      ]
    },
    created_at: new Date('2024-01-15'),
    updated_at: new Date('2024-01-15'),
    created_by: 'system',
    usage_count: 245,
    rating: 4.7
  },

  // Assignment Workflow Template
  {
    id: 'assignment-grading-template',
    name: 'Assignment Submission and Grading',
    description: 'Automated assignment grading workflow with AI assistance and manual review options',
    version: '1.0.0',
    category: 'assessment',
    icon: '📝',
    tags: ['assignment', 'grading', 'assessment', 'education', 'ai'],
    isPublic: true,
    difficulty: 'advanced',
    estimatedDuration: 60,
    definition: assignmentWorkflowDefinition,
    variables: [
      {
        name: 'assignment_id',
        type: 'string',
        displayName: 'Assignment ID',
        description: 'Unique identifier for the assignment',
        defaultValue: null,
        required: true,
        group: 'assignment_info',
        order: 1
      },
      {
        name: 'enable_ai_grading',
        type: 'boolean',
        displayName: 'Enable AI Grading',
        description: 'Use AI-powered automatic grading',
        defaultValue: true,
        required: false,
        group: 'grading_settings',
        order: 2
      },
      {
        name: 'manual_review_threshold',
        type: 'number',
        displayName: 'Manual Review Threshold',
        description: 'AI confidence level below which manual review is required (0-1)',
        defaultValue: 0.8,
        required: false,
        validation: {
          min: 0,
          max: 1
        },
        group: 'grading_settings',
        order: 3
      },
      {
        name: 'grading_rubric_id',
        type: 'string',
        displayName: 'Grading Rubric ID',
        description: 'ID of the rubric to use for grading',
        defaultValue: null,
        required: false,
        group: 'grading_settings',
        order: 4
      }
    ],
    metadata: {
      tags: ['assignment', 'grading', 'assessment', 'education', 'ai'],
      author: 'jaqEdu Assessment Team',
      documentation: 'Comprehensive assignment grading workflow supporting both automatic AI grading and manual instructor review. Includes rubric-based grading, feedback generation, and grade distribution.',
      use_cases: [
        'Essay grading with AI assistance',
        'Multiple choice auto-grading',
        'Peer review assignments',
        'Portfolio assessment'
      ],
      integration_points: ['ai_grading_service', 'rubric_engine', 'notification_system']
    },
    created_at: new Date('2024-01-20'),
    updated_at: new Date('2024-02-01'),
    created_by: 'assessment_team',
    usage_count: 156,
    rating: 4.5
  },

  // Student Progress Tracking Template
  {
    id: 'student-progress-tracking-template',
    name: 'Student Progress Tracking',
    description: 'Continuous monitoring of student learning progress with intervention triggers',
    version: '1.0.0',
    category: 'progress_tracking',
    icon: '📊',
    tags: ['progress', 'tracking', 'analytics', 'intervention', 'monitoring'],
    isPublic: true,
    difficulty: 'intermediate',
    estimatedDuration: 30,
    definition: progressTrackingDefinition,
    variables: [
      {
        name: 'student_id',
        type: 'string',
        displayName: 'Student ID',
        description: 'Identifier of the student to track',
        defaultValue: null,
        required: true,
        group: 'tracking_info',
        order: 1
      },
      {
        name: 'course_id',
        type: 'string',
        displayName: 'Course ID',
        description: 'Course to track progress for',
        defaultValue: null,
        required: true,
        group: 'tracking_info',
        order: 2
      },
      {
        name: 'tracking_frequency',
        type: 'string',
        displayName: 'Tracking Frequency',
        description: 'How often to check progress',
        defaultValue: 'daily',
        required: false,
        options: [
          { label: 'Real-time', value: 'real_time' },
          { label: 'Hourly', value: 'hourly' },
          { label: 'Daily', value: 'daily' },
          { label: 'Weekly', value: 'weekly' }
        ],
        group: 'tracking_settings',
        order: 3
      },
      {
        name: 'intervention_threshold',
        type: 'number',
        displayName: 'Intervention Threshold',
        description: 'Progress percentage below which intervention is triggered',
        defaultValue: 0.3,
        required: false,
        validation: {
          min: 0,
          max: 1
        },
        group: 'tracking_settings',
        order: 4
      }
    ],
    metadata: {
      tags: ['progress', 'tracking', 'analytics', 'intervention', 'monitoring'],
      author: 'jaqEdu Analytics Team',
      documentation: 'Automated student progress tracking with predictive analytics and early intervention triggers. Monitors engagement, performance trends, and learning velocity.',
      use_cases: [
        'At-risk student identification',
        'Learning path optimization',
        'Progress reporting',
        'Parent/instructor notifications'
      ]
    },
    created_at: new Date('2024-01-25'),
    updated_at: new Date('2024-02-05'),
    created_by: 'analytics_team',
    usage_count: 189,
    rating: 4.8
  },

  // Jung Psychology Module Template  
  {
    id: 'jung-psychology-module-template',
    name: 'Jung Psychology Module Completion',
    description: 'Comprehensive Jung psychology learning workflow with reflection and peer interaction',
    version: '1.0.0',
    category: 'jung_psychology',
    icon: '🧠',
    tags: ['jung', 'psychology', 'individuation', 'reflection', 'peer-learning'],
    isPublic: true,
    difficulty: 'advanced',
    estimatedDuration: 90,
    definition: jungModuleDefinition,
    variables: [
      {
        name: 'module_id',
        type: 'string',
        displayName: 'Module ID',
        description: 'Jung psychology module identifier',
        defaultValue: null,
        required: true,
        group: 'module_info',
        order: 1
      },
      {
        name: 'jung_concept',
        type: 'string',
        displayName: 'Jung Concept',
        description: 'Primary Jungian concept covered in this module',
        defaultValue: 'shadow',
        required: true,
        options: [
          { label: 'Shadow Work', value: 'shadow', description: 'Exploring the hidden aspects of personality' },
          { label: 'Anima Integration', value: 'anima', description: 'The feminine aspect in men' },
          { label: 'Animus Integration', value: 'animus', description: 'The masculine aspect in women' },
          { label: 'Individuation Process', value: 'individuation', description: 'The journey toward psychological wholeness' },
          { label: 'Collective Unconscious', value: 'collective_unconscious', description: 'Shared unconscious content of humanity' },
          { label: 'Archetypal Patterns', value: 'archetypes', description: 'Universal symbolic patterns' },
          { label: 'Persona Development', value: 'persona', description: 'The mask we present to the world' },
          { label: 'Self Realization', value: 'self', description: 'The unified consciousness of self' }
        ],
        group: 'jung_settings',
        order: 2
      },
      {
        name: 'enable_self_reflection',
        type: 'boolean',
        displayName: 'Enable Self-Reflection',
        description: 'Include guided self-reflection exercises',
        defaultValue: true,
        required: false,
        group: 'learning_settings',
        order: 3
      },
      {
        name: 'enable_peer_discussion',
        type: 'boolean',
        displayName: 'Enable Peer Discussion',
        description: 'Include forum discussions with other learners',
        defaultValue: true,
        required: false,
        group: 'learning_settings',
        order: 4
      },
      {
        name: 'mastery_threshold',
        type: 'number',
        displayName: 'Mastery Threshold',
        description: 'Score required to achieve mastery (0-1)',
        defaultValue: 0.85,
        required: false,
        validation: {
          min: 0.5,
          max: 1
        },
        group: 'assessment_settings',
        order: 5
      }
    ],
    metadata: {
      tags: ['jung', 'psychology', 'individuation', 'reflection', 'peer-learning'],
      author: 'jaqEdu Jung Psychology Team',
      documentation: 'Immersive Jung psychology learning experience with personalized content delivery, reflective exercises, knowledge assessments, and peer discussion forums. Designed to facilitate deep understanding of Jungian concepts.',
      use_cases: [
        'Jung psychology certification courses',
        'Therapeutic training programs',
        'Personal development workshops',
        'Academic psychology courses'
      ],
      integration_points: ['content_personalization', 'discussion_forums', 'reflection_tools', 'mastery_tracking']
    },
    created_at: new Date('2024-02-01'),
    updated_at: new Date('2024-02-10'),
    created_by: 'jung_team',
    usage_count: 98,
    rating: 4.9
  },

  // Quiz Assessment Template
  {
    id: 'adaptive-quiz-template',
    name: 'Adaptive Quiz and Assessment',
    description: 'Intelligent quiz system with adaptive questioning and comprehensive feedback',
    version: '1.0.0',
    category: 'assessment',
    icon: '❓',
    tags: ['quiz', 'assessment', 'adaptive', 'feedback', 'analytics'],
    isPublic: true,
    difficulty: 'advanced',
    estimatedDuration: 45,
    definition: quizAssessmentDefinition,
    variables: [
      {
        name: 'quiz_id',
        type: 'string',
        displayName: 'Quiz ID',
        description: 'Unique identifier for the quiz',
        defaultValue: null,
        required: true,
        group: 'quiz_info',
        order: 1
      },
      {
        name: 'enable_adaptive_questioning',
        type: 'boolean',
        displayName: 'Enable Adaptive Questioning',
        description: 'Adjust question difficulty based on performance',
        defaultValue: true,
        required: false,
        group: 'quiz_settings',
        order: 2
      },
      {
        name: 'feedback_timing',
        type: 'string',
        displayName: 'Feedback Timing',
        description: 'When to provide feedback to students',
        defaultValue: 'immediate',
        required: false,
        options: [
          { label: 'Immediate', value: 'immediate', description: 'Show feedback after each question' },
          { label: 'After Question', value: 'after_question', description: 'Show feedback after question is answered' },
          { label: 'End of Quiz', value: 'end_of_quiz', description: 'Show all feedback at the end' },
          { label: 'Never', value: 'never', description: 'No feedback provided' }
        ],
        group: 'feedback_settings',
        order: 3
      },
      {
        name: 'time_limit_minutes',
        type: 'number',
        displayName: 'Time Limit (Minutes)',
        description: 'Overall time limit for the quiz',
        defaultValue: 30,
        required: false,
        validation: {
          min: 5,
          max: 180
        },
        group: 'quiz_settings',
        order: 4
      },
      {
        name: 'remediation_threshold',
        type: 'number',
        displayName: 'Remediation Threshold',
        description: 'Score below which remediation is recommended (0-1)',
        defaultValue: 0.7,
        required: false,
        validation: {
          min: 0,
          max: 1
        },
        group: 'assessment_settings',
        order: 5
      }
    ],
    metadata: {
      tags: ['quiz', 'assessment', 'adaptive', 'feedback', 'analytics'],
      author: 'jaqEdu Assessment Team',
      documentation: 'Advanced adaptive quiz system that adjusts difficulty based on student performance, provides comprehensive feedback, and generates detailed analytics reports with remediation recommendations.',
      use_cases: [
        'Formative assessments',
        'Certification exams',
        'Knowledge checks',
        'Placement tests',
        'Progress evaluations'
      ],
      integration_points: ['question_bank', 'analytics_engine', 'remediation_system', 'gradebook']
    },
    created_at: new Date('2024-02-05'),
    updated_at: new Date('2024-02-12'),
    created_by: 'assessment_team',
    usage_count: 203,
    rating: 4.6
  }
];

export default workflowTemplates;