import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ModuleEditor from '../ModuleEditor';
import { Module } from '../../../types';

const mockModule: Module = {
  id: 'test-module',
  title: 'Test Module',
  description: 'Test Description',
  icon: '🧪',
  estimatedTime: 30,
  difficulty: 'beginner',
  content: {
    introduction: 'Test introduction',
    sections: [
      {
        id: 'section-1',
        title: 'Section 1',
        content: 'Section content',
        keyTerms: [
          { term: 'Term 1', definition: 'Definition 1' }
        ]
      }
    ],
    quiz: {
      id: 'quiz-1',
      title: 'Test Quiz',
      questions: [
        {
          id: 'q1',
          question: 'Test question?',
          options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
          correctAnswer: 0,
          explanation: 'Test explanation'
        }
      ]
    }
  }
};

const mockOnSave = jest.fn();
const mockOnCancel = jest.fn();
const mockModules: Module[] = [mockModule];

describe('ModuleEditor Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders with all form fields', () => {
    render(
      <ModuleEditor
        module={mockModule}
        modules={mockModules}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Basic tab fields (default tab)
    expect(screen.getByLabelText(/título do módulo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/descrição/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ícone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tempo estimado/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/dificuldade/i)).toBeInTheDocument();
    
    // Switch to content tab to check introduction field
    const contentTab = screen.getByText(/conteúdo/i);
    fireEvent.click(contentTab);
    
    expect(screen.getByLabelText(/introdução/i)).toBeInTheDocument();
  });

  test('loads module data into form fields', () => {
    render(
      <ModuleEditor
        module={mockModule}
        modules={mockModules}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Basic tab fields
    expect(screen.getByDisplayValue('Test Module')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
    expect(screen.getByDisplayValue('🧪')).toBeInTheDocument();
    expect(screen.getByDisplayValue('30')).toBeInTheDocument();
    
    // Check select value differently
    const difficultySelect = screen.getByLabelText(/dificuldade/i) as HTMLSelectElement;
    expect(difficultySelect.value).toBe('beginner');
    
    // Switch to content tab to check introduction
    const contentTab = screen.getByText(/conteúdo/i);
    fireEvent.click(contentTab);
    
    expect(screen.getByDisplayValue('Test introduction')).toBeInTheDocument();
  });

  test('displays sections in the content tab', () => {
    render(
      <ModuleEditor
        module={mockModule}
        modules={mockModules}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Click on content tab
    const contentTab = screen.getByText(/conteúdo/i);
    fireEvent.click(contentTab);

    // Section title is in an input field, not plain text
    expect(screen.getByDisplayValue('Section 1')).toBeInTheDocument();
  });

  test('adds new section', () => {
    render(
      <ModuleEditor
        module={mockModule}
        modules={mockModules}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Click on content tab first
    const contentTab = screen.getByText(/conteúdo/i);
    fireEvent.click(contentTab);

    const addSectionButton = screen.getByText(/adicionar seção/i);
    fireEvent.click(addSectionButton);

    // Check that we now have more sections - section title is in input field
    expect(screen.getByDisplayValue('Nova Seção')).toBeInTheDocument();
  });

  test('switches between tabs', () => {
    render(
      <ModuleEditor
        module={mockModule}
        modules={mockModules}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Click on resources tab
    const resourcesTab = screen.getByText(/recursos/i);
    fireEvent.click(resourcesTab);

    // Check that resources content is shown
    expect(screen.getByText(/bibliografia/i)).toBeInTheDocument();
  });

  test('has save and cancel buttons', () => {
    render(
      <ModuleEditor
        module={mockModule}
        modules={mockModules}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(/salvar módulo/i)).toBeInTheDocument();
    expect(screen.getByText(/cancelar/i)).toBeInTheDocument();
  });

  test('updates form fields', () => {
    render(
      <ModuleEditor
        module={mockModule}
        modules={mockModules}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const titleInput = screen.getByLabelText(/título do módulo/i);
    fireEvent.change(titleInput, { target: { value: 'Updated Title' } });

    expect(screen.getByDisplayValue('Updated Title')).toBeInTheDocument();
  });

  test('calls onSave with updated module data', async () => {
    render(
      <ModuleEditor
        module={mockModule}
        modules={mockModules}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const titleInput = screen.getByLabelText(/título do módulo/i);
    fireEvent.change(titleInput, { target: { value: 'Updated Module' } });

    const saveButton = screen.getByText(/salvar módulo/i);
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockModule,
          title: 'Updated Module'
        })
      );
    });
  });

  test('calls onCancel when cancel button clicked', () => {
    render(
      <ModuleEditor
        module={mockModule}
        modules={mockModules}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByText(/cancelar/i);
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  test('validates required fields before saving', () => {
    const emptyModule = {
      ...mockModule,
      title: '',
      description: ''
    };

    render(
      <ModuleEditor
        module={emptyModule}
        modules={mockModules}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const saveButton = screen.getByText(/salvar módulo/i);
    fireEvent.click(saveButton);

    // Should show validation errors
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  test('displays quiz section in content tab', () => {
    render(
      <ModuleEditor
        module={mockModule}
        modules={mockModules}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Click on content tab
    const contentTab = screen.getByText(/conteúdo/i);
    fireEvent.click(contentTab);

    // Quiz section should be visible
    expect(screen.getByText(/questionário/i)).toBeInTheDocument();
  });

  test('handles difficulty level change', () => {
    render(
      <ModuleEditor
        module={mockModule}
        modules={mockModules}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const difficultySelect = screen.getByLabelText(/dificuldade/i) as HTMLSelectElement;
    fireEvent.change(difficultySelect, { target: { value: 'intermediate' } });

    expect(difficultySelect.value).toBe('intermediate');
  });

  test('handles estimated time input', () => {
    render(
      <ModuleEditor
        module={mockModule}
        modules={mockModules}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const timeInput = screen.getByLabelText(/tempo estimado/i);
    fireEvent.change(timeInput, { target: { value: '45' } });

    expect(screen.getByDisplayValue('45')).toBeInTheDocument();
  });

  test('preserves module ID when saving', async () => {
    render(
      <ModuleEditor
        module={mockModule}
        modules={mockModules}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const saveButton = screen.getByText(/salvar módulo/i);
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-module'
        })
      );
    });
  });
});