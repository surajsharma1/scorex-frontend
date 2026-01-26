import { useState, useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { notificationAPI } from '../services/api';
import { Notification } from './types';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      if (token) {
        setIsAuthenticated(true);
        fetchNotifications();
      } else {
        navigate('/login');
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [navigate]);

  const fetchNotifications = async () => {
    try {
      const response = await notificationAPI.getNotifications();
      setNotifications(response.data);
    } catch (error) {
      console.error('Failed to fetch notifications');
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error('Failed to mark as read');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token'); // Clear the JWT token
    setIsAuthenticated(false); // Update state
    navigate('/login'); // Redirect to login
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-6 overflow-auto">
        {/* Header with Logout */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
        </div>

        {/* Mobile notification bell */}
        <div className="flex justify-end mb-4 md:hidden">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative bg-white p-2 rounded-full shadow-md"
          >
            🔔
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs px-1">
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </button>
          {showNotifications && (
            <div className="absolute right-4 mt-12 bg-white border rounded shadow-lg w-64 max-h-64 overflow-y-auto z-50">
              {notifications.map(notification => (
                <div key={notification._id} className={`p-3 border-b ${notification.read ? 'bg-gray-50' : 'bg-blue-50'}`}>
                  <p className="text-sm">{notification.message}</p>
                  <button onClick={() => markAsRead(notification._id)} className="text-xs text-blue-600 mt-1">Mark as read</button>
                </div>
              ))}
            </div>
          )}
        </div>
        <Outlet />
      </main>
    </div>
  );
}

export default App;