-- Default Prompt Templates for Jung Educational App
-- These are the initial prompts that can be customized by administrators

-- Content Generation Prompts
INSERT INTO default_prompts (key, category, template, variables, language) VALUES
('content.introduction', 'content', 
'Crie uma introdução envolvente para um módulo de psicologia junguiana sobre "{{topic}}".

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
- Estruture com parágrafos claros',
'[
  {"name": "topic", "type": "text", "description": "Tópico do módulo", "required": true},
  {"name": "targetAudience", "type": "text", "description": "Público-alvo", "required": true, "defaultValue": "intermediate"},
  {"name": "objectives", "type": "text", "description": "Objetivos de aprendizagem", "required": false},
  {"name": "minWords", "type": "number", "description": "Mínimo de palavras", "required": false, "defaultValue": 200},
  {"name": "maxWords", "type": "number", "description": "Máximo de palavras", "required": false, "defaultValue": 300}
]'::jsonb, 'pt-BR'),

('content.section', 'content',
'Escreva conteúdo detalhado para a seção "{{sectionTitle}}" em um módulo de psicologia junguiana sobre "{{mainTopic}}".

Público-alvo: {{targetAudience}}
{{#if usesSimpleLanguage}}Use linguagem simples e evite jargão excessivamente técnico.{{/if}}

{{#if learningObjectives}}
Objetivos de aprendizagem:
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

IMPORTANTE: Formate o conteúdo usando Markdown:
- Use **negrito** para termos-chave e conceitos importantes
- Use *itálico* para ênfase
- Use listas numeradas (1. 2. 3.) para passos sequenciais
- Use pontos de lista (- ou *) para itens não sequenciais
- Adicione quebras de linha duplas entre parágrafos
- Use > para citações importantes de Jung
- Você pode usar ### para subtítulos dentro da seção
- Inclua links onde relevante: [texto](url)
- Escreva em um estilo claro e educacional',
'[
  {"name": "sectionTitle", "type": "text", "description": "Título da seção", "required": true},
  {"name": "mainTopic", "type": "text", "description": "Tópico principal", "required": true},
  {"name": "targetAudience", "type": "text", "description": "Público-alvo", "required": true},
  {"name": "usesSimpleLanguage", "type": "boolean", "description": "Usar linguagem simples", "required": false, "defaultValue": false},
  {"name": "learningObjectives", "type": "text", "description": "Objetivos de aprendizagem", "required": false},
  {"name": "prerequisites", "type": "text", "description": "Pré-requisitos", "required": false},
  {"name": "concepts", "type": "text", "description": "Conceitos a cobrir", "required": true},
  {"name": "targetWords", "type": "text", "description": "Número alvo de palavras", "required": false, "defaultValue": "400-600"}
]'::jsonb, 'pt-BR'),

-- Quiz Generation Prompts
('quiz.questions', 'quiz',
'Gere exatamente {{count}} questões de múltipla escolha para um quiz de psicologia junguiana sobre "{{topic}}".

Objetivos de aprendizagem a avaliar:
{{objectives}}

Resumo do conteúdo contextual:
{{contentSummary}}

CRÍTICO: Você deve responder com um array JSON contendo exatamente {{count}} objetos de questão.

Requisitos para cada questão:
1. Teste a compreensão, não apenas memorização
2. Inclua exatamente 4 opções de resposta que sejam TODAS plausíveis e relacionadas ao tópico
3. Apenas uma resposta correta (índice 0-3)
4. Forneça explicações claras para a resposta correta
5. Varie os níveis de dificuldade (fácil, médio, difícil)
6. Cubra diferentes níveis cognitivos (recordação, compreensão, aplicação, análise)

DIRETRIZES PARA DISTRATORES:
- TODOS os distratores devem ser plausíveis e relacionados à psicologia junguiana
- NUNCA repita opções - cada uma deve ser ÚNICA e ESPECÍFICA
- Todas as opções devem ter comprimento similar (30-80 caracteres)
- Use conceitos junguianos ESPECÍFICOS para cada distrator
- Evite termos genéricos

IMPORTANTE: Escreva TODAS as questões, opções e explicações em português brasileiro (pt-BR).

Responda com exatamente {{count}} questões no formato JSON especificado.',
'[
  {"name": "count", "type": "number", "description": "Número de questões", "required": true, "defaultValue": 10},
  {"name": "topic", "type": "text", "description": "Tópico do quiz", "required": true},
  {"name": "objectives", "type": "text", "description": "Objetivos de aprendizagem", "required": false},
  {"name": "contentSummary", "type": "text", "description": "Resumo do conteúdo", "required": false}
]'::jsonb, 'pt-BR'),

-- Mind Map Generation Prompts
('mindmap.structure', 'mindmap',
'Crie uma estrutura de mapa mental para "{{topic}}" em psicologia junguiana com {{depth}} níveis de profundidade.

Estilo: {{style}}
Conceitos-chave a incluir: {{concepts}}

Requisitos:
- Comece com o tópico principal como raiz
- Ramifique em conceitos e categorias junguianas principais
- Cada nível deve ter {{minBranches}}-{{maxBranches}} ramos (exceto folhas)
- Inclua aspectos teóricos e práticos
- Mostre relações entre elementos conscientes e inconscientes
- IMPORTANTE: Todos os rótulos devem estar em português brasileiro

Formato de resposta JSON com estrutura hierárquica especificada.',
'[
  {"name": "topic", "type": "text", "description": "Tópico principal", "required": true},
  {"name": "depth", "type": "number", "description": "Níveis de profundidade", "required": true, "defaultValue": 3},
  {"name": "style", "type": "text", "description": "Estilo do mapa", "required": false, "defaultValue": "abrangente"},
  {"name": "concepts", "type": "text", "description": "Conceitos-chave", "required": true},
  {"name": "minBranches", "type": "number", "description": "Mínimo de ramos", "required": false, "defaultValue": 3},
  {"name": "maxBranches", "type": "number", "description": "Máximo de ramos", "required": false, "defaultValue": 5}
]'::jsonb, 'pt-BR'),

-- Video Generation Prompts
('video.search_queries', 'video',
'Gere exatamente {{queryCount}} queries de busca do YouTube para encontrar vídeos educacionais sobre "{{topic}}" em psicologia junguiana.

Conceitos-chave a cobrir:
{{concepts}}

Público-alvo: {{targetAudience}}

CRÍTICO: Você deve responder com um array JSON contendo exatamente {{queryCount}} strings de consulta de busca.

Gere consultas de busca específicas que encontrem:
1. Palestras acadêmicas sobre o tópico
2. Explicações animadas de conceitos complexos
3. Estudos de caso ou aplicações práticas
4. Contexto histórico do trabalho de Jung
5. Interpretações e desenvolvimentos modernos

Foque em consultas que retornem conteúdo educacional de alta qualidade.
IMPORTANTE: As queries devem incluir termos em português (legendado, português, Brasil)

Formato de resposta: Array JSON de strings de busca.',
'[
  {"name": "queryCount", "type": "number", "description": "Número de queries", "required": true, "defaultValue": 8},
  {"name": "topic", "type": "text", "description": "Tópico principal", "required": true},
  {"name": "concepts", "type": "text", "description": "Conceitos-chave", "required": true},
  {"name": "targetAudience", "type": "text", "description": "Público-alvo", "required": true}
]'::jsonb, 'pt-BR'),

-- Bibliography Generation Prompts
('bibliography.resources', 'bibliography',
'Gere {{count}} recursos educacionais sobre "{{topic}}" em psicologia junguiana com LINKS ACESSÍVEIS.

Conceitos-chave: {{concepts}}
Nível: {{level}}

IMPORTANTE: 
- Cada recurso DEVE ter um URL funcional e acessível
- Priorize recursos em português ou com tradução disponível
- Inclua uma mistura de tipos: {{resourceTypes}}
- Para livros, prefira links para: Google Books, Amazon, Archive.org, sites de editoras
- Para artigos: SciELO, PePSIC, ResearchGate, Academia.edu, repositórios universitários
- Para vídeos: YouTube (aulas, palestras, documentários)
- Para cursos: Coursera, edX, plataformas educacionais

Foque em:
- Obras fundamentais de Jung traduzidas
- Comentadores brasileiros e latino-americanos
- Recursos didáticos e introdutórios
- Material audiovisual complementar
- Cursos e palestras online gratuitos

Formato de resposta: Array JSON com estrutura bibliográfica completa.',
'[
  {"name": "count", "type": "number", "description": "Número de recursos", "required": true, "defaultValue": 10},
  {"name": "topic", "type": "text", "description": "Tópico principal", "required": true},
  {"name": "concepts", "type": "text", "description": "Conceitos-chave", "required": true},
  {"name": "level", "type": "text", "description": "Nível de dificuldade", "required": true, "defaultValue": "intermediário"},
  {"name": "resourceTypes", "type": "text", "description": "Tipos de recursos", "required": false, "defaultValue": "livros digitais, artigos acadêmicos, vídeos, cursos online, podcasts"}
]'::jsonb, 'pt-BR');

-- Insert initial prompt templates (these can be edited by admins)
INSERT INTO prompt_templates (key, category, name, description, template, variables, language, is_active) 
SELECT key, category, 
  CASE 
    WHEN key = 'content.introduction' THEN 'Introdução de Módulo'
    WHEN key = 'content.section' THEN 'Conteúdo de Seção'
    WHEN key = 'quiz.questions' THEN 'Geração de Questões'
    WHEN key = 'mindmap.structure' THEN 'Estrutura de Mapa Mental'
    WHEN key = 'video.search_queries' THEN 'Busca de Vídeos'
    WHEN key = 'bibliography.resources' THEN 'Recursos Bibliográficos'
  END as name,
  CASE 
    WHEN key = 'content.introduction' THEN 'Template para gerar introduções de módulos educacionais'
    WHEN key = 'content.section' THEN 'Template para gerar conteúdo detalhado de seções'
    WHEN key = 'quiz.questions' THEN 'Template para gerar questões de múltipla escolha'
    WHEN key = 'mindmap.structure' THEN 'Template para criar estruturas de mapas mentais'
    WHEN key = 'video.search_queries' THEN 'Template para gerar queries de busca de vídeos educacionais'
    WHEN key = 'bibliography.resources' THEN 'Template para gerar listas de recursos bibliográficos'
  END as description,
  template, variables, language, true
FROM default_prompts
ON CONFLICT (key) DO NOTHING;