import React from 'react';
import { render, screen, waitFor, userEvent } from '../../../utils/test-utils';
import { act } from '@testing-library/react';
import AdminModules from '../AdminModules';
import { Module } from '../../../types';

// Mock the child components
jest.mock('../../../components/admin/ModuleEditor', () => ({
  __esModule: true,
  default: ({ module, onSave, onCancel }: any) => (
    <div data-testid="module-editor">
      <h2>Module Editor</h2>
      <p>{module.title}</p>
      <button onClick={() => onSave({ ...module, title: 'Updated Module' })}>Save</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  )
}));

jest.mock('../../../components/admin/QuizEditor', () => ({
  __esModule: true,
  default: () => <div data-testid="quiz-editor">Quiz Editor</div>
}));

// Mock the useAdmin hook
jest.mock('../../../contexts/AdminContext', () => ({
  ...jest.requireActual('../../../contexts/AdminContext'),
  useAdmin: jest.fn()
}));

const mockModules: Module[] = [
  {
    id: 'module-1',
    title: 'Introduction to Jung',
    description: 'Basic concepts of Jungian psychology',
    icon: '🧠',
    difficulty: 'beginner',
    estimatedTime: 30,
    prerequisites: [],
    content: {
      introduction: 'This module introduces the fundamental concepts of Carl Jung\'s analytical psychology.',
      sections: [
        { id: 'section-1', title: 'The Psyche', content: 'Content about the psyche', keyTerms: [{ term: 'psyche', definition: 'The totality of mind' }, { term: 'consciousness', definition: 'Aware state' }] },
        { id: 'section-2', title: 'The Unconscious', content: 'Content about unconscious', keyTerms: [{ term: 'unconscious', definition: 'Hidden mind' }] }
      ],
      quiz: {
        id: 'quiz-1',
        title: 'Module Quiz',
        questions: [
          {
            id: 'q1',
            question: 'What is the psyche?',
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: 0,
            explanation: 'The psyche is...'
          }
        ]
      },
      videos: [
        { id: 'video1', title: 'Video 1', youtubeId: 'abc123', description: 'First video', duration: 300 },
        { id: 'video2', title: 'Video 2', youtubeId: 'def456', description: 'Second video', duration: 400 }
      ],
      bibliography: [],
      films: []
    }
  },
  {
    id: 'module-2',
    title: 'The Shadow',
    description: 'Understanding the shadow concept',
    icon: '🌑',
    difficulty: 'intermediate',
    estimatedTime: 45,
    prerequisites: ['module-1'],
    content: {
      introduction: 'The shadow represents the parts of ourselves we deny or repress.',
      sections: [
        { id: 'section-3', title: 'What is the Shadow?', content: 'Shadow content', keyTerms: [] }
      ],
      quiz: undefined,
      videos: [],
      bibliography: [],
      films: []
    }
  },
  {
    id: 'module-3',
    title: 'Individuation Process',
    description: 'The journey to wholeness',
    icon: '🔮',
    difficulty: 'advanced',
    estimatedTime: 60,
    prerequisites: ['module-1', 'module-2'],
    content: {
      introduction: 'Individuation is the process of psychological integration.',
      sections: [],
      quiz: {
        id: 'quiz-3',
        title: 'Individuation Quiz',
        questions: []
      },
      videos: [],
      bibliography: [],
      films: []
    }
  }
];

const mockUpdateModules = jest.fn();

const mockUseAdmin = () => ({
  isAdmin: true,
  currentAdmin: { username: 'admin', role: 'admin', lastLogin: Date.now() },
  login: jest.fn(),
  logout: jest.fn(),
  modules: mockModules,
  updateModules: mockUpdateModules,
});

describe('AdminModules Component', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    const { useAdmin } = require('../../../contexts/AdminContext');
    (useAdmin as jest.Mock).mockReturnValue(mockUseAdmin());
    // Mock window.confirm
    window.confirm = jest.fn(() => true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders admin modules page with correct title and description', () => {
    render(<AdminModules />);
    
    expect(screen.getByText('Gerenciar Módulos')).toBeInTheDocument();
    expect(screen.getByText('Criar e editar módulos de aprendizagem, seções e questionários')).toBeInTheDocument();
  });

  test('renders add module button', () => {
    render(<AdminModules />);
    
    const addButton = screen.getByRole('button', { name: /Adicionar Módulo/i });
    expect(addButton).toBeInTheDocument();
    expect(addButton).toHaveClass('btn-primary');
  });

  test('displays all modules with correct information', () => {
    render(<AdminModules />);
    
    // Check module titles
    expect(screen.getByText('Introduction to Jung')).toBeInTheDocument();
    expect(screen.getByText('The Shadow')).toBeInTheDocument();
    expect(screen.getByText('Individuation Process')).toBeInTheDocument();
    
    // Check descriptions
    expect(screen.getByText('Basic concepts of Jungian psychology')).toBeInTheDocument();
    expect(screen.getByText('Understanding the shadow concept')).toBeInTheDocument();
    expect(screen.getByText('The journey to wholeness')).toBeInTheDocument();
    
    // Check icons
    expect(screen.getByText('🧠')).toBeInTheDocument();
    expect(screen.getByText('🌑')).toBeInTheDocument();
    expect(screen.getByText('🔮')).toBeInTheDocument();
    
    // Check difficulty badges
    expect(screen.getByText('beginner')).toBeInTheDocument();
    expect(screen.getByText('intermediate')).toBeInTheDocument();
    expect(screen.getByText('advanced')).toBeInTheDocument();
  });

  test('displays module metadata correctly', () => {
    render(<AdminModules />);
    
    // Check estimated time
    expect(screen.getByText('30 min')).toBeInTheDocument();
    expect(screen.getByText('45 min')).toBeInTheDocument();
    expect(screen.getByText('60 min')).toBeInTheDocument();
    
    // Check sections count
    expect(screen.getByText('2 seções')).toBeInTheDocument();
    expect(screen.getByText('1 seções')).toBeInTheDocument();
    expect(screen.getByText('0 seções')).toBeInTheDocument();
    
    // Check questions count (only for modules with quizzes)
    expect(screen.getByText('1 questões')).toBeInTheDocument();
  });

  test('difficulty badges have correct styling', () => {
    render(<AdminModules />);
    
    const beginnerBadge = screen.getByText('beginner');
    expect(beginnerBadge).toHaveClass('text-green-600', 'bg-green-50');
    
    const intermediateBadge = screen.getByText('intermediate');
    expect(intermediateBadge).toHaveClass('text-yellow-600', 'bg-yellow-50');
    
    const advancedBadge = screen.getByText('advanced');
    expect(advancedBadge).toHaveClass('text-red-600', 'bg-red-50');
  });

  test('expanding module shows additional details', async () => {
    const { user } = render(<AdminModules />);
    
    // Initially, expanded content should not be visible
    expect(screen.queryByText('This module introduces the fundamental concepts')).not.toBeInTheDocument();
    
    // Click expand button for first module
    const expandButtons = screen.getAllByRole('button').filter(btn => 
      btn.querySelector('.lucide-chevron-right')
    );
    
    await act(async () => {
      await user.click(expandButtons[0]);
    });
    
    // Now expanded content should be visible
    await waitFor(() => {
      expect(screen.getByText(/This module introduces the fundamental concepts/)).toBeInTheDocument();
    });
    expect(screen.getByText('Introdução')).toBeInTheDocument();
    expect(screen.getByText('Seções')).toBeInTheDocument();
    expect(screen.getByText('1.')).toBeInTheDocument();
    expect(screen.getByText('The Psyche')).toBeInTheDocument();
    expect(screen.getByText('(2 termos)')).toBeInTheDocument();
  });

  test('collapsing expanded module hides details', async () => {
    const { user } = render(<AdminModules />);
    
    // Expand first module
    const expandButtons = screen.getAllByRole('button').filter(btn => 
      btn.querySelector('.lucide-chevron-right')
    );
    
    await act(async () => {
      await user.click(expandButtons[0]);
    });
    
    // Verify it's expanded
    await waitFor(() => {
      expect(screen.getByText(/This module introduces the fundamental concepts/)).toBeInTheDocument();
    });
    
    // Click to collapse (now it should show ChevronDown)
    const collapseButtons = screen.getAllByRole('button').filter(btn => 
      btn.querySelector('.lucide-chevron-down')
    );
    
    await act(async () => {
      await user.click(collapseButtons[0]);
    });
    
    // Content should be hidden again
    await waitFor(() => {
      expect(screen.queryByText(/This module introduces the fundamental concepts/)).not.toBeInTheDocument();
    });
  });

  test('displays prerequisites for modules that have them', async () => {
    const { user } = render(<AdminModules />);
    
    // Expand the third module which has prerequisites
    const expandButtons = screen.getAllByRole('button').filter(btn => 
      btn.querySelector('.lucide-chevron-right')
    );
    
    await act(async () => {
      await user.click(expandButtons[2]);
    });
    
    // Check prerequisites section
    await waitFor(() => {
      expect(screen.getByText('Pré-requisitos')).toBeInTheDocument();
    });
    // Should show the prerequisite module titles
    expect(screen.getAllByText('Introduction to Jung').length).toBeGreaterThan(1);
    expect(screen.getAllByText('The Shadow').length).toBeGreaterThan(1);
  });

  test('clicking add module button opens module editor for new module', async () => {
    const { user } = render(<AdminModules />);
    
    const addButton = screen.getByRole('button', { name: /Adicionar Módulo/i });
    
    await act(async () => {
      await user.click(addButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Module Editor')).toBeInTheDocument();
    });
    expect(screen.getByTestId('module-editor')).toBeInTheDocument();
    expect(screen.getByText('Novo Módulo')).toBeInTheDocument();
  });

  test('clicking edit button opens module editor with existing module', async () => {
    const { user } = render(<AdminModules />);
    
    const editButtons = screen.getAllByRole('button').filter(btn => 
      btn.querySelector('svg') && btn.querySelector('svg')?.parentElement === btn && 
      !btn.textContent && 
      btn.className.includes('text-gray-600') &&
      btn.className.includes('hover:text-primary-600')
    );
    
    await act(async () => {
      await user.click(editButtons[0]);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Module Editor')).toBeInTheDocument();
    });
    expect(screen.getByTestId('module-editor')).toBeInTheDocument();
    // Check within the module editor specifically to avoid duplicates
    const moduleEditor = screen.getByTestId('module-editor');
    expect(moduleEditor).toHaveTextContent('Introduction to Jung');
  });

  test('saving edited module updates the modules list', async () => {
    const { user } = render(<AdminModules />);
    
    // Click edit on first module
    const editButtons = screen.getAllByRole('button').filter(btn => 
      btn.querySelector('svg') && btn.querySelector('svg')?.parentElement === btn && 
      !btn.textContent && 
      btn.className.includes('text-gray-600') &&
      btn.className.includes('hover:text-primary-600')
    );
    
    await act(async () => {
      await user.click(editButtons[0]);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Module Editor')).toBeInTheDocument();
    });
    
    // Click save in the editor
    const saveButton = screen.getByRole('button', { name: 'Save' });
    
    await act(async () => {
      await user.click(saveButton);
    });
    
    // Verify updateModules was called with updated module
    await waitFor(() => {
      expect(mockUpdateModules).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ title: 'Updated Module' })
        ])
      );
    });
  });

  test('canceling module editor closes it without saving', async () => {
    const { user } = render(<AdminModules />);
    
    // Open editor
    const addButton = screen.getByRole('button', { name: /Adicionar Módulo/i });
    
    await act(async () => {
      await user.click(addButton);
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('module-editor')).toBeInTheDocument();
    });
    
    // Click cancel
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    
    await act(async () => {
      await user.click(cancelButton);
    });
    
    // Editor should be closed
    await waitFor(() => {
      expect(screen.queryByTestId('module-editor')).not.toBeInTheDocument();
    });
    // updateModules should not have been called
    expect(mockUpdateModules).not.toHaveBeenCalled();
  });

  test('deleting a module shows confirmation and removes it', async () => {
    const { user } = render(<AdminModules />);
    
    // Click delete button on first module
    const deleteButtons = screen.getAllByRole('button').filter(btn => 
      btn.querySelector('svg') && btn.querySelector('svg')?.parentElement === btn && 
      !btn.textContent && 
      btn.className.includes('text-gray-600') &&
      btn.className.includes('hover:text-red-600')
    );
    
    expect(deleteButtons.length).toBeGreaterThan(0);
    
    await user.click(deleteButtons[0]);
    
    // Verify confirmation was shown
    expect(window.confirm).toHaveBeenCalledWith('Tem certeza que deseja excluir este módulo?');
    
    // Verify updateModules was called without the deleted module
    expect(mockUpdateModules).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: 'module-2' }),
        expect.objectContaining({ id: 'module-3' })
      ])
    );
    
    const updatedModules = mockUpdateModules.mock.calls[0][0];
    expect(updatedModules).not.toContainEqual(
      expect.objectContaining({ id: 'module-1' })
    );
  });

  test('canceling delete confirmation does not delete module', async () => {
    window.confirm = jest.fn(() => false);
    const { user } = render(<AdminModules />);
    
    const deleteButtons = screen.getAllByRole('button').filter(btn => 
      btn.querySelector('svg') && btn.querySelector('svg')?.parentElement === btn && 
      !btn.textContent && 
      btn.className.includes('text-gray-600') &&
      btn.className.includes('hover:text-red-600')
    );
    
    await act(async () => {
      await user.click(deleteButtons[0]);
    });
    
    // updateModules should not have been called
    expect(mockUpdateModules).not.toHaveBeenCalled();
  });

  test('handles empty modules list gracefully', () => {
    const { useAdmin } = require('../../../contexts/AdminContext');
    (useAdmin as jest.Mock).mockReturnValue({
      ...mockUseAdmin(),
      modules: []
    });
    
    render(<AdminModules />);
    
    expect(screen.getByText('Gerenciar Módulos')).toBeInTheDocument();
    // Should still show the add button
    expect(screen.getByRole('button', { name: /Adicionar Módulo/i })).toBeInTheDocument();
  });

  test('creating a new module adds it to the list', async () => {
    const { user } = render(<AdminModules />);
    
    // Click add module
    const addButton = screen.getByRole('button', { name: /Adicionar Módulo/i });
    
    await act(async () => {
      await user.click(addButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Module Editor')).toBeInTheDocument();
    });
    
    // Save the new module
    const saveButton = screen.getByRole('button', { name: 'Save' });
    
    await act(async () => {
      await user.click(saveButton);
    });
    
    // Verify updateModules was called with all existing modules plus the new one
    await waitFor(() => {
      expect(mockUpdateModules).toHaveBeenCalledWith(
        expect.arrayContaining([
          ...mockModules,
          expect.objectContaining({ title: 'Updated Module' })
        ])
      );
    });
  });
});