import { OpenAI } from 'openai';
import { ILLMProvider, LLMGenerationOptions, LLMResponse } from './types';

/**
 * OpenAI implementation of LLM provider
 */
export class OpenAIProvider implements ILLMProvider {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string = 'gpt-4o-mini') {
    this.client = new OpenAI({ 
      apiKey,
      dangerouslyAllowBrowser: true // Allow browser usage for testing
    });
    this.model = model;
  }

  async generateCompletion(prompt: string, options: LLMGenerationOptions = {}): Promise<LLMResponse> {
    const {
      temperature = 0.7,
      maxTokens = 2000,
    } = options;

    const systemPrompt = 'You are an educational content generator specializing in Jungian psychology.';
    const retries = 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await this.client.chat.completions.create({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          temperature,
          max_tokens: maxTokens,
        });

        return {
          content: response.choices[0]?.message?.content || '',
          usage: response.usage ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens
          } : undefined
        };
      } catch (error) {
        lastError = error as Error;
        if (attempt < retries - 1) {
          await this.delay(Math.pow(2, attempt) * 1000); // Exponential backoff
        }
      }
    }

    throw new Error(`Failed after ${retries} attempts: ${lastError?.message}`);
  }

  async generateStructuredOutput<T>(prompt: string, schema: any, options: LLMGenerationOptions = {}): Promise<T> {
    const retries = 3;
    
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const structuredPrompt = `${prompt}

CRITICAL INSTRUCTION: You must respond with valid JSON only. No explanation, no markdown formatting, no code blocks.

Expected JSON schema:
${JSON.stringify(schema, null, 2)}

Response format: Return ONLY the JSON ${schema.type === 'array' ? 'array' : 'object'} that matches this schema.${schema.type === 'array' ? ' Start with [ and end with ].' : ' Start with { and end with }.'}`;
        
        const response = await this.generateCompletion(structuredPrompt, {
          ...options,
          temperature: options.temperature || 0.2, // Even lower temperature for structured output
        });

        // Clean the response - remove markdown code blocks and any non-JSON content
        let cleanedResponse = response.content.trim();
        
        // Remove markdown code blocks
        cleanedResponse = cleanedResponse.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
        
        // Find JSON boundaries (object or array)
        let jsonStart = cleanedResponse.indexOf('{');
        let jsonEnd = cleanedResponse.lastIndexOf('}');
        
        // Check if it's an array instead
        const arrayStart = cleanedResponse.indexOf('[');
        const arrayEnd = cleanedResponse.lastIndexOf(']');
        
        if (arrayStart !== -1 && (jsonStart === -1 || arrayStart < jsonStart)) {
          jsonStart = arrayStart;
          jsonEnd = arrayEnd;
        }
        
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
          cleanedResponse = cleanedResponse.substring(jsonStart, jsonEnd + 1);
        }
        
        // Try to parse the JSON
        const parsed = JSON.parse(cleanedResponse);
        return parsed as T;
        
      } catch (error) {
        if (attempt === retries - 1) {
          throw new Error(`Failed to generate valid JSON after ${retries} attempts: ${error}`);
        }
        
        // Wait before retry
        await this.delay(1000 * (attempt + 1));
      }
    }
    
    throw new Error('Unexpected error in generateStructuredOutput');
  }

  getTokenCount(text: string): number {
    // Rough approximation - in production, use tiktoken
    return Math.ceil(text.length / 4);
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.client.models.list();
      return true;
    } catch {
      return false;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Mock provider for development and testing
 */
export class MockLLMProvider implements ILLMProvider {
  private delay: number;

  constructor(delay: number = 500) {
    this.delay = delay;
  }

  async generateCompletion(prompt: string, options: LLMGenerationOptions = {}): Promise<LLMResponse> {
    await this.simulateDelay();
    
    let content: string;
    // Generate mock content based on prompt keywords
    if (prompt.toLowerCase().includes('introduction')) {
      content = 'This is a mock introduction to Jungian psychology concepts. Carl Jung developed analytical psychology as a comprehensive approach to understanding the human psyche.';
    } else if (prompt.toLowerCase().includes('quiz')) {
      content = 'Question: What is the collective unconscious according to Jung?\nAnswer: The collective unconscious is a part of the unconscious mind shared by all humanity.';
    } else {
      content = 'Mock generated content for: ' + prompt.substring(0, 50) + '...';
    }
    
    return {
      content,
      usage: {
        promptTokens: Math.ceil(prompt.length / 4),
        completionTokens: Math.ceil(content.length / 4),
        totalTokens: Math.ceil((prompt.length + content.length) / 4)
      }
    };
  }

  async generateStructuredOutput<T>(prompt: string, schema: any, options: LLMGenerationOptions = {}): Promise<T> {
    await this.simulateDelay();
    
    // Handle quiz questions first - they pass an empty array as schema
    if ((Array.isArray(schema) && schema.length === 0) || 
        prompt.toLowerCase().includes('quiz') || 
        prompt.toLowerCase().includes('questões')) {
      // Extract the number of questions requested from the prompt
      const countMatch = prompt.match(/(\d+)\s+(questions?|questões)/i);
      const count = countMatch ? parseInt(countMatch[1]) : 5;
      
      const mockQuestions = [];
      const difficulties = ['easy', 'medium', 'hard'];
      const cognitiveLevels = ['recall', 'understanding', 'application', 'analysis'];
      
      for (let i = 0; i < count; i++) {
        mockQuestions.push({
          question: `Mock question ${i + 1} about Jungian psychology?`,
          options: [
            `Correct answer for question ${i + 1}`,
            `Distractor A for question ${i + 1}`,
            `Distractor B for question ${i + 1}`,
            `Distractor C for question ${i + 1}`
          ],
          correctAnswer: 0,
          explanation: `This is the explanation for question ${i + 1} about Jungian concepts.`,
          difficulty: difficulties[i % difficulties.length],
          cognitiveLevel: cognitiveLevels[i % cognitiveLevels.length]
        });
      }
      
      return mockQuestions as any;
    }
    
    // Handle bibliography generation (Portuguese or English) first before other array checks
    if ((prompt.toLowerCase().includes('gere') && prompt.toLowerCase().includes('recursos educacionais')) ||
        (prompt.toLowerCase().includes('generate') && prompt.toLowerCase().includes('educational resources'))) {
      return [
        {
          type: 'book',
          authors: ['Jung, Carl Gustav'],
          title: prompt.includes('gere') ? 'O Homem e Seus Símbolos' : 'Man and His Symbols',
          year: 2016,
          publisher: prompt.includes('gere') ? 'Nova Fronteira' : 'Dell Publishing',
          url: 'https://books.google.com.br/books?id=exemplo123',
          abstract: prompt.includes('gere') ? 
            'Introdução acessível aos conceitos fundamentais da psicologia junguiana' :
            'Accessible introduction to fundamental Jungian concepts',
          relevance: prompt.includes('gere') ? 
            'Obra fundamental recomendada para iniciantes' :
            'Essential introductory work for beginners',
          jungianConcepts: ['arquétipos', 'inconsciente coletivo', 'símbolos'],
          readingLevel: 'beginner'
        },
        {
          type: 'article',
          authors: ['Silva, Maria'],
          title: prompt.includes('gere') ? 
            'A Sombra na Psicologia Junguiana: Uma Revisão' :
            'The Shadow in Jungian Psychology: A Review',
          year: 2022,
          journal: prompt.includes('gere') ? 
            'Revista Brasileira de Psicologia Analítica' :
            'Journal of Analytical Psychology',
          url: 'https://scielo.br/exemplo456',
          abstract: prompt.includes('gere') ?
            'Revisão sistemática sobre o conceito de sombra' :
            'Systematic review of the shadow concept',
          relevance: prompt.includes('gere') ?
            'Artigo atual com perspectiva brasileira' :
            'Current article with Brazilian perspective',
          jungianConcepts: ['sombra', 'projeção'],
          readingLevel: 'intermediate'
        }
      ] as any;
    }
    
    // Return mock structured data based on schema type
    if (schema && schema.type === 'array') {
      // Handle array schemas
      if (prompt.toLowerCase().includes('search queries') || prompt.toLowerCase().includes('youtube')) {
        return [
          'Jung psychology lecture',
          'analytical psychology tutorial',
          'Carl Jung concepts explained',
          'Jungian theory introduction',
          'collective unconscious video',
          'shadow work tutorial',
          'individuation process explained',
          'Jung archetypes lecture'
        ] as any;
      }
      
      if (prompt.toLowerCase().includes('section') || prompt.toLowerCase().includes('outline')) {
        return [
          {
            title: 'Introduction to the Topic',
            concepts: ['basic concepts', 'historical context'],
            duration: 15
          },
          {
            title: 'Core Principles',
            concepts: ['main theories', 'key ideas'],
            duration: 20
          },
          {
            title: 'Practical Applications',
            concepts: ['real-world examples', 'case studies'],
            duration: 15
          }
        ] as any;
      }
      
      // Generic array response - return objects instead of strings
      return [
        { id: 'item1', title: 'Item 1', content: 'Content 1' },
        { id: 'item2', title: 'Item 2', content: 'Content 2' },
        { id: 'item3', title: 'Item 3', content: 'Content 3' }
      ] as any;
    }
    
    
    // Generic array response for other cases - return objects
    if (schema && schema.type === 'array') {
      // If schema specifies object items, return objects
      if (schema.items && schema.items.type === 'object') {
        return [
          { id: 'mock1', name: 'Mock Item 1', value: 'Value 1' },
          { id: 'mock2', name: 'Mock Item 2', value: 'Value 2' }
        ] as any;
      }
      // Otherwise return simple array
      return ['item1', 'item2', 'item3'] as any;
    }
    
    // Handle video suggestions
    if (prompt.toLowerCase().includes('video')) {
      return [
        {
          title: 'Introduction to Jungian Psychology',
          description: 'Learn the basics of Jung\'s theories',
          url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
          duration: 15,
          relatedConcepts: ['introduction', 'basics']
        }
      ] as any;
    }
    
    
    // Default object response
    return {
      content: 'Mock generated content',
      type: 'default'
    } as any;
  }

  getTokenCount(text: string): number {
    return Math.ceil(text.length / 4);
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  private simulateDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, this.delay));
  }
}

/**
 * Factory for creating LLM providers
 */
export class LLMProviderFactory {
  static getProvider(): ILLMProvider {
    const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
    const model = process.env.REACT_APP_OPENAI_MODEL || 'gpt-4o-mini';
    
    if (apiKey) {
      console.log('Using OpenAI provider with model:', model);
      return new OpenAIProvider(apiKey, model);
    } else {
      console.log('No API key found, using mock provider');
      return new MockLLMProvider();
    }
  }
}