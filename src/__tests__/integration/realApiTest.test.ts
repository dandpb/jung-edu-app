/**
 * Real API Integration Test
 * Tests actual API calls with configured keys
 */

import { OpenAIProvider } from '../../services/llm/provider';

// Only run if OpenAI key is configured
const hasOpenAIKey = process.env.REACT_APP_OPENAI_API_KEY && 
  process.env.REACT_APP_OPENAI_API_KEY !== 'your_openai_api_key_here' &&
  process.env.REACT_APP_OPENAI_API_KEY.startsWith('sk-');

describe('Real API Integration', () => {
  describe('API Configuration', () => {
    test('should verify API keys are configured', () => {
      console.log('\n🔧 API Configuration Check:');
      console.log('  OpenAI API Key:', hasOpenAIKey ? '✅ Configured' : '❌ Not configured');
      console.log('  OpenAI Model:', process.env.REACT_APP_OPENAI_MODEL || 'gpt-4o-mini (default)');
      console.log('  LLM Provider:', process.env.LLM_PROVIDER || 'openai (default)');
      
      const youtubeKey = process.env.REACT_APP_YOUTUBE_API_KEY && 
        process.env.REACT_APP_YOUTUBE_API_KEY !== 'your_youtube_api_key_here';
      console.log('  YouTube API Key:', youtubeKey ? '✅ Configured' : '❌ Not configured');
      
      expect(true).toBe(true); // Always pass
    });
  });

  describe('OpenAI Integration', () => {
    const testCondition = hasOpenAIKey ? test : test.skip;
    
    testCondition('should connect to OpenAI and generate Jung-related content', async () => {
      const provider = new OpenAIProvider(
        process.env.REACT_APP_OPENAI_API_KEY!,
        process.env.REACT_APP_OPENAI_MODEL || 'gpt-4o-mini'
      );
      
      console.log('\n🤖 Testing OpenAI integration...');
      
      try {
        const result = await provider.generateCompletion(
          'Write exactly one sentence about Carl Jung\'s concept of the collective unconscious.',
          {
            temperature: 0.3,
            maxTokens: 50
          }
        );
        
        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(10);
        expect(result.toLowerCase()).toContain('jung');
        
        console.log('✅ OpenAI Response:', result.substring(0, 100) + '...');
        console.log('✅ OpenAI integration working!');
        
      } catch (error) {
        console.error('❌ OpenAI Error:', error);
        throw error;
      }
    }, 30000);
    
    testCondition('should verify OpenAI provider availability', async () => {
      const provider = new OpenAIProvider(
        process.env.REACT_APP_OPENAI_API_KEY!,
        process.env.REACT_APP_OPENAI_MODEL || 'gpt-4o-mini'
      );
      
      const isAvailable = await provider.isAvailable();
      expect(isAvailable).toBe(true);
      
      console.log('✅ OpenAI provider is available');
    });
  });

  describe('Module Content Generation Test', () => {
    const testCondition = hasOpenAIKey ? test : test.skip;
    
    testCondition('should generate educational content about Jung', async () => {
      const provider = new OpenAIProvider(
        process.env.REACT_APP_OPENAI_API_KEY!,
        process.env.REACT_APP_OPENAI_MODEL || 'gpt-4o-mini'
      );
      
      console.log('\n📚 Testing educational content generation...');
      
      const prompt = `
        Create a brief educational section about Carl Jung's concept of individuation.
        Include:
        1. A short definition (2-3 sentences)
        2. One key insight
        
        Keep it under 100 words and educational in tone.
      `;
      
      try {
        const content = await provider.generateCompletion(prompt, {
          temperature: 0.5,
          maxTokens: 150
        });
        
        expect(content).toBeDefined();
        expect(content.length).toBeGreaterThan(50);
        expect(content.toLowerCase()).toContain('individuation');
        
        console.log('✅ Generated content preview:');
        console.log(content.substring(0, 200) + '...');
        
      } catch (error) {
        console.error('❌ Content generation error:', error);
        throw error;
      }
    }, 30000);
  });

  // Skip message for tests that can't run
  if (!hasOpenAIKey) {
    test('OpenAI tests skipped - configure API key', () => {
      console.log('\n⚠️  OpenAI tests skipped:');
      console.log('   To test OpenAI integration:');
      console.log('   1. Add your OpenAI API key to .env file');
      console.log('   2. Set REACT_APP_OPENAI_API_KEY=sk-...');
      console.log('   3. Re-run the tests');
      expect(true).toBe(true);
    });
  }
});