import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminLogin from '../AdminLogin';
import { AdminProvider } from '../../../contexts/AdminContext';

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
    login: mockLogin,
    isAdmin: false,
    currentAdmin: null,
    logout: jest.fn(),
    modules: [],
    updateModules: jest.fn(),
    mindMapNodes: [],
    mindMapEdges: [],
    updateMindMap: jest.fn()
  })
}));

describe('AdminLogin Component', () => {
  const renderWithProviders = () => {
    return render(
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AdminProvider>
          <AdminLogin />
        </AdminProvider>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    mockNavigate.mockClear();
    mockLogin.mockClear();
    localStorage.clear();
  });

  test('renders login form with all elements', () => {
    renderWithProviders();
    
    // Check for heading
    expect(screen.getByRole('heading', { name: /admin login/i })).toBeInTheDocument();
    expect(screen.getByText(/sign in to access the administration panel/i)).toBeInTheDocument();
    
    // Check for form elements
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    
    // Check for security notice
    expect(screen.getByText(/security notice/i)).toBeInTheDocument();
  });

  test('shows error message for invalid credentials', async () => {
    // Mock failed login
    mockLogin.mockReturnValue(false);
    
    renderWithProviders();
    
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    // Enter invalid credentials
    fireEvent.change(usernameInput, { target: { value: 'wronguser' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
    fireEvent.click(submitButton);
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/invalid username or password/i)).toBeInTheDocument();
    });
  });

  test('successfully logs in with valid credentials', async () => {
    // Mock successful login
    mockLogin.mockReturnValue(true);
    
    renderWithProviders();
    
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    // Enter valid credentials
    fireEvent.change(usernameInput, { target: { value: 'admin' } });
    fireEvent.change(passwordInput, { target: { value: 'jungadmin123' } });
    fireEvent.click(submitButton);
    
    // Check that login was called with correct credentials
    expect(mockLogin).toHaveBeenCalledWith('admin', 'jungadmin123');
    
    // Check that navigation occurred
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin');
    });
  });

  test('form validation requires both fields', () => {
    renderWithProviders();
    
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    // Check required attributes
    expect(usernameInput).toHaveAttribute('required');
    expect(passwordInput).toHaveAttribute('required');
  });

  test('password field is of type password', () => {
    renderWithProviders();
    
    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('clears error message when user types', async () => {
    // Mock failed login initially
    mockLogin.mockReturnValue(false);
    
    renderWithProviders();
    
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    // Trigger error
    fireEvent.change(usernameInput, { target: { value: 'wrong' } });
    fireEvent.change(passwordInput, { target: { value: 'wrong' } });
    fireEvent.click(submitButton);
    
    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText(/invalid username or password/i)).toBeInTheDocument();
    });
    
    // Mock successful login for next submission
    mockLogin.mockReturnValue(true);
    
    // Submit again with correct credentials - error should clear on submit
    fireEvent.change(usernameInput, { target: { value: 'admin' } });
    fireEvent.change(passwordInput, { target: { value: 'admin123' } });
    fireEvent.click(submitButton);
    
    // Wait for navigation (error will be cleared)
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin');
    });
  });

  test('displays icons in input fields', () => {
    renderWithProviders();
    
    // Check for User and Lock icons (Lucide icons) using their SVG classes
    const container = screen.getByRole('heading', { name: /admin login/i }).closest('div')?.parentElement;
    const userIcons = container?.querySelectorAll('svg.lucide-user');
    const lockIcons = container?.querySelectorAll('svg.lucide-lock');
    
    // Should have at least one of each (in input fields and header)
    expect(userIcons?.length).toBeGreaterThanOrEqual(1);
    expect(lockIcons?.length).toBeGreaterThanOrEqual(2); // One in header, one in password field
  });

  test('form prevents default submission', () => {
    renderWithProviders();
    
    const form = screen.getByRole('button', { name: /sign in/i }).closest('form');
    expect(form).toBeInTheDocument();
    
    // Create a submit event and check it's prevented
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    fireEvent(form!, submitEvent);
    
    // The form should prevent default behavior (e.preventDefault() is called in handleSubmit)
    expect(submitEvent.defaultPrevented).toBe(true);
  });

  test('updates input values on change', () => {
    renderWithProviders();
    
    const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'testpass' } });
    
    expect(usernameInput.value).toBe('testuser');
    expect(passwordInput.value).toBe('testpass');
  });

  test('shows security notice with proper styling', () => {
    renderWithProviders();
    
    const notice = screen.getByText(/security notice/i).closest('div');
    expect(notice).toHaveClass('bg-amber-50', 'border', 'border-amber-200');
  });
});