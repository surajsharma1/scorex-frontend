import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../components/ThemeProvider';
import { 
  BarChart3, Trophy, Radio, TrendingUp, Users, 
  Settings, LogOut, X, Shield, Layout
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const menuItems = [
    { icon: <Layout className="w-5 h-5" />, label: 'Dashboard', path: '/dashboard' },
    { icon: <Trophy className="w-5 h-5" />, label: 'Tournaments', path: '/tournaments' },
    { icon: <Users className="w-5 h-5" />, label: 'Teams', path: '/tournaments/create' }, // Or separate team route
    { icon: <Radio className="w-5 h-5" />, label: 'Live Tools', path: '/overlays' },
    { icon: <TrendingUp className="w-5 h-5" />, label: 'Analytics', path: '/stats' }, // Placeholder path
  ];

  return (
    <>
      {/* Mobile Overlay Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40
        w-64 bg-white dark:bg-gray-800 
        border-r border-gray-200 dark:border-gray-700
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 flex flex-col
      `}>
        
        {/* Logo Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-green-600 to-emerald-500 rounded-lg flex items-center justify-center text-white font-bold font-orbitron">
              S
            </div>
            <span className="text-xl font-bold font-orbitron tracking-tight dark:text-white">SCOREX</span>
          </div>
          <button onClick={onToggle} className="md:hidden text-gray-500 dark:text-gray-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => window.innerWidth < 768 && onToggle()}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                  ${isActive 
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'}
                `}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          {/* Upgrade Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white mb-4 shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-yellow-300" />
              <span className="text-xs font-bold uppercase tracking-wider">Pro Plan</span>
            </div>
            <p className="text-xs opacity-90 mb-3">Unlock animated overlays & advanced stats.</p>
            <Link 
              to="/upgrade" 
              className="block w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-center text-xs font-bold transition-colors"
            >
              Upgrade Now
            </Link>
          </div>

          <button 
            onClick={toggleTheme}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}