import React from 'react';
import ReactDOM from 'react-dom/client';

// Mock the App component
jest.mock('../App', () => {
  const MockApp = () => {
    const React = require('react');
    return React.createElement('div', null, 'Mock App');
  };
  MockApp.displayName = 'MockApp';
  return MockApp;
});

// Mock reportWebVitals
jest.mock('../reportWebVitals', () => jest.fn());

// Mock CSS
jest.mock('../index.css', () => ({}));

describe('Application Entry Point', () => {
  let root: HTMLDivElement;
  let mockRender: jest.Mock;
  let mockRoot: { render: jest.Mock };
  let mockCreateRoot: jest.Mock;

  beforeEach(() => {
    // Create a root element
    root = document.createElement('div');
    root.id = 'root';
    document.body.appendChild(root);

    // Setup mocks
    mockRender = jest.fn();
    mockRoot = { render: mockRender };
    mockCreateRoot = jest.fn().mockReturnValue(mockRoot);
    
    // Mock react-dom/client
    jest.doMock('react-dom/client', () => ({
      createRoot: mockCreateRoot
    }));
  });

  afterEach(() => {
    // Clean up
    if (document.body.contains(root)) {
      document.body.removeChild(root);
    }
    jest.clearAllMocks();
    jest.resetModules();
  });

  test('renders the app without crashing', () => {
    // Import the index file (this executes the code)
    require('../index');

    // Verify createRoot was called with the root element
    expect(mockCreateRoot).toHaveBeenCalledWith(root);

    // Verify render was called
    expect(mockRender).toHaveBeenCalled();
  });

  test('renders App component in StrictMode', () => {
    // Import the index file
    require('../index');

    const renderCall = mockRender.mock.calls[0][0];

    // Check that StrictMode wraps the App
    expect(renderCall.type).toBe(React.StrictMode);
    expect(renderCall.props.children.type.displayName).toBe('MockApp');
  });

  test('handles missing root element gracefully', () => {
    // Remove the root element
    document.body.removeChild(root);

    // Mock createRoot to throw when passed null
    mockCreateRoot.mockImplementation((element) => {
      if (!element) {
        throw new Error('Target container is not a DOM element.');
      }
      return mockRoot;
    });

    // When root element is null, createRoot will throw an error
    expect(() => {
      require('../index');
    }).toThrow('Target container is not a DOM element.');
  });
});