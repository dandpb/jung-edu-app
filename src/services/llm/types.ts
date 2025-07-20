export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface LLMGenerationOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
}

export interface ILLMProvider {
  generateCompletion(
    prompt: string,
    options?: LLMGenerationOptions
  ): Promise<LLMResponse>;
  
  generateStructuredOutput<T>(
    prompt: string,
    schema: any,
    options?: LLMGenerationOptions
  ): Promise<T>;
  
  streamCompletion?(
    prompt: string,
    onChunk: (chunk: string) => void,
    options?: LLMGenerationOptions
  ): Promise<void>;
}