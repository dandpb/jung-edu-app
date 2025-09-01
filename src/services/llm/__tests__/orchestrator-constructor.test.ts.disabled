import { EventEmitter } from 'events';
import { ModuleGenerationOrchestrator } from '../orchestrator';
import { ConfigManager } from '../config';

describe('ModuleGenerationOrchestrator - Constructor Fixes', () => {
  afterEach(() => {
    // Clean up singleton instance
    (ConfigManager as any).instance = null;
    jest.clearAllMocks();
  });

  describe('ConfigManager Error Handling', () => {
    it('should handle ConfigManager.getInstance() returning undefined', () => {
      // Mock ConfigManager to return undefined
      jest.spyOn(ConfigManager, 'getInstance').mockReturnValue(undefined as any);
      
      // Should not throw error - should use fallback config
      expect(() => {
        new ModuleGenerationOrchestrator(false);
      }).not.toThrow();
    });

    it('should handle ConfigManager.getConfig() returning undefined', () => {
      const mockConfigManager = {
        getConfig: jest.fn().mockReturnValue(undefined)
      };
      jest.spyOn(ConfigManager, 'getInstance').mockReturnValue(mockConfigManager as any);
      
      // Should not throw error - should use fallback config
      expect(() => {
        new ModuleGenerationOrchestrator(false);
      }).not.toThrow();
    });

    it('should handle ConfigManager.getInstance() throwing error', () => {
      jest.spyOn(ConfigManager, 'getInstance').mockImplementation(() => {
        throw new Error('ConfigManager initialization failed');
      });
      
      // Should not throw error - should use fallback config
      expect(() => {
        new ModuleGenerationOrchestrator(false);
      }).not.toThrow();
    });
  });

  describe('EventEmitter Functionality', () => {
    it('should properly extend EventEmitter', () => {
      const orchestrator = new ModuleGenerationOrchestrator(false);
      
      expect(orchestrator).toBeInstanceOf(EventEmitter);
      expect(typeof orchestrator.on).toBe('function');
      expect(typeof orchestrator.emit).toBe('function');
      expect(typeof orchestrator.removeAllListeners).toBe('function');
    });

    it('should have removeAllListeners method available', () => {
      const orchestrator = new ModuleGenerationOrchestrator(false);
      
      // Should not throw error when calling removeAllListeners
      expect(() => {
        orchestrator.removeAllListeners();
      }).not.toThrow();
      
      // Verify the method exists and is a function
      expect(typeof orchestrator.removeAllListeners).toBe('function');
    });

    it('should emit events properly', (done) => {
      const orchestrator = new ModuleGenerationOrchestrator(false);
      
      orchestrator.on('test-event', (data) => {
        expect(data).toBe('test-data');
        orchestrator.removeAllListeners();
        done();
      });
      
      orchestrator.emit('test-event', 'test-data');
    });
  });

  describe('Fallback Configuration', () => {
    it('should use fallback configuration when ConfigManager fails', () => {
      jest.spyOn(ConfigManager, 'getInstance').mockImplementation(() => {
        throw new Error('ConfigManager failed');
      });
      
      const orchestrator = new ModuleGenerationOrchestrator(false);
      
      // Should initialize successfully with fallback config
      expect(orchestrator).toBeDefined();
      expect(orchestrator).toBeInstanceOf(ModuleGenerationOrchestrator);
      expect(orchestrator).toBeInstanceOf(EventEmitter);
      
      orchestrator.removeAllListeners();
    });

    it('should handle missing rate limit config gracefully', () => {
      const mockConfigManager = {
        getConfig: jest.fn().mockReturnValue({
          provider: 'mock',
          model: 'gpt-4o-mini',
          // Missing rateLimit property
        })
      };
      jest.spyOn(ConfigManager, 'getInstance').mockReturnValue(mockConfigManager as any);
      
      // Should not throw error - should use no-op rate limiter
      expect(() => {
        new ModuleGenerationOrchestrator(true); // Use real services to test rate limiter
      }).not.toThrow();
    });
  });

  describe('Constructor Parameters', () => {
    it('should work with useRealServices=false', () => {
      const orchestrator = new ModuleGenerationOrchestrator(false);
      
      expect(orchestrator).toBeDefined();
      expect(orchestrator).toBeInstanceOf(EventEmitter);
      orchestrator.removeAllListeners();
    });

    it('should work with useRealServices=true', () => {
      const orchestrator = new ModuleGenerationOrchestrator(true);
      
      expect(orchestrator).toBeDefined();
      expect(orchestrator).toBeInstanceOf(EventEmitter);
      orchestrator.removeAllListeners();
    });

    it('should work with default parameters', () => {
      const orchestrator = new ModuleGenerationOrchestrator();
      
      expect(orchestrator).toBeDefined();
      expect(orchestrator).toBeInstanceOf(EventEmitter);
      orchestrator.removeAllListeners();
    });
  });
});