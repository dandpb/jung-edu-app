#!/usr/bin/env node

/**
 * Test script to verify video generation fix
 * Run with: node test-video-generation.js
 */

// Set up module resolution for TypeScript files
require = require('esm')(module);
require('ts-node/register');

const { VideoGenerator } = require('./src/services/llm/generators/video-generator.ts');
const { MockLLMProvider } = require('./src/services/llm/provider.ts');

async function testVideoGeneration() {
  console.log('🧪 Testing Video Generation Fix...\n');

  const provider = new MockLLMProvider();
  const videoGenerator = new VideoGenerator(provider);

  try {
    const videos = await videoGenerator.generateVideos(
      'Sombra', // topic
      ['inconsciente', 'projeção', 'integração'], // concepts
      'estudantes de psicologia', // targetAudience
      3, // count
      'pt-BR' // language
    );

    console.log('✅ Generated videos:', videos.length);
    console.log('\n📺 Video details:');
    videos.forEach((video, index) => {
      console.log(`\n${index + 1}. ${video.title}`);
      console.log(`   YouTube ID: ${video.youtubeId}`);
      console.log(`   Description: ${video.description.substring(0, 100)}...`);
      console.log(`   Duration: ${video.duration} minutes`);
    });

    // Check if we have real YouTube IDs (not placeholder or Rick Roll)
    const hasRealIds = videos.every(v => 
      v.youtubeId && 
      v.youtubeId !== 'dQw4w9WgXcQ' && 
      v.youtubeId !== 'PLACEHOLDER'
    );

    if (hasRealIds) {
      console.log('\n✅ SUCCESS: All videos have real YouTube IDs!');
    } else {
      console.log('\n⚠️  WARNING: Some videos still have placeholder IDs');
    }

  } catch (error) {
    console.error('❌ Error during video generation:', error);
  }
}

testVideoGeneration();