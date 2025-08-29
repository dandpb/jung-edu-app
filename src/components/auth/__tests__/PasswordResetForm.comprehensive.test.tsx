/**
 * PasswordResetForm Component - Comprehensive Tests
 * Tests covering form functionality, success/error states, validation,
 * accessibility, and user interactions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { PasswordResetForm } from '../PasswordResetForm';
import { useAuth } from '../../../contexts/AuthContext';
import { AuthError } from '../../../types/auth';

// Mock the AuthContext hook
jest.mock('../../../contexts/AuthContext');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Test wrapper with router
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MemoryRouter>
    {children}
  </MemoryRouter>
);

describe('PasswordResetForm Component', () => {
  const defaultAuthContext = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
    requestPasswordReset: jest.fn().mockResolvedValue(undefined),
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
  });

  describe('Initial Rendering', () => {
    it('should render password reset form with all elements', () => {
      render(
        <TestWrapper>
          <PasswordResetForm />
        </TestWrapper>
      );

      // Header elements
      expect(screen.getByText('Recuperar Senha')).toBeInTheDocument();
      expect(screen.getByText('Digite seu email para receber as instruções de recuperação')).toBeInTheDocument();

      // Form elements
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /enviar instruções/i })).toBeInTheDocument();

      // Navigation link
      expect(screen.getByRole('link', { name: /voltar ao login/i })).toBeInTheDocument();
    });

    it('should have proper form attributes and structure', () => {
      render(
        <TestWrapper>
          <PasswordResetForm />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /enviar instruções/i });

      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('required');
      expect(emailInput).toHaveAttribute('placeholder', 'seu@email.com');
      expect(submitButton).toHaveAttribute('type', 'submit');
    });

    it('should display authentication errors', () => {
      const error: AuthError = {
        message: 'User not found',
        code: 'AUTH_USER_NOT_FOUND',
        statusCode: 404
      };

      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        error
      });

      render(
        <TestWrapper>
          <PasswordResetForm />
        </TestWrapper>
      );

      expect(screen.getByText('User not found')).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('should update email field on input', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <PasswordResetForm />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'test@example.com');

      expect(emailInput).toHaveValue('test@example.com');
    });

    it('should clear error when user types', async () => {
      const clearErrorMock = jest.fn();
      const error: AuthError = {
        message: 'User not found',
        code: 'AUTH_USER_NOT_FOUND',
        statusCode: 404
      };

      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        error,
        clearError: clearErrorMock
      });

      const user = userEvent.setup();
      render(
        <TestWrapper>
          <PasswordResetForm />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'a');

      expect(clearErrorMock).toHaveBeenCalled();
    });

    it('should disable input during submission', async () => {
      let resolveRequest: () => void;
      const requestPromise = new Promise<void>((resolve) => {
        resolveRequest = resolve;
      });

      const requestPasswordResetMock = jest.fn().mockReturnValue(requestPromise);
      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        requestPasswordReset: requestPasswordResetMock
      });

      const user = userEvent.setup();
      render(
        <TestWrapper>
          <PasswordResetForm />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'test@example.com');
      await user.click(screen.getByRole('button', { name: /enviar instruções/i }));

      expect(emailInput).toBeDisabled();

      resolveRequest!();
      await waitFor(() => {
        expect(screen.getByText('Email Enviado!')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call requestPasswordReset with correct email on form submission', async () => {
      const requestPasswordResetMock = jest.fn().mockResolvedValue(undefined);
      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        requestPasswordReset: requestPasswordResetMock
      });

      const user = userEvent.setup();
      render(
        <TestWrapper>
          <PasswordResetForm />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'test@example.com');
      await user.click(screen.getByRole('button', { name: /enviar instruções/i }));

      await waitFor(() => {
        expect(requestPasswordResetMock).toHaveBeenCalledWith({
          email: 'test@example.com'
        });
      });
    });

    it('should prevent submission with empty email due to HTML5 validation', async () => {
      const requestPasswordResetMock = jest.fn();
      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        requestPasswordReset: requestPasswordResetMock
      });

      const user = userEvent.setup();
      render(
        <TestWrapper>
          <PasswordResetForm />
        </TestWrapper>
      );

      await user.click(screen.getByRole('button', { name: /enviar instruções/i }));

      // HTML5 validation should prevent submission
      expect(requestPasswordResetMock).not.toHaveBeenCalled();
    });

    it('should show loading state during submission', async () => {
      let resolveRequest: () => void;
      const requestPromise = new Promise<void>((resolve) => {
        resolveRequest = resolve;
      });

      const requestPasswordResetMock = jest.fn().mockReturnValue(requestPromise);
      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        requestPasswordReset: requestPasswordResetMock
      });

      const user = userEvent.setup();
      render(
        <TestWrapper>
          <PasswordResetForm />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /enviar instruções/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      // Should show loading state
      expect(screen.getByText('Enviando...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      resolveRequest!();
    });

    it('should handle form submission with Enter key', async () => {
      const requestPasswordResetMock = jest.fn().mockResolvedValue(undefined);
      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        requestPasswordReset: requestPasswordResetMock
      });

      const user = userEvent.setup();
      render(
        <TestWrapper>
          <PasswordResetForm />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'test@example.com{enter}');

      await waitFor(() => {
        expect(requestPasswordResetMock).toHaveBeenCalled();
      });
    });
  });

  describe('Success State', () => {
    it('should display success message after successful submission', async () => {
      const requestPasswordResetMock = jest.fn().mockResolvedValue(undefined);
      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        requestPasswordReset: requestPasswordResetMock
      });

      const user = userEvent.setup();
      render(
        <TestWrapper>
          <PasswordResetForm />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'test@example.com');
      await user.click(screen.getByRole('button', { name: /enviar instruções/i }));

      await waitFor(() => {
        expect(screen.getByText('Email Enviado!')).toBeInTheDocument();
        expect(screen.getByText(/enviamos instruções para redefinir sua senha para/i)).toBeInTheDocument();
        expect(screen.getByText('test@example.com')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /voltar ao login/i })).toBeInTheDocument();
      });

      // Original form should not be visible
      expect(screen.queryByText('Recuperar Senha')).not.toBeInTheDocument();
    });

    it('should have correct navigation link in success state', async () => {
      const requestPasswordResetMock = jest.fn().mockResolvedValue(undefined);
      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        requestPasswordReset: requestPasswordResetMock
      });

      const user = userEvent.setup();
      render(
        <TestWrapper>
          <PasswordResetForm />
        </TestWrapper>
      );

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.click(screen.getByRole('button', { name: /enviar instruções/i }));

      await waitFor(() => {
        const backToLoginLink = screen.getByRole('link', { name: /voltar ao login/i });
        expect(backToLoginLink).toHaveAttribute('href', '/login');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle request errors gracefully', async () => {
      const requestPasswordResetMock = jest.fn().mockRejectedValue(new Error('Network error'));
      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        requestPasswordReset: requestPasswordResetMock
      });

      const user = userEvent.setup();
      render(
        <TestWrapper>
          <PasswordResetForm />
        </TestWrapper>
      );

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.click(screen.getByRole('button', { name: /enviar instruções/i }));

      // Should reset loading state even on error
      await waitFor(() => {
        expect(screen.getByText('Enviar Instruções')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /enviar instruções/i })).not.toBeDisabled();
      });

      // Should not show success state on error
      expect(screen.queryByText('Email Enviado!')).not.toBeInTheDocument();
    });

    const errorScenarios = [
      {
        name: 'user not found error',
        error: {
          message: 'No user found with this email address',
          code: 'AUTH_USER_NOT_FOUND',
          statusCode: 404
        }
      },
      {
        name: 'rate limit error',
        error: {
          message: 'Too many password reset requests. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
          statusCode: 429
        }
      },
      {
        name: 'server error',
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR',
          statusCode: 500
        }
      }
    ];

    errorScenarios.forEach(({ name, error }) => {
      it(`should display ${name} correctly`, () => {
        mockUseAuth.mockReturnValue({
          ...defaultAuthContext,
          error
        });

        render(
          <TestWrapper>
            <PasswordResetForm />
          </TestWrapper>
        );

        expect(screen.getByText(error.message)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels and associations', () => {
      render(
        <TestWrapper>
          <PasswordResetForm />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAttribute('id', 'email');
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <PasswordResetForm />
        </TestWrapper>
      );

      // Tab to email input
      await user.tab();
      expect(screen.getByLabelText(/email/i)).toHaveFocus();

      // Tab to submit button
      await user.tab();
      expect(screen.getByRole('button', { name: /enviar instruções/i })).toHaveFocus();

      // Tab to back link
      await user.tab();
      expect(screen.getByRole('link', { name: /voltar ao login/i })).toHaveFocus();
    });

    it('should have proper error message accessibility', () => {
      const error: AuthError = {
        message: 'User not found',
        code: 'AUTH_USER_NOT_FOUND',
        statusCode: 404
      };

      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        error
      });

      render(
        <TestWrapper>
          <PasswordResetForm />
        </TestWrapper>
      );

      const errorMessage = screen.getByText('User not found');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage.closest('div')).toHaveClass('text-red-600');
    });

    it('should have accessible success state', async () => {
      const requestPasswordResetMock = jest.fn().mockResolvedValue(undefined);
      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        requestPasswordReset: requestPasswordResetMock
      });

      const user = userEvent.setup();
      render(
        <TestWrapper>
          <PasswordResetForm />
        </TestWrapper>
      );

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.click(screen.getByRole('button', { name: /enviar instruções/i }));

      await waitFor(() => {
        const successHeading = screen.getByText('Email Enviado!');
        expect(successHeading).toBeInTheDocument();
      });
    });
  });

  describe('Navigation Links', () => {
    it('should have correct back to login link', () => {
      render(
        <TestWrapper>
          <PasswordResetForm />
        </TestWrapper>
      );

      const backLink = screen.getByRole('link', { name: /voltar ao login/i });
      expect(backLink).toHaveAttribute('href', '/login');
    });

    it('should maintain navigation link during loading', async () => {
      let resolveRequest: () => void;
      const requestPromise = new Promise<void>((resolve) => {
        resolveRequest = resolve;
      });

      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        requestPasswordReset: jest.fn().mockReturnValue(requestPromise)
      });

      const user = userEvent.setup();
      render(
        <TestWrapper>
          <PasswordResetForm />
        </TestWrapper>
      );

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.click(screen.getByRole('button', { name: /enviar instruções/i }));

      // Navigation should still be available during loading
      expect(screen.getByRole('link', { name: /voltar ao login/i })).toBeInTheDocument();

      resolveRequest!();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long email addresses', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <PasswordResetForm />
        </TestWrapper>
      );

      const longEmail = 'verylongemailaddress'.repeat(10) + '@example.com';
      const emailInput = screen.getByLabelText(/email/i);

      await user.type(emailInput, longEmail);
      expect(emailInput).toHaveValue(longEmail);
    });

    it('should handle special characters in email', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <PasswordResetForm />
        </TestWrapper>
      );

      const specialEmail = 'user+test@domain-name.co.uk';
      const emailInput = screen.getByLabelText(/email/i);

      await user.type(emailInput, specialEmail);
      expect(emailInput).toHaveValue(specialEmail);
    });

    it('should handle rapid form submissions', async () => {
      const requestPasswordResetMock = jest.fn().mockResolvedValue(undefined);
      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        requestPasswordReset: requestPasswordResetMock
      });

      const user = userEvent.setup();
      render(
        <TestWrapper>
          <PasswordResetForm />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /enviar instruções/i });

      await user.type(emailInput, 'test@example.com');

      // Rapid clicks
      await user.click(submitButton);
      await user.click(submitButton);
      await user.click(submitButton);

      // Should only be called once due to disabled state during submission
      await waitFor(() => {
        expect(requestPasswordResetMock).toHaveBeenCalledTimes(1);
      });
    });

    it('should preserve email in success state', async () => {
      const requestPasswordResetMock = jest.fn().mockResolvedValue(undefined);
      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        requestPasswordReset: requestPasswordResetMock
      });

      const user = userEvent.setup();
      render(
        <TestWrapper>
          <PasswordResetForm />
        </TestWrapper>
      );

      const testEmail = 'test@example.com';
      await user.type(screen.getByLabelText(/email/i), testEmail);
      await user.click(screen.getByRole('button', { name: /enviar instruções/i }));

      await waitFor(() => {
        expect(screen.getByText(testEmail)).toBeInTheDocument();
      });
    });
  });

  describe('State Management', () => {
    it('should reset to initial state on component remount', () => {
      const { rerender } = render(
        <TestWrapper>
          <PasswordResetForm />
        </TestWrapper>
      );

      rerender(
        <TestWrapper>
          <PasswordResetForm />
        </TestWrapper>
      );

      // Should show initial form, not success state
      expect(screen.getByText('Recuperar Senha')).toBeInTheDocument();
      expect(screen.queryByText('Email Enviado!')).not.toBeInTheDocument();
    });

    it('should maintain component state during re-renders', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <TestWrapper>
          <PasswordResetForm />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'test@example.com');

      rerender(
        <TestWrapper>
          <PasswordResetForm />
        </TestWrapper>
      );

      // Email should be preserved
      expect(screen.getByLabelText(/email/i)).toHaveValue('test@example.com');
    });
  });
});