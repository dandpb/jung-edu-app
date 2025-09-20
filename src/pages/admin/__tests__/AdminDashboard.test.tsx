import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Module, AdminUser } from '../../../types';

// Mock ALL dependencies BEFORE importing the component
jest.mock('lucide-react', () => {
  const React = require('react');
  return {
    BookOpen: ({ className }: any) => React.createElement('div', { 'data-testid': 'book-icon', className }, 'BookOpen'),
    HelpCircle: ({ className }: any) => React.createElement('div', { 'data-testid': 'help-icon', className }, 'HelpCircle'),
    Video: ({ className }: any) => React.createElement('div', { 'data-testid': 'video-icon', className }, 'Video'),
    Users: ({ className }: any) => React.createElement('div', { 'data-testid': 'users-icon', className }, 'Users'),
    Settings: ({ className }: any) => React.createElement('div', { 'data-testid': 'settings-icon', className }, 'Settings'),
    FileText: ({ className }: any) => React.createElement('div', { 'data-testid': 'file-icon', className }, 'FileText'),
    ArrowRight: ({ className }: any) => React.createElement('div', { 'data-testid': 'arrow-icon', className }, 'ArrowRight'),
    Plus: ({ className }: any) => React.createElement('div', { 'data-testid': 'plus-icon', className }, 'Plus'),
    Library: ({ className }: any) => React.createElement('div', { 'data-testid': 'library-icon', className }, 'Library'),
    BarChart3: ({ className }: any) => React.createElement('div', { 'data-testid': 'chart-icon', className }, 'BarChart3'),
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

const mockModules: Module[] = [
  {
    id: 'module-1',
    title: 'Test Module 1',
    description: 'Test description 1',
    category: 'Fundamental Concepts',
    difficulty: 'beginner',
    estimatedTime: 30,
    prerequisites: [],
    content: {
      introduction: 'Test introduction',
      sections: [],
      quiz: {
        id: 'quiz-1',
        title: 'Test Quiz',
        questions: []
      },
      videos: ['video1', 'video2'],
      bibliography: [],
      films: []
    },
    order: 1
  },
  {
    id: 'module-2',
    title: 'Test Module 2',
    description: 'Test description 2',
    category: 'Clinical Applications',
    difficulty: 'intermediate',
    estimatedTime: 45,
    prerequisites: ['module-1'],
    content: {
      introduction: 'Test introduction 2',
      sections: [],
      quiz: {
        id: 'quiz-2',
        title: 'Test Quiz 2',
        questions: []
      },
      videos: ['video3'],
      bibliography: [],
      films: []
    },
    order: 2
  },
  {
    id: 'module-3',
    title: 'Test Module 3',
    description: 'Test description 3',
    category: 'Advanced Topics',
    difficulty: 'advanced',
    estimatedTime: 60,
    prerequisites: ['module-2'],
    content: {
      introduction: 'Test introduction 3',
      sections: [],
      quiz: undefined,
      videos: [],
      bibliography: [],
      films: []
    },
    order: 3
  }
];

const mockAdmin: AdminUser = {
  id: 'admin-1',
  username: 'testadmin',
  password: 'hashed-password',
  role: 'admin',
  lastLogin: new Date('2024-01-15T10:00:00').getTime()
};

jest.mock('../../../contexts/AdminContext', () => ({
  useAdmin: () => ({
    isAdmin: true,
    currentAdmin: mockAdmin,
    login: jest.fn(),
    logout: jest.fn(),
    modules: mockModules,
    updateModules: jest.fn()
  })
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Now import the component
import AdminDashboard from '../AdminDashboard';

describe('AdminDashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders admin dashboard with correct title and welcome message', () => {
    render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );

    expect(screen.getByText('Painel Administrativo')).toBeInTheDocument();
    expect(screen.getByText(/Bem-vindo de volta, testadmin!/)).toBeInTheDocument();
  });

  test('renders admin navigation', () => {
    render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );

    expect(screen.getByTestId('admin-navigation')).toBeInTheDocument();
  });

  test('displays correct statistics', () => {
    render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );

    // Total Modules
    expect(screen.getByText('Total de Módulos')).toBeInTheDocument();
    const moduleStats = screen.getByText('Total de Módulos').closest('div')?.parentElement;
    expect(moduleStats?.textContent).toContain('3');

    // Total Quizzes (2 modules have quizzes)
    expect(screen.getByText('Total de Questionários')).toBeInTheDocument();
    const quizStats = screen.getByText('Total de Questionários').closest('div')?.parentElement;
    expect(quizStats?.textContent).toContain('2');

    // Video Content (3 videos total)
    expect(screen.getByText('Conteúdo de Vídeo')).toBeInTheDocument();
    const videoStats = screen.getByText('Conteúdo de Vídeo').closest('div')?.parentElement;
    expect(videoStats?.textContent).toContain('3');

    // Active Users
    expect(screen.getByText('Usuários Ativos')).toBeInTheDocument();
    const userStats = screen.getByText('Usuários Ativos').closest('div')?.parentElement;
    expect(userStats?.textContent).toContain('1');
  });

  test('renders all admin cards with correct information', () => {
    render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );

    // Manage Modules card
    expect(screen.getByText('Gerenciar Módulos')).toBeInTheDocument();
    expect(screen.getByText('Criar, editar e organizar módulos de aprendizagem')).toBeInTheDocument();
    expect(screen.getByText('3 módulos')).toBeInTheDocument();

    // Resources & Media card
    expect(screen.getByText('Recursos e Mídia')).toBeInTheDocument();
    expect(screen.getByText('Gerenciar bibliografia, filmes e vídeos')).toBeInTheDocument();
    expect(screen.getByText('Livros, Filmes, Vídeos')).toBeInTheDocument();
  });

  test('admin cards are clickable links with correct paths', () => {
    render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );

    const manageModulesLink = screen.getByRole('link', { name: /Gerenciar Módulos/i });
    expect(manageModulesLink).toHaveAttribute('href', '/admin/modules');

    const resourcesLink = screen.getByRole('link', { name: /Recursos e Mídia/i });
    expect(resourcesLink).toHaveAttribute('href', '/admin/resources');
  });

  test('displays system status with last login information', () => {
    render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );

    expect(screen.getByText(/Status do Sistema:/)).toBeInTheDocument();
    expect(screen.getByText(/Todos os sistemas operacionais/)).toBeInTheDocument();
    expect(screen.getByText(/Último login:/)).toBeInTheDocument();
    // The component uses toLocaleString() which formats dates differently across environments
    // Just check that some date/time is shown
    const lastLoginElement = screen.getByText(/Último login:/);
    expect(lastLoginElement.parentElement?.textContent).toMatch(/Último login: .+/);
  });
});
