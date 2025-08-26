#!/usr/bin/env node

/**
 * Comprehensive Unit Tests for GitHub Safe CLI Helper
 * Tests all functions, edge cases, error handling, and command parsing
 */

const { execSync } = require('child_process');
const { writeFileSync, unlinkSync, existsSync } = require('fs');
const { tmpdir } = require('os');
const { join } = require('path');
const { randomBytes } = require('crypto');

// Mock all external dependencies
jest.mock('child_process');
jest.mock('fs');
jest.mock('os');
jest.mock('crypto');
jest.mock('path');

describe('GitHub Safe CLI Helper', () => {
  let mockExecSync;
  let mockWriteFileSync;
  let mockUnlinkSync;
  let mockExistsSync;
  let mockTmpdir;
  let mockJoin;
  let mockRandomBytes;
  let originalArgv;
  let originalExit;
  let originalConsole;
  let consoleOutputs;

  beforeEach(() => {
    // Store original values
    originalArgv = process.argv;
    originalExit = process.exit;
    originalConsole = {
      log: console.log,
      error: console.error
    };

    // Setup mocks
    mockExecSync = require('child_process').execSync;
    mockWriteFileSync = require('fs').writeFileSync;
    mockUnlinkSync = require('fs').unlinkSync;
    mockExistsSync = require('fs').existsSync;
    mockTmpdir = require('os').tmpdir;
    mockJoin = require('path').join;
    mockRandomBytes = require('crypto').randomBytes;

    // Mock implementations
    mockTmpdir.mockReturnValue('/tmp');
    mockJoin.mockImplementation((...args) => args.join('/'));
    mockRandomBytes.mockReturnValue({ toString: () => 'abc123' });
    mockExistsSync.mockReturnValue(true);

    // Capture console output
    consoleOutputs = [];
    console.log = jest.fn((...args) => {
      consoleOutputs.push({ type: 'log', args });
    });
    console.error = jest.fn((...args) => {
      consoleOutputs.push({ type: 'error', args });
    });

    // Mock process.exit
    process.exit = jest.fn();

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original values
    process.argv = originalArgv;
    process.exit = originalExit;
    console.log = originalConsole.log;
    console.error = originalConsole.error;
  });

  describe('Command Line Argument Parsing', () => {
    test('should show usage when no arguments provided', () => {
      process.argv = ['node', 'github-safe.js'];
      
      // Re-require the module to trigger execution
      delete require.cache[require.resolve('../../../.claude/helpers/github-safe.js')];
      require('../../../.claude/helpers/github-safe.js');

      expect(process.exit).toHaveBeenCalledWith(1);
      expect(consoleOutputs[0].args[0]).toContain('Safe GitHub CLI Helper');
      expect(consoleOutputs[0].args[0]).toContain('Usage:');
    });

    test('should show usage when only one argument provided', () => {
      process.argv = ['node', 'github-safe.js', 'issue'];
      
      delete require.cache[require.resolve('../../../.claude/helpers/github-safe.js')];
      require('../../../.claude/helpers/github-safe.js');

      expect(process.exit).toHaveBeenCalledWith(1);
      expect(consoleOutputs[0].args[0]).toContain('Safe GitHub CLI Helper');
    });

    test('should parse issue comment command correctly', () => {
      process.argv = ['node', 'github-safe.js', 'issue', 'comment', '123', 'Test body with `backticks`'];
      mockExecSync.mockImplementation(() => {});

      delete require.cache[require.resolve('../../../.claude/helpers/github-safe.js')];
      require('../../../.claude/helpers/github-safe.js');

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        '/tmp/gh-body-abc123.tmp',
        'Test body with `backticks`',
        'utf8'
      );
    });

    test('should parse pr comment command correctly', () => {
      process.argv = ['node', 'github-safe.js', 'pr', 'comment', '456', 'PR comment body'];
      mockExecSync.mockImplementation(() => {});

      delete require.cache[require.resolve('../../../.claude/helpers/github-safe.js')];
      require('../../../.claude/helpers/github-safe.js');

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        '/tmp/gh-body-abc123.tmp',
        'PR comment body',
        'utf8'
      );
    });
  });

  describe('Body Content Handling', () => {
    test('should handle issue create with --body flag', () => {
      process.argv = ['node', 'github-safe.js', 'issue', 'create', '--title', 'Test Issue', '--body', 'Issue body content'];
      mockExecSync.mockImplementation(() => {});

      delete require.cache[require.resolve('../../../.claude/helpers/github-safe.js')];
      require('../../../.claude/helpers/github-safe.js');

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        '/tmp/gh-body-abc123.tmp',
        'Issue body content',
        'utf8'
      );

      expect(mockExecSync).toHaveBeenCalledWith(
        'gh issue create --title Test Issue --body-file /tmp/gh-body-abc123.tmp',
        { stdio: 'inherit', timeout: 30000 }
      );
    });

    test('should handle pr create with --body flag', () => {
      process.argv = ['node', 'github-safe.js', 'pr', 'create', '--title', 'Test PR', '--body', 'PR body content'];
      mockExecSync.mockImplementation(() => {});

      delete require.cache[require.resolve('../../../.claude/helpers/github-safe.js')];
      require('../../../.claude/helpers/github-safe.js');

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        '/tmp/gh-body-abc123.tmp',
        'PR body content',
        'utf8'
      );

      expect(mockExecSync).toHaveBeenCalledWith(
        'gh pr create --title Test PR --body-file /tmp/gh-body-abc123.tmp',
        { stdio: 'inherit', timeout: 30000 }
      );
    });

    test('should handle special characters in body content', () => {
      const specialBody = 'Body with `backticks`, $(command substitution), and $variables';
      process.argv = ['node', 'github-safe.js', 'issue', 'comment', '123', specialBody];
      mockExecSync.mockImplementation(() => {});

      delete require.cache[require.resolve('../../../.claude/helpers/github-safe.js')];
      require('../../../.claude/helpers/github-safe.js');

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        '/tmp/gh-body-abc123.tmp',
        specialBody,
        'utf8'
      );
    });

    test('should handle empty body content', () => {
      process.argv = ['node', 'github-safe.js', 'issue', 'comment', '123', ''];
      mockExecSync.mockImplementation(() => {});

      delete require.cache[require.resolve('../../../.claude/helpers/github-safe.js')];
      require('../../../.claude/helpers/github-safe.js');

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        '/tmp/gh-body-abc123.tmp',
        '',
        'utf8'
      );
    });
  });

  describe('Command Execution', () => {
    test('should execute comment command with temporary file', () => {
      process.argv = ['node', 'github-safe.js', 'issue', 'comment', '123', 'Test body'];
      mockExecSync.mockImplementation(() => {});

      delete require.cache[require.resolve('../../../.claude/helpers/github-safe.js')];
      require('../../../.claude/helpers/github-safe.js');

      expect(mockExecSync).toHaveBeenCalledWith(
        'gh issue comment --body-file /tmp/gh-body-abc123.tmp',
        { stdio: 'inherit', timeout: 30000 }
      );
    });

    test('should execute create command with temporary file', () => {
      process.argv = ['node', 'github-safe.js', 'pr', 'create', '--title', 'Test', '--body', 'Body'];
      mockExecSync.mockImplementation(() => {});

      delete require.cache[require.resolve('../../../.claude/helpers/github-safe.js')];
      require('../../../.claude/helpers/github-safe.js');

      expect(mockExecSync).toHaveBeenCalledWith(
        'gh pr create --title Test --body-file /tmp/gh-body-abc123.tmp',
        { stdio: 'inherit', timeout: 30000 }
      );
    });

    test('should execute non-body commands normally', () => {
      process.argv = ['node', 'github-safe.js', 'repo', 'list'];
      mockExecSync.mockImplementation(() => {});

      delete require.cache[require.resolve('../../../.claude/helpers/github-safe.js')];
      require('../../../.claude/helpers/github-safe.js');

      expect(mockExecSync).toHaveBeenCalledWith(
        'gh repo list',
        { stdio: 'inherit' }
      );
      expect(mockWriteFileSync).not.toHaveBeenCalled();
    });

    test('should execute commands without body content normally', () => {
      process.argv = ['node', 'github-safe.js', 'issue', 'list'];
      mockExecSync.mockImplementation(() => {});

      delete require.cache[require.resolve('../../../.claude/helpers/github-safe.js')];
      require('../../../.claude/helpers/github-safe.js');

      expect(mockExecSync).toHaveBeenCalledWith(
        'gh issue list',
        { stdio: 'inherit' }
      );
      expect(mockWriteFileSync).not.toHaveBeenCalled();
    });
  });

  describe('Temporary File Management', () => {
    test('should create unique temporary file names', () => {
      const mockBytes1 = { toString: () => 'abc123' };
      const mockBytes2 = { toString: () => 'def456' };
      mockRandomBytes.mockReturnValueOnce(mockBytes1).mockReturnValueOnce(mockBytes2);

      process.argv = ['node', 'github-safe.js', 'issue', 'comment', '123', 'Test'];
      mockExecSync.mockImplementation(() => {});

      delete require.cache[require.resolve('../../../.claude/helpers/github-safe.js')];
      require('../../../.claude/helpers/github-safe.js');

      expect(mockJoin).toHaveBeenCalledWith('/tmp', 'gh-body-abc123.tmp');
    });

    test('should clean up temporary file after successful execution', () => {
      process.argv = ['node', 'github-safe.js', 'issue', 'comment', '123', 'Test'];
      mockExecSync.mockImplementation(() => {});
      mockUnlinkSync.mockImplementation(() => {});

      delete require.cache[require.resolve('../../../.claude/helpers/github-safe.js')];
      require('../../../.claude/helpers/github-safe.js');

      expect(mockUnlinkSync).toHaveBeenCalledWith('/tmp/gh-body-abc123.tmp');
    });

    test('should attempt cleanup even after execution failure', () => {
      process.argv = ['node', 'github-safe.js', 'issue', 'comment', '123', 'Test'];
      mockExecSync.mockImplementation(() => {
        throw new Error('Command failed');
      });
      mockUnlinkSync.mockImplementation(() => {});

      delete require.cache[require.resolve('../../../.claude/helpers/github-safe.js')];
      require('../../../.claude/helpers/github-safe.js');

      expect(mockUnlinkSync).toHaveBeenCalledWith('/tmp/gh-body-abc123.tmp');
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    test('should ignore cleanup errors silently', () => {
      process.argv = ['node', 'github-safe.js', 'issue', 'comment', '123', 'Test'];
      mockExecSync.mockImplementation(() => {});
      mockUnlinkSync.mockImplementation(() => {
        throw new Error('Cleanup failed');
      });

      delete require.cache[require.resolve('../../../.claude/helpers/github-safe.js')];
      require('../../../.claude/helpers/github-safe.js');

      // Should not throw or exit due to cleanup error
      expect(process.exit).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle execSync errors gracefully', () => {
      process.argv = ['node', 'github-safe.js', 'issue', 'comment', '123', 'Test'];
      const mockError = new Error('Command execution failed');
      mockExecSync.mockImplementation(() => {
        throw mockError;
      });

      delete require.cache[require.resolve('../../../.claude/helpers/github-safe.js')];
      require('../../../.claude/helpers/github-safe.js');

      expect(console.error).toHaveBeenCalledWith('Error:', 'Command execution failed');
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    test('should handle file write errors', () => {
      process.argv = ['node', 'github-safe.js', 'issue', 'comment', '123', 'Test'];
      mockWriteFileSync.mockImplementation(() => {
        throw new Error('Write failed');
      });

      delete require.cache[require.resolve('../../../.claude/helpers/github-safe.js')];
      require('../../../.claude/helpers/github-safe.js');

      expect(console.error).toHaveBeenCalledWith('Error:', 'Write failed');
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    test('should handle timeout errors', () => {
      process.argv = ['node', 'github-safe.js', 'issue', 'comment', '123', 'Test'];
      const timeoutError = new Error('Command timed out');
      timeoutError.code = 'ETIMEDOUT';
      mockExecSync.mockImplementation(() => {
        throw timeoutError;
      });

      delete require.cache[require.resolve('../../../.claude/helpers/github-safe.js')];
      require('../../../.claude/helpers/github-safe.js');

      expect(console.error).toHaveBeenCalledWith('Error:', 'Command timed out');
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing --body flag in create commands', () => {
      process.argv = ['node', 'github-safe.js', 'issue', 'create', '--title', 'Test'];
      mockExecSync.mockImplementation(() => {});

      delete require.cache[require.resolve('../../../.claude/helpers/github-safe.js')];
      require('../../../.claude/helpers/github-safe.js');

      expect(mockExecSync).toHaveBeenCalledWith(
        'gh issue create --title Test',
        { stdio: 'inherit' }
      );
      expect(mockWriteFileSync).not.toHaveBeenCalled();
    });

    test('should handle --body flag without content', () => {
      process.argv = ['node', 'github-safe.js', 'issue', 'create', '--title', 'Test', '--body'];
      mockExecSync.mockImplementation(() => {});

      delete require.cache[require.resolve('../../../.claude/helpers/github-safe.js')];
      require('../../../.claude/helpers/github-safe.js');

      expect(mockExecSync).toHaveBeenCalledWith(
        'gh issue create --title Test --body',
        { stdio: 'inherit' }
      );
    });

    test('should handle very long body content', () => {
      const longBody = 'a'.repeat(10000);
      process.argv = ['node', 'github-safe.js', 'issue', 'comment', '123', longBody];
      mockExecSync.mockImplementation(() => {});

      delete require.cache[require.resolve('../../../.claude/helpers/github-safe.js')];
      require('../../../.claude/helpers/github-safe.js');

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        '/tmp/gh-body-abc123.tmp',
        longBody,
        'utf8'
      );
    });

    test('should handle unicode characters in body', () => {
      const unicodeBody = 'Test with émojis 🎉 and ñoñó characters';
      process.argv = ['node', 'github-safe.js', 'pr', 'comment', '456', unicodeBody];
      mockExecSync.mockImplementation(() => {});

      delete require.cache[require.resolve('../../../.claude/helpers/github-safe.js')];
      require('../../../.claude/helpers/github-safe.js');

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        '/tmp/gh-body-abc123.tmp',
        unicodeBody,
        'utf8'
      );
    });
  });

  describe('Command Logging', () => {
    test('should log executed command for body operations', () => {
      process.argv = ['node', 'github-safe.js', 'issue', 'comment', '123', 'Test'];
      mockExecSync.mockImplementation(() => {});

      delete require.cache[require.resolve('../../../.claude/helpers/github-safe.js')];
      require('../../../.claude/helpers/github-safe.js');

      expect(console.log).toHaveBeenCalledWith(
        'Executing: gh issue comment --body-file /tmp/gh-body-abc123.tmp'
      );
    });

    test('should not log command for non-body operations', () => {
      process.argv = ['node', 'github-safe.js', 'repo', 'list'];
      mockExecSync.mockImplementation(() => {});

      delete require.cache[require.resolve('../../../.claude/helpers/github-safe.js')];
      require('../../../.claude/helpers/github-safe.js');

      // Console.log should not be called for logging the command
      expect(console.log).not.toHaveBeenCalled();
    });
  });

  describe('Timeout Configuration', () => {
    test('should use 30 second timeout for body operations', () => {
      process.argv = ['node', 'github-safe.js', 'issue', 'comment', '123', 'Test'];
      mockExecSync.mockImplementation(() => {});

      delete require.cache[require.resolve('../../../.claude/helpers/github-safe.js')];
      require('../../../.claude/helpers/github-safe.js');

      expect(mockExecSync).toHaveBeenCalledWith(
        expect.any(String),
        { stdio: 'inherit', timeout: 30000 }
      );
    });

    test('should use default timeout for non-body operations', () => {
      process.argv = ['node', 'github-safe.js', 'repo', 'list'];
      mockExecSync.mockImplementation(() => {});

      delete require.cache[require.resolve('../../../.claude/helpers/github-safe.js')];
      require('../../../.claude/helpers/github-safe.js');

      expect(mockExecSync).toHaveBeenCalledWith(
        'gh repo list',
        { stdio: 'inherit' }
      );
    });
  });
});