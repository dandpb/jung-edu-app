/**
 * Service for testing prompt templates with actual LLM execution
 */

import { OpenAIProvider } from '../llm/provider';
import { MockLLMProvider } from '../llm/providers/mock';

export interface PromptTestResult {
  success: boolean;
  response?: string;
  error?: string;
  executionTime?: number;
  tokensUsed?: number;
}

class PromptTestService {
  private provider: any;
  private useMock: boolean = false;

  constructor() {
    // Check if OpenAI API key is available
    const apiKey = process.env.REACT_APP_OPENAI_API_KEY || localStorage.getItem('openai_api_key');
    
    if (apiKey && apiKey !== 'mock') {
      this.provider = new OpenAIProvider(apiKey);
      this.useMock = false;
    } else {
      // Use mock provider if no API key
      this.provider = new MockLLMProvider();
      this.useMock = true;
    }
  }

  /**
   * Test a prompt template with actual LLM execution
   */
  async testPrompt(compiledPrompt: string): Promise<PromptTestResult> {
    const startTime = Date.now();
    
    try {
      if (this.useMock) {
        // Generate mock response based on prompt
        const mockResponse = this.generateMockResponse(compiledPrompt);
        return {
          success: true,
          response: mockResponse,
          executionTime: Date.now() - startTime,
          tokensUsed: Math.floor(mockResponse.length / 4) // Approximate token count
        };
      }

      // Execute with real LLM
      const result = await this.provider.generateCompletion(compiledPrompt, {
        temperature: 0.7,
        maxTokens: 1000
      });

      return {
        success: true,
        response: result.content,
        executionTime: Date.now() - startTime,
        tokensUsed: result.usage?.totalTokens
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * Generate a mock response based on the prompt
   */
  private generateMockResponse(prompt: string): string {
    // Detect the type of prompt and generate appropriate mock response
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('introdução') || lowerPrompt.includes('introduction')) {
      return `# Introdução ao Tópico

Este é um exemplo de resposta gerada para demonstrar o funcionamento do sistema de prompts. Em um ambiente de produção com API key configurada, você receberá uma resposta real do modelo de IA.

## Conceitos Principais

A psicologia junguiana oferece uma perspectiva única sobre a mente humana, explorando conceitos como:

- **Inconsciente Coletivo**: Camada profunda da psique compartilhada por toda a humanidade
- **Arquétipos**: Padrões universais de comportamento e simbolismo
- **Processo de Individuação**: Jornada de desenvolvimento pessoal e autoconhecimento

## O que você aprenderá

Neste módulo, você irá:
1. Compreender os fundamentos teóricos
2. Aplicar conceitos na prática
3. Desenvolver uma visão crítica sobre o tema

Esta é uma prévia de demonstração. Configure sua API key do OpenAI para obter respostas reais e personalizadas.`;
    }
    
    if (lowerPrompt.includes('quiz') || lowerPrompt.includes('questão')) {
      return `[
  {
    "question": "Qual conceito junguiano representa padrões universais de comportamento?",
    "options": {
      "A": "Persona",
      "B": "Arquétipos",
      "C": "Complexos",
      "D": "Sombra"
    },
    "correct": "B",
    "explanation": "Os arquétipos são padrões universais e inatos que existem no inconsciente coletivo, influenciando comportamentos e percepções em todas as culturas."
  },
  {
    "question": "O que é o processo de individuação segundo Jung?",
    "options": {
      "A": "Isolamento social",
      "B": "Desenvolvimento do ego",
      "C": "Integração dos aspectos da psique",
      "D": "Repressão do inconsciente"
    },
    "correct": "C",
    "explanation": "A individuação é o processo de integração dos diferentes aspectos da psique, incluindo o consciente e o inconsciente, levando ao desenvolvimento do Self."
  }
]`;
    }
    
    if (lowerPrompt.includes('mapa mental') || lowerPrompt.includes('mind map')) {
      return `# Mapa Mental - Estrutura Hierárquica

## Conceito Central
- **Tópico Principal**
  
### Ramo 1: Fundamentos
- Conceito Base 1
  - Detalhe 1.1
  - Detalhe 1.2
- Conceito Base 2
  - Detalhe 2.1
  - Detalhe 2.2

### Ramo 2: Aplicações
- Aplicação Prática 1
  - Exemplo 1.1
  - Exemplo 1.2
- Aplicação Prática 2
  - Exemplo 2.1
  - Exemplo 2.2

### Ramo 3: Conexões
- Relação com outros conceitos
- Implicações práticas
- Desenvolvimentos futuros`;
    }
    
    if (lowerPrompt.includes('vídeo') || lowerPrompt.includes('youtube')) {
      return `1. "Introdução à Psicologia Junguiana - Aula Completa"
2. "Carl Jung e o Inconsciente Coletivo - Documentário Legendado"
3. "Arquétipos de Jung Explicados - Animação Didática"
4. "O Processo de Individuação - Palestra em Português"
5. "Jung e a Interpretação dos Sonhos - Tutorial Prático"
6. "A Sombra na Psicologia Analítica - Explicação Detalhada"
7. "Tipos Psicológicos de Jung - MBTI Explicado"
8. "Jung e a Espiritualidade - Conferência Brasileira"`;
    }
    
    if (lowerPrompt.includes('bibliografia') || lowerPrompt.includes('recursos')) {
      return `**O Homem e Seus Símbolos**
- Tipo: Livro
- Autor(es): Carl Gustav Jung
- Ano: 1964
- Descrição: Obra fundamental que apresenta os conceitos junguianos de forma acessível
- Link/Acesso: Disponível em português pela Editora Nova Fronteira
- Relevância: Introdução essencial aos conceitos de arquétipos e inconsciente coletivo

**Tipos Psicológicos**
- Tipo: Livro
- Autor(es): Carl Gustav Jung
- Ano: 1921
- Descrição: Desenvolvimento da teoria dos tipos psicológicos
- Link/Acesso: Editora Vozes, tradução brasileira disponível
- Relevância: Base para compreender as funções psíquicas e atitudes

**Curso Online: Introdução à Psicologia Junguiana**
- Tipo: Curso Online
- Autor(es): Instituto Junguiano
- Ano: 2023
- Descrição: Curso completo com certificação
- Link/Acesso: www.exemplo.com/curso-jung
- Relevância: Abordagem didática e atualizada dos conceitos principais`;
    }
    
    // Default response for any other type of prompt
    return `# Resposta de Demonstração

Este é um exemplo de resposta gerada pelo sistema de teste de prompts. 

## Informações Importantes

- **Status**: Modo de demonstração (sem API key configurada)
- **Tipo de Prompt**: Detectado automaticamente
- **Resposta**: Gerada localmente para fins de teste

## Como Obter Respostas Reais

Para obter respostas reais do modelo de IA:

1. Configure sua API key do OpenAI nas variáveis de ambiente
2. Adicione: REACT_APP_OPENAI_API_KEY=sua-chave-aqui
3. Reinicie a aplicação
4. Teste novamente o prompt

## Observações

Esta resposta de demonstração foi gerada com base no tipo de prompt detectado. Com uma API key válida, você receberá respostas personalizadas e de alta qualidade do modelo GPT-4.

---
*Resposta gerada em modo de demonstração*`;
  }

  /**
   * Check if using mock provider
   */
  isUsingMock(): boolean {
    return this.useMock;
  }
}

export const promptTestService = new PromptTestService();