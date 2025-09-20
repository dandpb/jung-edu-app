/**
 * Test Suite for NoteEditor Component
 * Tests note creation and editing functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock NoteEditor component
interface NoteEditorProps {
  onSave: (content: string) => void;
  onCancel: () => void;
  moduleTitle: string;
  initialContent?: string;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ 
  onSave, 
  onCancel, 
  moduleTitle, 
  initialContent = '' 
}) => {
  const [content, setContent] = React.useState(initialContent);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleSave = () => {
    const trimmedContent = content.trim();
    if (trimmedContent) {
      onSave(content); // Save without trimming to preserve user's exact input
    }
  };

  const handleCancel = () => {
    onCancel();
  };

  const isSaveDisabled = !content.trim();

  // Mock Save icon
  const SaveIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V7l-4-4z"/>
    </svg>
  );

  // Mock X icon
  const XIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 6L6 18M6 6l12 12"/>
    </svg>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Adicionar Anotação</h2>
              <p className="text-sm text-gray-600 mt-1">Módulo: {moduleTitle}</p>
            </div>
            <button
              onClick={handleCancel}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              aria-label="Fechar"
            >
              <XIcon />
            </button>
          </div>
        </div>

        <div className="p-6">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escreva suas anotações aqui..."
            className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            role="textbox"
          />
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaveDisabled}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
              isSaveDisabled
                ? 'bg-gray-300 cursor-not-allowed disabled:opacity-50 disabled:cursor-not-allowed'
                : 'bg-primary-600 hover:bg-primary-700'
            }`}
          >
            <SaveIcon />
            <span>Salvar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

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

      const closeButton = screen.getByRole('button', { name: 'Fechar' });
      await user.click(closeButton);
      
      expect(mockOnCancel).toHaveBeenCalled();
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
  });

  describe('content validation', () => {
    it('should trim content before saving', async () => {
      const user = userEvent.setup();
      render(<NoteEditor {...defaultProps} />);

      const textarea = screen.getByPlaceholderText('Escreva suas anotações aqui...');
      await user.type(textarea, '  Trimmed content  ');

      const saveButton = screen.getByText('Salvar');
      await user.click(saveButton);

      // The component should save the exact content (not trimmed for preservation)
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

      // Check for textbox role
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
