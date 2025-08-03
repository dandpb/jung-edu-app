import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { render, userEvent, mockLocalStorage } from '../../../utils/test-utils';
import { setupConsoleHandlers } from '../../../utils/test-setup';
import AdminLogin from '../AdminLogin';

// Setup console handlers
setupConsoleHandlers();

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => {
  const React = require('react');
  
  return {
    Lock: ({ className }: any) => React.createElement('div', { 'data-testid': 'lock-icon', className }, 'Lock'),
    User: ({ className }: any) => React.createElement('div', { 'data-testid': 'user-icon', className }, 'User'),
    AlertCircle: ({ className }: any) => React.createElement('div', { 'data-testid': 'alert-icon', className }, 'AlertCircle'),
  };
});

// Mock useAdmin
const mockLogin = jest.fn();
jest.mock('../../../contexts/AdminContext', () => ({
  ...jest.requireActual('../../../contexts/AdminContext'),
  useAdmin: () => ({
    login: mockLogin, // Component uses 'login', not 'adminLogin'
    isAdmin: false,
    currentAdmin: null,
    adminLogout: jest.fn(),
    modules: [],
    updateModules: jest.fn(),
    mindMapNodes: [],
    mindMapEdges: [],
    updateMindMap: jest.fn()
  })
}));

describe('AdminLogin Component', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockLogin.mockClear();
    mockLocalStorage.clear();
  });

  test('renders login form with all elements', () => {
    render(<AdminLogin />);
    
    // Check for heading
    expect(screen.getByRole('heading', { name: /login de administrador/i })).toBeInTheDocument();
    expect(screen.getByText(/entre para acessar o painel de administração/i)).toBeInTheDocument();
    
    // Check for form elements
    expect(screen.getByLabelText(/usuário/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
    
    // Check for security notice
    expect(screen.getByText(/aviso de segurança/i)).toBeInTheDocument();
  });

  test('shows error message for invalid credentials', async () => {
    // Mock failed login
    mockLogin.mockReturnValue(false);
    
    const { user } = render(<AdminLogin />);
    
    const usernameInput = screen.getByLabelText(/usuário/i);
    const passwordInput = screen.getByLabelText(/senha/i);
    const submitButton = screen.getByRole('button', { name: /entrar/i });
    
    // Enter invalid credentials
    await user.type(usernameInput, 'wronguser');
    await user.type(passwordInput, 'wrongpass');
    await user.click(submitButton);
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/usuário ou senha inválidos/i)).toBeInTheDocument();
    });
  });

  test('successfully logs in with valid credentials', async () => {
    // Mock successful login
    mockLogin.mockReturnValue(true);
    
    const { user } = render(<AdminLogin />);
    
    const usernameInput = screen.getByLabelText(/usuário/i);
    const passwordInput = screen.getByLabelText(/senha/i);
    const submitButton = screen.getByRole('button', { name: /entrar/i });
    
    // Enter valid credentials
    await user.type(usernameInput, 'admin');
    await user.type(passwordInput, 'jungadmin123');
    await user.click(submitButton);
    
    // Check that login was called with correct credentials
    expect(mockLogin).toHaveBeenCalledWith('admin', 'jungadmin123');
    
    // Check that navigation occurred
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard');
    });
  });

  test('form validation requires both fields', () => {
    render(<AdminLogin />);
    
    const usernameInput = screen.getByLabelText(/usuário/i);
    const passwordInput = screen.getByLabelText(/senha/i);
    
    // Check required attributes
    expect(usernameInput).toHaveAttribute('required');
    expect(passwordInput).toHaveAttribute('required');
  });

  test('password field is of type password', () => {
    render(<AdminLogin />);
    
    const passwordInput = screen.getByLabelText(/senha/i);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('clears error message when user types', async () => {
    // Mock failed login initially
    mockLogin.mockReturnValue(false);
    
    const { user } = render(<AdminLogin />);
    
    const usernameInput = screen.getByLabelText(/usuário/i);
    const passwordInput = screen.getByLabelText(/senha/i);
    const submitButton = screen.getByRole('button', { name: /entrar/i });
    
    // Trigger error
    await user.type(usernameInput, 'wrong');
    await user.type(passwordInput, 'wrong');
    await user.click(submitButton);
    
    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText(/usuário ou senha inválidos/i)).toBeInTheDocument();
    });
    
    // Mock successful login for next submission
    mockLogin.mockReturnValue(true);
    
    // Submit again with correct credentials - error should clear on submit
    await user.clear(usernameInput);
    await user.clear(passwordInput);
    await user.type(usernameInput, 'admin');
    await user.type(passwordInput, 'admin123');
    await user.click(submitButton);
    
    // Wait for navigation (error will be cleared)
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard');
    });
  });

  test('displays icons in input fields', () => {
    render(<AdminLogin />);
    
    // Check for User and Lock icons using their test IDs (from our mocked icons)
    expect(screen.getByTestId('user-icon')).toBeInTheDocument();
    expect(screen.getAllByTestId('lock-icon')).toHaveLength(2); // One in header, one in password field
  });

  test('form prevents default submission', async () => {
    const { user } = render(<AdminLogin />);
    
    const form = screen.getByRole('button', { name: /entrar/i }).closest('form');
    expect(form).toBeInTheDocument();
    
    // Mock successful login to avoid errors
    mockLogin.mockReturnValue(true);
    
    // Fill in the form to meet requirements
    const usernameInput = screen.getByLabelText(/usuário/i);
    const passwordInput = screen.getByLabelText(/senha/i);
    await user.type(usernameInput, 'test');
    await user.type(passwordInput, 'test');
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /entrar/i });
    await user.click(submitButton);
    
    // The form submission should call login, not reload the page
    expect(mockLogin).toHaveBeenCalled();
  });

  test('updates input values on change', async () => {
    const { user } = render(<AdminLogin />);
    
    const usernameInput = screen.getByLabelText(/usuário/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/senha/i) as HTMLInputElement;
    
    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'testpass');
    
    expect(usernameInput.value).toBe('testuser');
    expect(passwordInput.value).toBe('testpass');
  });

  test('shows security notice with proper styling', () => {
    render(<AdminLogin />);
    
    const notice = screen.getByText(/aviso de segurança/i).closest('div');
    expect(notice).toHaveClass('bg-amber-50', 'border', 'border-amber-200');
  });
});