import { faker } from '@faker-js/faker';
import { TestUsersFixture, TestUser, TestUserRole } from './test-users';
import { ApiHelper } from '../helpers/api-helper';

export interface TestModule {
  id: string;
  title: string;
  description: string;
  content: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  duration: number; // in minutes
  topics: string[];
  authorId: string;
  isPublished: boolean;
  createdAt: string;
  quiz?: TestQuiz;
}

export interface TestQuiz {
  id: string;
  moduleId: string;
  questions: TestQuestion[];
  passingScore: number;
  timeLimit?: number; // in minutes
}

export interface TestQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface TestProgress {
  userId: string;
  moduleId: string;
  completed: boolean;
  progress: number; // 0-100
  score?: number;
  timeSpent: number; // in minutes
  lastAccessedAt: string;
}

/**
 * Test Data Seeder
 * Seeds database with test data for E2E testing
 */
export class TestDataSeeder {
  private usersFixture: TestUsersFixture;
  private apiHelper: ApiHelper;
  private seededData: {
    users: TestUser[];
    modules: TestModule[];
    quizzes: TestQuiz[];
    progress: TestProgress[];
  } = {
    users: [],
    modules: [],
    quizzes: [],
    progress: []
  };

  constructor() {
    this.usersFixture = TestUsersFixture.getInstance();
    this.apiHelper = new ApiHelper();
  }

  // Main seeding methods
  async seedBasicData(): Promise<void> {
    console.log('🌱 Seeding basic test data...');
    
    try {
      await this.seedUsers();
      await this.seedModules();
      await this.seedQuizzes();
      await this.seedProgress();
      
      console.log('✅ Basic test data seeded successfully');
    } catch (error) {
      console.error('❌ Failed to seed basic test data:', error);
      throw error;
    }
  }

  async seedFullDataset(): Promise<void> {
    console.log('🌱 Seeding full test dataset...');
    
    try {
      await this.seedUsers(50); // More users for comprehensive testing
      await this.seedModules(25); // More modules
      await this.seedQuizzes();
      await this.seedProgress();
      await this.seedAdditionalContent();
      
      console.log('✅ Full test dataset seeded successfully');
    } catch (error) {
      console.error('❌ Failed to seed full test dataset:', error);
      throw error;
    }
  }

  // User seeding
  async seedUsers(additionalCount: number = 10): Promise<void> {
    console.log('👥 Seeding users...');
    
    // Add predefined users
    const predefinedUsers = [
      this.usersFixture.getAdminUser(),
      this.usersFixture.getTeacherUser(),
      this.usersFixture.getStudentUser(),
      this.usersFixture.getSpanishUser(),
      this.usersFixture.getPortugueseUser()
    ];

    // Add generated users
    const generatedUsers = this.usersFixture.generateUserBatch({
      admins: 2,
      teachers: 5,
      students: additionalCount - 7 // Subtract predefined users
    });

    const allUsers = [...predefinedUsers, ...generatedUsers];

    for (const user of allUsers) {
      try {
        await this.apiHelper.createTestUser({
          email: user.email,
          password: user.password,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        });
        
        this.seededData.users.push(user);
      } catch (error) {
        // User might already exist, which is fine
        console.warn(`User ${user.email} already exists or failed to create`);
      }
    }

    console.log(`✅ Seeded ${this.seededData.users.length} users`);
  }

  // Module seeding
  async seedModules(count: number = 15): Promise<void> {
    console.log('📚 Seeding modules...');

    const topics = [
      'JavaScript Fundamentals',
      'React Components',
      'Node.js Backend Development',
      'Database Design',
      'API Development',
      'Testing Strategies',
      'DevOps Basics',
      'UI/UX Design',
      'Python Programming',
      'Data Structures',
      'Machine Learning Intro',
      'Web Security',
      'Performance Optimization',
      'Git and Version Control',
      'Agile Methodologies'
    ];

    const languages = ['en', 'es', 'pt-br'];
    const difficulties: Array<'beginner' | 'intermediate' | 'advanced'> = ['beginner', 'intermediate', 'advanced'];
    
    // Get teacher users to assign as authors
    const teachers = this.seededData.users.filter(user => user.role === 'teacher');
    if (teachers.length === 0) {
      console.warn('No teacher users found for module authorship');
      return;
    }

    for (let i = 0; i < Math.min(count, topics.length); i++) {
      const topic = topics[i];
      const module = this.generateModule(topic, teachers, languages, difficulties);
      
      try {
        const createdModule = await this.apiHelper.createModule({
          title: module.title,
          description: module.description,
          content: module.content,
          difficulty: module.difficulty,
          language: module.language
        });
        
        // Update module with API response
        module.id = createdModule.id || module.id;
        this.seededData.modules.push(module);
      } catch (error) {
        console.warn(`Failed to create module: ${module.title}`, error);
      }
    }

    console.log(`✅ Seeded ${this.seededData.modules.length} modules`);
  }

  private generateModule(
    topic: string, 
    teachers: TestUser[], 
    languages: string[], 
    difficulties: Array<'beginner' | 'intermediate' | 'advanced'>
  ): TestModule {
    const difficulty = faker.helpers.arrayElement(difficulties);
    const language = faker.helpers.arrayElement(languages);
    const author = faker.helpers.arrayElement(teachers);
    
    return {
      id: faker.string.uuid(),
      title: topic,
      description: this.generateModuleDescription(topic, difficulty),
      content: this.generateModuleContent(topic, difficulty),
      difficulty,
      language,
      duration: faker.number.int({ min: 30, max: 180 }), // 30-180 minutes
      topics: [topic, ...faker.helpers.arrayElements(this.getRelatedTopics(topic), { min: 2, max: 5 })],
      authorId: author.id,
      isPublished: faker.datatype.boolean(0.8), // 80% published
      createdAt: faker.date.recent({ days: 90 }).toISOString()
    };
  }

  private generateModuleDescription(topic: string, difficulty: string): string {
    const descriptions = {
      beginner: `An introductory course to ${topic}. Perfect for those just starting their journey in this field.`,
      intermediate: `A comprehensive ${topic} course that builds upon fundamental concepts and introduces advanced techniques.`,
      advanced: `An expert-level ${topic} course designed for experienced practitioners looking to master advanced concepts.`
    };
    
    return descriptions[difficulty as keyof typeof descriptions] || 
           `Learn ${topic} with this comprehensive course designed for ${difficulty} level learners.`;
  }

  private generateModuleContent(topic: string, difficulty: string): string {
    const sections = [
      `# ${topic}\n\n## Introduction\n\nWelcome to this ${difficulty} level course on ${topic}.`,
      `\n\n## Learning Objectives\n\n- Understand core concepts of ${topic}\n- Apply practical techniques\n- Build real-world projects`,
      `\n\n## Prerequisites\n\n${difficulty === 'beginner' ? 'No prerequisites required.' : 'Basic understanding of related concepts recommended.'}`,
      `\n\n## Course Content\n\n### Module 1: Fundamentals\n\nThis section covers the basic concepts...`,
      `\n\n### Module 2: Practical Applications\n\nHands-on exercises and examples...`,
      `\n\n### Module 3: Advanced Topics\n\nDeep dive into complex scenarios...`,
      `\n\n## Summary\n\nBy the end of this course, you will have a solid understanding of ${topic}.`
    ];
    
    return sections.join('');
  }

  private getRelatedTopics(mainTopic: string): string[] {
    const topicMap: Record<string, string[]> = {
      'JavaScript Fundamentals': ['ES6', 'DOM Manipulation', 'Async Programming', 'Functions', 'Objects'],
      'React Components': ['JSX', 'Props', 'State', 'Hooks', 'Component Lifecycle'],
      'Node.js Backend Development': ['Express.js', 'Middleware', 'REST APIs', 'Authentication', 'Database Integration'],
      'Database Design': ['SQL', 'NoSQL', 'Normalization', 'Indexing', 'Query Optimization'],
      'API Development': ['REST', 'GraphQL', 'Authentication', 'Rate Limiting', 'Documentation'],
    };
    
    return topicMap[mainTopic] || ['Programming', 'Development', 'Technology', 'Best Practices'];
  }

  // Quiz seeding
  async seedQuizzes(): Promise<void> {
    console.log('❓ Seeding quizzes...');

    for (const module of this.seededData.modules) {
      if (faker.datatype.boolean(0.7)) { // 70% of modules have quizzes
        const quiz = this.generateQuiz(module);
        
        try {
          const createdQuiz = await this.apiHelper.createQuiz({
            moduleId: module.id,
            questions: quiz.questions
          });
          
          quiz.id = createdQuiz.id || quiz.id;
          module.quiz = quiz;
          this.seededData.quizzes.push(quiz);
        } catch (error) {
          console.warn(`Failed to create quiz for module: ${module.title}`, error);
        }
      }
    }

    console.log(`✅ Seeded ${this.seededData.quizzes.length} quizzes`);
  }

  private generateQuiz(module: TestModule): TestQuiz {
    const questionCount = faker.number.int({ min: 5, max: 15 });
    const questions: TestQuestion[] = [];
    
    for (let i = 0; i < questionCount; i++) {
      questions.push(this.generateQuestion(module, i + 1));
    }
    
    return {
      id: faker.string.uuid(),
      moduleId: module.id,
      questions,
      passingScore: faker.number.int({ min: 60, max: 80 }), // 60-80% passing score
      timeLimit: faker.number.int({ min: 15, max: 45 }) // 15-45 minutes
    };
  }

  private generateQuestion(module: TestModule, questionNumber: number): TestQuestion {
    const difficulties: Array<'easy' | 'medium' | 'hard'> = ['easy', 'medium', 'hard'];
    const difficulty = faker.helpers.arrayElement(difficulties);
    
    const question = `Question ${questionNumber} about ${module.title}: ${this.generateQuestionText(module.title, difficulty)}`;
    const options = this.generateOptions(module.title);
    const correctAnswer = faker.number.int({ min: 0, max: options.length - 1 });
    
    return {
      id: faker.string.uuid(),
      question,
      options,
      correctAnswer,
      explanation: `The correct answer relates to the core concepts of ${module.title}.`,
      difficulty
    };
  }

  private generateQuestionText(topic: string, difficulty: string): string {
    const questions = {
      easy: [
        `What is the main purpose of ${topic}?`,
        `Which of the following is a key concept in ${topic}?`,
        `What is the first step when learning ${topic}?`
      ],
      medium: [
        `How would you apply ${topic} in a real-world scenario?`,
        `What are the advantages and disadvantages of ${topic}?`,
        `Which best practices should you follow when working with ${topic}?`
      ],
      hard: [
        `How would you optimize performance when implementing ${topic}?`,
        `What are the most complex challenges when mastering ${topic}?`,
        `How does ${topic} integrate with other advanced technologies?`
      ]
    };
    
    const questionSet = questions[difficulty as keyof typeof questions] || questions.easy;
    return faker.helpers.arrayElement(questionSet);
  }

  private generateOptions(topic: string): string[] {
    const genericOptions = [
      `Option A related to ${topic}`,
      `Option B about ${topic} concepts`,
      `Option C covering ${topic} applications`,
      `Option D explaining ${topic} principles`
    ];
    
    return genericOptions;
  }

  // Progress seeding
  async seedProgress(): Promise<void> {
    console.log('📊 Seeding user progress...');

    const students = this.seededData.users.filter(user => user.role === 'student');
    
    for (const student of students) {
      // Each student has progress on 3-8 random modules
      const moduleCount = faker.number.int({ min: 3, max: 8 });
      const studentModules = faker.helpers.arrayElements(this.seededData.modules, moduleCount);
      
      for (const module of studentModules) {
        const progress = this.generateProgress(student, module);
        
        try {
          await this.apiHelper.updateModuleProgress(module.id, {
            completed: progress.completed,
            progress: progress.progress,
            timeSpent: progress.timeSpent
          });
          
          this.seededData.progress.push(progress);
        } catch (error) {
          console.warn(`Failed to create progress for user ${student.email} on module ${module.title}`);
        }
      }
    }

    console.log(`✅ Seeded ${this.seededData.progress.length} progress records`);
  }

  private generateProgress(student: TestUser, module: TestModule): TestProgress {
    const progress = faker.number.int({ min: 0, max: 100 });
    const completed = progress === 100;
    const timeSpent = faker.number.int({ min: 10, max: module.duration * 1.2 });
    const score = completed ? faker.number.int({ min: 60, max: 100 }) : undefined;
    
    return {
      userId: student.id,
      moduleId: module.id,
      completed,
      progress,
      score,
      timeSpent,
      lastAccessedAt: faker.date.recent({ days: 30 }).toISOString()
    };
  }

  // Additional content seeding
  async seedAdditionalContent(): Promise<void> {
    console.log('🎯 Seeding additional content...');
    
    // Seed achievements, notifications, etc.
    // This is a placeholder for additional content types
    
    console.log('✅ Additional content seeded');
  }

  // Cleanup methods
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up test data...');
    
    try {
      await this.apiHelper.cleanupTestData();
      
      // Reset local data
      this.seededData = {
        users: [],
        modules: [],
        quizzes: [],
        progress: []
      };
      
      console.log('✅ Test data cleaned up successfully');
    } catch (error) {
      console.error('❌ Failed to cleanup test data:', error);
    }
  }

  // Data export/import for test consistency
  exportSeededData(): string {
    return JSON.stringify(this.seededData, null, 2);
  }

  importSeededData(jsonData: string): void {
    try {
      this.seededData = JSON.parse(jsonData);
    } catch (error) {
      throw new Error('Invalid JSON data for seeded data import');
    }
  }

  // Getters for seeded data
  getSeededUsers(): TestUser[] {
    return this.seededData.users;
  }

  getSeededModules(): TestModule[] {
    return this.seededData.modules;
  }

  getSeededQuizzes(): TestQuiz[] {
    return this.seededData.quizzes;
  }

  getSeededProgress(): TestProgress[] {
    return this.seededData.progress;
  }

  // Utility methods
  getRandomSeededUser(role?: TestUserRole): TestUser | null {
    const users = role 
      ? this.seededData.users.filter(u => u.role === role)
      : this.seededData.users;
    
    return users.length > 0 ? faker.helpers.arrayElement(users) : null;
  }

  getRandomSeededModule(): TestModule | null {
    return this.seededData.modules.length > 0 
      ? faker.helpers.arrayElement(this.seededData.modules) 
      : null;
  }

  getModuleWithQuiz(): TestModule | null {
    const modulesWithQuiz = this.seededData.modules.filter(m => m.quiz);
    return modulesWithQuiz.length > 0 
      ? faker.helpers.arrayElement(modulesWithQuiz) 
      : null;
  }
}