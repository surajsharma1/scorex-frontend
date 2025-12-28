import { Trophy, Users, Layout, Layers, GitBranch, Home, LogOut } from 'lucide-react';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  onLogout: () => void;
}

export default function Sidebar({ activeView, setActiveView, onLogout }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'tournaments', label: 'Tournaments', icon: Trophy },
    { id: 'teams', label: 'Teams & Players', icon: Users },
    { id: 'brackets', label: 'Brackets', icon: GitBranch },
    { id: 'overlay', label: 'Overlay Editor', icon: Layers },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 fixed h-screen shadow-lg">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-800 rounded-lg flex items-center justify-center">
            <Layout className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">CricOverlay</h1>
            <p className="text-xs text-gray-500">YouTube Overlay Studio</p>
          </div>
        </div>
      </div>

      <nav className="p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 transition-all ${
                activeView === item.id
                  ? 'bg-green-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200">
        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 mt-2">
          <p className="text-sm font-semibold text-gray-900">Pro Tip</p>
          <p className="text-xs text-gray-600 mt-1">
            Use prebuilt overlays to get started quickly!
          </p>
        </div>
      </div>
    </aside>
  );
}