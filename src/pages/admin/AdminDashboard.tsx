import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Network, 
  Library, 
  Users, 
  BarChart3, 
  Settings,
  ArrowRight
} from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';

const AdminDashboard: React.FC = () => {
  const { currentAdmin, modules } = useAdmin();

  const adminCards = [
    {
      title: 'Gerenciar Módulos',
      description: 'Criar, editar e organizar módulos de aprendizagem',
      icon: BookOpen,
      path: '/admin/modules',
      stats: `${modules.length} módulos`,
      color: 'bg-blue-500'
    },
    {
      title: 'Editor de Mapa Mental',
      description: 'Configurar o mapa mental interativo de conceitos',
      icon: Network,
      path: '/admin/mindmap',
      stats: 'Editor interativo',
      color: 'bg-purple-500'
    },
    {
      title: 'Recursos e Mídia',
      description: 'Gerenciar bibliografia, filmes e vídeos',
      icon: Library,
      path: '/admin/resources',
      stats: 'Livros, Filmes, Vídeos',
      color: 'bg-green-500'
    }
  ];

  const stats = [
    {
      label: 'Total de Módulos',
      value: modules.length,
      icon: BookOpen,
      color: 'text-blue-600'
    },
    {
      label: 'Total de Questionários',
      value: modules.filter(m => m.content.quiz).length,
      icon: BarChart3,
      color: 'text-purple-600'
    },
    {
      label: 'Conteúdo de Vídeo',
      value: modules.reduce((acc, m) => acc + (m.content.videos?.length || 0), 0),
      icon: Library,
      color: 'text-green-600'
    },
    {
      label: 'Usuários Ativos',
      value: '1',
      icon: Users,
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
          Painel Administrativo
        </h1>
        <p className="text-gray-600">
          Bem-vindo de volta, {currentAdmin?.username}! Gerencie seu conteúdo educacional aqui.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stat.value}
                  </p>
                </div>
                <Icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Admin Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {adminCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.path}
              to={card.path}
              className="card hover:shadow-lg transition-all transform hover:scale-[1.02]"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${card.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {card.title}
              </h3>
              <p className="text-gray-600 mb-4">
                {card.description}
              </p>
              <p className="text-sm font-medium text-gray-500">
                {card.stats}
              </p>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 card bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Ações Rápidas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/admin/modules"
            className="btn-secondary text-center"
          >
            Adicionar Novo Módulo
          </Link>
          <Link
            to="/admin/mindmap"
            className="btn-secondary text-center"
          >
            Editar Mapa Mental
          </Link>
          <Link
            to="/admin/resources"
            className="btn-secondary text-center"
          >
            Adicionar Recursos
          </Link>
        </div>
      </div>

      {/* System Info */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center space-x-2 text-blue-800">
          <Settings className="w-5 h-5" />
          <p className="text-sm">
            <strong>Status do Sistema:</strong> Todos os sistemas operacionais. 
            Último login: {currentAdmin?.lastLogin ? new Date(currentAdmin.lastLogin).toLocaleString('pt-BR') : 'Nunca'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;