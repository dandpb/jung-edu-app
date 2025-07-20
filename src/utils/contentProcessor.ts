/**
 * Processes content to convert plain text list markers into proper Markdown format
 */
export function processContentForMarkdown(content: string): string {
  let processedContent = content;

  // Process numbered lists
  // Match lines that start with number + dot (e.g., "1.", "2.")
  processedContent = processedContent.replace(/^(\d+)\.\s*\n/gm, '$1. ');
  
  // Process bullet points
  // Match lines that start with bullet character
  processedContent = processedContent.replace(/^•\s*\n/gm, '* ');
  
  // Handle cases where the list item content is on the same line
  processedContent = processedContent.replace(/^(\d+)\.\s+([A-Z])/gm, '$1. **$2');
  processedContent = processedContent.replace(/^•\s+([A-Z])/gm, '* **$1');
  
  // Fix lists that have content with bold text
  // Match patterns like "1. Autoconhecimento:" and ensure bold formatting
  processedContent = processedContent.replace(/^(\d+)\.\s+([^:]+):\s*/gm, '$1. **$2:** ');
  processedContent = processedContent.replace(/^•\s+([^:]+):\s*/gm, '* **$1:** ');
  
  // Ensure proper spacing between list items
  // Add blank line before numbered lists if not present
  processedContent = processedContent.replace(/([^\n])\n(\d+\.\s)/g, '$1\n\n$2');
  
  // Add blank line before bullet lists if not present
  processedContent = processedContent.replace(/([^\n])\n(\*\s)/g, '$1\n\n$2');
  
  // Clean up multiple blank lines
  processedContent = processedContent.replace(/\n{3,}/g, '\n\n');
  
  return processedContent;
}

/**
 * Post-processes HTML to add additional styling classes
 */
export function enhanceListHTML(html: string): string {
  // This function could be used if we need to further enhance the HTML
  // after ReactMarkdown processing
  return html;
}