import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MarkdownExample from '../MarkdownExample';

// Mock the MarkdownContent component
jest.mock('../MarkdownContent', () => {
  return ({ content }: { content: string }) => (
    <div data-testid="markdown-content-mock">
      {/* Simulate rendering of key content elements */}
      {content.includes('# Understanding the **Shadow**') && (
        <h1>Understanding the Shadow in Jungian Psychology</h1>
      )}
      {content.includes('## Key Characteristics') && (
        <h2>Key Characteristics of the Shadow</h2>
      )}
      {content.includes('### Why Shadow Work Matters') && (
        <h3>Why Shadow Work Matters</h3>
      )}
      {content.includes('### Practical Exercises') && (
        <h3>Practical Exercises for Shadow Work</h3>
      )}
      {content.includes('### Common Shadow Manifestations') && (
        <h3>Common Shadow Manifestations</h3>
      )}
      {content.includes('### Integration Process') && (
        <h3>Integration Process</h3>
      )}
      {content.includes('### Resources for Further Study') && (
        <h3>Resources for Further Study</h3>
      )}
      {content.includes('1. **Unconscious Content**') && (
        <ol>
          <li>Unconscious Content: The Shadow contains elements that are incompatible with our conscious self-image</li>
          <li>Personal and Collective Aspects: While primarily personal, it can include collective elements</li>
          <li>Projection Mechanism: We often project our Shadow onto others</li>
          <li>Integration Potential: Shadow work leads to psychological wholeness</li>
        </ol>
      )}
      {content.includes('> "Everyone carries a shadow') && (
        <blockquote>
          "Everyone carries a shadow, and the less it is embodied in the individual's conscious life, the blacker and denser it is." - Carl Jung
        </blockquote>
      )}
      {content.includes('1. **Dream Analysis**') && (
        <div>
          <h4>Dream Analysis</h4>
          <ul>
            <li>Record your dreams immediately upon waking</li>
            <li>Look for recurring dark figures or themes</li>
            <li>Notice emotional reactions to dream characters</li>
          </ul>
        </div>
      )}
      {content.includes('| Conscious Persona | Shadow Aspect |') && (
        <table>
          <thead>
            <tr>
              <th>Conscious Persona</th>
              <th>Shadow Aspect</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Always helpful</td>
              <td>Selfish desires</td>
            </tr>
            <tr>
              <td>Perfectly organized</td>
              <td>Chaotic impulses</td>
            </tr>
            <tr>
              <td>Constantly positive</td>
              <td>Suppressed anger</td>
            </tr>
            <tr>
              <td>Highly rational</td>
              <td>Emotional needs</td>
            </tr>
          </tbody>
        </table>
      )}
      {content.includes('```') && (
        <pre>
          <code>1. Recognition → 2. Acceptance → 3. Integration → 4. Transformation</code>
        </pre>
      )}
      {content.includes('[Man and His Symbols]') && (
        <ul>
          <li><a href="https://example.com">Man and His Symbols</a> by Carl Jung</li>
          <li><a href="https://example.com">Meeting the Shadow</a> edited by Connie Zweig and Jeremiah Abrams</li>
          <li><a href="https://example.com">Owning Your Own Shadow</a> by Robert A. Johnson</li>
        </ul>
      )}
      {content.includes('*"Until you make the unconscious') && (
        <em>"Until you make the unconscious conscious, it will direct your life and you will call it fate." - Carl Jung</em>
      )}
    </div>
  );
});

describe('MarkdownExample Component', () => {
  describe('Basic Rendering', () => {
    test('renders without crashing', () => {
      render(<MarkdownExample />);
      expect(screen.getByTestId('markdown-content-mock')).toBeInTheDocument();
    });

    test('renders the main title', () => {
      render(<MarkdownExample />);
      expect(screen.getByText('Markdown Rendering Example')).toBeInTheDocument();
    });

    test('has proper container structure', () => {
      const { container } = render(<MarkdownExample />);
      const mainContainer = container.querySelector('.max-w-4xl');
      expect(mainContainer).toBeInTheDocument();
      expect(mainContainer).toHaveClass('mx-auto', 'p-8');
    });

    test('has styled content container', () => {
      const { container } = render(<MarkdownExample />);
      const contentContainer = container.querySelector('.border.rounded-lg');
      expect(contentContainer).toBeInTheDocument();
      expect(contentContainer).toHaveClass('p-6', 'bg-white', 'shadow-sm');
    });
  });

  describe('Content Structure', () => {
    test('renders main heading about Shadow', () => {
      render(<MarkdownExample />);
      expect(screen.getByRole('heading', { name: /Understanding the Shadow in Jungian Psychology/i })).toBeInTheDocument();
    });

    test('renders key characteristics section', () => {
      render(<MarkdownExample />);
      expect(screen.getByRole('heading', { name: /Key Characteristics of the Shadow/i })).toBeInTheDocument();
      
      // Check for list items
      expect(screen.getByText(/Unconscious Content.*incompatible.*conscious self-image/)).toBeInTheDocument();
      expect(screen.getByText(/Personal and Collective Aspects.*primarily personal/)).toBeInTheDocument();
      expect(screen.getByText(/Projection Mechanism.*project.*Shadow onto others/)).toBeInTheDocument();
      expect(screen.getByText(/Integration Potential.*Shadow work.*psychological wholeness/)).toBeInTheDocument();
    });

    test('renders why shadow work matters section', () => {
      render(<MarkdownExample />);
      expect(screen.getByRole('heading', { name: /Why Shadow Work Matters/i })).toBeInTheDocument();
    });

    test('renders Carl Jung quote', () => {
      render(<MarkdownExample />);
      expect(screen.getByText(/"Everyone carries a shadow.*blacker and denser it is.*Carl Jung/)).toBeInTheDocument();
    });

    test('renders practical exercises section', () => {
      render(<MarkdownExample />);
      expect(screen.getByRole('heading', { name: /Practical Exercises for Shadow Work/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Dream Analysis/i })).toBeInTheDocument();
      
      // Check exercise steps
      expect(screen.getByText('Record your dreams immediately upon waking')).toBeInTheDocument();
      expect(screen.getByText('Look for recurring dark figures or themes')).toBeInTheDocument();
      expect(screen.getByText('Notice emotional reactions to dream characters')).toBeInTheDocument();
    });

    test('renders shadow manifestations table', () => {
      render(<MarkdownExample />);
      expect(screen.getByRole('heading', { name: /Common Shadow Manifestations/i })).toBeInTheDocument();
      
      // Check table headers
      expect(screen.getByText('Conscious Persona')).toBeInTheDocument();
      expect(screen.getByText('Shadow Aspect')).toBeInTheDocument();
      
      // Check table content
      expect(screen.getByText('Always helpful')).toBeInTheDocument();
      expect(screen.getByText('Selfish desires')).toBeInTheDocument();
      expect(screen.getByText('Perfectly organized')).toBeInTheDocument();
      expect(screen.getByText('Chaotic impulses')).toBeInTheDocument();
      expect(screen.getByText('Constantly positive')).toBeInTheDocument();
      expect(screen.getByText('Suppressed anger')).toBeInTheDocument();
      expect(screen.getByText('Highly rational')).toBeInTheDocument();
      expect(screen.getByText('Emotional needs')).toBeInTheDocument();
    });

    test('renders integration process section', () => {
      render(<MarkdownExample />);
      expect(screen.getByRole('heading', { name: /Integration Process/i })).toBeInTheDocument();
      expect(screen.getByText('1. Recognition → 2. Acceptance → 3. Integration → 4. Transformation')).toBeInTheDocument();
    });

    test('renders resources section with links', () => {
      render(<MarkdownExample />);
      expect(screen.getByRole('heading', { name: /Resources for Further Study/i })).toBeInTheDocument();
      
      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(3);
      
      expect(screen.getByText('Man and His Symbols')).toBeInTheDocument();
      expect(screen.getByText('Meeting the Shadow')).toBeInTheDocument();
      expect(screen.getByText('Owning Your Own Shadow')).toBeInTheDocument();
    });

    test('renders final quote', () => {
      render(<MarkdownExample />);
      expect(screen.getByText(/"Until you make the unconscious conscious.*call it fate.*Carl Jung/)).toBeInTheDocument();
    });
  });

  describe('Educational Content Quality', () => {
    test('provides comprehensive shadow psychology coverage', () => {
      render(<MarkdownExample />);
      
      // Check that key concepts are covered
      expect(screen.getByTestId('markdown-content-mock')).toBeInTheDocument();
      
      // Verify educational structure
      const headings = ['Key Characteristics', 'Why Shadow Work Matters', 'Practical Exercises', 'Integration Process'];
      headings.forEach(heading => {
        expect(screen.getByText(new RegExp(heading))).toBeInTheDocument();
      });
    });

    test('includes practical exercises for learning', () => {
      render(<MarkdownExample />);
      
      // Check that practical exercises are detailed
      expect(screen.getByText('Dream Analysis')).toBeInTheDocument();
      expect(screen.getByText('Record your dreams immediately upon waking')).toBeInTheDocument();
    });

    test('provides authoritative quotes', () => {
      render(<MarkdownExample />);
      
      // Check that Carl Jung quotes are included
      expect(screen.getByText(/"Everyone carries a shadow/)).toBeInTheDocument();
      expect(screen.getByText(/"Until you make the unconscious/)).toBeInTheDocument();
    });

    test('includes recommended resources', () => {
      render(<MarkdownExample />);
      
      const resourceLinks = screen.getAllByRole('link');
      expect(resourceLinks.length).toBeGreaterThan(0);
      
      // Check that links point to example.com (mock URLs)
      resourceLinks.forEach(link => {
        expect(link).toHaveAttribute('href', 'https://example.com');
      });
    });
  });

  describe('Markdown Formatting Examples', () => {
    test('demonstrates various markdown elements', () => {
      render(<MarkdownExample />);
      
      // Headers (h1, h2, h3)
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
      
      // Lists
      expect(screen.getByRole('list')).toBeInTheDocument();
      
      // Table
      expect(screen.getByRole('table')).toBeInTheDocument();
      
      // Blockquote
      expect(screen.getByText(/"Everyone carries a shadow/)).toBeInTheDocument();
      
      // Links
      expect(screen.getAllByRole('link').length).toBeGreaterThan(0);
      
      // Code block
      expect(screen.getByText('1. Recognition → 2. Acceptance → 3. Integration → 4. Transformation')).toBeInTheDocument();
      
      // Emphasis
      expect(screen.getByText(/"Until you make the unconscious/)).toBeInTheDocument();
    });

    test('shows proper markdown syntax usage', () => {
      render(<MarkdownExample />);
      
      // The component serves as an example of how to use markdown effectively
      expect(screen.getByText('Markdown Rendering Example')).toBeInTheDocument();
      expect(screen.getByTestId('markdown-content-mock')).toBeInTheDocument();
    });
  });

  describe('Visual Design', () => {
    test('has proper responsive layout', () => {
      const { container } = render(<MarkdownExample />);
      
      const mainContainer = container.querySelector('.max-w-4xl');
      expect(mainContainer).toHaveClass('mx-auto'); // Centered layout
      
      const contentBox = container.querySelector('.border.rounded-lg');
      expect(contentBox).toHaveClass('bg-white', 'shadow-sm'); // Styled content area
    });

    test('uses appropriate spacing', () => {
      const { container } = render(<MarkdownExample />);
      
      const outerContainer = container.querySelector('.max-w-4xl');
      expect(outerContainer).toHaveClass('p-8'); // Outer padding
      
      const innerContainer = container.querySelector('.border.rounded-lg');
      expect(innerContainer).toHaveClass('p-6'); // Inner padding
    });

    test('has proper content hierarchy', () => {
      render(<MarkdownExample />);
      
      // Main title should be separate from content
      expect(screen.getByText('Markdown Rendering Example')).toBeInTheDocument();
      
      // Content should be in a styled container
      expect(screen.getByTestId('markdown-content-mock')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    test('properly integrates with MarkdownContent component', () => {
      render(<MarkdownExample />);
      
      // Should pass content to MarkdownContent
      expect(screen.getByTestId('markdown-content-mock')).toBeInTheDocument();
    });

    test('passes complete example content', () => {
      render(<MarkdownExample />);
      
      // Verify that comprehensive content is being passed
      // All major sections should be present
      const sections = [
        'Understanding the Shadow',
        'Key Characteristics',
        'Why Shadow Work Matters',
        'Practical Exercises',
        'Common Shadow Manifestations',
        'Integration Process',
        'Resources for Further Study'
      ];
      
      sections.forEach(section => {
        expect(screen.getByText(new RegExp(section))).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('has proper heading structure', () => {
      render(<MarkdownExample />);
      
      // Should have logical heading hierarchy
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });

    test('provides accessible links', () => {
      render(<MarkdownExample />);
      
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toHaveAccessibleName();
      });
    });

    test('has accessible table structure', () => {
      render(<MarkdownExample />);
      
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      
      // Should have proper table headers
      expect(screen.getByText('Conscious Persona')).toBeInTheDocument();
      expect(screen.getByText('Shadow Aspect')).toBeInTheDocument();
    });

    test('provides semantic list structure', () => {
      render(<MarkdownExample />);
      
      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();
      
      const listItems = screen.getAllByRole('listitem');
      expect(listItems.length).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    test('renders efficiently', () => {
      const start = performance.now();
      render(<MarkdownExample />);
      const end = performance.now();
      
      expect(screen.getByTestId('markdown-content-mock')).toBeInTheDocument();
      expect(end - start).toBeLessThan(100); // Should render quickly
    });

    test('handles re-renders efficiently', () => {
      const { rerender } = render(<MarkdownExample />);
      
      // Re-render multiple times
      rerender(<MarkdownExample />);
      rerender(<MarkdownExample />);
      
      expect(screen.getByTestId('markdown-content-mock')).toBeInTheDocument();
    });
  });

  describe('Content Validation', () => {
    test('contains educational value', () => {
      render(<MarkdownExample />);
      
      // Should provide educational content about Jungian psychology
      expect(screen.getByText(/Shadow.*Jungian Psychology/)).toBeInTheDocument();
      expect(screen.getByText(/Carl Jung/)).toBeInTheDocument();
    });

    test('demonstrates practical applications', () => {
      render(<MarkdownExample />);
      
      // Should include practical exercises
      expect(screen.getByText('Practical Exercises')).toBeInTheDocument();
      expect(screen.getByText('Dream Analysis')).toBeInTheDocument();
    });

    test('provides authoritative sources', () => {
      render(<MarkdownExample />);
      
      // Should include bibliography/resources
      expect(screen.getByText('Resources for Further Study')).toBeInTheDocument();
      expect(screen.getAllByRole('link').length).toBeGreaterThan(0);
    });
  });
});