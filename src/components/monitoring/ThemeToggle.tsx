import React from 'react';
import { Moon, Sun } from 'lucide-react';

interface ThemeToggleProps {
  theme: 'light' | 'dark';
  onToggle: () => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className={`relative inline-flex items-center h-8 w-14 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
        theme === 'dark' 
          ? 'bg-blue-600' 
          : 'bg-gray-300'
      }`}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
    >
      <span
        className={`inline-block h-6 w-6 rounded-full bg-white transition-transform duration-200 ${
          theme === 'dark' ? 'translate-x-7' : 'translate-x-1'
        }`}
      >
        <span className="flex items-center justify-center h-full w-full">
          {theme === 'dark' ? (
            <Moon className="h-3 w-3 text-gray-700" />
          ) : (
            <Sun className="h-3 w-3 text-yellow-500" />
          )}
        </span>
      </span>
    </button>
  );
};

export default ThemeToggle;