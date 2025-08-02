import React from 'react';
import { render, screen } from '../../utils/test-utils';
import { useNavigate } from 'react-router-dom';
import Navigation from '../Navigation';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/auth';

// Mock the useAuth hook
jest.mock('../../contexts/AuthContext', () => ({
  ...jest.requireActual('../../contexts/AuthContext'),
  useAuth: jest.fn()
}));

// Mock react-router-dom navigation
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => {
  const React = require('react');
  
  return {
    BookOpen: ({ className }: any) => React.createElement('div', { 'data-testid': 'book-icon', className }, 'BookOpen'),
    Network: ({ className }: any) => React.createElement('div', { 'data-testid': 'network-icon', className }, 'Network'),
    FileText: ({ className }: any) => React.createElement('div', { 'data-testid': 'filetext-icon', className }, 'FileText'),
    Library: ({ className }: any) => React.createElement('div', { 'data-testid': 'library-icon', className }, 'Library'),
    Search: ({ className }: any) => React.createElement('div', { 'data-testid': 'search-icon', className }, 'Search'),
    Home: ({ className }: any) => React.createElement('div', { 'data-testid': 'home-icon', className }, 'Home'),
    Settings: ({ className }: any) => React.createElement('div', { 'data-testid': 'settings-icon', className }, 'Settings'),
    LogOut: ({ className }: any) => React.createElement('div', { 'data-testid': 'logout-icon', className }, 'LogOut'),
    Brain: ({ className }: any) => React.createElement('div', { 'data-testid': 'brain-icon', className }, 'Brain'),
    User: ({ className }: any) => React.createElement('div', { 'data-testid': 'user-icon', className }, 'User'),
    LogIn: ({ className }: any) => React.createElement('div', { 'data-testid': 'login-icon', className }, 'LogIn'),
    Activity: ({ className }: any) => React.createElement('div', { 'data-testid': 'activity-icon', className }, 'Activity'),
  };
});

describe('Navigation Component', () => {
  const mockLogout = jest.fn();
  const mockHasRole = jest.fn();
  
  const defaultAuthContextValue = {
    isAuthenticated: false,
    user: null,
    logout: mockLogout,
    hasRole: mockHasRole,
    login: jest.fn(),
    register: jest.fn(),
    requestPasswordReset: jest.fn(),
    resetPassword: jest.fn(),
    changePassword: jest.fn(),
    verifyEmail: jest.fn(),
    resendVerificationEmail: jest.fn(),
    hasPermission: jest.fn(),
    refreshSession: jest.fn(),
    clearError: jest.fn(),
    isLoading: false,
    error: null
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockHasRole.mockReturnValue(false);
    (useAuth as jest.Mock).mockReturnValue(defaultAuthContextValue);
  });

  test('renders all navigation links', () => {
    (useAuth as jest.Mock).mockReturnValue({
      ...defaultAuthContextValue,
      isAuthenticated: true,
      user: { 
        id: '1', 
        name: 'Test User', 
        role: UserRole.STUDENT,
        profile: {
          firstName: 'Test',
          lastName: 'User'
        }
      }
    });
    
    render(<Navigation />);
    
    expect(screen.getByText("Psicologia de Jung")).toBeInTheDocument();
    expect(screen.getByText('Painel')).toBeInTheDocument();
    expect(screen.getByText('Mapa Mental')).toBeInTheDocument();
    expect(screen.getByText('Mapa Mental IA')).toBeInTheDocument();
    expect(screen.getByText('Anotações')).toBeInTheDocument();
    expect(screen.getByText('Recursos')).toBeInTheDocument();
    expect(screen.getByText('Buscar')).toBeInTheDocument();
  });

  test('highlights active link based on current route', () => {
    (useAuth as jest.Mock).mockReturnValue({
      ...defaultAuthContextValue,
      isAuthenticated: true,
      user: { 
        id: '1', 
        name: 'Test User', 
        role: UserRole.STUDENT,
        profile: {
          firstName: 'Test',
          lastName: 'User'
        }
      }
    });
    
    render(<Navigation />, { initialEntries: ['/mindmap'] });
    
    const mindMapLink = screen.getByText('Mapa Mental').closest('a');
    expect(mindMapLink).toHaveClass('bg-primary-50', 'text-primary-700');
  });

  test('shows inactive links with correct styling', () => {
    (useAuth as jest.Mock).mockReturnValue({
      ...defaultAuthContextValue,
      isAuthenticated: true,
      user: { 
        id: '1', 
        name: 'Test User', 
        role: UserRole.STUDENT,
        profile: {
          firstName: 'Test',
          lastName: 'User'
        }
      }
    });
    
    render(<Navigation />, { initialEntries: ['/dashboard'] });
    
    const notesLink = screen.getByText('Anotações').closest('a');
    expect(notesLink).toHaveClass('text-gray-600');
    expect(notesLink).not.toHaveClass('bg-primary-50');
  });

  test('shows login link when not authenticated', () => {
    render(<Navigation />, { initialEntries: ['/dashboard'] });
    
    const loginLink = screen.getByText('Entrar').closest('a');
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');
    expect(screen.queryByText('Administrador')).not.toBeInTheDocument();
    expect(screen.queryByText('Sair')).not.toBeInTheDocument();
  });

  test('shows admin controls when logged in as admin', () => {
    mockHasRole.mockReturnValue(true);
    (useAuth as jest.Mock).mockReturnValue({
      ...defaultAuthContextValue,
      isAuthenticated: true,
      user: { 
        id: '1', 
        name: 'Admin User', 
        role: UserRole.ADMIN,
        profile: {
          firstName: 'Admin',
          lastName: 'User'
        }
      },
      hasRole: mockHasRole
    });

    render(<Navigation />, { initialEntries: ['/dashboard'] });
    
    expect(screen.getByText('Administrador')).toBeInTheDocument();
    expect(screen.getByText('Sair')).toBeInTheDocument();
    expect(screen.queryByText('Admin')).not.toBeInTheDocument();
  });

  test('highlights admin link when on admin route', () => {
    mockHasRole.mockReturnValue(true);
    (useAuth as jest.Mock).mockReturnValue({
      ...defaultAuthContextValue,
      isAuthenticated: true,
      user: { 
        id: '1', 
        name: 'Admin User', 
        role: UserRole.ADMIN,
        profile: {
          firstName: 'Admin',
          lastName: 'User'
        }
      },
      hasRole: mockHasRole
    });

    render(<Navigation />, { initialEntries: ['/admin'] });
    
    const adminLink = screen.getByText('Administrador').closest('a');
    expect(adminLink).toHaveClass('bg-primary-50', 'text-primary-700');
  });

  test('handles logout when logout button is clicked', async () => {
    mockHasRole.mockReturnValue(true);
    (useAuth as jest.Mock).mockReturnValue({
      ...defaultAuthContextValue,
      isAuthenticated: true,
      user: { 
        id: '1', 
        name: 'Admin User', 
        role: UserRole.ADMIN,
        profile: {
          firstName: 'Admin',
          lastName: 'User'
        }
      },
      hasRole: mockHasRole
    });

    const { user } = render(<Navigation />, { initialEntries: ['/dashboard'] });
    
    const logoutButton = screen.getByText('Sair').closest('button');
    await user.click(logoutButton!);
    
    expect(mockLogout).toHaveBeenCalled();
  });

  test('renders icons for all navigation items', () => {
    (useAuth as jest.Mock).mockReturnValue({
      ...defaultAuthContextValue,
      isAuthenticated: true,
      user: { 
        id: '1', 
        name: 'Test User', 
        role: UserRole.STUDENT,
        profile: {
          firstName: 'Test',
          lastName: 'User'
        }
      }
    });
    
    render(<Navigation />);
    
    expect(screen.getByTestId('book-icon')).toBeInTheDocument();
    expect(screen.getByTestId('home-icon')).toBeInTheDocument();
    expect(screen.getByTestId('network-icon')).toBeInTheDocument();
    expect(screen.getByTestId('brain-icon')).toBeInTheDocument();
    expect(screen.getByTestId('filetext-icon')).toBeInTheDocument();
    expect(screen.getByTestId('library-icon')).toBeInTheDocument();
    expect(screen.getByTestId('search-icon')).toBeInTheDocument();
  });

  test('applies responsive classes to navigation items', () => {
    (useAuth as jest.Mock).mockReturnValue({
      ...defaultAuthContextValue,
      isAuthenticated: true,
      user: { 
        id: '1', 
        name: 'Test User', 
        role: UserRole.STUDENT,
        profile: {
          firstName: 'Test',
          lastName: 'User'
        }
      }
    });
    
    render(<Navigation />);
    
    const navLabels = screen.getAllByText(/Painel|Mapa Mental|Anotações|Recursos|Buscar/);
    navLabels.forEach(label => {
      if (label.tagName === 'SPAN') {
        expect(label).toHaveClass('hidden', 'sm:inline');
      }
    });
  });

  test('logo links to dashboard', () => {
    render(<Navigation />);
    
    const logoLink = screen.getByText('Psicologia de Jung').closest('a');
    expect(logoLink).toHaveAttribute('href', '/dashboard');
  });

  test('applies correct icon sizing', () => {
    (useAuth as jest.Mock).mockReturnValue({
      ...defaultAuthContextValue,
      isAuthenticated: true,
      user: { 
        id: '1', 
        name: 'Test User', 
        role: UserRole.STUDENT,
        profile: {
          firstName: 'Test',
          lastName: 'User'
        }
      }
    });
    
    render(<Navigation />);
    
    const bookIcon = screen.getByTestId('book-icon');
    expect(bookIcon).toHaveClass('w-8', 'h-8', 'text-primary-600');
    
    const homeIcon = screen.getByTestId('home-icon');
    expect(homeIcon).toHaveClass('w-4', 'h-4');
  });

  test('shows user menu when authenticated but not admin', () => {
    (useAuth as jest.Mock).mockReturnValue({
      ...defaultAuthContextValue,
      isAuthenticated: true,
      user: { 
        id: '1', 
        name: 'Test User', 
        role: UserRole.STUDENT,
        profile: {
          firstName: 'Test',
          lastName: 'User'
        }
      }
    });
    
    render(<Navigation />);
    
    expect(screen.getByTestId('user-icon')).toBeInTheDocument();
  });

  test('logout icon shows when admin', () => {
    mockHasRole.mockReturnValue(true);
    (useAuth as jest.Mock).mockReturnValue({
      ...defaultAuthContextValue,
      isAuthenticated: true,
      user: { 
        id: '1', 
        name: 'Admin User', 
        role: UserRole.ADMIN,
        profile: {
          firstName: 'Admin',
          lastName: 'User'
        }
      },
      hasRole: mockHasRole
    });

    render(<Navigation />);
    
    expect(screen.getByTestId('logout-icon')).toBeInTheDocument();
  });

  test('navigation has correct container and layout classes', () => {
    const { container } = render(<Navigation />);
    
    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('bg-white', 'shadow-sm', 'border-b', 'border-gray-200');
    
    const containerDiv = nav?.querySelector('.container');
    expect(containerDiv).toHaveClass('mx-auto', 'px-4');
    
    const flexDiv = containerDiv?.querySelector('.flex');
    expect(flexDiv).toHaveClass('items-center', 'justify-between', 'h-16');
  });

  test('all navigation links have correct transition classes', () => {
    (useAuth as jest.Mock).mockReturnValue({
      ...defaultAuthContextValue,
      isAuthenticated: true,
      user: { 
        id: '1', 
        name: 'Test User', 
        role: UserRole.STUDENT,
        profile: {
          firstName: 'Test',
          lastName: 'User'
        }
      }
    });
    
    render(<Navigation />);
    
    const links = screen.getAllByRole('link').filter(link => 
      link.textContent?.match(/Painel|Mapa Mental|Anotações|Recursos|Buscar/)
    );
    
    links.forEach(link => {
      expect(link).toHaveClass('transition-all', 'duration-200');
    });
  });

  test('handles navigation for enhanced mindmap', () => {
    (useAuth as jest.Mock).mockReturnValue({
      ...defaultAuthContextValue,
      isAuthenticated: true,
      user: { 
        id: '1', 
        name: 'Test User', 
        role: UserRole.STUDENT,
        profile: {
          firstName: 'Test',
          lastName: 'User'
        }
      }
    });
    
    render(<Navigation />, { initialEntries: ['/enhanced-mindmap'] });
    
    const enhancedMindmapLink = screen.getByText('Mapa Mental IA').closest('a');
    expect(enhancedMindmapLink).toHaveClass('bg-primary-50', 'text-primary-700');
  });
});