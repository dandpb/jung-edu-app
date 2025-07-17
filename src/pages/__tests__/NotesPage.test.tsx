import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NotesPage from '../NotesPage';
import { modules } from '../../data/modules';
import { UserProgress } from '../../types';

const mockUpdateProgress = jest.fn();

const mockUserProgress: UserProgress = {
  userId: 'test-user',
  completedModules: [],
  quizScores: {},
  totalTime: 0,
  lastAccessed: Date.now(),
  notes: [
    {
      id: 'note-1',
      moduleId: 'intro-jung',
      content: 'First test note about Jung',
      timestamp: Date.now() - 3600000,
      tags: ['psychology', 'jung']
    },
    {
      id: 'note-2',
      moduleId: 'collective-unconscious',
      content: 'Notes about the collective unconscious',
      timestamp: Date.now() - 7200000
    },
    {
      id: 'note-3',
      moduleId: 'intro-jung',
      content: 'Additional thoughts on analytical psychology',
      timestamp: Date.now()
    }
  ]
};

describe('NotesPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders all notes', () => {
    render(
      <NotesPage 
        userProgress={mockUserProgress} 
        updateProgress={mockUpdateProgress} 
        modules={modules} 
      />
    );
    
    expect(screen.getByText('First test note about Jung')).toBeInTheDocument();
    expect(screen.getByText('Notes about the collective unconscious')).toBeInTheDocument();
    expect(screen.getByText('Additional thoughts on analytical psychology')).toBeInTheDocument();
  });

  test('displays note count correctly', () => {
    render(
      <NotesPage 
        userProgress={mockUserProgress} 
        updateProgress={mockUpdateProgress} 
        modules={modules} 
      />
    );
    
    expect(screen.getByText('3 notes found')).toBeInTheDocument();
  });

  test('filters notes by search term', () => {
    render(
      <NotesPage 
        userProgress={mockUserProgress} 
        updateProgress={mockUpdateProgress} 
        modules={modules} 
      />
    );
    
    const searchInput = screen.getByPlaceholderText('Search notes...');
    fireEvent.change(searchInput, { target: { value: 'collective' } });
    
    expect(screen.getByText('Notes about the collective unconscious')).toBeInTheDocument();
    expect(screen.queryByText('First test note about Jung')).not.toBeInTheDocument();
    expect(screen.getByText('1 note found')).toBeInTheDocument();
  });

  test('filters notes by module', () => {
    render(
      <NotesPage 
        userProgress={mockUserProgress} 
        updateProgress={mockUpdateProgress} 
        modules={modules} 
      />
    );
    
    const moduleFilter = screen.getByRole('combobox');
    fireEvent.change(moduleFilter, { target: { value: 'intro-jung' } });
    
    expect(screen.getByText('First test note about Jung')).toBeInTheDocument();
    expect(screen.getByText('Additional thoughts on analytical psychology')).toBeInTheDocument();
    expect(screen.queryByText('Notes about the collective unconscious')).not.toBeInTheDocument();
    expect(screen.getByText('2 notes found')).toBeInTheDocument();
  });

  test('deletes note when delete button is clicked', () => {
    render(
      <NotesPage 
        userProgress={mockUserProgress} 
        updateProgress={mockUpdateProgress} 
        modules={modules} 
      />
    );
    
    // Notes are sorted by timestamp (newest first), so deleteButtons[0] is note-3
    const deleteButtons = screen.getAllByTitle('Delete note');
    fireEvent.click(deleteButtons[0]);
    
    expect(mockUpdateProgress).toHaveBeenCalledWith({
      notes: expect.arrayContaining([
        expect.objectContaining({ id: 'note-1' }),
        expect.objectContaining({ id: 'note-2' })
      ])
    });
    
    // Verify note-3 is not in the array
    const callArg = mockUpdateProgress.mock.calls[0][0];
    const noteIds = callArg.notes.map((note: any) => note.id);
    expect(noteIds).not.toContain('note-3');
  });

  test('opens edit modal when edit button is clicked', () => {
    render(
      <NotesPage 
        userProgress={mockUserProgress} 
        updateProgress={mockUpdateProgress} 
        modules={modules} 
      />
    );
    
    const editButtons = screen.getAllByTitle('Edit note');
    // Notes are sorted by timestamp (newest first), so editButtons[0] is note-3
    fireEvent.click(editButtons[0]);
    
    expect(screen.getByDisplayValue('Additional thoughts on analytical psychology')).toBeInTheDocument();
  });

  test('updates note content when edited', async () => {
    render(
      <NotesPage 
        userProgress={mockUserProgress} 
        updateProgress={mockUpdateProgress} 
        modules={modules} 
      />
    );
    
    const editButtons = screen.getAllByTitle('Edit note');
    // Notes are sorted by timestamp (newest first), so editButtons[0] is note-3
    fireEvent.click(editButtons[0]);
    
    const textarea = screen.getByDisplayValue('Additional thoughts on analytical psychology');
    fireEvent.change(textarea, { target: { value: 'Updated note content' } });
    
    const saveButton = screen.getByText('Save Note');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockUpdateProgress).toHaveBeenCalledWith({
        notes: expect.arrayContaining([
          expect.objectContaining({
            id: 'note-3',
            content: 'Updated note content'
          })
        ])
      });
    });
  });

  test('displays tags when present', () => {
    render(
      <NotesPage 
        userProgress={mockUserProgress} 
        updateProgress={mockUpdateProgress} 
        modules={modules} 
      />
    );
    
    expect(screen.getByText('psychology')).toBeInTheDocument();
    expect(screen.getByText('jung')).toBeInTheDocument();
  });

  test('shows empty state when no notes exist', () => {
    const emptyProgress = { ...mockUserProgress, notes: [] };
    
    render(
      <NotesPage 
        userProgress={emptyProgress} 
        updateProgress={mockUpdateProgress} 
        modules={modules} 
      />
    );
    
    expect(screen.getByText(/No notes yet/i)).toBeInTheDocument();
  });

  test('sorts notes by timestamp (newest first)', () => {
    render(
      <NotesPage 
        userProgress={mockUserProgress} 
        updateProgress={mockUpdateProgress} 
        modules={modules} 
      />
    );
    
    // Get all note content paragraphs
    const noteTexts = [
      'Additional thoughts on analytical psychology',
      'First test note about Jung',
      'Notes about the collective unconscious'
    ];
    
    // Find all note content elements
    const noteElements = noteTexts.map(text => screen.getByText(text));
    
    // Verify they appear in the correct order (newest first)
    const parentContainer = noteElements[0].closest('.space-y-4');
    const allNotes = Array.from(parentContainer?.querySelectorAll('.card') || []);
    
    expect(allNotes[0]).toHaveTextContent('Additional thoughts on analytical psychology');
    expect(allNotes[1]).toHaveTextContent('First test note about Jung');
    expect(allNotes[2]).toHaveTextContent('Notes about the collective unconscious');
  });
});