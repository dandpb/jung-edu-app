# Aplicativo Educacional de Psicologia Analítica de Jung

Uma aplicação web educacional interativa para aprender conceitos de psicologia analítica de Carl Jung, construída com React e TypeScript.

## Recursos

- **Aprendizagem Baseada em Módulos**: 6 módulos abrangentes cobrindo os conceitos-chave de Jung
- **Mapa Mental Interativo**: Representação visual de conceitos interconectados usando React Flow
- **Integração de Vídeo**: Incorporação do YouTube para conteúdo educacional
- **Sistema de Anotações**: Notas pessoais com persistência em localStorage
- **Funcionalidade de Quiz**: Quizzes interativos com pontuação e rastreamento de progresso
- **Rastreamento de Progresso**: Monitore a jornada de aprendizagem com conquistas
- **Bibliografia e Recursos**: Lista selecionada de livros, artigos e filmes
- **Busca de Texto Completo**: Busca em todo o conteúdo
- **Design Responsivo**: UI bonita com Tailwind CSS

## Começando

### Pré-requisitos

- Node.js 14+ 
- npm ou yarn

### Instalação

```bash
# Clonar o repositório
cd jung-edu-app

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm start
```

O aplicativo abrirá em `http://localhost:3000`

### Scripts Disponíveis

```bash
# Executar servidor de desenvolvimento
npm start

# Executar testes
npm test

# Executar testes com cobertura
npm run test:coverage

# Build para produção
npm run build
```

## Testes

O projeto inclui cobertura abrangente de testes para todos os recursos:

```bash
# Executar todos os testes
npm test

# Executar testes com relatório de cobertura
npm run test:coverage

# Executar testes em modo watch
npm test -- --watch
```

### Estrutura de Testes

- **Testes Unitários**: Componentes, hooks e utilitários
- **Testes de Integração**: Componentes de página e fluxos de usuário
- **Metas de Cobertura**: 70%+ para branches, funções, linhas e declarações

### Arquivos de Teste

```
src/
├── App.test.tsx
├── components/__tests__/
│   ├── Navigation.test.tsx
│   ├── quiz/QuizComponent.test.tsx
│   └── notes/NoteEditor.test.tsx
├── pages/__tests__/
│   ├── Dashboard.test.tsx
│   ├── ModulePage.test.tsx
│   ├── NotesPage.test.tsx
│   ├── ProgressPage.test.tsx
│   ├── SearchPage.test.tsx
│   ├── MindMapPage.test.tsx
│   └── BibliographyPage.test.tsx
├── hooks/__tests__/
│   └── useProgress.test.tsx
└── utils/__tests__/
    └── localStorage.test.ts
```

## Estrutura do Projeto

```
jung-edu-app/
├── public/
├── src/
│   ├── components/
│   │   ├── modules/
│   │   ├── quiz/
│   │   ├── notes/
│   │   └── Navigation.tsx
│   ├── data/
│   │   └── modules.ts
│   ├── hooks/
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── ModulePage.tsx
│   │   ├── MindMapPage.tsx
│   │   ├── NotesPage.tsx
│   │   ├── ProgressPage.tsx
│   │   ├── BibliographyPage.tsx
│   │   └── SearchPage.tsx
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   ├── App.tsx
│   ├── index.tsx
│   └── index.css
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── README.md
```

## Tecnologias Utilizadas

- **React 18**: Biblioteca UI
- **TypeScript**: Segurança de tipos
- **React Router**: Navegação
- **React Flow**: Visualização de mapa mental
- **Tailwind CSS**: Estilização
- **React YouTube**: Player de vídeo
- **Lucide React**: Ícones
- **Jest & React Testing Library**: Testes

## Conteúdo dos Módulos

1. **Introdução a Carl Jung**: Vida, carreira e conceitos fundamentais
2. **O Inconsciente Coletivo**: Padrões universais e conteúdos arquetípicos
3. **Principais Arquétipos**: Sombra, Anima/Animus, Self e mais
4. **O Processo de Individuação**: Jornada rumo à totalidade psicológica
5. **Tipos Psicológicos**: Introversão/Extroversão e as quatro funções
6. **Sonhos e Simbolismo**: A abordagem de Jung para interpretação de sonhos

## Recursos em Detalhes

### Rastreamento de Progresso
- Porcentagem geral de conclusão
- Progresso específico do módulo
- Rastreamento de pontuações de quiz
- Tempo gasto aprendendo
- Sistema de conquistas

### Anotações
- Criar notas para cada módulo
- Funcionalidade de editar e excluir
- Buscar e filtrar notas
- Armazenamento persistente

### Quizzes Interativos
- Perguntas de múltipla escolha
- Feedback imediato
- Rastreamento de pontuação
- Indicadores de progresso

### Mapa Mental
- Representação visual de conceitos
- Navegação interativa
- Clique para explorar módulos
- Tipos de nós codificados por cor

## Contribuindo

1. Faça fork do repositório
2. Crie sua branch de recurso (`git checkout -b feature/RecursoIncrivel`)
3. Faça commit de suas alterações (`git commit -m 'Adicionar RecursoIncrivel'`)
4. Faça push para a branch (`git push origin feature/RecursoIncrivel`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a Licença MIT.

## Agradecimentos

- Conteúdo baseado nas teorias de psicologia analítica de Carl Jung
- Construído com as melhores práticas modernas do React
- Projetado para fins educacionais