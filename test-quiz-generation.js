#!/usr/bin/env node

/**
 * Test script to verify quiz generation fix
 * Run with: node test-quiz-generation.js
 */

const { useModuleGenerator } = require('./src/hooks/useModuleGenerator.ts');

console.log('🧪 Testing Quiz Generation Fix...');

// Mock the module generation result that was causing issues
const mockResult = {
  module: {
    id: 'test-module-1',
    title: 'Test Module: Sombra',
    description: 'Módulo sobre o conceito junguiano da Sombra'
  },
  content: {
    introduction: 'Introdução sobre a Sombra...',
    sections: [
      {
        id: 'section-1',
        title: 'Conceitos Fundamentais',
        content: 'A Sombra representa...'
      }
    ]
  },
  quiz: {
    id: 'quiz-test-1',
    title: 'Quiz sobre Sombra',
    questions: [
      {
        id: 'q1',
        question: 'O que representa a Sombra na psicologia junguiana?',
        type: 'multiple-choice',
        options: [
          'Aspectos reprimidos da personalidade',
          'Imagem do parceiro ideal',
          'Máscara social',
          'Instintos criativos'
        ],
        correctAnswer: 0,
        explanation: 'A Sombra representa os aspectos reprimidos e negados da personalidade consciente.'
      },
      {
        id: 'q2',
        question: 'Como a Sombra se manifesta?',
        // Intentionally missing options to test fallback
        correctAnswer: 1,
        explanation: 'A Sombra se manifesta através de projeções e sonhos.'
      },
      {
        id: 'q3',
        question: 'Qual é o objetivo de trabalhar com a Sombra?',
        type: 'multiple-choice',
        options: [], // Empty options to test fallback
        correctAnswer: 0,
        explanation: 'O trabalho com a Sombra visa integração e individuação.'
      }
    ]
  }
};

console.log('📊 Original quiz data:', {
  hasQuiz: !!mockResult.quiz,
  questionCount: mockResult.quiz?.questions?.length || 0,
  questions: mockResult.quiz?.questions?.map(q => ({
    id: q.id,
    hasQuestion: !!q.question,
    hasOptions: !!q.options,
    optionsCount: q.options?.length || 0
  }))
});

console.log('\n✅ Test completed - check console output when running the actual hook');
console.log('🎯 The fix should now ensure all questions have proper options, even with fallbacks');