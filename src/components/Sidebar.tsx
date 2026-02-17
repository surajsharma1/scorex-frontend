import { Link, useLocation } from 'react-router-dom';
import { Trophy, Users, Settings, Eye, BarChart3, User, Crown, UserPlus, Users2, Zap, X, Sun, Moon, Radio } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from './ThemeProvider';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const location = useLocation();
  const [showProfile, setShowProfile] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  const menuItems = [
    { path: '/', icon: BarChart3, label: 'Dashboard' },
    { path: '/tournaments', icon: Trophy, label: 'Tournaments' },
    { path: '/live-matches', icon: Radio, label: 'Live Matches' },
    { path: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { path: '/friends', icon: UserPlus, label: 'Friends' },
    { path: '/clubs', icon: Users2, label: 'Clubs' },
    { path: '/membership', icon: Crown, label: 'Membership' },
  ];

  return (
    <div className={`
      fixed inset-y-0 left-0 z-50 w-64 
      bg-gradient-to-b from-light-bg via-light-bg-alt to-light-accent 
      dark:from-dark-bg dark:via-dark-bg-alt dark:to-dark-primary 
      shadow-2xl border-r border-light-secondary/30 dark:border-dark-primary/30 
      transform transition-transform duration-300 ease-in-out
      lg:translate-x-0
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      {/* Close button for mobile */}
      <button
        onClick={onToggle}
        className="absolute top-4 right-4 lg:hidden p-2 rounded-lg bg-light-secondary/20 dark:bg-dark-primary/20 text-light-dark dark:text-dark-light hover:bg-light-secondary/40 dark:hover:bg-dark-primary/40 transition-colors z-50"
        aria-label="Close sidebar"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex items-center justify-center h-20 bg-gradient-to-r from-light-dark to-light-primary dark:from-dark-bg dark:to-dark-bg-alt border-b border-light-secondary/30 dark:border-dark-primary/30">

        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-r from-light-primary to-light-secondary dark:from-dark-primary dark:to-dark-secondary p-3 rounded-xl shadow-lg">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-2xl font-bold text-light-dark dark:text-dark-light text-gradient">ScoreX</div>
            <div className="text-sm text-light-primary dark:text-dark-accent">Tournament Manager</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-8 space-y-2">
        {menuItems.map((item, index) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => isOpen && onToggle()}
            className={`flex items-center gap-4 px-4 py-4 text-light-dark dark:text-dark-light rounded-xl transition-all duration-300 hover:bg-gradient-to-r hover:from-light-primary/30 hover:to-light-secondary/30 hover:text-light-primary dark:hover:from-dark-primary/40 dark:hover:to-dark-secondary/40 dark:hover:text-dark-light hover:shadow-lg hover:scale-105 animate-slide-in ${location.pathname === item.path ? 'bg-gradient-to-r from-light-primary/20 to-light-secondary/20 dark:from-dark-primary/30 dark:to-dark-secondary/30 text-light-primary dark:text-dark-light' : ''}`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">{item.label}</span>
            {location.pathname === item.path && (
              <div className="ml-auto w-2 h-2 bg-light-accent dark:bg-dark-accent rounded-full animate-pulse"></div>
            )}
          </Link>
        ))}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-light-secondary/30 dark:border-dark-primary/30">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 mb-4 rounded-xl bg-light-secondary/20 dark:bg-dark-primary/20 text-light-primary dark:text-dark-light hover:bg-light-secondary/40 dark:hover:bg-dark-primary/40 transition-all duration-300"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          <span className="text-sm font-medium">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        
        <div className="bg-light-bg-alt dark:bg-dark-bg-alt/50 backdrop-blur-sm p-4 rounded-xl border border-light-secondary/20 dark:border-dark-primary/20">
          <div className="font-semibold text-light-primary dark:text-dark-light mb-2">Pro Tip</div>
          <div className="text-sm text-light-dark/70 dark:text-dark-accent">
            Use overlays for live streaming your tournaments!
          </div>
        </div>
      </div>
    </div>
  );
}
