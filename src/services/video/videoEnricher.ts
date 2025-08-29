import { YouTubeVideo } from './youtubeService';
import { Video, VideoPlatform } from '../../schemas/module.schema';
import { ILLMProvider } from '../llm/types';

export interface VideoMetadata {
  educationalValue: number; // 0-1 score
  relevanceScore: number; // 0-1 score
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  keyTimestamps?: Array<{
    time: number; // seconds
    topic: string;
    description: string;
  }>;
  suggestedPrerequisites?: string[];
  learningOutcomes?: string[];
  relatedConcepts: string[];
  contentWarnings?: string[];
}

export interface EnrichmentOptions {
  analyzeTranscript?: boolean;
  generateTimestamps?: boolean;
  assessDifficulty?: boolean;
  extractLearningOutcomes?: boolean;
  targetAudience?: string;
  courseContext?: {
    topic: string;
    concepts: string[];
    previousTopics?: string[];
  };
}

export class VideoEnricher {
  constructor(private llmProvider?: ILLMProvider) {}

  async enrichVideo(
    video: YouTubeVideo,
    options: EnrichmentOptions = {}
  ): Promise<Video & { metadata: VideoMetadata }> {
    // Ensure options is not null/undefined
    const safeOptions = options || {};
    const metadata = await this.analyzeVideo(video, safeOptions);
    
    const enrichedVideo: Video & { metadata: VideoMetadata } = {
      id: `video-${video.videoId}`,
      title: this.enhanceTitle(video.title, metadata),
      description: await this.enhanceDescription(video, metadata, safeOptions),
      url: `https://youtube.com/watch?v=${video.videoId}`,
      duration: this.parseDurationToObject(video.duration),
      platform: VideoPlatform.YOUTUBE,
      metadata: {
        ...metadata
      },
    };

    return enrichedVideo;
  }

  async enrichMultipleVideos(
    videos: YouTubeVideo[],
    options: EnrichmentOptions = {}
  ): Promise<Array<Video & { metadata: VideoMetadata }>> {
    // Process videos in parallel for efficiency
    const enrichmentPromises = videos.map(video => this.enrichVideo(video, options));
    const enrichedVideos = await Promise.all(enrichmentPromises);
    
    // Sort by relevance and educational value
    return enrichedVideos.sort((a, b) => {
      const scoreA = a.metadata.relevanceScore * 0.6 + a.metadata.educationalValue * 0.4;
      const scoreB = b.metadata.relevanceScore * 0.6 + b.metadata.educationalValue * 0.4;
      return scoreB - scoreA;
    });
  }

  private async analyzeVideo(
    video: YouTubeVideo,
    options: EnrichmentOptions
  ): Promise<VideoMetadata> {
    // Ensure options is not null/undefined
    const safeOptions = options || {};
    
    // If we have an LLM provider, use it for advanced analysis
    if (this.llmProvider && safeOptions.courseContext) {
      return await this.llmAnalyzeVideo(video, safeOptions);
    }

    // Otherwise, use heuristic analysis
    return this.heuristicAnalyzeVideo(video, safeOptions);
  }

  private async llmAnalyzeVideo(
    video: YouTubeVideo,
    options: EnrichmentOptions
  ): Promise<VideoMetadata> {
    const prompt = `
Analyze this educational video for a Jungian psychology course:

Title: ${video.title}
Channel: ${video.channelTitle}
Description: ${video.description}
Duration: ${this.parseDurationToMinutes(video.duration)} minutes
Views: ${video.viewCount}
Published: ${video.publishedAt}

Course Context:
Topic: ${options.courseContext?.topic}
Key Concepts: ${options.courseContext?.concepts.join(', ')}
${options.courseContext?.previousTopics ? `Previous Topics: ${options.courseContext.previousTopics.join(', ')}` : ''}

Target Audience: ${options.targetAudience || 'General learners'}

Analyze and provide:
1. Educational value score (0-1): How well does this teach the concepts?
2. Relevance score (0-1): How closely aligned with the course topic?
3. Difficulty level: beginner, intermediate, or advanced
4. Related concepts from the course that this video covers
5. Suggested prerequisites (if any)
6. Key learning outcomes (3-5 points)
7. Any content warnings for sensitive psychological topics

Response format:
{
  "educationalValue": 0.85,
  "relevanceScore": 0.9,
  "difficulty": "intermediate",
  "relatedConcepts": ["shadow", "persona", "individuation"],
  "suggestedPrerequisites": ["Basic understanding of unconscious mind"],
  "learningOutcomes": [
    "Understand the role of the shadow in personality",
    "Identify shadow projections in daily life",
    "Learn integration techniques"
  ],
  "contentWarnings": ["Discusses trauma and repression"]
}`;

    try {
      const analysis = await this.llmProvider!.generateStructuredOutput<{
        educationalValue: number;
        relevanceScore: number;
        difficulty: 'beginner' | 'intermediate' | 'advanced';
        relatedConcepts: string[];
        suggestedPrerequisites?: string[];
        learningOutcomes?: string[];
        contentWarnings?: string[];
      }>(prompt, {}, { temperature: 0.3 });

      // Generate timestamps if requested
      let keyTimestamps;
      if (options.generateTimestamps) {
        keyTimestamps = await this.generateKeyTimestamps(video, analysis.relatedConcepts);
      }

      return {
        ...analysis,
        keyTimestamps,
      };
    } catch (error) {
      console.error('LLM analysis failed, falling back to heuristics:', error);
      return this.heuristicAnalyzeVideo(video, options);
    }
  }

  private heuristicAnalyzeVideo(
    video: YouTubeVideo,
    options: EnrichmentOptions
  ): VideoMetadata {
    const duration = this.parseDurationToMinutes(video.duration);
    const viewCount = parseInt(video.viewCount);
    const likeRatio = video.likeCount ? parseInt(video.likeCount) / viewCount : 0;
    
    // Educational value heuristics
    let educationalValue = 0.5;
    
    // Channel reputation boost
    const educationalChannels = ['Academy of Ideas', 'Jung Psychology Institute', 'Jordan Peterson'];
    if (educationalChannels.some(ch => video.channelTitle.includes(ch))) {
      educationalValue += 0.2;
    }
    
    // Duration score (prefer 10-30 minute videos)
    if (duration >= 10 && duration <= 30) {
      educationalValue += 0.1;
    } else if (duration > 30 && duration <= 60) {
      educationalValue += 0.05;
    }
    
    // Engagement score
    if (likeRatio > 0.04) { // 4% like ratio is very good
      educationalValue += 0.1;
    }
    
    // Title/description analysis
    const educationalKeywords = ['lecture', 'explained', 'understanding', 'analysis', 'introduction', 'guide', 'tutorial'];
    const keywordCount = educationalKeywords.filter(kw => 
      video.title.toLowerCase().includes(kw) || 
      video.description.toLowerCase().includes(kw)
    ).length;
    educationalValue += keywordCount * 0.05;
    
    educationalValue = Math.min(educationalValue, 1);
    
    // Relevance score
    let relevanceScore = 0;
    if (options && options.courseContext) {
      const contextWords = [
        options.courseContext.topic.toLowerCase(),
        ...options.courseContext.concepts.map(c => c.toLowerCase()),
        'jung', 'jungian', 'analytical psychology'
      ];
      
      const titleDesc = `${video.title} ${video.description}`.toLowerCase();
      const matchCount = contextWords.filter(word => titleDesc.includes(word)).length;
      relevanceScore = Math.min(matchCount / contextWords.length, 1);
    }
    
    // Difficulty assessment
    let difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
    const beginnerKeywords = ['introduction', 'basics', 'beginner', 'explained simply', 'for dummies', 'basic'];
    const advancedKeywords = ['advanced', 'deep dive', 'complex', 'theoretical', 'clinical', 'research'];
    
    const titleDesc = `${video.title} ${video.description}`.toLowerCase();
    if (beginnerKeywords.some(kw => titleDesc.includes(kw))) {
      difficulty = 'beginner';
    } else if (advancedKeywords.some(kw => titleDesc.includes(kw))) {
      difficulty = 'advanced';
    }
    
    // Extract concepts from title and description
    const jungianConcepts = [
      'shadow', 'anima', 'animus', 'persona', 'self', 'ego',
      'collective unconscious', 'archetypes', 'individuation',
      'synchronicity', 'complexes', 'psyche', 'mandala',
      'active imagination', 'dream analysis'
    ];
    
    const relatedConcepts = jungianConcepts.filter(concept => 
      `${video.title} ${video.description}`.toLowerCase().includes(concept)
    );
    
    // Generate timestamps if requested
    let keyTimestamps;
    if (options && options.generateTimestamps) {
      keyTimestamps = this.generateBasicTimestamps(video.duration, relatedConcepts);
    }

    return {
      educationalValue,
      relevanceScore,
      difficulty,
      relatedConcepts: relatedConcepts.length > 0 ? relatedConcepts : 
        titleDesc.includes('basic') ? ['basic concepts'] : ['general psychology'],
      suggestedPrerequisites: difficulty === 'advanced' ? 
        ['Basic understanding of Jungian psychology'] : 
        difficulty === 'beginner' ? [] : undefined,
      learningOutcomes: this.generateBasicLearningOutcomes(video.title, relatedConcepts),
      keyTimestamps,
    };
  }

  private async generateKeyTimestamps(
    video: YouTubeVideo,
    concepts: string[]
  ): Promise<VideoMetadata['keyTimestamps']> {
    if (!this.llmProvider) {
      // Generate basic timestamps based on video duration
      return this.generateBasicTimestamps(video.duration, concepts);
    }

    const prompt = `
Based on this educational video about Jungian psychology:
Title: ${video.title}
Duration: ${this.parseDurationToMinutes(video.duration)} minutes
Concepts covered: ${concepts.join(', ')}

Generate likely timestamps for when each major concept is discussed.
Assume a logical educational flow from introduction to conclusion.

Response format:
[
  {
    "time": 0,
    "topic": "Introduction",
    "description": "Overview of topics to be covered"
  },
  {
    "time": 120,
    "topic": "Concept name",
    "description": "Brief description of what's covered"
  }
]`;

    try {
      return await this.llmProvider.generateStructuredOutput(prompt, [], { temperature: 0.5 });
    } catch (error) {
      return this.generateBasicTimestamps(video.duration, concepts);
    }
  }

  private generateBasicTimestamps(
    duration: string,
    concepts: string[]
  ): VideoMetadata['keyTimestamps'] {
    const totalMinutes = this.parseDurationToMinutes(duration);
    const totalSeconds = totalMinutes * 60;
    const timestamps: VideoMetadata['keyTimestamps'] = [];
    
    // Always start with introduction
    timestamps.push({
      time: 0,
      topic: 'Introduction',
      description: 'Overview and context setting',
    });
    
    if (concepts.length > 0) {
      // Distribute concepts evenly throughout the video
      const interval = totalSeconds / (concepts.length + 2); // +2 for intro and conclusion
      
      concepts.forEach((concept, index) => {
        timestamps.push({
          time: Math.round(interval * (index + 1)),
          topic: this.capitalizeFirst(concept),
          description: `Discussion of ${concept} in Jungian context`,
        });
      });
    }
    
    // Add conclusion if video is long enough
    if (totalMinutes > 5) {
      timestamps.push({
        time: Math.round(totalSeconds * 0.9),
        topic: 'Conclusion',
        description: 'Summary and key takeaways',
      });
    }
    
    return timestamps;
  }

  private generateBasicLearningOutcomes(title: string, concepts: string[]): string[] {
    const outcomes: string[] = [];
    
    // Generate based on video title
    if (title.toLowerCase().includes('introduction')) {
      outcomes.push('Understand fundamental concepts of Jungian psychology');
    }
    
    // Generate based on concepts
    if (concepts.length > 0) {
      outcomes.push(`Identify and explain ${concepts[0]} in psychological context`);
      if (concepts.length > 1) {
        outcomes.push(`Compare and contrast different Jungian concepts`);
      }
    }
    
    // Add generic outcomes
    outcomes.push('Apply Jungian principles to personal development');
    
    return outcomes.slice(0, 3); // Return max 3 outcomes
  }

  private enhanceTitle(title: string, metadata: VideoMetadata): string {
    // Truncate very long titles
    let processedTitle = title;
    if (title.length > 300) {
      processedTitle = title.substring(0, 297) + '...';
    }
    
    // Add difficulty indicator if not already present
    const difficultyIndicators = {
      beginner: '(Introductory)',
      intermediate: '',
      advanced: '(Advanced)',
    };
    
    const indicator = difficultyIndicators[metadata.difficulty];
    if (indicator && !processedTitle.includes(indicator)) {
      return `${processedTitle} ${indicator}`.trim();
    }
    
    return processedTitle;
  }

  private async enhanceDescription(
    video: YouTubeVideo,
    metadata: VideoMetadata,
    options: EnrichmentOptions
  ): Promise<string> {
    let enhanced = video.description;
    
    // Add educational context
    if (metadata.educationalValue > 0.7) {
      enhanced = `⭐ Highly recommended educational content\n\n${enhanced}`;
    }
    
    // Add learning outcomes
    if (metadata.learningOutcomes && metadata.learningOutcomes.length > 0) {
      enhanced += '\n\n📚 Learning Outcomes:\n';
      enhanced += metadata.learningOutcomes.map(outcome => `• ${outcome}`).join('\n');
    }
    
    // Add prerequisites
    if (metadata.suggestedPrerequisites && metadata.suggestedPrerequisites.length > 0) {
      enhanced += '\n\n📋 Prerequisites:\n';
      enhanced += metadata.suggestedPrerequisites.map(prereq => `• ${prereq}`).join('\n');
    }
    
    // Add timestamps
    if (metadata.keyTimestamps && metadata.keyTimestamps.length > 0) {
      enhanced += '\n\n⏱️ Key Timestamps:\n';
      enhanced += metadata.keyTimestamps.map(ts => 
        `${this.formatTimestamp(ts.time)} - ${ts.topic}`
      ).join('\n');
    }
    
    // Add relevance note
    if (options.courseContext && metadata.relevanceScore > 0.8) {
      enhanced += `\n\n🎯 Highly relevant to: ${options.courseContext.topic}`;
    }
    
    return enhanced;
  }

  private determineVideoType(metadata: VideoMetadata): 'required' | 'optional' | 'supplementary' {
    // Required for high educational value and relevance
    if (metadata.educationalValue > 0.8 && metadata.relevanceScore > 0.8) {
      return 'required';
    }
    
    // Optional for moderate scores
    if (metadata.educationalValue > 0.6 || metadata.relevanceScore > 0.6) {
      return 'optional';
    }
    
    // Supplementary for everything else
    return 'supplementary';
  }

  private parseDurationToMinutes(isoDuration: string): number {
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');
    
    return hours * 60 + minutes + Math.ceil(seconds / 60);
  }

  private parseDurationToObject(isoDuration: string): import('../../schemas/module.schema').VideoDuration {
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) {
      return { hours: 0, minutes: 0, seconds: 0 };
    }
    
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');
    
    return {
      hours,
      minutes,
      seconds
    };
  }

  private formatTimestamp(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private convertMinutesToDuration(totalMinutes: number): import('../../schemas/module.schema').VideoDuration {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    const seconds = Math.floor((totalMinutes % 1) * 60);
    
    return {
      hours,
      minutes,
      seconds
    };
  }

  calculateRelevanceMatrix(
    videos: Array<Video & { metadata: VideoMetadata }>,
    concepts: string[]
  ): Map<string, number[]> {
    const matrix = new Map<string, number[]>();
    
    concepts.forEach(concept => {
      const scores = videos.map(video => {
        const conceptLower = concept.toLowerCase();
        let score = 0;
        
        // Check title
        if (video.title.toLowerCase().includes(conceptLower)) score += 0.4;
        
        // Check description
        if (video.description.toLowerCase().includes(conceptLower)) score += 0.2;
        
        // Check metadata concepts
        if (video.metadata.relatedConcepts.some(c => c.toLowerCase() === conceptLower)) {
          score += 0.4;
        }
        
        return Math.min(score, 1);
      });
      
      matrix.set(concept, scores);
    });
    
    return matrix;
  }

  async generateVideoSummary(
    video: Video & { metadata: VideoMetadata },
    maxLength: number = 200
  ): Promise<string> {
    if (this.llmProvider) {
      const prompt = `
Summarize this educational video in ${maxLength} characters or less:
Title: ${video.title}
Description: ${video.description}
Key Concepts: ${video.metadata.relatedConcepts.join(', ')}

Focus on what students will learn and why it's valuable.`;

      try {
        const response = await this.llmProvider.generateCompletion(prompt, { temperature: 0.5 });
        return response.content;
      } catch (error) {
        // Fallback to basic summary
      }
    }

    // Basic summary generation
    const concepts = video.metadata.relatedConcepts.slice(0, 3).join(', ');
    const totalMinutes = video.duration.hours * 60 + video.duration.minutes;
    const duration = `${totalMinutes} min`;
    const level = video.metadata.difficulty;
    
    return `${duration} ${level} video covering ${concepts}. ${video.metadata.learningOutcomes?.[0] || 'Explores Jungian concepts.'}`
      .substring(0, maxLength);
  }
}