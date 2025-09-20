import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Module, Bibliography, Film } from '../../../types';

// Mock ALL dependencies BEFORE importing the component
jest.mock('lucide-react', () => {
  const React = require('react');
  return {
    Plus: ({ className }: any) => React.createElement('div', { 'data-testid': 'plus-icon', className }, 'Plus'),
    Edit2: ({ className }: any) => React.createElement('div', { 'data-testid': 'edit-icon', className }, 'Edit2'),
    Trash2: ({ className }: any) => React.createElement('div', { 'data-testid': 'trash-icon', className }, 'Trash2'),
    X: ({ className }: any) => React.createElement('div', { 'data-testid': 'x-icon', className }, 'X'),
    Book: ({ className }: any) => React.createElement('div', { 'data-testid': 'book-icon', className }, 'Book'),
    Film: ({ className }: any) => React.createElement('div', { 'data-testid': 'film-icon', className }, 'Film'),
    Search: ({ className }: any) => React.createElement('div', { 'data-testid': 'search-icon', className }, 'Search'),
    Filter: ({ className }: any) => React.createElement('div', { 'data-testid': 'filter-icon', className }, 'Filter'),
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

const mockModules: Module[] = [
  {
    id: 'module-1',
    title: 'Introduction to Jung',
    description: 'Basic concepts',
    icon: '🧠',
    difficulty: 'beginner',
    estimatedTime: 30,
    prerequisites: [],
    content: {
      introduction: 'Introduction text',
      sections: [],
      bibliography: [
        {
          id: 'bib-1',
          title: 'Memories, Dreams, Reflections',
          authors: ['Carl Jung'],
          year: 1963,
          type: 'book'
        },
        {
          id: 'bib-2',
          title: 'Man and His Symbols',
          authors: ['Carl Jung'],
          year: 1964,
          type: 'book'
        }
      ],
      films: [
        {
          id: 'film-1',
          title: 'Matter of Heart',
          director: 'Mark Whitney',
          year: 1986,
          relevance: 'Documentary about Jung\'s life'
        }
      ],
      videos: []
    },
  },
  {
    id: 'module-2',
    title: 'The Shadow',
    description: 'Shadow concept',
    icon: '🌑',
    difficulty: 'intermediate',
    estimatedTime: 45,
    prerequisites: ['module-1'],
    content: {
      introduction: 'Shadow introduction',
      sections: [],
      bibliography: [
        {
          id: 'bib-3',
          title: 'Meeting the Shadow',
          authors: ['Connie Zweig'],
          year: 1991,
          type: 'book'
        }
      ],
      films: [
        {
          id: 'film-2',
          title: 'The Shadow Effect',
          director: 'Scott Cervine',
          year: 2010,
          relevance: 'Exploration of shadow work'
        }
      ],
      videos: []
    },
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
import AdminResources from '../AdminResources';

describe('AdminResources Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    window.confirm = jest.fn(() => true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders admin resources page with correct title and description', () => {
    render(
      <BrowserRouter>
        <AdminResources />
      </BrowserRouter>
    );

    expect(screen.getByText('Gerenciar Recursos')).toBeInTheDocument();
    expect(screen.getByText('Gerenciar recursos de bibliografia e filmes em todos os módulos')).toBeInTheDocument();
  });

  test('renders admin navigation', () => {
    render(
      <BrowserRouter>
        <AdminResources />
      </BrowserRouter>
    );

    expect(screen.getByTestId('admin-navigation')).toBeInTheDocument();
  });

  test('renders tabs for bibliography and films', () => {
    render(
      <BrowserRouter>
        <AdminResources />
      </BrowserRouter>
    );

    expect(screen.getByRole('button', { name: /Bibliografia/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Filmes/i })).toBeInTheDocument();
  });

  test('bibliography tab is active by default', () => {
    render(
      <BrowserRouter>
        <AdminResources />
      </BrowserRouter>
    );

    const bibliographyTab = screen.getByRole('button', { name: /Bibliografia/i });
    expect(bibliographyTab).toHaveClass('border-primary-600', 'text-primary-600');
  });

  test('displays all bibliography entries from all modules', () => {
    render(
      <BrowserRouter>
        <AdminResources />
      </BrowserRouter>
    );

    expect(screen.getByText('Memories, Dreams, Reflections')).toBeInTheDocument();
    expect(screen.getByText('Man and His Symbols')).toBeInTheDocument();
    expect(screen.getByText('Meeting the Shadow')).toBeInTheDocument();

    // Check authors (displayed as "por Author (Year)")
    expect(screen.getByText('por Carl Jung (1963)')).toBeInTheDocument();
    expect(screen.getByText('por Carl Jung (1964)')).toBeInTheDocument();
    expect(screen.getByText('por Connie Zweig (1991)')).toBeInTheDocument();
  });

  test('displays module association for each bibliography entry', () => {
    render(
      <BrowserRouter>
        <AdminResources />
      </BrowserRouter>
    );

    expect(screen.getAllByText('Introduction to Jung').length).toBeGreaterThan(0);
    expect(screen.getAllByText('The Shadow').length).toBeGreaterThan(0);
  });

  test('switching to films tab shows film entries', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <AdminResources />
      </BrowserRouter>
    );

    const filmsTab = screen.getByRole('button', { name: /Filmes/i });
    await user.click(filmsTab);

    expect(screen.getByText('Matter of Heart')).toBeInTheDocument();
    expect(screen.getByText('Dirigido por Mark Whitney (1986)')).toBeInTheDocument();
    expect(screen.getByText('Documentary about Jung\'s life')).toBeInTheDocument();

    expect(screen.getByText('The Shadow Effect')).toBeInTheDocument();
    expect(screen.getByText('Dirigido por Scott Cervine (2010)')).toBeInTheDocument();
  });

  test('add button text changes based on active tab', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <AdminResources />
      </BrowserRouter>
    );

    // Initially shows "Adicionar Livro"
    expect(screen.getByRole('button', { name: /Adicionar Livro/i })).toBeInTheDocument();

    // Switch to films tab
    await user.click(screen.getByRole('button', { name: /Filmes/i }));

    // Now shows "Adicionar Filme"
    expect(screen.getByRole('button', { name: /Adicionar Filme/i })).toBeInTheDocument();
  });

  test('deleting bibliography entry shows confirmation and removes it', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <AdminResources />
      </BrowserRouter>
    );

    // Find delete button for first bibliography entry
    const deleteButtons = screen.getAllByRole('button').filter(btn =>
      btn.querySelector('[data-testid="trash-icon"]') &&
      btn.className.includes('text-gray-600') &&
      btn.className.includes('hover:text-red-600')
    );
    await user.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalledWith('Tem certeza que deseja excluir esta entrada de bibliografia?');

    expect(mockUpdateModules).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'module-1',
          content: expect.objectContaining({
            bibliography: expect.not.arrayContaining([
              expect.objectContaining({ id: 'bib-1' })
            ])
          })
        })
      ])
    );
  });
});
