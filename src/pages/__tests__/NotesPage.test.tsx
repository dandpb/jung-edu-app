import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NotesPage from '../NotesPage';
import { UserProgress, Module } from '../../types';

// Mock the NoteEditor component
jest.mock('../../components/notes/NoteEditor', () => ({
  __esModule: true,
  default: ({ onSave, onCancel, moduleTitle, initialContent }: any) => (
    <div data-testid="note-editor">
      <h3>{moduleTitle}</h3>
      <textarea
        defaultValue={initialContent}
        onChange={(e) => e.target.value}
        data-testid="note-editor-textarea"
      />
      <button onClick={() => onSave('updated content')} data-testid="save-button">
        Save
      </button>
      <button onClick={onCancel} data-testid="cancel-button">
        Cancel
      </button>
    </div>
  ),
}));

const mockModules: Module[] = [
  {
    id: 'intro-jung',
    title: 'Introdução a Jung',
    description: 'Description 1',
    icon: '🧠',
    duration: 30,
    content: [],
    quiz: {
      id: 'quiz-1',
      questions: []
    }
  },
  {
    id: 'shadow-concept',
    title: 'O Conceito de Sombra',
    description: 'Description 2',
    icon: '🌑',
    duration: 45,
    content: [],
    quiz: {
      id: 'quiz-2',
      questions: []
    }
  }
];

const mockUserProgress: UserProgress = {
  userId: 'test-user',
  completedModules: ['intro-jung'],
  quizScores: { 'intro-jung': 90 },
  totalTime: 3600,
  lastAccessed: Date.now(),
  notes: [
    {
      id: '1',
      moduleId: 'intro-jung',
      content: 'Esta é uma nota sobre Jung',
      timestamp: Date.now() - 86400000, // 1 day ago
      tags: ['psicologia', 'jung']
    },
    {
      id: '2',
      moduleId: 'shadow-concept',
      content: 'A sombra representa aspectos reprimidos da personalidade',
      timestamp: Date.now() - 3600000, // 1 hour ago
      tags: ['sombra', 'inconsciente']
    },
    {
      id: '3',
      moduleId: 'intro-jung',
      content: 'Jung foi aluno de Freud',
      timestamp: Date.now() - 7200000, // 2 hours ago
    }
  ]
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <MemoryRouter initialEntries={['/']}>
      {component}
    </MemoryRouter>
  );
};

describe('NotesPage Component', () => {
  const mockUpdateProgress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders page header and description', () => {
    renderWithRouter(
      <NotesPage
        userProgress={mockUserProgress}
        updateProgress={mockUpdateProgress}
        modules={mockModules}
      />
    );

    expect(screen.getByText('Minhas Anotações')).toBeInTheDocument();
    expect(screen.getByText(/Todas as suas anotações de aprendizagem em um só lugar/)).toBeInTheDocument();
  });

  test('displays all notes sorted by timestamp', () => {
    renderWithRouter(
      <NotesPage
        userProgress={mockUserProgress}
        updateProgress={mockUpdateProgress}
        modules={mockModules}
      />
    );

    const notes = screen.getAllByText(/nota sobre Jung|sombra representa|Jung foi aluno/);
    expect(notes).toHaveLength(3);
    
    // Check that notes are sorted by timestamp (newest first)
    expect(notes[0]).toHaveTextContent('A sombra representa aspectos reprimidos da personalidade');
    expect(notes[1]).toHaveTextContent('Jung foi aluno de Freud');
    expect(notes[2]).toHaveTextContent('Esta é uma nota sobre Jung');
  });

  test('filters notes by search term', () => {
    renderWithRouter(
      <NotesPage
        userProgress={mockUserProgress}
        updateProgress={mockUpdateProgress}
        modules={mockModules}
      />
    );

    const searchInput = screen.getByPlaceholderText('Buscar anotações...');
    fireEvent.change(searchInput, { target: { value: 'sombra' } });

    expect(screen.getByText(/A sombra representa aspectos reprimidos/)).toBeInTheDocument();
    expect(screen.queryByText(/Esta é uma nota sobre Jung/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Jung foi aluno de Freud/)).not.toBeInTheDocument();
  });

  test('filters notes by module', () => {
    renderWithRouter(
      <NotesPage
        userProgress={mockUserProgress}
        updateProgress={mockUpdateProgress}
        modules={mockModules}
      />
    );

    const moduleSelect = screen.getByRole('combobox');
    fireEvent.change(moduleSelect, { target: { value: 'intro-jung' } });

    expect(screen.getByText(/Esta é uma nota sobre Jung/)).toBeInTheDocument();
    expect(screen.getByText(/Jung foi aluno de Freud/)).toBeInTheDocument();
    expect(screen.queryByText(/A sombra representa aspectos reprimidos/)).not.toBeInTheDocument();
  });

  test('displays note count correctly', () => {
    renderWithRouter(
      <NotesPage
        userProgress={mockUserProgress}
        updateProgress={mockUpdateProgress}
        modules={mockModules}
      />
    );

    expect(screen.getByText('3 anotações encontradas')).toBeInTheDocument();
  });

  test('shows empty state when no notes exist', () => {
    const emptyProgress = { ...mockUserProgress, notes: [] };
    
    renderWithRouter(
      <NotesPage
        userProgress={emptyProgress}
        updateProgress={mockUpdateProgress}
        modules={mockModules}
      />
    );

    expect(screen.getByText(/Ainda não há anotações/)).toBeInTheDocument();
  });

  test('shows appropriate message when no notes match filters', () => {
    renderWithRouter(
      <NotesPage
        userProgress={mockUserProgress}
        updateProgress={mockUpdateProgress}
        modules={mockModules}
      />
    );

    const searchInput = screen.getByPlaceholderText('Buscar anotações...');
    fireEvent.change(searchInput, { target: { value: 'inexistente' } });

    expect(screen.getByText(/Nenhuma anotação encontrada com os critérios selecionados/)).toBeInTheDocument();
  });

  test('deletes a note when delete button is clicked', () => {
    renderWithRouter(
      <NotesPage
        userProgress={mockUserProgress}
        updateProgress={mockUpdateProgress}
        modules={mockModules}
      />
    );

    const deleteButtons = screen.getAllByTitle('Excluir anotação');
    fireEvent.click(deleteButtons[0]);

    expect(mockUpdateProgress).toHaveBeenCalledWith({
      notes: expect.arrayContaining([
        expect.objectContaining({ id: '1' }),
        expect.objectContaining({ id: '3' })
      ])
    });
    expect(mockUpdateProgress).toHaveBeenCalledWith({
      notes: expect.not.arrayContaining([
        expect.objectContaining({ id: '2' })
      ])
    });
  });

  test('opens note editor when edit button is clicked', () => {
    renderWithRouter(
      <NotesPage
        userProgress={mockUserProgress}
        updateProgress={mockUpdateProgress}
        modules={mockModules}
      />
    );

    const editButtons = screen.getAllByTitle('Editar anotação');
    fireEvent.click(editButtons[0]);

    expect(screen.getByTestId('note-editor')).toBeInTheDocument();
    // The first note in sorted order (newest first) is from shadow-concept module
    const noteEditorTitle = screen.getByTestId('note-editor').querySelector('h3');
    expect(noteEditorTitle).toHaveTextContent('O Conceito de Sombra');
  });

  test('saves edited note content', async () => {
    renderWithRouter(
      <NotesPage
        userProgress={mockUserProgress}
        updateProgress={mockUpdateProgress}
        modules={mockModules}
      />
    );

    const editButtons = screen.getAllByTitle('Editar anotação');
    fireEvent.click(editButtons[0]);

    const saveButton = screen.getByTestId('save-button');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateProgress).toHaveBeenCalledWith({
        notes: expect.arrayContaining([
          expect.objectContaining({
            id: '2',
            content: 'updated content',
            timestamp: expect.any(Number)
          })
        ])
      });
    });
  });

  test('cancels note editing', () => {
    renderWithRouter(
      <NotesPage
        userProgress={mockUserProgress}
        updateProgress={mockUpdateProgress}
        modules={mockModules}
      />
    );

    const editButtons = screen.getAllByTitle('Editar anotação');
    fireEvent.click(editButtons[0]);

    expect(screen.getByTestId('note-editor')).toBeInTheDocument();

    const cancelButton = screen.getByTestId('cancel-button');
    fireEvent.click(cancelButton);

    expect(screen.queryByTestId('note-editor')).not.toBeInTheDocument();
  });

  test('displays tags when present', () => {
    renderWithRouter(
      <NotesPage
        userProgress={mockUserProgress}
        updateProgress={mockUpdateProgress}
        modules={mockModules}
      />
    );

    expect(screen.getByText('psicologia')).toBeInTheDocument();
    expect(screen.getByText('jung')).toBeInTheDocument();
    expect(screen.getByText('sombra')).toBeInTheDocument();
    expect(screen.getByText('inconsciente')).toBeInTheDocument();
  });

  test('formats date correctly', () => {
    renderWithRouter(
      <NotesPage
        userProgress={mockUserProgress}
        updateProgress={mockUpdateProgress}
        modules={mockModules}
      />
    );

    // Check for date elements (the exact format depends on locale)
    const dateElements = screen.getAllByText(/\d{1,2}:\d{2}/);
    expect(dateElements.length).toBeGreaterThan(0);
  });

  test('handles unknown module gracefully', () => {
    const notesWithUnknownModule = {
      ...mockUserProgress,
      notes: [{
        id: '4',
        moduleId: 'unknown-module',
        content: 'Note with unknown module',
        timestamp: Date.now()
      }]
    };

    renderWithRouter(
      <NotesPage
        userProgress={notesWithUnknownModule}
        updateProgress={mockUpdateProgress}
        modules={mockModules}
      />
    );

    expect(screen.getByText('Módulo Desconhecido')).toBeInTheDocument();
  });

  test('combines search and module filters', () => {
    renderWithRouter(
      <NotesPage
        userProgress={mockUserProgress}
        updateProgress={mockUpdateProgress}
        modules={mockModules}
      />
    );

    // First filter by module
    const moduleSelect = screen.getByRole('combobox');
    fireEvent.change(moduleSelect, { target: { value: 'intro-jung' } });

    // Then search within that module
    const searchInput = screen.getByPlaceholderText('Buscar anotações...');
    fireEvent.change(searchInput, { target: { value: 'Freud' } });

    expect(screen.getByText(/Jung foi aluno de Freud/)).toBeInTheDocument();
    expect(screen.queryByText(/Esta é uma nota sobre Jung/)).not.toBeInTheDocument();
    expect(screen.queryByText(/A sombra representa aspectos reprimidos/)).not.toBeInTheDocument();
  });
});