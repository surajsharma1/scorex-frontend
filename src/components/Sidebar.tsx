import { Link, useLocation } from 'react-router-dom';
import { Trophy, Users, Settings, Eye, BarChart3, User, Crown, UserPlus, Users2, Zap, X } from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const location = useLocation();
  const [showProfile, setShowProfile] = useState(false);

  const menuItems = [
    { path: '/', icon: BarChart3, label: 'Dashboard' },
    { path: '/tournaments', icon: Trophy, label: 'Tournaments' },
    { path: '/friends', icon: UserPlus, label: 'Friends' },
    { path: '/clubs', icon: Users2, label: 'Clubs' },
    { path: '/membership', icon: Crown, label: 'Membership' },
  ];

  return (
    <div className="sidebar animate-fade-in">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="sidebar-title text-gradient">ScoreX</div>
            <div className="sidebar-subtitle">Tournament Manager</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item, index) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => isOpen && onToggle()} // Close sidebar on mobile when clicking nav item
            className={`nav-item animate-slide-in`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">{item.label}</span>
            {location.pathname === item.path && (
              <div className="ml-auto w-2 h-2 bg-accent-400 rounded-full animate-pulse"></div>
            )}
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-tip">
          <div className="sidebar-tip-title">Pro Tip</div>
          <div className="sidebar-tip-text">
            Use overlays for live streaming your tournaments!
          </div>
        </div>
      </div>
    </div>
  );
}
