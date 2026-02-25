import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';

// --- Dashboard Layout Wrapper ---
// This component handles the Sidebar and Mobile Menu for all protected pages
const DashboardLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
      } else {
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white overflow-hidden">
      {/* Mobile Menu Button */}
      <button 
        className="fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md md:hidden"
        onClick={() => setSidebarOpen(!isSidebarOpen)}
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Sidebar Component */}
      <Sidebar isOpen={isSidebarOpen} onToggle={() => setSidebarOpen(false)} />

      {/* Main Content - Use Outlet to render child routes */}
      <main className="flex-1 md:ml-64 h-full overflow-y-auto transition-all duration-300 p-4 md:p-8 pt-16 md:pt-8">
        <Outlet />
      </main>
    </div>
  );
};

// --- Main App Component ---
// Router is already in main.tsx, this just serves as a layout wrapper
// Uses Outlet to render child routes from the router
function App() {
  return <DashboardLayout />;
}

export default App;
