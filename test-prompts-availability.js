#!/usr/bin/env node

/**
 * Test script to verify all LLM prompts are available in the mock service
 */

const { promptTemplateServiceMock } = require('./src/services/prompts/promptTemplateServiceMock');

async function testPromptsAvailability() {
  console.log('🔍 Testing Prompt Templates Availability\n');
  console.log('=' .repeat(50));
  
  try {
    // Get all templates
    const templates = await promptTemplateServiceMock.getTemplates();
    console.log(`✅ Total templates found: ${templates.length}\n`);
    
    // Get categories
    const categories = await promptTemplateServiceMock.getCategories();
    console.log('📁 Categories:');
    categories.forEach(cat => {
      console.log(`  - ${cat.name} (${cat.key}): ${cat.description}`);
    });
    console.log();
    
    // Expected prompts
    const expectedPrompts = [
      { key: 'content.introduction', name: 'Introdução de Módulo', category: 'content' },
      { key: 'content.section', name: 'Seção de Conteúdo', category: 'content' },
      { key: 'quiz.questions', name: 'Questões de Quiz', category: 'quiz' },
      { key: 'video.search_queries', name: 'Queries de Busca de Vídeos', category: 'video' },
      { key: 'bibliography.resources', name: 'Recursos Bibliográficos', category: 'bibliography' }
    ];
    
    console.log('📋 Checking expected prompts:');
    console.log('-' .repeat(50));
    
    let allFound = true;
    
    for (const expected of expectedPrompts) {
      const template = await promptTemplateServiceMock.getTemplateByKey(expected.key);
      
      if (template) {
        console.log(`✅ ${expected.key}`);
        console.log(`   Name: ${template.name}`);
        console.log(`   Category: ${template.category}`);
        console.log(`   Variables: ${template.variables.map(v => v.name).join(', ')}`);
      } else {
        console.log(`❌ ${expected.key} - NOT FOUND`);
        allFound = false;
      }
      console.log();
    }
    
    console.log('=' .repeat(50));
    
    if (allFound) {
      console.log('✅ SUCCESS: All expected prompts are available!');
      console.log('\n📝 Summary:');
      console.log(`  - Total Templates: ${templates.length}`);
      console.log(`  - Categories: ${categories.length}`);
      console.log(`  - All prompts properly configured for customization`);
    } else {
      console.log('❌ ERROR: Some prompts are missing!');
      process.exit(1);
    }
    
    // Group templates by category
    console.log('\n📊 Templates by Category:');
    console.log('-' .repeat(50));
    
    const byCategory = {};
    templates.forEach(t => {
      if (!byCategory[t.category]) {
        byCategory[t.category] = [];
      }
      byCategory[t.category].push(t);
    });
    
    Object.entries(byCategory).forEach(([cat, temps]) => {
      const category = categories.find(c => c.key === cat);
      console.log(`\n${category?.icon || '📄'} ${category?.name || cat} (${temps.length} templates):`);
      temps.forEach(t => {
        console.log(`  - ${t.name} (${t.key})`);
        console.log(`    ${t.description}`);
      });
    });
    
  } catch (error) {
    console.error('❌ Error testing prompts:', error);
    process.exit(1);
  }
}

// Run the test
testPromptsAvailability();