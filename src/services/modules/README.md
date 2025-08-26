# Module Management API

This directory contains the module management services for the Jung Education App. Since there's no backend, all services use localStorage for persistence.

## Services

### ModuleService (`moduleService.ts`)

Core CRUD operations for educational modules:

```typescript
// Get all modules
const modules = await ModuleService.getAllModules();

// Get single module
const module = await ModuleService.getModuleById('module-id');

// Create new module
const newModule = await ModuleService.createModule({
  title: 'Introduction to Archetypes',
  description: 'Learn about Jung\'s core concept of archetypes',
  difficultyLevel: DifficultyLevel.BEGINNER,
  // ... other fields
});

// Update module
const updated = await ModuleService.updateModule('module-id', {
  title: 'Updated Title'
});

// Delete module
const deleted = await ModuleService.deleteModule('module-id');

// Search modules
const results = await ModuleService.searchModules({
  query: 'shadow',
  difficultyLevel: DifficultyLevel.INTERMEDIATE,
  tags: ['psychology', 'jung']
});

// Export/Import
const json = await ModuleService.exportModules(['module-1', 'module-2']);
const imported = await ModuleService.importModules(json);
```

### ModuleGenerator (`moduleGenerator.ts`)

AI-powered module content generation:

```typescript
// Create generator (with or without LLM provider)
const generator = new ModuleGenerator(llmProvider);

// Generate complete module
const module = await generator.generateModule({
  topic: 'The Shadow Self',
  difficulty: DifficultyLevel.INTERMEDIATE,
  duration: 90, // minutes
  includeVideos: true,
  includeQuiz: true,
  onProgress: (progress) => {
    console.log(`${progress.stage}: ${progress.progress}%`);
  }
});

// Resume from draft
const module = await generator.resumeGeneration('draft-id', options);
```

### useModuleGenerator Hook (`../../hooks/useModuleGenerator.ts`)

React hook for UI integration:

```typescript
function ModuleCreator() {
  const {
    // State
    isGenerating,
    progress,
    generatedModule,
    error,
    drafts,
    
    // Actions
    generateModule,
    cancelGeneration,
    saveDraft,
    resumeFromDraft,
    saveModule,
    updateModule,
    exportModule
  } = useModuleGenerator({
    llmProvider: new OpenAIProvider(apiKey),
    autoSaveDraft: true,
    autoSaveInterval: 30000
  });

  // Generate module
  const handleGenerate = async () => {
    try {
      const module = await generateModule({
        topic: 'Individuation Process',
        difficulty: DifficultyLevel.ADVANCED,
        duration: 120
      });
      console.log('Generated:', module);
    } catch (error) {
      console.error('Generation failed:', error);
    }
  };

  // UI rendering...
}
```

## Data Storage

All data is stored in localStorage with the following keys:

- `jungAppEducationalModules` - Published modules
- `jungAppDraftModules` - Draft modules (auto-saved during generation)

## Integration with LLM

The services integrate with the LLM provider interface (`../llm/provider.ts`):

- **OpenAIProvider** - Real OpenAI API integration
- **MockLLMProvider** - Mock provider for development/testing

## Module Schema

Modules follow the comprehensive schema defined in `../../schemas/module.schema.ts`:

- **Content**: Introduction, sections, summaries, key takeaways
- **Media**: Videos with transcripts, captions, and chapters
- **Visualizations**: Mind maps with nodes, edges, and layouts
- **Assessment**: Quizzes with multiple question types
- **References**: Bibliography and film references
- **Metadata**: Status, author, timestamps, analytics

## Error Handling

All services include comprehensive error handling:

- Validation errors for invalid module data
- Storage errors for localStorage issues
- Generation errors with recovery options
- Network errors for LLM API calls

## Progress Tracking

The generator provides detailed progress updates:

```typescript
enum GenerationStage {
  INITIALIZING = 'initializing',
  GENERATING_CONTENT = 'generating_content',
  GENERATING_QUIZ = 'generating_quiz',
  SOURCING_VIDEOS = 'sourcing_videos',
  CREATING_MINDMAP = 'creating_mindmap',
  ADDING_BIBLIOGRAPHY = 'adding_bibliography',
  FINALIZING = 'finalizing',
  COMPLETED = 'completed',
  ERROR = 'error'
}
```

## Best Practices

1. **Always validate** modules before saving using `validateModule()`
2. **Handle errors** gracefully with try-catch blocks
3. **Use drafts** for long-running generation processes
4. **Monitor progress** to provide user feedback
5. **Export regularly** to backup important modules
6. **Use appropriate LLM settings** (temperature, max tokens) for different content types