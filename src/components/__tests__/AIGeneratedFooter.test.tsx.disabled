import React from 'react';
import { render, screen } from '@testing-library/react';
import AIGeneratedFooter from '../AIGeneratedFooter';

describe('AIGeneratedFooter', () => {
  it('should render with default text', () => {
    render(<AIGeneratedFooter />);
    
    expect(screen.getByText('Gerado por IA')).toBeInTheDocument();
  });

  it('should render sparkles icon', () => {
    const { container } = render(<AIGeneratedFooter />);
    
    const sparklesIcon = container.querySelector('svg');
    expect(sparklesIcon).toBeInTheDocument();
    expect(sparklesIcon).toHaveClass('w-4', 'h-4');
  });

  it('should apply custom className', () => {
    const customClass = 'custom-footer-class';
    const { container } = render(<AIGeneratedFooter className={customClass} />);
    
    const footerDiv = container.firstChild as HTMLElement;
    expect(footerDiv).toHaveClass(customClass);
  });

  it('should have default styling classes', () => {
    const { container } = render(<AIGeneratedFooter />);
    
    const footerDiv = container.firstChild as HTMLElement;
    expect(footerDiv).toHaveClass('flex', 'items-center', 'justify-center', 'space-x-2');
    expect(footerDiv).toHaveClass('text-sm', 'text-gray-500');
    expect(footerDiv).toHaveClass('mt-8', 'pt-4', 'border-t', 'border-gray-200');
  });

  it('should maintain proper structure', () => {
    const { container } = render(<AIGeneratedFooter />);
    
    const footerDiv = container.firstChild as HTMLElement;
    expect(footerDiv.children).toHaveLength(2);
    
    // First child should be the icon
    const icon = footerDiv.children[0];
    expect(icon.tagName.toLowerCase()).toBe('svg');
    
    // Second child should be the span with text
    const textSpan = footerDiv.children[1];
    expect(textSpan.tagName.toLowerCase()).toBe('span');
    expect(textSpan.textContent).toBe('Gerado por IA');
  });
});