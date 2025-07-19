# Enhanced Quiz Generation System

This directory contains an advanced quiz generation system specifically designed for Jung educational content. It provides templated question generation, intelligent enhancement, and adaptive testing capabilities.

## Overview

The quiz system consists of three main components:

### 1. Quiz Templates (`quizTemplates.ts`)
- **Jung-specific question types**: Concept identification, archetype analysis, psychological type identification, dream interpretation, etc.
- **Topic templates**: Pre-defined templates for major Jungian concepts
- **Difficulty progressions**: Adaptive difficulty based on user level
- **Answer validation patterns**: Different validation strategies for various question types

### 2. Quiz Enhancer (`quizEnhancer.ts`)
- **Distractor improvement**: Creates better wrong answers based on common misconceptions
- **Explanation enhancement**: Adds educational value with detailed explanations
- **Reference addition**: Links to Jung's original works
- **Contextualization**: Adds real-world scenarios to questions

### 3. Enhanced Quiz Generator (`enhancedQuizGenerator.ts`)
- **Template-based generation**: Uses predefined templates for consistency
- **Adaptive questioning**: Adjusts difficulty based on performance
- **Multiple question types**: Supports MC, essay, short answer, etc.
- **Study guide generation**: Creates personalized study plans

## Features

### Question Types Supported
- **Multiple Choice**: With intelligent distractors
- **True/False**: With nuanced explanations
- **Short Answer**: With keyword validation
- **Essay**: With rubric-based evaluation
- **Matching**: For concept relationships

### Jung-Specific Templates
- Collective Unconscious & Archetypes
- Psychological Types (MBTI foundation)
- Individuation Process
- Shadow Work
- Anima/Animus
- Dream Analysis

### Educational Enhancements
- Contextual scenarios for better understanding
- References to Jung's Collected Works
- Common misconception corrections
- Progressive difficulty adaptation
- Cognitive level targeting (Bloom's taxonomy)

## Usage

### Basic Quiz Generation

```typescript
import { EnhancedQuizGenerator } from './services/quiz';
import { anthropicProvider } from './services/llm/provider';

const generator = new EnhancedQuizGenerator(anthropicProvider);

// Generate a beginner-friendly quiz
const quiz = await generator.generateEnhancedQuiz(
  'module-001',
  'Collective Unconscious',
  'Module content here...',
  ['Understand archetypes', 'Identify patterns'],
  10, // number of questions
  {
    userLevel: 'beginner',
    useTemplates: true,
    enhanceQuestions: true
  }
);
```

### Adaptive Testing

```typescript
// Generate follow-up questions based on performance
const adaptiveQuestions = await generator.generateAdaptiveQuestions(
  'Shadow',
  [
    { correct: true, difficulty: 'easy' },
    { correct: false, difficulty: 'medium' }
  ],
  5 // generate 5 adaptive questions
);
```

### Study Guide Generation

```typescript
// After quiz completion, generate personalized study guide
const studyGuide = await generator.generateStudyGuide(
  quiz,
  userResponses,
  'Collective Unconscious'
);
```

## Configuration Options

### Enhanced Quiz Options

```typescript
interface EnhancedQuizOptions {
  useTemplates: boolean;        // Use Jung-specific templates
  enhanceQuestions: boolean;    // Apply educational enhancements
  adaptiveDifficulty: boolean;  // Adjust based on user level
  includeEssayQuestions: boolean; // Include open-ended questions
  contextualizeQuestions: boolean; // Add real-world contexts
  userLevel: 'beginner' | 'intermediate' | 'advanced';
}
```

### Enhancement Options

```typescript
interface EnhancementOptions {
  addExplanations: boolean;     // Detailed explanations
  improveDistractors: boolean;  // Better wrong answers
  varyQuestionStems: boolean;   // Diverse question formats
  addReferences: boolean;       // Jung work citations
  contextualizeQuestions: boolean; // Scenario-based questions
}
```

## Question Quality Features

### Distractor Types
- **Misconception-based**: Common misunderstandings
- **Partial truths**: Incomplete but plausible answers
- **Different theory**: Concepts from Freud, Adler, etc.
- **Surface-level**: Superficial interpretations

### Explanation Structure
1. Why the answer is correct
2. Why other options are incorrect
3. Key insight for understanding
4. Practical application

### Educational Metadata
- Cognitive level (remember, understand, apply, analyze, evaluate, create)
- Concept tags for tracking
- Educational value score (0-10)
- References to source material

## Best Practices

1. **Start with Templates**: Use topic-specific templates for consistency
2. **Enable Enhancements**: Always enhance questions for better educational value
3. **Match User Level**: Select appropriate difficulty for the audience
4. **Include Variety**: Mix question types for engagement
5. **Provide Context**: Use real-world scenarios when possible
6. **Track Concepts**: Use metadata to identify knowledge gaps

## Examples

See `example-usage.ts` for comprehensive examples including:
- Complete quiz generation workflow
- Different user level configurations
- Question validation demonstrations
- Adaptive testing scenarios
- Study guide generation

## Integration

The quiz system integrates with:
- LLM providers for content generation
- Module system for content alignment
- User progress tracking
- Analytics for performance insights

## Future Enhancements

- [ ] Image-based questions for symbol interpretation
- [ ] Audio questions for active imagination exercises
- [ ] Collaborative quiz creation
- [ ] Peer review mechanisms
- [ ] Gamification elements
- [ ] Multi-language support