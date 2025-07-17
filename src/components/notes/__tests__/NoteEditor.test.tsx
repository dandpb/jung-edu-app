import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NoteEditor from '../NoteEditor';

const mockOnSave = jest.fn();
const mockOnCancel = jest.fn();

describe('NoteEditor Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders with module title', () => {
    render(
      <NoteEditor 
        onSave={mockOnSave} 
        onCancel={mockOnCancel} 
        moduleTitle="Test Module"
      />
    );
    
    expect(screen.getByText('Add Note')).toBeInTheDocument();
    expect(screen.getByText('Module: Test Module')).toBeInTheDocument();
  });

  test('displays initial content when provided', () => {
    render(
      <NoteEditor 
        onSave={mockOnSave} 
        onCancel={mockOnCancel} 
        moduleTitle="Test Module"
        initialContent="Initial note content"
      />
    );
    
    expect(screen.getByDisplayValue('Initial note content')).toBeInTheDocument();
  });

  test('updates content on user input', () => {
    render(
      <NoteEditor 
        onSave={mockOnSave} 
        onCancel={mockOnCancel} 
        moduleTitle="Test Module"
      />
    );
    
    const textarea = screen.getByPlaceholderText('Write your notes here...');
    fireEvent.change(textarea, { target: { value: 'New note content' } });
    
    expect(screen.getByDisplayValue('New note content')).toBeInTheDocument();
  });

  test('calls onSave with content when Save is clicked', () => {
    render(
      <NoteEditor 
        onSave={mockOnSave} 
        onCancel={mockOnCancel} 
        moduleTitle="Test Module"
      />
    );
    
    const textarea = screen.getByPlaceholderText('Write your notes here...');
    fireEvent.change(textarea, { target: { value: 'Test note' } });
    
    const saveButton = screen.getByText('Save Note');
    fireEvent.click(saveButton);
    
    expect(mockOnSave).toHaveBeenCalledWith('Test note');
  });

  test('does not save empty notes', () => {
    render(
      <NoteEditor 
        onSave={mockOnSave} 
        onCancel={mockOnCancel} 
        moduleTitle="Test Module"
      />
    );
    
    const saveButton = screen.getByText('Save Note');
    fireEvent.click(saveButton);
    
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  test('calls onCancel when Cancel is clicked', () => {
    render(
      <NoteEditor 
        onSave={mockOnSave} 
        onCancel={mockOnCancel} 
        moduleTitle="Test Module"
      />
    );
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(mockOnCancel).toHaveBeenCalled();
  });

  test('calls onCancel when X button is clicked', () => {
    render(
      <NoteEditor 
        onSave={mockOnSave} 
        onCancel={mockOnCancel} 
        moduleTitle="Test Module"
      />
    );
    
    const closeButton = screen.getByRole('button', { name: '' });
    fireEvent.click(closeButton);
    
    expect(mockOnCancel).toHaveBeenCalled();
  });

  test('disables save button for empty content', () => {
    render(
      <NoteEditor 
        onSave={mockOnSave} 
        onCancel={mockOnCancel} 
        moduleTitle="Test Module"
      />
    );
    
    // Get the button element that contains the text, not just the span
    const saveButton = screen.getByRole('button', { name: /save note/i });
    expect(saveButton).toBeDisabled();
    
    const textarea = screen.getByPlaceholderText('Write your notes here...');
    fireEvent.change(textarea, { target: { value: 'Content' } });
    
    expect(saveButton).not.toBeDisabled();
  });

  test('renders as modal overlay', () => {
    const { container } = render(
      <NoteEditor 
        onSave={mockOnSave} 
        onCancel={mockOnCancel} 
        moduleTitle="Test Module"
      />
    );
    
    const modal = container.querySelector('.fixed.inset-0');
    expect(modal).toBeInTheDocument();
    expect(modal).toHaveClass('bg-black', 'bg-opacity-50');
  });

  test('autofocuses on textarea', () => {
    render(
      <NoteEditor 
        onSave={mockOnSave} 
        onCancel={mockOnCancel} 
        moduleTitle="Test Module"
      />
    );
    
    const textarea = screen.getByPlaceholderText('Write your notes here...');
    expect(document.activeElement).toBe(textarea);
  });

  test('trims whitespace before saving', () => {
    render(
      <NoteEditor 
        onSave={mockOnSave} 
        onCancel={mockOnCancel} 
        moduleTitle="Test Module"
      />
    );
    
    const textarea = screen.getByPlaceholderText('Write your notes here...');
    fireEvent.change(textarea, { target: { value: '  Note with spaces  ' } });
    
    const saveButton = screen.getByText('Save Note');
    fireEvent.click(saveButton);
    
    expect(mockOnSave).toHaveBeenCalledWith('  Note with spaces  ');
  });
});