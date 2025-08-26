export interface Module {
  id: string;
  title: string;
  description: string;
  icon?: string;
  content?: ModuleContent;
  sections?: Section[];
  prerequisites?: string[];
  learningObjectives?: string[];
  estimatedTime: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category?: string;
  quiz?: Quiz;
  practicalExercises?: PracticalExercise[];
  tags?: string[];
  version?: number;
  author?: string;
  publishedAt?: Date;
  updatedAt?: Date;
  status?: 'draft' | 'published' | 'archived';
  analytics?: ModuleAnalytics;
  adaptiveContent?: AdaptiveContent;
}

export interface ModuleAnalytics {
  totalViews: number;
  averageCompletionTime: number;
  completionRate: number;
  averageQuizScore: number;
  popularSections: string[];
  userFeedback: ModuleFeedback[];
}

export interface ModuleFeedback {
  userId: string;
  rating: number;
  comment?: string;
  aspects: FeedbackAspect[];
  timestamp: Date;
}

export interface FeedbackAspect {
  category: 'content' | 'difficulty' | 'engagement' | 'clarity';
  rating: number;
  comment?: string;
}

export interface AdaptiveContent {
  variants: ContentVariant[];
  rules: AdaptationRule[];
}

export interface ContentVariant {
  id: string;
  targetAudience: string;
  difficultyLevel: number;
  content: Partial<ModuleContent>;
  conditions: AdaptationCondition[];
}

export interface AdaptationRule {
  id: string;
  trigger: AdaptationTrigger;
  action: AdaptationAction;
  priority: number;
}

export interface AdaptationTrigger {
  type: 'performance' | 'time' | 'preference' | 'behavior';
  condition: string;
  threshold: number;
}

export interface AdaptationAction {
  type: 'show_variant' | 'adjust_difficulty' | 'suggest_review' | 'provide_help';
  parameters: Record<string, any>;
}

export interface AdaptationCondition {
  attribute: string;
  operator: '>' | '<' | '=' | '>=' | '<=';
  value: any;
}

export interface ModuleContent {
  introduction: string;
  sections: Section[];
  videos?: Video[];
  quiz?: Quiz;
  bibliography?: Bibliography[];
  films?: Film[];
  summary?: string;
  keyTakeaways?: string[];
  interactiveVisualizations?: InteractiveVisualization[];
  practicalExercises?: PracticalExercise[];
  reflectionPrompts?: ReflectionPrompt[];
  caseStudies?: CaseStudy[];
  supplementaryMaterials?: SupplementaryMaterial[];
}

export interface PracticalExercise {
  id: string;
  title: string;
  description: string;
  instructions: string[];
  estimatedTime: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  type: 'individual' | 'group' | 'reflection' | 'analysis';
  materials?: string[];
  expectedOutcomes?: string[];
}

export interface ReflectionPrompt {
  id: string;
  question: string;
  context: string;
  guidingQuestions?: string[];
  relatedConcepts: string[];
  estimatedTime: number;
}

export interface CaseStudy {
  id: string;
  title: string;
  description: string;
  scenario: string;
  questions: string[];
  learningObjectives: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  relatedConcepts: string[];
}

export interface SupplementaryMaterial {
  id: string;
  title: string;
  type: 'pdf' | 'link' | 'audio' | 'interactive';
  url: string;
  description: string;
  optional: boolean;
}

export interface Section {
  id: string;
  title: string;
  content: string;
  order: number;
  keyTerms?: KeyTerm[];
  images?: Image[];
  interactiveElements?: InteractiveElement[];
  estimatedTime?: number;
  prerequisites?: string[];
  learningObjectives?: string[];
  assessments?: Assessment[];
  multimedia?: MultimediaContent[];
}

export interface InteractiveElement {
  id: string;
  type: InteractiveElementType;
  title: string;
  description?: string;
  config: Record<string, any>;
  position: ElementPosition;
}

export type InteractiveElementType = 
  | 'concept-explorer'
  | 'personality-test'
  | 'archetype-selector'
  | 'dream-journal'
  | 'reflection-prompt'
  | 'case-study'
  | 'simulation';

export interface ElementPosition {
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface Assessment {
  id: string;
  type: 'formative' | 'summative' | 'diagnostic';
  questions: Question[];
  weight: number;
  passingScore: number;
}

export interface MultimediaContent {
  id: string;
  type: 'audio' | 'video' | 'animation' | 'interactive';
  url: string;
  title: string;
  description?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface KeyTerm {
  term: string;
  definition: string;
}

export interface Image {
  id: string;
  url: string;
  caption: string;
  alt: string;
}

export interface Video {
  id: string;
  title: string;
  youtubeId?: string;
  url?: string;
  description: string;
  duration: number | { hours: number; minutes: number; seconds: number };
  transcript?: string;
  keyMoments?: VideoKeyMoment[];
  captions?: VideoCaption[];
  quality?: VideoQuality[];
  thumbnails?: VideoThumbnail[];
  chapters?: Chapter[];
  interactiveElements?: InteractiveVideoElement[];
}

export interface VideoKeyMoment {
  timestamp: number;
  title: string;
  description: string;
  type: 'concept' | 'example' | 'exercise' | 'summary';
  relatedConcepts?: string[];
}

export interface VideoCaption {
  language: string;
  url: string;
  autoGenerated: boolean;
}

export interface VideoQuality {
  resolution: string;
  url: string;
  format: string;
}

export interface VideoThumbnail {
  url: string;
  width: number;
  height: number;
}

export interface InteractiveVideoElement {
  id: string;
  timestamp: number;
  type: 'quiz' | 'note-prompt' | 'reflection' | 'link';
  content: any;
  duration?: number;
}

export interface Quiz {
  id: string;
  title: string;
  questions: Question[];
  description?: string;
  moduleId?: string;
  passingScore?: number;
  timeLimit?: number;
  createdAt?: Date;
  updatedAt?: Date;
  metadata?: any;
  adaptiveSettings?: AdaptiveQuizSettings;
}

export interface AdaptiveQuizSettings {
  enabled: boolean;
  difficultyRange: [number, number];
  minQuestions: number;
  maxQuestions: number;
  targetAccuracy: number;
}

export interface Option {
  id: string;
  text: string;
  isCorrect?: boolean;
  explanation?: string;
  mediaUrl?: string;
}

export interface Question {
  id: string;
  question: string;
  type: QuestionType;
  options: Option[];
  correctAnswer: number | number[] | string;
  explanation: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  cognitiveLevel?: string;
  tags?: string[];
  points?: number;
  order?: number;
  metadata?: any;
  expectedKeywords?: string[];
  rubric?: GradingRubric;
  mediaUrl?: string;
  timeLimit?: number;
  hints?: string[];
}

export type QuestionType = 
  | 'multiple-choice'
  | 'multiple-select'
  | 'true-false'
  | 'fill-in-blank'
  | 'short-answer'
  | 'essay'
  | 'matching'
  | 'ranking'
  | 'drag-drop'
  | 'interactive';

export interface GradingRubric {
  criteria: RubricCriteria[];
  maxScore: number;
}

export interface RubricCriteria {
  name: string;
  description: string;
  levels: RubricLevel[];
}

export interface RubricLevel {
  score: number;
  description: string;
  keywords?: string[];
}

export type PublicationType = 'book' | 'article' | 'journal' | 'online' | 'thesis';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface Bibliography {
  id: string;
  title: string;
  authors: string[];
  year: number;
  publisher?: string;
  type: PublicationType;
  url?: string;
  summary?: string;
}

export interface Film {
  id: string;
  title: string;
  director: string;
  year: number;
  relevance: string;
  trailer?: string;
  streamingUrl?: string;
  type?: 'documentary' | 'fiction' | 'educational' | 'biographical';
}

export interface Note {
  id: string;
  moduleId: string;
  content: string;
  timestamp: number;
  tags?: string[];
  type?: NoteType;
  mediaAttachments?: MediaAttachment[];
  linkedConcepts?: string[];
  isShared?: boolean;
  parentNoteId?: string;
  reactions?: NoteReaction[];
}

export type NoteType = 'text' | 'audio' | 'drawing' | 'screenshot' | 'video';

export interface MediaAttachment {
  id: string;
  type: 'image' | 'audio' | 'video' | 'document';
  url: string;
  filename: string;
  size: number;
  thumbnail?: string;
}

export interface NoteReaction {
  userId: string;
  type: '👍' | '💡' | '🤔' | '❤️' | '🎯';
  timestamp: number;
}

export interface UserProgress {
  userId: string;
  completedModules: string[];
  quizScores: Record<string, number>;
  totalTime: number;
  lastAccessed: number;
  notes: Note[];
  learningPath?: LearningPath;
  achievements?: Achievement[];
  analytics?: UserAnalytics;
  preferences?: UserPreferences;
  adaptiveLearningData?: AdaptiveLearningData;
}

export interface LearningPath {
  id: string;
  name: string;
  description: string;
  modules: string[];
  currentModule: string;
  progress: number;
  estimatedCompletion: Date;
  personalized: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  points: number;
  unlockedAt: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirements: AchievementRequirement[];
}

export type AchievementCategory = 
  | 'progress'
  | 'knowledge'
  | 'engagement'
  | 'social'
  | 'exploration'
  | 'mastery';

export interface AchievementRequirement {
  type: 'complete_modules' | 'quiz_score' | 'time_spent' | 'consecutive_days' | 'forum_posts';
  value: number;
  operator: '>=' | '<=' | '=' | '>';
}

export interface UserAnalytics {
  totalStudyTime: number;
  averageQuizScore: number;
  moduleCompletionRate: number;
  streakDays: number;
  preferredLearningTime: string;
  strongConcepts: string[];
  weakConcepts: string[];
  learningVelocity: number;
  engagementScore: number;
  lastWeekActivity: DailyActivity[];
}

export interface DailyActivity {
  date: string;
  timeSpent: number;
  modulesCompleted: number;
  quizzesTaken: number;
  notesCreated: number;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: NotificationSettings;
  displaySettings: DisplaySettings;
  learningSettings: LearningSettings;
}

export interface NotificationSettings {
  studyReminders: boolean;
  achievementAlerts: boolean;
  forumUpdates: boolean;
  weeklyProgress: boolean;
}

export interface DisplaySettings {
  fontSize: 'small' | 'medium' | 'large';
  animations: boolean;
  compactMode: boolean;
  showProgress: boolean;
}

export interface LearningSettings {
  adaptiveDifficulty: boolean;
  showHints: boolean;
  autoplay: boolean;
  pauseOnErrors: boolean;
}

export interface AdaptiveLearningData {
  knowledgeState: Record<string, number>;
  learningRate: number;
  difficultyPreference: number;
  responsePatterns: ResponsePattern[];
  conceptMastery: Record<string, ConceptMastery>;
}

export interface ResponsePattern {
  questionType: QuestionType;
  avgResponseTime: number;
  accuracy: number;
  confidence: number;
}

export interface ConceptMastery {
  concept: string;
  level: number;
  lastReviewed: Date;
  reviewCount: number;
  forgettingCurve: number;
}

export interface NodeAnimation {
  type: 'pulse' | 'glow' | 'rotate' | 'scale';
  duration: number;
  trigger: 'load' | 'hover' | 'click' | 'focus';
  parameters?: Record<string, any>;
  interactive?: boolean;
}

export interface ConceptRelationship {
  type: 'prerequisite' | 'related' | 'opposite' | 'example' | 'application';
  description?: string;
  examples?: string[];
}

export interface AdminUser {
  id: string;
  username: string;
  password: string; // In production, this should be hashed
  role: 'admin';
  lastLogin?: number;
}

export interface AppSettings {
  modules: Module[];
  adminUsers: AdminUser[];
  achievements: Achievement[];
  forumCategories: ForumCategory[];
  gamificationSettings: GamificationSettings;
  adaptiveLearningConfig: AdaptiveLearningConfig;
}

export interface GamificationSettings {
  pointsPerModule: number;
  pointsPerQuiz: number;
  streakBonus: number;
  achievementMultiplier: number;
  leaderboardEnabled: boolean;
  badgesEnabled: boolean;
}

export interface AdaptiveLearningConfig {
  enabled: boolean;
  algorithms: AdaptiveLearningAlgorithm[];
  personalizationLevel: number;
  adaptationSpeed: number;
  minimumDataPoints: number;
}

export interface AdaptiveLearningAlgorithm {
  name: string;
  type: 'collaborative-filtering' | 'knowledge-tracing' | 'item-response' | 'bayesian';
  weight: number;
  parameters: Record<string, any>;
}

// New interfaces for enhanced features
export interface InteractiveVisualization {
  id: string;
  type: VisualizationType;
  title: string;
  description: string;
  config: VisualizationConfig;
  data: any;
  interactions: InteractionRule[];
}

export type VisualizationType = 
  | 'concept-map'
  | 'timeline'
  | 'personality-wheel'
  | 'archetype-mandala'
  | 'dream-symbols'
  | 'individuation-journey'
  | '3d-psyche-model';

export interface VisualizationConfig {
  dimensions: { width: number; height: number };
  interactivity: boolean;
  animations: boolean;
  customizations: Record<string, any>;
}

export interface InteractionRule {
  trigger: 'click' | 'hover' | 'drag' | 'touch';
  action: 'highlight' | 'expand' | 'navigate' | 'modal' | 'animate';
  target?: string;
  parameters?: Record<string, any>;
}

export interface ForumPost {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  moduleId?: string;
  category: ForumCategory;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  replies: ForumReply[];
  votes: number;
  isLocked: boolean;
  isPinned: boolean;
  views: number;
}

export interface ForumReply {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
  updatedAt: Date;
  votes: number;
  parentReplyId?: string;
  reactions: ReactionSummary[];
}

export interface ReactionSummary {
  emoji: string;
  count: number;
  userReacted: boolean;
}

export type ForumCategory = 
  | 'general-discussion'
  | 'module-questions'
  | 'dream-sharing'
  | 'case-studies'
  | 'research'
  | 'announcements';

export interface MultimediaPlayer {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  volume: number;
  playbackRate: number;
  notes: TimestampedNote[];
  bookmarks: Bookmark[];
  chapters?: Chapter[];
}

export interface TimestampedNote {
  id: string;
  timestamp: number;
  content: string;
  type: 'note' | 'question' | 'insight';
  tags?: string[];
}

export interface Bookmark {
  id: string;
  timestamp: number;
  title: string;
  description?: string;
}

export interface Chapter {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  description?: string;
}

export interface LearningInsight {
  id: string;
  type: 'strength' | 'weakness' | 'recommendation' | 'milestone';
  title: string;
  description: string;
  relatedConcepts?: string[];
  suggestedActions?: string[];
  confidence: number;
  date: Date;
}

export interface AdaptiveLearningEngine {
  calculateNextDifficulty(userHistory: UserProgress, concept: string): number;
  recommendContent(userProfile: UserProgress, availableContent: Module[]): Module[];
  identifyWeakConcepts(quizHistory: Record<string, number>): string[];
  generatePersonalizedPath(user: UserProgress, goals: string[]): LearningPath;
}

// Re-export auth types
export * from './auth';