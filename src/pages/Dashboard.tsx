import React from 'react';
import { Link } from 'react-router-dom';
import { Module, UserProgress } from '../types';
import { Clock, CheckCircle, ArrowRight, BarChart3 } from 'lucide-react';

interface DashboardProps {
  modules: Module[];
  userProgress: UserProgress;
}

const Dashboard: React.FC<DashboardProps> = ({ modules, userProgress }) => {
  const completionPercentage = Math.round(
    (userProgress.completedModules.length / modules.length) * 100
  );

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'text-green-600 bg-green-50';
      case 'intermediate':
        return 'text-yellow-600 bg-yellow-50';
      case 'advanced':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const translateDifficulty = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'Iniciante';
      case 'intermediate':
        return 'Intermediário';
      case 'advanced':
        return 'Avançado';
      default:
        return difficulty;
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-display font-bold text-gray-900 mb-4">
          Bem-vindo à Psicologia Analítica de Jung
        </h1>
        <p className="text-lg text-gray-600">
          Explore as profundezas da psique humana através das teorias revolucionárias de Carl Jung
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">Progresso Geral</h3>
            <BarChart3 className="w-5 h-5 text-primary-600" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Conclusão</span>
              <span className="font-medium">{completionPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">Módulos Concluídos</h3>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {userProgress.completedModules.length} / {modules.length}
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">Tempo de Estudo</h3>
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {Math.round(userProgress.totalTime / 60)} min
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-display font-bold text-gray-900">Módulos de Aprendizagem</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => {
            const isCompleted = userProgress.completedModules.includes(module.id);
            const isLocked = module.prerequisites?.some(
              (req) => !userProgress.completedModules.includes(req)
            );

            return (
              <Link
                key={module.id}
                to={isLocked ? '#' : `/module/${module.id}`}
                className={`module-card ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="text-4xl">{module.icon}</span>
                  {isCompleted && (
                    <CheckCircle className="w-6 h-6 text-green-600 lucide-check-circle" />
                  )}
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {module.title}
                </h3>
                
                <p className="text-gray-600 mb-4 line-clamp-2">
                  {module.description}
                </p>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center text-gray-500">
                      <Clock className="w-4 h-4 mr-1" />
                      {module.estimatedTime} min
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(module.difficulty)}`}>
                      {translateDifficulty(module.difficulty)}
                    </span>
                  </div>
                  
                  {!isLocked && (
                    <ArrowRight className="w-4 h-4 text-primary-600" />
                  )}
                </div>
                
                {isLocked && module.prerequisites && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Complete os pré-requisitos primeiro
                    </p>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;