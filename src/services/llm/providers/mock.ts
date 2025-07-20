import { ILLMProvider, LLMResponse, LLMGenerationOptions } from '../types';

export class MockLLMProvider implements ILLMProvider {
  async generateCompletion(
    prompt: string,
    options?: LLMGenerationOptions
  ): Promise<LLMResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      content: this.generateMockResponse(prompt),
      usage: {
        promptTokens: prompt.length / 4,
        completionTokens: 100,
        totalTokens: prompt.length / 4 + 100
      }
    };
  }

  async generateStructuredOutput<T>(
    prompt: string,
    schema: any,
    options?: LLMGenerationOptions
  ): Promise<T> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate mock structured data based on prompt content
    if (prompt.includes('extract key concepts')) {
      return this.generateMockConcepts(prompt) as unknown as T;
    } else if (prompt.includes('hierarchical learning structure')) {
      return this.generateMockHierarchy(prompt) as unknown as T;
    }

    // Default mock response
    return { concepts: [] } as unknown as T;
  }

  private generateMockResponse(prompt: string): string {
    if (prompt.includes('mind map')) {
      return 'Generated mind map structure with key concepts and relationships.';
    }
    return 'Mock response for: ' + prompt.substring(0, 50) + '...';
  }

  private generateMockConcepts(prompt: string) {
    // Extract module title from prompt
    const titleMatch = prompt.match(/Module: (.+?)\n/);
    const moduleTitle = titleMatch ? titleMatch[1] : 'Module';

    const mockConcepts = [
      {
        id: 'core-1',
        label: moduleTitle,
        description: 'The main concept of this module',
        importance: 'core',
        category: 'theoretical',
        parent: null,
        examples: ['Example 1', 'Example 2'],
        connections: []
      },
      {
        id: 'primary-1',
        label: 'Key Principle 1',
        description: 'An important principle related to the main concept',
        importance: 'primary',
        category: 'theoretical',
        parent: 'core-1',
        examples: ['Practical application 1'],
        connections: ['primary-2']
      },
      {
        id: 'primary-2',
        label: 'Key Principle 2',
        description: 'Another important principle',
        importance: 'primary',
        category: 'practical',
        parent: 'core-1',
        examples: ['Case study example'],
        connections: ['primary-1']
      },
      {
        id: 'secondary-1',
        label: 'Supporting Concept',
        description: 'A concept that supports the key principles',
        importance: 'secondary',
        category: 'theoretical',
        parent: 'primary-1',
        examples: [],
        connections: []
      },
      {
        id: 'detail-1',
        label: 'Specific Detail',
        description: 'A detailed aspect of the supporting concept',
        importance: 'detail',
        category: 'practical',
        parent: 'secondary-1',
        examples: ['Detailed example'],
        connections: []
      }
    ];

    return { concepts: mockConcepts };
  }

  private generateMockHierarchy(prompt: string) {
    // Return the same structure with some modifications
    const conceptsMatch = prompt.match(/Current concepts:\n([\s\S]+?)\n\nCreate/);
    if (conceptsMatch) {
      // Parse and return modified concepts
      return this.generateMockConcepts(prompt);
    }
    
    return { concepts: [] };
  }

  async streamCompletion(
    prompt: string,
    onChunk: (chunk: string) => void,
    options?: LLMGenerationOptions
  ): Promise<void> {
    // Simulate streaming by sending chunks with delays
    const response = this.generateMockResponse(prompt);
    const chunks = response.split(' ');
    
    for (const chunk of chunks) {
      await new Promise(resolve => setTimeout(resolve, 50)); // 50ms delay between chunks
      onChunk(chunk + ' ');
    }
  }
}