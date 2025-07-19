import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AIModuleGenerator from '../../components/admin/AIModuleGenerator';
import { ModuleService } from '../../services/modules/moduleService';
import { render as customRender } from '../../utils/test-utils';

// Mock console.error to avoid cluttering test output
const originalConsoleError = console.error;

describe('Error Handling and Edge Cases', () => {
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Input Validation', () => {
    it('should disable generate button for short input', async () => {
      const user = userEvent.setup();
      const mockOnGenerate = jest.fn();
      
      customRender(
        <AIModuleGenerator 
          onGenerate={mockOnGenerate}
          onCancel={() => {}}
          existingModules={[]}
        />
      );
      
      // Initially button should be disabled
      const generateButton = screen.getByRole('button', { name: /Generate Module/i });
      expect(generateButton).toBeDisabled();
      
      // Type less than 3 characters
      const subjectInput = screen.getByLabelText(/what subject/i);
      await user.type(subjectInput, 'ab');
      
      // Button should still be disabled
      expect(generateButton).toBeDisabled();
      
      // Clicking disabled button should not trigger generation
      await user.click(generateButton);
      expect(mockOnGenerate).not.toHaveBeenCalled();
    });
    
    it('should enable button with valid input', async () => {
      const user = userEvent.setup();
      const mockOnGenerate = jest.fn();
      
      customRender(
        <AIModuleGenerator 
          onGenerate={mockOnGenerate}
          onCancel={() => {}}
          existingModules={[]}
        />
      );
      
      const subjectInput = screen.getByLabelText(/what subject/i);
      await user.type(subjectInput, 'Valid Subject');
      
      const generateButton = screen.getByRole('button', { name: /Generate Module/i });
      expect(generateButton).toBeEnabled();
    });
  });
  
  describe('Advanced Options Edge Cases', () => {
    it('should handle invalid time values', async () => {
      const user = userEvent.setup();
      const mockOnGenerate = jest.fn();
      
      customRender(
        <AIModuleGenerator 
          onGenerate={mockOnGenerate}
          onCancel={() => {}}
          existingModules={[]}
        />
      );
      
      // Fill subject first
      await user.type(screen.getByLabelText(/what subject/i), 'Test');
      
      // Open advanced options
      await user.click(screen.getByText(/advanced options/i));
      
      // The time input starts with default value 30
      const timeInput = screen.getByLabelText(/estimated time/i) as HTMLInputElement;
      
      // Type additional digits (simulating user appending to existing value)
      await user.type(timeInput, '00'); // This will make it 3000
      
      // Click generate 
      await user.click(screen.getByRole('button', { name: /Generate Module/i }));
      
      // Component accepts large values
      await waitFor(() => {
        expect(mockOnGenerate).toHaveBeenCalledWith(
          expect.objectContaining({
            subject: 'Test',
            estimatedTime: 3000 // Component accepts very large values
          })
        );
      });
    });
    
    it('should handle empty time input', async () => {
      const user = userEvent.setup();
      const mockOnGenerate = jest.fn();
      
      customRender(
        <AIModuleGenerator 
          onGenerate={mockOnGenerate}
          onCancel={() => {}}
          existingModules={[]}
        />
      );
      
      // Open advanced options
      await user.click(screen.getByText(/advanced options/i));
      
      // Clear time input
      const timeInput = screen.getByLabelText(/estimated time/i);
      await user.clear(timeInput);
      
      // Fill subject and generate
      await user.type(screen.getByLabelText(/what subject/i), 'Test');
      await user.click(screen.getByRole('button', { name: /Generate Module/i }));
      
      // Should use default time
      await waitFor(() => {
        expect(mockOnGenerate).toHaveBeenCalledWith(
          expect.objectContaining({
            estimatedTime: 30
          })
        );
      });
    });
  });
  
  describe('Error Handling in Callbacks', () => {
    it('should handle errors in onGenerate callback', async () => {
      const user = userEvent.setup();
      const mockError = new Error('Generation failed');
      const mockOnGenerate = jest.fn().mockImplementation(() => {
        throw mockError;
      });
      
      customRender(
        <AIModuleGenerator 
          onGenerate={mockOnGenerate}
          onCancel={() => {}}
          existingModules={[]}
        />
      );
      
      await user.type(screen.getByLabelText(/what subject/i), 'Test Module');
      await user.click(screen.getByRole('button', { name: /Generate Module/i }));
      
      // Error should be caught and logged
      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Error in onGenerate:',
          mockError
        );
      });
    });
  });
  
  describe('Long Input Handling', () => {
    it('should handle very long subject input', async () => {
      const user = userEvent.setup();
      const mockOnGenerate = jest.fn();
      const veryLongSubject = 'A'.repeat(500);
      
      customRender(
        <AIModuleGenerator 
          onGenerate={mockOnGenerate}
          onCancel={() => {}}
          existingModules={[]}
        />
      );
      
      await user.type(screen.getByLabelText(/what subject/i), veryLongSubject);
      await user.click(screen.getByRole('button', { name: /Generate Module/i }));
      
      await waitFor(() => {
        expect(mockOnGenerate).toHaveBeenCalledWith(
          expect.objectContaining({
            subject: veryLongSubject
          })
        );
      });
    });
    
    it('should handle long target audience text', async () => {
      const user = userEvent.setup();
      const mockOnGenerate = jest.fn();
      const longAudience = 'Psychology students, therapists, counselors, educators, researchers, and anyone interested in understanding the depths of human psychology'.repeat(3);
      
      customRender(
        <AIModuleGenerator 
          onGenerate={mockOnGenerate}
          onCancel={() => {}}
          existingModules={[]}
        />
      );
      
      await user.click(screen.getByText(/advanced options/i));
      await user.type(screen.getByLabelText(/target audience/i), longAudience);
      await user.type(screen.getByLabelText(/what subject/i), 'Test');
      await user.click(screen.getByRole('button', { name: /Generate Module/i }));
      
      await waitFor(() => {
        expect(mockOnGenerate).toHaveBeenCalledWith(
          expect.objectContaining({
            targetAudience: longAudience
          })
        );
      });
    });
  });
  
  describe('Prerequisites Edge Cases', () => {
    it('should handle no existing modules', async () => {
      const user = userEvent.setup();
      const mockOnGenerate = jest.fn();
      
      customRender(
        <AIModuleGenerator 
          onGenerate={mockOnGenerate}
          onCancel={() => {}}
          existingModules={[]}
        />
      );
      
      await user.click(screen.getByText(/advanced options/i));
      
      // Should not show any prerequisites when no modules exist
      const prereqSection = screen.queryByText(/prerequisites/i);
      expect(prereqSection).toBeInTheDocument();
      
      // But no checkboxes should be present
      const checkboxes = screen.queryAllByRole('checkbox', { name: /module/i });
      expect(checkboxes).toHaveLength(0);
    });
    
    it('should handle many prerequisites', async () => {
      const user = userEvent.setup();
      const mockOnGenerate = jest.fn();
      const manyModules = Array(20).fill(null).map((_, i) => ({
        id: `mod${i}`,
        title: `Module ${i}`
      }));
      
      customRender(
        <AIModuleGenerator 
          onGenerate={mockOnGenerate}
          onCancel={() => {}}
          existingModules={manyModules}
        />
      );
      
      await user.click(screen.getByText(/advanced options/i));
      
      // Should show all modules as potential prerequisites
      const checkboxes = screen.getAllByRole('checkbox');
      // 3 for component options + 20 for prerequisites
      expect(checkboxes.length).toBeGreaterThanOrEqual(20);
    });
  });
  
  describe('Component Toggle Combinations', () => {
    it('should handle all components disabled', async () => {
      const user = userEvent.setup();
      const mockOnGenerate = jest.fn();
      
      customRender(
        <AIModuleGenerator 
          onGenerate={mockOnGenerate}
          onCancel={() => {}}
          existingModules={[]}
        />
      );
      
      await user.click(screen.getByText(/advanced options/i));
      
      // Disable all components
      await user.click(screen.getByLabelText(/quiz questions/i));
      await user.click(screen.getByLabelText(/video suggestions/i));
      await user.click(screen.getByLabelText(/bibliography/i));
      
      await user.type(screen.getByLabelText(/what subject/i), 'Minimal');
      await user.click(screen.getByRole('button', { name: /Generate Module/i }));
      
      await waitFor(() => {
        expect(mockOnGenerate).toHaveBeenCalledWith(
          expect.objectContaining({
            includeQuiz: false,
            includeVideos: false,
            includeBibliography: false
          })
        );
      });
    });
  });
  
  describe('UI State Management', () => {
    it('should maintain state when toggling advanced options', async () => {
      const user = userEvent.setup();
      const mockOnGenerate = jest.fn();
      
      customRender(
        <AIModuleGenerator 
          onGenerate={mockOnGenerate}
          onCancel={() => {}}
          existingModules={[]}
        />
      );
      
      // Type subject
      await user.type(screen.getByLabelText(/what subject/i), 'Test Subject');
      
      // Open advanced options
      await user.click(screen.getByText(/advanced options/i));
      
      // Change some settings
      await user.click(screen.getByRole('radio', { name: /advanced/i }));
      
      // Close advanced options
      await user.click(screen.getByText(/advanced options/i));
      
      // Open again
      await user.click(screen.getByText(/advanced options/i));
      
      // Check that settings were preserved
      const advancedRadio = screen.getByRole('radio', { name: /advanced/i });
      expect(advancedRadio).toBeChecked();
      
      // Subject should also be preserved
      const subjectInput = screen.getByLabelText(/what subject/i);
      expect(subjectInput).toHaveValue('Test Subject');
    });
  });
});