import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Network, 
  FileText, 
  Library, 
  Search,
  Home,
  Settings,
  LogOut,
  Brain,
  User,
  LogIn,
  Activity,
  BarChart3,
  MessageSquare,
  Trophy,
  Play
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/auth';

const Navigation: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated, user, logout, hasRole } = useAuth();
  const isAdmin = hasRole(UserRole.ADMIN);

  const navItems = [
    { path: '/dashboard', label: 'Painel', icon: Home },
    { path: '/notes', label: 'Anotações', icon: FileText },
    { path: '/bibliography', label: 'Recursos', icon: Library },
    { path: '/search', label: 'Buscar', icon: Search },
  ];

  const handleLogout = async () => {
    await logout();
  };

  // Don't show navigation on auth pages
  if (location.pathname.startsWith('/login') || 
      location.pathname.startsWith('/register') ||
      location.pathname.startsWith('/forgot-password')) {
    return null;
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/dashboard" className="flex items-center space-x-3">
            <BookOpen className="w-8 h-8 text-primary-600" />
            <h1 className="text-xl font-display font-bold text-gray-900">
              Psicologia de Jung
            </h1>
          </Link>
          
          <div className="flex items-center space-x-1">
            {isAuthenticated && navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium
                    transition-all duration-200
                    ${isActive 
                      ? 'bg-primary-50 text-primary-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
            
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <>
                    <Link
                      to="/admin"
                      className={`
                        flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium
                        transition-all duration-200
                        ${location.pathname.startsWith('/admin') 
                          ? 'bg-primary-50 text-primary-700' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }
                      `}
                    >
                      <Settings className="w-4 h-4" />
                      <span className="hidden sm:inline">Administrador</span>
                    </Link>
                    <Link
                      to="/monitoring"
                      className={`
                        flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium
                        transition-all duration-200
                        ${location.pathname === '/monitoring' 
                          ? 'bg-primary-50 text-primary-700' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }
                      `}
                    >
                      <Activity className="w-4 h-4" />
                      <span className="hidden sm:inline">Monitoramento</span>
                    </Link>
                  </>
                )}
                
                <div className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline font-medium">
                    {user?.profile.firstName} {user?.profile.lastName}
                  </span>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Sair</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Entrar</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;