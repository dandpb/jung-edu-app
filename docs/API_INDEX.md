# JaqEdu API Quick Reference Index

## Core Services

### 🧠 LLM Orchestration
- **[ModuleGenerationOrchestrator](./API_REFERENCE.md#modulegenerationorchestrator)** - Main orchestrator for content generation
- **[LLMOrchestrator](./API_REFERENCE.md#llmorchestrator)** - Simplified interface for common tasks
- **[ILLMProvider](./API_REFERENCE.md#illmprovider-interface)** - Provider interface for LLM integration
- **[OpenAIProvider](./API_REFERENCE.md#openaiprovider)** - Production LLM provider
- **[MockLLMProvider](./API_REFERENCE.md#mockllmprovider)** - Development/testing provider

### 📚 Module Generation
- **[UnifiedModuleGenerator](./API_REFERENCE.md#unifiedmodulegenerator)** - High-level module generation
- **[ModuleService](./API_REFERENCE.md#moduleservice-api)** - Complete module management
- **[ContentGenerator](./API_REFERENCE.md#module-generation-services)** - Core content generation

### ❓ Quiz Services
- **[EnhancedQuizGenerator](./API_REFERENCE.md#enhancedquizgenerator)** - Advanced quiz generation
- **[QuizService](./API_REFERENCE.md#quiz-service-extended-api)** - Quiz management and analytics
- **[QuizEnhancer](./API_REFERENCE.md#quizenhancer)** - Question enhancement
- **[QuizValidator](./API_REFERENCE.md#quizvalidator)** - Quiz validation

### 🎥 Video Services
- **[VideoEnricher](./API_REFERENCE.md#videoenricher)** - Video content enrichment
- **[VideoService](./API_REFERENCE.md#video-service-extended-api)** - Video management
- **[YouTubeService](./API_REFERENCE.md#youtubeservice)** - YouTube API integration

### 📖 Bibliography Services
- **[BibliographyEnricher](./API_REFERENCE.md#bibliographyenricher)** - Reference enrichment
- **[BibliographyService](./API_REFERENCE.md#bibliography-service-extended-api)** - Reference management
- **[Reference Database](./API_REFERENCE.md#reference-database-functions)** - Built-in references

### 🗺️ Mind Map Services
- **[MindMapGenerator](./API_REFERENCE.md#mindmapgenerator)** - Mind map generation
- **[MindMapService](./API_REFERENCE.md#mind-map-service-extended-api)** - Mind map management
- **[MindMapLayouts](./API_REFERENCE.md#mindmaplayouts)** - Layout algorithms
- **[ReactFlowAdapter](./API_REFERENCE.md#reactflowadapter)** - React Flow integration

## Data Types & Interfaces

### Core Types
- **[Module](./API_REFERENCE.md#core-module-types)** - Module structure
- **[Quiz](./API_REFERENCE.md#quiz-types)** - Quiz and question types
- **[Video](./API_REFERENCE.md#video-types)** - Video metadata
- **[Reference](./API_REFERENCE.md#bibliography-types)** - Bibliography types
- **[MindMapNode/Edge](./API_REFERENCE.md#mind-map-types)** - Mind map structures

### Configuration Types
- **[GenerationOptions](./API_REFERENCE.md#generationoptions)** - Module generation options
- **[EnrichmentOptions](./API_REFERENCE.md#enrichmentoptions)** - Video enrichment options
- **[BibliographyOptions](./API_REFERENCE.md#bibliographyoptions)** - Bibliography search options
- **[MindMapOptions](./API_REFERENCE.md#mindmapoptions)** - Mind map generation options

## Advanced Features

### 🚀 Performance
- **[Rate Limiting](./API_REFERENCE.md#rate-limiting-and-token-management)** - API rate limiting
- **[Caching Strategy](./API_REFERENCE.md#caching-strategy)** - Content caching
- **[Batch Processing](./API_REFERENCE.md#batch-processing)** - Bulk operations
- **[Token Management](./API_REFERENCE.md#rate-limiting-and-token-management)** - LLM token tracking

### 🔐 Security
- **[API Security](./API_REFERENCE.md#api-security)** - Security best practices
- **[Data Protection](./API_REFERENCE.md#data-protection)** - Encryption and validation
- **[Authentication](./API_REFERENCE.md#authentication)** - JWT implementation

### 🔄 Real-time Features
- **[WebSocket API](./API_REFERENCE.md#websocket-api)** - Real-time updates
- **[Event Types](./API_REFERENCE.md#event-types)** - WebSocket events
- **[Progress Tracking](./API_REFERENCE.md#generationprogress)** - Generation progress

### 🛠️ Integration
- **[React Integration](./API_REFERENCE.md#react-component-integration)** - React hooks and components
- **[REST API](./API_REFERENCE.md#rest-api-overview)** - HTTP endpoints
- **[JavaScript SDK](./API_REFERENCE.md#javascripttypescript-sdk)** - JS/TS client library
- **[Python SDK](./API_REFERENCE.md#python-sdk)** - Python client library

## Usage Examples

### Basic Operations
- **[Complete Module Generation](./API_REFERENCE.md#complete-module-generation)** - Generate full modules
- **[Quiz Generation](./API_REFERENCE.md#quiz-generation-with-enhancements)** - Create assessments
- **[Bibliography Generation](./API_REFERENCE.md#bibliography-generation)** - Find references
- **[Mind Map Generation](./API_REFERENCE.md#mind-map-generation)** - Create visualizations
- **[Video Enrichment](./API_REFERENCE.md#video-enrichment)** - Enhance video content

### Advanced Workflows
- **[Adaptive Learning](./API_REFERENCE.md#adaptive-question-generation)** - Personalized quizzes
- **[Study Guide Creation](./API_REFERENCE.md#study-guide-generation)** - Custom study paths
- **[Citation Analysis](./API_REFERENCE.md#citation-network-analysis)** - Reference relationships
- **[Concept Mapping](./API_REFERENCE.md#concept-relationship-analysis)** - Concept connections

## Configuration & Deployment

### Setup
- **[Environment Variables](./API_REFERENCE.md#environment-variables)** - Required configuration
- **[Configuration Object](./API_REFERENCE.md#configuration-object)** - Runtime configuration
- **[Docker Deployment](./API_REFERENCE.md#docker-deployment)** - Container setup
- **[Scaling Guide](./API_REFERENCE.md#scaling-considerations)** - Production scaling

### Monitoring
- **[Health Checks](./API_REFERENCE.md#health-checks)** - Service monitoring
- **[Structured Logging](./API_REFERENCE.md#structured-logging)** - Log management
- **[Analytics Endpoints](./API_REFERENCE.md#analytics-endpoints)** - Usage analytics

## Error Handling

### Error Types
- **[LLMProviderError](./API_REFERENCE.md#common-error-types)** - Provider errors
- **[ValidationError](./API_REFERENCE.md#common-error-types)** - Input validation
- **[GenerationError](./API_REFERENCE.md#common-error-types)** - Generation failures
- **[Error Codes](./API_REFERENCE.md#error-codes)** - Standard error codes

### Best Practices
- **[Error Handling](./API_REFERENCE.md#error-handling-best-practices)** - Try-catch patterns
- **[Graceful Degradation](./API_REFERENCE.md#graceful-degradation)** - Fallback strategies
- **[Retry Logic](./API_REFERENCE.md#retry-logic)** - Automatic retries

## Quick Start Examples

### Generate a Complete Module
```typescript
const orchestrator = new ModuleGenerationOrchestrator();
const result = await orchestrator.generateModule({
  topic: 'Shadow Work',
  objectives: ['Understand the shadow', 'Integration techniques'],
  targetAudience: 'Psychology students',
  duration: 90,
  difficulty: 'intermediate',
  includeVideos: true,
  includeBibliography: true,
  includeMindMap: true,
  quizQuestions: 10
});
```

### Create an Adaptive Quiz
```typescript
const quizGen = new EnhancedQuizGenerator(provider);
const quiz = await quizGen.generateEnhancedQuiz(
  'module-123',
  'Individuation',
  content,
  objectives,
  15,
  {
    useTemplates: true,
    enhanceQuestions: true,
    adaptiveDifficulty: true,
    userLevel: 'intermediate'
  }
);
```

### Search and Enrich Videos
```typescript
const enricher = new VideoEnricher();
const videos = await enricher.searchVideos('Jung archetypes', {
  maxResults: 10,
  language: 'en',
  educationalOnly: true
});
```

### Generate a Mind Map
```typescript
const generator = new MindMapGenerator();
const mindMap = await generator.generateFromModule(module);
const { nodes, edges } = new ReactFlowAdapter().toReactFlow(mindMap);
```

## Additional Resources

- **[API Reference](./API_REFERENCE.md)** - Complete API documentation
- **[Architecture Guide](../ARCHITECTURE.md)** - System architecture
- **[Testing Guide](./TESTING.md)** - Testing strategies
- **[Migration Guide](./API_REFERENCE.md#migration-guide)** - Version migration

## Support Links

- 📧 Email: support@jaqedu.com
- 💬 Discord: [JaqEdu Community](https://discord.gg/jaqedu)
- 🐛 Issues: [GitHub](https://github.com/yourusername/jaqedu)
- 📊 Status: [status.jaqedu.com](https://status.jaqedu.com)