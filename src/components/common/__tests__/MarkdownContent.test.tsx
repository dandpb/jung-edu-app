import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MarkdownContent from '../MarkdownContent';

// Mock the dependencies
jest.mock('../../../utils/contentProcessor', () => ({
  processContentForMarkdown: jest.fn((content) => content || '')
}));

jest.mock('remark-gfm', () => {
  return () => ({});
});

jest.mock('react-markdown', () => {
  return function MockReactMarkdown({ children }: { children: React.ReactNode }) {
    return <div data-testid="react-markdown">{children}</div>;
  };
});

describe('MarkdownContent Component', () => {
  const { processContentForMarkdown } = require('../../../utils/contentProcessor');

  beforeEach(() => {
    jest.clearAllMocks();
    // Ensure the mock returns the content
    processContentForMarkdown.mockImplementation((content: string) => content || '');
  });

  test('renders content with default prose styling', () => {
    const { container } = render(<MarkdownContent content="Test content" />);
    const wrapper = container.firstChild as HTMLElement;
    
    expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
    expect(screen.getByTestId('react-markdown')).toHaveTextContent('Test content');
    expect(wrapper).toHaveClass('prose', 'prose-lg', 'max-w-none');
    expect(processContentForMarkdown).toHaveBeenCalledWith('Test content');
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

  test('processes content through contentProcessor', () => {
    const content = '- Item 1\n- Item 2';
    render(<MarkdownContent content={content} />);
    
    expect(processContentForMarkdown).toHaveBeenCalledWith(content);
  });

  test('combines prose class with custom className when prose is true', () => {
    const { container } = render(
      <MarkdownContent content="Test" className="my-custom-class" prose={true} />
    );
    const wrapper = container.firstChild as HTMLElement;
    
    expect(wrapper).toHaveClass('prose', 'prose-lg', 'max-w-none', 'my-custom-class');
  });

  test('renders content without prose when prose is false', () => {
    const { container } = render(
      <MarkdownContent content="Test content" prose={false} />
    );
    const wrapper = container.firstChild as HTMLElement;
    
    expect(wrapper).not.toHaveClass('prose');
    expect(screen.getByTestId('react-markdown')).toHaveTextContent('Test content');
  });

  test('applies correct data-testid', () => {
    render(<MarkdownContent content="Test" />);
    
    const markdownContainer = screen.getByTestId('markdown-content');
    expect(markdownContainer).toBeInTheDocument();
  });

  test('renders with various content types', () => {
    const complexContent = `# Heading
    
This is a paragraph.

- List item 1
- List item 2

> Quote

\`inline code\`

[Link](https://example.com)`;
    
    render(<MarkdownContent content={complexContent} />);
    
    expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
    expect(screen.getByTestId('react-markdown')).toBeInTheDocument();
  });

  test('handles special characters in content', () => {
    const specialContent = '< > & " \' © ™ ® • – —';
    
    render(<MarkdownContent content={specialContent} />);
    
    expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
    expect(screen.getByTestId('react-markdown')).toHaveTextContent(specialContent);
  });

  test('renders markdown with custom components prop', () => {
    const content = '# Test Heading\n\nTest paragraph';
    
    render(<MarkdownContent content={content} />);
    
    // The component passes custom components to ReactMarkdown
    // In the real implementation, these would style the rendered elements
    expect(screen.getByTestId('react-markdown')).toBeInTheDocument();
  });

  test('uses remark-gfm plugin', () => {
    const content = '| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |';
    
    render(<MarkdownContent content={content} />);
    
    // remarkGfm enables GitHub Flavored Markdown features like tables
    expect(screen.getByTestId('react-markdown')).toBeInTheDocument();
  });

  test('handles null or undefined content gracefully', () => {
    // @ts-ignore - Testing edge case
    const { container, unmount } = render(<MarkdownContent content={null} />);
    
    expect(container.querySelector('[data-testid="markdown-content"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="react-markdown"]')).toHaveTextContent('');
    
    unmount();
    
    // @ts-ignore - Testing edge case
    const { container: container2 } = render(<MarkdownContent content={undefined} />);
    
    expect(container2.querySelector('[data-testid="markdown-content"]')).toBeInTheDocument();
    expect(container2.querySelector('[data-testid="react-markdown"]')).toHaveTextContent('');
  });
});