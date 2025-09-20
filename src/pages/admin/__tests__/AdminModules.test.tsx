import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Module } from '../../../types';

// Mock ALL dependencies BEFORE importing the component
jest.mock('lucide-react', () => {
  const React = require('react');
  return {
    Plus: ({ className }: any) => React.createElement('div', { 'data-testid': 'plus-icon', className }, 'Plus'),
    Edit2: ({ className }: any) => React.createElement('div', { 'data-testid': 'edit-icon', className }, 'Edit2'),
    Trash2: ({ className }: any) => React.createElement('div', { 'data-testid': 'trash-icon', className }, 'Trash2'),
    ChevronDown: ({ className }: any) => React.createElement('div', { 'data-testid': 'chevron-down', className }, 'ChevronDown'),
    ChevronRight: ({ className }: any) => React.createElement('div', { 'data-testid': 'chevron-right', className }, 'ChevronRight'),
    Clock: ({ className }: any) => React.createElement('div', { 'data-testid': 'clock-icon', className }, 'Clock'),
    BookOpen: ({ className }: any) => React.createElement('div', { 'data-testid': 'book-icon', className }, 'BookOpen'),
    FileText: ({ className }: any) => React.createElement('div', { 'data-testid': 'file-text-icon', className }, 'FileText'),
    Sparkles: ({ className }: any) => React.createElement('div', { 'data-testid': 'sparkles-icon', className }, 'Sparkles'),
    LogOut: ({ className }: any) => React.createElement('div', { 'data-testid': 'logout-icon', className }, 'LogOut'),
  };
});

jest.mock('../../../components/admin/AdminNavigation', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function AdminNavigation() {
      return React.createElement('nav', { 'data-testid': 'admin-navigation' }, 'Admin Navigation');
    }
  };
});

jest.mock('../../../components/admin/ModuleEditor', () => {
  const React = require('react');
  return function ModuleEditor({ module, onSave, onCancel }: any) {
    return React.createElement('div', { 'data-testid': 'module-editor' }, [
      React.createElement('h2', { key: 'title' }, 'Module Editor'),
      React.createElement('p', { key: 'module-title' }, module.title),
      React.createElement('button', { key: 'save', onClick: () => onSave({ ...module, title: 'Updated Module' }) }, 'Save'),
      React.createElement('button', { key: 'cancel', onClick: onCancel }, 'Cancel')
    ]);
  };
});

jest.mock('../../../components/admin/AIModuleGenerator', () => {
  const React = require('react');
  return function AIModuleGenerator() {
    return React.createElement('div', { 'data-testid': 'ai-module-generator' }, 'AI Module Generator');
  };
});

jest.mock('../../../components/admin/AutomaticQuizGenerator', () => {
  const React = require('react');
  return function AutomaticQuizGenerator() {
    return React.createElement('div', { 'data-testid': 'automatic-quiz-generator' }, 'Automatic Quiz Generator');
  };
});

jest.mock('../../../components/admin/GenerationProgress', () => {
  const React = require('react');
  return function GenerationProgress() {
    return React.createElement('div', { 'data-testid': 'generation-progress' }, 'Generation Progress');
  };
});

jest.mock('../../../components/admin/ModulePreview', () => {
  const React = require('react');
  return function ModulePreview() {
    return React.createElement('div', { 'data-testid': 'module-preview' }, 'Module Preview');
  };
});

jest.mock('../../../hooks/useModuleGenerator', () => ({
  useModuleGenerator: () => ({
    isGenerating: false,
    generatedModule: null,
    generationSteps: [],
    currentStep: 0,
    error: null,
    generateModule: jest.fn(),
    regenerateSection: jest.fn(),
    updateGeneratedModule: jest.fn(),
    reset: jest.fn(),
    clearGeneratedModule: jest.fn(),
    retryGeneration: jest.fn()
  })
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
        { id: 'section-1', title: 'The Psyche', content: 'Content about the psyche', keyTerms: [{ term: 'psyche', definition: 'The totality of mind' }] },
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
  }
];

const mockUpdateModules = jest.fn();

jest.mock('../../../contexts/AdminContext', () => ({
  useAdmin: () => ({
    isAdmin: true,
    currentAdmin: { id: 'admin-1', username: 'admin', password: 'hashed-password', role: 'admin', lastLogin: Date.now() },
    login: jest.fn(),
    logout: jest.fn(),
    modules: mockModules,
    updateModules: mockUpdateModules,
  })
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Now import the component
import AdminModules from '../AdminModules';

describe('AdminModules Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    window.confirm = jest.fn(() => true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders admin modules page with correct title and description', () => {
    render(
      <BrowserRouter>
        <AdminModules />
      </BrowserRouter>
    );

    expect(screen.getByText('Gerenciar Módulos')).toBeInTheDocument();
    expect(screen.getByText('Criar e editar módulos de aprendizagem, seções e questionários')).toBeInTheDocument();
  });

  test('renders admin navigation', () => {
    render(
      <BrowserRouter>
        <AdminModules />
      </BrowserRouter>
    );

    expect(screen.getByTestId('admin-navigation')).toBeInTheDocument();
  });

  test('displays modules with correct information', () => {
    render(
      <BrowserRouter>
        <AdminModules />
      </BrowserRouter>
    );

    expect(screen.getByText('Introduction to Jung')).toBeInTheDocument();
    expect(screen.getByText('Basic concepts of Jungian psychology')).toBeInTheDocument();
    expect(screen.getByText('🧠')).toBeInTheDocument();
    expect(screen.getByText('beginner')).toBeInTheDocument();
  });

  test('renders add module button', () => {
    render(
      <BrowserRouter>
        <AdminModules />
      </BrowserRouter>
    );

    const addButton = screen.getByRole('button', { name: /Adicionar Módulo/i });
    expect(addButton).toBeInTheDocument();
  });

  test('clicking add module button opens module editor', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <AdminModules />
      </BrowserRouter>
    );

    const addButton = screen.getByRole('button', { name: /Adicionar Módulo/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByTestId('module-editor')).toBeInTheDocument();
    });
  });
});
