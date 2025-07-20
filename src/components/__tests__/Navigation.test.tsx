import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import Navigation from '../Navigation';
import { AdminProvider } from '../../contexts/AdminContext';

describe('Navigation Component', () => {
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

  test('renders icons for each navigation item', () => {
    const { container } = render(
      <AdminProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Navigation />
        </BrowserRouter>
      </AdminProvider>
    );
    
    const icons = container.querySelectorAll('svg');
    // 1 logo icon + 6 nav icons + 1 admin icon = 8 total
    expect(icons.length).toBe(8);
  });

  test('logo links to dashboard', () => {
    render(
      <AdminProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Navigation />
        </BrowserRouter>
      </AdminProvider>
    );
    
    const logo = screen.getByText("Psicologia de Jung").closest('a');
    expect(logo).toHaveAttribute('href', '/dashboard');
  });

  test('responsive design hides labels on small screens', () => {
    const { container } = render(
      <AdminProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Navigation />
        </BrowserRouter>
      </AdminProvider>
    );
    
    const hiddenLabels = container.querySelectorAll('.hidden.sm\\:inline');
    expect(hiddenLabels.length).toBe(7); // All nav items + admin link have hidden labels on mobile
  });
});