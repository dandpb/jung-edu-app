/**
 * Unauthorized Page
 * Shown when user lacks permissions to access a resource
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldX, ArrowLeft } from 'lucide-react';

export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
          <ShieldX className="w-10 h-10 text-red-600" />
        </div>
        
        <h1 className="text-3xl font-display font-bold text-gray-900 mb-4">
          Acesso Negado
        </h1>
        
        <p className="text-lg text-gray-600 mb-8">
          Você não tem permissão para acessar esta página.
        </p>
        
        <button
          onClick={() => navigate(-1)}
          className="btn-primary inline-flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </button>
      </div>
    </div>
  );
};