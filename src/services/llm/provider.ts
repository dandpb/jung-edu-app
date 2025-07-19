import OpenAI from 'openai';

/**
 * Interface for LLM providers
 */
export interface ILLMProvider {
  generateCompletion(prompt: string, options?: LLMGenerationOptions): Promise<string>;
  generateStructuredResponse<T>(prompt: string, schema: any, options?: LLMGenerationOptions): Promise<T>;
  getTokenCount(text: string): number;
  isAvailable(): Promise<boolean>;
}

export interface LLMGenerationOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  retries?: number;
  timeout?: number;
}

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

  async generateCompletion(prompt: string, options: LLMGenerationOptions = {}): Promise<string> {
    const {
      temperature = 0.7,
      maxTokens = 2000,
      systemPrompt = 'You are an educational content generator specializing in Jungian psychology.',
      retries = 3,
    } = options;

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

        return response.choices[0]?.message?.content || '';
      } catch (error) {
        lastError = error as Error;
        if (attempt < retries - 1) {
          await this.delay(Math.pow(2, attempt) * 1000); // Exponential backoff
        }
      }
    }

    throw new Error(`Failed after ${retries} attempts: ${lastError?.message}`);
  }

  async generateStructuredResponse<T>(prompt: string, schema: any, options: LLMGenerationOptions = {}): Promise<T> {
    const retries = options.retries || 3;
    
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
        let cleanedResponse = response.trim();
        
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
        console.log('Attempting to parse cleaned response:', cleanedResponse);
        const parsed = JSON.parse(cleanedResponse);
        console.log('Successfully parsed JSON:', parsed);
        return parsed as T;
        
      } catch (error) {
        console.warn(`Structured response attempt ${attempt + 1} failed:`, error);
        
        if (attempt === retries - 1) {
          console.error('All structured response attempts failed:', {
            prompt: prompt.substring(0, 200) + '...',
            lastError: error
          });
          throw new Error(`Failed to generate valid JSON after ${retries} attempts: ${error}`);
        }
        
        // Wait before retry
        await this.delay(1000 * (attempt + 1));
      }
    }
    
    throw new Error('Unexpected error in generateStructuredResponse');
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

  async generateCompletion(prompt: string, options: LLMGenerationOptions = {}): Promise<string> {
    await this.simulateDelay();
    
    // Generate mock content based on prompt keywords
    if (prompt.toLowerCase().includes('introduction')) {
      return 'This is a mock introduction to Jungian psychology concepts. Carl Jung developed analytical psychology as a comprehensive approach to understanding the human psyche.';
    }
    
    if (prompt.toLowerCase().includes('quiz')) {
      return 'Question: What is the collective unconscious according to Jung?\nAnswer: The collective unconscious is a part of the unconscious mind shared by all humanity.';
    }
    
    return 'Mock generated content for: ' + prompt.substring(0, 50) + '...';
  }

  async generateStructuredResponse<T>(prompt: string, schema: any, options: LLMGenerationOptions = {}): Promise<T> {
    await this.simulateDelay();
    
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
      
      // Generic array response
      return ['item1', 'item2', 'item3'] as any;
    }
    
    // Handle quiz questions
    if (prompt.toLowerCase().includes('quiz')) {
      return [
        {
          question: 'What is the collective unconscious?',
          options: ['Shared unconscious content', 'Personal memories', 'Conscious thoughts', 'Dreams'],
          correctAnswer: 0,
          explanation: 'The collective unconscious contains universal patterns shared by all humanity.',
          difficulty: 'medium',
          cognitiveLevel: 'understanding'
        }
      ] as any;
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