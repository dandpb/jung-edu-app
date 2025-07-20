import React from 'react';
import { Sparkles } from 'lucide-react';

interface AIGeneratedFooterProps {
  className?: string;
}

const AIGeneratedFooter: React.FC<AIGeneratedFooterProps> = ({ className = '' }) => {
  return (
    <div className={`flex items-center justify-center space-x-2 text-sm text-gray-500 mt-8 pt-4 border-t border-gray-200 ${className}`}>
      <Sparkles className="w-4 h-4" />
      <span>Gerado por IA</span>
    </div>
  );
};

export default AIGeneratedFooter;