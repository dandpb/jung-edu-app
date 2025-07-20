import { Module } from '../types';

export const modules: Module[] = [
  {
    id: 'intro-jung',
    title: 'Introduction to Carl Jung',
    description: 'Explore the life and foundational ideas of Carl Gustav Jung, the father of analytical psychology.',
    icon: '🧠',
    estimatedTime: 30,
    difficulty: 'beginner',
    category: 'Foundations',
    content: {
      introduction: 'Carl Gustav Jung (1875-1961) was a Swiss psychiatrist and psychoanalyst who founded analytical psychology. His work has been influential in the fields of psychiatry, anthropology, archaeology, literature, philosophy, and religious studies.',
      sections: [
        {
          id: 'life-overview',
          title: 'Life and Career',
          content: 'Jung was born in Kesswil, Switzerland, and studied medicine at the University of Basel. He worked with Eugen Bleuler at the Burghölzli psychiatric hospital in Zurich and later collaborated with Sigmund Freud before developing his own theories.',
          keyTerms: [
            { term: 'Analytical Psychology', definition: 'Jung\'s approach to psychology that emphasizes the importance of balance between conscious and unconscious processes.' },
            { term: 'Burghölzli', definition: 'The psychiatric hospital in Zurich where Jung began his career.' }
          ]
        },
        {
          id: 'break-with-freud',
          title: 'The Break with Freud',
          content: 'Jung\'s relationship with Freud began in 1906 and ended in 1913 due to theoretical differences, particularly regarding the nature of the unconscious and the role of sexuality in psychological development.',
          keyTerms: [
            { term: 'Libido', definition: 'Jung redefined this as general psychic energy, not just sexual energy as Freud proposed.' }
          ]
        }
      ],
      videos: [
        {
          id: 'jung-intro-1',
          title: 'Carl Jung - The Man and His Symbols',
          youtubeId: 'wreioVJmhAI',
          description: 'An introduction to Jung\'s life and major concepts.',
          duration: 1200
        }
      ],
      quiz: {
        id: 'intro-quiz',
        title: 'Introduction to Jung Quiz',
        questions: [
          {
            id: 'q1',
            question: 'In which year was Carl Jung born?',
            options: ['1865', '1875', '1885', '1895'],
            correctAnswer: 1,
            explanation: 'Carl Jung was born in 1875 in Kesswil, Switzerland.'
          },
          {
            id: 'q2',
            question: 'What is the name of Jung\'s psychological approach?',
            options: ['Behavioral Psychology', 'Analytical Psychology', 'Cognitive Psychology', 'Humanistic Psychology'],
            correctAnswer: 1,
            explanation: 'Jung founded Analytical Psychology, which focuses on the balance between conscious and unconscious processes.'
          }
        ]
      },
      bibliography: [
        {
          id: 'mdm',
          title: 'Memories, Dreams, Reflections',
          author: 'Carl Jung',
          year: 1963,
          type: 'book'
        }
      ]
    }
  },
  {
    id: 'collective-unconscious',
    title: 'The Collective Unconscious',
    description: 'Discover Jung\'s revolutionary concept of the collective unconscious and its archetypal contents.',
    icon: '🌊',
    estimatedTime: 45,
    difficulty: 'intermediate',
    prerequisites: ['intro-jung'],
    category: 'Core Concepts',
    content: {
      introduction: 'The collective unconscious is one of Jung\'s most significant contributions to psychology. It represents the deepest layer of the psyche, containing universal patterns and images inherited from our ancestral past.',
      sections: [
        {
          id: 'definition',
          title: 'Understanding the Collective Unconscious',
          content: 'Unlike the personal unconscious, which contains forgotten or repressed personal experiences, the collective unconscious holds the experiences of our species. It is populated by archetypes - universal, primordial images and patterns.',
          keyTerms: [
            { term: 'Collective Unconscious', definition: 'The part of the unconscious mind derived from ancestral memory and experience, common to all humankind.' },
            { term: 'Archetypes', definition: 'Universal, inherited patterns or images present in the collective unconscious.' }
          ]
        },
        {
          id: 'evidence',
          title: 'Evidence for the Collective Unconscious',
          content: 'Jung found evidence for the collective unconscious in dreams, myths, fairy tales, and religious symbolism across cultures. Similar themes and symbols appear independently in different societies throughout history.',
          keyTerms: [
            { term: 'Synchronicity', definition: 'Meaningful coincidences that suggest a deeper pattern of connection.' },
            { term: 'Mythological Motifs', definition: 'Recurring themes in myths across different cultures.' }
          ]
        }
      ],
      videos: [
        {
          id: 'collective-unc-1',
          title: 'Jung\'s Collective Unconscious Explained',
          youtubeId: '9M0w9FUQZ_k',
          description: 'A detailed exploration of the collective unconscious concept.',
          duration: 900
        }
      ]
    }
  },
  {
    id: 'archetypes',
    title: 'Major Archetypes',
    description: 'Explore the primary archetypes including the Shadow, Anima/Animus, Self, and more.',
    icon: '🎭',
    estimatedTime: 60,
    difficulty: 'intermediate',
    prerequisites: ['collective-unconscious'],
    category: 'Archetypes',
    content: {
      introduction: 'Archetypes are universal patterns or motifs that arise from the collective unconscious. Jung identified several major archetypes that play crucial roles in human psychology and development.',
      sections: [
        {
          id: 'shadow',
          title: 'The Shadow',
          content: 'The Shadow represents the parts of ourselves that we deny or repress. It contains both negative aspects we wish to hide and positive qualities we have not yet recognized or developed.',
          keyTerms: [
            { term: 'Shadow', definition: 'The unconscious aspect of personality that the conscious ego doesn\'t identify with.' },
            { term: 'Shadow Work', definition: 'The process of integrating the shadow through self-awareness.' }
          ]
        },
        {
          id: 'anima-animus',
          title: 'Anima and Animus',
          content: 'The Anima is the feminine aspect within the male psyche, while the Animus is the masculine aspect within the female psyche. These contrasexual archetypes serve as bridges to the unconscious.',
          keyTerms: [
            { term: 'Anima', definition: 'The feminine inner personality in men.' },
            { term: 'Animus', definition: 'The masculine inner personality in women.' }
          ]
        },
        {
          id: 'self',
          title: 'The Self',
          content: 'The Self represents the unified whole of conscious and unconscious. It is both the totality of the psyche and the archetype of wholeness and self-realization.',
          keyTerms: [
            { term: 'Self', definition: 'The archetype of wholeness and the regulating center of the psyche.' },
            { term: 'Mandala', definition: 'A circular symbol representing the Self and wholeness.' }
          ]
        }
      ]
    }
  },
  {
    id: 'individuation',
    title: 'The Individuation Process',
    description: 'Learn about the journey toward psychological wholeness and self-realization.',
    icon: '🌟',
    estimatedTime: 50,
    difficulty: 'advanced',
    prerequisites: ['archetypes'],
    category: 'Personal Development',
    content: {
      introduction: 'Individuation is the central process of human psychological development in Jungian psychology. It involves integrating various aspects of the psyche to achieve psychological wholeness.',
      sections: [
        {
          id: 'stages',
          title: 'Stages of Individuation',
          content: 'The individuation process typically involves confronting the persona, integrating the shadow, encountering the anima/animus, and ultimately realizing the Self.',
          keyTerms: [
            { term: 'Individuation', definition: 'The process of psychological integration and self-realization.' },
            { term: 'Persona', definition: 'The mask or role we present to the outside world.' }
          ]
        }
      ]
    }
  },
  {
    id: 'psychological-types',
    title: 'Psychological Types',
    description: 'Understand Jung\'s theory of personality types, including introversion/extraversion and the four functions.',
    icon: '🔄',
    estimatedTime: 40,
    difficulty: 'intermediate',
    category: 'Personality Theory',
    content: {
      introduction: 'Jung\'s theory of psychological types describes how people perceive and judge the world differently. This framework has influenced many modern personality assessments.',
      sections: [
        {
          id: 'attitudes',
          title: 'Attitudes: Introversion and Extraversion',
          content: 'Jung identified two fundamental attitudes: introversion (oriented toward the inner world) and extraversion (oriented toward the outer world).',
          keyTerms: [
            { term: 'Introversion', definition: 'An attitude characterized by orientation toward one\'s inner world.' },
            { term: 'Extraversion', definition: 'An attitude characterized by orientation toward the external world.' }
          ]
        },
        {
          id: 'functions',
          title: 'The Four Functions',
          content: 'Jung described four psychological functions: thinking, feeling, sensation, and intuition. Each person has a dominant function that shapes their perception and judgment.',
          keyTerms: [
            { term: 'Thinking', definition: 'A rational function that judges based on logic and objective criteria.' },
            { term: 'Feeling', definition: 'A rational function that judges based on values and subjective criteria.' },
            { term: 'Sensation', definition: 'An irrational function that perceives through the five senses.' },
            { term: 'Intuition', definition: 'An irrational function that perceives through unconscious processes.' }
          ]
        }
      ]
    }
  },
  {
    id: 'dreams-symbols',
    title: 'Dreams and Symbolism',
    description: 'Explore Jung\'s approach to dream interpretation and the language of symbols.',
    icon: '🌙',
    estimatedTime: 55,
    difficulty: 'advanced',
    prerequisites: ['collective-unconscious', 'archetypes'],
    category: 'Dream Analysis',
    content: {
      introduction: 'For Jung, dreams are the psyche\'s way of communicating important messages from the unconscious. Unlike Freud, Jung saw dreams as compensatory, helping to balance conscious attitudes.',
      sections: [
        {
          id: 'dream-interpretation',
          title: 'Jungian Dream Analysis',
          content: 'Jung\'s approach to dreams focuses on their prospective function and symbolic content rather than wish fulfillment. Dreams often contain guidance for individuation.',
          keyTerms: [
            { term: 'Amplification', definition: 'A method of dream interpretation that explores cultural and mythological parallels.' },
            { term: 'Compensation', definition: 'The psyche\'s tendency to balance conscious one-sidedness through dreams.' }
          ]
        }
      ]
    }
  }
];