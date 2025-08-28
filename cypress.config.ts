import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'tests/e2e/support/e2e.ts',
    specPattern: 'tests/e2e/**/*.cy.{js,jsx,ts,tsx}',
    fixturesFolder: 'tests/e2e/fixtures',
    screenshotsFolder: 'tests/e2e/screenshots',
    videosFolder: 'tests/e2e/videos',
    downloadsFolder: 'tests/e2e/downloads',
    
    setupNodeEvents(on, config) {
      // implement node event listeners here
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
        
        // Database tasks
        'db:seed'() {
          // Seed test database
          return null;
        },
        
        'db:clean'() {
          // Clean test database
          return null;
        },
        
        // API tasks
        'api:reset'() {
          // Reset API state
          return null;
        }
      });
      
      // Code coverage
      require('@cypress/code-coverage/task')(on, config);
      
      return config;
    },
    
    // Test configuration
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 30000,
    requestTimeout: 10000,
    responseTimeout: 30000,
    
    // Viewport
    viewportWidth: 1280,
    viewportHeight: 720,
    
    // Video and screenshots
    video: true,
    screenshotOnRunFailure: true,
    
    // Retry configuration
    retries: {
      runMode: 2,
      openMode: 0
    },
    
    // Environment variables
    env: {
      apiUrl: 'http://localhost:3001',
      coverage: true
    }
  },
  
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack'
    },
    supportFile: 'tests/component/support/component.ts',
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
    indexHtmlFile: 'tests/component/support/component-index.html'
  },
  
  // Global configuration
  chromeWebSecurity: false,
  experimentalStudio: true,
  experimentalWebKitSupport: true,
  
  // Exclude patterns
  excludeSpecPattern: [
    '**/node_modules/**',
    '**/dist/**',
    '**/.next/**'
  ]
});
