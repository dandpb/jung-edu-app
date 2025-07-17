import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminResources from '../AdminResources';
import { Module, Bibliography, Film } from '../../../types';

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
          author: 'Carl Jung',
          year: 1963,
          type: 'book'
        },
        {
          id: 'bib-2',
          title: 'Man and His Symbols',
          author: 'Carl Jung',
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
          author: 'Connie Zweig',
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

describe('AdminResources Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    const { useAdmin } = require('../../../contexts/AdminContext');
    (useAdmin as jest.Mock).mockReturnValue(mockUseAdmin());
    window.confirm = jest.fn(() => true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders admin resources page with correct title and description', () => {
    render(<AdminResources />);
    
    expect(screen.getByText('Manage Resources')).toBeInTheDocument();
    expect(screen.getByText('Manage bibliography and film resources across all modules')).toBeInTheDocument();
  });

  test('renders tabs for bibliography and films', () => {
    render(<AdminResources />);
    
    expect(screen.getByRole('button', { name: /Bibliography/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Films/i })).toBeInTheDocument();
  });

  test('bibliography tab is active by default', () => {
    render(<AdminResources />);
    
    const bibliographyTab = screen.getByRole('button', { name: /Bibliography/i });
    expect(bibliographyTab).toHaveClass('border-primary-600', 'text-primary-600');
  });

  test('displays all bibliography entries from all modules', () => {
    render(<AdminResources />);
    
    expect(screen.getByText('Memories, Dreams, Reflections')).toBeInTheDocument();
    expect(screen.getByText('Man and His Symbols')).toBeInTheDocument();
    expect(screen.getByText('Meeting the Shadow')).toBeInTheDocument();
    
    // Check authors (displayed as "by Author (Year)")
    expect(screen.getByText('by Carl Jung (1963)')).toBeInTheDocument();
    expect(screen.getByText('by Carl Jung (1964)')).toBeInTheDocument();
    expect(screen.getByText('by Connie Zweig (1991)')).toBeInTheDocument();
  });

  test('displays module association for each bibliography entry', () => {
    render(<AdminResources />);
    
    expect(screen.getAllByText('Introduction to Jung').length).toBeGreaterThan(0);
    expect(screen.getAllByText('The Shadow').length).toBeGreaterThan(0);
  });

  test('switching to films tab shows film entries', async () => {
    render(<AdminResources />);
    
    const filmsTab = screen.getByRole('button', { name: /Films/i });
    await user.click(filmsTab);
    
    expect(screen.getByText('Matter of Heart')).toBeInTheDocument();
    expect(screen.getByText('Directed by Mark Whitney (1986)')).toBeInTheDocument();
    expect(screen.getByText('Documentary about Jung\'s life')).toBeInTheDocument();
    
    expect(screen.getByText('The Shadow Effect')).toBeInTheDocument();
    expect(screen.getByText('Directed by Scott Cervine (2010)')).toBeInTheDocument();
  });

  test('add button text changes based on active tab', async () => {
    render(<AdminResources />);
    
    // Initially shows "Add Book"
    expect(screen.getByRole('button', { name: /Add Book/i })).toBeInTheDocument();
    
    // Switch to films tab
    await user.click(screen.getByRole('button', { name: /Films/i }));
    
    // Now shows "Add Film"
    expect(screen.getByRole('button', { name: /Add Film/i })).toBeInTheDocument();
  });

  test('search functionality filters bibliography entries', async () => {
    render(<AdminResources />);
    
    const searchInput = screen.getByPlaceholderText(/Search bibliography/i);
    await user.type(searchInput, 'Memories');
    
    expect(screen.getByText('Memories, Dreams, Reflections')).toBeInTheDocument();
    expect(screen.queryByText('Man and His Symbols')).not.toBeInTheDocument();
    expect(screen.queryByText('Meeting the Shadow')).not.toBeInTheDocument();
  });

  test('search by author works correctly', async () => {
    render(<AdminResources />);
    
    const searchInput = screen.getByPlaceholderText(/Search bibliography/i);
    await user.type(searchInput, 'Zweig');
    
    expect(screen.getByText('Meeting the Shadow')).toBeInTheDocument();
    expect(screen.queryByText('Memories, Dreams, Reflections')).not.toBeInTheDocument();
  });

  test('module filter works correctly', async () => {
    render(<AdminResources />);
    
    const filterSelect = screen.getByRole('combobox');
    await user.selectOptions(filterSelect, 'module-1');
    
    expect(screen.getByText('Memories, Dreams, Reflections')).toBeInTheDocument();
    expect(screen.getByText('Man and His Symbols')).toBeInTheDocument();
    expect(screen.queryByText('Meeting the Shadow')).not.toBeInTheDocument();
  });

  test('clicking add book opens add form modal', async () => {
    render(<AdminResources />);
    
    const addButton = screen.getByRole('button', { name: /Add Book/i });
    await user.click(addButton);
    
    expect(screen.getByText('Add Bibliography')).toBeInTheDocument();
    expect(screen.getByText('Title *')).toBeInTheDocument();
    expect(screen.getByText('Author *')).toBeInTheDocument();
    expect(screen.getByText('Year *')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument(); // No asterisk for Type
    expect(screen.getByText('Select Module')).toBeInTheDocument();
  });

  test('can fill and submit bibliography form', async () => {
    render(<AdminResources />);
    
    await user.click(screen.getByRole('button', { name: /Add Book/i }));
    
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
    const submitButtons = screen.getAllByRole('button', { name: 'Add Book' });
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
                  author: 'Carl Jung',
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
    render(<AdminResources />);
    
    await user.click(screen.getByRole('button', { name: /Films/i }));
    await user.click(screen.getByRole('button', { name: /Add Film/i }));
    
    await waitFor(() => {
      // Look for the heading "Add Film" in the modal
      const headings = screen.getAllByText('Add Film');
      const modalHeading = headings.find(el => el.tagName === 'H2');
      expect(modalHeading).toBeInTheDocument();
    });
    
    expect(screen.getByText('Title *')).toBeInTheDocument();
    expect(screen.getByText('Director *')).toBeInTheDocument();
    expect(screen.getByText('Year *')).toBeInTheDocument();
    // Check for the label text that's actually in the component
    const headings = screen.getAllByText('Add Film');
    const modalHeading = headings.find(el => el.tagName === 'H2');
    const modal = modalHeading?.closest('.bg-white');
    expect(within(modal!).getByText(/Relevance/)).toBeInTheDocument();
    expect(screen.getByText('Select Module')).toBeInTheDocument();
  });

  test('can cancel adding a resource', async () => {
    render(<AdminResources />);
    
    await user.click(screen.getByRole('button', { name: /Add Book/i }));
    expect(screen.getByText('Add Bibliography')).toBeInTheDocument();
    
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText('Add Bibliography')).not.toBeInTheDocument();
  });

  test('deleting bibliography entry shows confirmation and removes it', async () => {
    render(<AdminResources />);
    
    // Find delete button for first bibliography entry
    const deleteButtons = screen.getAllByRole('button').filter(btn => 
      btn.querySelector('svg') && btn.querySelector('svg')?.parentElement === btn && 
      !btn.textContent && 
      btn.className.includes('text-gray-600') &&
      btn.className.includes('hover:text-red-600')
    );
    await user.click(deleteButtons[0]);
    
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this bibliography entry?');
    
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
    render(<AdminResources />);
    
    const deleteButtons = screen.getAllByRole('button').filter(btn => 
      btn.querySelector('svg') && btn.querySelector('svg')?.parentElement === btn && 
      !btn.textContent && 
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
    
    render(<AdminResources />);
    
    // Should render without crashing but no entries shown
    // Check that the container is rendered but empty
    const container = screen.getByText('Manage Resources').closest('.max-w-7xl');
    expect(container).toBeInTheDocument();
    // Check that no bibliography cards are shown
    expect(screen.queryByText('by Carl Jung')).not.toBeInTheDocument();
    
    // Switch to films
    await user.click(screen.getByRole('button', { name: /Films/i }));
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
    
    render(<AdminResources />);
    
    // Should not crash and render the component
    const container = screen.getByText('Manage Resources').closest('.max-w-7xl');
    expect(container).toBeInTheDocument();
    // Tabs should still be present
    expect(screen.getByRole('button', { name: /Bibliography/i })).toBeInTheDocument();
  });

  test('displays correct resource counts', () => {
    render(<AdminResources />);
    
    // Should display 3 bibliography entries total
    const bookEntries = screen.getAllByText(/Carl Jung|Connie Zweig/);
    expect(bookEntries.length).toBeGreaterThanOrEqual(3);
  });
});