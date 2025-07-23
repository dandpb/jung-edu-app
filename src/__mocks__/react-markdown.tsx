import React from 'react';

// Mock for react-markdown that properly displays content
const ReactMarkdown = ({ children }: { children: string }) => {
  return <div data-testid="react-markdown">{children}</div>;
};

export default ReactMarkdown;