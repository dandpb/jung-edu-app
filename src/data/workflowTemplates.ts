/**
 * Workflow Templates Data for jaqEdu Educational Platform
 * Pre-defined workflow templates for common educational scenarios
 */

import { WorkflowTemplate, WorkflowTemplateCategory } from '../types/workflow';

export const workflowTemplates: WorkflowTemplate[] = [
  {
    id: 'student-onboarding',
    name: 'Student Onboarding',
    description: 'Standard workflow for new student registration and onboarding',
    version: '1.0.0',
    category: 'enrollment',
    icon: '👋',
    difficulty: 'beginner',
    estimatedDuration: 15,
    tags: ['onboarding', 'registration', 'welcome'],
    isPublic: true,
    usage_count: 0,
    definition: {
      id: 'student-onboarding-def',
      name: 'Student Onboarding Definition',
      description: 'Complete workflow definition for student onboarding',
      version: '1.0.0',
      category: 'user_onboarding',
      trigger: {
        type: 'manual',
        event: 'new_student_registration',
        conditions: [],
        immediate: true,
        enabled: true
      },
      states: [
        {
          id: 'welcome',
          name: 'Welcome Screen',
          type: 'task',
          isInitial: true,
          isFinal: false,
          actions: []
        },
        {
          id: 'complete',
          name: 'Onboarding Complete',
          type: 'end',
          isInitial: false,
          isFinal: true,
          actions: []
        }
      ],
      transitions: [
        {
          id: 'welcome-to-complete',
          from: 'welcome',
          to: 'complete',
          condition: 'user_accepted_terms',
          priority: 1
        }
      ],
      variables: [
        {
          name: 'student_id',
          type: 'string',
          description: 'Unique identifier for the student',
          defaultValue: '',
          required: true
        }
      ],
      metadata: {
        tags: ['onboarding', 'registration'],
        author: 'System'
      },
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01'),
      created_by: 'system',
      is_active: true
    },
    variables: [
      {
        name: 'student_id',
        type: 'string',
        displayName: 'Student ID',
        description: 'Unique identifier for the student',
        defaultValue: '',
        required: true,
        order: 1
      }
    ],
    metadata: {
      tags: ['onboarding', 'registration'],
      author: 'System',
      use_cases: ['New student registration', 'Platform onboarding']
    },
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    created_by: 'system'
  }
];

export default workflowTemplates;