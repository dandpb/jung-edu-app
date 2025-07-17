import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import AdminDashboard from '../AdminDashboard';
import { AdminProvider } from '../../../contexts/AdminContext';
import { AdminUser, Module } from '../../../types';

// Mock the useAdmin hook
jest.mock('../../../contexts/AdminContext', () => ({
  ...jest.requireActual('../../../contexts/AdminContext'),
  useAdmin: jest.fn()
}));

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
      sections: [],
      quiz: {
        questions: []
      },
      videos: ['video1', 'video2']
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
      sections: [],
      quiz: {
        questions: []
      },
      videos: ['video3']
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
      sections: [],
      quiz: undefined,
      videos: []
    },
    order: 3
  }
];

const mockAdmin: AdminUser = {
  username: 'testadmin',
  role: 'admin',
  lastLogin: new Date('2024-01-15T10:00:00').getTime()
};

const mockUseAdmin = () => ({
  isAdmin: true,
  currentAdmin: mockAdmin,
  login: jest.fn(),
  logout: jest.fn(),
  modules: mockModules,
  updateModules: jest.fn(),
  mindMapNodes: [],
  mindMapEdges: [],
  updateMindMap: jest.fn()
});

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AdminProvider>
        {component}
      </AdminProvider>
    </BrowserRouter>
  );
};

describe('AdminDashboard Component', () => {
  beforeEach(() => {
    const { useAdmin } = require('../../../contexts/AdminContext');
    (useAdmin as jest.Mock).mockReturnValue(mockUseAdmin());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders admin dashboard with correct title and welcome message', () => {
    renderWithRouter(<AdminDashboard />);
    
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    expect(screen.getByText(/Welcome back, testadmin!/)).toBeInTheDocument();
  });

  test('displays correct statistics', () => {
    renderWithRouter(<AdminDashboard />);
    
    // Total Modules
    expect(screen.getByText('Total Modules')).toBeInTheDocument();
    const moduleStats = screen.getByText('Total Modules').closest('div')?.parentElement;
    expect(moduleStats?.textContent).toContain('3');
    
    // Total Quizzes (2 modules have quizzes)
    expect(screen.getByText('Total Quizzes')).toBeInTheDocument();
    const quizStats = screen.getByText('Total Quizzes').closest('div')?.parentElement;
    expect(quizStats?.textContent).toContain('2');
    
    // Video Content (3 videos total)
    expect(screen.getByText('Video Content')).toBeInTheDocument();
    const videoStats = screen.getByText('Video Content').closest('div')?.parentElement;
    expect(videoStats?.textContent).toContain('3');
    
    // Active Users
    expect(screen.getByText('Active Users')).toBeInTheDocument();
    const userStats = screen.getByText('Active Users').closest('div')?.parentElement;
    expect(userStats?.textContent).toContain('1');
  });

  test('renders all admin cards with correct information', () => {
    renderWithRouter(<AdminDashboard />);
    
    // Manage Modules card
    expect(screen.getByText('Manage Modules')).toBeInTheDocument();
    expect(screen.getByText('Create, edit, and organize learning modules')).toBeInTheDocument();
    expect(screen.getByText('3 modules')).toBeInTheDocument();
    
    // Mind Map Editor card
    expect(screen.getByText('Mind Map Editor')).toBeInTheDocument();
    expect(screen.getByText('Configure the interactive concept mind map')).toBeInTheDocument();
    expect(screen.getByText('Interactive editor')).toBeInTheDocument();
    
    // Resources & Media card
    expect(screen.getByText('Resources & Media')).toBeInTheDocument();
    expect(screen.getByText('Manage bibliography, films, and videos')).toBeInTheDocument();
    expect(screen.getByText('Books, Films, Videos')).toBeInTheDocument();
  });

  test('admin cards are clickable links with correct paths', () => {
    renderWithRouter(<AdminDashboard />);
    
    const manageModulesLink = screen.getByRole('link', { name: /Manage Modules/i });
    expect(manageModulesLink).toHaveAttribute('href', '/admin/modules');
    
    const mindMapLink = screen.getByRole('link', { name: /Mind Map Editor/i });
    expect(mindMapLink).toHaveAttribute('href', '/admin/mindmap');
    
    const resourcesLink = screen.getByRole('link', { name: /Resources & Media/i });
    expect(resourcesLink).toHaveAttribute('href', '/admin/resources');
  });

  test('renders quick action buttons', () => {
    renderWithRouter(<AdminDashboard />);
    
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    
    const addModuleBtn = screen.getByRole('link', { name: 'Add New Module' });
    expect(addModuleBtn).toHaveAttribute('href', '/admin/modules');
    
    const editMindMapBtn = screen.getByRole('link', { name: 'Edit Mind Map' });
    expect(editMindMapBtn).toHaveAttribute('href', '/admin/mindmap');
    
    const addResourcesBtn = screen.getByRole('link', { name: 'Add Resources' });
    expect(addResourcesBtn).toHaveAttribute('href', '/admin/resources');
  });

  test('displays system status with last login information', () => {
    renderWithRouter(<AdminDashboard />);
    
    expect(screen.getByText(/System Status:/)).toBeInTheDocument();
    expect(screen.getByText(/All systems operational/)).toBeInTheDocument();
    expect(screen.getByText(/Last login:/)).toBeInTheDocument();
    // The component uses toLocaleString() which includes time
    const expectedDate = new Date('2024-01-15T10:00:00').toLocaleString();
    expect(screen.getByText(new RegExp(expectedDate.split(',')[0]))).toBeInTheDocument();
  });

  test('handles null currentAdmin gracefully', () => {
    const { useAdmin } = require('../../../contexts/AdminContext');
    (useAdmin as jest.Mock).mockReturnValue({
      ...mockUseAdmin(),
      currentAdmin: null
    });
    
    renderWithRouter(<AdminDashboard />);
    
    expect(screen.getByText(/Welcome back, !/)).toBeInTheDocument();
    expect(screen.getByText(/Last login: Never/)).toBeInTheDocument();
  });

  test('calculates statistics correctly with empty modules', () => {
    const { useAdmin } = require('../../../contexts/AdminContext');
    (useAdmin as jest.Mock).mockReturnValue({
      ...mockUseAdmin(),
      modules: []
    });
    
    renderWithRouter(<AdminDashboard />);
    
    // Check all stats show 0
    const zeroStats = screen.getAllByText('0');
    expect(zeroStats.length).toBeGreaterThanOrEqual(3); // At least 3 stats should be 0
  });

  test('handles modules without videos correctly', () => {
    const modulesWithoutVideos = mockModules.map(m => ({
      ...m,
      content: { ...m.content, videos: undefined }
    }));
    
    const { useAdmin } = require('../../../contexts/AdminContext');
    (useAdmin as jest.Mock).mockReturnValue({
      ...mockUseAdmin(),
      modules: modulesWithoutVideos
    });
    
    renderWithRouter(<AdminDashboard />);
    
    // Video count should be 0
    expect(screen.getByText('Video Content')).toBeInTheDocument();
    const videoCount = screen.getAllByText('0').find(el => 
      el.closest('div')?.textContent?.includes('Video Content')
    );
    expect(videoCount).toBeInTheDocument();
  });

  test('hover effects on cards work correctly', async () => {
    const user = userEvent.setup();
    renderWithRouter(<AdminDashboard />);
    
    const manageModulesCard = screen.getByRole('link', { name: /Manage Modules/i });
    
    // Check initial state
    expect(manageModulesCard).toHaveClass('card');
    
    // Hover over card
    await user.hover(manageModulesCard);
    
    // Check hover classes are applied
    expect(manageModulesCard).toHaveClass('hover:shadow-lg');
    expect(manageModulesCard).toHaveClass('hover:scale-[1.02]');
  });

  test('renders all icon components correctly', () => {
    renderWithRouter(<AdminDashboard />);
    
    // Check for presence of lucide icons by their SVG elements
    const container = screen.getByText('Admin Dashboard').closest('div')?.parentElement;
    const svgIcons = container?.querySelectorAll('svg.lucide');
    
    // We expect multiple icons: stat icons (4), card icons (3), arrow icons (3), settings icon (1)
    expect(svgIcons?.length).toBeGreaterThanOrEqual(11);
  });
});