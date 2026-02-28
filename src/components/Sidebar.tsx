import { Link, useLocation } from 'react-router-dom';
import { 
  BarChart3, Trophy, Radio, TrendingUp, Users, 
  Users2, Crown, User, LogOut, X, Sun, Moon, Shield 
} from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { getCurrentUser } from '../utils/auth';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const user = getCurrentUser();
  const isAdmin = user?.role === 'admin';

  const handleLogout = () => {
    if(confirm("Are you sure you want to logout?")) {
        localStorage.removeItem('token');
        window.location.href = '/login';
    }
  };

  const menuItems = [
    { path: '/dashboard', icon: BarChart3, label: 'Dashboard' },
    { path: '/tournaments', icon: Trophy, label: 'Tournaments' },
    { path: '/live-matches', icon: Radio, label: 'Live Matches' },
    { path: '/leaderboard', icon: TrendingUp, label: 'Leaderboard' },
    { path: '/teams', icon: Users, label: 'Team Manager' },
    { path: '/friends', icon: Users2, label: 'Community' },
    { path: '/clubs', icon: Users, label: 'Clubs' },
    { path: '/overlays', icon: Radio, label: 'Broadcast Studio' },
    { path: '/membership', icon: Crown, label: 'Membership' },
    { path: '/profile', icon: User, label: 'Profile' },
    ...(isAdmin ? [{ path: '/admin', icon: Shield, label: 'Admin Panel' }] : []),
  ];

  return (
    <>
      {/* Mobile Overlay Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700">
          <span className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            ScoreX
          </span>
          <button onClick={onToggle} className="md:hidden text-gray-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => { if(window.innerWidth < 768) onToggle() }}
                    className={`
                      flex items-center gap-3 px-3 py-3 rounded-lg font-medium transition-colors
                      ${isActive 
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}
                    `}
                  >
                    <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
}
