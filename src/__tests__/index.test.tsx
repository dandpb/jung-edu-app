import React from 'react';

// Mock ReactDOM.createRoot
const mockRoot = {
  render: jest.fn(),
  unmount: jest.fn()
};

const mockCreateRoot = jest.fn(() => mockRoot);

// Mock react-dom/client before any imports
jest.mock('react-dom/client', () => ({
  createRoot: mockCreateRoot
}));

// Mock App component - use factory function to avoid hoisting issues
jest.mock('../App', () => ({
  __esModule: true,
  default: () => <div>App Component</div>
}));

// Mock reportWebVitals
const mockReportWebVitals = jest.fn();
jest.mock('../reportWebVitals', () => ({
  __esModule: true,
  default: mockReportWebVitals
}));

// Mock CSS import
jest.mock('../index.css', () => ({}));

// Import mocked modules
import App from '../App';
import reportWebVitals from '../reportWebVitals';

describe('index.tsx', () => {
  let rootElement: HTMLDivElement;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    mockCreateRoot.mockClear();
    mockRoot.render.mockClear();
    mockRoot.unmount.mockClear();
    mockReportWebVitals.mockClear();
    
    // Reset modules cache before each test
    jest.resetModules();
    
    // Create a root element
    rootElement = document.createElement('div');
    rootElement.id = 'root';
    document.body.appendChild(rootElement);
    
    // Reset the mock implementation
    mockCreateRoot.mockReturnValue(mockRoot);
  });

  afterEach(() => {
    // Clean up DOM
    if (document.body.contains(rootElement)) {
      document.body.removeChild(rootElement);
    }
  });

  test('creates root element and renders App', () => {
    // Import index.tsx (this executes the file)
    require('../index');

    // Verify createRoot was called with the root element
    expect(mockCreateRoot).toHaveBeenCalledWith(rootElement);

    // Verify render was called
    expect(mockRoot.render).toHaveBeenCalled();
    
    // Verify the structure of what was rendered
    const renderCall = mockRoot.render.mock.calls[0][0];
    expect(renderCall.type).toBe(React.StrictMode);
    expect(renderCall.props.children).toBeDefined();
  });

  test('calls reportWebVitals', () => {
    // Import index.tsx
    require('../index');

    // Verify reportWebVitals was called
    expect(mockReportWebVitals).toHaveBeenCalled();
  });

  test('handles missing root element gracefully', () => {
    // Remove root element
    document.body.removeChild(rootElement);

    // Should not throw - index.tsx doesn't have error handling for missing root
    // The type assertion will succeed but getElementById will return null
    jest.isolateModules(() => {
      require('../index');
    });
    
    // Verify createRoot was called with null (cast as HTMLElement)
    expect(mockCreateRoot).toHaveBeenCalledWith(null);
  });

  test('renders in StrictMode', () => {
    require('../index');

    const renderCall = mockRoot.render.mock.calls[0][0];

    // Check that the rendered element is wrapped in StrictMode
    expect(renderCall.type).toBe(React.StrictMode);
    expect(renderCall.props.children).toBeDefined();
    // The child is now the error boundary which wraps App
    const boundary = renderCall.props.children;
    expect(boundary.type.name).toBe('ResizeObserverErrorBoundary');
    expect(boundary.props.children.type).toBeDefined();
    expect(boundary.props.children.type.name).toBe('default');
  });

  test('uses correct root element id', () => {
    // Create a different element to ensure the correct one is selected
    const wrongElement = document.createElement('div');
    wrongElement.id = 'wrong-root';
    document.body.appendChild(wrongElement);

    require('../index');

    // Verify createRoot was called with the correct element
    expect(mockCreateRoot).toHaveBeenCalledWith(rootElement);
    expect(mockCreateRoot).not.toHaveBeenCalledWith(wrongElement);

    document.body.removeChild(wrongElement);
  });

  test('imports CSS file', () => {
    // The CSS import is mocked, but we verify the module loads without error
    expect(() => require('../index')).not.toThrow();
  });

  test('executes in correct order', () => {
    const executionOrder: string[] = [];

    // Mock to track execution order
    mockCreateRoot.mockImplementation(() => {
      executionOrder.push('createRoot');
      return mockRoot;
    });

    mockRoot.render.mockImplementation(() => {
      executionOrder.push('render');
    });

    mockReportWebVitals.mockImplementation(() => {
      executionOrder.push('reportWebVitals');
    });

    require('../index');

    expect(executionOrder).toEqual(['createRoot', 'render', 'reportWebVitals']);
  });

  test('root element type assertion works correctly', () => {
    require('../index');

    // Verify that createRoot was called with an HTMLElement
    const rootArg = mockCreateRoot.mock.calls[0][0];
    expect(rootArg).toBeInstanceOf(HTMLElement);
    expect(rootArg.id).toBe('root');
  });

  test('does not call render multiple times', () => {
    require('../index');

    expect(mockRoot.render).toHaveBeenCalledTimes(1);
  });

  test('does not call createRoot multiple times', () => {
    require('../index');

    expect(mockCreateRoot).toHaveBeenCalledTimes(1);
  });

  test('creates root with proper element reference', () => {
    require('../index');

    const createRootCall = mockCreateRoot.mock.calls[0];
    expect(createRootCall[0]).toBe(document.getElementById('root'));
  });

  test('renders exactly one App component', () => {
    require('../index');

    const renderCall = mockRoot.render.mock.calls[0][0];

    // Check that StrictMode -> ErrorBoundary -> App
    expect(renderCall.type).toBe(React.StrictMode);
    const boundary = renderCall.props.children;
    expect(boundary.type.name).toBe('ResizeObserverErrorBoundary');
    const appElement = boundary.props.children;
    expect(appElement).toBeDefined();
    expect(typeof appElement.type).toBe('function');
  });
});