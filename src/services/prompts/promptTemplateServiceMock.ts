/**
 * Mock implementation of prompt template service for when database tables don't exist yet
 * This allows the application to run while the database is being set up
 */

import { 
  PromptTemplate, 
  PromptTemplateVersion, 
  PromptCategory
} from './promptTemplateService';

class PromptTemplateServiceMock {
  private templates: Map<string, PromptTemplate> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
  }

  // Public method to reset templates to initial state (for testing)
  initialize() {
    this.templates.clear();
    this.initializeDefaultTemplates();
  }

  private initializeDefaultTemplates() {
    // Add default templates for all LLM generators
    const defaultTemplates: PromptTemplate[] = [
      // Content Generation Templates
      {
        id: 'default-content-intro',
        key: 'content.introduction',
        category: 'content',
        name: 'Introdução de Módulo',
        description: 'Template para gerar introduções de módulos educacionais',
        template: `Crie uma introdução envolvente para um módulo de psicologia junguiana sobre "{{topic}}".

Público-alvo: {{targetAudience}}

Objetivos de aprendizagem:
{{objectives}}

Requisitos:
- Prenda o leitor com uma abertura interessante
- Introduza brevemente os principais conceitos
- Explique por que este tópico é importante na psicologia junguiana
- Defina expectativas para o que os estudantes aprenderão
- Mantenha entre {{minWords}}-{{maxWords}} palavras
- IMPORTANTE: Escreva TODO o conteúdo em português brasileiro (pt-BR)

Formate usando Markdown:
- Use **negrito** para enfatizar conceitos-chave
- Use *itálico* para ênfase sutil
- Inclua um parágrafo de abertura atraente
- Estruture com parágrafos claros`,
        variables: [
          { name: 'topic', type: 'text', description: 'Tópico do módulo', required: true },
          { name: 'targetAudience', type: 'text', description: 'Público-alvo', required: true, defaultValue: 'intermediate' },
          { name: 'objectives', type: 'text', description: 'Objetivos de aprendizagem', required: false },
          { name: 'minWords', type: 'number', description: 'Mínimo de palavras', required: false, defaultValue: 200 },
          { name: 'maxWords', type: 'number', description: 'Máximo de palavras', required: false, defaultValue: 300 }
        ],
        language: 'pt-BR',
        isActive: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'default-content-section',
        key: 'content.section',
        category: 'content',
        name: 'Seção de Conteúdo',
        description: 'Template para gerar seções detalhadas de conteúdo',
        template: `Escreva conteúdo detalhado para a seção "{{sectionTitle}}" em um módulo de psicologia junguiana sobre "{{mainTopic}}".

Público-alvo: {{targetAudience}}
{{#if usesSimpleLanguage}}Use linguagem simples e acessível para iniciantes.{{/if}}

{{#if learningObjectives}}
Objetivos de aprendizagem específicos:
{{learningObjectives}}
{{/if}}

{{#if prerequisites}}
Pré-requisitos:
{{prerequisites}}
{{/if}}

Conceitos-chave a cobrir:
{{concepts}}

Requisitos:
- Explique conceitos claramente com exemplos
- Inclua terminologia junguiana relevante
- Use metáforas ou analogias quando útil
- Referencie o trabalho original de Jung quando aplicável
- Inclua aplicações práticas ou exercícios
- Busque {{targetWords}} palavras
- IMPORTANTE: Escreva TODO o conteúdo em português brasileiro (pt-BR)

Formate usando Markdown:
- Use ## para subtítulos
- Use **negrito** para termos importantes
- Use listas quando apropriado
- Inclua citações relevantes quando possível`,
        variables: [
          { name: 'sectionTitle', type: 'text', description: 'Título da seção', required: true },
          { name: 'mainTopic', type: 'text', description: 'Tópico principal do módulo', required: true },
          { name: 'targetAudience', type: 'text', description: 'Público-alvo', required: true },
          { name: 'usesSimpleLanguage', type: 'boolean', description: 'Usar linguagem simples', required: false, defaultValue: false },
          { name: 'learningObjectives', type: 'text', description: 'Objetivos de aprendizagem', required: false },
          { name: 'prerequisites', type: 'text', description: 'Pré-requisitos', required: false },
          { name: 'concepts', type: 'text', description: 'Conceitos-chave', required: true },
          { name: 'targetWords', type: 'text', description: 'Número de palavras alvo', required: false, defaultValue: '400-600' }
        ],
        language: 'pt-BR',
        isActive: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Quiz Generation Templates
      {
        id: 'default-quiz-questions',
        key: 'quiz.questions',
        category: 'quiz',
        name: 'Questões de Quiz',
        description: 'Template para gerar questões de múltipla escolha',
        template: `Gere exatamente {{count}} questões de múltipla escolha para um quiz de psicologia junguiana sobre "{{topic}}".

Objetivos de aprendizagem a avaliar:
{{objectives}}

{{#if contentSummary}}
Contexto do conteúdo:
{{contentSummary}}
{{/if}}

Requisitos para cada questão:
- Teste compreensão real, não apenas memorização
- Inclua 4 opções de resposta (A, B, C, D)
- Apenas uma resposta correta por questão
- Forneça uma explicação detalhada para a resposta correta
- Varie os níveis de dificuldade
- IMPORTANTE: Escreva TODAS as questões, opções e explicações em português brasileiro (pt-BR)

Formate cada questão como um objeto JSON:
{
  "question": "texto da pergunta",
  "options": {
    "A": "opção A",
    "B": "opção B",
    "C": "opção C",
    "D": "opção D"
  },
  "correct": "letra da resposta correta",
  "explanation": "explicação detalhada"
}`,
        variables: [
          { name: 'count', type: 'number', description: 'Número de questões', required: true, defaultValue: 10 },
          { name: 'topic', type: 'text', description: 'Tópico do quiz', required: true },
          { name: 'objectives', type: 'text', description: 'Objetivos de aprendizagem', required: false },
          { name: 'contentSummary', type: 'text', description: 'Resumo do conteúdo', required: false }
        ],
        language: 'pt-BR',
        isActive: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Video Generation Templates
      {
        id: 'default-video-search',
        key: 'video.search_queries',
        category: 'video',
        name: 'Queries de Busca de Vídeos',
        description: 'Template para gerar queries de busca no YouTube',
        template: `Gere exatamente {{queryCount}} queries de busca do YouTube para encontrar vídeos educacionais sobre "{{topic}}" em psicologia junguiana.

{{#if targetAudience}}
Público-alvo: {{targetAudience}}
{{/if}}

Conceitos-chave a cobrir:
{{concepts}}

Requisitos para as queries:
- Varie entre termos específicos e gerais
- Inclua nomes de psicólogos junguianos conhecidos quando relevante
- Adicione termos como "aula", "palestra", "explicação"
- Inclua variações em português e inglês
- IMPORTANTE: As queries devem incluir termos em português (legendado, português, Brasil)

Formate cada query em uma linha separada:
1. query 1
2. query 2
3. query 3`,
        variables: [
          { name: 'queryCount', type: 'number', description: 'Número de queries', required: true, defaultValue: 8 },
          { name: 'topic', type: 'text', description: 'Tópico dos vídeos', required: true },
          { name: 'concepts', type: 'text', description: 'Conceitos-chave', required: true },
          { name: 'targetAudience', type: 'text', description: 'Público-alvo', required: false }
        ],
        language: 'pt-BR',
        isActive: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Bibliography Generation Templates
      {
        id: 'default-bibliography-resources',
        key: 'bibliography.resources',
        category: 'bibliography',
        name: 'Recursos Bibliográficos',
        description: 'Template para gerar lista de recursos educacionais',
        template: `Gere {{count}} recursos educacionais sobre "{{topic}}" em psicologia junguiana com LINKS ACESSÍVEIS.

Conceitos-chave: {{concepts}}
Nível: {{level}}

Tipos de recursos a incluir:
{{resourceTypes}}

Requisitos:
- Priorize recursos em português ou com tradução disponível
- Inclua uma variedade de tipos de mídia
- Forneça links reais e acessíveis quando possível
- Para livros, inclua ISBN quando disponível
- Ordene por relevância e acessibilidade
- IMPORTANTE: Descreva cada recurso em português brasileiro

Formate cada recurso como:
**Título do Recurso**
- Tipo: [tipo de recurso]
- Autor(es): [nomes]
- Ano: [ano]
- Descrição: [breve descrição]
- Link/Acesso: [URL ou forma de acesso]
- Relevância: [por que é útil para este tópico]`,
        variables: [
          { name: 'count', type: 'number', description: 'Número de recursos', required: true, defaultValue: 10 },
          { name: 'topic', type: 'text', description: 'Tópico dos recursos', required: true },
          { name: 'concepts', type: 'text', description: 'Conceitos-chave', required: true },
          { name: 'level', type: 'text', description: 'Nível de dificuldade', required: true, defaultValue: 'intermediário' },
          { name: 'resourceTypes', type: 'text', description: 'Tipos de recursos', required: false, defaultValue: 'livros digitais, artigos acadêmicos, vídeos, cursos online, podcasts' }
        ],
        language: 'pt-BR',
        isActive: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Jung Module Generation Templates
      {
        id: 'jung-module-introduction',
        key: 'jung.module.introduction',
        category: 'jung',
        name: 'Introdução de Módulo Jung',
        description: 'Template para gerar introduções de módulos sobre psicologia junguiana',
        template: `Escreva uma introdução envolvente e educativa sobre "{{topic}}" na psicologia junguiana.

Público-alvo: {{targetAudience}}
Objetivos de aprendizagem:
{{objectives}}

Requisitos da introdução:
- Entre {{minWords}} e {{maxWords}} palavras
- Comece com uma contextualização histórica ou conceitual
- Explique a relevância do tópico na psicologia analítica
- Conecte com a vida cotidiana do leitor
- Use linguagem {{languageStyle}}
- Inclua uma visão geral do que será abordado
- Termine com uma reflexão motivadora

IMPORTANTE: Escreva em português brasileiro claro e acessível.`,
        variables: [
          { name: 'topic', type: 'text', description: 'Tópico do módulo', required: true },
          { name: 'targetAudience', type: 'text', description: 'Descrição do público-alvo', required: true },
          { name: 'objectives', type: 'text', description: 'Objetivos de aprendizagem', required: true },
          { name: 'minWords', type: 'number', description: 'Mínimo de palavras', required: true, defaultValue: 250 },
          { name: 'maxWords', type: 'number', description: 'Máximo de palavras', required: true, defaultValue: 400 },
          { name: 'languageStyle', type: 'text', description: 'Estilo de linguagem', required: false, defaultValue: 'acessível e didática' }
        ],
        language: 'pt-BR',
        isActive: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      {
        id: 'jung-section-content',
        key: 'jung.section.content',
        category: 'jung',
        name: 'Conteúdo de Seção Jung',
        description: 'Template para gerar conteúdo de seções específicas',
        template: `Desenvolva um conteúdo detalhado sobre "{{sectionTitle}}" dentro do contexto de {{mainTopic}} na psicologia junguiana.

Público-alvo: {{targetAudience}}
{{#if usesSimpleLanguage}}
Use linguagem simples e exemplos práticos para iniciantes.
{{/if}}

Conceitos a abordar:
{{concepts}}

Estrutura do conteúdo:
1. Definição e contextualização do conceito
2. Relação com outros conceitos junguianos
3. Exemplos práticos e manifestações
4. Importância no processo de individuação
5. Aplicações terapêuticas ou de autoconhecimento

Extensão: {{targetWords}} palavras

Requisitos:
- Cite conceitos fundamentais de Jung quando relevante
- Use exemplos da vida cotidiana
- Inclua analogias para facilitar a compreensão
- Mantenha rigor conceitual sem ser hermético
- Conecte teoria e prática

IMPORTANTE: Todo o conteúdo deve estar em português brasileiro.`,
        variables: [
          { name: 'sectionTitle', type: 'text', description: 'Título da seção', required: true },
          { name: 'mainTopic', type: 'text', description: 'Tópico principal do módulo', required: true },
          { name: 'targetAudience', type: 'text', description: 'Descrição do público-alvo', required: true },
          { name: 'usesSimpleLanguage', type: 'boolean', description: 'Usar linguagem simplificada', required: false, defaultValue: false },
          { name: 'concepts', type: 'text', description: 'Conceitos a abordar', required: true },
          { name: 'targetWords', type: 'text', description: 'Número aproximado de palavras', required: false, defaultValue: '500-700' }
        ],
        language: 'pt-BR',
        isActive: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      {
        id: 'jung-conclusion',
        key: 'jung.conclusion',
        category: 'jung',
        name: 'Conclusão de Módulo Jung',
        description: 'Template para gerar conclusões inspiradoras',
        template: `Escreva uma conclusão inspiradora ({{minWords}}-{{maxWords}} palavras) para um módulo sobre "{{topic}}" 
que cobriu os seguintes conceitos: {{concepts}}.

Requisitos:
- Sintetize os principais aprendizados
- Conecte com a jornada de individuação pessoal
- Incentive a aplicação prática
- Sugira próximos passos no estudo
- Use linguagem motivadora em português brasileiro
- Inclua uma reflexão final sobre o significado do tema para o desenvolvimento pessoal`,
        variables: [
          { name: 'topic', type: 'text', description: 'Tópico do módulo', required: true },
          { name: 'concepts', type: 'text', description: 'Conceitos abordados', required: true },
          { name: 'minWords', type: 'number', description: 'Mínimo de palavras', required: true, defaultValue: 200 },
          { name: 'maxWords', type: 'number', description: 'Máximo de palavras', required: true, defaultValue: 250 }
        ],
        language: 'pt-BR',
        isActive: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      {
        id: 'jung-key-takeaways',
        key: 'jung.key_takeaways',
        category: 'jung',
        name: 'Principais Aprendizados Jung',
        description: 'Template para gerar principais aprendizados de módulos',
        template: `Liste {{count}} principais aprendizados (key takeaways) do módulo sobre "{{topic}}" na psicologia junguiana.

Conceitos abordados: {{concepts}}

Formato dos takeaways:
- Cada item deve ser uma frase completa e independente
- Comece com um verbo de ação quando possível
- Máximo de {{maxWords}} palavras por item
- Foque em insights práticos e aplicáveis
- Conecte teoria junguiana com desenvolvimento pessoal
- Evite jargões desnecessários

IMPORTANTE: Todos os takeaways devem estar em português brasileiro.`,
        variables: [
          { name: 'count', type: 'number', description: 'Número de takeaways', required: true, defaultValue: 5 },
          { name: 'topic', type: 'text', description: 'Tópico do módulo', required: true },
          { name: 'concepts', type: 'text', description: 'Conceitos abordados', required: true },
          { name: 'maxWords', type: 'number', description: 'Máximo de palavras por item', required: false, defaultValue: 20 }
        ],
        language: 'pt-BR',
        isActive: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      {
        id: 'jung-learning-objectives',
        key: 'jung.learning_objectives', 
        category: 'jung',
        name: 'Objetivos de Aprendizagem Jung',
        description: 'Template para gerar objetivos de aprendizagem específicos',
        template: `Defina {{count}} objetivos de aprendizagem claros e mensuráveis para o módulo sobre "{{topic}}" na psicologia junguiana.

Nível do público: {{audienceLevel}}
Conceitos principais: {{concepts}}

Use verbos de ação específicos e foque em:
- Compreensão teórica
- Aplicação prática
- Desenvolvimento pessoal
- Pensamento crítico

IMPORTANTE: Todos os objetivos devem estar em português brasileiro e ser realizáveis.`,
        variables: [
          { name: 'count', type: 'number', description: 'Número de objetivos', required: true, defaultValue: 5 },
          { name: 'topic', type: 'text', description: 'Tópico do módulo', required: true },
          { name: 'audienceLevel', type: 'text', description: 'Nível do público', required: true },
          { name: 'concepts', type: 'text', description: 'Conceitos principais', required: true }
        ],
        language: 'pt-BR',
        isActive: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Quiz Question Templates - Centralizados do quizTemplates.ts
      {
        id: 'quiz-concept-identification',
        key: 'quiz.concept_identification',
        category: 'quiz',
        name: 'Identificação de Conceito',
        description: 'Template para questões de identificação de conceitos junguianos',
        template: `Qual das seguintes opções melhor descreve o conceito de {{concept}} segundo Jung?

Opções:
- Definição correta com características principais
- Conceito similar de teoria diferente
- Definição parcial faltando elemento chave
- Equívoco comum

Explicação: Jung definiu {{concept}} como {{definition}}. Isso difere de {{misconception}} porque {{distinction}}.`,
        variables: [
          { name: 'concept', type: 'text', description: 'Conceito a ser identificado', required: true },
          { name: 'definition', type: 'text', description: 'Definição correta', required: true },
          { name: 'misconception', type: 'text', description: 'Equívoco comum', required: true },
          { name: 'distinction', type: 'text', description: 'Distinção importante', required: true }
        ],
        language: 'pt-BR',
        isActive: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      {
        id: 'quiz-archetype-analysis',
        key: 'quiz.archetype_analysis',
        category: 'quiz',
        name: 'Análise de Arquétipo',
        description: 'Template para questões de análise de arquétipos',
        template: `No seguinte cenário, qual arquétipo está mais proeminentemente manifestado: {{scenario}}?

Opções:
- Arquétipo correto com justificativa
- Arquétipo relacionado mas distinto
- Interpretação superficial
- Arquétipo mal aplicado

Explicação: Este cenário ilustra o {{archetype}} porque {{key_features}}. Indicadores principais incluem {{evidence}}.`,
        variables: [
          { name: 'scenario', type: 'text', description: 'Cenário para análise', required: true },
          { name: 'archetype', type: 'text', description: 'Arquétipo correto', required: true },
          { name: 'key_features', type: 'text', description: 'Características principais', required: true },
          { name: 'evidence', type: 'text', description: 'Evidências no cenário', required: true }
        ],
        language: 'pt-BR',
        isActive: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      {
        id: 'quiz-psychological-type',
        key: 'quiz.psychological_type',
        category: 'quiz',
        name: 'Identificação de Tipo Psicológico',
        description: 'Template para questões sobre tipos psicológicos',
        template: `Baseado no seguinte padrão de comportamento, qual tipo psicológico é mais provável: {{behavior}}?

Opções:
- Tipo correto com pilha de funções
- Tipo oposto
- Similar mas com função dominante diferente
- Identificação estereotipada incorreta

Explicação: Este padrão sugere {{type}} com função dominante {{function}}. Os indicadores principais são {{behaviors}} que demonstram {{cognitive_process}}.`,
        variables: [
          { name: 'behavior', type: 'text', description: 'Padrão de comportamento', required: true },
          { name: 'type', type: 'text', description: 'Tipo psicológico', required: true },
          { name: 'function', type: 'text', description: 'Função dominante', required: true },
          { name: 'behaviors', type: 'text', description: 'Comportamentos indicadores', required: true },
          { name: 'cognitive_process', type: 'text', description: 'Processo cognitivo', required: true }
        ],
        language: 'pt-BR',
        isActive: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      {
        id: 'quiz-dream-interpretation',
        key: 'quiz.dream_interpretation',
        category: 'quiz',
        name: 'Interpretação de Símbolos em Sonhos',
        description: 'Template para questões de interpretação de sonhos',
        template: `O que o símbolo de {{symbol}} pode representar em um sonho, segundo a análise junguiana?

Na análise de sonhos junguiana, {{symbol}} frequentemente representa {{meaning}}. Considere associações pessoais, contexto cultural e função compensatória.`,
        variables: [
          { name: 'symbol', type: 'text', description: 'Símbolo do sonho', required: true },
          { name: 'meaning', type: 'text', description: 'Significado potencial', required: true }
        ],
        language: 'pt-BR',
        isActive: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      {
        id: 'quiz-individuation-process',
        key: 'quiz.individuation_process',
        category: 'quiz',
        name: 'Processo de Individuação',
        description: 'Template para questões sobre individuação',
        template: `Descreva como {{situation}} se relaciona com o processo de individuação.

Aspectos principais a considerar: {{aspects}}. O processo de individuação envolve {{stages}} e esta situação reflete {{specific_stage}}.`,
        variables: [
          { name: 'situation', type: 'text', description: 'Situação para análise', required: true },
          { name: 'aspects', type: 'text', description: 'Aspectos a considerar', required: true },
          { name: 'stages', type: 'text', description: 'Estágios do processo', required: true },
          { name: 'specific_stage', type: 'text', description: 'Estágio específico', required: true }
        ],
        language: 'pt-BR',
        isActive: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      {
        id: 'quiz-shadow-work',
        key: 'quiz.shadow_work',
        category: 'quiz',
        name: 'Trabalho com a Sombra',
        description: 'Template para questões sobre projeção da sombra',
        template: `Qual das seguintes opções representa um exemplo de projeção da sombra em {{context}}?

Opções:
- Projeção clara com conteúdo inconsciente
- Crítica consciente sem projeção
- Projeção parcial com alguma consciência
- Mal-entendido como sombra (na verdade consciente)

Explicação: A projeção da sombra ocorre quando {{unconscious_content}} é atribuído a outros. Aqui, {{specific_example}} mostra isso porque {{evidence}}.`,
        variables: [
          { name: 'context', type: 'text', description: 'Contexto da projeção', required: true },
          { name: 'unconscious_content', type: 'text', description: 'Conteúdo inconsciente', required: true },
          { name: 'specific_example', type: 'text', description: 'Exemplo específico', required: true },
          { name: 'evidence', type: 'text', description: 'Evidência da projeção', required: true }
        ],
        language: 'pt-BR',
        isActive: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Templates de Distratores e Explicações
      {
        id: 'quiz-distractor-patterns',
        key: 'quiz.distractor_patterns',
        category: 'quiz',
        name: 'Padrões de Distratores',
        description: 'Template para gerar distratores plausíveis',
        template: `Para o conceito {{concept}}, crie distratores baseados em:

1. Confusão com teoria similar (ex: Freud): {{similar_theory}}
2. Simplificação excessiva: {{oversimplification}}
3. Generalização incorreta: {{overgeneralization}}
4. Equívoco comum: {{common_misconception}}

Cada distrator deve parecer plausível mas conter um erro conceitual específico.`,
        variables: [
          { name: 'concept', type: 'text', description: 'Conceito principal', required: true },
          { name: 'similar_theory', type: 'text', description: 'Teoria similar mas diferente', required: false },
          { name: 'oversimplification', type: 'text', description: 'Versão simplificada demais', required: false },
          { name: 'overgeneralization', type: 'text', description: 'Generalização incorreta', required: false },
          { name: 'common_misconception', type: 'text', description: 'Equívoco comum', required: false }
        ],
        language: 'pt-BR',
        isActive: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Templates de Feedback e Explicações
      {
        id: 'quiz-explanation-template',
        key: 'quiz.explanation_template',
        category: 'quiz',
        name: 'Template de Explicação',
        description: 'Template para gerar explicações detalhadas',
        template: `Explicação para a questão sobre {{topic}}:

✅ Por que a resposta está correta:
{{correct_explanation}}

❌ Por que as outras opções estão incorretas:
{{incorrect_explanations}}

💡 Insight Principal:
{{key_insight}}

📚 Aplicação Prática:
{{practical_application}}

📖 Referências:
{{references}}`,
        variables: [
          { name: 'topic', type: 'text', description: 'Tópico da questão', required: true },
          { name: 'correct_explanation', type: 'text', description: 'Explicação da resposta correta', required: true },
          { name: 'incorrect_explanations', type: 'text', description: 'Explicações das incorretas', required: true },
          { name: 'key_insight', type: 'text', description: 'Insight principal', required: true },
          { name: 'practical_application', type: 'text', description: 'Aplicação prática', required: true },
          { name: 'references', type: 'text', description: 'Referências bibliográficas', required: false }
        ],
        language: 'pt-BR',
        isActive: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Templates para diferentes níveis de dificuldade
      {
        id: 'quiz-difficulty-beginner',
        key: 'quiz.difficulty_beginner',
        category: 'quiz',
        name: 'Questões Nível Iniciante',
        description: 'Template para questões de nível iniciante',
        template: `Crie {{count}} questões de nível INICIANTE sobre {{topic}} em psicologia junguiana.

Características das questões:
- Foco em definições básicas e identificação
- Evitar integração complexa de conceitos
- Usar linguagem simples e acessível
- Incluir contexto quando necessário
- 50% fácil, 40% médio, 10% difícil

Conceitos a avaliar:
{{concepts}}

Todas as questões devem estar em português brasileiro.`,
        variables: [
          { name: 'count', type: 'number', description: 'Número de questões', required: true },
          { name: 'topic', type: 'text', description: 'Tópico', required: true },
          { name: 'concepts', type: 'text', description: 'Conceitos a avaliar', required: true }
        ],
        language: 'pt-BR',
        isActive: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      {
        id: 'quiz-difficulty-intermediate',
        key: 'quiz.difficulty_intermediate',
        category: 'quiz',
        name: 'Questões Nível Intermediário',
        description: 'Template para questões de nível intermediário',
        template: `Crie {{count}} questões de nível INTERMEDIÁRIO sobre {{topic}} em psicologia junguiana.

Características das questões:
- Aplicação de conceitos em situações
- Diferenciação entre conceitos similares
- Análise básica de casos
- 20% fácil, 60% médio, 20% difícil

Conceitos a avaliar:
{{concepts}}

Todas as questões devem estar em português brasileiro.`,
        variables: [
          { name: 'count', type: 'number', description: 'Número de questões', required: true },
          { name: 'topic', type: 'text', description: 'Tópico', required: true },
          { name: 'concepts', type: 'text', description: 'Conceitos a avaliar', required: true }
        ],
        language: 'pt-BR',
        isActive: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      {
        id: 'quiz-difficulty-advanced',
        key: 'quiz.difficulty_advanced',
        category: 'quiz',
        name: 'Questões Nível Avançado',
        description: 'Template para questões de nível avançado',
        template: `Crie {{count}} questões de nível AVANÇADO sobre {{topic}} em psicologia junguiana.

Características das questões:
- Síntese e integração de múltiplos conceitos
- Análise crítica e nuançada
- Casos complexos e sutis
- 10% fácil, 40% médio, 50% difícil

Conceitos a avaliar:
{{concepts}}

Todas as questões devem estar em português brasileiro.`,
        variables: [
          { name: 'count', type: 'number', description: 'Número de questões', required: true },
          { name: 'topic', type: 'text', description: 'Tópico', required: true },
          { name: 'concepts', type: 'text', description: 'Conceitos a avaliar', required: true }
        ],
        language: 'pt-BR',
        isActive: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.key, template);
    });
  }

  async getTemplates(category?: string): Promise<PromptTemplate[]> {
    const templates = Array.from(this.templates.values());
    if (category) {
      return templates.filter(t => t.category === category);
    }
    return templates;
  }

  async getTemplateByKey(key: string): Promise<PromptTemplate | null> {
    return this.templates.get(key) || null;
  }

  async createTemplate(template: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<PromptTemplate> {
    const newTemplate: PromptTemplate = {
      ...template,
      id: `template-${Date.now()}`,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.templates.set(newTemplate.key, newTemplate);
    return newTemplate;
  }

  async updateTemplate(id: string, updates: Partial<PromptTemplate>): Promise<PromptTemplate> {
    const template = Array.from(this.templates.values()).find(t => t.id === id);
    if (!template) {
      throw new Error('Template not found');
    }
    
    const updatedTemplate = {
      ...template,
      ...updates,
      updatedAt: new Date(),
      version: template.version + 1
    };
    
    this.templates.set(template.key, updatedTemplate);
    return updatedTemplate;
  }

  async deleteTemplate(id: string): Promise<void> {
    const template = Array.from(this.templates.values()).find(t => t.id === id);
    if (template) {
      this.templates.delete(template.key);
    }
  }

  async getTemplateVersions(templateId: string): Promise<PromptTemplateVersion[]> {
    // Mock implementation - return empty array
    return [];
  }

  async rollbackToVersion(templateId: string, versionId: string): Promise<PromptTemplate> {
    const template = Array.from(this.templates.values()).find(t => t.id === templateId);
    if (!template) {
      throw new Error('Template not found');
    }
    return template;
  }

  async getCategories(): Promise<PromptCategory[]> {
    return [
      { id: '1', key: 'content', name: 'Content Generation', description: 'Prompts for generating module content', icon: '📚', color: '#8B5CF6', displayOrder: 1 },
      { id: '2', key: 'quiz', name: 'Quiz Generation', description: 'Prompts for creating quizzes', icon: '❓', color: '#3B82F6', displayOrder: 2 },
      { id: '3', key: 'video', name: 'Video Curation', description: 'Prompts for videos', icon: '🎥', color: '#F59E0B', displayOrder: 3 },
      { id: '4', key: 'bibliography', name: 'Bibliography Generation', description: 'Prompts for references', icon: '📖', color: '#EC4899', displayOrder: 4 },
      { id: '5', key: 'jung', name: 'Jung Modules', description: 'Prompts for Jung-specific content', icon: '🧠', color: '#6366F1', displayOrder: 5 }
    ];
  }

  async logExecution(
    templateId: string,
    inputVariables: Record<string, any>,
    responseTimeMs: number,
    tokenCount?: number,
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    // Mock implementation - just log to console
    console.log('Prompt execution logged:', { templateId, responseTimeMs, success });
  }

  async getExecutionStats(templateId: string, days: number = 30): Promise<{
    totalExecutions: number;
    averageResponseTime: number;
    successRate: number;
    averageTokens: number;
  }> {
    // Mock implementation - return dummy stats
    return {
      totalExecutions: 0,
      averageResponseTime: 0,
      successRate: 100,
      averageTokens: 0
    };
  }

  compilePrompt(template: string, variables: Record<string, any>): string {
    let compiled = template;

    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      let replacementValue = value;

      if (Array.isArray(value)) {
        replacementValue = value.join(', ');
      } else if (typeof value === 'object' && value !== null) {
        replacementValue = JSON.stringify(value, null, 2);
      }

      compiled = compiled.replace(placeholder, String(replacementValue));
    });

    return compiled;
  }

  validateVariables(template: PromptTemplate, variables: Record<string, any>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    template.variables.forEach(varDef => {
      const value = variables[varDef.name];

      if (varDef.required && (value === undefined || value === null || value === '')) {
        errors.push(`Variable '${varDef.name}' is required`);
        return;
      }

      if (!varDef.required && (value === undefined || value === null)) {
        return;
      }

      if (varDef.type === 'number' && typeof value !== 'number') {
        errors.push(`Variable '${varDef.name}' must be a number`);
      }
      if (varDef.type === 'array' && !Array.isArray(value)) {
        errors.push(`Variable '${varDef.name}' must be an array`);
      }
      if (varDef.type === 'boolean' && typeof value !== 'boolean') {
        errors.push(`Variable '${varDef.name}' must be a boolean`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Export a singleton instance
export const promptTemplateServiceMock = new PromptTemplateServiceMock();