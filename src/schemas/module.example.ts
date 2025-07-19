/**
 * Example Educational Module
 * Demonstrates the complete schema structure
 */

import { EducationalModule, DifficultyLevel, NodeType, EdgeType, ModuleStatus, PublicationType, VideoPlatform } from './module.schema';

export const exampleModule: EducationalModule = {
  id: "jung-module-001",
  title: "Introduction to Carl Jung's Collective Unconscious",
  description: "Explore the foundational concepts of Jung's theory of the collective unconscious, including archetypes, symbols, and their manifestation in dreams and culture.",
  content: {
    introduction: `
# Welcome to Jung's Collective Unconscious

This module introduces you to one of Carl Jung's most revolutionary concepts: the collective unconscious. 
Unlike the personal unconscious, which contains forgotten or repressed personal experiences, the collective 
unconscious represents a deeper layer of the psyche shared by all humanity.

Throughout this module, you will:
- Understand the distinction between personal and collective unconscious
- Explore the major archetypes and their manifestations
- Learn to identify archetypal patterns in dreams, myths, and culture
- Apply Jungian concepts to personal growth and self-understanding
    `,
    sections: [
      {
        id: "section-1",
        title: "The Structure of the Psyche",
        content: `
## The Three Levels of Consciousness

Jung proposed a three-level model of the human psyche:

1. **The Conscious Mind**: Our immediate awareness and ego consciousness
2. **The Personal Unconscious**: Forgotten or repressed personal memories
3. **The Collective Unconscious**: Universal patterns and images shared by all humanity

### Key Characteristics of the Collective Unconscious

The collective unconscious is not developed individually but is inherited. It consists of pre-existent 
forms, the archetypes, which can only become conscious secondarily and give definite form to certain 
psychic contents.
        `,
        order: 1,
        keyTerms: [
          {
            term: "Collective Unconscious",
            definition: "A part of the unconscious mind shared by all humanity, containing universal patterns and images called archetypes.",
            relatedTerms: ["Archetypes", "Personal Unconscious", "Psyche"],
            externalLink: "https://www.britannica.com/science/collective-unconscious"
          },
          {
            term: "Psyche",
            definition: "The totality of the human mind, conscious and unconscious, including thoughts, feelings, and behaviors.",
            relatedTerms: ["Consciousness", "Unconscious", "Ego"]
          }
        ],
        images: [
          {
            id: "img-psyche-model",
            url: "https://example.com/jung-psyche-model.jpg",
            caption: "Jung's model of the psyche showing the three levels of consciousness",
            alt: "Diagram showing conscious, personal unconscious, and collective unconscious as concentric circles",
            credit: "Illustration by Dr. Sarah Johnson",
            license: "CC BY-SA 4.0"
          }
        ],
        interactiveElements: [
          {
            id: "interactive-psyche",
            type: "diagram",
            title: "Interactive Psyche Model",
            url: "https://example.com/interactive/psyche-explorer",
            description: "Explore the layers of the psyche with this interactive diagram"
          }
        ],
        estimatedTime: 15
      },
      {
        id: "section-2",
        title: "The Major Archetypes",
        content: `
## Understanding Archetypes

Archetypes are universal, archaic patterns and images that derive from the collective unconscious. 
They are the psychic counterpart of instinct and represent fundamental human motifs of our experience 
as we evolved.

### The Primary Archetypes

1. **The Self**: The unified whole of conscious and unconscious
2. **The Shadow**: The repressed or hidden aspects of the personality
3. **The Anima/Animus**: The feminine aspect in men (anima) and masculine aspect in women (animus)
4. **The Persona**: The mask we present to the world

### Additional Important Archetypes

- **The Hero**: The part that overcomes obstacles and achieves goals
- **The Mother**: Nurturing, caring, and creative aspects
- **The Father**: Authority, control, and law
- **The Wise Old Man/Woman**: Wisdom, guidance, and knowledge
- **The Trickster**: Catalyst for change, rule-breaker
        `,
        order: 2,
        keyTerms: [
          {
            term: "Archetype",
            definition: "Universal, inherited patterns or images present in the collective unconscious that influence human behavior and experience.",
            relatedTerms: ["Shadow", "Anima", "Animus", "Self"]
          },
          {
            term: "Shadow",
            definition: "The unconscious part of the personality containing repressed weaknesses, desires, and instincts.",
            relatedTerms: ["Archetype", "Projection", "Integration"]
          },
          {
            term: "Individuation",
            definition: "The psychological process of integrating the conscious and unconscious parts of the mind to achieve self-realization.",
            relatedTerms: ["Self", "Integration", "Wholeness"]
          }
        ],
        estimatedTime: 20
      }
    ],
    summary: "This module provided a comprehensive introduction to Jung's concept of the collective unconscious and its major archetypes. You learned about the structure of the psyche, the nature of archetypes, and how they manifest in human experience.",
    keyTakeaways: [
      "The collective unconscious is a universal layer of the psyche shared by all humanity",
      "Archetypes are inherited patterns that shape human behavior and experience",
      "Understanding archetypes can provide insights into personal and cultural patterns",
      "The process of individuation involves integrating conscious and unconscious aspects"
    ]
  },
  videos: [
    {
      id: "video-001",
      title: "Jung's Collective Unconscious Explained",
      url: "https://www.youtube.com/watch?v=example1",
      duration: {
        hours: 0,
        minutes: 12,
        seconds: 45
      },
      description: "An animated introduction to Jung's theory of the collective unconscious",
      thumbnail: "https://example.com/video-thumb-001.jpg",
      platform: VideoPlatform.YOUTUBE,
      chapters: [
        {
          title: "Introduction",
          startTime: 0,
          endTime: 120
        },
        {
          title: "The Three Levels",
          startTime: 120,
          endTime: 400
        },
        {
          title: "Archetypes Overview",
          startTime: 400,
          endTime: 765
        }
      ],
      captions: [
        {
          language: "en",
          url: "https://example.com/captions/video-001-en.vtt",
          format: "vtt"
        },
        {
          language: "es",
          url: "https://example.com/captions/video-001-es.vtt",
          format: "vtt"
        }
      ]
    },
    {
      id: "video-002",
      title: "The Shadow Archetype in Depth",
      url: "https://example.com/videos/shadow-archetype.mp4",
      duration: {
        hours: 0,
        minutes: 18,
        seconds: 30
      },
      description: "Deep dive into understanding and integrating the shadow archetype",
      platform: VideoPlatform.CUSTOM,
      embedCode: '<iframe src="https://example.com/embed/shadow-archetype" width="560" height="315"></iframe>'
    }
  ],
  mindMaps: [
    {
      id: "mindmap-001",
      title: "Jungian Psyche Structure",
      description: "Visual representation of Jung's model of the psyche and its components",
      nodes: [
        {
          id: "node-psyche",
          label: "The Psyche",
          description: "The totality of the human mind",
          position: { x: 400, y: 50 },
          type: NodeType.ROOT,
          style: {
            backgroundColor: "#e3f2fd",
            borderColor: "#1976d2",
            borderWidth: 3,
            fontSize: 18,
            fontWeight: "bold",
            shape: "circle"
          }
        },
        {
          id: "node-conscious",
          label: "Conscious Mind",
          description: "Immediate awareness and ego",
          position: { x: 200, y: 150 },
          type: NodeType.CONCEPT,
          style: {
            backgroundColor: "#fff3e0",
            borderColor: "#f57c00"
          }
        },
        {
          id: "node-personal-unconscious",
          label: "Personal Unconscious",
          description: "Forgotten or repressed personal experiences",
          position: { x: 400, y: 150 },
          type: NodeType.CONCEPT,
          style: {
            backgroundColor: "#f3e5f5",
            borderColor: "#7b1fa2"
          }
        },
        {
          id: "node-collective-unconscious",
          label: "Collective Unconscious",
          description: "Universal patterns shared by humanity",
          position: { x: 600, y: 150 },
          type: NodeType.CONCEPT,
          style: {
            backgroundColor: "#e8f5e9",
            borderColor: "#388e3c"
          },
          moduleId: "jung-module-001"
        },
        {
          id: "node-archetypes",
          label: "Archetypes",
          description: "Universal patterns and images",
          position: { x: 600, y: 250 },
          type: NodeType.DEFINITION,
          resourceLinks: [
            {
              type: "module",
              id: "jung-module-002",
              title: "Deep Dive into Archetypes"
            }
          ]
        }
      ],
      edges: [
        {
          id: "edge-1",
          source: "node-psyche",
          target: "node-conscious",
          type: EdgeType.HIERARCHICAL,
          style: {
            strokeColor: "#666",
            strokeWidth: 2
          }
        },
        {
          id: "edge-2",
          source: "node-psyche",
          target: "node-personal-unconscious",
          type: EdgeType.HIERARCHICAL
        },
        {
          id: "edge-3",
          source: "node-psyche",
          target: "node-collective-unconscious",
          type: EdgeType.HIERARCHICAL
        },
        {
          id: "edge-4",
          source: "node-collective-unconscious",
          target: "node-archetypes",
          label: "contains",
          type: EdgeType.ASSOCIATION,
          animated: true
        }
      ],
      layout: {
        type: "hierarchical",
        direction: "TB",
        spacing: {
          nodeSpacing: 100,
          levelSpacing: 100
        }
      },
      style: {
        theme: "light",
        backgroundColor: "#fafafa",
        defaultNodeStyle: {
          borderWidth: 2,
          fontSize: 14,
          shape: "rectangle"
        }
      },
      metadata: {
        created: "2024-01-15T10:00:00.000Z",
        lastModified: "2024-01-15T14:30:00.000Z",
        version: "1.0.0",
        isInteractive: true,
        allowEditing: false
      }
    }
  ],
  quiz: {
    id: "quiz-jung-001",
    title: "Understanding the Collective Unconscious",
    description: "Test your understanding of Jung's concepts covered in this module",
    questions: [
      {
        id: "q1",
        type: "multiple-choice",
        question: "According to Jung, which of the following best describes the collective unconscious?",
        points: 10,
        options: [
          {
            id: 0,
            text: "Personal memories that have been forgotten",
            isCorrect: false,
            feedback: "This describes the personal unconscious, not the collective unconscious."
          },
          {
            id: 1,
            text: "Universal patterns and images shared by all humanity",
            isCorrect: true,
            feedback: "Correct! The collective unconscious contains universal archetypes."
          },
          {
            id: 2,
            text: "The conscious thoughts we have during the day",
            isCorrect: false,
            feedback: "This describes conscious awareness, not the collective unconscious."
          },
          {
            id: 3,
            text: "Learned behaviors from our culture",
            isCorrect: false,
            feedback: "The collective unconscious is inherited, not learned."
          }
        ],
        correctAnswers: [1],
        allowMultiple: false,
        explanation: "The collective unconscious is Jung's concept of a part of the unconscious mind that is derived from ancestral memory and experience and is common to all humankind.",
        difficulty: DifficultyLevel.BEGINNER
      },
      {
        id: "q2",
        type: "true-false",
        question: "The Shadow archetype represents only negative aspects of the personality.",
        points: 10,
        correctAnswer: false,
        explanation: "The Shadow contains both negative and positive aspects that have been repressed or remain undeveloped in the personality.",
        hint: "Consider whether the Shadow might contain hidden talents or positive qualities.",
        difficulty: DifficultyLevel.INTERMEDIATE
      },
      {
        id: "q3",
        type: "open-ended",
        question: "Describe the process of individuation and explain why Jung considered it important for psychological development. Provide at least two examples of how this process might manifest in a person's life.",
        points: 20,
        suggestedAnswer: "Individuation is the psychological process of integrating the conscious and unconscious parts of the mind to achieve self-realization and wholeness. Jung considered it essential because it leads to psychological maturity and authentic self-expression. Examples include: 1) Recognizing and integrating one's Shadow through acknowledging previously denied aspects of personality, 2) Balancing masculine and feminine aspects (anima/animus) to achieve greater psychological completeness, 3) Moving beyond the Persona to express one's true self rather than just social roles.",
        keywords: ["integration", "conscious", "unconscious", "wholeness", "self-realization", "Shadow", "anima", "animus", "Persona"],
        minLength: 100,
        maxLength: 500,
        explanation: "Individuation is Jung's central concept for psychological development, representing the lifelong process of becoming a complete, integrated person by uniting conscious and unconscious aspects of the psyche.",
        rubric: {
          criteria: [
            {
              name: "Definition Accuracy",
              description: "Accurately defines individuation",
              points: 8,
              levels: [
                { score: 8, description: "Provides complete and accurate definition" },
                { score: 6, description: "Mostly accurate with minor omissions" },
                { score: 4, description: "Partially accurate" },
                { score: 2, description: "Significant inaccuracies" },
                { score: 0, description: "Incorrect or missing definition" }
              ]
            },
            {
              name: "Importance Explanation",
              description: "Explains why Jung considered it important",
              points: 6,
              levels: [
                { score: 6, description: "Clear explanation of importance" },
                { score: 4, description: "Adequate explanation" },
                { score: 2, description: "Vague or incomplete explanation" },
                { score: 0, description: "No explanation provided" }
              ]
            },
            {
              name: "Examples",
              description: "Provides relevant examples",
              points: 6,
              levels: [
                { score: 6, description: "Two or more clear, relevant examples" },
                { score: 4, description: "One clear example or two partial examples" },
                { score: 2, description: "Attempts examples but unclear" },
                { score: 0, description: "No examples provided" }
              ]
            }
          ],
          totalPoints: 20
        },
        difficulty: DifficultyLevel.ADVANCED,
        mediaAttachment: {
          type: "image",
          url: "https://example.com/individuation-diagram.jpg",
          caption: "The individuation process illustrated"
        }
      }
    ],
    passingScore: 70,
    timeLimit: 30,
    shuffleQuestions: true,
    showFeedback: true,
    allowRetries: true,
    maxRetries: 3
  },
  bibliography: [
    {
      id: "bib-001",
      title: "Man and His Symbols",
      authors: ["Carl Gustav Jung", "Marie-Louise von Franz", "Joseph L. Henderson", "Jolande Jacobi", "Aniela Jaffé"],
      year: 1964,
      type: PublicationType.BOOK,
      publisher: "Doubleday",
      isbn: "978-0-440-35183-2",
      abstract: "Jung's final work, designed to introduce his theories to a general audience through the study of symbols in dreams, art, and culture.",
      tags: ["symbols", "dreams", "archetypes", "introduction"],
      relevanceNote: "Essential introductory text that presents Jung's ideas in accessible language with rich visual examples."
    },
    {
      id: "bib-002",
      title: "The Archetypes and the Collective Unconscious",
      authors: ["Carl Gustav Jung"],
      year: 1969,
      type: PublicationType.BOOK,
      publisher: "Princeton University Press",
      volume: "9, Part 1",
      isbn: "978-0-691-01833-1",
      abstract: "Volume 9 of Jung's Collected Works, containing his major essays on the concept of the archetype and the hypothesis of the collective unconscious.",
      tags: ["archetypes", "collective unconscious", "primary source"],
      relevanceNote: "Primary source material containing Jung's original formulations of key concepts covered in this module."
    },
    {
      id: "bib-003",
      title: "Jung's Theory of Collective Unconscious: A Rational Reconstruction",
      authors: ["James M. Glass"],
      year: 2019,
      type: PublicationType.JOURNAL_ARTICLE,
      journal: "Journal of Analytical Psychology",
      volume: "64",
      issue: "3",
      pages: "387-408",
      doi: "10.1111/1468-5922.12494",
      url: "https://doi.org/10.1111/1468-5922.12494",
      tags: ["theory", "analysis", "contemporary"],
      relevanceNote: "Modern academic analysis that helps contextualize Jung's theories within contemporary psychology."
    }
  ],
  filmReferences: [
    {
      id: "film-001",
      title: "Black Swan",
      director: ["Darren Aronofsky"],
      year: 2010,
      duration: 108,
      genre: ["Psychological Thriller", "Drama"],
      relevance: "Powerful illustration of the Shadow archetype and the dangers of repressing aspects of the psyche. The protagonist's journey mirrors the individuation process gone awry.",
      synopsis: "A committed dancer struggles to maintain her sanity after winning the lead role in a production of Tchaikovsky's 'Swan Lake'.",
      imdbId: "tt0947798",
      trailer: "https://www.youtube.com/watch?v=5jaI1XOB-bs",
      streamingPlatforms: [
        {
          name: "Netflix",
          url: "https://www.netflix.com/title/70123298",
          availability: "subscription"
        },
        {
          name: "Amazon Prime",
          url: "https://www.amazon.com/Black-Swan-Natalie-Portman/dp/B004L22SZ2",
          availability: "rental"
        }
      ],
      educationalThemes: [
        "Shadow integration",
        "Persona vs. authentic self",
        "Psychological splitting",
        "The danger of perfectionism"
      ],
      discussionPoints: [
        "How does Nina's relationship with her Shadow manifest in the film?",
        "What role does the mother play as an archetypal figure?",
        "How does the swan symbolism relate to Jung's concept of transformation?"
      ],
      clips: [
        {
          title: "The Black Swan Emerges",
          startTime: "01:23:45",
          endTime: "01:28:30",
          description: "Nina's Shadow finally breaks through in a powerful transformation scene",
          relevantConcepts: ["Shadow integration", "Transformation", "Loss of ego control"]
        }
      ]
    },
    {
      id: "film-002",
      title: "The Matrix",
      director: ["Lana Wachowski", "Lilly Wachowski"],
      year: 1999,
      duration: 136,
      genre: ["Science Fiction", "Action"],
      relevance: "Explores themes of awakening to a deeper reality, similar to becoming conscious of the collective unconscious. Neo's journey parallels the individuation process.",
      synopsis: "A computer programmer discovers that reality as he knows it is a simulation and joins a rebellion against the machines.",
      imdbId: "tt0133093",
      educationalThemes: [
        "Awakening to unconscious reality",
        "The Hero's journey",
        "Choice and free will",
        "Reality vs. illusion"
      ],
      discussionPoints: [
        "How does Neo's journey reflect the process of individuation?",
        "What archetypal roles do Morpheus and the Oracle play?",
        "How does the red pill/blue pill choice relate to consciousness?"
      ]
    }
  ],
  tags: [
    "jung",
    "psychology",
    "collective unconscious",
    "archetypes",
    "psychoanalysis",
    "depth psychology",
    "individuation",
    "shadow work",
    "self-development"
  ],
  difficultyLevel: DifficultyLevel.INTERMEDIATE,
  timeEstimate: {
    hours: 2,
    minutes: 30,
    description: "Including videos and quiz completion"
  },
  metadata: {
    createdAt: "2024-01-15T09:00:00.000Z",
    updatedAt: "2024-01-20T16:45:00.000Z",
    version: "1.2.0",
    author: {
      id: "author-001",
      name: "Dr. Elizabeth Chen",
      email: "elizabeth.chen@example.edu",
      role: "Professor of Psychology"
    },
    status: ModuleStatus.PUBLISHED,
    language: "en",
    reviewedBy: {
      id: "reviewer-001",
      name: "Dr. Michael Roberts",
      email: "m.roberts@example.edu",
      role: "Department Chair"
    },
    reviewedAt: "2024-01-18T14:00:00.000Z",
    publishedAt: "2024-01-20T16:45:00.000Z",
    analytics: {
      views: 1234,
      completions: 456,
      averageTime: 142,
      averageScore: 82.5,
      feedback: [
        {
          userId: "user-123",
          rating: 5,
          comment: "Excellent introduction to Jung's concepts. The mind map was particularly helpful.",
          timestamp: "2024-01-22T10:30:00.000Z",
          helpful: 23
        },
        {
          userId: "user-456",
          rating: 4,
          comment: "Good content but would benefit from more interactive exercises.",
          timestamp: "2024-01-25T15:45:00.000Z",
          helpful: 12
        }
      ]
    }
  },
  prerequisites: [],
  learningObjectives: [
    "Understand the structure of the psyche according to Jung",
    "Identify and describe the major archetypes",
    "Differentiate between personal and collective unconscious",
    "Apply Jungian concepts to analyze dreams and cultural symbols",
    "Understand the process and importance of individuation"
  ],
  icon: "🧠"
};