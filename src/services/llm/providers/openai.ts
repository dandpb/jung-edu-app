import { ILLMProvider, LLMResponse, LLMGenerationOptions } from '../types';

export class OpenAIProvider implements ILLMProvider {
  private apiKey: string;
  private model: string;
  private baseURL: string = 'https://api.openai.com/v1';

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || process.env.REACT_APP_OPENAI_API_KEY || '';
    this.model = model || process.env.REACT_APP_OPENAI_MODEL || 'gpt-3.5-turbo';
    
    if (!this.apiKey) {
      throw new Error('OpenAI API key is required. Set REACT_APP_OPENAI_API_KEY environment variable.');
    }
  }

  async generateCompletion(
    prompt: string,
    options?: LLMGenerationOptions
  ): Promise<LLMResponse> {
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2000,
        top_p: options?.topP ?? 1,
        frequency_penalty: options?.frequencyPenalty ?? 0,
        presence_penalty: options?.presencePenalty ?? 0,
        stop: options?.stopSequences
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens
      }
    };
  }

  async generateStructuredOutput<T>(
    prompt: string,
    schema: any,
    options?: LLMGenerationOptions
  ): Promise<T> {
    // Add JSON formatting instructions to the prompt
    const structuredPrompt = `${prompt}\n\nPlease respond with valid JSON that matches this schema:\n${JSON.stringify(schema, null, 2)}`;

    const response = await this.generateCompletion(structuredPrompt, {
      ...options,
      temperature: 0.3 // Lower temperature for structured output
    });

    try {
      const parsed = JSON.parse(response.content);
      return parsed as T;
    } catch (error) {
      console.error('Failed to parse structured output:', error);
      // Try to extract JSON from the response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          return parsed as T;
        } catch (e) {
          throw new Error('Failed to parse structured output from response');
        }
      }
      throw new Error('No valid JSON found in response');
    }
  }

  async streamCompletion(
    prompt: string,
    onChunk: (chunk: string) => void,
    options?: LLMGenerationOptions
  ): Promise<void> {
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2000,
        top_p: options?.topP ?? 1,
        frequency_penalty: options?.frequencyPenalty ?? 0,
        presence_penalty: options?.presencePenalty ?? 0,
        stop: options?.stopSequences,
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body reader available');
    }

    const decoder = new TextDecoder();
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                onChunk(content);
              }
            } catch (e) {
              // Skip invalid JSON lines
              continue;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}