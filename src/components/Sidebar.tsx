import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Trophy, Zap, Users, CreditCard,
  Building2, UserPlus, User, Sun, Moon, LogOut,
  ChevronLeft, ChevronRight, Shield
} from 'lucide-react';

interface SidebarProps {
  user: any;
  logout: () => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard',    path: '/dashboard' },
  { icon: Trophy,          label: 'Tournament',   path: '/tournaments' },
  { icon: Zap,             label: 'Live Match',   path: '/live' },
  { icon: Users,           label: 'Team Manager', path: '/tournaments' },
  { icon: CreditCard,      label: 'Membership',   path: '/membership' },
  { icon: Building2,       label: 'Club',         path: '/clubs' },
  { icon: UserPlus,        label: 'Friends',      path: '/friends' },
  { icon: User,            label: 'Profile',      path: '/profile' },
];

export default function Sidebar({ user, logout, isOpen = false, onToggle }: SidebarProps) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return !window.matchMedia('(prefers-color-scheme: light)').matches;
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
    }
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  const handleLogout = () => { logout(); navigate('/login'); };
  const isAdmin = user?.role === 'admin';

  return (
    <aside
      className={`flex flex-col h-screen transition-all duration-300 flex-shrink-0 ${collapsed ? 'w-16' : 'w-60'}`}
      style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)' }}
    >
      {/* Logo + Collapse */}
      <div className="flex items-center justify-between p-4 min-h-[64px]" style={{ borderBottom: '1px solid var(--border)' }}>
        {!collapsed && (
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="relative">
              <div className="w-8 h-8 bg-gradient-to-tr from-green-600 to-emerald-400 rounded-lg flex items-center justify-center font-black text-black text-sm shadow-lg shadow-green-500/20">
                S
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            </div>
            <span className="font-black text-lg tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-orbitron, sans-serif)' }}>
              ScoreX
            </span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-gradient-to-tr from-green-600 to-emerald-400 rounded-lg flex items-center justify-center font-black text-black text-sm mx-auto cursor-pointer shadow-lg shadow-green-500/20" onClick={() => navigate('/dashboard')}>
            S
          </div>
        )}
        {!collapsed && (
          <button onClick={() => setCollapsed(true)} className="p-1 rounded-lg transition-all hover:bg-green-500/10" style={{ color: 'var(--text-muted)' }}>
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {collapsed && (
        <button onClick={() => setCollapsed(false)} className="flex justify-center py-2 transition-all hover:bg-green-500/10" style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* User info */}
      {!collapsed && user && (
        <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-green-600 to-emerald-400 flex items-center justify-center text-black font-black text-sm flex-shrink-0 shadow-md shadow-green-500/20">
              {user.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{user.username}</p>
              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map(item => (
          <NavLink
            key={item.label}
            to={item.path}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group ${isActive ? 'sx-active-nav' : 'sx-nav-item'}`
            }
            style={({ isActive }) => isActive
              ? { background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(16,185,129,0.15))', color: '#22c55e', boxShadow: '0 0 12px rgba(34,197,94,0.15)' }
              : { color: 'var(--text-secondary)' }
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className="w-5 h-5 flex-shrink-0" style={isActive ? { color: '#22c55e' } : {}} />
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                {!collapsed && isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400" />}
              </>
            )}
          </NavLink>
        ))}

        {/* Admin Panel — only for admin users */}
        {isAdmin && (
          <NavLink
            to="/admin"
            title={collapsed ? 'Admin Panel' : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 mt-2`
            }
            style={({ isActive }) => isActive
              ? { background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(220,38,38,0.15))', color: '#f87171', boxShadow: '0 0 12px rgba(239,68,68,0.15)' }
              : { color: 'var(--text-secondary)', borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: '6px' }
            }
          >
            {({ isActive }) => (
              <>
                <Shield className="w-5 h-5 flex-shrink-0" style={isActive ? { color: '#f87171' } : { color: '#f87171' }} />
                {!collapsed && <span className="text-sm font-medium" style={{ color: '#f87171' }}>Admin Panel</span>}
                {!collapsed && <span className="ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">ADMIN</span>}
              </>
            )}
          </NavLink>
        )}
      </nav>

      {/* Bottom: theme + logout */}
      <div className="p-2 space-y-1" style={{ borderTop: '1px solid var(--border)' }}>
        <button
          onClick={() => setDark(!dark)}
          title={dark ? 'Switch to Light' : 'Switch to Dark'}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-green-500/10"
          style={{ color: 'var(--text-secondary)' }}
        >
          {dark
            ? <Sun className="w-5 h-5 flex-shrink-0 text-amber-400" />
            : <Moon className="w-5 h-5 flex-shrink-0 text-blue-400" />
          }
          {!collapsed && <span className="text-sm font-medium">{dark ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>
        <button
          onClick={handleLogout}
          title="Logout"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-red-500/10"
          style={{ color: 'var(--text-secondary)' }}
        >
          <LogOut className="w-5 h-5 flex-shrink-0 text-red-400" />
          {!collapsed && <span className="text-sm font-medium hover:text-red-400 transition-colors">Logout</span>}
        </button>
      </div>
    </aside>
  );
}

