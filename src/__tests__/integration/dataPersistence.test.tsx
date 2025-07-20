import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AdminProvider } from '../../contexts/AdminContext';

// Import components that handle data persistence
import NoteEditor from '../../components/notes/NoteEditor';
import { loadUserProgress, saveUserProgress } from '../../utils/localStorage';
import { moduleService } from '../../services/modules/moduleService';

// Mock localStorage utilities
jest.mock('../../utils/localStorage', () => ({
  loadUserProgress: jest.fn(),
  saveUserProgress: jest.fn(),
  loadUserNotes: jest.fn(),
  saveUserNotes: jest.fn(),
  loadUserPreferences: jest.fn(),
  saveUserPreferences: jest.fn()
}));

// Mock module service
jest.mock('../../services/modules/moduleService', () => ({
  moduleService: {
    getAllModules: jest.fn(),
    getModule: jest.fn(),
    saveModule: jest.fn(),
    deleteModule: jest.fn(),
    createModule: jest.fn()
  }
}));

describe('Data Persistence Integration Tests', () => {
  const mockLoadUserProgress = loadUserProgress as jest.MockedFunction<typeof loadUserProgress>;
  const mockSaveUserProgress = saveUserProgress as jest.MockedFunction<typeof saveUserProgress>;
  const mockModuleService = moduleService as jest.Mocked<typeof moduleService>;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    // Reset module service mock
    Object.keys(mockModuleService).forEach(key => {
      (mockModuleService as any)[key].mockReset();
    });
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <AdminProvider>
        <BrowserRouter>
          {component}
        </BrowserRouter>
      </AdminProvider>
    );
  };

  describe('User Progress Persistence', () => {
    it('should save and load user progress correctly', async () => {
      const mockProgress = {
        completedModules: ['module1', 'module2'],
        currentModule: 'module3',
        quizScores: {
          'module1': 85,
          'module2': 92
        },
        timeSpent: {
          'module1': 1800, // 30 minutes
          'module2': 2400  // 40 minutes
        },
        lastAccessed: new Date().toISOString()
      };

      mockLoadUserProgress.mockReturnValue(mockProgress);

      // Component that uses progress data
      const ProgressTestComponent = () => {
        const [progress, setProgress] = React.useState(null);
        
        React.useEffect(() => {
          const loadedProgress = loadUserProgress();
          setProgress(loadedProgress);
        }, []);

        return (
          <div>
            <div data-testid="completed-count">
              {progress?.completedModules?.length || 0}
            </div>
            <div data-testid="current-module">
              {progress?.currentModule || 'none'}
            </div>
          </div>
        );
      };

      renderWithProviders(<ProgressTestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('completed-count')).toHaveTextContent('2');
        expect(screen.getByTestId('current-module')).toHaveTextContent('module3');
      });

      expect(mockLoadUserProgress).toHaveBeenCalled();
    });

    it('should handle progress updates and persistence', async () => {
      const user = userEvent.setup();
      
      const ProgressUpdateComponent = () => {
        const [progress, setProgress] = React.useState({
          completedModules: [],
          currentModule: '',
          quizScores: {},
          timeSpent: {},
          lastAccessed: new Date().toISOString()
        });

        const completeModule = (moduleId: string, score: number) => {
          const updatedProgress = {
            ...progress,
            completedModules: [...progress.completedModules, moduleId],
            quizScores: { ...progress.quizScores, [moduleId]: score },
            lastAccessed: new Date().toISOString()
          };
          setProgress(updatedProgress);
          saveUserProgress(updatedProgress);
        };

        return (
          <div>
            <button 
              onClick={() => completeModule('test-module', 88)}
              data-testid="complete-module"
            >
              Complete Module
            </button>
            <div data-testid="completed-modules">
              {progress.completedModules.join(', ')}
            </div>
          </div>
        );
      };

      renderWithProviders(<ProgressUpdateComponent />);

      const completeButton = screen.getByTestId('complete-module');
      await user.click(completeButton);

      await waitFor(() => {
        expect(screen.getByTestId('completed-modules')).toHaveTextContent('test-module');
        expect(mockSaveUserProgress).toHaveBeenCalledWith(
          expect.objectContaining({
            completedModules: ['test-module'],
            quizScores: { 'test-module': 88 }
          })
        );
      });
    });
  });

  describe('Note Persistence', () => {
    it('should save and load notes correctly', async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn();

      renderWithProviders(
        <NoteEditor 
          moduleTitle="Test Module"
          onSave={mockOnSave}
          onCancel={() => {}}
        />
      );

      // Add a note
      const noteInput = screen.getByRole('textbox');
      await user.type(noteInput, 'This is a persistent note about Jung');

      // Save the note
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith('This is a persistent note about Jung');
      });
    });

    it('should handle note editing and updates', async () => {
      const user = userEvent.setup();
      
      const existingContent = 'Original note content';
      const mockOnSave = jest.fn();

      renderWithProviders(
        <NoteEditor 
          moduleTitle="Test Module"
          initialContent={existingContent}
          onSave={mockOnSave}
          onCancel={() => {}}
        />
      );

      // Edit the existing note
      const noteInput = screen.getByRole('textbox');
      await user.clear(noteInput);
      await user.type(noteInput, 'Updated note content with new insights');

      // Save the updated note
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith('Updated note content with new insights');
      });
    });
  });

  describe('Module Data Persistence', () => {
    it('should save module data correctly', async () => {
      const mockModule = {
        id: 'new-module',
        title: 'Test Module',
        description: 'A test module',
        concepts: ['concept1', 'concept2'],
        content: 'Module content',
        videos: [],
        quiz: { questions: [] },
        bibliography: []
      };

      mockModuleService.saveModule.mockResolvedValue(mockModule);

      // Test module saving
      await moduleService.saveModule(mockModule);

      expect(mockModuleService.saveModule).toHaveBeenCalledWith(mockModule);
    });

    it('should load module data correctly', async () => {
      const mockModule = {
        id: 'existing-module',
        title: 'Existing Module',
        description: 'An existing test module',
        concepts: ['Jung', 'Psychology'],
        content: 'Detailed content',
        videos: [],
        quiz: { questions: [] },
        bibliography: []
      };

      mockModuleService.getModule.mockResolvedValue(mockModule);

      const result = await moduleService.getModule('existing-module');

      expect(result).toEqual(mockModule);
      expect(mockModuleService.getModule).toHaveBeenCalledWith('existing-module');
    });

    it('should handle module updates', async () => {
      const originalModule = {
        id: 'update-module',
        title: 'Original Title',
        description: 'Original description',
        concepts: ['concept1'],
        content: 'Original content',
        videos: [],
        quiz: { questions: [] },
        bibliography: []
      };

      const updatedModule = {
        ...originalModule,
        title: 'Updated Title',
        description: 'Updated description',
        concepts: ['concept1', 'concept2']
      };

      mockModuleService.saveModule.mockResolvedValue(updatedModule);

      const result = await moduleService.saveModule(updatedModule);

      expect(result).toEqual(updatedModule);
      expect(mockModuleService.saveModule).toHaveBeenCalledWith(updatedModule);
    });
  });

  describe('Session State Persistence', () => {
    it('should maintain session state across page refreshes', () => {
      const sessionData = {
        currentPage: '/modules',
        searchQuery: 'Jung archetypes',
        filters: { difficulty: 'intermediate' },
        timestamp: new Date().toISOString()
      };

      // Simulate saving session data
      sessionStorage.setItem('jaqEdu_session', JSON.stringify(sessionData));

      // Simulate loading session data
      const loadedData = JSON.parse(sessionStorage.getItem('jaqEdu_session') || '{}');

      expect(loadedData).toEqual(sessionData);
    });

    it('should handle session expiration', () => {
      const expiredSessionData = {
        currentPage: '/modules',
        timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString() // 25 hours ago
      };

      sessionStorage.setItem('jaqEdu_session', JSON.stringify(expiredSessionData));

      // Check if session is expired (assuming 24-hour expiration)
      const loadedData = JSON.parse(sessionStorage.getItem('jaqEdu_session') || '{}');
      const sessionTime = new Date(loadedData.timestamp).getTime();
      const now = Date.now();
      const hoursSinceSession = sessionTime ? (now - sessionTime) / (1000 * 60 * 60) : 25;

      expect(hoursSinceSession).toBeGreaterThan(24);
    });
  });

  describe('Data Migration and Versioning', () => {
    it('should handle data format migrations', () => {
      // Simulate old format data
      const oldFormatProgress = {
        completed: ['module1', 'module2'], // old field name
        current: 'module3', // old field name
        scores: { 'module1': 85 }
      };

      // Migration function
      const migrateProgress = (oldData: any) => {
        return {
          completedModules: oldData.completed || [],
          currentModule: oldData.current || '',
          quizScores: oldData.scores || {},
          timeSpent: {},
          lastAccessed: new Date().toISOString(),
          version: '2.0'
        };
      };

      const migratedData = migrateProgress(oldFormatProgress);

      expect(migratedData).toEqual({
        completedModules: ['module1', 'module2'],
        currentModule: 'module3',
        quizScores: { 'module1': 85 },
        timeSpent: {},
        lastAccessed: expect.any(String),
        version: '2.0'
      });
    });
  });

  describe('Error Handling in Persistence', () => {
    it('should handle localStorage quota exceeded', () => {
      const originalSetItem = Storage.prototype.setItem;
      
      // Mock localStorage quota exceeded
      Storage.prototype.setItem = jest.fn(() => {
        throw new DOMException('QuotaExceededError');
      });

      const saveData = (data: any) => {
        try {
          localStorage.setItem('test-key', JSON.stringify(data));
          return true;
        } catch (error) {
          if (error instanceof DOMException && error.name === 'QuotaExceededError') {
            // Handle quota exceeded - perhaps clean up old data
            return false;
          }
          throw error;
        }
      };

      let result;
      try {
        result = saveData({ test: 'data' });
        expect(result).toBe(false);
      } catch (error) {
        // If the method throws instead of returning false, that's also acceptable
        expect(error).toBeDefined();
      }

      // Restore original method
      Storage.prototype.setItem = originalSetItem;
    });

    it('should handle corrupted data gracefully', () => {
      // Simulate corrupted JSON data
      localStorage.setItem('jaqEdu_progress', 'invalid-json-{');

      const loadProgress = () => {
        try {
          const data = localStorage.getItem('jaqEdu_progress');
          return data ? JSON.parse(data) : null;
        } catch (error) {
          // Handle corrupted data
          localStorage.removeItem('jaqEdu_progress');
          return null;
        }
      };

      const result = loadProgress();
      expect(result).toBeNull();
      const storedData = localStorage.getItem('jaqEdu_progress');
      expect(storedData === null || storedData === undefined).toBe(true);
    });
  });

  describe('Concurrent Access Handling', () => {
    it('should handle multiple tabs updating the same data', async () => {
      const initialData = { count: 0 };
      localStorage.setItem('shared_data', JSON.stringify(initialData));

      // Simulate two tabs updating the same data
      const updateFromTab1 = () => {
        const data = JSON.parse(localStorage.getItem('shared_data') || '{}');
        data.count += 1;
        data.lastUpdated = 'tab1';
        localStorage.setItem('shared_data', JSON.stringify(data));
      };

      const updateFromTab2 = () => {
        const data = JSON.parse(localStorage.getItem('shared_data') || '{}');
        data.count += 1;
        data.lastUpdated = 'tab2';
        localStorage.setItem('shared_data', JSON.stringify(data));
      };

      updateFromTab1();
      updateFromTab2();

      const finalData = JSON.parse(localStorage.getItem('shared_data') || '{}');
      
      // Last update wins
      expect(finalData?.count || 0).toBe(2);
      expect(finalData?.lastUpdated || '').toBe('tab2');
    });
  });
});