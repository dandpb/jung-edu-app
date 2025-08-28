/**
 * Educational Workflow Examples
 * Ready-to-use workflow templates for educational scenarios
 */
import { Workflow } from '../src/types/workflow';
export declare const studentOnboardingWorkflow: Workflow;
export declare const quizGradingWorkflow: Workflow;
export declare const adaptiveLearningWorkflow: Workflow;
export declare const courseCompletionWorkflow: Workflow;
export declare const virtualClassroomWorkflow: Workflow;
export declare function executeEducationalWorkflow(workflowService: any, workflow: Workflow, inputData: Record<string, any>): Promise<any>;
export declare const exampleUsage = "\nimport { createWorkflowService } from './src/WorkflowService';\nimport { \n  studentOnboardingWorkflow,\n  quizGradingWorkflow,\n  adaptiveLearningWorkflow,\n  executeEducationalWorkflow \n} from './examples/educational-workflows';\n\n// Initialize workflow service\nconst workflowService = createWorkflowService(config, dependencies);\n\n// Execute student onboarding\nawait executeEducationalWorkflow(\n  workflowService,\n  studentOnboardingWorkflow,\n  {\n    studentId: 'student-123',\n    email: 'student@university.edu',\n    courseIds: ['CS101', 'MATH201', 'ENG105']\n  }\n);\n\n// Execute quiz grading\nawait executeEducationalWorkflow(\n  workflowService,\n  quizGradingWorkflow,\n  {\n    submissionId: 'quiz-456',\n    studentId: 'student-123',\n    answers: [...],\n    submittedAt: new Date()\n  }\n);\n\n// Execute adaptive learning\nawait executeEducationalWorkflow(\n  workflowService,\n  adaptiveLearningWorkflow,\n  {\n    studentId: 'student-123',\n    courseId: 'MATH201',\n    currentModule: 'calculus-derivatives'\n  }\n);\n";
//# sourceMappingURL=educational-workflows.d.ts.map