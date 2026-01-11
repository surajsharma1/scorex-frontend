import { Trophy, Users, LayoutGrid as Layout, Layers, GitBranch, Home } from 'lucide-react';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
}

export default function Sidebar({ activeView, setActiveView }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'tournaments', label: 'Tournaments', icon: Trophy },
    { id: 'teams', label: 'Teams & Players', icon: Users },
    { id: 'brackets', label: 'Brackets', icon: GitBranch },
    { id: 'overlay', label: 'Overlay Editor', icon: Layers },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Layout className="w-6 h-6" />
          </div>
          <div>
            <h1 className="sidebar-title">CricOverlay</h1>
            <p className="sidebar-subtitle">YouTube Overlay Studio</p>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`nav-item ${
                activeView === item.id
                  ? 'active'
                  : 'inactive'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-tip">
          <p className="sidebar-tip-title">Pro Tip</p>
          <p className="sidebar-tip-text">
            Use prebuilt overlays to get started quickly!
          </p>
        </div>
      </div>
    </aside>
  );
}