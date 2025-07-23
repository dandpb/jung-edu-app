# Test Files Needed for jaqEdu

## Critical Test Files to Create (Priority 1)

### LLM Services (0% coverage - MUST reach 95%)
1. `src/services/llm/generators/__tests__/bibliography-generator.test.ts`
2. `src/services/llm/generators/__tests__/mindmap-generator.test.ts`
3. `src/services/llm/generators/__tests__/video-generator.test.ts`
4. `src/services/llm/providers/__tests__/mock.test.ts`
5. `src/services/llm/providers/__tests__/openai.test.ts`

### Video Services
1. `src/services/video/__tests__/videoEnricher.test.ts`

### Quiz Services
1. `src/services/quiz/__tests__/adaptiveQuizEngine.test.ts`
2. `src/services/quiz/__tests__/contentAnalyzer.test.ts`
3. `src/services/quiz/__tests__/questionTypeGenerators.test.ts`
4. `src/services/quiz/__tests__/quizTemplates.test.ts`

### Mindmap Services
1. `src/services/mindmap/__tests__/llmMindMapGenerator.test.ts`

### Resource Pipeline Services
1. `src/services/resourcePipeline/__tests__/enhancedGenerator.test.ts`
2. `src/services/resourcePipeline/__tests__/integrationHooks.test.ts`
3. `src/services/resourcePipeline/__tests__/monitoring.test.ts`

## Test Files to Improve (Priority 2)

### Components with Low Coverage
1. Improve `src/components/admin/__tests__/GenerationProgress.test.tsx` (3.57% → 85%)
2. Improve `src/components/admin/__tests__/ModulePreview.test.tsx` (2.38% → 85%)
3. Improve `src/components/mindmap/__tests__/InteractiveMindMap.test.tsx` (5.3% → 85%)
4. Improve `src/components/mindmap/__tests__/ModuleDeepDiveMindMap.test.tsx` (3.22% → 85%)
5. Improve `src/components/common/__tests__/MarkdownContent.test.tsx` (16% → 85%)

### Services to Improve
1. Improve `src/__tests__/services/bibliography/bibliographyEnricher.test.ts` (32.57% → 95%)
2. Improve `src/__tests__/services/video/youtubeService.test.ts` (50.84% → 95%)
3. Improve `src/__tests__/services/modules/moduleService.crud.test.ts` (55.75% → 95%)

### Pages to Test
1. Create `src/pages/__tests__/ProgressPage.test.tsx` (improve from current)
2. Create `src/pages/admin/__tests__/AdminDashboard.test.tsx` (9.09% → 85%)

## Test Files for New Features (Priority 3)

### Validation Services
1. `src/services/validation/__tests__/endToEndValidator.test.ts`
2. `src/services/validation/__tests__/integrationValidator.test.ts`
3. `src/services/validation/__tests__/systemValidator.test.ts`

### Schema Tests
1. `src/schemas/__tests__/module.validator.test.ts`
2. `src/schemas/__tests__/module.schema.test.ts`

### Utils
1. Create comprehensive `src/utils/__tests__/localStorage.test.ts` (0% → 90%)
2. Improve `src/utils/__tests__/i18n.test.ts` (40% → 90%)

## Test Template Structure

Each test file should follow this structure:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ServiceName } from '../ServiceName';

// Mock dependencies
jest.mock('../dependencies');

describe('ServiceName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Core Functionality', () => {
    it('should handle main use case', async () => {
      // Test implementation
    });

    it('should handle edge cases', () => {
      // Test implementation
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      // Test implementation
    });
  });

  describe('Integration', () => {
    it('should work with dependencies', async () => {
      // Test implementation
    });
  });
});
```

## Estimated Time per Test File

- Simple utility tests: 1-2 hours
- Component tests: 2-3 hours
- Service tests: 3-4 hours
- Integration tests: 4-5 hours

## Total Estimated Effort

- Priority 1 (Critical): 15 files × 3 hours = 45 hours
- Priority 2 (Improvements): 10 files × 2 hours = 20 hours
- Priority 3 (New Features): 8 files × 2.5 hours = 20 hours

**Total: ~85 hours of testing work**

## Quick Wins (Can be done in <1 hour each)

1. Fix failing tests in `reportWebVitals.test.ts`
2. Fix failing tests in `useAdmin.test.tsx`
3. Add basic tests for `localStorage.ts`
4. Add tests for simple utility functions
5. Complete coverage for `i18n.ts`

## Testing Best Practices to Follow

1. **Mock External Dependencies**: All API calls, localStorage, etc.
2. **Test User Interactions**: For components, test from user perspective
3. **Cover Edge Cases**: Null values, errors, empty states
4. **Async Testing**: Use proper async patterns with waitFor
5. **Snapshot Testing**: For UI components where appropriate
6. **Integration Tests**: Test service interactions
7. **Performance Tests**: For critical paths