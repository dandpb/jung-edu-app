import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import VideoPlayer from '../VideoPlayer';
import { Video } from '../../../types';

// Mock react-youtube
jest.mock('react-youtube', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ videoId, onReady }: any) => {
      // Call onReady immediately with a mock event
      React.useEffect(() => {
        if (onReady) {
          onReady({ target: { getDuration: () => 300 } });
        }
      }, [onReady]);
      
      return React.createElement('div', {
        'data-testid': 'youtube-player',
        'data-video-id': videoId
      }, 'YouTube Player Mock');
    }
  };
});

const mockVideo: Video = {
  id: 'video-1',
  title: 'Introduction to Jung',
  youtubeId: 'abc123',
  description: 'Learn about Carl Jung and his theories',
  duration: 300 // 5 minutes
};

describe('VideoPlayer Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders video player with title and description', () => {
    render(<VideoPlayer video={mockVideo} />);

    expect(screen.getByText('Introduction to Jung')).toBeInTheDocument();
    expect(screen.getByText('Learn about Carl Jung and his theories')).toBeInTheDocument();
  });

  test('displays video duration', () => {
    render(<VideoPlayer video={mockVideo} />);

    expect(screen.getByText('Duration: 5:00')).toBeInTheDocument();
  });

  test('renders YouTube player with correct video ID', () => {
    render(<VideoPlayer video={mockVideo} />);

    const player = screen.getByTestId('youtube-player');
    expect(player).toHaveAttribute('data-video-id', 'abc123');
  });

  test('formats duration correctly for different times', () => {
    const testCases = [
      { duration: 60, expected: '1:00' },
      { duration: 90, expected: '1:30' },
      { duration: 3600, expected: '60:00' },
      { duration: 3661, expected: '61:01' }
    ];

    testCases.forEach(({ duration, expected }) => {
      const { rerender } = render(
        <VideoPlayer video={{ ...mockVideo, duration }} />
      );

      expect(screen.getByText(`Duration: ${expected}`)).toBeInTheDocument();
      
      rerender(<></>); // Clean up for next iteration
    });
  });

  test('renders YouTube player component', () => {
    render(<VideoPlayer video={mockVideo} />);

    // The component should render the YouTube player mock
    expect(screen.getByTestId('youtube-player')).toBeInTheDocument();
    expect(screen.getByText('YouTube Player Mock')).toBeInTheDocument();
  });

  test('handles videos without description', () => {
    const videoWithoutDesc = {
      ...mockVideo,
      description: ''
    };

    render(<VideoPlayer video={videoWithoutDesc} />);

    expect(screen.getByText('Introduction to Jung')).toBeInTheDocument();
    // Check that no description paragraph is rendered when description is empty
    const descriptionElement = screen.queryByText('Learn about Carl Jung and his theories');
    expect(descriptionElement).not.toBeInTheDocument();
  });

  test('renders with responsive aspect ratio', () => {
    const { container } = render(<VideoPlayer video={mockVideo} />);

    // Check for aspect ratio wrapper
    const aspectWrapper = container.querySelector('.aspect-w-16');
    expect(aspectWrapper).toBeInTheDocument();
  });
});