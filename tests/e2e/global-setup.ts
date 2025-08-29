import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Global setup for E2E tests
 * Creates mock authentication states and test fixtures without requiring a live server
 */
async function globalSetup(config: FullConfig) {
  console.log('Starting mock E2E global setup...');
  
  // Create necessary directories
  const authDir = path.join(__dirname, 'auth');
  const reportsDir = path.join(__dirname, 'reports');
  const screenshotsDir = path.join(__dirname, 'screenshots');
  const visualBaselineDir = path.join(__dirname, 'visual-baselines');
  const testResultsDir = path.join(__dirname, 'test-results');
  
  [authDir, reportsDir, screenshotsDir, visualBaselineDir, testResultsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  const baseURL = config.projects[0].use?.baseURL || 'http://localhost:3000';
  
  // Create mock admin authentication state
  console.log('Creating mock admin authentication state...');
  const adminAuthState = {
    cookies: [
      {
        name: 'auth-token',
        value: 'mock-admin-jwt-token',
        domain: 'localhost',
        path: '/',
        expires: Date.now() + 1000 * 60 * 60 * 24, // 24 hours
        httpOnly: false,
        secure: false,
        sameSite: 'Lax'
      }
    ],
    origins: [
      {
        origin: baseURL,
        localStorage: [
          {
            name: 'user-role',
            value: 'admin'
          },
          {
            name: 'user-id',
            value: 'admin-123'
          },
          {
            name: 'user-name',
            value: 'Test Admin'
          },
          {
            name: 'user-email',
            value: 'admin@jaqedu.com'
          },
          {
            name: 'auth-token',
            value: 'mock-admin-jwt-token'
          },
          {
            name: 'test-mode',
            value: 'true'
          }
        ],
        sessionStorage: [
          {
            name: 'session-id',
            value: 'mock-admin-session-123'
          }
        ]
      }
    ]
  };
  
  fs.writeFileSync(
    path.join(authDir, 'admin-user.json'),
    JSON.stringify(adminAuthState, null, 2)
  );
  
  // Create mock regular user authentication state
  console.log('Creating mock user authentication state...');
  const userAuthState = {
    cookies: [
      {
        name: 'auth-token',
        value: 'mock-user-jwt-token',
        domain: 'localhost',
        path: '/',
        expires: Date.now() + 1000 * 60 * 60 * 24, // 24 hours
        httpOnly: false,
        secure: false,
        sameSite: 'Lax'
      }
    ],
    origins: [
      {
        origin: baseURL,
        localStorage: [
          {
            name: 'user-role',
            value: 'student'
          },
          {
            name: 'user-id',
            value: 'user-456'
          },
          {
            name: 'user-name',
            value: 'Test Student'
          },
          {
            name: 'user-email',
            value: 'student@jaqedu.com'
          },
          {
            name: 'auth-token',
            value: 'mock-user-jwt-token'
          },
          {
            name: 'test-mode',
            value: 'true'
          }
        ],
        sessionStorage: [
          {
            name: 'session-id',
            value: 'mock-user-session-456'
          }
        ]
      }
    ]
  };
  
  fs.writeFileSync(
    path.join(authDir, 'regular-user.json'),
    JSON.stringify(userAuthState, null, 2)
  );
  
  // Create mock test data fixtures
  console.log('Creating mock test data fixtures...');
  const mockModules = [
    {
      id: 'jung-basics',
      title: 'Fundamentos da Psicologia Jungiana',
      description: 'Introdução às teorias básicas de Carl Jung',
      difficulty: 'beginner',
      icon: '🧠',
      estimatedTime: 45,
      topics: ['Inconsciente Coletivo', 'Arquétipos', 'Individuação'],
      completed: false,
      progress: 0
    },
    {
      id: 'archetypes',
      title: 'Arquétipos Jungianos',
      description: 'Explorando os arquétipos fundamentais',
      difficulty: 'intermediate',
      icon: '🎭',
      estimatedTime: 60,
      topics: ['Sombra', 'Anima/Animus', 'Self'],
      completed: false,
      progress: 25
    },
    {
      id: 'individuation',
      title: 'Processo de Individuação',
      description: 'O caminho para a autorrealização',
      difficulty: 'advanced',
      icon: '🌟',
      estimatedTime: 90,
      topics: ['Integração', 'Transformação', 'Autorealização'],
      completed: false,
      progress: 0
    }
  ];
  
  const mockUserProgress = {
    userId: 'user-456',
    completedModules: [],
    totalTime: 120,
    currentStreak: 5,
    totalPoints: 250,
    level: 2
  };
  
  // Save mock data to fixtures
  const fixturesDir = path.join(__dirname, 'fixtures');
  if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(fixturesDir, 'mock-modules.json'),
    JSON.stringify(mockModules, null, 2)
  );
  
  fs.writeFileSync(
    path.join(fixturesDir, 'mock-user-progress.json'),
    JSON.stringify(mockUserProgress, null, 2)
  );
  
  console.log('Mock E2E global setup completed successfully!');
  console.log('- Admin auth state created');
  console.log('- User auth state created');
  console.log('- Mock test data fixtures created');
  console.log('- Test directories prepared');
}

export default globalSetup;