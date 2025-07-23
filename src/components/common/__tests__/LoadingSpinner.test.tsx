import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner Component', () => {
  test('renders with default props', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('animate-spin', 'w-8', 'h-8', 'text-primary-600');
  });

  test('renders with small size', () => {
    render(<LoadingSpinner size="small" />);
    
    const spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toHaveClass('w-4', 'h-4');
    expect(spinner).not.toHaveClass('w-8', 'h-8');
  });

  test('renders with medium size', () => {
    render(<LoadingSpinner size="medium" />);
    
    const spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toHaveClass('w-8', 'h-8');
  });

  test('renders with large size', () => {
    render(<LoadingSpinner size="large" />);
    
    const spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toHaveClass('w-12', 'h-12');
    expect(spinner).not.toHaveClass('w-8', 'h-8');
  });

  test('renders with secondary color', () => {
    render(<LoadingSpinner color="secondary" />);
    
    const spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toHaveClass('text-gray-600');
    expect(spinner).not.toHaveClass('text-primary-600');
  });

  test('renders with white color', () => {
    render(<LoadingSpinner color="white" />);
    
    const spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toHaveClass('text-white');
    expect(spinner).not.toHaveClass('text-primary-600');
  });

  test('renders with custom className', () => {
    render(<LoadingSpinner className="custom-spinner-class" />);
    
    const spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toHaveClass('custom-spinner-class');
  });

  test('renders with loading text', () => {
    render(<LoadingSpinner text="Loading data..." />);
    
    const text = screen.getByTestId('loading-text');
    expect(text).toBeInTheDocument();
    expect(text).toHaveTextContent('Loading data...');
    expect(text).toHaveClass('text-sm', 'text-primary-600');
  });

  test('does not render text when not provided', () => {
    render(<LoadingSpinner />);
    
    expect(screen.queryByTestId('loading-text')).not.toBeInTheDocument();
  });

  test('renders in fullscreen mode', () => {
    render(<LoadingSpinner fullScreen />);
    
    const fullscreenContainer = screen.getByTestId('loading-spinner-fullscreen');
    expect(fullscreenContainer).toBeInTheDocument();
    expect(fullscreenContainer).toHaveClass('fixed', 'inset-0', 'z-50');
    
    const spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toBeInTheDocument();
  });

  test('renders normally when fullScreen is false', () => {
    render(<LoadingSpinner fullScreen={false} />);
    
    expect(screen.queryByTestId('loading-spinner-fullscreen')).not.toBeInTheDocument();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('combines all props correctly', () => {
    render(
      <LoadingSpinner
        size="large"
        color="secondary"
        className="extra-class"
        text="Processing..."
        fullScreen
      />
    );
    
    const fullscreenContainer = screen.getByTestId('loading-spinner-fullscreen');
    expect(fullscreenContainer).toBeInTheDocument();
    
    const spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toHaveClass('w-12', 'h-12', 'text-gray-600', 'extra-class');
    
    const text = screen.getByTestId('loading-text');
    expect(text).toHaveTextContent('Processing...');
    expect(text).toHaveClass('text-gray-600');
  });

  test('renders SVG with correct attributes', () => {
    const { container } = render(<LoadingSpinner />);
    
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
    expect(svg).toHaveAttribute('fill', 'none');
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    
    const circle = svg?.querySelector('circle');
    expect(circle).toHaveAttribute('cx', '12');
    expect(circle).toHaveAttribute('cy', '12');
    expect(circle).toHaveAttribute('r', '10');
    expect(circle).toHaveAttribute('stroke', 'currentColor');
    expect(circle).toHaveAttribute('stroke-width', '4');
    expect(circle).toHaveClass('opacity-25');
    
    const path = svg?.querySelector('path');
    expect(path).toHaveAttribute('fill', 'currentColor');
    expect(path).toHaveClass('opacity-75');
  });

  test('handles invalid color prop gracefully', () => {
    render(<LoadingSpinner color="invalid-color" as any />);
    
    const spinner = screen.getByTestId('loading-spinner');
    // Should fall back to primary color
    expect(spinner).toHaveClass('text-primary-600');
  });

  test('text inherits color from spinner', () => {
    render(<LoadingSpinner color="white" text="Loading..." />);
    
    const text = screen.getByTestId('loading-text');
    expect(text).toHaveClass('text-white');
  });
});