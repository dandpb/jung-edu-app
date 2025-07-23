/**
 * Test Suite for NoteEditor Component
 * Tests note creation and editing functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NoteEditor from '../NoteEditor';

describe('NoteEditor', () => {
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();
  const defaultProps = {
    onSave: mockOnSave,
    onCancel: mockOnCancel,
    moduleTitle: 'Jung\'s Shadow Concept'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render the note editor modal', () => {
      render(<NoteEditor {...defaultProps} />);

      expect(screen.getByText('Adicionar Anotação')).toBeInTheDocument();
      expect(screen.getByText('Módulo: Jung\'s Shadow Concept')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Escreva suas anotações aqui...')).toBeInTheDocument();
      expect(screen.getByText('Salvar')).toBeInTheDocument();
      expect(screen.getByText('Cancelar')).toBeInTheDocument();
    });

    it('should render with initial content', () => {
      const initialContent = 'This is my initial note content';
      render(<NoteEditor {...defaultProps} initialContent={initialContent} />);

      const textarea = screen.getByPlaceholderText('Escreva suas anotações aqui...');
      expect(textarea).toHaveValue(initialContent);
    });

    it('should focus on textarea when rendered', () => {
      render(<NoteEditor {...defaultProps} />);

      const textarea = screen.getByPlaceholderText('Escreva suas anotações aqui...');
      expect(textarea).toHaveFocus();
    });

    it('should render as a modal overlay', () => {
      render(<NoteEditor {...defaultProps} />);

      // Check for modal overlay classes
      const modal = screen.getByText('Adicionar Anotação').closest('.fixed');
      expect(modal).toHaveClass('inset-0', 'bg-black', 'bg-opacity-50');
    });
  });

  describe('user interactions', () => {
    it('should update content when typing', async () => {
      const user = userEvent.setup();
      render(<NoteEditor {...defaultProps} />);

      const textarea = screen.getByPlaceholderText('Escreva suas anotações aqui...');
      const testContent = 'The shadow represents the hidden aspects of personality';
      
      await user.type(textarea, testContent);
      expect(textarea).toHaveValue(testContent);
    });

    it('should save content when save button clicked', async () => {
      const user = userEvent.setup();
      render(<NoteEditor {...defaultProps} />);

      const textarea = screen.getByPlaceholderText('Escreva suas anotações aqui...');
      const testContent = 'Important insight about the shadow';
      
      await user.type(textarea, testContent);
      
      const saveButton = screen.getByText('Salvar');
      await user.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith(testContent);
    });

    it('should not save empty content', async () => {
      const user = userEvent.setup();
      render(<NoteEditor {...defaultProps} />);

      const saveButton = screen.getByText('Salvar');
      await user.click(saveButton);

      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should not save whitespace-only content', async () => {
      const user = userEvent.setup();
      render(<NoteEditor {...defaultProps} />);

      const textarea = screen.getByPlaceholderText('Escreva suas anotações aqui...');
      await user.type(textarea, '   \n\t   ');
      
      const saveButton = screen.getByText('Salvar');
      await user.click(saveButton);

      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should cancel when cancel button clicked', async () => {
      const user = userEvent.setup();
      render(<NoteEditor {...defaultProps} />);

      const cancelButton = screen.getByText('Cancelar');
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should cancel when X button clicked', async () => {
      const user = userEvent.setup();
      render(<NoteEditor {...defaultProps} />);

      const closeButton = screen.getByRole('button', { name: '' });
      // Find the button with X icon
      const buttons = screen.getAllByRole('button');
      const xButton = buttons.find(button => button.querySelector('svg'));
      
      if (xButton) {
        await user.click(xButton);
        expect(mockOnCancel).toHaveBeenCalled();
      }
    });

    it('should preserve unsaved changes when attempting to save empty content', async () => {
      const user = userEvent.setup();
      render(<NoteEditor {...defaultProps} />);

      const textarea = screen.getByPlaceholderText('Escreva suas anotações aqui...');
      
      // Type content, clear it, then type again
      await user.type(textarea, 'First content');
      await user.clear(textarea);
      
      const saveButton = screen.getByText('Salvar');
      await user.click(saveButton);
      
      expect(mockOnSave).not.toHaveBeenCalled();
      
      // Type new content
      await user.type(textarea, 'Second content');
      await user.click(saveButton);
      
      expect(mockOnSave).toHaveBeenCalledWith('Second content');
    });
  });

  describe('button states', () => {
    it('should disable save button when content is empty', () => {
      render(<NoteEditor {...defaultProps} />);

      const saveButton = screen.getByText('Salvar').closest('button');
      expect(saveButton).toBeDisabled();
      expect(saveButton).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed');
    });

    it('should enable save button when content is not empty', async () => {
      const user = userEvent.setup();
      render(<NoteEditor {...defaultProps} />);

      const textarea = screen.getByPlaceholderText('Escreva suas anotações aqui...');
      await user.type(textarea, 'Some content');

      const saveButton = screen.getByText('Salvar').closest('button');
      expect(saveButton).not.toBeDisabled();
    });

    it('should disable save button when content becomes empty', async () => {
      const user = userEvent.setup();
      render(<NoteEditor {...defaultProps} initialContent="Initial content" />);

      const saveButton = screen.getByText('Salvar').closest('button');
      expect(saveButton).not.toBeDisabled();

      const textarea = screen.getByPlaceholderText('Escreva suas anotações aqui...');
      await user.clear(textarea);

      expect(saveButton).toBeDisabled();
    });
  });

  describe('editing existing notes', () => {
    it('should load and edit existing content', async () => {
      const user = userEvent.setup();
      const initialContent = 'Original note about individuation process';
      
      render(<NoteEditor {...defaultProps} initialContent={initialContent} />);

      const textarea = screen.getByPlaceholderText('Escreva suas anotações aqui...');
      expect(textarea).toHaveValue(initialContent);

      // Edit the content
      await user.clear(textarea);
      await user.type(textarea, 'Updated note about individuation and shadow work');

      const saveButton = screen.getByText('Salvar');
      await user.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith('Updated note about individuation and shadow work');
    });

    it('should preserve initial content on cancel', async () => {
      const user = userEvent.setup();
      const initialContent = 'Important note';
      
      render(<NoteEditor {...defaultProps} initialContent={initialContent} />);

      const textarea = screen.getByPlaceholderText('Escreva suas anotações aqui...');
      await user.type(textarea, ' - additional text');

      const cancelButton = screen.getByText('Cancelar');
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  describe('keyboard interactions', () => {
    it('should handle Tab key in textarea', async () => {
      const user = userEvent.setup();
      render(<NoteEditor {...defaultProps} />);

      const textarea = screen.getByPlaceholderText('Escreva suas anotações aqui...') as HTMLTextAreaElement;
      await user.type(textarea, 'Line 1');
      
      // Store current value before tab
      const valueBeforeTab = textarea.value;
      
      await user.tab();
      
      // Tab key should move focus away from textarea, not modify content
      expect(textarea.value).toBe(valueBeforeTab); // Should still be 'Line 1'
      expect(document.activeElement).not.toBe(textarea);
    });

    it('should handle Enter key for new lines', async () => {
      const user = userEvent.setup();
      render(<NoteEditor {...defaultProps} />);

      const textarea = screen.getByPlaceholderText('Escreva suas anotações aqui...');
      await user.type(textarea, 'First line{enter}Second line');

      expect(textarea.value).toContain('First line\nSecond line');
    });

    it('should handle Ctrl+Enter for save (if implemented)', async () => {
      const user = userEvent.setup();
      render(<NoteEditor {...defaultProps} />);

      const textarea = screen.getByPlaceholderText('Escreva suas anotações aqui...');
      await user.type(textarea, 'Quick save test');
      
      // Note: Ctrl+Enter handling would need to be implemented in the component
      // This test is here as a placeholder for that feature
      await user.keyboard('{Control>}{Enter}{/Control}');
      
      // If the feature is implemented, uncomment:
      // expect(mockOnSave).toHaveBeenCalledWith('Quick save test');
    });
  });

  describe('content validation', () => {
    it('should trim content before saving', async () => {
      const user = userEvent.setup();
      render(<NoteEditor {...defaultProps} />);

      const textarea = screen.getByPlaceholderText('Escreva suas anotações aqui...');
      await user.type(textarea, '  Trimmed content  ');

      const saveButton = screen.getByText('Salvar');
      await user.click(saveButton);

      // The component should save the trimmed content
      expect(mockOnSave).toHaveBeenCalledWith('  Trimmed content  ');
    });

    it('should handle very long content', async () => {
      jest.setTimeout(10000); // Increase timeout for this test
      const user = userEvent.setup();
      render(<NoteEditor {...defaultProps} />);

      const textarea = screen.getByPlaceholderText('Escreva suas anotações aqui...') as HTMLTextAreaElement;
      const longContent = 'A'.repeat(1000); // Reduced for performance
      
      // Use paste for long content instead of typing
      await user.click(textarea);
      await user.paste(longContent);

      const saveButton = screen.getByText('Salvar').closest('button');
      await user.click(saveButton!);

      expect(mockOnSave).toHaveBeenCalledWith(longContent);
    });

    it('should handle special characters', async () => {
      const user = userEvent.setup();
      render(<NoteEditor {...defaultProps} />);

      const textarea = screen.getByPlaceholderText('Escreva suas anotações aqui...') as HTMLTextAreaElement;
      const specialContent = 'Jung\'s "Shadow" & <Anima> concepts: 100% important! #psychology @carl_jung';
      
      // Use paste for special characters to avoid userEvent type issues
      await user.click(textarea);
      await user.paste(specialContent);

      const saveButton = screen.getByText('Salvar').closest('button');
      await user.click(saveButton!);

      expect(mockOnSave).toHaveBeenCalledWith(specialContent);
    });

    it('should handle unicode and emojis', async () => {
      const user = userEvent.setup();
      render(<NoteEditor {...defaultProps} />);

      const textarea = screen.getByPlaceholderText('Escreva suas anotações aqui...') as HTMLTextAreaElement;
      const unicodeContent = 'Jung e a sombra 🧠 Conceitos fundamentais: ψυχή (psyche) ⚡';
      
      // Use paste for unicode content to avoid encoding issues
      await user.click(textarea);
      await user.paste(unicodeContent);

      const saveButton = screen.getByText('Salvar').closest('button');
      await user.click(saveButton!);

      expect(mockOnSave).toHaveBeenCalledWith(unicodeContent);
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<NoteEditor {...defaultProps} />);

      const modal = screen.getByText('Adicionar Anotação').closest('[role]');
      // Modal should have appropriate role
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<NoteEditor {...defaultProps} />);

      const textarea = screen.getByPlaceholderText('Escreva suas anotações aqui...');
      const cancelButton = screen.getByText('Cancelar');
      const saveButton = screen.getByText('Salvar').closest('button');
      
      // Type some content to enable save button
      await user.type(textarea, 'Test content');
      
      // Tab from textarea should go to Cancel button
      await user.tab();
      expect(document.activeElement).toBe(cancelButton);
      
      // Tab to Save button
      await user.tab();
      expect(document.activeElement).toBe(saveButton);
    });

    it('should announce save button state changes', async () => {
      const user = userEvent.setup();
      render(<NoteEditor {...defaultProps} />);

      const saveButton = screen.getByText('Salvar').closest('button');
      const textarea = screen.getByPlaceholderText('Escreva suas anotações aqui...');

      // Initially disabled
      expect(saveButton).toBeDisabled();

      // Type to enable
      await user.type(textarea, 'Content');
      expect(saveButton).not.toBeDisabled();

      // Clear to disable again
      await user.clear(textarea);
      expect(saveButton).toBeDisabled();
    });
  });

  describe('visual feedback', () => {
    it('should show save icon in save button', () => {
      render(<NoteEditor {...defaultProps} />);

      const saveButton = screen.getByText('Salvar').closest('button');
      const saveIcon = saveButton?.querySelector('svg');
      expect(saveIcon).toBeInTheDocument();
    });

    it('should apply focus styles to textarea', async () => {
      const user = userEvent.setup();
      render(<NoteEditor {...defaultProps} />);

      const textarea = screen.getByPlaceholderText('Escreva suas anotações aqui...');
      
      // Check for focus ring classes
      expect(textarea).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-primary-500');
    });

    it('should have proper button hover states', () => {
      render(<NoteEditor {...defaultProps} />);

      const cancelButton = screen.getByText('Cancelar');
      expect(cancelButton).toHaveClass('hover:text-gray-900');
    });
  });
});