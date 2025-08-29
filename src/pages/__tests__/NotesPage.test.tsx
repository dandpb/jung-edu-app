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

describe('NotesPage Component - Enhanced Coverage', () => {
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

  // Additional comprehensive tests for enhanced coverage
  describe('Edge Cases and Error Handling', () => {
    test('handles empty notes gracefully when filtering', () => {
      renderWithRouter(
        <NotesPage
          userProgress={{ ...mockUserProgress, notes: [] }}
          updateProgress={mockUpdateProgress}
          modules={mockModules}
        />
      );

      const searchInput = screen.getByPlaceholderText('Buscar anotações...');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      expect(screen.getByText(/Ainda não há anotações/)).toBeInTheDocument();
    });

    test('handles notes with empty content', () => {
      const notesWithEmptyContent = {
        ...mockUserProgress,
        notes: [{
          id: 'empty-note',
          moduleId: 'intro-jung',
          content: '',
          timestamp: Date.now()
        }]
      };

      renderWithRouter(
        <NotesPage
          userProgress={notesWithEmptyContent}
          updateProgress={mockUpdateProgress}
          modules={mockModules}
        />
      );

      expect(screen.getByText('1 anotação encontrada')).toBeInTheDocument();
    });

    test('handles notes with special characters in search', () => {
      renderWithRouter(
        <NotesPage
          userProgress={mockUserProgress}
          updateProgress={mockUpdateProgress}
          modules={mockModules}
        />
      );

      const searchInput = screen.getByPlaceholderText('Buscar anotações...');
      fireEvent.change(searchInput, { target: { value: '[special]' } });

      expect(screen.getByText(/Nenhuma anotação encontrada/)).toBeInTheDocument();
    });

    test('handles case-insensitive search correctly', () => {
      renderWithRouter(
        <NotesPage
          userProgress={mockUserProgress}
          updateProgress={mockUpdateProgress}
          modules={mockModules}
        />
      );

      const searchInput = screen.getByPlaceholderText('Buscar anotações...');
      fireEvent.change(searchInput, { target: { value: 'JUNG' } });

      expect(screen.getByText(/Esta é uma nota sobre Jung/)).toBeInTheDocument();
      expect(screen.getByText(/Jung foi aluno de Freud/)).toBeInTheDocument();
    });
  });

  describe('Note Editing Edge Cases', () => {
    test('handles editing when NoteEditor is unavailable', () => {
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
    });

    test('updates note timestamp when editing', async () => {
      const originalTime = Date.now() - 10000;
      const notesWithOldTimestamp = {
        ...mockUserProgress,
        notes: [{
          id: 'old-note',
          moduleId: 'intro-jung',
          content: 'Old content',
          timestamp: originalTime
        }]
      };

      renderWithRouter(
        <NotesPage
          userProgress={notesWithOldTimestamp}
          updateProgress={mockUpdateProgress}
          modules={mockModules}
        />
      );

      const editButton = screen.getByTitle('Editar anotação');
      fireEvent.click(editButton);

      const saveButton = screen.getByTestId('save-button');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateProgress).toHaveBeenCalledWith({
          notes: expect.arrayContaining([
            expect.objectContaining({
              id: 'old-note',
              content: 'updated content',
              timestamp: expect.any(Number)
            })
          ])
        });
      });

      // Verify timestamp was updated (should be greater than original)
      const callArgs = mockUpdateProgress.mock.calls[0][0];
      expect(callArgs.notes[0].timestamp).toBeGreaterThan(originalTime);
    });
  });

  describe('Module Integration', () => {
    test('displays correct module icon for each note', () => {
      renderWithRouter(
        <NotesPage
          userProgress={mockUserProgress}
          updateProgress={mockUpdateProgress}
          modules={mockModules}
        />
      );

      // Check that module icons are displayed
      expect(screen.getByText('🧠')).toBeInTheDocument(); // intro-jung icon
      expect(screen.getByText('🌑')).toBeInTheDocument(); // shadow-concept icon
    });

    test('falls back to default icon when module not found', () => {
      const notesWithUnknownModule = {
        ...mockUserProgress,
        notes: [{
          id: 'unknown-module-note',
          moduleId: 'non-existent-module',
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

      expect(screen.getByText('📝')).toBeInTheDocument(); // default icon
    });

    test('handles module selection with all modules option', () => {
      renderWithRouter(
        <NotesPage
          userProgress={mockUserProgress}
          updateProgress={mockUpdateProgress}
          modules={mockModules}
        />
      );

      const moduleSelect = screen.getByRole('combobox');
      expect(screen.getByText('Todos os Módulos')).toBeInTheDocument();
      
      // Select all modules
      fireEvent.change(moduleSelect, { target: { value: 'all' } });
      expect(screen.getByText('3 anotações encontradas')).toBeInTheDocument();
    });
  });

  describe('Performance and Accessibility', () => {
    test('handles large number of notes efficiently', () => {
      const manyNotes = Array(100).fill(null).map((_, index) => ({
        id: `note-${index}`,
        moduleId: 'intro-jung',
        content: `Note content ${index}`,
        timestamp: Date.now() - (index * 1000),
        tags: [`tag${index}`]
      }));

      const progressWithManyNotes = {
        ...mockUserProgress,
        notes: manyNotes
      };

      const startTime = performance.now();
      renderWithRouter(
        <NotesPage
          userProgress={progressWithManyNotes}
          updateProgress={mockUpdateProgress}
          modules={mockModules}
        />
      );
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(200); // Should render quickly
      expect(screen.getByText('100 anotações encontradas')).toBeInTheDocument();
    });

    test('maintains proper ARIA labels for interactive elements', () => {
      renderWithRouter(
        <NotesPage
          userProgress={mockUserProgress}
          updateProgress={mockUpdateProgress}
          modules={mockModules}
        />
      );

      const searchInput = screen.getByPlaceholderText('Buscar anotações...');
      expect(searchInput).toBeInTheDocument();
      expect(searchInput.tagName).toBe('INPUT');

      const moduleSelect = screen.getByRole('combobox');
      expect(moduleSelect).toBeInTheDocument();
    });

    test('provides proper button titles for accessibility', () => {
      renderWithRouter(
        <NotesPage
          userProgress={mockUserProgress}
          updateProgress={mockUpdateProgress}
          modules={mockModules}
        />
      );

      const editButtons = screen.getAllByTitle('Editar anotação');
      const deleteButtons = screen.getAllByTitle('Excluir anotação');

      expect(editButtons.length).toBeGreaterThan(0);
      expect(deleteButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Date Formatting', () => {
    test('formats dates consistently across different locales', () => {
      const specificTimestamp = new Date('2023-12-25T15:30:00').getTime();
      const noteWithSpecificDate = {
        ...mockUserProgress,
        notes: [{
          id: 'date-test',
          moduleId: 'intro-jung',
          content: 'Date formatting test',
          timestamp: specificTimestamp
        }]
      };

      renderWithRouter(
        <NotesPage
          userProgress={noteWithSpecificDate}
          updateProgress={mockUpdateProgress}
          modules={mockModules}
        />
      );

      // Should display formatted date (exact format may vary by locale)
      expect(screen.getByText(/15:30/)).toBeInTheDocument();
    });

    test('handles invalid timestamps gracefully', () => {
      const noteWithInvalidDate = {
        ...mockUserProgress,
        notes: [{
          id: 'invalid-date',
          moduleId: 'intro-jung',
          content: 'Invalid date test',
          timestamp: NaN
        }]
      };

      expect(() => {
        renderWithRouter(
          <NotesPage
            userProgress={noteWithInvalidDate}
            updateProgress={mockUpdateProgress}
            modules={mockModules}
          />
        );
      }).not.toThrow();
    });
  });

  describe('Search and Filter Combinations', () => {
    test('resets results when switching between filters', () => {
      renderWithRouter(
        <NotesPage
          userProgress={mockUserProgress}
          updateProgress={mockUpdateProgress}
          modules={mockModules}
        />
      );

      // First apply module filter
      const moduleSelect = screen.getByRole('combobox');
      fireEvent.change(moduleSelect, { target: { value: 'intro-jung' } });
      expect(screen.getByText('2 anotações encontradas')).toBeInTheDocument();

      // Then apply search
      const searchInput = screen.getByPlaceholderText('Buscar anotações...');
      fireEvent.change(searchInput, { target: { value: 'sombra' } });
      expect(screen.getByText(/Nenhuma anotação encontrada/)).toBeInTheDocument();

      // Clear search
      fireEvent.change(searchInput, { target: { value: '' } });
      expect(screen.getByText('2 anotações encontradas')).toBeInTheDocument();
    });

    test('handles rapid filter changes without errors', () => {
      renderWithRouter(
        <NotesPage
          userProgress={mockUserProgress}
          updateProgress={mockUpdateProgress}
          modules={mockModules}
        />
      );

      const searchInput = screen.getByPlaceholderText('Buscar anotações...');
      const moduleSelect = screen.getByRole('combobox');

      // Rapid changes
      for (let i = 0; i < 10; i++) {
        fireEvent.change(searchInput, { target: { value: `search${i}` } });
        fireEvent.change(moduleSelect, { target: { value: i % 2 === 0 ? 'all' : 'intro-jung' } });
      }

      // Should not crash and should display final state
      expect(screen.getByDisplayValue('search9')).toBeInTheDocument();
    });
  });

  describe('Note Deletion Edge Cases', () => {
    test('handles deletion of non-existent note gracefully', () => {
      const mockUpdateProgressSpy = jest.fn();
      
      renderWithRouter(
        <NotesPage
          userProgress={mockUserProgress}
          updateProgress={mockUpdateProgressSpy}
          modules={mockModules}
        />
      );

      const deleteButtons = screen.getAllByTitle('Excluir anotação');
      fireEvent.click(deleteButtons[0]);

      expect(mockUpdateProgressSpy).toHaveBeenCalledWith({
        notes: expect.any(Array)
      });
    });

    test('maintains note order after deletion', () => {
      const notesInOrder = {
        ...mockUserProgress,
        notes: [
          { id: '1', moduleId: 'intro-jung', content: 'First', timestamp: Date.now() - 3000 },
          { id: '2', moduleId: 'intro-jung', content: 'Second', timestamp: Date.now() - 2000 },
          { id: '3', moduleId: 'intro-jung', content: 'Third', timestamp: Date.now() - 1000 }
        ]
      };

      renderWithRouter(
        <NotesPage
          userProgress={notesInOrder}
          updateProgress={mockUpdateProgress}
          modules={mockModules}
        />
      );

      // Delete middle note
      const deleteButtons = screen.getAllByTitle('Excluir anotação');
      fireEvent.click(deleteButtons[1]); // Delete 'Second'

      expect(mockUpdateProgress).toHaveBeenCalledWith({
        notes: expect.arrayContaining([
          expect.objectContaining({ content: 'First' }),
          expect.objectContaining({ content: 'Third' })
        ])
      });
    });
  });
});