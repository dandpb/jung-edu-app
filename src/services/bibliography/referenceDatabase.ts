// Reference Database for Jung Educational Resources
// Includes primary works, contemporary research, and multimedia references

export interface Reference {
  id: string;
  type: 'book' | 'article' | 'film' | 'chapter' | 'interview' | 'lecture';
  title: string;
  author: string | string[];
  year: number;
  publisher?: string;
  journal?: string;
  volume?: number;
  issue?: number;
  pages?: string;
  isbn?: string;
  doi?: string;
  url?: string;
  category: string[];
  keywords: string[];
  abstract?: string;
  relevanceScore?: number;
}

// Jung's Collected Works (CW)
export const jungCollectedWorks: Reference[] = [
  {
    id: 'cw1',
    type: 'book',
    title: 'Psychiatric Studies',
    author: 'Carl G. Jung',
    year: 1970,
    publisher: 'Princeton University Press',
    isbn: '978-0-691-09768-1',
    category: ['collected-works', 'psychiatry', 'early-works'],
    keywords: ['psychiatric studies', 'dementia praecox', 'psychopathology']
  },
  {
    id: 'cw2',
    type: 'book',
    title: 'Experimental Researches',
    author: 'Carl G. Jung',
    year: 1973,
    publisher: 'Princeton University Press',
    isbn: '978-0-691-09769-8',
    category: ['collected-works', 'experimental-psychology'],
    keywords: ['word association', 'experimental psychology', 'complexes']
  },
  {
    id: 'cw3',
    type: 'book',
    title: 'The Psychogenesis of Mental Disease',
    author: 'Carl G. Jung',
    year: 1960,
    publisher: 'Princeton University Press',
    isbn: '978-0-691-09770-4',
    category: ['collected-works', 'psychopathology'],
    keywords: ['mental disease', 'schizophrenia', 'psychosis']
  },
  {
    id: 'cw4',
    type: 'book',
    title: 'Freud and Psychoanalysis',
    author: 'Carl G. Jung',
    year: 1961,
    publisher: 'Princeton University Press',
    isbn: '978-0-691-09771-1',
    category: ['collected-works', 'psychoanalysis'],
    keywords: ['Freud', 'psychoanalysis', 'theory of neurosis']
  },
  {
    id: 'cw5',
    type: 'book',
    title: 'Symbols of Transformation',
    author: 'Carl G. Jung',
    year: 1967,
    publisher: 'Princeton University Press',
    isbn: '978-0-691-09772-8',
    category: ['collected-works', 'symbolism', 'mythology'],
    keywords: ['symbols', 'transformation', 'libido', 'mythology']
  },
  {
    id: 'cw6',
    type: 'book',
    title: 'Psychological Types',
    author: 'Carl G. Jung',
    year: 1971,
    publisher: 'Princeton University Press',
    isbn: '978-0-691-09773-5',
    category: ['collected-works', 'typology'],
    keywords: ['psychological types', 'introversion', 'extraversion', 'functions']
  },
  {
    id: 'cw7',
    type: 'book',
    title: 'Two Essays on Analytical Psychology',
    author: 'Carl G. Jung',
    year: 1966,
    publisher: 'Princeton University Press',
    isbn: '978-0-691-09774-2',
    category: ['collected-works', 'analytical-psychology'],
    keywords: ['unconscious', 'persona', 'anima', 'animus', 'individuation']
  },
  {
    id: 'cw8',
    type: 'book',
    title: 'The Structure and Dynamics of the Psyche',
    author: 'Carl G. Jung',
    year: 1969,
    publisher: 'Princeton University Press',
    isbn: '978-0-691-09775-9',
    category: ['collected-works', 'psyche-structure'],
    keywords: ['psyche', 'synchronicity', 'psychic energy', 'complexes']
  },
  {
    id: 'cw9i',
    type: 'book',
    title: 'The Archetypes and the Collective Unconscious',
    author: 'Carl G. Jung',
    year: 1969,
    publisher: 'Princeton University Press',
    isbn: '978-0-691-09776-6',
    category: ['collected-works', 'archetypes'],
    keywords: ['archetypes', 'collective unconscious', 'mother', 'child', 'shadow']
  },
  {
    id: 'cw9ii',
    type: 'book',
    title: 'Aion: Researches into the Phenomenology of the Self',
    author: 'Carl G. Jung',
    year: 1969,
    publisher: 'Princeton University Press',
    isbn: '978-0-691-09777-3',
    category: ['collected-works', 'self'],
    keywords: ['self', 'Christ', 'fish symbol', 'gnosticism']
  },
  {
    id: 'cw10',
    type: 'book',
    title: 'Civilization in Transition',
    author: 'Carl G. Jung',
    year: 1964,
    publisher: 'Princeton University Press',
    isbn: '978-0-691-09778-0',
    category: ['collected-works', 'society'],
    keywords: ['civilization', 'mass psychology', 'modern man', 'UFOs']
  },
  {
    id: 'cw11',
    type: 'book',
    title: 'Psychology and Religion: West and East',
    author: 'Carl G. Jung',
    year: 1969,
    publisher: 'Princeton University Press',
    isbn: '978-0-691-09779-7',
    category: ['collected-works', 'religion'],
    keywords: ['religion', 'Christianity', 'Eastern philosophy', 'yoga']
  },
  {
    id: 'cw12',
    type: 'book',
    title: 'Psychology and Alchemy',
    author: 'Carl G. Jung',
    year: 1968,
    publisher: 'Princeton University Press',
    isbn: '978-0-691-09780-3',
    category: ['collected-works', 'alchemy'],
    keywords: ['alchemy', 'dreams', 'symbols', 'individuation process']
  },
  {
    id: 'cw13',
    type: 'book',
    title: 'Alchemical Studies',
    author: 'Carl G. Jung',
    year: 1967,
    publisher: 'Princeton University Press',
    isbn: '978-0-691-09781-0',
    category: ['collected-works', 'alchemy'],
    keywords: ['alchemy', 'Paracelsus', 'philosophical tree', 'Mercurius']
  },
  {
    id: 'cw14',
    type: 'book',
    title: 'Mysterium Coniunctionis',
    author: 'Carl G. Jung',
    year: 1970,
    publisher: 'Princeton University Press',
    isbn: '978-0-691-09782-7',
    category: ['collected-works', 'alchemy', 'individuation'],
    keywords: ['conjunction', 'opposites', 'alchemy', 'individuation']
  },
  {
    id: 'cw15',
    type: 'book',
    title: 'The Spirit in Man, Art, and Literature',
    author: 'Carl G. Jung',
    year: 1966,
    publisher: 'Princeton University Press',
    isbn: '978-0-691-09783-4',
    category: ['collected-works', 'creativity'],
    keywords: ['art', 'literature', 'creativity', 'Picasso', 'Joyce']
  },
  {
    id: 'cw16',
    type: 'book',
    title: 'The Practice of Psychotherapy',
    author: 'Carl G. Jung',
    year: 1966,
    publisher: 'Princeton University Press',
    isbn: '978-0-691-09784-1',
    category: ['collected-works', 'therapy'],
    keywords: ['psychotherapy', 'transference', 'analytical psychology practice']
  },
  {
    id: 'cw17',
    type: 'book',
    title: 'The Development of Personality',
    author: 'Carl G. Jung',
    year: 1954,
    publisher: 'Princeton University Press',
    isbn: '978-0-691-09785-8',
    category: ['collected-works', 'development'],
    keywords: ['personality', 'education', 'child development', 'marriage']
  },
  {
    id: 'cw18',
    type: 'book',
    title: 'The Symbolic Life: Miscellaneous Writings',
    author: 'Carl G. Jung',
    year: 1976,
    publisher: 'Princeton University Press',
    isbn: '978-0-691-09892-3',
    category: ['collected-works', 'miscellaneous'],
    keywords: ['symbolic life', 'various topics', 'late writings']
  }
];

// Popular and Accessible Jung Works
export const jungPopularWorks: Reference[] = [
  {
    id: 'mdrs',
    type: 'book',
    title: 'Memories, Dreams, Reflections',
    author: ['Carl G. Jung', 'Aniela Jaffé'],
    year: 1963,
    publisher: 'Vintage Books',
    isbn: '978-0-679-72395-0',
    category: ['autobiography', 'accessible'],
    keywords: ['autobiography', 'life story', 'dreams', 'visions']
  },
  {
    id: 'mams',
    type: 'book',
    title: 'Man and His Symbols',
    author: ['Carl G. Jung', 'Marie-Louise von Franz', 'Joseph L. Henderson', 'Jolande Jacobi', 'Aniela Jaffé'],
    year: 1964,
    publisher: 'Dell Publishing',
    isbn: '978-0-440-35183-4',
    category: ['popular', 'accessible', 'illustrated'],
    keywords: ['symbols', 'dreams', 'unconscious', 'introduction']
  },
  {
    id: 'redbook',
    type: 'book',
    title: 'The Red Book: Liber Novus',
    author: 'Carl G. Jung',
    year: 2009,
    publisher: 'W. W. Norton & Company',
    isbn: '978-0-393-06567-1',
    category: ['primary-text', 'visionary'],
    keywords: ['red book', 'visions', 'active imagination', 'illustrations']
  },
  {
    id: 'blackbooks',
    type: 'book',
    title: 'The Black Books',
    author: 'Carl G. Jung',
    year: 2020,
    publisher: 'W. W. Norton & Company',
    isbn: '978-0-393-08856-4',
    category: ['primary-text', 'journals'],
    keywords: ['black books', 'journals', 'dreams', 'visions', 'pre-red-book']
  }
];

// Contemporary Jungian Authors and Researchers
export const contemporaryJungian: Reference[] = [
  {
    id: 'vonfranz-shadow',
    type: 'book',
    title: 'Shadow and Evil in Fairy Tales',
    author: 'Marie-Louise von Franz',
    year: 1974,
    publisher: 'Shambhala',
    isbn: '978-0-87773-974-9',
    category: ['jungian-analysis', 'fairy-tales', 'shadow'],
    keywords: ['shadow', 'fairy tales', 'evil', 'archetypal analysis']
  },
  {
    id: 'edinger-ego',
    type: 'book',
    title: 'Ego and Archetype',
    author: 'Edward F. Edinger',
    year: 1972,
    publisher: 'Shambhala',
    isbn: '978-0-87773-576-5',
    category: ['jungian-analysis', 'individuation'],
    keywords: ['ego', 'archetype', 'individuation', 'self']
  },
  {
    id: 'hillman-soul',
    type: 'book',
    title: 'The Soul\'s Code: In Search of Character and Calling',
    author: 'James Hillman',
    year: 1996,
    publisher: 'Random House',
    isbn: '978-0-679-44524-5',
    category: ['archetypal-psychology', 'calling'],
    keywords: ['soul', 'calling', 'character', 'daimon']
  },
  {
    id: 'moore-king',
    type: 'book',
    title: 'King, Warrior, Magician, Lover: Rediscovering the Archetypes of the Mature Masculine',
    author: ['Robert Moore', 'Douglas Gillette'],
    year: 1990,
    publisher: 'HarperOne',
    isbn: '978-0-06-250606-8',
    category: ['masculine-psychology', 'archetypes'],
    keywords: ['masculine', 'archetypes', 'king', 'warrior', 'magician', 'lover']
  },
  {
    id: 'perera-scapegoat',
    type: 'book',
    title: 'The Scapegoat Complex: Toward a Mythology of Shadow and Guilt',
    author: 'Sylvia Brinton Perera',
    year: 1986,
    publisher: 'Inner City Books',
    isbn: '978-0-919123-22-8',
    category: ['shadow-work', 'mythology'],
    keywords: ['scapegoat', 'shadow', 'guilt', 'projection']
  },
  {
    id: 'johnson-inner',
    type: 'book',
    title: 'Inner Work: Using Dreams and Active Imagination for Personal Growth',
    author: 'Robert A. Johnson',
    year: 1986,
    publisher: 'HarperOne',
    isbn: '978-0-06-250431-6',
    category: ['practical', 'active-imagination'],
    keywords: ['inner work', 'dreams', 'active imagination', 'personal growth']
  },
  {
    id: 'stein-map',
    type: 'book',
    title: 'Jung\'s Map of the Soul: An Introduction',
    author: 'Murray Stein',
    year: 1998,
    publisher: 'Open Court',
    isbn: '978-0-8126-9376-8',
    category: ['introduction', 'comprehensive'],
    keywords: ['introduction', 'map', 'soul', 'comprehensive guide']
  }
];

// Film and Documentary References
export const filmReferences: Reference[] = [
  {
    id: 'matter-heart',
    type: 'film',
    title: 'Matter of Heart',
    author: 'Mark Whitney',
    year: 1983,
    publisher: 'Kino International',
    category: ['documentary', 'biography'],
    keywords: ['documentary', 'Jung biography', 'interviews', 'archival footage'],
    url: 'https://www.imdb.com/title/tt0085918/'
  },
  {
    id: 'wisdom-dream',
    type: 'film',
    title: 'The Wisdom of the Dream',
    author: 'Stephen Segaller',
    year: 1989,
    publisher: 'Border Television',
    category: ['documentary', 'dream-analysis'],
    keywords: ['dreams', 'documentary series', 'Jungian analysis'],
    url: 'https://www.imdb.com/title/tt0780280/'
  },
  {
    id: 'face-to-face',
    type: 'interview',
    title: 'Face to Face with Carl Jung',
    author: 'John Freeman',
    year: 1959,
    publisher: 'BBC',
    category: ['interview', 'primary-source'],
    keywords: ['BBC interview', 'Jung speaking', 'primary source'],
    url: 'https://www.youtube.com/watch?v=2AMu-G51yTY'
  },
  {
    id: 'dangerous-method',
    type: 'film',
    title: 'A Dangerous Method',
    author: 'David Cronenberg',
    year: 2011,
    publisher: 'Sony Pictures Classics',
    category: ['dramatization', 'Jung-Freud'],
    keywords: ['Jung', 'Freud', 'Sabina Spielrein', 'historical drama'],
    url: 'https://www.imdb.com/title/tt1571222/'
  }
];

// Recent Academic Research
export const academicResearch: Reference[] = [
  {
    id: 'shamdasani-making',
    type: 'book',
    title: 'C.G. Jung: A Biography in Books',
    author: 'Sonu Shamdasani',
    year: 2012,
    publisher: 'W. W. Norton & Company',
    isbn: '978-0-393-07391-1',
    category: ['biography', 'scholarship'],
    keywords: ['biography', 'Jung library', 'intellectual development']
  },
  {
    id: 'main-jungian',
    type: 'article',
    title: 'The Jungian Psyche: Nature, Structure, and Dynamics',
    author: 'Roderick Main',
    year: 2017,
    journal: 'Journal of Analytical Psychology',
    volume: 62,
    issue: 1,
    pages: '23-42',
    doi: '10.1111/1468-5922.12290',
    category: ['academic', 'theory'],
    keywords: ['psyche', 'theory', 'structure', 'dynamics']
  },
  {
    id: 'cognitive-functions',
    type: 'article',
    title: 'Jung\'s Cognitive Functions: A Mathematical Approach',
    author: ['John Beebe', 'Mark Hunziker'],
    year: 2020,
    journal: 'Psychological Perspectives',
    volume: 63,
    issue: 2,
    pages: '180-201',
    doi: '10.1080/00332925.2020.1737283',
    category: ['typology', 'cognitive-functions'],
    keywords: ['cognitive functions', 'typology', 'mathematics', 'model']
  },
  {
    id: 'neuroscience-archetypes',
    type: 'article',
    title: 'Archetypes and Neural Networks: A Contemporary Synthesis',
    author: 'Erik Goodwyn',
    year: 2019,
    journal: 'International Journal of Jungian Studies',
    volume: 11,
    issue: 2,
    pages: '104-124',
    doi: '10.1080/19409052.2019.1592273',
    category: ['neuroscience', 'archetypes'],
    keywords: ['neuroscience', 'archetypes', 'brain', 'neural networks']
  }
];

// Combine all references
export const allReferences: Reference[] = [
  ...jungCollectedWorks,
  ...jungPopularWorks,
  ...contemporaryJungian,
  ...filmReferences,
  ...academicResearch
];

// Helper functions to search and filter references
export function findReferencesByKeywords(keywords: string[]): Reference[] {
  const lowercaseKeywords = keywords.map(k => k.toLowerCase());
  return allReferences.filter(ref => 
    ref.keywords.some(k => 
      lowercaseKeywords.some(keyword => k.toLowerCase().includes(keyword))
    )
  );
}

export function findReferencesByCategory(category: string): Reference[] {
  return allReferences.filter(ref => 
    ref.category.includes(category.toLowerCase())
  );
}

export function findReferencesByAuthor(author: string): Reference[] {
  return allReferences.filter(ref => {
    const authors = Array.isArray(ref.author) ? ref.author : [ref.author];
    return authors.some(a => a.toLowerCase().includes(author.toLowerCase()));
  });
}

export function findReferencesByType(type: Reference['type']): Reference[] {
  return allReferences.filter(ref => ref.type === type);
}

export function findReferencesInYearRange(startYear: number, endYear: number): Reference[] {
  return allReferences.filter(ref => ref.year >= startYear && ref.year <= endYear);
}

// Export reference categories for UI use
export const referenceCategories = [
  'collected-works',
  'accessible',
  'jungian-analysis',
  'shadow-work',
  'typology',
  'archetypes',
  'alchemy',
  'religion',
  'creativity',
  'therapy',
  'biography',
  'documentary',
  'academic',
  'neuroscience',
  'practical'
];

// Export commonly used keyword groups
export const keywordGroups = {
  core: ['unconscious', 'conscious', 'psyche', 'self', 'ego'],
  archetypes: ['shadow', 'anima', 'animus', 'persona', 'self', 'mother', 'father', 'child', 'hero', 'trickster'],
  processes: ['individuation', 'active imagination', 'dream analysis', 'synchronicity'],
  clinical: ['therapy', 'analysis', 'transference', 'countertransference', 'complex'],
  spiritual: ['alchemy', 'religion', 'mythology', 'symbols', 'transformation']
};