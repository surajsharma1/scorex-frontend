import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Trophy, 
  Users, 
  MessageCircle, 
  Bell, 
  User, 
  Settings, 
  LogOut,
  LayoutPanelLeft
} from 'lucide-react';

interface SidebarProps {
  user: any;
  logout: () => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

export default function Sidebar({ user, logout }: SidebarProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Trophy, label: 'Tournaments', path: '/tournaments' },
    { icon: Users, label: 'Teams', path: '/teams' },
    { icon: MessageCircle, label: 'Live Matches', path: '/live' },
    { icon: Bell, label: 'Notifications', path: '/notifications' },
    { icon: User, label: 'Profile', path: '/profile' },
    { icon: Settings, label: 'Settings', path: '/settings' }
  ];

  return (
    <div className={`bg-white/10 backdrop-blur-xl border-r border-white/20 h-screen transition-all duration-300 flex flex-col ${isOpen ? 'w-64' : 'w-20'}`}>
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all"
          >
            <LayoutPanelLeft className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-0' : 'rotate-180'}`} />
          </button>
          {isOpen && (
            <div>
              <h1 className="text-2xl font-black bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                ScoreX
              </h1>
              <p className="text-sm text-slate-400">{user.role}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              group flex items-center gap-4 p-4 rounded-2xl transition-all duration-200
              ${isActive 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-xl' 
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }
            `}
          >
            <item.icon className="w-6 h-6 flex-shrink-0 group-hover:scale-110 transition-transform" />
            {isOpen && <span className="font-medium">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-white/10">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-300 hover:text-white transition-all group"
        >
          <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          {isOpen && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );
}

