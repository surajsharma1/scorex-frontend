import { useState, useEffect } from 'react';
import { useTheme } from './ThemeProvider';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Trophy, Zap, CreditCard,
  User, Sun, Moon, LogOut,
  ChevronLeft, ChevronRight, Shield
} from 'lucide-react';

interface SidebarProps {
  user: any;
  logout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard',  path: '/dashboard' },
  { icon: Trophy,          label: 'Tournament', path: '/tournaments' },
  { icon: Zap,             label: 'Live Match', path: '/live' },
  { icon: CreditCard,      label: 'Membership', path: '/membership' },
  { icon: User,            label: 'Profile',    path: '/profile' },
];

export default function Sidebar({ user, logout, isOpen = false, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!isOpen) setCollapsed(false);
  }, [isOpen]);

  const isAdmin = user?.role === 'admin';

  return (
    <aside
      className={`flex flex-col h-full flex-shrink-0 transition-transform duration-300 z-40
        fixed inset-y-0 left-0 md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
        ${collapsed ? 'w-[4.5rem]' : 'w-64 md:w-[clamp(14rem,22vw,16rem)]'}
      `}
      style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)' }}
    >
      {/* Logo + Collapse / Mobile Close */}
      <div className="flex items-center justify-between p-4 min-h-[64px]" style={{ borderBottom: '1px solid var(--border)' }}>
        {isOpen && (
          <button onClick={onClose} className="p-1 -ml-1 rounded-lg hover:bg-[#39ff14]/10 md:hidden transition-colors bg-transparent">
            <svg className="w-6 h-6 text-[#39ff14] drop-shadow-[0_0_8px_rgba(57,255,20,0.8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {!collapsed && (
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="relative">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg shadow-green-500/20"
                style={{ background: 'linear-gradient(135deg,#22c55e,#10b981)' }}>
                <Zap className="w-4 h-4 text-black" fill="currentColor" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            </div>
            <span className="font-black text-lg tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-orbitron,sans-serif)' }}>
              ScoreX
            </span>
          </div>
        )}

        {collapsed && (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto cursor-pointer shadow-lg shadow-green-500/20"
            onClick={() => navigate('/dashboard')} style={{ background: 'linear-gradient(135deg,#22c55e,#10b981)' }}>
            <Zap className="w-4 h-4 text-black" fill="currentColor" />
          </div>
        )}

        {!collapsed && !isOpen && (
          <button onClick={() => setCollapsed(true)} className="p-1 rounded-lg transition-all hover:bg-[#39ff14]/10 hidden md:block bg-transparent">
            <ChevronLeft className="icon-fluid-xs text-[#39ff14] drop-shadow-[0_0_8px_rgba(57,255,20,0.8)]" />
          </button>
        )}
      </div>

      {collapsed && (
        <button onClick={() => setCollapsed(false)} className="hidden md:flex justify-center py-2 transition-all hover:bg-[#39ff14]/10 w-full bg-transparent" style={{ borderBottom: '1px solid var(--border)' }}>
          <ChevronRight className="icon-fluid-xs text-[#39ff14] drop-shadow-[0_0_8px_rgba(57,255,20,0.8)]" />
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
            onClick={() => { if (isOpen) onClose?.(); }}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group ${isActive ? 'sx-active-nav' : 'sx-nav-item'}`
            }
            style={({ isActive }) => isActive
              ? { background: 'linear-gradient(135deg,rgba(34,197,94,0.2),rgba(16,185,129,0.15))', color: '#22c55e', boxShadow: '0 0 12px rgba(34,197,94,0.15)' }
              : { color: 'var(--text-secondary)' }
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className="icon-fluid-base flex-shrink-0" style={isActive ? { color: '#22c55e' } : {}} />
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                {!collapsed && isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400" />}
              </>
            )}
          </NavLink>
        ))}

        {isAdmin && (
          <NavLink
            to="/admin"
            title={collapsed ? 'Admin Panel' : undefined}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 mt-2"
            style={({ isActive }) => isActive
              ? { background: 'linear-gradient(135deg,rgba(239,68,68,0.2),rgba(220,38,38,0.15))', color: '#f87171', boxShadow: '0 0 12px rgba(239,68,68,0.15)' }
              : { color: 'var(--text-secondary)', borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: '6px' }
            }
          >
            {({ isActive }) => (
              <>
                <Shield className="icon-fluid-base flex-shrink-0" style={{ color: '#f87171' }} />
                {!collapsed && <span className="text-sm font-medium" style={{ color: '#f87171' }}>Admin Panel</span>}
                {!collapsed && <span className="ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">ADMIN</span>}
              </>
            )}
          </NavLink>
        )}
      </nav>

      {/* Bottom: theme toggle + logout */}
      <div className="p-2 space-y-1" style={{ borderTop: '1px solid var(--border)' }}>
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-[var(--bg-elevated)]"
          style={{ color: 'var(--text-secondary)' }}
        >
          {isDark
            ? <Sun className="icon-fluid-base flex-shrink-0 text-amber-400" />
            : <Moon className="icon-fluid-base flex-shrink-0 text-indigo-400" />}
          {!collapsed && (
            <span className="text-sm font-medium">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          )}
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          title="Logout"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-red-500/10"
          style={{ color: 'var(--text-secondary)' }}
        >
          <LogOut className="icon-fluid-base flex-shrink-0 text-red-400" />
          {!collapsed && <span className="text-sm font-medium hover:text-red-400 transition-colors">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
