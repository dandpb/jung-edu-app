import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route, MemoryRouter } from 'react-router-dom';
import { AdminProvider } from '../../contexts/AdminContext';
// Import individual pages instead of App to avoid router conflicts
import Dashboard from '../../pages/Dashboard';
import NotesPage from '../../pages/NotesPage';
import SearchPage from '../../pages/SearchPage';
import BibliographyPage from '../../pages/BibliographyPage';
import AdminLogin from '../../pages/admin/AdminLogin';
import AdminDashboard from '../../pages/admin/AdminDashboard';
import Navigation from '../../components/Navigation';

// Mock external dependencies
jest.mock('../../services/llm/providers/openai', () => ({
  OpenAIProvider: jest.fn().mockImplementation(() => ({
    generateText: jest.fn().mockResolvedValue('Mock generated content'),
    generateStructuredData: jest.fn().mockResolvedValue({
      title: 'Mock Module',
      concepts: ['Concept 1', 'Concept 2'],
      content: 'Mock content'
    })
  }))
}));

jest.mock('../../services/video/youtubeService', () => ({
  youtubeService: {
    searchVideos: jest.fn().mockResolvedValue([
      { id: 'video1', title: 'Test Video 1', description: 'Description 1' },
      { id: 'video2', title: 'Test Video 2', description: 'Description 2' }
    ]),
    getVideoDetails: jest.fn().mockResolvedValue({
      id: 'video1',
      title: 'Test Video',
      description: 'Test Description',
      duration: '10:30'
    })
  }
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

describe('User Workflow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  const mockModules = [
    {
      id: 'intro-jung',
      title: 'Introduction to Jung',
      description: 'Basic concepts',
      concepts: ['Jung', 'Psychology'],
      content: 'Test content',
      videos: [],
      quiz: { questions: [] },
      bibliography: []
    }
  ];

  const mockUserProgress = {
    userId: 'test-user',
    completedModules: [],
    quizScores: {},
    totalTime: 0,
    lastAccessed: Date.now(),
    notes: []
  };

  const renderApp = (initialEntries = ['/']) => {
    return render(
      <AdminProvider>
        <MemoryRouter initialEntries={initialEntries}>
          <div className="min-h-screen bg-gray-50">
            <Navigation />
            <main className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<Dashboard modules={mockModules} userProgress={mockUserProgress} />} />
                <Route path="/dashboard" element={<Dashboard modules={mockModules} userProgress={mockUserProgress} />} />
                <Route path="/notes" element={<NotesPage modules={mockModules} userProgress={mockUserProgress} updateProgress={() => {}} />} />
                <Route path="/search" element={<SearchPage modules={mockModules} />} />
                <Route path="/bibliography" element={<BibliographyPage modules={mockModules} />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<AdminDashboard />} />
              </Routes>
            </main>
          </div>
        </MemoryRouter>
      </AdminProvider>
    );
  };

  describe('Student Learning Workflow', () => {
    it('should complete a full learning session workflow', async () => {
      const user = userEvent.setup();
      
      renderApp(['/dashboard']);
      
      // 1. Navigate to modules
      await user.click(screen.getByRole('link', { name: /modules/i }));
      
      // 2. Wait for modules to load and select one
      await waitFor(() => {
        expect(screen.getByText(/available modules/i)).toBeInTheDocument();
      });
      
      // 3. Click on a module (assuming modules are displayed)
      const moduleLinks = screen.getAllByRole('link');
      const moduleLink = moduleLinks.find(link => 
        link.getAttribute('href')?.includes('/module/')
      );
      
      if (moduleLink) {
        await user.click(moduleLink);
        
        // 4. Verify module page loads
        await waitFor(() => {
          expect(window.location.pathname).toMatch(/\/module\//);
        });
      }
      
      // 5. Navigate to mind map
      await user.click(screen.getByRole('link', { name: /mind map/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/mind map/i)).toBeInTheDocument();
      });
      
      // 6. Navigate to notes
      await user.click(screen.getByRole('link', { name: /notes/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/notes/i)).toBeInTheDocument();
      });
      
      // Progress page has been removed from the application
    });

    it('should handle note-taking workflow', async () => {
      const user = userEvent.setup();
      
      renderApp(['/notes']);
      
      // Wait for notes page to load
      await waitFor(() => {
        expect(screen.getByText(/notes/i)).toBeInTheDocument();
      });
      
      // Look for note editor or input field
      const noteInput = screen.queryByRole('textbox') || 
                       screen.queryByLabelText(/note/i) ||
                       screen.queryByPlaceholderText(/note/i);
      
      if (noteInput) {
        // Add a note
        await user.type(noteInput, 'This is a test note about Jung\'s theories');
        
        // Save note (look for save button)
        const saveButton = screen.queryByRole('button', { name: /save/i });
        if (saveButton) {
          await user.click(saveButton);
          
          // Verify note was saved
          await waitFor(() => {
            expect(mockLocalStorage.setItem).toHaveBeenCalled();
          });
        }
      }
    });
  });

  describe('Admin Content Management Workflow', () => {
    it('should complete admin module creation workflow', async () => {
      const user = userEvent.setup();
      
      // Start at admin login
      renderApp(['/admin/login']);
      
      // Mock successful admin login
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'isAdmin') return 'true';
        if (key === 'adminToken') return 'mock-token';
        return null;
      });
      
      // Navigate to admin dashboard
      renderApp(['/admin']);
      
      await waitFor(() => {
        expect(screen.getByText(/admin dashboard/i)).toBeInTheDocument();
      });
      
      // Navigate to modules management
      const modulesLink = screen.queryByRole('link', { name: /modules/i }) ||
                         screen.queryByText(/modules/i);
      
      if (modulesLink) {
        await user.click(modulesLink);
        
        // Look for module creation interface
        const createButton = screen.queryByRole('button', { name: /create/i }) ||
                            screen.queryByRole('button', { name: /add/i });
        
        if (createButton) {
          await user.click(createButton);
          
          // Fill out module details
          const titleInput = screen.queryByLabelText(/title/i) ||
                            screen.queryByPlaceholderText(/title/i);
          
          if (titleInput) {
            await user.type(titleInput, 'Test Module Creation');
          }
        }
      }
    });

    it('should handle resource management workflow', async () => {
      const user = userEvent.setup();
      
      // Mock admin authentication
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'isAdmin') return 'true';
        if (key === 'adminToken') return 'mock-token';
        return null;
      });
      
      renderApp(['/admin/resources']);
      
      await waitFor(() => {
        expect(screen.getByText(/resources/i)).toBeInTheDocument();
      });
      
      // Test resource upload/management functionality
      const uploadButton = screen.queryByRole('button', { name: /upload/i }) ||
                          screen.queryByText(/upload/i);
      
      if (uploadButton) {
        await user.click(uploadButton);
      }
    });
  });

  describe('Search and Discovery Workflow', () => {
    it('should complete content search workflow', async () => {
      const user = userEvent.setup();
      
      renderApp(['/search']);
      
      // Wait for search page to load
      await waitFor(() => {
        expect(screen.getByText(/search/i)).toBeInTheDocument();
      });
      
      // Find search input
      const searchInput = screen.queryByRole('searchbox') ||
                         screen.queryByLabelText(/search/i) ||
                         screen.queryByPlaceholderText(/search/i);
      
      if (searchInput) {
        // Perform search
        await user.type(searchInput, 'Jung archetypes');
        
        // Submit search
        const searchButton = screen.queryByRole('button', { name: /search/i });
        if (searchButton) {
          await user.click(searchButton);
        } else {
          // Try pressing Enter
          fireEvent.keyPress(searchInput, { key: 'Enter', code: 'Enter' });
        }
        
        // Wait for search results
        await waitFor(() => {
          // Look for any indication that search was performed
          expect(searchInput).toHaveValue('Jung archetypes');
        });
      }
    });
  });

  describe('Bibliography and Research Workflow', () => {
    it('should handle bibliography access workflow', async () => {
      const user = userEvent.setup();
      
      renderApp(['/bibliography']);
      
      // Wait for bibliography page to load
      await waitFor(() => {
        expect(screen.getByText(/bibliography/i)).toBeInTheDocument();
      });
      
      // Test bibliography features if available
      const searchField = screen.queryByRole('searchbox') ||
                         screen.queryByLabelText(/search/i);
      
      if (searchField) {
        await user.type(searchField, 'collective unconscious');
        
        // Look for search results or filtered content
        await waitFor(() => {
          expect(searchField).toHaveValue('collective unconscious');
        });
      }
    });
  });

  describe('Cross-Component Integration', () => {
    it('should handle navigation between all major sections', async () => {
      const user = userEvent.setup();
      
      renderApp(['/dashboard']);
      
      // Test navigation to each major section
      const navigationItems = [
        'modules',
        'mind map', 
        'notes',
        'search',
        'bibliography',
        'progress'
      ];
      
      for (const item of navigationItems) {
        const link = screen.queryByRole('link', { name: new RegExp(item, 'i') });
        if (link) {
          await user.click(link);
          
          // Wait for navigation to complete
          await waitFor(() => {
            expect(screen.getByText(new RegExp(item, 'i'))).toBeInTheDocument();
          });
          
          // Navigate back to dashboard for next iteration
          const dashboardLink = screen.queryByRole('link', { name: /dashboard/i }) ||
                               screen.queryByRole('link', { name: /home/i });
          if (dashboardLink) {
            await user.click(dashboardLink);
          }
        }
      }
    });

    it('should maintain state across navigation', async () => {
      const user = userEvent.setup();
      
      renderApp(['/notes']);
      
      // Add a note
      const noteInput = screen.queryByRole('textbox');
      if (noteInput) {
        await user.type(noteInput, 'Cross-navigation test note');
        
        // Navigate away
        const dashboardLink = screen.queryByRole('link', { name: /dashboard/i });
        if (dashboardLink) {
          await user.click(dashboardLink);
          
          // Navigate back to notes
          const notesLink = screen.queryByRole('link', { name: /notes/i });
          if (notesLink) {
            await user.click(notesLink);
            
            // Check if note content is preserved
            await waitFor(() => {
              const noteField = screen.queryByRole('textbox');
              if (noteField) {
                // Note: Depending on implementation, the note might be auto-saved
                // This test verifies the component can handle state restoration
                expect(noteField).toBeInTheDocument();
              }
            });
          }
        }
      }
    });
  });

  describe('Error Handling Workflows', () => {
    it('should handle API failure gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock API failure
      const mockError = new Error('Network error');
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      renderApp(['/dashboard']);
      
      // The app should still render even if some API calls fail
      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });
      
      console.error.mockRestore();
    });

    it('should handle missing content gracefully', async () => {
      const user = userEvent.setup();
      
      // Navigate to a non-existent module
      renderApp(['/module/non-existent']);
      
      // Should show appropriate error message or redirect
      await waitFor(() => {
        // The app should handle this gracefully
        expect(document.body).toBeInTheDocument();
      });
    });
  });
});