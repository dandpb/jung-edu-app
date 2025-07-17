# Jung's Analytical Psychology Educational App

An interactive educational web application for learning Carl Jung's analytical psychology concepts, built with React and TypeScript.

## Features

- **Module-based Learning**: 6 comprehensive modules covering Jung's key concepts
- **Interactive Mind Map**: Visual representation of interconnected concepts using React Flow
- **Video Integration**: YouTube embeds for educational content
- **Note-taking System**: Personal notes with localStorage persistence
- **Quiz Functionality**: Interactive quizzes with scoring and progress tracking
- **Progress Tracking**: Monitor learning journey with achievements
- **Bibliography & Resources**: Curated list of books, articles, and films
- **Full-text Search**: Search across all content
- **Responsive Design**: Beautiful UI with Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 14+ 
- npm or yarn

### Installation

```bash
# Clone the repository
cd jung-edu-app

# Install dependencies
npm install

# Start development server
npm start
```

The app will open at `http://localhost:3000`

### Available Scripts

```bash
# Run development server
npm start

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build for production
npm run build
```

## Testing

The project includes comprehensive test coverage for all features:

```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run tests in watch mode
npm test -- --watch
```

### Test Structure

- **Unit Tests**: Components, hooks, and utilities
- **Integration Tests**: Page components and user flows
- **Coverage Goals**: 70%+ for branches, functions, lines, and statements

### Test Files

```
src/
├── App.test.tsx
├── components/__tests__/
│   ├── Navigation.test.tsx
│   ├── quiz/QuizComponent.test.tsx
│   └── notes/NoteEditor.test.tsx
├── pages/__tests__/
│   ├── Dashboard.test.tsx
│   ├── ModulePage.test.tsx
│   ├── NotesPage.test.tsx
│   ├── ProgressPage.test.tsx
│   ├── SearchPage.test.tsx
│   ├── MindMapPage.test.tsx
│   └── BibliographyPage.test.tsx
├── hooks/__tests__/
│   └── useProgress.test.tsx
└── utils/__tests__/
    └── localStorage.test.ts
```

## Project Structure

```
jung-edu-app/
├── public/
├── src/
│   ├── components/
│   │   ├── modules/
│   │   ├── quiz/
│   │   ├── notes/
│   │   └── Navigation.tsx
│   ├── data/
│   │   └── modules.ts
│   ├── hooks/
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── ModulePage.tsx
│   │   ├── MindMapPage.tsx
│   │   ├── NotesPage.tsx
│   │   ├── ProgressPage.tsx
│   │   ├── BibliographyPage.tsx
│   │   └── SearchPage.tsx
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   ├── App.tsx
│   ├── index.tsx
│   └── index.css
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── README.md
```

## Technologies Used

- **React 18**: UI library
- **TypeScript**: Type safety
- **React Router**: Navigation
- **React Flow**: Mind map visualization
- **Tailwind CSS**: Styling
- **React YouTube**: Video player
- **Lucide React**: Icons
- **Jest & React Testing Library**: Testing

## Module Content

1. **Introduction to Carl Jung**: Life, career, and foundational concepts
2. **The Collective Unconscious**: Universal patterns and archetypal contents
3. **Major Archetypes**: Shadow, Anima/Animus, Self, and more
4. **The Individuation Process**: Journey toward psychological wholeness
5. **Psychological Types**: Introversion/Extraversion and the four functions
6. **Dreams and Symbolism**: Jung's approach to dream interpretation

## Features in Detail

### Progress Tracking
- Overall completion percentage
- Module-specific progress
- Quiz scores tracking
- Time spent learning
- Achievement system

### Note-Taking
- Create notes for each module
- Edit and delete functionality
- Search and filter notes
- Persistent storage

### Interactive Quizzes
- Multiple choice questions
- Immediate feedback
- Score tracking
- Progress indicators

### Mind Map
- Visual representation of concepts
- Interactive navigation
- Click to explore modules
- Color-coded node types

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- Content based on Carl Jung's analytical psychology theories
- Built with modern React best practices
- Designed for educational purposes