import { useState, useEffect, useRef } from 'react';
import { useTheme } from './ThemeProvider';
import api from '../services/api';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Trophy, Zap, CreditCard,
  User, Sun, Moon, LogOut,
  ChevronLeft, ChevronRight, Shield, Bell, X,
  Check, CheckCheck, Trash2, ExternalLink, RefreshCw,
  Radio, Megaphone, Users, UserPlus
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

type NotifTab = 'all' | 'unread';

export default function Sidebar({ user, logout, isOpen = false, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [notifOpen, setNotifOpen]       = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifTab, setNotifTab]         = useState<NotifTab>('all');
  const [markingAll, setMarkingAll]     = useState(false);
  const [collapsed, setCollapsed]       = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  // ── Data loaders ────────────────────────────────────────────────────────────
  const loadNotifications = async () => {
    setNotifLoading(true);
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data || []);
    } catch { /* silent */ } finally { setNotifLoading(false); }
  };

  const markRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch { /* silent */ }
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      // mark each unread one — no bulk endpoint needed
      const unread = notifications.filter(n => !n.isRead);
      await Promise.all(unread.map(n => api.put(`/notifications/${n._id}/read`)));
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch { /* silent */ } finally { setMarkingAll(false); }
  };

  const deleteNotif = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch { /* silent */ }
  };

  const deleteAllRead = async () => {
    const readIds = notifications.filter(n => n.isRead).map(n => n._id);
    try {
      await Promise.all(readIds.map(id => api.delete(`/notifications/${id}`)));
      setNotifications(prev => prev.filter(n => !n.isRead));
    } catch { /* silent */ }
  };

  useEffect(() => { loadNotifications(); }, []);
  useEffect(() => { if (!isOpen) setCollapsed(false); }, [isOpen]);

  // Close drawer when clicking outside
  useEffect(() => {
    if (!notifOpen) return;
    const handler = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notifOpen]);

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const isAdmin     = user?.role === 'admin';

  const displayed = notifTab === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications;

  // Icon per notification type
  const notifIcon = (type: string) => {
    if (type === 'system' || type === 'broadcast') return <Megaphone className="w-3.5 h-3.5" />;
    if (type === 'welcome')  return <UserPlus className="w-3.5 h-3.5" />;
    if (type === 'live')     return <Radio className="w-3.5 h-3.5" />;
    return <Bell className="w-3.5 h-3.5" />;
  };

  const notifAccent = (type: string) => {
    if (type === 'welcome')  return { bg: 'rgba(34,197,94,0.15)',  border: 'rgba(34,197,94,0.3)',  color: '#22c55e' };
    if (type === 'live')     return { bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.3)',  color: '#f87171' };
    return                          { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)', color: '#fbbf24' };
  };

  return (
    <>
      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <aside
        className={`flex flex-col h-full flex-shrink-0 transition-transform duration-300 z-40
          fixed inset-y-0 left-0 md:relative md:translate-x-0
          ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
          ${collapsed ? 'w-[4.5rem]' : 'w-64 md:w-[clamp(14rem,22vw,16rem)]'}
        `}
        style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)' }}
      >
        {/* Logo + Collapse / Mobile Close */}
        <div className="flex items-center justify-between p-4 min-h-[64px]"
          style={{ borderBottom: '1px solid var(--border)' }}>

          {isOpen && (
            <button onClick={onClose}
              className="p-1 -ml-1 rounded-lg hover:bg-[#39ff14]/10 md:hidden transition-colors bg-transparent">
              <svg className="w-6 h-6 text-[#39ff14] drop-shadow-[0_0_8px_rgba(57,255,20,0.8)]"
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <span className="font-black text-lg tracking-tight"
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-orbitron,sans-serif)' }}>
                ScoreX
              </span>
            </div>
          )}

          {collapsed && (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto cursor-pointer shadow-lg shadow-green-500/20"
              onClick={() => navigate('/dashboard')}
              style={{ background: 'linear-gradient(135deg,#22c55e,#10b981)' }}>
              <Zap className="w-4 h-4 text-black" fill="currentColor" />
            </div>
          )}

          {!collapsed && !isOpen && (
            <button onClick={() => setCollapsed(true)}
              className="p-1 rounded-lg transition-all hover:bg-[#39ff14]/10 hidden md:block bg-transparent">
              <ChevronLeft className="icon-fluid-xs text-[#39ff14] drop-shadow-[0_0_8px_rgba(57,255,20,0.8)]" />
            </button>
          )}
        </div>

        {collapsed && (
          <button onClick={() => setCollapsed(false)}
            className="hidden md:flex justify-center py-2 transition-all hover:bg-[#39ff14]/10 w-full bg-transparent"
            style={{ borderBottom: '1px solid var(--border)' }}>
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
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150"
              style={({ isActive }) => isActive
                ? { background: 'linear-gradient(135deg,rgba(239,68,68,0.2),rgba(220,38,38,0.15))', color: '#f87171', boxShadow: '0 0 12px rgba(239,68,68,0.15)' }
                : { color: 'var(--text-secondary)', borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: '6px' }
              }
            >
              {() => (
                <>
                  <Shield className="icon-fluid-base flex-shrink-0" style={{ color: '#f87171' }} />
                  {!collapsed && <span className="text-sm font-medium" style={{ color: '#f87171' }}>Admin Panel</span>}
                  {!collapsed && (
                    <span className="ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                      ADMIN
                    </span>
                  )}
                </>
              )}
            </NavLink>
          )}
        </nav>

        {/* Bottom actions */}
        <div className="p-2 space-y-1" style={{ borderTop: '1px solid var(--border)' }}>

          {/* Bell */}
          <button
            onClick={() => { setNotifOpen(o => !o); if (!notifOpen) loadNotifications(); }}
            title="Notifications"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-[var(--bg-elevated)] relative"
            style={{ color: 'var(--text-secondary)' }}
          >
            <div className="relative">
              <Bell className="icon-fluid-base flex-shrink-0 text-amber-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            {!collapsed && <span className="text-sm font-medium">Notifications</span>}
            {!collapsed && unreadCount > 0 && (
              <span className="ml-auto text-[10px] font-black px-1.5 py-0.5 rounded-full bg-red-500 text-white">{unreadCount}</span>
            )}
          </button>

          {/* Theme */}
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
              <span className="text-sm font-medium">
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </span>
            )}
            {!collapsed && (
              <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                style={{
                  background: isDark ? 'rgba(251,191,36,0.12)' : 'rgba(99,102,241,0.12)',
                  color: isDark ? '#fbbf24' : '#818cf8',
                }}>
                {isDark ? '☀' : '🌙'}
              </span>
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

      {/* ── Notification Drawer ─────────────────────────────────────────────── */}
      {notifOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
            onClick={() => setNotifOpen(false)}
          />

          {/* Drawer — mobile: full-width from edge; desktop: beside sidebar */}
          <div
            ref={drawerRef}
            className="fixed inset-y-0 z-[70] flex flex-col shadow-2xl"
            style={isMobile ? {
              left: 0,
              width: '100%',
              background: 'var(--bg-card)',
              borderRight: '1px solid var(--border)',
            } : {
              left: collapsed ? '4.5rem' : 'clamp(14rem,22vw,16rem)',
              width: 'min(420px, calc(100vw - 4.5rem))',
              background: 'var(--bg-card)',
              borderRight: '1px solid var(--border)',
            }}
          >
            {/* ── Header ── */}
            <div className="flex items-center gap-3 px-5 py-4 shrink-0"
              style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
                <Bell className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-base" style={{ color: 'var(--text-primary)' }}>Notifications</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={loadNotifications} title="Refresh"
                  className="p-2 rounded-xl hover:bg-[var(--bg-card)] transition-colors"
                  style={{ color: 'var(--text-muted)' }}>
                  <RefreshCw className={`w-4 h-4 ${notifLoading ? 'animate-spin' : ''}`} />
                </button>
                <button onClick={() => setNotifOpen(false)} title="Close"
                  className="p-2 rounded-xl hover:bg-[var(--bg-card)] transition-colors"
                  style={{ color: 'var(--text-muted)' }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ── Tabs + Actions ── */}
            <div className="flex items-center justify-between px-5 py-3 shrink-0"
              style={{ borderBottom: '1px solid var(--border)' }}>
              {/* Tabs */}
              <div className="flex gap-1 p-0.5 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
                {(['all', 'unread'] as const).map(tab => (
                  <button key={tab} onClick={() => setNotifTab(tab)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize"
                    style={{
                      background: notifTab === tab ? 'var(--bg-card)' : 'transparent',
                      color: notifTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
                      boxShadow: notifTab === tab ? '0 1px 4px rgba(0,0,0,0.2)' : 'none',
                    }}>
                    {tab === 'unread' ? `Unread (${unreadCount})` : `All (${notifications.length})`}
                  </button>
                ))}
              </div>
              {/* Bulk actions */}
              <div className="flex gap-1">
                {unreadCount > 0 && (
                  <button onClick={markAllRead} disabled={markingAll} title="Mark all read"
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                    style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', color: '#22c55e' }}>
                    <CheckCheck className="w-3.5 h-3.5" />
                    {markingAll ? '…' : 'All read'}
                  </button>
                )}
                {notifications.some(n => n.isRead) && (
                  <button onClick={deleteAllRead} title="Clear read"
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear read
                  </button>
                )}
              </div>
            </div>

            {/* ── List ── */}
            <div className="flex-1 overflow-y-auto">
              {notifLoading ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3">
                  <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</p>
                </div>
              ) : displayed.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3 px-6 text-center">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: 'var(--bg-elevated)' }}>
                    <Bell className="w-6 h-6 opacity-30" style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <p className="font-bold" style={{ color: 'var(--text-primary)' }}>
                    {notifTab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {notifTab === 'unread' ? "You're all caught up! 🎉" : "We'll notify you when something happens."}
                  </p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {displayed.map(n => {
                    const accent = notifAccent(n.type || 'system');
                    return (
                      <div
                        key={n._id}
                        className="flex gap-3 px-5 py-4 transition-colors cursor-pointer group"
                        style={{ background: n.isRead ? 'transparent' : 'rgba(245,158,11,0.04)' }}
                        onClick={() => {
                          if (!n.isRead) markRead(n._id);
                          if (n.link) window.open(n.link, '_blank');
                        }}
                      >
                        {/* Type icon */}
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                            style={{ background: accent.bg, border: `1px solid ${accent.border}`, color: accent.color }}>
                            {notifIcon(n.type || 'system')}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-bold leading-snug"
                              style={{ color: n.isRead ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                              {n.title}
                            </p>
                            {!n.isRead && (
                              <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-xs mt-1 leading-relaxed"
                            style={{ color: 'var(--text-muted)' }}>
                            {n.message}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                              {new Date(n.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                              })}
                            </span>
                            {n.link && (
                              <span className="text-[10px] flex items-center gap-0.5 font-semibold" style={{ color: accent.color }}>
                                <ExternalLink className="w-2.5 h-2.5" /> View
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!n.isRead && (
                            <button
                              onClick={e => { e.stopPropagation(); markRead(n._id); }}
                              title="Mark read"
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-green-500/20"
                              style={{ color: '#22c55e' }}>
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={e => { e.stopPropagation(); deleteNotif(n._id); }}
                            title="Delete"
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-red-500/20"
                            style={{ color: '#f87171' }}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Footer ── */}
            {notifications.length > 0 && (
              <div className="px-5 py-3 shrink-0 text-center"
                style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {notifications.length} notification{notifications.length !== 1 ? 's' : ''} total
                  {unreadCount > 0 ? ` · ${unreadCount} unread` : ' · all read'}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
