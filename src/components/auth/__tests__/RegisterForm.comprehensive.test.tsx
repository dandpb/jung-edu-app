/**
 * RegisterForm Component - Comprehensive Tests
 * Tests covering form validation, password strength, user registration flow,
 * error handling, accessibility, and user interactions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { RegisterForm } from '../RegisterForm';
import { useAuth } from '../../../contexts/AuthContext';
import { AuthError, UserRole } from '../../../types/auth';
import { validatePassword } from '../../../services/auth/crypto';

// Mock the AuthContext hook
jest.mock('../../../contexts/AuthContext');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock the crypto validation
jest.mock('../../../services/auth/crypto');
const mockValidatePassword = validatePassword as jest.MockedFunction<typeof validatePassword>;

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Test wrapper with router
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MemoryRouter>
    {children}
  </MemoryRouter>
);

describe('RegisterForm Component', () => {
  const defaultAuthContext = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn().mockResolvedValue(undefined),
    requestPasswordReset: jest.fn(),
    resetPassword: jest.fn(),
    changePassword: jest.fn(),
    verifyEmail: jest.fn(),
    resendVerificationEmail: jest.fn(),
    hasPermission: jest.fn().mockReturnValue(false),
    hasRole: jest.fn().mockReturnValue(false),
    refreshSession: jest.fn(),
    clearError: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue(defaultAuthContext);
    
    // Default password validation mock
    mockValidatePassword.mockReturnValue({
      valid: true,
      strength: 'strong',
      errors: []
    });
  });

  describe('Rendering', () => {
    it('should render registration form with all elements', () => {
      render(
        <TestWrapper>
          <RegisterForm />
        </TestWrapper>
      );

      // Header elements - use more specific selectors to avoid multiple element conflicts
      expect(screen.getByRole('heading', { name: 'Criar Conta' })).toBeInTheDocument();
      expect(screen.getByText('Junte-se à plataforma educacional de Jung')).toBeInTheDocument();

      // Form fields - use more specific selectors
      expect(screen.getByLabelText('Nome')).toBeInTheDocument();
      expect(screen.getByLabelText('Sobrenome')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Usuário')).toBeInTheDocument();
      expect(screen.getByLabelText('Tipo de Conta')).toBeInTheDocument();
      expect(screen.getByLabelText('Senha')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirmar Senha')).toBeInTheDocument();

      // Submit button and links
      expect(screen.getByRole('button', { name: /criar conta/i })).toBeInTheDocument();
      expect(screen.getByText(/já tem uma conta\?/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /fazer login/i })).toBeInTheDocument();
    });

    it('should display authentication errors', () => {
      const error = new AuthError('AUTH_EMAIL_EXISTS', 'Email already exists');

      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        error
      });

      render(
        <TestWrapper>
          <RegisterForm />
        </TestWrapper>
      );

      expect(screen.getByText('Email already exists')).toBeInTheDocument();
    });
  });

  describe('Form Field Interactions', () => {
    it('should update all form fields on input', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <RegisterForm />
        </TestWrapper>
      );

      // Fill all form fields
      await user.type(screen.getByLabelText('Nome'), 'João');
      await user.type(screen.getByLabelText('Sobrenome'), 'Silva');
      await user.type(screen.getByLabelText('Email'), 'joao@example.com');
      await user.type(screen.getByLabelText('Usuário'), 'joaosilva');
      await user.type(screen.getByLabelText('Senha'), 'SecurePass123!');
      await user.type(screen.getByLabelText('Confirmar Senha'), 'SecurePass123!');

      // Check all values
      expect(screen.getByLabelText('Nome')).toHaveValue('João');
      expect(screen.getByLabelText('Sobrenome')).toHaveValue('Silva');
      expect(screen.getByLabelText('Email')).toHaveValue('joao@example.com');
      expect(screen.getByLabelText('Usuário')).toHaveValue('joaosilva');
      expect(screen.getByLabelText('Senha')).toHaveValue('SecurePass123!');
      expect(screen.getByLabelText('Confirmar Senha')).toHaveValue('SecurePass123!');
    });

    it('should change user role selection', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <RegisterForm />
        </TestWrapper>
      );

      const roleSelect = screen.getByLabelText('Tipo de Conta');
      expect(roleSelect).toHaveValue(UserRole.STUDENT);

      await user.selectOptions(roleSelect, UserRole.INSTRUCTOR);
      expect(roleSelect).toHaveValue(UserRole.INSTRUCTOR);
    });

    it('should toggle password visibility', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <RegisterForm />
        </TestWrapper>
      );

      const passwordInput = screen.getByLabelText('Senha');
      const confirmPasswordInput = screen.getByLabelText('Confirmar Senha');
      
      // Get toggle buttons (there should be two)
      const toggleButtons = screen.getAllByRole('button', { name: '' }); // Icons don't have text
      const passwordToggle = toggleButtons[0];
      const confirmPasswordToggle = toggleButtons[1];

      // Initially password type
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(confirmPasswordInput).toHaveAttribute('type', 'password');

      // Toggle password visibility
      await user.click(passwordToggle);
      expect(passwordInput).toHaveAttribute('type', 'text');

      await user.click(confirmPasswordToggle);
      expect(confirmPasswordInput).toHaveAttribute('type', 'text');
    });
  });

  describe('Password Strength Indicator', () => {
    it('should display password strength indicator', async () => {
      mockValidatePassword.mockReturnValue({
        valid: false,
        strength: 'weak',
        errors: ['Password too short']
      });

      const user = userEvent.setup();
      render(
        <TestWrapper>
          <RegisterForm />
        </TestWrapper>
      );

      const passwordInput = screen.getByLabelText('Senha');
      await user.type(passwordInput, '123');

      expect(screen.getByText('Força da senha:')).toBeInTheDocument();
      expect(screen.getByText('Fraca')).toBeInTheDocument();
    });

    it('should show password validation errors', async () => {
      mockValidatePassword.mockReturnValue({
        valid: false,
        strength: 'weak',
        errors: ['Password must be at least 8 characters', 'Password must contain uppercase letters']
      });

      const user = userEvent.setup();
      render(
        <TestWrapper>
          <RegisterForm />
        </TestWrapper>
      );

      const passwordInput = screen.getByLabelText('Senha');
      await user.type(passwordInput, 'weak');

      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
      expect(screen.getByText('Password must contain uppercase letters')).toBeInTheDocument();
    });

    it('should show strong password indicator', async () => {
      mockValidatePassword.mockReturnValue({
        valid: true,
        strength: 'very-strong',
        errors: []
      });

      const user = userEvent.setup();
      render(
        <TestWrapper>
          <RegisterForm />
        </TestWrapper>
      );

      const passwordInput = screen.getByLabelText('Senha');
      await user.type(passwordInput, 'VerySecurePassword123!@#');

      expect(screen.getByText('Muito Forte')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should validate email format', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <RegisterForm />
        </TestWrapper>
      );

      // Fill form with invalid email
      await user.type(screen.getByLabelText('Nome'), 'João');
      await user.type(screen.getByLabelText('Sobrenome'), 'Silva');
      await user.type(screen.getByLabelText('Email'), 'invalid-email');
      await user.type(screen.getByLabelText('Usuário'), 'joao');
      await user.type(screen.getByLabelText(/^senha$/i), 'ValidPass123!');
      await user.type(screen.getByLabelText('Confirmar Senha'), 'ValidPass123!');

      // Submit form
      await user.click(screen.getByRole('button', { name: /criar conta/i }));

      expect(screen.getByText('Email inválido')).toBeInTheDocument();
    });

    it('should validate username format and length', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <RegisterForm />
        </TestWrapper>
      );

      // Test short username
      await user.type(screen.getByLabelText('Usuário'), 'ab');
      await user.click(screen.getByRole('button', { name: /criar conta/i }));

      expect(screen.getByText('Usuário deve ter pelo menos 3 caracteres')).toBeInTheDocument();
    });

    it('should validate password confirmation match', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <RegisterForm />
        </TestWrapper>
      );

      // Fill passwords that don't match
      await user.type(screen.getByLabelText(/^senha$/i), 'Password123!');
      await user.type(screen.getByLabelText('Confirmar Senha'), 'DifferentPass123!');

      await user.click(screen.getByRole('button', { name: /criar conta/i }));

      expect(screen.getByText('As senhas não coincidem')).toBeInTheDocument();
    });

    it('should show password match confirmation', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <RegisterForm />
        </TestWrapper>
      );

      const password = 'MatchingPass123!';
      await user.type(screen.getByLabelText(/^senha$/i), password);
      await user.type(screen.getByLabelText('Confirmar Senha'), password);

      expect(screen.getByText('Senhas coincidem')).toBeInTheDocument();
    });

    it('should validate name fields length', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <RegisterForm />
        </TestWrapper>
      );

      // Test short names
      await user.type(screen.getByLabelText('Nome'), 'A');
      await user.type(screen.getByLabelText('Sobrenome'), 'B');

      await user.click(screen.getByRole('button', { name: /criar conta/i }));

      expect(screen.getByText('Nome deve ter pelo menos 2 caracteres')).toBeInTheDocument();
      expect(screen.getByText('Sobrenome deve ter pelo menos 2 caracteres')).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should call register with correct data on valid form submission', async () => {
      const registerMock = jest.fn().mockResolvedValue(undefined);
      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        register: registerMock
      });

      const user = userEvent.setup();
      render(
        <TestWrapper>
          <RegisterForm />
        </TestWrapper>
      );

      // Fill valid form data
      await user.type(screen.getByLabelText('Nome'), 'João');
      await user.type(screen.getByLabelText('Sobrenome'), 'Silva');
      await user.type(screen.getByLabelText('Email'), 'joao@example.com');
      await user.type(screen.getByLabelText('Usuário'), 'joaosilva');
      await user.selectOptions(screen.getByLabelText('Tipo de Conta'), UserRole.INSTRUCTOR);
      await user.type(screen.getByLabelText(/^senha$/i), 'SecurePass123!');
      await user.type(screen.getByLabelText('Confirmar Senha'), 'SecurePass123!');

      // Submit form
      await user.click(screen.getByRole('button', { name: /criar conta/i }));

      await waitFor(() => {
        expect(registerMock).toHaveBeenCalledWith({
          firstName: 'João',
          lastName: 'Silva',
          email: 'joao@example.com',
          username: 'joaosilva',
          role: UserRole.INSTRUCTOR,
          password: 'SecurePass123!'
        });
      });
    });

    it('should show loading state during submission', async () => {
      let resolveRegister: () => void;
      const registerPromise = new Promise<void>((resolve) => {
        resolveRegister = resolve;
      });

      const registerMock = jest.fn().mockReturnValue(registerPromise);
      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        register: registerMock
      });

      const user = userEvent.setup();
      render(
        <TestWrapper>
          <RegisterForm />
        </TestWrapper>
      );

      // Fill valid form and submit
      await user.type(screen.getByLabelText('Nome'), 'João');
      await user.type(screen.getByLabelText('Sobrenome'), 'Silva');
      await user.type(screen.getByLabelText('Email'), 'joao@example.com');
      await user.type(screen.getByLabelText('Usuário'), 'joaosilva');
      await user.type(screen.getByLabelText(/^senha$/i), 'SecurePass123!');
      await user.type(screen.getByLabelText('Confirmar Senha'), 'SecurePass123!');

      const submitButton = screen.getByRole('button', { name: /criar conta/i });
      await user.click(submitButton);

      // Should show loading state
      expect(screen.getByText('Criando conta...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      // Resolve registration
      resolveRegister!();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /criar conta/i })).toBeInTheDocument();
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('should not submit with validation errors', async () => {
      const registerMock = jest.fn();
      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        register: registerMock
      });

      mockValidatePassword.mockReturnValue({
        valid: false,
        strength: 'weak',
        errors: ['Password too weak']
      });

      const user = userEvent.setup();
      render(
        <TestWrapper>
          <RegisterForm />
        </TestWrapper>
      );

      // Fill form with validation errors
      await user.type(screen.getByLabelText('Email'), 'invalid-email');
      await user.type(screen.getByLabelText(/^senha$/i), 'weak');
      await user.type(screen.getByLabelText('Confirmar Senha'), 'different');

      await user.click(screen.getByRole('button', { name: /criar conta/i }));

      // Should not call register
      expect(registerMock).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should clear validation errors when user corrects input', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <RegisterForm />
        </TestWrapper>
      );

      // Create validation error
      await user.type(screen.getByLabelText('Email'), 'invalid');
      await user.click(screen.getByRole('button', { name: /criar conta/i }));
      expect(screen.getByText('Email inválido')).toBeInTheDocument();

      // Correct the error
      await user.clear(screen.getByLabelText('Email'));
      await user.type(screen.getByLabelText('Email'), 'valid@example.com');

      expect(screen.queryByText('Email inválido')).not.toBeInTheDocument();
    });

    it('should handle registration errors gracefully', async () => {
      const registerMock = jest.fn().mockRejectedValue(new Error('Network error'));
      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        register: registerMock
      });

      const user = userEvent.setup();
      render(
        <TestWrapper>
          <RegisterForm />
        </TestWrapper>
      );

      // Fill valid form
      await user.type(screen.getByLabelText('Nome'), 'João');
      await user.type(screen.getByLabelText('Sobrenome'), 'Silva');
      await user.type(screen.getByLabelText('Email'), 'joao@example.com');
      await user.type(screen.getByLabelText('Usuário'), 'joaosilva');
      await user.type(screen.getByLabelText(/^senha$/i), 'SecurePass123!');
      await user.type(screen.getByLabelText('Confirmar Senha'), 'SecurePass123!');

      await user.click(screen.getByRole('button', { name: /criar conta/i }));

      // Should reset loading state even on error
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /criar conta/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /criar conta/i })).not.toBeDisabled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels and associations', () => {
      render(
        <TestWrapper>
          <RegisterForm />
        </TestWrapper>
      );

      // Check that all inputs have associated labels
      expect(screen.getByLabelText('Nome')).toHaveAttribute('id', 'firstName');
      expect(screen.getByLabelText('Sobrenome')).toHaveAttribute('id', 'lastName');
      expect(screen.getByLabelText('Email')).toHaveAttribute('id', 'email');
      expect(screen.getByLabelText('Usuário')).toHaveAttribute('id', 'username');
      expect(screen.getByLabelText('Tipo de Conta')).toHaveAttribute('id', 'role');
      expect(screen.getByLabelText(/^senha$/i)).toHaveAttribute('id', 'password');
      expect(screen.getByLabelText('Confirmar Senha')).toHaveAttribute('id', 'confirmPassword');
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <RegisterForm />
        </TestWrapper>
      );

      // Tab through form elements
      await user.tab(); // firstName
      expect(screen.getByLabelText('Nome')).toHaveFocus();

      await user.tab(); // lastName  
      expect(screen.getByLabelText('Sobrenome')).toHaveFocus();

      await user.tab(); // email
      expect(screen.getByLabelText('Email')).toHaveFocus();

      await user.tab(); // username
      expect(screen.getByLabelText('Usuário')).toHaveFocus();
    });

    it('should have proper error messaging', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <RegisterForm />
        </TestWrapper>
      );

      await user.click(screen.getByRole('button', { name: /criar conta/i }));

      // Validation errors should be visible and associated with fields
      const emailError = screen.getByText('Email inválido');
      expect(emailError).toBeInTheDocument();
      expect(emailError).toHaveClass('text-red-600');
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in username validation', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <RegisterForm />
        </TestWrapper>
      );

      // Username with invalid characters
      await user.type(screen.getByLabelText('Usuário'), 'user@name');
      await user.click(screen.getByRole('button', { name: /criar conta/i }));

      expect(screen.getByText('Usuário deve conter apenas letras, números, - e _')).toBeInTheDocument();
    });

    it('should handle long form input values', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <RegisterForm />
        </TestWrapper>
      );

      const longName = 'A'.repeat(100);
      await user.type(screen.getByLabelText('Nome'), longName);

      expect(screen.getByLabelText('Nome')).toHaveValue(longName);
    });

    it('should prevent form submission during loading state', async () => {
      let resolveRegister: () => void;
      const registerPromise = new Promise<void>((resolve) => {
        resolveRegister = resolve;
      });

      const registerMock = jest.fn().mockReturnValue(registerPromise);
      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        register: registerMock
      });

      const user = userEvent.setup();
      render(
        <TestWrapper>
          <RegisterForm />
        </TestWrapper>
      );

      // Fill valid form
      await user.type(screen.getByLabelText('Nome'), 'João');
      await user.type(screen.getByLabelText('Sobrenome'), 'Silva');
      await user.type(screen.getByLabelText('Email'), 'joao@example.com');
      await user.type(screen.getByLabelText('Usuário'), 'joaosilva');
      await user.type(screen.getByLabelText(/^senha$/i), 'SecurePass123!');
      await user.type(screen.getByLabelText('Confirmar Senha'), 'SecurePass123!');

      const submitButton = screen.getByRole('button', { name: /criar conta/i });
      
      // Click multiple times
      await user.click(submitButton);
      await user.click(submitButton);
      await user.click(submitButton);

      // Should only be called once due to disabled state
      expect(registerMock).toHaveBeenCalledTimes(1);

      resolveRegister!();
    });
  });
});