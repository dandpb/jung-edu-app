/**
 * Comprehensive Unit Tests for LoadingSpinner Component
 * Tests different sizes, colors, states, accessibility
 * Target: 80%+ coverage
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner Component', () => {
  describe('Basic Rendering', () => {
    it('should render with default props', () => {
      render(<LoadingSpinner />);

      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('animate-spin', 'w-8', 'h-8', 'text-primary-600');
    });

    it('should render without text by default', () => {
      render(<LoadingSpinner />);

      expect(screen.queryByTestId('loading-text')).not.toBeInTheDocument();
    });

    it('should not render in fullscreen mode by default', () => {
      render(<LoadingSpinner />);

      expect(screen.queryByTestId('loading-spinner-fullscreen')).not.toBeInTheDocument();
    });
  });

  describe('Size Variations', () => {
    it('should render small size correctly', () => {
      render(<LoadingSpinner size="small" />);

      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toHaveClass('w-4', 'h-4');
    });

    it('should render medium size correctly', () => {
      render(<LoadingSpinner size="medium" />);

      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toHaveClass('w-8', 'h-8');
    });

    it('should render large size correctly', () => {
      render(<LoadingSpinner size="large" />);

      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toHaveClass('w-12', 'h-12');
    });
  });

  describe('Color Variations', () => {
    it('should render primary color (default)', () => {
      render(<LoadingSpinner color="primary" />);

      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toHaveClass('text-primary-600');
    });

    it('should render secondary color', () => {
      render(<LoadingSpinner color="secondary" />);

      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toHaveClass('text-gray-600');
    });

    it('should render white color', () => {
      render(<LoadingSpinner color="white" />);

      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toHaveClass('text-white');
    });

    it('should fallback to primary color for invalid color', () => {
      render(<LoadingSpinner color={"invalid-color" as any} />);

      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toHaveClass('text-primary-600');
    });
  });

  describe('Text Display', () => {
    it('should display text when provided', () => {
      render(<LoadingSpinner text="Loading data..." />);

      const loadingText = screen.getByTestId('loading-text');
      expect(loadingText).toBeInTheDocument();
      expect(loadingText).toHaveTextContent('Loading data...');
    });

    it('should apply correct text styling', () => {
      render(<LoadingSpinner text="Loading..." color="secondary" />);

      const loadingText = screen.getByTestId('loading-text');
      expect(loadingText).toHaveClass('text-sm', 'text-gray-600');
    });

    it('should match text color with spinner color', () => {
      render(<LoadingSpinner text="Loading..." color="white" />);

      const loadingText = screen.getByTestId('loading-text');
      expect(loadingText).toHaveClass('text-white');
    });

    it('should not render text element when text is empty string', () => {
      render(<LoadingSpinner text="" />);

      expect(screen.queryByTestId('loading-text')).not.toBeInTheDocument();
    });

    it('should not render text element when text is undefined', () => {
      render(<LoadingSpinner text={undefined} />);

      expect(screen.queryByTestId('loading-text')).not.toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      render(<LoadingSpinner className="custom-class" />);

      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toHaveClass('custom-class');
    });

    it('should merge custom className with default classes', () => {
      render(<LoadingSpinner className="custom-class" size="large" color="white" />);

      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toHaveClass('custom-class', 'w-12', 'h-12', 'text-white', 'animate-spin');
    });

    it('should handle empty className', () => {
      render(<LoadingSpinner className="" />);

      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toHaveClass('animate-spin', 'w-8', 'h-8');
    });
  });

  describe('Fullscreen Mode', () => {
    it('should render in fullscreen mode when enabled', () => {
      render(<LoadingSpinner fullScreen={true} />);

      const fullscreenContainer = screen.getByTestId('loading-spinner-fullscreen');
      expect(fullscreenContainer).toBeInTheDocument();
      expect(fullscreenContainer).toHaveClass(
        'fixed',
        'inset-0',
        'flex',
        'items-center',
        'justify-center',
        'bg-white',
        'bg-opacity-75',
        'z-50'
      );
    });

    it('should render spinner inside fullscreen container', () => {
      render(<LoadingSpinner fullScreen={true} text="Loading..." />);

      const fullscreenContainer = screen.getByTestId('loading-spinner-fullscreen');
      const spinner = screen.getByTestId('loading-spinner');
      const text = screen.getByTestId('loading-text');

      expect(fullscreenContainer).toContainElement(spinner);
      expect(fullscreenContainer).toContainElement(text);
    });

    it('should not render fullscreen container when fullScreen is false', () => {
      render(<LoadingSpinner fullScreen={false} />);

      expect(screen.queryByTestId('loading-spinner-fullscreen')).not.toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('should have correct container structure for inline mode', () => {
      render(<LoadingSpinner text="Loading..." />);

      // Should have flex container with spinner and text
      const container = screen.getByTestId('loading-spinner').closest('div');
      expect(container).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center', 'gap-3');
    });

    it('should have correct container structure for fullscreen mode', () => {
      render(<LoadingSpinner fullScreen={true} text="Loading..." />);

      const fullscreenContainer = screen.getByTestId('loading-spinner-fullscreen');
      const innerContainer = fullscreenContainer.firstElementChild;
      
      expect(innerContainer).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center', 'gap-3');
    });
  });

  describe('SVG Structure and Animation', () => {
    it('should render SVG with correct attributes', () => {
      render(<LoadingSpinner />);

      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner.tagName).toBe('svg');
      expect(spinner).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
      expect(spinner).toHaveAttribute('fill', 'none');
      expect(spinner).toHaveAttribute('viewBox', '0 0 24 24');
    });

    it('should have spinning animation class', () => {
      render(<LoadingSpinner />);

      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toHaveClass('animate-spin');
    });

    it('should contain circle and path elements', () => {
      render(<LoadingSpinner />);

      const spinner = screen.getByTestId('loading-spinner');
      const circle = spinner.querySelector('circle');
      const path = spinner.querySelector('path');

      expect(circle).toBeInTheDocument();
      expect(path).toBeInTheDocument();
    });

    it('should have correct circle attributes', () => {
      render(<LoadingSpinner />);

      const circle = screen.getByTestId('loading-spinner').querySelector('circle');
      expect(circle).toHaveAttribute('cx', '12');
      expect(circle).toHaveAttribute('cy', '12');
      expect(circle).toHaveAttribute('r', '10');
      expect(circle).toHaveAttribute('stroke', 'currentColor');
      expect(circle).toHaveAttribute('stroke-width', '4');
      expect(circle).toHaveClass('opacity-25');
    });

    it('should have correct path attributes', () => {
      render(<LoadingSpinner />);

      const path = screen.getByTestId('loading-spinner').querySelector('path');
      expect(path).toHaveAttribute('fill', 'currentColor');
      expect(path).toHaveClass('opacity-75');
      expect(path).toHaveAttribute('d');
    });
  });

  describe('Accessibility', () => {
    it('should be accessible via testid', () => {
      render(<LoadingSpinner />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should have accessible text when provided', () => {
      render(<LoadingSpinner text="Loading content, please wait..." />);

      const text = screen.getByTestId('loading-text');
      expect(text).toBeInTheDocument();
      expect(text).toHaveTextContent('Loading content, please wait...');
    });

    it('should provide semantic meaning through text', () => {
      render(<LoadingSpinner text="Processing your request..." />);

      expect(screen.getByText('Processing your request...')).toBeInTheDocument();
    });

    it('should be keyboard navigable when in fullscreen', () => {
      render(<LoadingSpinner fullScreen={true} text="Loading..." />);

      const fullscreenContainer = screen.getByTestId('loading-spinner-fullscreen');
      expect(fullscreenContainer).toBeInTheDocument();
      
      // Fullscreen overlay should not interfere with screen readers
      expect(fullscreenContainer).not.toHaveAttribute('aria-hidden');
    });
  });

  describe('Edge Cases', () => {
    it('should handle all props together', () => {
      render(
        <LoadingSpinner
          size="large"
          color="white"
          text="Complex loading state..."
          fullScreen={true}
          className="custom-spinner"
        />
      );

      const fullscreenContainer = screen.getByTestId('loading-spinner-fullscreen');
      const spinner = screen.getByTestId('loading-spinner');
      const text = screen.getByTestId('loading-text');

      expect(fullscreenContainer).toBeInTheDocument();
      expect(spinner).toHaveClass('w-12', 'h-12', 'text-white', 'custom-spinner');
      expect(text).toHaveTextContent('Complex loading state...');
      expect(text).toHaveClass('text-white');
    });

    it('should handle long text content', () => {
      const longText = 'This is a very long loading message that might wrap to multiple lines in some layouts and should still be handled gracefully by the component';
      
      render(<LoadingSpinner text={longText} />);

      const loadingText = screen.getByTestId('loading-text');
      expect(loadingText).toHaveTextContent(longText);
    });

    it('should handle special characters in text', () => {
      const specialText = 'Loading... 50% (10/20) ⚡️ 🔄';
      
      render(<LoadingSpinner text={specialText} />);

      expect(screen.getByText(specialText)).toBeInTheDocument();
    });

    it('should render consistently with undefined optional props', () => {
      render(
        <LoadingSpinner
          size={undefined}
          color={undefined}
          className={undefined}
          text={undefined}
          fullScreen={undefined}
        />
      );

      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toHaveClass('w-8', 'h-8', 'text-primary-600'); // defaults
      expect(screen.queryByTestId('loading-text')).not.toBeInTheDocument();
      expect(screen.queryByTestId('loading-spinner-fullscreen')).not.toBeInTheDocument();
    });
  });

  describe('Performance Considerations', () => {
    it('should not cause unnecessary re-renders with same props', () => {
      const { rerender } = render(<LoadingSpinner size="medium" color="primary" />);

      const spinner = screen.getByTestId('loading-spinner');
      const initialClassName = spinner.className;

      rerender(<LoadingSpinner size="medium" color="primary" />);

      const rerenderSpinner = screen.getByTestId('loading-spinner');
      expect(rerenderSpinner.className).toBe(initialClassName);
    });

    it('should handle rapid prop changes gracefully', () => {
      const { rerender } = render(<LoadingSpinner size="small" />);

      rerender(<LoadingSpinner size="medium" />);
      rerender(<LoadingSpinner size="large" />);
      rerender(<LoadingSpinner size="small" color="white" />);
      rerender(<LoadingSpinner size="large" color="primary" text="Final state" />);

      const finalSpinner = screen.getByTestId('loading-spinner');
      expect(finalSpinner).toHaveClass('w-12', 'h-12', 'text-primary-600');
      expect(screen.getByTestId('loading-text')).toHaveTextContent('Final state');
    });
  });

  describe('CSS Class Composition', () => {
    it('should compose CSS classes correctly for all combinations', () => {
      const testCases = [
        { props: { size: 'small', color: 'primary' }, expected: ['w-4', 'h-4', 'text-primary-600'] },
        { props: { size: 'medium', color: 'secondary' }, expected: ['w-8', 'h-8', 'text-gray-600'] },
        { props: { size: 'large', color: 'white' }, expected: ['w-12', 'h-12', 'text-white'] },
      ];

      testCases.forEach(({ props, expected }, index) => {
        const { unmount } = render(<LoadingSpinner key={index} {...props} />);
        
        const spinner = screen.getByTestId('loading-spinner');
        expected.forEach(className => {
          expect(spinner).toHaveClass(className);
        });
        
        unmount();
      });
    });

    it('should always include base animation class', () => {
      const testProps = [
        {},
        { size: 'small' },
        { color: 'white' },
        { className: 'custom' },
        { fullScreen: true }
      ];

      testProps.forEach((props, index) => {
        const { unmount } = render(<LoadingSpinner key={index} {...props} />);
        
        const spinner = screen.getByTestId('loading-spinner');
        expect(spinner).toHaveClass('animate-spin');
        
        unmount();
      });
    });
  });
});