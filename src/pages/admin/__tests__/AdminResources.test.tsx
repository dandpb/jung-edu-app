import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AdminResources from '../AdminResources';
import { Module, Bibliography, Film } from '../../../types';

// Mock lucide-react icons
jest.mock('lucide-react', () => {
  const React = require('react');
  
  return {
    Plus: ({ className }: any) => React.createElement('div', { 'data-testid': 'plus-icon', className }, 'Plus'),
    Edit2: ({ className }: any) => React.createElement('div', { 'data-testid': 'edit-icon', className }, 'Edit2'),
    Trash2: ({ className }: any) => React.createElement('div', { 'data-testid': 'trash-icon', className }, 'Trash2'),
    Save: ({ className }: any) => React.createElement('div', { 'data-testid': 'save-icon', className }, 'Save'),
    X: ({ className }: any) => React.createElement('div', { 'data-testid': 'x-icon', className }, 'X'),
    Book: ({ className }: any) => React.createElement('div', { 'data-testid': 'book-icon', className }, 'Book'),
    Film: ({ className }: any) => React.createElement('div', { 'data-testid': 'film-icon', className }, 'Film'),
    Search: ({ className }: any) => React.createElement('div', { 'data-testid': 'search-icon', className }, 'Search'),
    Filter: ({ className }: any) => React.createElement('div', { 'data-testid': 'filter-icon', className }, 'Filter'),
    LogOut: ({ className }: any) => React.createElement('div', { 'data-testid': 'logout-icon', className }, 'LogOut'),
  };
});

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock the useAdmin hook
jest.mock('../../../contexts/AdminContext', () => ({
  useAdmin: jest.fn()
}));

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
  },
  {
    id: 'module-3',
    title: 'Archetypes',
    description: 'Universal patterns',
    icon: '🎭',
    difficulty: 'intermediate',
    estimatedTime: 40,
    prerequisites: ['module-1'],
    content: {
      introduction: 'Archetypes introduction',
      sections: [],
      bibliography: [],
      films: [],
      videos: []
    },
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
  mindMapNodes: [],
  mindMapEdges: [],
  updateMindMap: jest.fn()
});

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MemoryRouter>
    {children}
  </MemoryRouter>
);

// Custom render function for this test file
const customRender = (ui: React.ReactElement) => {
  const user = userEvent.setup();
  const result = render(ui, { wrapper: TestWrapper });
  return { user, ...result };
};

describe('AdminResources Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    const { useAdmin } = require('../../../contexts/AdminContext');
    (useAdmin as jest.Mock).mockReturnValue(mockUseAdmin());
    window.confirm = jest.fn(() => true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders admin resources page with correct title and description', () => {
    customRender(<AdminResources />);
    
    expect(screen.getByText('Gerenciar Recursos')).toBeInTheDocument();
    expect(screen.getByText('Gerenciar recursos de bibliografia e filmes em todos os módulos')).toBeInTheDocument();
  });

  test('renders tabs for bibliography and films', () => {
    customRender(<AdminResources />);
    
    expect(screen.getByRole('button', { name: /Bibliografia/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Filmes/i })).toBeInTheDocument();
  });

  test('bibliography tab is active by default', () => {
    customRender(<AdminResources />);
    
    const bibliographyTab = screen.getByRole('button', { name: /Bibliografia/i });
    expect(bibliographyTab).toHaveClass('border-primary-600', 'text-primary-600');
  });

  test('displays all bibliography entries from all modules', () => {
    customRender(<AdminResources />);
    
    expect(screen.getByText('Memories, Dreams, Reflections')).toBeInTheDocument();
    expect(screen.getByText('Man and His Symbols')).toBeInTheDocument();
    expect(screen.getByText('Meeting the Shadow')).toBeInTheDocument();
    
    // Check authors (displayed as "por Author (Year)")
    expect(screen.getByText('por Carl Jung (1963)')).toBeInTheDocument();
    expect(screen.getByText('por Carl Jung (1964)')).toBeInTheDocument();
    expect(screen.getByText('por Connie Zweig (1991)')).toBeInTheDocument();
  });

  test('displays module association for each bibliography entry', () => {
    customRender(<AdminResources />);
    
    expect(screen.getAllByText('Introduction to Jung').length).toBeGreaterThan(0);
    expect(screen.getAllByText('The Shadow').length).toBeGreaterThan(0);
  });

  test('switching to films tab shows film entries', async () => {
    const { user } = customRender(<AdminResources />);
    
    const filmsTab = screen.getByRole('button', { name: /Filmes/i });
    await user.click(filmsTab);
    
    expect(screen.getByText('Matter of Heart')).toBeInTheDocument();
    expect(screen.getByText('Dirigido por Mark Whitney (1986)')).toBeInTheDocument();
    expect(screen.getByText('Documentary about Jung\'s life')).toBeInTheDocument();
    
    expect(screen.getByText('The Shadow Effect')).toBeInTheDocument();
    expect(screen.getByText('Dirigido por Scott Cervine (2010)')).toBeInTheDocument();
  });

  test('add button text changes based on active tab', async () => {
    const { user } = customRender(<AdminResources />);
    
    // Initially shows "Adicionar Livro"
    expect(screen.getByRole('button', { name: /Adicionar Livro/i })).toBeInTheDocument();
    
    // Switch to films tab
    await user.click(screen.getByRole('button', { name: /Filmes/i }));
    
    // Now shows "Adicionar Filme"
    expect(screen.getByRole('button', { name: /Adicionar Filme/i })).toBeInTheDocument();
  });

  test('search functionality filters bibliography entries', async () => {
    const { user } = customRender(<AdminResources />);
    
    const searchInput = screen.getByPlaceholderText(/Buscar bibliografia/i);
    await user.type(searchInput, 'Memories');
    
    expect(screen.getByText('Memories, Dreams, Reflections')).toBeInTheDocument();
    expect(screen.queryByText('Man and His Symbols')).not.toBeInTheDocument();
    expect(screen.queryByText('Meeting the Shadow')).not.toBeInTheDocument();
  });

  test('search by author works correctly', async () => {
    const { user } = customRender(<AdminResources />);
    
    const searchInput = screen.getByPlaceholderText(/Buscar bibliografia/i);
    await user.type(searchInput, 'Zweig');
    
    expect(screen.getByText('Meeting the Shadow')).toBeInTheDocument();
    expect(screen.queryByText('Memories, Dreams, Reflections')).not.toBeInTheDocument();
  });

  test('module filter works correctly', async () => {
    const { user } = customRender(<AdminResources />);
    
    const filterSelect = screen.getByRole('combobox');
    await user.selectOptions(filterSelect, 'module-1');
    
    expect(screen.getByText('Memories, Dreams, Reflections')).toBeInTheDocument();
    expect(screen.getByText('Man and His Symbols')).toBeInTheDocument();
    expect(screen.queryByText('Meeting the Shadow')).not.toBeInTheDocument();
  });

  test('clicking add book opens add form modal', async () => {
    const { user } = customRender(<AdminResources />);
    
    const addButton = screen.getByRole('button', { name: /Adicionar Livro/i });
    await user.click(addButton);
    
    expect(screen.getByText('Add Bibliography')).toBeInTheDocument();
    expect(screen.getByText('Title *')).toBeInTheDocument();
    expect(screen.getByText('Author *')).toBeInTheDocument();
    expect(screen.getByText('Ano *')).toBeInTheDocument(); // Portuguese for "Year *"
    expect(screen.getByText('Tipo')).toBeInTheDocument(); // Portuguese for "Type"
    expect(screen.getByText('Select Module')).toBeInTheDocument();
  });

  test('can fill and submit bibliography form', async () => {
    const { user } = customRender(<AdminResources />);
    
    await user.click(screen.getByRole('button', { name: /Adicionar Livro/i }));
    
    // Get form inputs after modal is fully rendered
    await waitFor(() => {
      expect(screen.getByText('Select Module')).toBeInTheDocument();
      expect(screen.getByText('Title *')).toBeInTheDocument();
    });
    
    // Fill form - get inputs within the modal dialog
    const modal = screen.getByText('Add Bibliography').closest('.bg-white');
    const modalSelects = within(modal!).getAllByRole('combobox');
    const modalInputs = within(modal!).getAllByRole('textbox');
    const modalNumberInputs = within(modal!).getAllByRole('spinbutton');
    
    // First select module since it's required to enable submit button
    await user.selectOptions(modalSelects[0], 'module-1');
    
    // Then fill the rest of the form
    await user.type(modalInputs[0], 'The Red Book'); // Title (first textbox in modal)
    await user.type(modalInputs[1], 'Carl Jung'); // Author (second textbox in modal)
    await user.clear(modalNumberInputs[0]); // Year
    await user.type(modalNumberInputs[0], '2009');
    
    // Select type if there's a second select
    if (modalSelects.length > 1) {
      await user.selectOptions(modalSelects[1], 'book');
    }
    
    // Submit - find the submit button in the modal (it's the one without an icon)
    const submitButtons = screen.getAllByRole('button', { name: 'Adicionar Livro' });
    const modalSubmitButton = submitButtons.find(btn => !btn.querySelector('svg'));
    expect(modalSubmitButton).toBeDefined();
    await user.click(modalSubmitButton!);
    
    // Verify updateModules was called
    await waitFor(() => {
      expect(mockUpdateModules).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'module-1',
            content: expect.objectContaining({
              bibliography: expect.arrayContaining([
                expect.objectContaining({
                  title: 'The Red Book',
                  authors: ['Carl Jung'],
                  year: 2009
                })
              ])
            })
          })
        ])
      );
    });
  });

  test('clicking add film opens film form modal', async () => {
    const { user } = customRender(<AdminResources />);
    
    await user.click(screen.getByRole('button', { name: /Filmes/i }));
    await user.click(screen.getByRole('button', { name: /Adicionar Filme/i }));
    
    await waitFor(() => {
      // Look for the heading "Add Film" in the modal
      const headings = screen.getAllByText('Add Film');
      const modalHeading = headings.find(el => el.tagName === 'H2');
      expect(modalHeading).toBeInTheDocument();
    });
    
    expect(screen.getByText('Title *')).toBeInTheDocument();
    expect(screen.getByText('Diretor *')).toBeInTheDocument();
    expect(screen.getByText('Ano *')).toBeInTheDocument();
    // Check for the label text that's actually in the component
    const headings = screen.getAllByText('Add Film');
    const modalHeading = headings.find(el => el.tagName === 'H2');
    const modal = modalHeading?.closest('.bg-white');
    expect(within(modal!).getByText(/Relevância para os Conceitos de Jung/)).toBeInTheDocument();
    expect(screen.getByText('Select Module')).toBeInTheDocument();
  });

  test('can cancel adding a resource', async () => {
    const { user } = customRender(<AdminResources />);
    
    await user.click(screen.getByRole('button', { name: /Adicionar Livro/i }));
    expect(screen.getByText('Add Bibliography')).toBeInTheDocument();
    
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByText('Add Bibliography')).not.toBeInTheDocument();
  });

  test('deleting bibliography entry shows confirmation and removes it', async () => {
    const { user } = customRender(<AdminResources />);
    
    // Find delete button for first bibliography entry (using test-id for mocked trash icon)
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

  test('canceling delete confirmation does not delete item', async () => {
    window.confirm = jest.fn(() => false);
    const { user } = customRender(<AdminResources />);
    
    const deleteButtons = screen.getAllByRole('button').filter(btn => 
      btn.querySelector('[data-testid="trash-icon"]') && 
      btn.className.includes('text-gray-600') &&
      btn.className.includes('hover:text-red-600')
    );
    await user.click(deleteButtons[0]);
    
    expect(mockUpdateModules).not.toHaveBeenCalled();
  });

  test('handles empty resources gracefully', async () => {
    const { useAdmin } = require('../../../contexts/AdminContext');
    (useAdmin as jest.Mock).mockReturnValue({
      ...mockUseAdmin(),
      modules: [{
        ...mockModules[0],
        content: { ...mockModules[0].content, bibliography: [], films: [] }
      }]
    });
    
    const { user } = customRender(<AdminResources />);
    
    // Should render without crashing but no entries shown
    // Check that the container is rendered but empty
    const container = screen.getByText('Gerenciar Recursos').closest('.max-w-7xl');
    expect(container).toBeInTheDocument();
    // Check that no bibliography cards are shown
    expect(screen.queryByText('por Carl Jung')).not.toBeInTheDocument();
    
    // Switch to films
    await user.click(screen.getByRole('button', { name: /Filmes/i }));
    // Check that no film cards are shown
    expect(screen.queryByText('Matter of Heart')).not.toBeInTheDocument();
  });

  test('handles modules without bibliography or films arrays', () => {
    const { useAdmin } = require('../../../contexts/AdminContext');
    (useAdmin as jest.Mock).mockReturnValue({
      ...mockUseAdmin(),
      modules: [{
        ...mockModules[0],
        content: { 
          ...mockModules[0].content, 
          bibliography: undefined, 
          films: undefined 
        }
      }]
    });
    
    customRender(<AdminResources />);
    
    // Should not crash and render the component
    const container = screen.getByText('Gerenciar Recursos').closest('.max-w-7xl');
    expect(container).toBeInTheDocument();
    // Tabs should still be present
    expect(screen.getByRole('button', { name: /Bibliografia/i })).toBeInTheDocument();
  });

  test('displays correct resource counts', () => {
    customRender(<AdminResources />);
    
    // Should display 3 bibliography entries total
    const bookEntries = screen.getAllByText(/Carl Jung|Connie Zweig/);
    expect(bookEntries.length).toBeGreaterThanOrEqual(3);
  });
});