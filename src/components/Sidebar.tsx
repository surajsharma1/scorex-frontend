import { Link, useLocation } from 'react-router-dom';
import { Trophy, Users, Settings, Eye, BarChart3, User, Crown, UserPlus, Users2 } from 'lucide-react'; // Added User and Crown icons
import { useState } from 'react';

export default function Sidebar() {
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
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 dark:bg-gray-900 shadow-lg">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-center h-16 bg-gray-900 dark:bg-gray-800">
          <h1 className="text-xl font-bold text-white dark:text-gray-100">ScoreX</h1>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                location.pathname === item.path
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 dark:text-gray-400 hover:bg-gray-700 dark:hover:bg-gray-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.label}
            </Link>
          ))}
        </nav>

      </div>
    </div>
  );
}