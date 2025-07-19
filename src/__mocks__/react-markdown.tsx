import React from 'react';

// Mock for react-markdown
const ReactMarkdown = ({ children }: { children: string }) => {
  return <div data-testid="markdown-content">{children}</div>;
};

export default ReactMarkdown;