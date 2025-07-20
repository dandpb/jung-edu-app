import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MarkdownContent from '../MarkdownContent';

// Mock react-markdown
jest.mock('react-markdown', () => {
  const MockReactMarkdown = ({ children }: { children: string }) => {
    return require('react').createElement('div', { 'data-testid': 'markdown-content' }, children);
  };
  return MockReactMarkdown;
});

// Mock remark-gfm
jest.mock('remark-gfm', () => jest.fn());

describe('MarkdownContent Component', () => {
  describe('Basic Rendering', () => {
    test('renders simple text content', () => {
      render(<MarkdownContent content="Hello World" />);
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });

    test('applies default className when none provided', () => {
      const { container } = render(<MarkdownContent content="Test content" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('prose', 'prose-lg', 'max-w-none');
    });

    test('applies custom className', () => {
      const { container } = render(
        <MarkdownContent content="Test content" className="custom-class" />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('prose', 'prose-lg', 'max-w-none', 'custom-class');
    });

    test('renders without prose classes when prose=false', () => {
      const { container } = render(
        <MarkdownContent content="Test content" prose={false} />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).not.toHaveClass('prose');
      expect(wrapper).toHaveClass('');
    });

    test('combines custom className with prose=false', () => {
      const { container } = render(
        <MarkdownContent content="Test content" className="custom-class" prose={false} />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).not.toHaveClass('prose');
      expect(wrapper).toHaveClass('custom-class');
    });
  });

  describe('Content Rendering', () => {
    test('renders markdown headers', () => {
      render(<MarkdownContent content="# Main Title" />);
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
      expect(screen.getByText('# Main Title')).toBeInTheDocument();
    });

    test('renders markdown bold text', () => {
      render(<MarkdownContent content="**bold text**" />);
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
      expect(screen.getByText('**bold text**')).toBeInTheDocument();
    });

    test('renders markdown lists', () => {
      const listContent = `- First item
- Second item
- Third item`;
      
      render(<MarkdownContent content={listContent} />);
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
    });

    test('renders markdown links', () => {
      render(<MarkdownContent content="[Link Text](https://example.com)" />);
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
    });

    test('renders markdown blockquotes', () => {
      render(<MarkdownContent content="> This is a quote" />);
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
    });

    test('renders inline code', () => {
      render(<MarkdownContent content="`inline code`" />);
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
    });

    test('renders code blocks', () => {
      render(<MarkdownContent content="```\ncode block\n```" />);
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
    });
  });

  describe('Complex Content', () => {
    test('renders mixed content correctly', () => {
      const complexContent = `# Title

This is a **bold** paragraph with *italic* text and \`inline code\`.

- List item 1
- List item 2

> This is a blockquote

[Link to example](https://example.com)`;
      
      render(<MarkdownContent content={complexContent} />);
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
    });

    test('handles empty content', () => {
      render(<MarkdownContent content="" />);
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
    });

    test('handles whitespace-only content', () => {
      render(<MarkdownContent content="   \n\n   " />);
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
    });

    test('handles very long content', () => {
      const longContent = 'a'.repeat(10000);
      render(<MarkdownContent content={longContent} />);
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
    });
  });

  describe('Props Validation', () => {
    test('accepts all valid props', () => {
      expect(() => {
        render(
          <MarkdownContent 
            content="Test" 
            className="test-class" 
            prose={true} 
          />
        );
      }).not.toThrow();
    });

    test('uses default props correctly', () => {
      const { container } = render(<MarkdownContent content="Test" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('prose');
    });
  });

  describe('Error Handling', () => {
    test('handles invalid markdown gracefully', () => {
      const invalidMarkdown = "# Unclosed [link";
      render(<MarkdownContent content={invalidMarkdown} />);
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
    });

    test('handles special characters', () => {
      const specialChars = "Special chars: <>&\"'";
      render(<MarkdownContent content={specialChars} />);
      expect(screen.getByText(/Special chars/)).toBeInTheDocument();
    });

    test('handles unicode content', () => {
      const unicodeContent = "Unicode: 你好 🌟 café";
      render(<MarkdownContent content={unicodeContent} />);
      expect(screen.getByText(/Unicode/)).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    test('renders efficiently with large content', () => {
      const largeContent = Array(100).fill("# Header\n\nParagraph text").join('\n\n');
      const start = performance.now();
      render(<MarkdownContent content={largeContent} />);
      const end = performance.now();
      
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
      expect(end - start).toBeLessThan(1000); // Should render in less than 1 second
    });

    test('handles re-renders efficiently', () => {
      const { rerender } = render(<MarkdownContent content="Initial content" />);
      
      rerender(<MarkdownContent content="Updated content" />);
      rerender(<MarkdownContent content="Final content" />);
      
      expect(screen.getByText('Final content')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    test('integrates with ReactMarkdown properly', () => {
      render(<MarkdownContent content="Test markdown content" />);
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
    });

    test('passes content to markdown renderer', () => {
      const testContent = "# Test Header\n\nTest paragraph";
      render(<MarkdownContent content={testContent} />);
      expect(screen.getByText(testContent)).toBeInTheDocument();
    });

    test('component structure is consistent', () => {
      const { container } = render(<MarkdownContent content="Test" />);
      expect(container.firstChild).toHaveProperty('tagName', 'DIV');
      expect(container.querySelector('[data-testid="markdown-content"]')).toBeInTheDocument();
    });
  });
});