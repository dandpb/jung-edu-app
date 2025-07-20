import { ILLMProvider } from '../provider';
import { Video } from '../../../types'; // Use the simpler Video type from types
import { YouTubeService, YouTubeVideo } from '../../video/youtubeService';
import { VideoEnricher, VideoMetadata } from '../../video/videoEnricher';

export interface YouTubeSearchResult {
  videoId: string;
  title: string;
  description: string;
  channelTitle: string;
  duration: string;
  viewCount: number;
  publishedAt: Date;
  thumbnailUrl: string;
}

export class VideoGenerator {
  private youtubeService: YouTubeService;
  private videoEnricher: VideoEnricher;

  constructor(private provider: ILLMProvider) {
    this.youtubeService = new YouTubeService();
    this.videoEnricher = new VideoEnricher(provider);
  }

  async generateVideos(
    topic: string,
    concepts: string[],
    targetAudience: string,
    count: number = 5,
    language: string = 'pt-BR'
  ): Promise<Video[]> {
    console.log('🎥 VideoGenerator.generateVideos called with:', { topic, concepts, targetAudience, count, language });
    
    // Generate search queries using LLM
    const searchQueries = await this.generateSearchQueries(topic, concepts, targetAudience, language);
    
    // Ensure searchQueries is an array
    let queries = searchQueries;
    if (!Array.isArray(queries)) {
      console.error('Search queries is not an array:', queries);
      // Create fallback search queries
      queries = language === 'pt-BR' ? [
        `${topic} Jung psicologia palestra português`,
        `${topic} psicologia analítica explicação legendado`,
        `Jung ${topic} conceitos tutorial Brasil`
      ] : [
        `${topic} Jung psychology lecture`,
        `${topic} analytical psychology explanation`,
        `Jung ${topic} concepts tutorial`
      ];
    }
    
    console.log('🔍 Search queries:', queries);
    
    // Search for real videos using YouTube service
    const searchPromises = queries.slice(0, 3).map(query => 
      this.youtubeService.searchVideos(query, {
        maxResults: Math.ceil(count / 2),
        order: 'relevance',
        videoDuration: 'medium', // Prefer 4-20 minute videos for education
        safeSearch: 'strict',
      })
    );
    
    const searchResults = await Promise.all(searchPromises);
    const allVideos = searchResults.flat();
    
    console.log('📺 Found videos:', allVideos.length, 'videos');
    console.log('📺 Sample video IDs:', allVideos.slice(0, 3).map(v => ({ id: v.videoId, title: v.title })));
    
    // Remove duplicates based on video ID
    const uniqueVideos = Array.from(
      new Map(allVideos.map(v => [v.videoId, v])).values()
    );
    
    // If no videos found, return mock videos with real YouTube IDs
    if (uniqueVideos.length === 0) {
      console.warn('⚠️ No videos found from YouTube search, using fallback videos');
      const fallbackVideos: Video[] = [
        {
          id: `video-${Date.now()}-1`,
          title: language === 'pt-BR' ? `Introdução ao ${topic} - Psicologia Junguiana` : `Introduction to ${topic} - Jungian Psychology`,
          youtubeId: 'nBUQsNpyPHs', // Real Jung video ID
          url: 'https://www.youtube.com/watch?v=nBUQsNpyPHs',
          description: language === 'pt-BR' ? 
            `Uma exploração dos conceitos fundamentais de ${topic} na psicologia analítica de Jung.` :
            `An exploration of fundamental concepts of ${topic} in Jung's analytical psychology.`,
          duration: 24
        },
        {
          id: `video-${Date.now()}-2`,
          title: language === 'pt-BR' ? `${topic} e o Processo de Individuação` : `${topic} and the Individuation Process`,
          youtubeId: 'VjZyGfb-LbM', // Real Jung video ID
          url: 'https://www.youtube.com/watch?v=VjZyGfb-LbM',
          description: language === 'pt-BR' ?
            `Como ${topic} se relaciona com o processo de individuação e desenvolvimento pessoal.` :
            `How ${topic} relates to the individuation process and personal development.`,
          duration: 18
        }
      ];
      return fallbackVideos;
    }
    
    // Enrich videos with metadata and educational analysis
    const enrichedVideos = await this.videoEnricher.enrichMultipleVideos(
      uniqueVideos.slice(0, count * 2), // Process more videos than needed
      {
        assessDifficulty: true,
        extractLearningOutcomes: true,
        targetAudience,
        courseContext: {
          topic,
          concepts,
        },
      }
    );
    
    // Select the best videos based on educational value and relevance
    const selectedVideos = enrichedVideos
      .sort((a, b) => {
        // Prioritize by combined score
        const scoreA = (a.metadata.educationalValue * 0.4) + (a.metadata.relevanceScore * 0.6);
        const scoreB = (b.metadata.educationalValue * 0.4) + (b.metadata.relevanceScore * 0.6);
        return scoreB - scoreA;
      })
      .slice(0, count);
    
    console.log('✅ Selected videos:', selectedVideos.length);
    
    // Convert to Video format with actual YouTube IDs
    return selectedVideos.map(video => {
      const { metadata, ...videoResource } = video;
      // Get YouTube ID from enriched video (which uses schema Video type)
      const youtubeId = this.extractYouTubeIdFromUrl(video.url) || (video as any).videoId;
      
      // Return simple Video type from types/index.ts
      return {
        id: video.id,
        title: video.title,
        youtubeId: youtubeId,
        url: video.url,
        description: video.description,
        duration: this.convertDurationToMinutes(video.duration)
      } as Video;
    });
  }

  private async generateSearchQueries(
    topic: string,
    concepts: string[],
    targetAudience: string,
    language: string = 'pt-BR'
  ): Promise<string[]> {
    const prompt = language === 'pt-BR' ? `Gere exatamente 8 queries de busca do YouTube para encontrar vídeos educacionais sobre "${topic}" em psicologia junguiana.

Conceitos-chave a cobrir:
${concepts.map(c => `- ${c}`).join('\n')}

Público-alvo: ${targetAudience}

CRÍTICO: Você deve responder com um array JSON contendo exatamente 8 strings de consulta de busca.

Gere consultas de busca específicas que encontrem:
1. Palestras acadêmicas sobre o tópico
2. Explicações animadas de conceitos complexos
3. Estudos de caso ou aplicações práticas
4. Contexto histórico do trabalho de Jung
5. Interpretações e desenvolvimentos modernos

Foque em consultas que retornem conteúdo educacional de alta qualidade.
IMPORTANTE: As queries devem incluir termos em português (legendado, português, Brasil)

Formato de exemplo (responda exatamente com esta estrutura):
[
  "Jung ${topic} psicologia palestra português",
  "psicologia analítica ${topic} explicação legendado",
  "Carl Jung ${topic} conceitos tutorial Brasil",
  "${topic} processo de individuação português",
  "${topic} estudo de caso junguiano legendado",
  "${topic} inconsciente coletivo português",
  "${topic} psicologia moderna pesquisa Brasil",
  "${topic} Jung trabalho com sombra legendado"
]` : `Generate exactly 8 YouTube search queries to find educational videos about "${topic}" in Jungian psychology.

Key concepts to cover:
${concepts.map(c => `- ${c}`).join('\n')}

Target audience: ${targetAudience}

CRITICAL: You must respond with a JSON array containing exactly 8 search query strings.

Generate specific search queries that would find:
1. Academic lectures on the topic
2. Animated explanations of complex concepts
3. Case studies or practical applications
4. Historical context from Jung's work
5. Modern interpretations and developments

Focus on queries that would return high-quality, educational content.

Example format (respond with exactly this structure):
[
  "Jung ${topic} psychology lecture",
  "analytical psychology ${topic} explanation",
  "Carl Jung ${topic} concepts tutorial",
  "${topic} individuation process",
  "Jungian ${topic} case study",
  "${topic} collective unconscious",
  "modern ${topic} psychology research",
  "${topic} Jung shadow work"
]`;

    const schema = {
      type: "array",
      items: { type: "string" },
      minItems: 6,
      maxItems: 10
    };

    console.log('About to call generateStructuredResponse with schema:', schema);
    
    const result = await this.provider.generateStructuredResponse<string[]>(
      prompt,
      schema,
      { temperature: 0.5, retries: 3 }
    );

    console.log('Generated search queries:', result, 'Type:', typeof result, 'Is array:', Array.isArray(result));
    
    // Double-check if result is actually the schema (cast to any for comparison)
    if ((result as any) === schema || (result as any)?.type === 'array') {
      console.error('CRITICAL: generateStructuredResponse returned the schema object instead of a response!');
      // Force a fallback
      const fallbackQueries = language === 'pt-BR' ? [
        `${topic} Jung psicologia palestra português`,
        `${topic} psicologia analítica explicação legendado`,
        `Jung ${topic} conceitos tutorial Brasil`,
        `${topic} processo individuação português`,
        `${topic} estudo de caso junguiano legendado`,
        `${topic} inconsciente coletivo português`,
        `${topic} psicologia moderna pesquisa Brasil`,
        `${topic} Jung teoria legendado`
      ] : [
        `${topic} Jung psychology lecture`,
        `${topic} analytical psychology explanation`,
        `Jung ${topic} concepts tutorial`,
        `${topic} individuation process`,
        `Jungian ${topic} case study`,
        `${topic} collective unconscious`,
        `modern ${topic} psychology research`,
        `${topic} Jung theory`
      ];
      return fallbackQueries;
    }
    
    // Ensure we have an array
    if (!Array.isArray(result)) {
      console.error('Search queries result is not an array:', result);
      
      // Try to handle if queries are wrapped in an object
      if (typeof result === 'object' && 'queries' in result && Array.isArray((result as any).queries)) {
        console.log('Found queries in wrapper object, using those');
        return (result as any).queries;
      } else {
        console.warn('Using fallback search queries due to invalid response');
        // Create fallback queries
        return language === 'pt-BR' ? [
          `${topic} Jung psicologia palestra português`,
          `${topic} psicologia analítica explicação legendado`,
          `Jung ${topic} conceitos tutorial Brasil`,
          `${topic} processo individuação português`,
          `${topic} estudo de caso junguiano legendado`,
          `${topic} inconsciente coletivo português`,
          `${topic} psicologia moderna pesquisa Brasil`,
          `${topic} Jung teoria legendado`
        ] : [
          `${topic} Jung psychology lecture`,
          `${topic} analytical psychology explanation`,
          `Jung ${topic} concepts tutorial`,
          `${topic} individuation process`,
          `Jungian ${topic} case study`,
          `${topic} collective unconscious`,
          `modern ${topic} psychology research`,
          `${topic} Jung theory`
        ];
      }
    }
    
    return result;
  }

  private async generateVideoSuggestions(
    topic: string,
    concepts: string[],
    searchQueries: string[],
    count: number,
    language: string = 'pt-BR'
  ): Promise<Array<{
    title: string;
    description: string;
    url: string;
    duration: number;
    relatedConcepts: string[];
  }>> {
    const prompt = language === 'pt-BR' ? `
Com base nestas consultas de pesquisa para vídeos de psicologia junguiana sobre "${topic}":
${searchQueries.map((q, i) => `${i + 1}. ${q}`).join('\n')}

Gere ${count} sugestões de recursos de vídeo que seriam valiosos para aprender estes conceitos:
${concepts.map(c => `- ${c}`).join('\n')}

Para cada vídeo, forneça:
1. Um título educacional que indique claramente o conteúdo
2. Uma descrição explicando o que os estudantes aprenderão
3. Duração estimada em minutos (realista para o tipo de conteúdo)
4. Quais conceitos específicos da lista ele cobre

Torne as sugestões diversas:
- Misture conteúdo estilo palestra e animado
- Varie a duração de curto (5-10 min) a mais longo (20-45 min)
- Inclua conteúdo introdutório e avançado

IMPORTANTE: Todos os títulos e descrições devem estar em português brasileiro (pt-BR).

Formato de resposta:
[
  {
    "title": "Título do vídeo",
    "description": "O que os estudantes aprenderão",
    "url": "https://youtube.com/watch?v=PLACEHOLDER",
    "duration": 15,
    "relatedConcepts": ["conceito1", "conceito2"]
  }
]
` : `
Based on these search queries for Jungian psychology videos about "${topic}":
${searchQueries.map((q, i) => `${i + 1}. ${q}`).join('\n')}

Generate ${count} video resource suggestions that would be valuable for learning these concepts:
${concepts.map(c => `- ${c}`).join('\n')}

For each video, provide:
1. An educational title that clearly indicates the content
2. A description explaining what students will learn
3. Estimated duration in minutes (realistic for the content type)
4. Which specific concepts from the list it covers

Make the suggestions diverse:
- Mix lecture-style and animated content
- Vary duration from short (5-10 min) to longer (20-45 min)
- Include both introductory and advanced content

Response format:
[
  {
    "title": "Video title",
    "description": "What students will learn",
    "url": "https://youtube.com/watch?v=PLACEHOLDER",
    "duration": 15,
    "relatedConcepts": ["concept1", "concept2"]
  }
]
`;

    const suggestions = await this.provider.generateStructuredResponse<Array<{
      title: string;
      description: string;
      url: string;
      duration: number;
      relatedConcepts: string[];
    }>>(prompt, [], { temperature: 0.7, maxTokens: 2000 });

    console.log('Generated video suggestions:', suggestions, 'Type:', typeof suggestions, 'Is array:', Array.isArray(suggestions));

    // Ensure suggestions is an array
    if (!Array.isArray(suggestions)) {
      console.error('Video suggestions is not an array:', suggestions);
      
      // Try to handle if suggestions are wrapped in an object
      if (typeof suggestions === 'object' && 'videos' in suggestions && Array.isArray((suggestions as any).videos)) {
        console.log('Found videos in wrapper object, using those');
        return (suggestions as any).videos;
      } else {
        console.warn('Using fallback video suggestions due to invalid response');
        // Create fallback suggestions
        return language === 'pt-BR' ? [
          {
            title: `Introdução ao ${topic} na Psicologia Junguiana`,
            description: `Aprenda os conceitos fundamentais do ${topic} e seu papel na psicologia analítica.`,
            url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
            duration: 15,
            relatedConcepts: concepts.slice(0, 2)
          },
          {
            title: `Conceitos e Aplicações Avançadas de ${topic}`,
            description: `Explore aspectos mais profundos do ${topic} e aplicações práticas na terapia.`,
            url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
            duration: 25,
            relatedConcepts: concepts.slice(1, 3)
          }
        ] : [
          {
            title: `Introduction to ${topic} in Jungian Psychology`,
            description: `Learn the fundamental concepts of ${topic} and its role in analytical psychology.`,
            url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
            duration: 15,
            relatedConcepts: concepts.slice(0, 2)
          },
          {
            title: `Advanced ${topic} Concepts and Applications`,
            description: `Explore deeper aspects of ${topic} and practical applications in therapy.`,
            url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
            duration: 25,
            relatedConcepts: concepts.slice(1, 3)
          }
        ];
      }
    }

    // In production, these would be replaced with actual YouTube API searches
    return suggestions;
  }

  async searchYouTubeVideos(
    queries: string[],
    apiKey?: string
  ): Promise<YouTubeSearchResult[]> {
    // Use the new YouTube service for searching
    const searchPromises = queries.map(query => 
      this.youtubeService.searchVideos(query, {
        maxResults: 5,
        order: 'relevance',
        safeSearch: 'strict',
      })
    );
    
    const results = await Promise.all(searchPromises);
    const allVideos = results.flat();
    
    // Convert to legacy format for backward compatibility
    return allVideos.map(video => ({
      videoId: video.videoId,
      title: video.title,
      description: video.description,
      channelTitle: video.channelTitle,
      duration: video.duration,
      viewCount: parseInt(video.viewCount),
      publishedAt: new Date(video.publishedAt),
      thumbnailUrl: video.thumbnails.high.url,
    }));
  }

  async curateVideoPlaylist(
    videos: YouTubeSearchResult[],
    topic: string,
    learningPath: string[]
  ): Promise<Video[]> {
    // Convert legacy format to YouTubeVideo format
    const youtubeVideos: YouTubeVideo[] = videos.map(v => ({
      videoId: v.videoId,
      title: v.title,
      description: v.description,
      channelId: '', // Not available in legacy format
      channelTitle: v.channelTitle,
      publishedAt: v.publishedAt.toISOString(),
      duration: v.duration,
      viewCount: v.viewCount.toString(),
      thumbnails: {
        default: { url: v.thumbnailUrl, width: 120, height: 90 },
        medium: { url: v.thumbnailUrl, width: 320, height: 180 },
        high: { url: v.thumbnailUrl, width: 480, height: 360 },
      },
    }));
    
    // Enrich videos with educational metadata
    const enrichedVideos = await this.videoEnricher.enrichMultipleVideos(
      youtubeVideos,
      {
        assessDifficulty: true,
        extractLearningOutcomes: true,
        generateTimestamps: true,
        courseContext: {
          topic,
          concepts: learningPath,
          previousTopics: [],
        },
      }
    );
    
    // Create a relevance matrix for learning path alignment
    const relevanceMatrix = this.videoEnricher.calculateRelevanceMatrix(
      enrichedVideos,
      learningPath
    );
    
    // Select videos that best match the learning path progression
    const selectedVideos: Video[] = [];
    const usedVideoIds = new Set<string>();
    
    for (const pathStep of learningPath) {
      const scores = relevanceMatrix.get(pathStep) || [];
      let bestVideoIndex = -1;
      let bestScore = 0;
      
      enrichedVideos.forEach((video, index) => {
        if (!usedVideoIds.has(video.id) && scores[index] > bestScore) {
          bestScore = scores[index];
          bestVideoIndex = index;
        }
      });
      
      if (bestVideoIndex !== -1) {
        const video = enrichedVideos[bestVideoIndex];
        usedVideoIds.add(video.id);
        
        // Enhance description with learning path context
        const enhancedVideo: Video = {
          ...video,
          description: `${video.description}\n\n📍 Caminho de Aprendizagem: ${pathStep}`,
        };
        
        // Remove metadata from final output
        const { metadata, ...finalVideo } = enhancedVideo as any;
        selectedVideos.push(finalVideo);
      }
    }
    
    // Add any remaining high-value videos as supplementary
    const remainingVideos = enrichedVideos
      .filter(v => !usedVideoIds.has(v.id))
      .sort((a, b) => b.metadata.educationalValue - a.metadata.educationalValue)
      .slice(0, Math.max(0, videos.length - selectedVideos.length))
      .map(video => {
        const { metadata, ...videoResource } = video;
        return {
          ...videoResource,
          type: 'supplementary' as const,
        };
      });
    
    return [...selectedVideos, ...remainingVideos];
  }

  private parseDuration(isoDuration: string): number {
    // Parse ISO 8601 duration to minutes
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');
    
    return hours * 60 + minutes + Math.ceil(seconds / 60);
  }

  private extractYouTubeIdFromUrl(url: string): string | null {
    if (!url) return null;
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  private convertDurationToMinutes(duration: any): number {
    // Handle schema's VideoDuration object
    if (typeof duration === 'object' && duration.hours !== undefined) {
      return duration.hours * 60 + duration.minutes + Math.ceil((duration.seconds || 0) / 60);
    }
    // Handle number (already in minutes)
    if (typeof duration === 'number') {
      return duration;
    }
    // Handle ISO duration string
    if (typeof duration === 'string') {
      return this.parseDuration(duration);
    }
    return 15; // Default duration
  }

  /**
   * Search for educational channels specializing in Jungian psychology
   */
  async discoverEducationalChannels(
    topic: string,
    maxChannels: number = 5
  ): Promise<Array<{ channelId: string; channelTitle: string; description: string }>> {
    const channels = await this.youtubeService.searchEducationalChannels(
      `${topic} Jung psychology`,
      maxChannels
    );
    
    return channels.map(channel => ({
      channelId: channel.channelId,
      channelTitle: channel.title,
      description: channel.description,
    }));
  }

  /**
   * Get videos from specific educational playlists
   */
  async getPlaylistVideos(
    playlistId: string,
    maxVideos: number = 20
  ): Promise<Video[]> {
    const videos = await this.youtubeService.getPlaylistVideos(playlistId, maxVideos);
    
    const enrichedVideos = await this.videoEnricher.enrichMultipleVideos(videos, {
      assessDifficulty: true,
      extractLearningOutcomes: true,
    });
    
    return enrichedVideos.map(video => {
      const { metadata, ...videoResource } = video;
      return videoResource;
    });
  }

  /**
   * Generate a video learning path with progressive difficulty
   */
  async generateProgressiveLearningPath(
    topic: string,
    concepts: string[],
    targetAudience: string,
    language: string = 'pt-BR'
  ): Promise<{
    beginner: Video[];
    intermediate: Video[];
    advanced: Video[];
  }> {
    // Search for videos across different difficulty levels
    const queries = language === 'pt-BR' ? [
      `${topic} introdução básico iniciante português`,
      `${topic} explicado intermediário legendado`,
      `${topic} avançado teoria clínica Brasil`,
    ] : [
      `${topic} introduction basics beginner`,
      `${topic} explained intermediate`,
      `${topic} advanced theory clinical`,
    ];
    
    const searchPromises = queries.map(query => 
      this.youtubeService.searchVideos(query, {
        maxResults: 10,
        order: 'relevance',
        safeSearch: 'strict',
      })
    );
    
    const [beginnerVideos, intermediateVideos, advancedVideos] = await Promise.all(searchPromises);
    
    // Enrich all videos
    const enrichmentOptions = {
      assessDifficulty: true,
      extractLearningOutcomes: true,
      targetAudience,
      courseContext: { topic, concepts },
    };
    
    const [enrichedBeginner, enrichedIntermediate, enrichedAdvanced] = await Promise.all([
      this.videoEnricher.enrichMultipleVideos(beginnerVideos, enrichmentOptions),
      this.videoEnricher.enrichMultipleVideos(intermediateVideos, enrichmentOptions),
      this.videoEnricher.enrichMultipleVideos(advancedVideos, enrichmentOptions),
    ]);
    
    // Filter videos by their analyzed difficulty level
    const filterByDifficulty = (videos: any[], targetDifficulty: string) => 
      videos
        .filter(v => v.metadata.difficulty === targetDifficulty)
        .slice(0, 3)
        .map(video => {
          const { metadata, ...videoResource } = video;
          return videoResource;
        });
    
    return {
      beginner: filterByDifficulty(enrichedBeginner, 'beginner'),
      intermediate: filterByDifficulty(enrichedIntermediate, 'intermediate'),
      advanced: filterByDifficulty(enrichedAdvanced, 'advanced'),
    };
  }

  /**
   * Get video recommendations based on watch history
   */
  async getRecommendations(
    watchedVideoIds: string[],
    topic: string,
    concepts: string[]
  ): Promise<Video[]> {
    // Get details of watched videos
    const watchedVideos = await Promise.all(
      watchedVideoIds.map(id => this.youtubeService.getVideoById(id))
    );
    
    // Extract common themes and channels
    const watchedChannels = new Set(watchedVideos.filter(v => v).map(v => v!.channelId));
    const watchedTags = new Set(
      watchedVideos
        .filter(v => v?.tags)
        .flatMap(v => v!.tags!)
    );
    
    // Generate personalized search queries
    const prompt = `
Based on these watched videos about Jungian psychology:
${watchedVideos.filter(v => v).map(v => `- ${v!.title}`).join('\n')}

Generate 5 search queries for finding similar but complementary videos on "${topic}".
Focus on: ${concepts.join(', ')}

The queries should explore related topics not yet covered but building on what was watched.

Response format:
[
  "search query 1",
  "search query 2",
  ...
]`;

    const recommendationQueries = await this.provider.generateStructuredResponse<string[]>(
      prompt,
      [],
      { temperature: 0.7 }
    );
    
    // Search for recommendations
    const searchPromises = recommendationQueries.slice(0, 3).map(query =>
      this.youtubeService.searchVideos(query, {
        maxResults: 5,
        order: 'relevance',
      })
    );
    
    const searchResults = await Promise.all(searchPromises);
    const allVideos = searchResults.flat();
    
    // Filter out already watched videos
    const newVideos = allVideos.filter(v => !watchedVideoIds.includes(v.videoId));
    
    // Enrich and return
    const enrichedVideos = await this.videoEnricher.enrichMultipleVideos(
      newVideos.slice(0, 10),
      {
        assessDifficulty: true,
        targetAudience: 'Continuing learners',
        courseContext: { topic, concepts },
      }
    );
    
    return enrichedVideos
      .slice(0, 5)
      .map(video => {
        const { metadata, ...videoResource } = video;
        return videoResource;
      });
  }
}