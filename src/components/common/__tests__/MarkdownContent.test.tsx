import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MarkdownContent from '../MarkdownContent';

// Mock react-markdown
jest.mock('react-markdown', () => {
  const MockReactMarkdown = ({ children }: { children: string }) => {
    return require('react').createElement('div', null, children);
  };
  return MockReactMarkdown;
});

jest.mock('remark-gfm', () => jest.fn());

describe('MarkdownContent Component', () => {
  test('renders content with default prose styling', () => {
    const { container } = render(<MarkdownContent content="Test content" />);
    const wrapper = container.firstChild as HTMLElement;
    
    expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
    expect(screen.getByText('Test content')).toBeInTheDocument();
    expect(wrapper).toHaveClass('prose', 'prose-lg', 'max-w-none');
  });

  test('applies custom className and prose settings', () => {
    const { container } = render(
      <MarkdownContent content="Test" className="custom-class" prose={false} />
    );
    const wrapper = container.firstChild as HTMLElement;
    
    expect(wrapper).not.toHaveClass('prose');
    expect(wrapper).toHaveClass('custom-class');
  });

  test('handles empty and edge case content', () => {
    const { container: container1 } = render(<MarkdownContent content="" />);
    expect(container1.querySelector('[data-testid="markdown-content"]')).toBeInTheDocument();
    
    const { container: container2 } = render(<MarkdownContent content="   \n\n   " />);
    expect(container2.querySelector('[data-testid="markdown-content"]')).toBeInTheDocument();
  });
});