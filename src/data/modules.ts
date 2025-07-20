import { Module } from '../types';

export const modules: Module[] = [
  {
    id: 'intro-jung',
    title: 'Introdução a Carl Jung',
    description: 'Explore a vida e as ideias fundamentais de Carl Gustav Jung, o pai da psicologia analítica.',
    icon: '🧠',
    estimatedTime: 30,
    difficulty: 'beginner',
    category: 'Fundamentos',
    content: {
      introduction: 'Carl Gustav Jung (1875-1961) foi um psiquiatra e psicanalista suíço que fundou a psicologia analítica. Seu trabalho foi influente nos campos da psiquiatria, antropologia, arqueologia, literatura, filosofia e estudos religiosos.',
      sections: [
        {
          id: 'life-overview',
          title: 'Vida e Carreira',
          content: 'Jung nasceu em Kesswil, Suíça, e estudou medicina na Universidade de Basel. Trabalhou com Eugen Bleuler no hospital psiquiátrico Burghölzli em Zurique e depois colaborou com Sigmund Freud antes de desenvolver suas próprias teorias.',
          keyTerms: [
            { term: 'Psicologia Analítica', definition: 'A abordagem de Jung para a psicologia que enfatiza a importância do equilíbrio entre processos conscientes e inconscientes.' },
            { term: 'Burghölzli', definition: 'O hospital psiquiátrico em Zurique onde Jung começou sua carreira.' }
          ]
        },
        {
          id: 'break-with-freud',
          title: 'O Rompimento com Freud',
          content: 'O relacionamento de Jung com Freud começou em 1906 e terminou em 1913 devido a diferenças teóricas, particularmente sobre a natureza do inconsciente e o papel da sexualidade no desenvolvimento psicológico.',
          keyTerms: [
            { term: 'Libido', definition: 'Jung redefiniu isso como energia psíquica geral, não apenas energia sexual como Freud propôs.' }
          ]
        }
      ],
      videos: [
        {
          id: 'jung-intro-1',
          title: 'Carl Jung - O Homem e Seus Símbolos',
          youtubeId: 'wreioVJmhAI',
          description: 'Uma introdução à vida de Jung e seus principais conceitos.',
          duration: 1200
        }
      ],
      quiz: {
        id: 'intro-quiz',
        title: 'Questionário de Introdução a Jung',
        questions: [
          {
            id: 'q1',
            question: 'Em que ano Carl Jung nasceu?',
            options: ['1865', '1875', '1885', '1895'],
            correctAnswer: 1,
            explanation: 'Carl Jung nasceu em 1875 em Kesswil, Suíça.'
          },
          {
            id: 'q2',
            question: 'Qual é o nome da abordagem psicológica de Jung?',
            options: ['Psicologia Comportamental', 'Psicologia Analítica', 'Psicologia Cognitiva', 'Psicologia Humanística'],
            correctAnswer: 1,
            explanation: 'Jung fundou a Psicologia Analítica, que foca no equilíbrio entre processos conscientes e inconscientes.'
          }
        ]
      },
      bibliography: [
        {
          id: 'mdm',
          title: 'Memórias, Sonhos, Reflexões',
          author: 'Carl Jung',
          year: 1963,
          type: 'book'
        }
      ]
    }
  },
  {
    id: 'collective-unconscious',
    title: 'O Inconsciente Coletivo',
    description: 'Descubra o conceito revolucionário de Jung sobre o inconsciente coletivo e seus conteúdos arquetípicos.',
    icon: '🌊',
    estimatedTime: 45,
    difficulty: 'intermediate',
    prerequisites: ['intro-jung'],
    category: 'Conceitos Fundamentais',
    content: {
      introduction: 'O inconsciente coletivo é uma das contribuições mais significativas de Jung para a psicologia. Representa a camada mais profunda da psique, contendo padrões e imagens universais herdados de nosso passado ancestral.',
      sections: [
        {
          id: 'definition',
          title: 'Compreendendo o Inconsciente Coletivo',
          content: 'Diferentemente do inconsciente pessoal, que contém experiências pessoais esquecidas ou reprimidas, o inconsciente coletivo contém as experiências de nossa espécie. É povoado por arquétipos - imagens e padrões universais e primordiais.',
          keyTerms: [
            { term: 'Inconsciente Coletivo', definition: 'A parte da mente inconsciente derivada da memória e experiência ancestral, comum a toda a humanidade.' },
            { term: 'Arquétipos', definition: 'Padrões ou imagens universais e herdados presentes no inconsciente coletivo.' }
          ]
        },
        {
          id: 'evidence',
          title: 'Evidências do Inconsciente Coletivo',
          content: 'Jung encontrou evidências do inconsciente coletivo em sonhos, mitos, contos de fadas e simbolismo religioso em diferentes culturas. Temas e símbolos similares aparecem independentemente em diferentes sociedades ao longo da história.',
          keyTerms: [
            { term: 'Sincronicidade', definition: 'Coincidências significativas que sugerem um padrão mais profundo de conexão.' },
            { term: 'Motivos Mitológicos', definition: 'Temas recorrentes em mitos de diferentes culturas.' }
          ]
        }
      ],
      videos: [
        {
          id: 'collective-unc-1',
          title: 'O Inconsciente Coletivo de Jung Explicado',
          youtubeId: '9M0w9FUQZ_k',
          description: 'Uma exploração detalhada do conceito de inconsciente coletivo.',
          duration: 900
        }
      ]
    }
  },
  {
    id: 'archetypes',
    title: 'Principais Arquétipos',
    description: 'Explore os principais arquétipos incluindo a Sombra, Anima/Animus, Si-mesmo e mais.',
    icon: '🎭',
    estimatedTime: 60,
    difficulty: 'intermediate',
    prerequisites: ['collective-unconscious'],
    category: 'Arquétipos',
    content: {
      introduction: 'Arquétipos são padrões ou motivos universais que surgem do inconsciente coletivo. Jung identificou vários arquétipos principais que desempenham papéis cruciais na psicologia e desenvolvimento humano.',
      sections: [
        {
          id: 'shadow',
          title: 'A Sombra',
          content: 'A Sombra representa as partes de nós mesmos que negamos ou reprimimos. Contém tanto aspectos negativos que desejamos esconder quanto qualidades positivas que ainda não reconhecemos ou desenvolvemos.',
          keyTerms: [
            { term: 'Sombra', definition: 'O aspecto inconsciente da personalidade com o qual o ego consciente não se identifica.' },
            { term: 'Trabalho com a Sombra', definition: 'O processo de integração da sombra através da autoconsciência.' }
          ]
        },
        {
          id: 'anima-animus',
          title: 'Anima e Animus',
          content: 'A Anima é o aspecto feminino dentro da psique masculina, enquanto o Animus é o aspecto masculino dentro da psique feminina. Esses arquétipos contrassexuais servem como pontes para o inconsciente.',
          keyTerms: [
            { term: 'Anima', definition: 'A personalidade interior feminina nos homens.' },
            { term: 'Animus', definition: 'A personalidade interior masculina nas mulheres.' }
          ]
        },
        {
          id: 'self',
          title: 'O Si-mesmo',
          content: 'O Si-mesmo representa o todo unificado de consciente e inconsciente. É tanto a totalidade da psique quanto o arquétipo da totalidade e autorealização.',
          keyTerms: [
            { term: 'Si-mesmo', definition: 'O arquétipo da totalidade e o centro regulador da psique.' },
            { term: 'Mandala', definition: 'Um símbolo circular representando o Si-mesmo e a totalidade.' }
          ]
        }
      ]
    }
  },
  {
    id: 'individuation',
    title: 'O Processo de Individuação',
    description: 'Aprenda sobre a jornada em direção à totalidade psicológica e autorealização.',
    icon: '🌟',
    estimatedTime: 50,
    difficulty: 'advanced',
    prerequisites: ['archetypes'],
    category: 'Desenvolvimento Pessoal',
    content: {
      introduction: 'A individuação é o processo central do desenvolvimento psicológico humano na psicologia junguiana. Envolve integrar vários aspectos da psique para alcançar a totalidade psicológica.',
      sections: [
        {
          id: 'stages',
          title: 'Estágios da Individuação',
          content: 'O processo de individuação tipicamente envolve confrontar a persona, integrar a sombra, encontrar a anima/animus e, finalmente, realizar o Si-mesmo.',
          keyTerms: [
            { term: 'Individuação', definition: 'O processo de integração psicológica e autorealização.' },
            { term: 'Persona', definition: 'A máscara ou papel que apresentamos ao mundo exterior.' }
          ]
        }
      ]
    }
  },
  {
    id: 'psychological-types',
    title: 'Tipos Psicológicos',
    description: 'Compreenda a teoria de Jung sobre tipos de personalidade, incluindo introversão/extraversão e as quatro funções.',
    icon: '🔄',
    estimatedTime: 40,
    difficulty: 'intermediate',
    category: 'Teoria da Personalidade',
    content: {
      introduction: 'A teoria de tipos psicológicos de Jung descreve como as pessoas percebem e julgam o mundo de formas diferentes. Esta estrutura influenciou muitas avaliações modernas de personalidade.',
      sections: [
        {
          id: 'attitudes',
          title: 'Atitudes: Introversão e Extraversão',
          content: 'Jung identificou duas atitudes fundamentais: introversão (orientada para o mundo interior) e extraversão (orientada para o mundo exterior).',
          keyTerms: [
            { term: 'Introversão', definition: 'Uma atitude caracterizada pela orientação para o mundo interior.' },
            { term: 'Extraversão', definition: 'Uma atitude caracterizada pela orientação para o mundo exterior.' }
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