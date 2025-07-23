import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter, useNavigate } from 'react-router-dom';
import Navigation from '../Navigation';
import { AdminProvider, useAdmin } from '../../contexts/AdminContext';

// Mock the useAdmin hook
jest.mock('../../contexts/AdminContext', () => ({
  ...jest.requireActual('../../contexts/AdminContext'),
  useAdmin: jest.fn()
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
  };
});

describe('Navigation Component', () => {
  const user = userEvent.setup();
  
  const defaultAdminContextValue = {
    isAdmin: false,
    login: jest.fn(),
    logout: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAdmin as jest.Mock).mockReturnValue(defaultAdminContextValue);
  });

  test('renders all navigation links', () => {
    render(
      <AdminProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Navigation />
        </BrowserRouter>
      </AdminProvider>
    );
    
    expect(screen.getByText("Psicologia de Jung")).toBeInTheDocument();
    expect(screen.getByText('Painel')).toBeInTheDocument();
    expect(screen.getByText('Mapa Mental')).toBeInTheDocument();
    expect(screen.getByText('Mapa Mental IA')).toBeInTheDocument();
    expect(screen.getByText('Anotações')).toBeInTheDocument();
    expect(screen.getByText('Recursos')).toBeInTheDocument();
    expect(screen.getByText('Buscar')).toBeInTheDocument();
  });

  test('highlights active link based on current route', () => {
    render(
      <AdminProvider>
        <MemoryRouter initialEntries={['/mindmap']}>
          <Navigation />
        </MemoryRouter>
      </AdminProvider>
    );
    
    const mindMapLink = screen.getByText('Mapa Mental').closest('a');
    expect(mindMapLink).toHaveClass('bg-primary-50', 'text-primary-700');
  });

  test('shows inactive links with correct styling', () => {
    render(
      <AdminProvider>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Navigation />
        </MemoryRouter>
      </AdminProvider>
    );
    
    const notesLink = screen.getByText('Anotações').closest('a');
    expect(notesLink).toHaveClass('text-gray-600');
    expect(notesLink).not.toHaveClass('bg-primary-50');
  });

  test('shows admin link when not logged in as admin', () => {
    render(
      <AdminProvider>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Navigation />
        </MemoryRouter>
      </AdminProvider>
    );
    
    const adminLink = screen.getByText('Admin').closest('a');
    expect(adminLink).toBeInTheDocument();
    expect(adminLink).toHaveAttribute('href', '/admin/login');
    expect(screen.queryByText('Administrador')).not.toBeInTheDocument();
    expect(screen.queryByText('Sair')).not.toBeInTheDocument();
  });

  test('shows admin controls when logged in as admin', () => {
    (useAdmin as jest.Mock).mockReturnValue({
      isAdmin: true,
      login: jest.fn(),
      logout: jest.fn()
    });

    render(
      <AdminProvider>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Navigation />
        </MemoryRouter>
      </AdminProvider>
    );
    
    expect(screen.getByText('Administrador')).toBeInTheDocument();
    expect(screen.getByText('Sair')).toBeInTheDocument();
    expect(screen.queryByText('Admin')).not.toBeInTheDocument();
  });

  test('highlights admin link when on admin route', () => {
    (useAdmin as jest.Mock).mockReturnValue({
      isAdmin: true,
      login: jest.fn(),
      logout: jest.fn()
    });

    render(
      <AdminProvider>
        <MemoryRouter initialEntries={['/admin/modules']}>
          <Navigation />
        </MemoryRouter>
      </AdminProvider>
    );
    
    const adminLink = screen.getByText('Administrador').closest('a');
    expect(adminLink).toHaveClass('bg-primary-50', 'text-primary-700');
  });

  test('handles logout when logout button is clicked', async () => {
    const mockLogout = jest.fn();
    (useAdmin as jest.Mock).mockReturnValue({
      isAdmin: true,
      login: jest.fn(),
      logout: mockLogout
    });

    render(
      <AdminProvider>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Navigation />
        </MemoryRouter>
      </AdminProvider>
    );
    
    const logoutButton = screen.getByText('Sair').closest('button');
    await user.click(logoutButton!);
    
    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  test('renders icons for all navigation items', () => {
    render(
      <AdminProvider>
        <MemoryRouter>
          <Navigation />
        </MemoryRouter>
      </AdminProvider>
    );
    
    expect(screen.getByTestId('book-icon')).toBeInTheDocument();
    expect(screen.getByTestId('home-icon')).toBeInTheDocument();
    expect(screen.getByTestId('network-icon')).toBeInTheDocument();
    expect(screen.getByTestId('brain-icon')).toBeInTheDocument();
    expect(screen.getByTestId('filetext-icon')).toBeInTheDocument();
    expect(screen.getByTestId('library-icon')).toBeInTheDocument();
    expect(screen.getByTestId('search-icon')).toBeInTheDocument();
  });

  test('applies responsive classes to navigation items', () => {
    render(
      <AdminProvider>
        <MemoryRouter>
          <Navigation />
        </MemoryRouter>
      </AdminProvider>
    );
    
    const navLabels = screen.getAllByText(/Painel|Mapa Mental|Anotações|Recursos|Buscar/);
    navLabels.forEach(label => {
      if (label.tagName === 'SPAN') {
        expect(label).toHaveClass('hidden', 'sm:inline');
      }
    });
  });

  test('logo links to dashboard', () => {
    render(
      <AdminProvider>
        <MemoryRouter>
          <Navigation />
        </MemoryRouter>
      </AdminProvider>
    );
    
    const logoLink = screen.getByText('Psicologia de Jung').closest('a');
    expect(logoLink).toHaveAttribute('href', '/dashboard');
  });

  test('applies correct icon sizing', () => {
    render(
      <AdminProvider>
        <MemoryRouter>
          <Navigation />
        </MemoryRouter>
      </AdminProvider>
    );
    
    const bookIcon = screen.getByTestId('book-icon');
    expect(bookIcon).toHaveClass('w-8', 'h-8', 'text-primary-600');
    
    const homeIcon = screen.getByTestId('home-icon');
    expect(homeIcon).toHaveClass('w-4', 'h-4');
  });

  test('admin settings icon shows when not admin', () => {
    render(
      <AdminProvider>
        <MemoryRouter>
          <Navigation />
        </MemoryRouter>
      </AdminProvider>
    );
    
    const settingsIcons = screen.getAllByTestId('settings-icon');
    expect(settingsIcons.length).toBeGreaterThan(0);
  });

  test('logout icon shows when admin', () => {
    (useAdmin as jest.Mock).mockReturnValue({
      isAdmin: true,
      login: jest.fn(),
      logout: jest.fn()
    });

    render(
      <AdminProvider>
        <MemoryRouter>
          <Navigation />
        </MemoryRouter>
      </AdminProvider>
    );
    
    expect(screen.getByTestId('logout-icon')).toBeInTheDocument();
  });

  test('navigation has correct container and layout classes', () => {
    const { container } = render(
      <AdminProvider>
        <MemoryRouter>
          <Navigation />
        </MemoryRouter>
      </AdminProvider>
    );
    
    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('bg-white', 'shadow-sm', 'border-b', 'border-gray-200');
    
    const containerDiv = nav?.querySelector('.container');
    expect(containerDiv).toHaveClass('mx-auto', 'px-4');
    
    const flexDiv = containerDiv?.querySelector('.flex');
    expect(flexDiv).toHaveClass('items-center', 'justify-between', 'h-16');
  });

  test('all navigation links have correct transition classes', () => {
    render(
      <AdminProvider>
        <MemoryRouter>
          <Navigation />
        </MemoryRouter>
      </AdminProvider>
    );
    
    const links = screen.getAllByRole('link').filter(link => 
      link.textContent?.match(/Painel|Mapa Mental|Anotações|Recursos|Buscar/)
    );
    
    links.forEach(link => {
      expect(link).toHaveClass('transition-all', 'duration-200');
    });
  });

  test('handles navigation for enhanced mindmap', () => {
    render(
      <AdminProvider>
        <MemoryRouter initialEntries={['/enhanced-mindmap']}>
          <Navigation />
        </MemoryRouter>
      </AdminProvider>
    );
    
    const enhancedMindmapLink = screen.getByText('Mapa Mental IA').closest('a');
    expect(enhancedMindmapLink).toHaveClass('bg-primary-50', 'text-primary-700');
  });
});