import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../../components/common/LoadingSpinner';

describe('LoadingSpinner Component', () => {
  describe('Basic Rendering', () => {
    it('renders loading spinner with default props', () => {
      render(<LoadingSpinner />);
      
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('renders spinner with SVG element', () => {
      render(<LoadingSpinner />);
      
      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toBeInstanceOf(SVGSVGElement);
      expect(spinner).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
      expect(spinner).toHaveAttribute('fill', 'none');
      expect(spinner).toHaveAttribute('viewBox', '0 0 24 24');
    });

    it('has spinning animation class', () => {
      render(<LoadingSpinner />);
      
      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toHaveClass('animate-spin');
    });
  });

  describe('Size Variants', () => {
    it('applies small size classes correctly', () => {
      render(<LoadingSpinner size="small" />);
      
      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toHaveClass('w-4', 'h-4');
    });

    it('applies medium size classes correctly (default)', () => {
      render(<LoadingSpinner size="medium" />);
      
      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toHaveClass('w-8', 'h-8');
    });

    it('uses medium size by default', () => {
      render(<LoadingSpinner />);
      
      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toHaveClass('w-8', 'h-8');
    });

    it('applies large size classes correctly', () => {
      render(<LoadingSpinner size="large" />);
      
      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toHaveClass('w-12', 'h-12');
    });
  });

  describe('Color Variants', () => {
    it('applies primary color classes correctly (default)', () => {
      render(<LoadingSpinner color="primary" />);
      
      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toHaveClass('text-primary-600');
    });

    it('uses primary color by default', () => {
      render(<LoadingSpinner />);
      
      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toHaveClass('text-primary-600');
    });

    it('applies secondary color classes correctly', () => {
      render(<LoadingSpinner color="secondary" />);
      
      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toHaveClass('text-gray-600');
    });

    it('applies white color classes correctly', () => {
      render(<LoadingSpinner color="white" />);
      
      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toHaveClass('text-white');
    });

    it('falls back to primary color for invalid color', () => {
      render(<LoadingSpinner color={"invalid-color" as any} />);
      
      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toHaveClass('text-primary-600');
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      render(<LoadingSpinner className="custom-class" />);
      
      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toHaveClass('custom-class');
    });

    it('combines custom className with default classes', () => {
      render(<LoadingSpinner className="custom-class" size="large" color="white" />);
      
      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toHaveClass('animate-spin', 'w-12', 'h-12', 'text-white', 'custom-class');
    });

    it('handles empty className', () => {
      render(<LoadingSpinner className="" />);
      
      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toHaveClass('animate-spin', 'w-8', 'h-8', 'text-primary-600');
    });
  });

  describe('Text Display', () => {
    it('does not show text by default', () => {
      render(<LoadingSpinner />);
      
      expect(screen.queryByTestId('loading-text')).not.toBeInTheDocument();
    });

    it('displays custom text when provided', () => {
      render(<LoadingSpinner text="Loading data..." />);
      
      expect(screen.getByTestId('loading-text')).toBeInTheDocument();
      expect(screen.getByText('Loading data...')).toBeInTheDocument();
    });

    it('applies correct color to text', () => {
      render(<LoadingSpinner text="Loading..." color="secondary" />);
      
      const textElement = screen.getByTestId('loading-text');
      expect(textElement).toHaveClass('text-gray-600');
    });

    it('applies text styling classes', () => {
      render(<LoadingSpinner text="Loading..." />);
      
      const textElement = screen.getByTestId('loading-text');
      expect(textElement).toHaveClass('text-sm', 'text-primary-600');
    });

    it('handles empty text string', () => {
      render(<LoadingSpinner text="" />);
      
      expect(screen.queryByTestId('loading-text')).not.toBeInTheDocument();
    });

    it('handles whitespace-only text', () => {
      render(<LoadingSpinner text="   " />);
      
      const textElement = screen.getByTestId('loading-text');
      expect(textElement).toBeInTheDocument();
      expect(textElement.textContent).toBe('   ');
    });
  });

  describe('Layout Structure', () => {
    it('renders content in flex container', () => {
      render(<LoadingSpinner />);
      
      const spinner = screen.getByTestId('loading-spinner');
      const container = spinner.closest('div');
      expect(container).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center', 'gap-3');
    });

    it('maintains flex structure with text', () => {
      render(<LoadingSpinner text="Loading..." />);
      
      const container = screen.getByTestId('loading-spinner').closest('div');
      expect(container).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center', 'gap-3');
    });
  });

  describe('Full Screen Mode', () => {
    it('does not render full screen by default', () => {
      render(<LoadingSpinner />);
      
      expect(screen.queryByTestId('loading-spinner-fullscreen')).not.toBeInTheDocument();
    });

    it('renders full screen overlay when fullScreen is true', () => {
      render(<LoadingSpinner fullScreen />);
      
      expect(screen.getByTestId('loading-spinner-fullscreen')).toBeInTheDocument();
    });

    it('applies correct full screen styling', () => {
      render(<LoadingSpinner fullScreen />);
      
      const fullScreenContainer = screen.getByTestId('loading-spinner-fullscreen');
      expect(fullScreenContainer).toHaveClass(
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

    it('renders spinner and text within full screen container', () => {
      render(<LoadingSpinner fullScreen text="Loading full screen..." />);
      
      const fullScreenContainer = screen.getByTestId('loading-spinner-fullscreen');
      expect(fullScreenContainer).toContainElement(screen.getByTestId('loading-spinner'));
      expect(fullScreenContainer).toContainElement(screen.getByTestId('loading-text'));
    });
  });

  describe('Accessibility', () => {
    it('has proper SVG structure for screen readers', () => {
      render(<LoadingSpinner />);
      
      const spinner = screen.getByTestId('loading-spinner');
      const circle = spinner.querySelector('circle');
      const path = spinner.querySelector('path');
      
      expect(circle).toBeInTheDocument();
      expect(path).toBeInTheDocument();
      
      expect(circle).toHaveAttribute('cx', '12');
      expect(circle).toHaveAttribute('cy', '12');
      expect(circle).toHaveAttribute('r', '10');
      expect(circle).toHaveAttribute('stroke', 'currentColor');
      expect(circle).toHaveAttribute('stroke-width', '4');
    });

    it('maintains proper contrast with opacity classes', () => {
      render(<LoadingSpinner />);
      
      const spinner = screen.getByTestId('loading-spinner');
      const circle = spinner.querySelector('circle');
      const path = spinner.querySelector('path');
      
      expect(circle).toHaveClass('opacity-25');
      expect(path).toHaveClass('opacity-75');
    });
  });

  describe('SVG Path Data', () => {
    it('has correct path data for loading animation', () => {
      render(<LoadingSpinner />);
      
      const spinner = screen.getByTestId('loading-spinner');
      const path = spinner.querySelector('path');
      
      expect(path).toHaveAttribute('fill', 'currentColor');
      expect(path).toHaveAttribute('d', 'M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z');
    });
  });

  describe('Complex Combinations', () => {
    it('handles all props together correctly', () => {
      render(
        <LoadingSpinner
          size="large"
          color="white"
          className="custom-spinner"
          text="Processing request..."
          fullScreen
        />
      );
      
      const fullScreenContainer = screen.getByTestId('loading-spinner-fullscreen');
      const spinner = screen.getByTestId('loading-spinner');
      const text = screen.getByTestId('loading-text');
      
      expect(fullScreenContainer).toBeInTheDocument();
      expect(spinner).toHaveClass('w-12', 'h-12', 'text-white', 'custom-spinner');
      expect(text).toHaveClass('text-white');
      expect(text).toHaveTextContent('Processing request...');
    });

    it('works with minimal props', () => {
      render(<LoadingSpinner size="small" />);
      
      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toHaveClass('w-4', 'h-4', 'text-primary-600');
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined props gracefully', () => {
      render(<LoadingSpinner size={undefined} color={undefined} className={undefined} text={undefined} />);
      
      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toHaveClass('animate-spin', 'w-8', 'h-8', 'text-primary-600');
    });

    it('handles null text', () => {
      render(<LoadingSpinner text={null as any} />);
      
      expect(screen.queryByTestId('loading-text')).not.toBeInTheDocument();
    });

    it('handles boolean fullScreen correctly', () => {
      const { rerender } = render(<LoadingSpinner fullScreen={false} />);
      
      expect(screen.queryByTestId('loading-spinner-fullscreen')).not.toBeInTheDocument();
      
      rerender(<LoadingSpinner fullScreen={true} />);
      
      expect(screen.getByTestId('loading-spinner-fullscreen')).toBeInTheDocument();
    });
  });
});