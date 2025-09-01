import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BookOpen, 
  FileText,
  Library, 
  Search,
  Home,
  Settings,
  LogOut,
  User,
  LogIn,
  Activity
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
    <nav className="bg-white shadow-sm border-b border-gray-200" data-testid="main-navigation">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/dashboard" className="flex items-center space-x-3" data-testid="nav-brand">
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
                  data-testid={`nav-link-${item.path.replace('/', '')}`}
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
                      data-testid="nav-link-admin"
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
                      data-testid="nav-link-monitoring"
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
                
                <div className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600" data-testid="user-menu">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline font-medium">
                    {user?.profile?.firstName || user?.username || 'Usuário'} {user?.profile?.lastName || ''}
                  </span>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200"
                  data-testid="logout-button"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Sair</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                data-testid="nav-link-login"
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