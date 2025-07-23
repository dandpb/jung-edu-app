import {
  Module,
  ModuleContent,
  Section,
  Video,
  Quiz,
  Question,
  UserProgress,
  Note,
  MindMapNode,
  MindMapEdge
} from '../index';

describe('Types', () => {
  it('should allow creating a valid Module object', () => {
    const module: Module = {
      id: 'test-module',
      title: 'Test Module',
      description: 'A test module',
      icon: '🧪',
      content: {
        introduction: 'Test introduction',
        sections: []
      },
      estimatedTime: 60,
      difficulty: 'intermediate',
      category: 'test'
    };

    expect(module.id).toBe('test-module');
    expect(module.difficulty).toBe('intermediate');
    expect(module.content.sections).toHaveLength(0);
  });

  it('should allow creating a valid Section object', () => {
    const section: Section = {
      id: 'section-1',
      title: 'Test Section',
      content: 'Section content',
      order: 0,
      subsections: [],
      media: []
    };

    expect(section.id).toBe('section-1');
    expect(section.order).toBe(0);
  });

  it('should allow creating a valid Video object', () => {
    const video: Video = {
      id: 'video-1',
      title: 'Test Video',
      youtubeId: 'abc123',
      description: 'A test video',
      duration: 15
    };

    expect(video.youtubeId).toBe('abc123');
    expect(video.duration).toBe(15);
  });

  it('should allow creating a valid Quiz object', () => {
    const quiz: Quiz = {
      id: 'quiz-1',
      title: 'Test Quiz',
      description: 'A test quiz',
      questions: []
    };

    expect(quiz.questions).toHaveLength(0);
  });

  it('should allow creating a valid Question object', () => {
    const question: Question = {
      id: 'q1',
      question: 'What is Jung\'s theory about?',
      options: [
        { id: 'a', text: 'Psychology', isCorrect: true },
        { id: 'b', text: 'Physics', isCorrect: false }
      ],
      correctAnswer: 0,
      explanation: 'Jung developed analytical psychology'
    };

    expect(question.options).toHaveLength(2);
    expect(question.correctAnswer).toBe(0);
  });

  it('should allow creating a valid UserProgress object', () => {
    const progress: UserProgress = {
      userId: 'user-123',
      completedModules: ['module-1'],
      quizScores: { 'module-1': 85 },
      totalTime: 3600,
      lastAccessed: Date.now(),
      notes: []
    };

    expect(progress.completedModules).toContain('module-1');
    expect(progress.quizScores['module-1']).toBe(85);
  });

  it('should allow creating a valid Note object', () => {
    const note: Note = {
      id: 'note-1',
      moduleId: 'module-1',
      content: 'This is a note',
      timestamp: Date.now()
    };

    expect(note.moduleId).toBe('module-1');
    expect(note.content).toBe('This is a note');
  });

  it('should allow creating valid MindMap objects', () => {
    const node: MindMapNode = {
      id: 'node-1',
      type: 'concept',
      position: { x: 100, y: 200 },
      data: {
        label: 'Test Node',
        concept: 'Test Concept'
      }
    };

    const edge: MindMapEdge = {
      id: 'edge-1',
      source: 'node-1',
      target: 'node-2',
      type: 'relates-to'
    };

    expect(node.position.x).toBe(100);
    expect(edge.source).toBe('node-1');
  });

  it('should support optional properties', () => {
    const moduleWithOptionals: Module = {
      id: 'test',
      title: 'Test',
      description: 'Test',
      icon: '🧪',
      content: {
        introduction: 'Test',
        sections: []
      },
      estimatedTime: 60,
      difficulty: 'beginner',
      prerequisites: ['prereq-1'],
      category: 'psychology'
    };

    expect(moduleWithOptionals.prerequisites).toContain('prereq-1');
    expect(moduleWithOptionals.category).toBe('psychology');
  });

  it('should support different difficulty levels', () => {
    const difficulties: Array<Module['difficulty']> = ['beginner', 'intermediate', 'advanced'];
    
    difficulties.forEach(diff => {
      const module: Module = {
        id: 'test',
        title: 'Test',
        description: 'Test',
        icon: '🧪',
        content: { introduction: 'Test', sections: [] },
        estimatedTime: 60,
        difficulty: diff
      };
      
      expect(['beginner', 'intermediate', 'advanced']).toContain(module.difficulty);
    });
  });
});