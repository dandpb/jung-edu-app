import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Network, 
  FileText, 
  TrendingUp, 
  Library, 
  Search,
  Home,
  Settings,
  LogOut
} from 'lucide-react';
import { useAdmin } from '../contexts/AdminContext';

const Navigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, logout } = useAdmin();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/mindmap', label: 'Mind Map', icon: Network },
    { path: '/notes', label: 'Notes', icon: FileText },
    { path: '/progress', label: 'Progress', icon: TrendingUp },
    { path: '/bibliography', label: 'Resources', icon: Library },
    { path: '/search', label: 'Search', icon: Search },
  ];

  const handleLogout = () => {
    logout();
    navigate('/dashboard');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/dashboard" className="flex items-center space-x-3">
            <BookOpen className="w-8 h-8 text-primary-600" />
            <h1 className="text-xl font-display font-bold text-gray-900">
              Jung's Psychology
            </h1>
          </Link>
          
          <div className="flex items-center space-x-1">
            {navItems.map((item) => {
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
            
            {isAdmin ? (
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
                  <span className="hidden sm:inline">Admin</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <Link
                to="/admin/login"
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;