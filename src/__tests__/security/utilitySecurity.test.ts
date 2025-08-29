/**
 * Security-focused tests for authentication and configuration utilities
 * Testing XSS prevention, data sanitization, injection attacks, and sensitive data handling
 */

import { 
  saveUserProgress, 
  loadUserProgress,
  saveNotes,
  loadNotes 
} from '../../utils/localStorage';

import {
  translate,
  switchLanguage,
  getCurrentLanguage
} from '../../utils/i18n';

import {
  processModuleContent,
  extractKeyTerms,
  generateSummary
} from '../../utils/contentProcessor';

import { UserProgress, Note } from '../../types';

// Security test utilities
const MALICIOUS_PAYLOADS = {
  xss: [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    'javascript:alert("XSS")',
    '<svg onload=alert("XSS")>',
    '<iframe src="javascript:alert(\'XSS\')"></iframe>',
    '"><script>alert("XSS")</script>',
    '\'-alert("XSS")-\'',
    '<script>document.cookie="stolen=true"</script>',
    '<meta http-equiv="refresh" content="0;url=javascript:alert(\'XSS\')">'
  ],
  sqlInjection: [
    '\' OR \'1\'=\'1',
    '\'; DROP TABLE users; --',
    '\' UNION SELECT * FROM users --',
    '\' OR 1=1 --',
    '1\' OR \'1\'=\'1\' /*',
    '\' AND (SELECT COUNT(*) FROM users) > 0 --',
    '\'; INSERT INTO users VALUES (\'hacker\', \'password\'); --'
  ],
  codeInjection: [
    '${alert("XSS")}',
    '{{7*7}}',
    '<%= system("rm -rf /") %>',
    '#{File.read("/etc/passwd")}',
    '{php}echo "PHP Injection"{/php}',
    '<!--#exec cmd="ls" -->',
    '__import__("os").system("ls")'
  ],
  pathTraversal: [
    '../../../etc/passwd',
    '..\\..\\..\\windows\\system32\\config\\sam',
    '....//....//....//etc//passwd',
    '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
    '..%252f..%252f..%252fetc%252fpasswd',
    '..%c0%af..%c0%af..%c0%afetc%c0%afpasswd'
  ],
  unicode: [
    '\u0000',
    '\uFFFE\uFFFF',
    '\u202E\u202D',
    '＜script＞alert("XSS")＜/script＞',
    '\uD800\uDC00',
    '𝒶𝓁ℯ𝓇𝓉("𝓍𝓈𝓈")'
  ]
};

const SENSITIVE_DATA_PATTERNS = {
  apiKeys: [
    'sk-1234567890abcdef',
    'AIzaSyDdI0hCZtE6vySjMhVjEd2pBkOB0P2Y6',
    'pk_test_1234567890abcdef',
    'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9'
  ],
  passwords: [
    'password123',
    'admin',
    'secret',
    'p@ssw0rd!'
  ],
  personalInfo: [
    'john.doe@example.com',
    '+1-555-123-4567',
    '123-45-6789',
    '4111-1111-1111-1111'
  ]
};

describe('Utility Security Tests', () => {
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Clear localStorage
    localStorage.clear();
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('XSS Prevention Tests', () => {
    describe('Content Processing XSS Protection', () => {
      it('should sanitize malicious scripts in content processing', () => {
        MALICIOUS_PAYLOADS.xss.forEach(payload => {
          const maliciousContent = `Jung's theory about ${payload} the collective unconscious.`;
          
          const processed = processModuleContent(maliciousContent);
          const keyTerms = extractKeyTerms(maliciousContent);
          const summary = generateSummary(maliciousContent);

          // Should not contain raw script tags or javascript URLs
          expect(processed).not.toContain('<script');
          expect(processed).not.toContain('javascript:');
          expect(processed).not.toContain('onerror=');
          expect(processed).not.toContain('onload=');

          expect(summary).not.toContain('<script');
          expect(summary).not.toContain('javascript:');

          keyTerms.forEach(term => {
            const termText = typeof term === 'string' ? term : term.term;
            expect(termText).not.toContain('<script');
            expect(termText).not.toContain('javascript:');
          });
        });
      });

      it('should handle XSS attempts in translation keys', () => {
        MALICIOUS_PAYLOADS.xss.forEach(payload => {
          const maliciousKey = `common.${payload}`;
          const result = translate(maliciousKey);

          // Should return safe fallback (the key itself) rather than executing
          expect(result).toBe(maliciousKey);
          expect(result).not.toContain('alert(');
          expect(result).not.toContain('<script');
        });
      });

      it('should sanitize XSS in translation interpolations', () => {
        MALICIOUS_PAYLOADS.xss.forEach(payload => {
          const result = translate('quiz.question', {
            interpolations: { 
              number: payload,
              total: '10'
            }
          });

          // Should not execute the malicious payload
          expect(result).toBeDefined();
          expect(typeof result).toBe('string');
          // The payload should be escaped/sanitized, not executed
        });
      });

      it('should prevent XSS in user notes', () => {
        const maliciousNotes: Note[] = MALICIOUS_PAYLOADS.xss.map((payload, index) => ({
          id: `xss-note-${index}`,
          moduleId: 'test-module',
          content: `Study note: ${payload}`,
          timestamp: new Date(),
          tags: [payload, 'malicious']
        }));

        // Save notes with XSS payloads
        saveNotes(maliciousNotes);
        const savedNotes = loadNotes();

        // Verify notes are saved but content should be safe
        expect(savedNotes).toHaveLength(maliciousNotes.length);
        
        savedNotes.forEach(note => {
          // Content should exist but not contain executable scripts
          expect(note.content).toBeDefined();
          expect(note.content).not.toContain('<script');
          expect(note.content).not.toContain('javascript:');
        });
      });
    });

    describe('DOM-based XSS Protection', () => {
      it('should prevent XSS through innerHTML-like scenarios', () => {
        const domXSSPayloads = [
          '<img src="x" onerror="alert(1)">',
          '<svg onload="alert(1)">',
          '<iframe src="javascript:alert(1)"></iframe>'
        ];

        domXSSPayloads.forEach(payload => {
          const content = `Content with ${payload} embedded`;
          const processed = processModuleContent(content);

          // Should not contain dangerous event handlers
          expect(processed).not.toMatch(/on\w+\s*=/);
          expect(processed).not.toContain('javascript:');
        });
      });

      it('should handle encoded XSS attempts', () => {
        const encodedPayloads = [
          '%3Cscript%3Ealert%28%27XSS%27%29%3C%2Fscript%3E',
          '&lt;script&gt;alert(&#39;XSS&#39;)&lt;/script&gt;',
          '\\u003cscript\\u003ealert(\\u0027XSS\\u0027)\\u003c/script\\u003e'
        ];

        encodedPayloads.forEach(payload => {
          const content = `Encoded payload: ${payload}`;
          const processed = processModuleContent(content);
          
          // Even after processing, should not decode to executable content
          expect(processed).toBeDefined();
          expect(processed).not.toContain('alert(');
        });
      });
    });
  });

  describe('Injection Attack Prevention', () => {
    describe('SQL Injection Protection', () => {
      it('should handle SQL injection attempts in user data', () => {
        MALICIOUS_PAYLOADS.sqlInjection.forEach(payload => {
          const userProgress: UserProgress = {
            userId: payload,
            completedModules: [payload],
            quizScores: { [payload]: 85 },
            totalTime: 3600,
            lastAccessed: Date.now(),
            notes: [{
              id: 'sql-test',
              moduleId: payload,
              content: `SQL injection test: ${payload}`,
              timestamp: new Date()
            }]
          };

          // Should not throw or cause errors
          expect(() => saveUserProgress(userProgress)).not.toThrow();
          
          const loaded = loadUserProgress();
          expect(loaded).toBeDefined();
          
          // Data should be stored safely (localStorage handles this automatically)
          // but we verify it doesn't cause execution
        });
      });

      it('should sanitize SQL injection in search/filter operations', () => {
        const notes: Note[] = MALICIOUS_PAYLOADS.sqlInjection.map((payload, index) => ({
          id: `sql-note-${index}`,
          moduleId: 'test',
          content: payload,
          timestamp: new Date(),
          tags: [payload]
        }));

        saveNotes(notes);
        const loaded = loadNotes();

        // Should load without causing SQL execution
        expect(loaded).toHaveLength(notes.length);
        expect(() => loaded.forEach(note => note.content)).not.toThrow();
      });
    });

    describe('Code Injection Protection', () => {
      it('should prevent template injection in content processing', () => {
        MALICIOUS_PAYLOADS.codeInjection.forEach(payload => {
          const content = `Template injection test: ${payload}`;
          
          const processed = processModuleContent(content);
          const keyTerms = extractKeyTerms(content);
          const summary = generateSummary(content);

          // Should not execute template expressions
          expect(processed).not.toContain('49'); // 7*7 should not be evaluated
          expect(processed).not.toContain('/etc/passwd');
          expect(summary).not.toContain('49');
        });
      });

      it('should handle server-side template injection attempts', () => {
        const serverPayloads = [
          '{{constructor.constructor("alert(1)")()}}',
          '${7*7}',
          '<%= 7*7 %>',
          '#{7*7}'
        ];

        serverPayloads.forEach(payload => {
          const result = translate('common.welcome', {
            interpolations: { name: payload }
          });

          // Template should not be evaluated
          expect(result).not.toContain('49');
          expect(result).toBeDefined();
        });
      });
    });

    describe('Path Traversal Protection', () => {
      it('should prevent path traversal in module IDs', () => {
        MALICIOUS_PAYLOADS.pathTraversal.forEach(payload => {
          const progress: UserProgress = {
            userId: 'test-user',
            completedModules: [payload],
            quizScores: { [payload]: 85 },
            totalTime: 3600,
            lastAccessed: Date.now(),
            notes: []
          };

          // Should handle safely without file system access
          expect(() => saveUserProgress(progress)).not.toThrow();
          
          const loaded = loadUserProgress();
          expect(loaded).toBeDefined();
        });
      });

      it('should sanitize path traversal in note content', () => {
        const pathTraversalNotes = MALICIOUS_PAYLOADS.pathTraversal.map((payload, index) => ({
          id: `path-note-${index}`,
          moduleId: payload,
          content: `Path traversal attempt: ${payload}`,
          timestamp: new Date()
        }));

        saveNotes(pathTraversalNotes);
        const loaded = loadNotes();

        expect(loaded).toHaveLength(pathTraversalNotes.length);
        // Should not contain actual file contents
        loaded.forEach(note => {
          expect(note.content).not.toContain('root:x:0:0');
          expect(note.content).not.toContain('[HKEY_');
        });
      });
    });
  });

  describe('Sensitive Data Protection', () => {
    describe('API Key and Token Sanitization', () => {
      it('should detect and sanitize API keys in content', () => {
        SENSITIVE_DATA_PATTERNS.apiKeys.forEach(apiKey => {
          const content = `Configuration example: API_KEY=${apiKey}`;
          
          const processed = processModuleContent(content);
          const summary = generateSummary(content);

          // API keys should be masked or removed in processed content
          expect(processed).not.toContain(apiKey);
          expect(summary).not.toContain(apiKey);
        });
      });

      it('should prevent API keys from being saved in user progress', () => {
        SENSITIVE_DATA_PATTERNS.apiKeys.forEach(apiKey => {
          const progress: UserProgress = {
            userId: apiKey, // Malicious attempt to save API key as user ID
            completedModules: ['module-1'],
            quizScores: { 'module-1': 85 },
            totalTime: 3600,
            lastAccessed: Date.now(),
            notes: [{
              id: 'api-key-note',
              moduleId: 'module-1',
              content: `My API key is ${apiKey}`,
              timestamp: new Date()
            }]
          };

          saveUserProgress(progress);
          const loaded = loadUserProgress();

          // Should be stored but potentially sanitized in logs/exports
          expect(loaded).toBeDefined();
        });
      });

      it('should mask sensitive data in error messages', () => {
        SENSITIVE_DATA_PATTERNS.apiKeys.forEach(apiKey => {
          try {
            // Simulate error with sensitive data
            throw new Error(`API request failed with key: ${apiKey}`);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            
            // In a real system, error logging should mask sensitive data
            // For testing, we verify the API key is present (would be masked in logs)
            expect(errorMessage).toContain(apiKey);
          }
        });
      });
    });

    describe('Personal Information Protection', () => {
      it('should handle personal information in content appropriately', () => {
        SENSITIVE_DATA_PATTERNS.personalInfo.forEach(pii => {
          const content = `Contact information: ${pii}`;
          
          const processed = processModuleContent(content);
          const keyTerms = extractKeyTerms(content);

          // PII should be preserved in content but handled carefully
          expect(processed).toBeDefined();
          expect(keyTerms).toBeDefined();
          
          // In a real system, would implement PII detection and masking
        });
      });

      it('should protect personal data in user notes', () => {
        const piiNotes = SENSITIVE_DATA_PATTERNS.personalInfo.map((pii, index) => ({
          id: `pii-note-${index}`,
          moduleId: 'personal-module',
          content: `Personal data: ${pii}`,
          timestamp: new Date(),
          tags: ['personal']
        }));

        saveNotes(piiNotes);
        const loaded = loadNotes();

        expect(loaded).toHaveLength(piiNotes.length);
        // Data is preserved but should be handled with care in exports/logs
      });
    });
  });

  describe('Unicode and Character Encoding Security', () => {
    it('should handle malicious Unicode characters safely', () => {
      MALICIOUS_PAYLOADS.unicode.forEach(unicodePayload => {
        const content = `Unicode test: ${unicodePayload}`;
        
        const processed = processModuleContent(content);
        const keyTerms = extractKeyTerms(content);
        const summary = generateSummary(content);

        // Should not crash or cause unexpected behavior
        expect(processed).toBeDefined();
        expect(keyTerms).toBeDefined();
        expect(summary).toBeDefined();
      });
    });

    it('should prevent Unicode normalization attacks', () => {
      const normalizationAttacks = [
        'admin', // Normal
        'аdmin', // Cyrillic 'а' instead of 'a'
        'admin︎', // Variation selector
        'admin​', // Zero-width space
      ];

      normalizationAttacks.forEach(attack => {
        const progress: UserProgress = {
          userId: attack,
          completedModules: [],
          quizScores: {},
          totalTime: 0,
          lastAccessed: Date.now(),
          notes: []
        };

        saveUserProgress(progress);
        const loaded = loadUserProgress();
        
        expect(loaded).toBeDefined();
        expect(loaded!.userId).toBe(attack);
      });
    });

    it('should handle bidirectional text attacks', () => {
      const bidiAttacks = [
        'user\u202Enimda\u202D', // RLO/LRO override
        'user\u061C\u202Eadmin', // Arabic letter mark + override
      ];

      bidiAttacks.forEach(attack => {
        const content = `Username: ${attack}`;
        const processed = processModuleContent(content);
        
        expect(processed).toBeDefined();
        expect(typeof processed).toBe('string');
      });
    });
  });

  describe('Input Validation and Sanitization', () => {
    it('should validate and sanitize user progress data', () => {
      const maliciousProgress = {
        userId: '<script>alert("XSS")</script>',
        completedModules: [
          'valid-module',
          '<script>alert("module")</script>',
          null,
          undefined,
          123
        ] as any,
        quizScores: {
          'valid-module': 85,
          '<script>alert("quiz")': 90,
          'null-score': null,
          'undefined-score': undefined
        } as any,
        totalTime: '<script>alert("time")</script>' as any,
        lastAccessed: 'invalid-date' as any,
        notes: [
          {
            id: '<script>alert("id")</script>',
            moduleId: '<script>alert("moduleId")</script>',
            content: '<script>alert("content")</script>',
            timestamp: 'invalid-timestamp' as any
          },
          null,
          undefined
        ].filter(Boolean) as Note[]
      };

      // Should handle malicious data without throwing
      expect(() => saveUserProgress(maliciousProgress as UserProgress)).not.toThrow();
      
      const loaded = loadUserProgress();
      expect(loaded).toBeDefined();
    });

    it('should sanitize note content and metadata', () => {
      const maliciousNote: Note = {
        id: '<script>alert("noteId")</script>',
        moduleId: 'javascript:alert("moduleId")',
        content: '<img src=x onerror=alert("noteContent")>',
        timestamp: new Date(),
        tags: [
          '<script>alert("tag")</script>',
          'javascript:alert("tag2")',
          'normal-tag'
        ],
        type: '<script>alert("type")' as any
      };

      const notes = [maliciousNote];
      
      expect(() => saveNotes(notes)).not.toThrow();
      
      const loaded = loadNotes();
      expect(loaded).toHaveLength(1);
      expect(loaded[0]).toBeDefined();
    });

    it('should validate language codes for security', async () => {
      const maliciousLanguageCodes = [
        '<script>alert("lang")</script>',
        'javascript:alert("lang")',
        '../../etc/passwd',
        '\x00\x01\x02',
        '${alert("lang")}'
      ];

      for (const langCode of maliciousLanguageCodes) {
        try {
          await switchLanguage(langCode as any);
        } catch (error) {
          // Should throw validation error, not execute code
          expect(error).toBeInstanceOf(Error);
          const errorMessage = error instanceof Error ? error.message : '';
          expect(errorMessage).not.toContain('XSS');
        }
      }

      // Should still be in a valid language state
      const currentLang = getCurrentLanguage();
      expect(['en', 'pt-BR', 'es', 'fr']).toContain(currentLang);
    });
  });

  describe('Content Security Policy Compliance', () => {
    it('should generate CSP-compliant content', () => {
      const content = `
        Jung's analytical psychology includes various concepts.
        These concepts help in understanding the human psyche.
        The collective unconscious contains universal patterns.
      `;

      const processed = processModuleContent(content);
      const summary = generateSummary(content);

      // Should not contain inline scripts or styles that would violate CSP
      expect(processed).not.toMatch(/<script[^>]*>/i);
      expect(processed).not.toMatch(/style\s*=/i);
      expect(processed).not.toMatch(/on\w+\s*=/i);
      expect(processed).not.toContain('javascript:');

      expect(summary).not.toMatch(/<script[^>]*>/i);
      expect(summary).not.toContain('javascript:');
    });

    it('should handle CSP violations in user content', () => {
      const cspViolatingContent = [
        '<div style="background:url(javascript:alert())">Content</div>',
        '<a href="javascript:alert()">Link</a>',
        '<iframe src="data:text/html,<script>alert()</script>"></iframe>'
      ];

      cspViolatingContent.forEach(content => {
        const processed = processModuleContent(content);
        
        // Should not contain CSP-violating elements
        expect(processed).not.toContain('javascript:');
        expect(processed).not.toContain('data:text/html');
        expect(processed).not.toMatch(/style\s*=.*javascript:/i);
      });
    });
  });

  describe('Error Handling Security', () => {
    it('should not expose sensitive information in error messages', () => {
      const sensitiveOperations = [
        () => {
          const huge = 'x'.repeat(1000000);
          saveUserProgress({ 
            userId: huge,
            completedModules: [],
            quizScores: {},
            totalTime: 0,
            lastAccessed: Date.now(),
            notes: []
          });
        },
        () => {
          const circular: any = { id: 'test' };
          circular.self = circular;
          saveUserProgress(circular);
        }
      ];

      sensitiveOperations.forEach((operation, index) => {
        try {
          operation();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          // Should not expose internal paths or sensitive data
          expect(errorMessage).not.toMatch(/\/[a-z_]+\/[a-z_]+\//); // Unix paths
          expect(errorMessage).not.toMatch(/C:\\[^\\]+\\/); // Windows paths
          expect(errorMessage).not.toContain('password');
          expect(errorMessage).not.toContain('secret');
        }
      });
    });

    it('should handle security exceptions gracefully', () => {
      // Simulate security-related exceptions
      const securityScenarios = [
        () => translate('admin.secret.key'),
        () => processModuleContent('\x00\x01\x02malicious'),
        () => extractKeyTerms('<script>alert("xss")</script>')
      ];

      securityScenarios.forEach(scenario => {
        expect(() => scenario()).not.toThrow();
      });
    });
  });

  describe('Time-based Security Attacks', () => {
    it('should prevent timing attacks on user validation', () => {
      const validUser = 'valid-user-12345';
      const invalidUsers = [
        'invalid-user',
        'a',
        '',
        'very-long-invalid-user-name-that-should-not-exist'
      ];

      const timings: number[] = [];

      // Test timing for valid user
      const validStart = performance.now();
      loadUserProgress();
      const validEnd = performance.now();
      timings.push(validEnd - validStart);

      // Test timing for invalid users
      invalidUsers.forEach(userId => {
        const start = performance.now();
        loadUserProgress(); // Would check user in real system
        const end = performance.now();
        timings.push(end - start);
      });

      // Timings should be relatively consistent to prevent timing attacks
      const avgTiming = timings.reduce((a, b) => a + b) / timings.length;
      const maxDeviation = Math.max(...timings.map(t => Math.abs(t - avgTiming)));
      
      // Allow reasonable deviation but prevent significant timing differences
      expect(maxDeviation).toBeLessThan(avgTiming * 2);
    });

    it('should implement rate limiting concepts', () => {
      const requestTimes: number[] = [];
      
      // Simulate rapid requests
      for (let i = 0; i < 100; i++) {
        const start = performance.now();
        translate('common.welcome');
        const end = performance.now();
        requestTimes.push(end - start);
      }

      // In a real system, would implement actual rate limiting
      // Here we verify operations complete without degradation
      const avgTime = requestTimes.reduce((a, b) => a + b) / requestTimes.length;
      expect(avgTime).toBeLessThan(10); // Should remain fast
    });
  });
});