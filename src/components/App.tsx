import { useState, useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useTheme } from './ThemeProvider';
import { Menu, Loader2 } from 'lucide-react';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();

  // Public routes that don't need the sidebar
  const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/live-tournament'];

  useEffect(() => {
    checkAuth();
  }, [location.pathname]);

  const checkAuth = () => {
    // Skip auth check for public routes
    if (publicRoutes.some(route => location.pathname.startsWith(route))) {
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
      navigate('/login');
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  // Layout for Public Pages (Login, Register, Live View)
  if (!isAuthenticated || publicRoutes.some(route => location.pathname.startsWith(route))) {
    return (
      <div className={`min-h-screen ${isDark ? 'dark' : ''} bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white`}>
        <Outlet />
      </div>
    );
  }

  // Layout for Authenticated Dashboard
  return (
    <div className={`flex min-h-screen ${isDark ? 'dark' : ''} bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white`}>
      {/* Mobile Menu Button */}
      <button 
        className="fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md md:hidden"
        onClick={() => setSidebarOpen(!isSidebarOpen)}
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onToggle={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 min-h-screen transition-all duration-300">
        <div className="p-4 md:p-8 pt-16 md:pt-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default App;