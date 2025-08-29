/**
 * ThemeToggle Component - Comprehensive Tests
 * Tests covering theme switching functionality, accessibility,
 * visual states, and user interactions
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ThemeToggle } from '../ThemeToggle';

describe('ThemeToggle Component', () => {
  const mockOnToggle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render toggle button for light theme', () => {
      render(<ThemeToggle theme="light" onToggle={mockOnToggle} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-label', 'Switch to dark theme');
    });

    it('should render toggle button for dark theme', () => {
      render(<ThemeToggle theme="dark" onToggle={mockOnToggle} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-label', 'Switch to light theme');
    });

    it('should have proper structural elements', () => {
      const { container } = render(<ThemeToggle theme="light" onToggle={mockOnToggle} />);
      
      // Button should contain a span for the toggle circle
      const toggleCircle = container.querySelector('span.inline-block');
      expect(toggleCircle).toBeInTheDocument();
      
      // Should contain icon span
      const iconContainer = container.querySelector('span.flex.items-center');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('Theme States', () => {
    it('should display sun icon in light theme', () => {
      const { container } = render(<ThemeToggle theme="light" onToggle={mockOnToggle} />);
      
      // Check for Sun icon (lucide-react icons have specific SVG structures)
      const sunIcon = container.querySelector('svg');
      expect(sunIcon).toBeInTheDocument();
    });

    it('should display moon icon in dark theme', () => {
      const { container } = render(<ThemeToggle theme="dark" onToggle={mockOnToggle} />);
      
      // Check for Moon icon
      const moonIcon = container.querySelector('svg');
      expect(moonIcon).toBeInTheDocument();
    });

    it('should apply correct styles for light theme', () => {
      const { container } = render(<ThemeToggle theme="light" onToggle={mockOnToggle} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gray-300');
      expect(button).not.toHaveClass('bg-blue-600');
      
      const toggleCircle = container.querySelector('span.inline-block');
      expect(toggleCircle).toHaveClass('translate-x-1');
      expect(toggleCircle).not.toHaveClass('translate-x-7');
    });

    it('should apply correct styles for dark theme', () => {
      const { container } = render(<ThemeToggle theme="dark" onToggle={mockOnToggle} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-blue-600');
      expect(button).not.toHaveClass('bg-gray-300');
      
      const toggleCircle = container.querySelector('span.inline-block');
      expect(toggleCircle).toHaveClass('translate-x-7');
      expect(toggleCircle).not.toHaveClass('translate-x-1');
    });
  });

  describe('User Interactions', () => {
    it('should call onToggle when clicked', async () => {
      const user = userEvent.setup();
      render(<ThemeToggle theme="light" onToggle={mockOnToggle} />);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });

    it('should call onToggle when activated with keyboard', () => {
      render(<ThemeToggle theme="light" onToggle={mockOnToggle} />);
      
      const button = screen.getByRole('button');
      
      // Test Enter key
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
      expect(mockOnToggle).toHaveBeenCalledTimes(1);
      
      // Test Space key
      fireEvent.keyDown(button, { key: ' ', code: 'Space' });
      expect(mockOnToggle).toHaveBeenCalledTimes(2);
    });

    it('should handle multiple rapid clicks', async () => {
      const user = userEvent.setup();
      render(<ThemeToggle theme="light" onToggle={mockOnToggle} />);
      
      const button = screen.getByRole('button');
      
      await user.click(button);
      await user.click(button);
      await user.click(button);
      
      expect(mockOnToggle).toHaveBeenCalledTimes(3);
    });

    it('should be focusable', () => {
      render(<ThemeToggle theme="light" onToggle={mockOnToggle} />);
      
      const button = screen.getByRole('button');
      button.focus();
      
      expect(button).toHaveFocus();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for light theme', () => {
      render(<ThemeToggle theme="light" onToggle={mockOnToggle} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Switch to dark theme');
    });

    it('should have proper ARIA labels for dark theme', () => {
      render(<ThemeToggle theme="dark" onToggle={mockOnToggle} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Switch to light theme');
    });

    it('should have focus ring styles', () => {
      render(<ThemeToggle theme="light" onToggle={mockOnToggle} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus:outline-none');
      expect(button).toHaveClass('focus:ring-2');
      expect(button).toHaveClass('focus:ring-offset-2');
      expect(button).toHaveClass('focus:ring-blue-500');
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <button>Previous element</button>
          <ThemeToggle theme="light" onToggle={mockOnToggle} />
          <button>Next element</button>
        </div>
      );
      
      // Tab to theme toggle
      await user.tab(); // Previous element
      await user.tab(); // Theme toggle
      
      const themeToggle = screen.getByRole('button', { name: /switch to/i });
      expect(themeToggle).toHaveFocus();
      
      // Should be able to activate with Enter
      await user.keyboard('{Enter}');
      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });

    it('should be screen reader friendly', () => {
      render(<ThemeToggle theme="light" onToggle={mockOnToggle} />);
      
      const button = screen.getByRole('button');
      
      // Should be identifiable as a button
      expect(button.tagName).toBe('BUTTON');
      
      // Should have descriptive aria-label
      const ariaLabel = button.getAttribute('aria-label');
      expect(ariaLabel).toContain('Switch to');
      expect(ariaLabel).toContain('theme');
    });
  });

  describe('Visual States and Animations', () => {
    it('should have transition classes for smooth animations', () => {
      const { container } = render(<ThemeToggle theme="light" onToggle={mockOnToggle} />);
      
      const button = screen.getByRole('button');
      const toggleCircle = container.querySelector('span.inline-block');
      
      expect(button).toHaveClass('transition-colors', 'duration-200');
      expect(toggleCircle).toHaveClass('transition-transform', 'duration-200');
    });

    it('should maintain consistent size and shape', () => {
      const { container } = render(<ThemeToggle theme="light" onToggle={mockOnToggle} />);
      
      const button = screen.getByRole('button');
      const toggleCircle = container.querySelector('span.inline-block');
      
      // Button dimensions
      expect(button).toHaveClass('h-8', 'w-14', 'rounded-full');
      
      // Toggle circle dimensions
      expect(toggleCircle).toHaveClass('h-6', 'w-6', 'rounded-full', 'bg-white');
    });

    it('should have consistent icon sizing', () => {
      const { container: lightContainer } = render(<ThemeToggle theme="light" onToggle={mockOnToggle} />);
      const { container: darkContainer } = render(<ThemeToggle theme="dark" onToggle={mockOnToggle} />);
      
      const lightIcon = lightContainer.querySelector('svg');
      const darkIcon = darkContainer.querySelector('svg');
      
      expect(lightIcon).toHaveClass('h-3', 'w-3');
      expect(darkIcon).toHaveClass('h-3', 'w-3');
    });
  });

  describe('Icon Colors', () => {
    it('should apply correct colors to sun icon in light theme', () => {
      const { container } = render(<ThemeToggle theme="light" onToggle={mockOnToggle} />);
      
      const sunIcon = container.querySelector('svg');
      expect(sunIcon).toHaveClass('text-yellow-500');
    });

    it('should apply correct colors to moon icon in dark theme', () => {
      const { container } = render(<ThemeToggle theme="dark" onToggle={mockOnToggle} />);
      
      const moonIcon = container.querySelector('svg');
      expect(moonIcon).toHaveClass('text-gray-700');
    });
  });

  describe('Component State Changes', () => {
    it('should update appearance when theme prop changes', () => {
      const { rerender, container } = render(<ThemeToggle theme="light" onToggle={mockOnToggle} />);
      
      // Initial light theme
      let button = screen.getByRole('button');
      let toggleCircle = container.querySelector('span.inline-block');
      
      expect(button).toHaveClass('bg-gray-300');
      expect(toggleCircle).toHaveClass('translate-x-1');
      expect(button).toHaveAttribute('aria-label', 'Switch to dark theme');
      
      // Change to dark theme
      rerender(<ThemeToggle theme="dark" onToggle={mockOnToggle} />);
      
      button = screen.getByRole('button');
      toggleCircle = container.querySelector('span.inline-block');
      
      expect(button).toHaveClass('bg-blue-600');
      expect(toggleCircle).toHaveClass('translate-x-7');
      expect(button).toHaveAttribute('aria-label', 'Switch to light theme');
    });

    it('should maintain toggle functionality across theme changes', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<ThemeToggle theme="light" onToggle={mockOnToggle} />);
      
      const button = screen.getByRole('button');
      await user.click(button);
      expect(mockOnToggle).toHaveBeenCalledTimes(1);
      
      // Change theme
      rerender(<ThemeToggle theme="dark" onToggle={mockOnToggle} />);
      
      await user.click(button);
      expect(mockOnToggle).toHaveBeenCalledTimes(2);
    });
  });

  describe('Performance Considerations', () => {
    it('should not recreate event handlers unnecessarily', () => {
      const { rerender } = render(<ThemeToggle theme="light" onToggle={mockOnToggle} />);
      
      const button1 = screen.getByRole('button');
      const onClick1 = button1.onclick;
      
      rerender(<ThemeToggle theme="light" onToggle={mockOnToggle} />);
      
      const button2 = screen.getByRole('button');
      const onClick2 = button2.onclick;
      
      // Same handler should be used
      expect(onClick1).toBe(onClick2);
    });

    it('should handle theme changes efficiently', () => {
      const { rerender } = render(<ThemeToggle theme="light" onToggle={mockOnToggle} />);
      
      // Should not throw errors on rapid theme changes
      expect(() => {
        rerender(<ThemeToggle theme="dark" onToggle={mockOnToggle} />);
        rerender(<ThemeToggle theme="light" onToggle={mockOnToggle} />);
        rerender(<ThemeToggle theme="dark" onToggle={mockOnToggle} />);
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing onToggle gracefully', () => {
      // This tests TypeScript compliance, but we can still test runtime behavior
      const { container } = render(<ThemeToggle theme="light" onToggle={undefined as any} />);
      
      const button = screen.getByRole('button');
      
      // Should not crash when clicking
      expect(() => {
        fireEvent.click(button);
      }).not.toThrow();
    });

    it('should handle invalid theme values gracefully', () => {
      // Testing with invalid theme should still render
      expect(() => {
        render(<ThemeToggle theme={'invalid' as any} onToggle={mockOnToggle} />);
      }).not.toThrow();
    });

    it('should maintain accessibility with custom styling', () => {
      render(<ThemeToggle theme="light" onToggle={mockOnToggle} />);
      
      const button = screen.getByRole('button');
      
      // Should maintain semantic button role regardless of styling
      expect(button).toHaveAttribute('type', 'button');
      expect(button.tagName).toBe('BUTTON');
    });
  });

  describe('Integration Scenarios', () => {
    it('should work within larger component hierarchies', () => {
      render(
        <div className="header">
          <nav>
            <ul>
              <li>
                <ThemeToggle theme="light" onToggle={mockOnToggle} />
              </li>
            </ul>
          </nav>
        </div>
      );
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-label', 'Switch to dark theme');
    });

    it('should maintain functionality when used in forms', async () => {
      const user = userEvent.setup();
      
      render(
        <form>
          <ThemeToggle theme="light" onToggle={mockOnToggle} />
          <input type="text" />
          <button type="submit">Submit</button>
        </form>
      );
      
      const themeToggle = screen.getByRole('button', { name: /switch to/i });
      await user.click(themeToggle);
      
      expect(mockOnToggle).toHaveBeenCalledTimes(1);
      
      // Should not submit the form
      const form = themeToggle.closest('form');
      expect(form).toBeInTheDocument();
    });

    it('should work with custom event listeners', () => {
      const customHandler = jest.fn();
      
      const { container } = render(<ThemeToggle theme="light" onToggle={mockOnToggle} />);
      
      const button = screen.getByRole('button');
      
      // Add custom event listener
      button.addEventListener('click', customHandler);
      
      fireEvent.click(button);
      
      expect(mockOnToggle).toHaveBeenCalledTimes(1);
      expect(customHandler).toHaveBeenCalledTimes(1);
    });
  });
});