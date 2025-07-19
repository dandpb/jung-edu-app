/**
 * Comprehensive Educational Module Schema
 * Designed for Jung Education Application
 * Version: 1.0.0
 */

// ==================== Core Module Types ====================

export interface EducationalModule {
  id: string;
  title: string;
  description: string;
  content: ModuleContent;
  videos: Video[];
  mindMaps: MindMap[];
  quiz: Quiz;
  bibliography: Bibliography[];
  filmReferences: FilmReference[];
  tags: string[];
  difficultyLevel: DifficultyLevel;
  timeEstimate: TimeEstimate;
  metadata: ModuleMetadata;
  prerequisites?: string[];
  learningObjectives?: string[];
  icon?: string;
}

export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced'
}

export interface TimeEstimate {
  hours: number;
  minutes: number;
  description?: string; // e.g., "2-3 hours including videos"
}

export interface ModuleMetadata {
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string
  version: string;
  author: Author;
  status: ModuleStatus;
  language: string; // ISO 639-1 code (e.g., 'en', 'es')
  reviewedBy?: Author;
  reviewedAt?: string;
  publishedAt?: string;
  analytics?: ModuleAnalytics;
}

export interface Author {
  id: string;
  name: string;
  email?: string;
  role?: string;
}

export enum ModuleStatus {
  DRAFT = 'draft',
  REVIEW = 'review',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

export interface ModuleAnalytics {
  views: number;
  completions: number;
  averageTime: number; // in minutes
  averageScore: number; // percentage
  feedback?: UserFeedback[];
}

// ==================== Content Types ====================

export interface ModuleContent {
  introduction: string; // Rich text/markdown
  sections: Section[];
  summary?: string;
  keyTakeaways?: string[];
}

export interface Section {
  id: string;
  title: string;
  content: string; // Rich text/markdown
  order: number;
  keyTerms?: KeyTerm[];
  images?: Image[];
  interactiveElements?: InteractiveElement[];
  estimatedTime?: number; // in minutes
}

export interface KeyTerm {
  term: string;
  definition: string;
  relatedTerms?: string[];
  externalLink?: string;
}

export interface Image {
  id: string;
  url: string;
  caption: string;
  alt: string;
  credit?: string;
  license?: string;
}

export interface InteractiveElement {
  id: string;
  type: 'simulation' | 'calculator' | 'diagram' | 'timeline' | 'other';
  title: string;
  url: string;
  description: string;
}

// ==================== Video Types ====================

export interface Video {
  id: string;
  title: string;
  url: string;
  duration: VideoDuration;
  description: string;
  thumbnail?: string;
  transcript?: string;
  captions?: Caption[];
  chapters?: VideoChapter[];
  platform?: VideoPlatform;
  embedCode?: string;
}

export interface VideoDuration {
  hours: number;
  minutes: number;
  seconds: number;
}

export interface Caption {
  language: string; // ISO 639-1 code
  url: string;
  format: 'vtt' | 'srt';
}

export interface VideoChapter {
  title: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
}

export enum VideoPlatform {
  YOUTUBE = 'youtube',
  VIMEO = 'vimeo',
  CUSTOM = 'custom',
  LOCAL = 'local'
}

// ==================== Mind Map Types ====================

export interface MindMap {
  id: string;
  title: string;
  description: string;
  nodes: MindMapNode[];
  edges: MindMapEdge[];
  layout: MindMapLayout;
  style?: MindMapStyle;
  metadata: MindMapMetadata;
}

export interface MindMapNode {
  id: string;
  label: string;
  description?: string;
  position: Position;
  type: NodeType;
  data?: Record<string, any>;
  style?: NodeStyle;
  moduleId?: string; // Link to related module
  resourceLinks?: ResourceLink[];
}

export interface Position {
  x: number;
  y: number;
}

export enum NodeType {
  ROOT = 'root',
  CONCEPT = 'concept',
  EXAMPLE = 'example',
  DEFINITION = 'definition',
  QUESTION = 'question',
  RESOURCE = 'resource'
}

export interface NodeStyle {
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  borderWidth?: number;
  fontSize?: number;
  fontWeight?: string;
  shape?: 'rectangle' | 'circle' | 'diamond' | 'hexagon';
}

export interface MindMapEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type: EdgeType;
  style?: EdgeStyle;
  animated?: boolean;
}

export enum EdgeType {
  HIERARCHICAL = 'hierarchical',
  ASSOCIATION = 'association',
  DEPENDENCY = 'dependency',
  TEMPORAL = 'temporal',
  CAUSAL = 'causal'
}

export interface EdgeStyle {
  strokeColor?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  arrowType?: 'arrow' | 'arrowclosed' | 'circle' | 'none';
}

export interface MindMapLayout {
  type: 'hierarchical' | 'radial' | 'force' | 'grid' | 'manual';
  direction?: 'TB' | 'BT' | 'LR' | 'RL'; // Top-Bottom, Bottom-Top, Left-Right, Right-Left
  spacing?: {
    nodeSpacing: number;
    levelSpacing: number;
  };
}

export interface MindMapStyle {
  theme: 'light' | 'dark' | 'custom';
  backgroundColor?: string;
  defaultNodeStyle?: NodeStyle;
  defaultEdgeStyle?: EdgeStyle;
}

export interface MindMapMetadata {
  created: string;
  lastModified: string;
  version: string;
  isInteractive: boolean;
  allowEditing: boolean;
}

export interface ResourceLink {
  type: 'module' | 'video' | 'document' | 'external';
  id?: string;
  url?: string;
  title: string;
}

// ==================== Quiz Types ====================

export interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  passingScore: number; // percentage
  timeLimit?: number; // in minutes
  shuffleQuestions?: boolean;
  showFeedback?: boolean;
  allowRetries?: boolean;
  maxRetries?: number;
}

export type Question = MultipleChoiceQuestion | TrueFalseQuestion | OpenEndedQuestion;

export interface BaseQuestion {
  id: string;
  question: string;
  points: number;
  explanation: string;
  hint?: string;
  difficulty?: DifficultyLevel;
  tags?: string[];
  mediaAttachment?: MediaAttachment;
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple-choice';
  options: Option[];
  correctAnswers: number[]; // Array for multiple correct answers
  allowMultiple: boolean;
}

export interface Option {
  id: number;
  text: string;
  isCorrect: boolean;
  feedback?: string;
}

export interface TrueFalseQuestion extends BaseQuestion {
  type: 'true-false';
  correctAnswer: boolean;
}

export interface OpenEndedQuestion extends BaseQuestion {
  type: 'open-ended';
  suggestedAnswer: string;
  keywords?: string[]; // For auto-grading
  minLength?: number; // Minimum character count
  maxLength?: number; // Maximum character count
  rubric?: GradingRubric;
}

export interface GradingRubric {
  criteria: RubricCriterion[];
  totalPoints: number;
}

export interface RubricCriterion {
  name: string;
  description: string;
  points: number;
  levels: RubricLevel[];
}

export interface RubricLevel {
  score: number;
  description: string;
}

export interface MediaAttachment {
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  caption?: string;
}

// ==================== Bibliography Types ====================

export interface Bibliography {
  id: string;
  title: string;
  authors: string[];
  year: number;
  type: PublicationType;
  publisher?: string;
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  isbn?: string;
  url?: string;
  abstract?: string;
  tags?: string[];
  relevanceNote?: string;
}

export enum PublicationType {
  BOOK = 'book',
  JOURNAL_ARTICLE = 'journal-article',
  CONFERENCE_PAPER = 'conference-paper',
  THESIS = 'thesis',
  REPORT = 'report',
  WEBSITE = 'website',
  VIDEO = 'video',
  PODCAST = 'podcast',
  OTHER = 'other'
}

// ==================== Film Reference Types ====================

export interface FilmReference {
  id: string;
  title: string;
  director: string[];
  year: number;
  duration: number; // in minutes
  genre: string[];
  relevance: string;
  synopsis?: string;
  imdbId?: string;
  trailer?: string;
  streamingPlatforms?: StreamingPlatform[];
  educationalThemes?: string[];
  discussionPoints?: string[];
  clips?: FilmClip[];
}

export interface StreamingPlatform {
  name: string;
  url?: string;
  availability?: 'free' | 'subscription' | 'rental' | 'purchase';
}

export interface FilmClip {
  title: string;
  startTime: string; // Format: "HH:MM:SS"
  endTime: string; // Format: "HH:MM:SS"
  description: string;
  relevantConcepts?: string[];
}

// ==================== User Feedback Types ====================

export interface UserFeedback {
  userId: string;
  rating: number; // 1-5
  comment?: string;
  timestamp: string;
  helpful?: number; // Number of users who found this helpful
}

// ==================== Helper Types ====================

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ModuleSearchCriteria {
  query?: string;
  tags?: string[];
  difficultyLevel?: DifficultyLevel;
  minDuration?: number; // in minutes
  maxDuration?: number; // in minutes
  author?: string;
  status?: ModuleStatus;
  language?: string;
}

// ==================== Type Guards ====================

export function isMultipleChoiceQuestion(question: Question): question is MultipleChoiceQuestion {
  return question.type === 'multiple-choice';
}

export function isTrueFalseQuestion(question: Question): question is TrueFalseQuestion {
  return question.type === 'true-false';
}

export function isOpenEndedQuestion(question: Question): question is OpenEndedQuestion {
  return question.type === 'open-ended';
}