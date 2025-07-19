import React from 'react';
import MarkdownContent from './MarkdownContent';

/**
 * Example component showing markdown capabilities
 */
const MarkdownExample = () => {
  const exampleContent = `# Understanding the **Shadow** in Jungian Psychology

The **Shadow** represents one of the most crucial concepts in Carl Jung's analytical psychology. It encompasses the *hidden* or *repressed* aspects of our personality that we often deny or ignore.

## Key Characteristics of the Shadow

1. **Unconscious Content**: The Shadow contains elements that are incompatible with our conscious self-image
2. **Personal and Collective Aspects**: While primarily personal, it can include collective elements
3. **Projection Mechanism**: We often project our Shadow onto others
4. **Integration Potential**: Shadow work leads to psychological wholeness

### Why Shadow Work Matters

> "Everyone carries a shadow, and the less it is embodied in the individual's conscious life, the blacker and denser it is." - Carl Jung

Shadow work is essential because:

- It promotes **self-awareness** and authenticity
- It reduces *projection* onto others
- It facilitates the **individuation process**
- It leads to greater psychological integration

### Practical Exercises for Shadow Work

Here are some techniques to explore your Shadow:

1. **Dream Analysis**
   - Record your dreams immediately upon waking
   - Look for recurring dark figures or themes
   - Notice emotional reactions to dream characters

2. **Projection Identification**
   - Notice strong emotional reactions to others
   - Ask: "What quality in them triggers me?"
   - Consider if this quality exists within you

3. **Active Imagination**
   - Engage in dialogue with Shadow figures
   - Use creative expression (art, writing)
   - Allow unconscious content to emerge

### Common Shadow Manifestations

| Conscious Persona | Shadow Aspect |
|------------------|---------------|
| Always helpful | Selfish desires |
| Perfectly organized | Chaotic impulses |
| Constantly positive | Suppressed anger |
| Highly rational | Emotional needs |

### Integration Process

The goal is not to eliminate the Shadow but to **integrate** it consciously:

\`\`\`
1. Recognition → 2. Acceptance → 3. Integration → 4. Transformation
\`\`\`

Remember: The Shadow is not inherently negative. It often contains:
- **Repressed talents**
- **Authentic emotions**
- **Creative potential**
- **Instinctual wisdom**

### Resources for Further Study

- [Man and His Symbols](https://example.com) by Carl Jung
- [Meeting the Shadow](https://example.com) edited by Connie Zweig and Jeremiah Abrams
- [Owning Your Own Shadow](https://example.com) by Robert A. Johnson

---

*"Until you make the unconscious conscious, it will direct your life and you will call it fate."* - Carl Jung`;

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h2 className="text-2xl font-bold mb-6">Markdown Rendering Example</h2>
      <div className="border rounded-lg p-6 bg-white shadow-sm">
        <MarkdownContent content={exampleContent} />
      </div>
    </div>
  );
};

export default MarkdownExample;