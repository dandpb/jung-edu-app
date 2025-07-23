import { http, HttpResponse } from 'msw';
import { ModuleBuilder } from '../builders/moduleBuilder';
import { QuizBuilder } from '../builders/quizBuilder';

/**
 * MSW request handlers for API mocking (v2 syntax)
 */
export const handlers = [
  // Module endpoints
  http.get('/api/modules', () => {
    const modules = [
      ModuleBuilder.minimal(),
      ModuleBuilder.withConcept('shadow'),
      ModuleBuilder.withConcept('individuation')
    ];
    
    return HttpResponse.json({ modules });
  }),

  http.get('/api/modules/:id', ({ params }) => {
    const { id } = params;
    
    if (id === 'not-found') {
      return HttpResponse.json(
        { error: 'Module not found' },
        { status: 404 }
      );
    }
    
    const module = new ModuleBuilder()
      .withId(id as string)
      .withTitle(`Module ${id}`)
      .build();
    
    return HttpResponse.json({ module });
  }),

  http.post('/api/modules', async ({ request }) => {
    const body = await request.json() as any;
    
    const module = new ModuleBuilder()
      .withTitle(body.title || 'New Module')
      .withDescription(body.description || 'New module description')
      .build();
    
    return HttpResponse.json({ module }, { status: 201 });
  }),

  http.put('/api/modules/:id', async ({ params, request }) => {
    const { id } = params;
    const body = await request.json() as any;
    
    const module = new ModuleBuilder()
      .withId(id as string)
      .withTitle(body.title || 'Updated Module')
      .build();
    
    return HttpResponse.json({ module });
  }),

  http.delete('/api/modules/:id', () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Quiz endpoints
  http.get('/api/quizzes/:moduleId', ({ params }) => {
    const { moduleId } = params;
    
    const quiz = new QuizBuilder()
      .withTitle(`Quiz for Module ${moduleId}`)
      .withMixedQuestions(5)
      .build();
    
    return HttpResponse.json({ quiz });
  }),

  http.post('/api/quizzes/generate', async ({ request }) => {
    const body = await request.json() as any;
    
    const quiz = new QuizBuilder()
      .withTitle(body.title || 'Generated Quiz')
      .withMixedQuestions(body.questionCount || 10, {
        concepts: body.concepts,
        difficulties: body.difficulties
      })
      .build();
    
    return HttpResponse.json({ quiz }, { status: 201 });
  }),

  http.post('/api/quizzes/:quizId/submit', async ({ request }) => {
    const body = await request.json() as any;
    const { answers } = body;
    
    // Simulate scoring
    const score = Math.floor(Math.random() * 40) + 60; // 60-100
    const passed = score >= 70;
    
    return HttpResponse.json({
      score,
      passed,
      totalQuestions: answers.length,
      correctAnswers: Math.floor(answers.length * (score / 100))
    });
  }),

  // AI/LLM endpoints
  http.post('/api/ai/completion', async ({ request }) => {
    const body = await request.json() as any;
    
    return HttpResponse.json({
      completion: `Mock AI response for: ${body.prompt}`,
      tokens: 150
    });
  }),

  http.post('/api/ai/structured', async ({ request }) => {
    const body = await request.json() as any;
    
    // Return structured data based on the prompt
    if (body.prompt.includes('quiz')) {
      return HttpResponse.json({
        data: QuizBuilder.basic(5).questions
      });
    }
    
    if (body.prompt.includes('module')) {
      return HttpResponse.json({
        data: {
          title: 'AI Generated Module',
          concepts: ['Concept 1', 'Concept 2'],
          objectives: ['Objective 1', 'Objective 2']
        }
      });
    }
    
    return HttpResponse.json({
      data: { message: 'Generic structured response' }
    });
  }),

  // Video endpoints
  http.get('/api/videos/youtube/:videoId', ({ params }) => {
    const { videoId } = params;
    
    return HttpResponse.json({
      id: videoId,
      title: `Mock Video ${videoId}`,
      duration: 600,
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      description: 'Mock video description'
    });
  }),

  // Mind map endpoints
  http.post('/api/mindmaps/generate', async ({ request }) => {
    const body = await request.json() as any;
    
    return HttpResponse.json({
      mindMap: {
        id: 'mindmap-123',
        title: body.title || 'Generated Mind Map',
        centralNode: {
          id: 'central',
          label: body.concept || 'Central Concept',
          type: 'central'
        },
        nodes: [
          { id: 'node1', label: 'Branch 1', type: 'primary' },
          { id: 'node2', label: 'Branch 2', type: 'primary' }
        ],
        edges: [
          { source: 'central', target: 'node1' },
          { source: 'central', target: 'node2' }
        ]
      }
    }, { status: 201 });
  }),

  // Authentication endpoints
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as any;
    
    if (body.email === 'test@example.com' && body.password === 'password') {
      return HttpResponse.json({
        token: 'mock-jwt-token',
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User'
        }
      });
    }
    
    return HttpResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  }),

  http.get('/api/auth/me', ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (authHeader === 'Bearer mock-jwt-token') {
      return HttpResponse.json({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User'
      });
    }
    
    return HttpResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }),

  // Health check
  http.get('/api/health', () => {
    return HttpResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString()
    });
  })
];

/**
 * Error handlers for testing error scenarios
 */
export const errorHandlers = [
  http.get('/api/modules', () => {
    return HttpResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }),

  http.post('/api/*', () => {
    return HttpResponse.json(
      { error: 'Service unavailable' },
      { status: 503 }
    );
  })
];