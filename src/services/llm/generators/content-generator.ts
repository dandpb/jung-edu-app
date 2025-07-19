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

    // Handle both parameter styles
    if (typeof topicOrOptions === 'object') {
      // Object parameter style (from tests)
      const options = topicOrOptions;
      topic = options.title || options.topic || '';
      validObjectives = options.learningObjectives || options.objectives || [];
      audience = options.targetAudience || options.difficulty || 'intermediate';
      durationMinutes = options.duration || 60;
    } else {
      // Individual parameters style (from orchestrator)
      topic = topicOrOptions;
      validObjectives = objectives || [];
      audience = targetAudience || 'intermediate';
      durationMinutes = duration || 60;
    }

    const sections = await this.generateSections(topic, validObjectives, audience, durationMinutes);
    
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
    duration: number
  ): Promise<ModuleContent['sections']> {
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

    console.log('Generated structure:', structure, 'Type:', typeof structure, 'Is array:', Array.isArray(structure));
    
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
          targetAudience
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
    targetAudience: string
  ): Promise<string> {
    const prompt = `
Write detailed content for the section "${sectionTitle}" in a Jungian psychology module about "${mainTopic}".

Target audience: ${targetAudience}

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
}