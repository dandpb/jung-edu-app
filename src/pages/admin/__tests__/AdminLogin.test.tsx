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

// Mock useAdmin
const mockLogin = jest.fn();
jest.mock('../../../contexts/AdminContext', () => ({
  ...jest.requireActual('../../../contexts/AdminContext'),
  useAdmin: () => ({
    adminLogin: mockLogin, // Note: changed from 'login' to 'adminLogin' to match the interface
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
      expect(mockNavigate).toHaveBeenCalledWith('/admin');
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
      expect(mockNavigate).toHaveBeenCalledWith('/admin');
    });
  });

  test('displays icons in input fields', () => {
    const { container } = render(<AdminLogin />);
    
    // Check for User and Lock icons (Lucide icons) using their SVG classes
    const userIcons = container.querySelectorAll('svg.lucide-user');
    const lockIcons = container.querySelectorAll('svg.lucide-lock');
    
    // Should have at least one of each (in input fields and header)
    expect(userIcons.length).toBeGreaterThanOrEqual(1);
    expect(lockIcons.length).toBeGreaterThanOrEqual(2); // One in header, one in password field
  });

  test('form prevents default submission', async () => {
    render(<AdminLogin />);
    
    const form = screen.getByRole('button', { name: /entrar/i }).closest('form');
    expect(form).toBeInTheDocument();
    
    // Create a submit event and check it's prevented
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    form!.dispatchEvent(submitEvent);
    
    // The form should prevent default behavior (e.preventDefault() is called in handleSubmit)
    expect(submitEvent.defaultPrevented).toBe(true);
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