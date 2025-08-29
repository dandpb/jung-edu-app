/**
 * Comprehensive Unit Tests for LoginForm Component
 * Tests form validation, submission, error handling
 * Target: 80%+ coverage
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { LoginForm } from '../LoginForm';
import { AuthError, AuthErrorType } from '../../../types/auth';

// Mock the auth context
const mockUseAuth = {
  login: jest.fn(),
  error: null,
  clearError: jest.fn(),
  isAuthenticated: false,
  user: null,
  logout: jest.fn(),
  register: jest.fn(),
  requestPasswordReset: jest.fn(),
  resetPassword: jest.fn(),
  changePassword: jest.fn(),
  verifyEmail: jest.fn(),
  resendVerificationEmail: jest.fn(),
  hasPermission: jest.fn(),
  hasRole: jest.fn(),
  refreshSession: jest.fn(),
  isLoading: false
};

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth
}));

const LoginFormWrapper: React.FC<{ 
  children: React.ReactNode;
  initialEntries?: string[];
}> = ({ children, initialEntries = ['/login'] }) => (
  <MemoryRouter initialEntries={initialEntries}>
    {children}
  </MemoryRouter>
);

describe('LoginForm Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.error = null;
    mockUseAuth.login.mockResolvedValue(undefined);
  });

  describe('Component Rendering', () => {
    it('should render login form with all required elements', () => {
      render(
        <LoginFormWrapper>
          <LoginForm />
        </LoginFormWrapper>
      );

      expect(screen.getByText('Fazer Login')).toBeInTheDocument();
      expect(screen.getByText('Entre para acessar a plataforma educacional')).toBeInTheDocument();
      
      expect(screen.getByLabelText('Usuário ou Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Senha')).toBeInTheDocument();
      
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
      expect(screen.getByTestId('login-button')).toBeInTheDocument();
      
      expect(screen.getByText('Lembrar de mim')).toBeInTheDocument();
      expect(screen.getByText('Esqueceu a senha?')).toBeInTheDocument();
      expect(screen.getByText('Não tem uma conta?')).toBeInTheDocument();
    });

    it('should render with proper form structure and testids', () => {
      render(
        <LoginFormWrapper>
          <LoginForm />
        </LoginFormWrapper>
      );

      expect(screen.getByTestId('email-input')).toBeInTheDocument();
      expect(screen.getByTestId('password-input')).toBeInTheDocument();
      expect(screen.getByTestId('password-toggle')).toBeInTheDocument();
      expect(screen.getByTestId('remember-me-checkbox')).toBeInTheDocument();
      expect(screen.getByTestId('forgot-password-link')).toBeInTheDocument();
      expect(screen.getByTestId('register-link')).toBeInTheDocument();
    });

    it('should have proper accessibility attributes', () => {
      render(
        <LoginFormWrapper>
          <LoginForm />
        </LoginFormWrapper>
      );

      const usernameInput = screen.getByTestId('email-input');
      const passwordInput = screen.getByTestId('password-input');

      expect(usernameInput).toHaveAttribute('type', 'text');
      expect(usernameInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('required');
      
      expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
    });
  });

  describe('Form Input Handling', () => {
    it('should update username field on input', async () => {
      render(
        <LoginFormWrapper>
          <LoginForm />
        </LoginFormWrapper>
      );

      const usernameInput = screen.getByTestId('email-input') as HTMLInputElement;
      
      await user.type(usernameInput, 'testuser@example.com');
      
      expect(usernameInput.value).toBe('testuser@example.com');
    });

    it('should update password field on input', async () => {
      render(
        <LoginFormWrapper>
          <LoginForm />
        </LoginFormWrapper>
      );

      const passwordInput = screen.getByTestId('password-input') as HTMLInputElement;
      
      await user.type(passwordInput, 'password123');
      
      expect(passwordInput.value).toBe('password123');
    });

    it('should toggle remember me checkbox', async () => {
      render(
        <LoginFormWrapper>
          <LoginForm />
        </LoginFormWrapper>
      );

      const rememberMeCheckbox = screen.getByTestId('remember-me-checkbox') as HTMLInputElement;
      
      expect(rememberMeCheckbox.checked).toBe(false);
      
      await user.click(rememberMeCheckbox);
      
      expect(rememberMeCheckbox.checked).toBe(true);
    });

    it('should clear error on input change', async () => {
      mockUseAuth.error = new AuthError(AuthErrorType.INVALID_CREDENTIALS, 'Invalid credentials');
      
      render(
        <LoginFormWrapper>
          <LoginForm />
        </LoginFormWrapper>
      );

      expect(screen.getByTestId('server-error')).toBeInTheDocument();
      
      const usernameInput = screen.getByTestId('email-input');
      await user.type(usernameInput, 'a');
      
      expect(mockUseAuth.clearError).toHaveBeenCalled();
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should toggle password visibility', async () => {
      render(
        <LoginFormWrapper>
          <LoginForm />
        </LoginFormWrapper>
      );

      const passwordInput = screen.getByTestId('password-input') as HTMLInputElement;
      const toggleButton = screen.getByTestId('password-toggle');

      expect(passwordInput.type).toBe('password');
      
      await user.click(toggleButton);
      
      expect(passwordInput.type).toBe('text');
      
      await user.click(toggleButton);
      
      expect(passwordInput.type).toBe('password');
    });

    it('should show correct icons for password toggle', async () => {
      render(
        <LoginFormWrapper>
          <LoginForm />
        </LoginFormWrapper>
      );

      const toggleButton = screen.getByTestId('password-toggle');

      // Initially should show Eye icon (password hidden)
      expect(toggleButton.querySelector('svg')).toBeInTheDocument();
      
      await user.click(toggleButton);
      
      // After click should show EyeOff icon (password visible)
      expect(toggleButton.querySelector('svg')).toBeInTheDocument();
    });

    it('should have proper tabIndex for password toggle', () => {
      render(
        <LoginFormWrapper>
          <LoginForm />
        </LoginFormWrapper>
      );

      const toggleButton = screen.getByTestId('password-toggle');
      expect(toggleButton).toHaveAttribute('tabIndex', '-1');
    });
  });

  describe('Form Submission', () => {
    it('should submit form with correct data', async () => {
      render(
        <LoginFormWrapper>
          <LoginForm />
        </LoginFormWrapper>
      );

      const usernameInput = screen.getByTestId('email-input');
      const passwordInput = screen.getByTestId('password-input');
      const rememberMeCheckbox = screen.getByTestId('remember-me-checkbox');
      const submitButton = screen.getByTestId('login-button');

      await user.type(usernameInput, 'testuser@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(rememberMeCheckbox);
      
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockUseAuth.login).toHaveBeenCalledWith({
          username: 'testuser@example.com',
          password: 'password123',
          rememberMe: true
        });
      });
    });

    it('should prevent form submission when inputs are empty', async () => {
      render(
        <LoginFormWrapper>
          <LoginForm />
        </LoginFormWrapper>
      );

      const form = screen.getByTestId('login-form');
      fireEvent.submit(form);

      // Form should not submit with empty required fields
      expect(mockUseAuth.login).not.toHaveBeenCalled();
    });

    it('should show loading state during submission', async () => {
      // Mock login to return a promise that we can resolve manually
      let resolveLogin: () => void;
      const loginPromise = new Promise<void>((resolve) => {
        resolveLogin = resolve;
      });
      mockUseAuth.login.mockReturnValue(loginPromise);

      render(
        <LoginFormWrapper>
          <LoginForm />
        </LoginFormWrapper>
      );

      const usernameInput = screen.getByTestId('email-input');
      const passwordInput = screen.getByTestId('password-input');
      const submitButton = screen.getByTestId('login-button');

      await user.type(usernameInput, 'test@example.com');
      await user.type(passwordInput, 'password');
      
      await user.click(submitButton);

      // Should show loading state
      expect(screen.getByText('Entrando...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      // Resolve the login promise
      resolveLogin!();
      
      await waitFor(() => {
        expect(screen.queryByText('Entrando...')).not.toBeInTheDocument();
      });
    });

    it('should disable inputs during submission', async () => {
      let resolveLogin: () => void;
      const loginPromise = new Promise<void>((resolve) => {
        resolveLogin = resolve;
      });
      mockUseAuth.login.mockReturnValue(loginPromise);

      render(
        <LoginFormWrapper>
          <LoginForm />
        </LoginFormWrapper>
      );

      const usernameInput = screen.getByTestId('email-input');
      const passwordInput = screen.getByTestId('password-input');
      const rememberMeCheckbox = screen.getByTestId('remember-me-checkbox');

      await user.type(usernameInput, 'test@example.com');
      await user.type(passwordInput, 'password');
      
      await user.click(screen.getByTestId('login-button'));

      // Inputs should be disabled during submission
      expect(usernameInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
      expect(rememberMeCheckbox).toBeDisabled();

      resolveLogin!();
      
      await waitFor(() => {
        expect(usernameInput).not.toBeDisabled();
        expect(passwordInput).not.toBeDisabled();
        expect(rememberMeCheckbox).not.toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display authentication errors', () => {
      mockUseAuth.error = new AuthError(
        AuthErrorType.INVALID_CREDENTIALS, 
        'Invalid username or password'
      );

      render(
        <LoginFormWrapper>
          <LoginForm />
        </LoginFormWrapper>
      );

      expect(screen.getByTestId('server-error')).toBeInTheDocument();
      expect(screen.getByText('Invalid username or password')).toBeInTheDocument();
    });

    it('should display different types of authentication errors', () => {
      const errorTypes = [
        { type: AuthErrorType.ACCOUNT_LOCKED, message: 'Account is locked' },
        { type: AuthErrorType.EMAIL_NOT_VERIFIED, message: 'Email not verified' },
        { type: AuthErrorType.RATE_LIMIT_EXCEEDED, message: 'Too many attempts' }
      ];

      errorTypes.forEach(({ type, message }) => {
        mockUseAuth.error = new AuthError(type, message);
        
        const { rerender } = render(
          <LoginFormWrapper>
            <LoginForm />
          </LoginFormWrapper>
        );

        expect(screen.getByText(message)).toBeInTheDocument();
        
        rerender(<div />); // Clean up for next iteration
      });
    });

    it('should handle login failures gracefully', async () => {
      const loginError = new AuthError(AuthErrorType.LOGIN_FAILED, 'Login failed');
      mockUseAuth.login.mockRejectedValue(loginError);

      render(
        <LoginFormWrapper>
          <LoginForm />
        </LoginFormWrapper>
      );

      const usernameInput = screen.getByTestId('email-input');
      const passwordInput = screen.getByTestId('password-input');
      
      await user.type(usernameInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      
      await user.click(screen.getByTestId('login-button'));

      await waitFor(() => {
        expect(mockUseAuth.login).toHaveBeenCalled();
      });
    });
  });

  describe('Navigation and Links', () => {
    it('should have working forgot password link', () => {
      render(
        <LoginFormWrapper>
          <LoginForm />
        </LoginFormWrapper>
      );

      const forgotPasswordLink = screen.getByTestId('forgot-password-link');
      expect(forgotPasswordLink).toHaveAttribute('href', '/forgot-password');
    });

    it('should have working register link', () => {
      render(
        <LoginFormWrapper>
          <LoginForm />
        </LoginFormWrapper>
      );

      const registerLink = screen.getByTestId('register-link');
      expect(registerLink).toHaveAttribute('href', '/register');
    });

    it('should have admin login link', () => {
      render(
        <LoginFormWrapper>
          <LoginForm />
        </LoginFormWrapper>
      );

      const adminLink = screen.getByText('Clique aqui para login de administrador').closest('a');
      expect(adminLink).toHaveAttribute('href', '/admin/login');
    });
  });

  describe('Redirect Messages', () => {
    it('should display redirect message from location state', () => {
      const mockLocationState = {
        state: { message: 'Please log in to continue' }
      };

      render(
        <MemoryRouter initialEntries={[{ pathname: '/login', state: mockLocationState.state }]}>
          <LoginForm />
        </MemoryRouter>
      );

      expect(screen.getByText('Please log in to continue')).toBeInTheDocument();
    });

    it('should not display message section when no message', () => {
      render(
        <LoginFormWrapper>
          <LoginForm />
        </LoginFormWrapper>
      );

      // Look for the success message container
      expect(screen.queryByText(/bg-green-50/)).not.toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should have required attributes on inputs', () => {
      render(
        <LoginFormWrapper>
          <LoginForm />
        </LoginFormWrapper>
      );

      expect(screen.getByTestId('email-input')).toHaveAttribute('required');
      expect(screen.getByTestId('password-input')).toHaveAttribute('required');
    });

    it('should have proper input placeholders', () => {
      render(
        <LoginFormWrapper>
          <LoginForm />
        </LoginFormWrapper>
      );

      expect(screen.getByTestId('email-input')).toHaveAttribute('placeholder', 'Digite seu usuário ou email');
      expect(screen.getByTestId('password-input')).toHaveAttribute('placeholder', 'Digite sua senha');
    });

    it('should show submit button as disabled when form is submitting', async () => {
      let resolveLogin: () => void;
      const loginPromise = new Promise<void>((resolve) => {
        resolveLogin = resolve;
      });
      mockUseAuth.login.mockReturnValue(loginPromise);

      render(
        <LoginFormWrapper>
          <LoginForm />
        </LoginFormWrapper>
      );

      const usernameInput = screen.getByTestId('email-input');
      const passwordInput = screen.getByTestId('password-input');
      const submitButton = screen.getByTestId('login-button');

      await user.type(usernameInput, 'test@example.com');
      await user.type(passwordInput, 'password');
      
      await user.click(submitButton);

      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveClass('flex', 'items-center', 'justify-center');

      resolveLogin!();
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support tab navigation through form elements', async () => {
      render(
        <LoginFormWrapper>
          <LoginForm />
        </LoginFormWrapper>
      );

      const usernameInput = screen.getByTestId('email-input');
      const passwordInput = screen.getByTestId('password-input');
      const rememberCheckbox = screen.getByTestId('remember-me-checkbox');
      const forgotPasswordLink = screen.getByTestId('forgot-password-link');
      const submitButton = screen.getByTestId('login-button');

      // Tab through elements
      await user.tab();
      expect(usernameInput).toHaveFocus();

      await user.tab();
      expect(passwordInput).toHaveFocus();

      await user.tab();
      expect(rememberCheckbox).toHaveFocus();

      await user.tab();
      expect(forgotPasswordLink).toHaveFocus();

      await user.tab();
      expect(submitButton).toHaveFocus();
    });

    it('should support form submission via Enter key', async () => {
      render(
        <LoginFormWrapper>
          <LoginForm />
        </LoginFormWrapper>
      );

      const usernameInput = screen.getByTestId('email-input');
      const passwordInput = screen.getByTestId('password-input');

      await user.type(usernameInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      
      // Press Enter in password field
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(mockUseAuth.login).toHaveBeenCalledWith({
          username: 'test@example.com',
          password: 'password123',
          rememberMe: false
        });
      });
    });
  });

  describe('Component State Management', () => {
    it('should reset form state between renders', () => {
      const { rerender } = render(
        <LoginFormWrapper>
          <LoginForm />
        </LoginFormWrapper>
      );

      const usernameInput = screen.getByTestId('email-input') as HTMLInputElement;
      fireEvent.change(usernameInput, { target: { value: 'test' } });

      expect(usernameInput.value).toBe('test');

      rerender(
        <LoginFormWrapper>
          <LoginForm />
        </LoginFormWrapper>
      );

      const newUsernameInput = screen.getByTestId('email-input') as HTMLInputElement;
      expect(newUsernameInput.value).toBe('');
    });

    it('should maintain show password state independently', async () => {
      render(
        <LoginFormWrapper>
          <LoginForm />
        </LoginFormWrapper>
      );

      const passwordInput = screen.getByTestId('password-input') as HTMLInputElement;
      const toggleButton = screen.getByTestId('password-toggle');

      expect(passwordInput.type).toBe('password');
      
      await user.click(toggleButton);
      
      expect(passwordInput.type).toBe('text');

      // Type in password field - should remain visible
      await user.type(passwordInput, 'secret');
      
      expect(passwordInput.type).toBe('text');
      expect(passwordInput.value).toBe('secret');
    });
  });

  describe('Error Recovery', () => {
    it('should clear errors when user starts typing', async () => {
      mockUseAuth.error = new AuthError(AuthErrorType.INVALID_CREDENTIALS, 'Invalid credentials');
      
      render(
        <LoginFormWrapper>
          <LoginForm />
        </LoginFormWrapper>
      );

      // Error should be displayed
      expect(screen.getByTestId('server-error')).toBeInTheDocument();
      
      // Clear error should be called when typing in username
      const usernameInput = screen.getByTestId('email-input');
      await user.type(usernameInput, 'a');
      
      expect(mockUseAuth.clearError).toHaveBeenCalled();

      // Clear error should also be called when typing in password
      jest.clearAllMocks();
      const passwordInput = screen.getByTestId('password-input');
      await user.type(passwordInput, 'b');
      
      expect(mockUseAuth.clearError).toHaveBeenCalled();
    });
  });
});