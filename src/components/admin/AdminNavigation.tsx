import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home,
  BookOpen, 
  Library, 
  Settings,
  LogOut,
  ArrowLeft
} from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';

const AdminNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentAdmin, logout } = useAdmin();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navItems = [
    {
      path: '/admin/dashboard',
      label: 'Dashboard',
      icon: Home
    },
    {
      path: '/admin/modules',
      label: 'Módulos',
      icon: BookOpen
    },
    {
      path: '/admin/resources',
      label: 'Recursos',
      icon: Library
    },
    {
      path: '/admin/prompts',
      label: 'Prompts IA',
      icon: Settings
    }
  ];

  return (
    <div className="bg-white shadow-sm border-b border-gray-200 mb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Navigation */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors mr-2"
              title="Voltar"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right side - User info and logout */}
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {currentAdmin?.username}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminNavigation;