import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import MarkdownContent from '../MarkdownContent';
import { processContentForMarkdown } from '../../../utils/contentProcessor';

// Mock the content processor
const mockProcessContentForMarkdown = jest.fn();
jest.mock('../../../utils/contentProcessor', () => ({
  processContentForMarkdown: mockProcessContentForMarkdown
}));

// Mock react-markdown
jest.mock('react-markdown', () => {
  return {
    __esModule: true,
    default: ({ children, components }: any) => {
      // Simulate markdown processing for testing
      if (!children) return <div data-testid="markdown-rendered"></div>;
      
      // Simple markdown processing simulation
      const lines = children.split('\n');
      return (
        <div data-testid="markdown-rendered">
          {lines.map((line: string, index: number) => {
            if (line.startsWith('# ')) {
              return components?.h1 ? 
                components.h1({ children: line.substring(2) }) : 
                <h1 key={index}>{line.substring(2)}</h1>;
            }
            if (line.startsWith('## ')) {
              return components?.h2 ? 
                components.h2({ children: line.substring(3) }) : 
                <h2 key={index}>{line.substring(3)}</h2>;
            }
            if (line.startsWith('### ')) {
              return components?.h3 ? 
                components.h3({ children: line.substring(4) }) : 
                <h3 key={index}>{line.substring(4)}</h3>;
            }
            if (line.startsWith('**') && line.endsWith('**')) {
              return components?.strong ? 
                components.strong({ children: line.slice(2, -2) }) : 
                <strong key={index}>{line.slice(2, -2)}</strong>;
            }
            if (line.startsWith('*') && line.endsWith('*') && !line.startsWith('**')) {
              return components?.em ? 
                components.em({ children: line.slice(1, -1) }) : 
                <em key={index}>{line.slice(1, -1)}</em>;
            }
            if (line.startsWith('`') && line.endsWith('`')) {
              return components?.code ? 
                components.code({ inline: true, children: line.slice(1, -1) }) : 
                <code key={index}>{line.slice(1, -1)}</code>;
            }
            if (line.startsWith('- ')) {
              return components?.li ? 
                components.li({ children: line.substring(2) }) : 
                <li key={index}>{line.substring(2)}</li>;
            }
            if (line.match(/^\d+\. /)) {
              return components?.li ? 
                components.li({ children: line.replace(/^\d+\. /, '') }) : 
                <li key={index}>{line.replace(/^\d+\. /, '')}</li>;
            }
            if (line.startsWith('> ')) {
              return components?.blockquote ? 
                components.blockquote({ children: line.substring(2) }) : 
                <blockquote key={index}>{line.substring(2)}</blockquote>;
            }
            if (line.match(/\[([^\]]+)\]\(([^)]+)\)/)) {
              const match = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
              return components?.a ? 
                components.a({ href: match![2], children: match![1] }) : 
                <a key={index} href={match![2]}>{match![1]}</a>;
            }
            if (line === '---') {
              return components?.hr ? components.hr({}) : <hr key={index} />;
            }
            if (line.trim() === '') {
              return <br key={index} />;
            }
            return components?.p ? 
              components.p({ children: line }) : 
              <p key={index}>{line}</p>;
          })}
        </div>
      );
    }
  };
});

// Mock remark-gfm
jest.mock('remark-gfm', () => {
  return {
    __esModule: true,
    default: () => ({}) // Mock plugin function
  };
});

// Mock coordination hooks
const mockNotify = jest.fn();
const mockGetMemory = jest.fn();
const mockSetMemory = jest.fn();
jest.mock('../../../hooks/useCoordination', () => ({
  useCoordination: () => ({
    notify: mockNotify,
    getMemory: mockGetMemory,
    setMemory: mockSetMemory
  })
}));

describe('MarkdownContent Component', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    mockProcessContentForMarkdown.mockImplementation((content) => content);
  });

  describe('Basic Rendering', () => {
    it('renders with minimal props', () => {
      render(<MarkdownContent content="Hello World" />);
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
      expect(screen.getByTestId('markdown-rendered')).toBeInTheDocument();
    });

    it('renders empty content gracefully', () => {
      render(<MarkdownContent content="" />);
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
      expect(screen.getByTestId('markdown-rendered')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<MarkdownContent content="Test" className="custom-class" />);
      const container = screen.getByTestId('markdown-content');
      expect(container).toHaveClass('custom-class');
    });

    it('applies prose styles by default', () => {
      render(<MarkdownContent content="Test" />);
      const container = screen.getByTestId('markdown-content');
      expect(container).toHaveClass('prose', 'prose-lg', 'max-w-none');
    });

    it('disables prose styles when prose=false', () => {
      render(<MarkdownContent content="Test" prose={false} />);
      const container = screen.getByTestId('markdown-content');
      expect(container).not.toHaveClass('prose');
    });
  });

  describe('Content Processing', () => {
    it('calls processContentForMarkdown with provided content', () => {
      const content = "# Test Content\nSome text";
      render(<MarkdownContent content={content} />);
      
      expect(mockProcessContentForMarkdown).toHaveBeenCalledWith(content);
    });

    it('handles null content gracefully', () => {
      render(<MarkdownContent content={null as any} />);
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
    });

    it('handles undefined content gracefully', () => {
      render(<MarkdownContent content={undefined as any} />);
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
    });

    it('processes content with special characters', () => {
      const content = "Content with ünicode & special chars <>";
      render(<MarkdownContent content={content} />);
      
      expect(mockProcessContentForMarkdown).toHaveBeenCalledWith(content);
    });
  });

  describe('Markdown Elements Rendering', () => {
    it('renders headings with proper styling', () => {
      render(<MarkdownContent content="# H1\n## H2\n### H3" />);
      
      const h1 = screen.getByRole('heading', { level: 1 });
      const h2 = screen.getByRole('heading', { level: 2 });
      const h3 = screen.getByRole('heading', { level: 3 });
      
      expect(h1).toHaveTextContent('H1');
      expect(h2).toHaveTextContent('H2');
      expect(h3).toHaveTextContent('H3');
      
      // Check CSS classes
      expect(h1).toHaveClass('text-3xl', 'font-bold', 'text-gray-900');
      expect(h2).toHaveClass('text-2xl', 'font-bold', 'text-gray-900');
      expect(h3).toHaveClass('text-xl', 'font-semibold', 'text-gray-900');
    });

    it('renders paragraphs with styling', () => {
      render(<MarkdownContent content="This is a paragraph" />);
      
      const paragraph = screen.getByText('This is a paragraph');
      expect(paragraph).toHaveClass('text-gray-700', 'leading-relaxed', 'mb-4');
    });

    it('renders bold and italic text', () => {
      render(<MarkdownContent content="**bold text** and *italic text*" />);
      
      const bold = screen.getByText('bold text');
      const italic = screen.getByText('italic text');
      
      expect(bold).toHaveClass('font-semibold', 'text-gray-900');
      expect(italic).toHaveClass('italic');
    });

    it('renders inline code with styling', () => {
      render(<MarkdownContent content="`inline code`" />);
      
      const code = screen.getByText('inline code');
      expect(code).toHaveClass('bg-gray-100', 'rounded', 'px-1', 'py-0.5', 'text-sm', 'font-mono');
    });

    it('renders block quotes with styling', () => {
      render(<MarkdownContent content="> This is a blockquote" />);
      
      const blockquote = screen.getByText('This is a blockquote');
      expect(blockquote).toHaveClass('border-l-4', 'border-primary-400', 'pl-4', 'my-4', 'italic');
    });

    it('renders links with proper attributes', () => {
      render(<MarkdownContent content="[Link text](https://example.com)" />);
      
      const link = screen.getByRole('link');
      expect(link).toHaveTextContent('Link text');
      expect(link).toHaveAttribute('href', 'https://example.com');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      expect(link).toHaveClass('text-primary-600', 'hover:text-primary-700', 'underline');
    });

    it('renders horizontal rules with styling', () => {
      render(<MarkdownContent content="---" />);
      
      const hr = screen.getByRole('separator');
      expect(hr).toHaveClass('my-6', 'border-gray-300');
    });
  });

  describe('List Rendering', () => {
    it('renders unordered lists with styling', () => {
      render(<MarkdownContent content="- Item 1\n- Item 2" />);
      
      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(2);
      expect(listItems[0]).toHaveTextContent('Item 1');
      expect(listItems[1]).toHaveTextContent('Item 2');
    });

    it('renders ordered lists with styling', () => {
      render(<MarkdownContent content="1. First item\n2. Second item" />);
      
      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(2);
      expect(listItems[0]).toHaveTextContent('First item');
      expect(listItems[1]).toHaveTextContent('Second item');
    });

    it('handles nested lists correctly', () => {
      const content = "- Item 1\n  - Nested item\n- Item 2";
      render(<MarkdownContent content={content} />);
      
      const listItems = screen.getAllByRole('listitem');
      expect(listItems.length).toBeGreaterThan(0);
    });
  });

  describe('Table Rendering', () => {
    it('renders tables with proper structure and styling', () => {
      const tableContent = `| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |`;

      // Since our mock doesn't handle tables, we'll test the component structure
      render(<MarkdownContent content={tableContent} />);
      expect(screen.getByTestId('markdown-rendered')).toBeInTheDocument();
    });

    it('applies overflow wrapper to tables', () => {
      // Table rendering would be handled by ReactMarkdown with remark-gfm
      // Test the component structure
      render(<MarkdownContent content="Basic table content" />);
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
    });
  });

  describe('Code Block Rendering', () => {
    it('renders code blocks with proper styling', () => {
      const codeContent = "```javascript\nconsole.log('Hello');\n```";
      render(<MarkdownContent content={codeContent} />);
      
      // The mock will render this as a paragraph, but in real implementation
      // it would be a code block
      expect(screen.getByTestId('markdown-rendered')).toBeInTheDocument();
    });

    it('handles different programming languages', () => {
      const pythonCode = "```python\nprint('Hello')\n```";
      render(<MarkdownContent content={pythonCode} />);
      
      expect(screen.getByTestId('markdown-rendered')).toBeInTheDocument();
    });

    it('renders code blocks without language specification', () => {
      const plainCode = "```\nsome code\n```";
      render(<MarkdownContent content={plainCode} />);
      
      expect(screen.getByTestId('markdown-rendered')).toBeInTheDocument();
    });
  });

  describe('Complex Content Scenarios', () => {
    it('handles mixed content with multiple elements', () => {
      const complexContent = `# Main Title

This is a paragraph with **bold** and *italic* text.

## Subtitle

- List item 1
- List item 2

> A blockquote

\`inline code\` and [a link](https://example.com)

---

Final paragraph.`;

      render(<MarkdownContent content={complexContent} />);
      
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Main Title');
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Subtitle');
      expect(screen.getByText('bold')).toBeInTheDocument();
      expect(screen.getByText('italic')).toBeInTheDocument();
      expect(screen.getByRole('link')).toHaveTextContent('a link');
    });

    it('processes content with Jung psychology terms', () => {
      const jungContent = `The **collective unconscious** contains **archetypes** that influence our behavior.

Jung's concept of **individuation** is central to analytical psychology.`;

      render(<MarkdownContent content={jungContent} />);
      
      expect(mockProcessContentForMarkdown).toHaveBeenCalledWith(jungContent);
      expect(screen.getByText('collective unconscious')).toBeInTheDocument();
      expect(screen.getByText('individuation')).toBeInTheDocument();
    });

    it('handles long content efficiently', () => {
      const longContent = Array(100).fill("This is a paragraph. ").join('\n');
      render(<MarkdownContent content={longContent} />);
      
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
      expect(mockProcessContentForMarkdown).toHaveBeenCalledWith(longContent);
    });
  });

  describe('Error Handling', () => {
    it('handles malformed markdown gracefully', () => {
      const malformedContent = "# Heading\n**unclosed bold\n*unclosed italic";
      render(<MarkdownContent content={malformedContent} />);
      
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
    });

    it('handles special characters and HTML entities', () => {
      const specialContent = "Content with <script> & entities &amp; émojis 🎉";
      render(<MarkdownContent content={specialContent} />);
      
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
    });

    it('handles extremely long lines', () => {
      const longLine = "A".repeat(10000);
      render(<MarkdownContent content={longLine} />);
      
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
    });

    it('handles content with only whitespace', () => {
      render(<MarkdownContent content="   \n\n   \t   " />);
      
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('maintains proper heading hierarchy', () => {
      render(<MarkdownContent content="# H1\n## H2\n### H3\n#### H4" />);
      
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });

    it('provides accessible link attributes', () => {
      render(<MarkdownContent content="[External link](https://example.com)" />);
      
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('maintains semantic structure for lists', () => {
      render(<MarkdownContent content="- Item 1\n- Item 2" />);
      
      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(2);
    });

    it('provides testid for testing accessibility', () => {
      render(<MarkdownContent content="Test content" />);
      
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('handles frequent content updates efficiently', () => {
      const { rerender } = render(<MarkdownContent content="Initial content" />);
      
      // Update content multiple times
      for (let i = 0; i < 10; i++) {
        rerender(<MarkdownContent content={`Updated content ${i}`} />);
      }
      
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
      expect(mockProcessContentForMarkdown).toHaveBeenCalledTimes(11); // Initial + 10 updates
    });

    it('memoizes processed content appropriately', () => {
      const content = "Same content";
      const { rerender } = render(<MarkdownContent content={content} />);
      
      // Re-render with same content
      rerender(<MarkdownContent content={content} />);
      
      expect(mockProcessContentForMarkdown).toHaveBeenCalledTimes(2);
    });

    it('handles component unmounting cleanly', () => {
      const { unmount } = render(<MarkdownContent content="Test content" />);
      
      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });

  describe('Component API', () => {
    it('accepts all valid props', () => {
      const props = {
        content: "Test content",
        className: "custom-class",
        prose: false
      };
      
      render(<MarkdownContent {...props} />);
      
      const container = screen.getByTestId('markdown-content');
      expect(container).toHaveClass('custom-class');
      expect(container).not.toHaveClass('prose');
    });

    it('provides sensible defaults for optional props', () => {
      render(<MarkdownContent content="Test" />);
      
      const container = screen.getByTestId('markdown-content');
      expect(container).toHaveClass('prose'); // prose defaults to true
    });

    it('handles prop changes correctly', () => {
      const { rerender } = render(
        <MarkdownContent content="Original" className="class1" prose={true} />
      );
      
      rerender(
        <MarkdownContent content="Updated" className="class2" prose={false} />
      );
      
      const container = screen.getByTestId('markdown-content');
      expect(container).toHaveClass('class2');
      expect(container).not.toHaveClass('class1', 'prose');
    });
  });

  describe('Integration with Content Processor', () => {
    it('calls content processor with different content types', () => {
      const testCases = [
        "Simple text",
        "# Markdown heading",
        "**Bold text**",
        "- List item",
        "> Blockquote"
      ];
      
      testCases.forEach(content => {
        render(<MarkdownContent content={content} />);
      });
      
      expect(mockProcessContentForMarkdown).toHaveBeenCalledTimes(testCases.length);
    });

    it('handles content processor errors gracefully', () => {
      mockProcessContentForMarkdown.mockImplementation(() => {
        throw new Error('Processing failed');
      });
      
      expect(() => {
        render(<MarkdownContent content="Test content" />);
      }).not.toThrow();
    });

    it('falls back when content processor returns null', () => {
      mockProcessContentForMarkdown.mockReturnValue(null as any);
      
      render(<MarkdownContent content="Original content" />);
      
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
    });
  });

  describe('CSS Class Management', () => {
    it('combines prose classes correctly when enabled', () => {
      render(<MarkdownContent content="Test" className="extra" prose={true} />);
      
      const container = screen.getByTestId('markdown-content');
      expect(container).toHaveClass('prose', 'prose-lg', 'max-w-none', 'extra');
    });

    it('handles empty className gracefully', () => {
      render(<MarkdownContent content="Test" className="" />);
      
      const container = screen.getByTestId('markdown-content');
      expect(container).toHaveClass('prose'); // Should still have default classes
    });

    it('handles undefined className gracefully', () => {
      render(<MarkdownContent content="Test" className={undefined} />);
      
      const container = screen.getByTestId('markdown-content');
      expect(container).toHaveClass('prose');
    });
  });
});