import { ILLMProvider, LLMGenerationOptions } from '../provider';
import { ModuleContent } from '../../../types/schema';

interface ModuleContentOptions {
  title?: string;
  topic?: string;
  objectives?: string[];
  learningObjectives?: string[];
  targetAudience?: string;
  difficulty?: string;
  duration?: number;
  concepts?: string[];
  prerequisites?: string[];
}

export class ContentGenerator {
  constructor(private provider: ILLMProvider) {}

  async generateModuleContent(
    topicOrOptions: string | ModuleContentOptions,
    objectives?: string[],
    targetAudience?: string,
    duration?: number
  ): Promise<ModuleContent> {
    let topic: string;
    let validObjectives: string[];
    let audience: string;
    let durationMinutes: number;
    let options: ModuleContentOptions | undefined;

    // Handle both parameter styles
    if (typeof topicOrOptions === 'object') {
      // Object parameter style (from tests)
      options = topicOrOptions;
      topic = options.title || options.topic || '';
      validObjectives = options.learningObjectives || options.objectives || [];
      audience = options.targetAudience || options.difficulty || 'intermediate';
      durationMinutes = options.duration || 60;
      
      // Validate required fields
      if (!topic || (options.concepts && options.concepts.length === 0)) {
        throw new Error('Title and concepts are required');
      }
    } else {
      // Individual parameters style (from orchestrator)
      topic = topicOrOptions;
      validObjectives = objectives || [];
      audience = targetAudience || 'intermediate';
      durationMinutes = duration || 60;
      options = undefined;
    }

    const sections = await this.generateSections(topic, validObjectives, audience, durationMinutes, options);
    
    const conclusion = await this.generateConclusion(topic, validObjectives);
    const keyTakeaways = await this.generateKeyTakeaways(topic, validObjectives, sections);
    
    return {
      introduction: await this.generateIntroduction(topic, validObjectives, audience),
      sections,
      summary: await this.generateSummary(sections),
      keyTakeaways,
    };
  }

  private async generateIntroduction(
    topic: string,
    objectives: string[],
    targetAudience: string
  ): Promise<string> {
    const prompt = `
Create an engaging introduction for a Jungian psychology module on "${topic}".

Target audience: ${targetAudience}

Learning objectives:
${objectives?.map((obj, i) => `${i + 1}. ${obj}`).join('\n') || 'No objectives specified'}

Requirements:
- Hook the reader with an interesting opening
- Briefly introduce the main concepts
- Explain why this topic is important in Jungian psychology
- Set expectations for what students will learn
- Keep it between 200-300 words

Format using Markdown:
- Use **bold** for emphasis on key concepts
- Use *italics* for subtle emphasis
- Include a compelling opening paragraph
- Structure with clear paragraphs
`;

    return await this.provider.generateCompletion(prompt, {
      temperature: 0.7,
      maxTokens: 500,
    });
  }

  private async generateSections(
    topic: string,
    objectives: string[],
    targetAudience: string,
    duration: number,
    options?: ModuleContentOptions
  ): Promise<ModuleContent['sections']> {
    const validObjectives = objectives;
    // Calculate number of sections based on duration
    const sectionCount = Math.max(3, Math.min(8, Math.floor(duration / 15)));
    
    const structurePrompt = `Create a detailed outline for a Jungian psychology module on "${topic}".

Target audience: ${targetAudience}
Duration: ${duration} minutes
Number of sections: ${sectionCount}

Learning objectives:
${objectives?.map((obj, i) => `${i + 1}. ${obj}`).join('\n') || 'No objectives specified'}

Create exactly ${sectionCount} main sections that progressively build understanding.

CRITICAL: You must respond with a JSON array containing exactly ${sectionCount} objects. Each object must have:
- title: A descriptive section title (string)
- concepts: Array of key concepts to cover (array of strings)
- duration: Estimated time in minutes (number)

Example format (respond with exactly this structure):
[
  {
    "title": "Understanding the Basics of ${topic}",
    "concepts": ["fundamental principles", "historical context"],
    "duration": ${Math.floor(duration / sectionCount)}
  },
  {
    "title": "Advanced Concepts in ${topic}",
    "concepts": ["complex theory", "practical applications"],
    "duration": ${Math.ceil(duration / sectionCount)}
  }
]`;

    const schema = {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          concepts: { 
            type: "array",
            items: { type: "string" }
          },
          duration: { type: "number" }
        },
        required: ["title", "concepts", "duration"]
      }
    };

    let structure = await this.provider.generateStructuredResponse<Array<{
      title: string;
      concepts: string[];
      duration: number;
    }>>(structurePrompt, schema, { temperature: 0.2, retries: 3 });

    // Debug logging removed - structure generation working correctly
    
    if (!structure) {
      throw new Error('Failed to generate module structure: No structure returned');
    }
    
    if (!Array.isArray(structure)) {
      console.error('Structure is not an array:', structure);
      
      // Try to handle if structure is wrapped in an object
      if (typeof structure === 'object' && 'sections' in structure && Array.isArray((structure as any).sections)) {
        console.log('Found sections in structure object, using those');
        structure = (structure as any).sections;
      } else {
        console.warn('Using fallback structure generation due to invalid response');
        // Create a fallback structure
        structure = [
          {
            title: `Understanding ${topic}`,
            concepts: ['fundamental concepts', 'key principles'],
            duration: Math.floor(duration / 3)
          },
          {
            title: `${topic} in Practice`,
            concepts: ['practical applications', 'real-world examples'],
            duration: Math.floor(duration / 3)
          },
          {
            title: `Integration and Development`,
            concepts: ['personal development', 'psychological integration'],
            duration: Math.ceil(duration / 3)
          }
        ];
      }
    }

    // Generate content for each section
    const sections = await Promise.all(
      structure.map(async (section, index) => ({
        id: `section-${index + 1}`,
        title: section.title,
        content: await this.generateSectionContent(
          topic,
          section.title,
          section.concepts,
          targetAudience,
          options?.learningObjectives || validObjectives,
          options?.prerequisites
        ),
        subsections: [],
        media: [],
      }))
    );

    return sections;
  }

  private async generateSectionContent(
    mainTopic: string,
    sectionTitle: string,
    concepts: string[],
    targetAudience: string,
    learningObjectives?: string[],
    prerequisites?: string[]
  ): Promise<string> {
    let prompt = `
Write detailed content for the section "${sectionTitle}" in a Jungian psychology module about "${mainTopic}".

Target audience: ${targetAudience}`;

    if (targetAudience.toLowerCase() === 'beginner') {
      prompt += '\nUse simple language and avoid overly technical jargon.';
    }

    if (learningObjectives && learningObjectives.length > 0) {
      prompt += '\n\nLearning objectives:\n' + learningObjectives.map(obj => `- ${obj}`).join('\n');
    }

    if (prerequisites && prerequisites.length > 0) {
      prompt += '\n\nPrerequisites:\n' + prerequisites.map(pre => `- ${pre}`).join('\n');
    }

    prompt += `

Key concepts to cover:
${concepts.map(c => `- ${c}`).join('\n')}

Requirements:
- Explain concepts clearly with examples
- Include relevant Jungian terminology
- Use metaphors or analogies when helpful
- Reference Jung's original work when applicable
- Include practical applications or exercises
- Aim for 400-600 words

IMPORTANT: Format the content using Markdown:
- Use **bold** for key terms and important concepts
- Use *italics* for emphasis
- Use numbered lists (1. 2. 3.) for sequential steps
- Use bullet points (- or *) for non-sequential items
- Add double line breaks between paragraphs
- Use > for important quotes from Jung
- You can use ### for subheadings within the section
- Include links where relevant: [text](url)
- Write in a clear, educational style
`;

    return await this.provider.generateCompletion(prompt, {
      temperature: 0.7,
      maxTokens: 800,
    });
  }

  private async generateConclusion(topic: string, objectives: string[]): Promise<string> {
    const prompt = `
Write a compelling conclusion for a Jungian psychology module on "${topic}".

Learning objectives covered:
${objectives?.map((obj, i) => `${i + 1}. ${obj}`).join('\n') || 'No objectives specified'}

Requirements:
- Summarize key takeaways
- Connect concepts back to broader Jungian theory
- Inspire further exploration
- Suggest practical applications
- Keep it between 150-200 words
`;

    return await this.provider.generateCompletion(prompt, {
      temperature: 0.7,
      maxTokens: 300,
    });
  }

  private async generateSummary(sections: ModuleContent['sections']): Promise<string> {
    const sectionTitles = sections.map(s => s.title).join(', ');
    
    const prompt = `
Create a concise summary of a Jungian psychology module covering these sections: ${sectionTitles}.

Write a 100-150 word summary that captures the essential concepts and their relationships.
Focus on the main insights and practical applications.
`;

    return await this.provider.generateCompletion(prompt, {
      temperature: 0.6,
      maxTokens: 200,
    });
  }

  private async generateKeyTakeaways(
    topic: string,
    objectives: string[],
    sections: ModuleContent['sections']
  ): Promise<string[]> {
    const sectionTitles = sections.map(s => s.title).join(', ');
    
    const prompt = `
Generate 5-7 key takeaways from a Jungian psychology module on "${topic}".

Learning objectives:
${objectives?.map((obj, i) => `${i + 1}. ${obj}`).join('\n') || 'No objectives specified'}

Sections covered: ${sectionTitles}

Provide the takeaways as a JSON array of strings. Each takeaway should be:
- Clear and concise (1-2 sentences)
- Actionable or insightful
- Directly related to Jungian psychology concepts

Example format: ["Takeaway 1", "Takeaway 2", ...]
`;

    const response = await this.provider.generateStructuredResponse<string[]>(
      prompt,
      [],
      { temperature: 0.7, maxTokens: 400 }
    );

    return response;
  }

  async generateConceptExplanation(
    concept: string,
    options: {
      context?: string;
      depth?: 'beginner' | 'intermediate' | 'advanced';
      includeExamples?: boolean;
    } = {}
  ): Promise<{
    concept: string;
    definition?: string;
    explanation?: string;
    keyPoints?: string[];
    examples?: string[];
    relatedConcepts?: string[];
  }> {
    const { context = 'Jungian psychology', depth = 'intermediate', includeExamples = true } = options;
    
    let prompt = `Explain the concept "${concept}" in the context of ${context}.

Target depth: ${depth}`;

    if (depth === 'beginner') {
      prompt += '\nUse simple language and everyday examples.';
    }

    if (includeExamples) {
      prompt += '\nInclude practical examples to illustrate the concept.';
    }

    const response = await this.provider.generateStructuredResponse<{
      concept: string;
      definition?: string;
      explanation?: string;
      keyPoints?: string[];
      examples?: string[];
      relatedConcepts?: string[];
    }>(prompt, {
      type: 'object',
      properties: {
        concept: { type: 'string' },
        definition: { type: 'string' },
        keyPoints: { type: 'array', items: { type: 'string' } },
        examples: { type: 'array', items: { type: 'string' } },
        relatedConcepts: { type: 'array', items: { type: 'string' } }
      },
      required: ['concept', 'definition', 'keyPoints', 'examples', 'relatedConcepts']
    });

    return response;
  }

  async enrichContent(
    content: string,
    options: {
      addExamples?: boolean;
      addExercises?: boolean;
      addMetaphors?: boolean;
      addVisualDescriptions?: boolean;
      culturalContext?: string;
    } = {}
  ): Promise<{
    originalContent?: string;
    enrichedContent?: string;
    enrichments?: {
      examples?: string[];
      metaphors?: string[];
      practicalApplications?: string[];
      culturalReferences?: string[];
    };
    additions?: {
      examples?: string[];
      exercises?: string[];
      visualDescriptions?: string[];
    };
  }> {
    const { addExamples, addExercises, addMetaphors, addVisualDescriptions, culturalContext } = options;
    
    let prompt = `Enrich the following content with additional elements:

Original content:
${content}

Requested additions:`;

    if (addExamples) prompt += '\n- Add practical examples';
    if (addExercises) prompt += '\n- Add exercises or reflection questions';
    if (addMetaphors) prompt += '\n- Add metaphors and analogies';
    if (addVisualDescriptions) prompt += '\n- Add descriptions for visual aids or diagrams';
    if (culturalContext) prompt += `\n- Add cultural references relevant to ${culturalContext}`;

    const response = await this.provider.generateStructuredResponse<{
      originalContent?: string;
      enrichedContent?: string;
      enrichments?: {
        examples?: string[];
        metaphors?: string[];
        practicalApplications?: string[];
        culturalReferences?: string[];
      };
      additions?: {
        examples?: string[];
        exercises?: string[];
        visualDescriptions?: string[];
      };
    }>(prompt, {
      type: 'object',
      properties: {
        enrichedContent: { type: 'string' },
        additions: {
          type: 'object',
          properties: {
            examples: { type: 'array', items: { type: 'string' } },
            exercises: { type: 'array', items: { type: 'string' } },
            visualDescriptions: { type: 'array', items: { type: 'string' } }
          }
        }
      },
      required: ['enrichedContent', 'additions']
    });

    return response;
  }

  async summarizeContent(
    content: string,
    options: {
      maxLength?: number;
      style?: 'academic' | 'casual' | 'bullet-points';
      preserveKeyTerms?: boolean;
    } = {}
  ): Promise<{
    mainPoints?: string[];
    keyTakeaways?: string[];
    briefSummary?: string;
    summary?: string;
    keyPoints?: string[];
    wordCount?: number;
  }> {
    const { maxLength = 300, style = 'academic', preserveKeyTerms = true } = options;
    
    let prompt = `Summarize the following content in ${style} style:

${content}

Requirements:
- Maximum ${maxLength} words
- Style: ${style}`;

    if (preserveKeyTerms) {
      prompt += '\n- Preserve key Jungian terminology';
    }

    const response = await this.provider.generateStructuredResponse<{
      mainPoints?: string[];
      keyTakeaways?: string[];
      briefSummary?: string;
      summary?: string;
      keyPoints?: string[];
      wordCount?: number;
    }>(prompt, {
      type: 'object',
      properties: {
        summary: { type: 'string' },
        keyPoints: { type: 'array', items: { type: 'string' } },
        wordCount: { type: 'number' }
      },
      required: ['summary', 'keyPoints', 'wordCount']
    });

    return response;
  }

  async generateModuleContentStream(
    options: {
      title: string;
      concepts: string[];
      difficulty?: string;
      targetAudience?: string;
      duration?: number;
      learningObjectives?: string[];
      prerequisites?: string[];
    },
    onChunk: (chunk: string) => void
  ): Promise<ModuleContent> {
    // Generate sections structure first
    const targetAudience = options.targetAudience || options.difficulty || 'intermediate';
    const duration = options.duration || 60;
    const sections = await this.generateSections(
      options.title,
      options.learningObjectives || [],
      targetAudience,
      duration,
      options
    );
    
    // Stream introduction
    const introPrompt = `
Create an engaging introduction for a Jungian psychology module on "${options.title}".

Target audience: ${targetAudience}

Learning objectives:
${options.learningObjectives?.map((obj, i) => `${i + 1}. ${obj}`).join('\n') || 'No objectives specified'}

Requirements:
- Hook the reader with an interesting opening
- Briefly introduce the main concepts
- Explain why this topic is important in Jungian psychology
- Set expectations for what students will learn
- Keep it between 200-300 words

Format using Markdown:
- Use **bold** for emphasis on key concepts
- Use *italics* for subtle emphasis
- Include a compelling opening paragraph
- Structure with clear paragraphs
`;

    let introduction = '';
    await this.provider.streamCompletion(introPrompt, (chunk) => {
      introduction += chunk;
      onChunk(chunk);
    }, {
      temperature: 0.7,
      maxTokens: 500,
    });
    
    // Stream each section content
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      
      // Add section header
      onChunk(`\n\n## ${section.title}\n\n`);
      
      const sectionPrompt = `
Write detailed content for the section "${section.title}" in a Jungian psychology module about "${options.title}".

Target audience: ${targetAudience}${targetAudience.toLowerCase() === 'beginner' ? '\nUse simple language and avoid overly technical jargon.' : ''}${options.learningObjectives && options.learningObjectives.length > 0 ? '\n\nLearning objectives:\n' + options.learningObjectives.map(obj => `- ${obj}`).join('\n') : ''}${options.prerequisites && options.prerequisites.length > 0 ? '\n\nPrerequisites:\n' + options.prerequisites.map(pre => `- ${pre}`).join('\n') : ''}

Key concepts to cover:
${section.concepts?.map(c => `- ${c}`).join('\n') || 'No specific concepts'}

Requirements:
- Explain concepts clearly with examples
- Include relevant Jungian terminology
- Use metaphors or analogies when helpful
- Reference Jung's original work when applicable
- Include practical applications or exercises
- Aim for 400-600 words

IMPORTANT: Format the content using Markdown:
- Use **bold** for key terms and important concepts
- Use *italics* for emphasis
- Use numbered lists (1. 2. 3.) for sequential steps
- Use bullet points (- or *) for non-sequential items
- Add double line breaks between paragraphs
- Use > for important quotes from Jung
- You can use ### for subheadings within the section
- Include links where relevant: [text](url)
- Write in a clear, educational style
`;

      let sectionContent = '';
      await this.provider.streamCompletion(sectionPrompt, (chunk) => {
        sectionContent += chunk;
        onChunk(chunk);
      }, {
        temperature: 0.7,
        maxTokens: 800,
      });
      
      // Update section content
      sections[i].content = sectionContent;
    }
    
    // Generate summary and key takeaways
    const summary = await this.generateSummary(sections);
    const keyTakeaways = await this.generateKeyTakeaways(
      options.title,
      options.learningObjectives || [],
      sections
    );
    
    return {
      introduction,
      sections,
      summary,
      keyTakeaways,
    };
  }
}