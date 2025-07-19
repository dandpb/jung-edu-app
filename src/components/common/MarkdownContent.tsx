import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownContentProps {
  content: string;
  className?: string;
  prose?: boolean;
}

/**
 * MarkdownContent Component
 * 
 * Renders markdown content with support for:
 * - Headers (h1-h6)
 * - Bold and italic text
 * - Lists (ordered and unordered)
 * - Links
 * - Code blocks
 * - Tables (via remark-gfm)
 * - Line breaks
 * - Blockquotes
 */
const MarkdownContent: React.FC<MarkdownContentProps> = ({ 
  content, 
  className = '', 
  prose = true 
}) => {
  // Custom component renderers for better styling
  const components = {
    h1: ({ children, ...props }: any) => (
      <h1 className="text-3xl font-bold text-gray-900 mb-4 mt-6" {...props}>
        {children}
      </h1>
    ),
    h2: ({ children, ...props }: any) => (
      <h2 className="text-2xl font-bold text-gray-900 mb-3 mt-5" {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, ...props }: any) => (
      <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4" {...props}>
        {children}
      </h3>
    ),
    h4: ({ children, ...props }: any) => (
      <h4 className="text-lg font-semibold text-gray-800 mb-2 mt-3" {...props}>
        {children}
      </h4>
    ),
    p: ({ children, ...props }: any) => (
      <p className="text-gray-700 leading-relaxed mb-4" {...props}>
        {children}
      </p>
    ),
    ul: ({ children, ...props }: any) => (
      <ul className="list-disc list-inside mb-4 space-y-1 text-gray-700" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }: any) => (
      <ol className="list-decimal list-inside mb-4 space-y-1 text-gray-700" {...props}>
        {children}
      </ol>
    ),
    li: ({ children, ...props }: any) => (
      <li className="ml-4" {...props}>
        {children}
      </li>
    ),
    blockquote: ({ children, ...props }: any) => (
      <blockquote className="border-l-4 border-primary-400 pl-4 my-4 italic text-gray-600" {...props}>
        {children}
      </blockquote>
    ),
    code: ({ inline, children, ...props }: any) => {
      if (inline) {
        return (
          <code className="bg-gray-100 rounded px-1 py-0.5 text-sm font-mono text-gray-800" {...props}>
            {children}
          </code>
        );
      }
      return (
        <pre className="bg-gray-100 rounded-lg p-4 mb-4 overflow-x-auto">
          <code className="text-sm font-mono text-gray-800" {...props}>
            {children}
          </code>
        </pre>
      );
    },
    strong: ({ children, ...props }: any) => (
      <strong className="font-semibold text-gray-900" {...props}>
        {children}
      </strong>
    ),
    em: ({ children, ...props }: any) => (
      <em className="italic" {...props}>
        {children}
      </em>
    ),
    a: ({ children, href, ...props }: any) => (
      <a 
        href={href} 
        className="text-primary-600 hover:text-primary-700 underline" 
        target="_blank" 
        rel="noopener noreferrer"
        {...props}
      >
        {children}
      </a>
    ),
    hr: ({ ...props }: any) => (
      <hr className="my-6 border-gray-300" {...props} />
    ),
    table: ({ children, ...props }: any) => (
      <div className="overflow-x-auto mb-4">
        <table className="min-w-full divide-y divide-gray-300" {...props}>
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ...props }: any) => (
      <thead className="bg-gray-50" {...props}>
        {children}
      </thead>
    ),
    tbody: ({ children, ...props }: any) => (
      <tbody className="bg-white divide-y divide-gray-200" {...props}>
        {children}
      </tbody>
    ),
    th: ({ children, ...props }: any) => (
      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900" {...props}>
        {children}
      </th>
    ),
    td: ({ children, ...props }: any) => (
      <td className="px-4 py-2 text-sm text-gray-700" {...props}>
        {children}
      </td>
    ),
  };

  const baseClassName = prose 
    ? `prose prose-lg max-w-none ${className}`
    : className;

  return (
    <div className={baseClassName}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownContent;