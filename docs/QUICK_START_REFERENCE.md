# jaqEdu Quick Start Reference Card

## 🚀 5-Minute Setup

```bash
# 1. Clone & Install
git clone [repo-url] && cd jung-edu-app
npm install

# 2. Configure
cp .env.example .env
# Edit .env - Add your OpenAI API key

# 3. Run
npm start
# Opens at http://localhost:3000
```

## 📁 Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Route pages
├── services/      # API & business logic
├── hooks/         # Custom React hooks
├── types/         # TypeScript types
└── utils/         # Helper functions
```

## 🔧 Essential Commands

```bash
# Development
npm start          # Start dev server
npm test          # Run tests (watch mode)
npm run test:all  # Run all tests once

# Building
npm run build     # Production build
npm run analyze   # Bundle analysis

# Testing
npm run test:coverage      # Coverage report
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests
```

## 🔑 Environment Variables

```bash
# Required
REACT_APP_OPENAI_API_KEY=sk-proj-xxxxx

# Admin Access
REACT_APP_ADMIN_USERNAME=admin
REACT_APP_ADMIN_PASSWORD_HASH=[generated]
REACT_APP_ADMIN_SALT=[generated]

# Optional
REACT_APP_YOUTUBE_API_KEY=xxxxx
REACT_APP_OPENAI_MODEL=gpt-4o-mini
```

## 🛠️ Common Tasks

### Add a New Component

```typescript
// src/components/MyComponent.tsx
import React from 'react';

interface MyComponentProps {
  title: string;
}

export const MyComponent: React.FC<MyComponentProps> = ({ title }) => {
  return <div className="p-4">{title}</div>;
};
```

### Add a New Page

```typescript
// src/pages/MyPage.tsx
import React from 'react';

export const MyPage: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <h1>My Page</h1>
    </div>
  );
};

// Add route in App.tsx
<Route path="/my-page" element={<MyPage />} />
```

### Add a Test

```typescript
// __tests__/components/MyComponent.test.tsx
import { render, screen } from '@testing-library/react';
import { MyComponent } from '../../src/components/MyComponent';

test('renders title', () => {
  render(<MyComponent title="Test" />);
  expect(screen.getByText('Test')).toBeInTheDocument();
});
```

## 🐛 Quick Debugging

```bash
# Check for TypeScript errors
npx tsc --noEmit

# Clear caches
rm -rf node_modules package-lock.json
npm install

# Check bundle size
npm run build
npm run analyze
```

## 🚀 Deploy Checklist

- [ ] Set production environment variables
- [ ] Run all tests: `npm run test:all`
- [ ] Build: `npm run build`
- [ ] Test build locally: `npx serve -s build`
- [ ] Deploy build folder to hosting service

## 📚 Key Technologies

- **React 18** - UI Framework
- **TypeScript** - Type Safety
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **Jest & RTL** - Testing
- **OpenAI API** - AI Features

## 🔗 Useful Links

- [Component Library](/docs/components.md)
- [API Documentation](/docs/api.md)
- [Testing Guide](/docs/testing.md)
- [Contributing](/CONTRIBUTING.md)

## 💡 Tips

1. **Use TypeScript** - All new code should be typed
2. **Test First** - Write tests before features
3. **Small Commits** - Commit early and often
4. **Use Hooks** - Prefer functional components
5. **Mobile First** - Design for mobile, enhance for desktop

---

**Need help?** Check the full [Setup Guide](SETUP_AND_DEPLOYMENT.md)