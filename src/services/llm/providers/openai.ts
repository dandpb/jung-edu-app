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
    const structuredPrompt = `${prompt}\n\nIMPORTANT: Responda APENAS com JSON válido, sem markdown ou formatação adicional. O JSON deve corresponder a este schema:\n${JSON.stringify(schema, null, 2)}`;

    const response = await this.generateCompletion(structuredPrompt, {
      ...options,
      temperature: 0.3 // Lower temperature for structured output
    });

    // Clean the response content
    let cleanContent = response.content.trim();
    
    // Remove markdown code blocks if present
    const codeBlockMatch = cleanContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      cleanContent = codeBlockMatch[1].trim();
    }
    
    // Remove any leading/trailing backticks or other markdown
    cleanContent = cleanContent.replace(/^`+|`+$/g, '');
    
    try {
      const parsed = JSON.parse(cleanContent);
      return parsed as T;
    } catch (error) {
      console.error('Falha ao analisar saída estruturada:', error);
      console.error('Conteúdo recebido:', response.content);
      
      // Try to extract JSON from the response using more aggressive patterns
      const jsonPatterns = [
        /\{[\s\S]*?\}/,  // Basic JSON object
        /\[[\s\S]*?\]/,  // JSON array
        /```json\s*([\s\S]*?)\s*```/i,  // JSON in code blocks
        /```\s*([\s\S]*?)\s*```/,  // Any code block
      ];
      
      for (const pattern of jsonPatterns) {
        const match = response.content.match(pattern);
        if (match) {
          try {
            const jsonString = match[1] || match[0];
            const parsed = JSON.parse(jsonString.trim());
            return parsed as T;
          } catch (e) {
            // Continue to next pattern
            continue;
          }
        }
      }
      
      throw new Error(`Nenhum JSON válido encontrado na resposta. Conteúdo: ${response.content.substring(0, 200)}...`);
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