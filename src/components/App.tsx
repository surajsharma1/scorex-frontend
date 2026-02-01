import { useState, useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Frontpage from './Frontpage';
import { useTheme } from './ThemeProvider';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { isDark } = useTheme(); // Keep for dark mode, but no toggle

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      if (token) {
        setIsAuthenticated(true);
      } else {
        const urlParams = new URLSearchParams(window.location.search);
        const tokenFromUrl = urlParams.get('token');
        if (tokenFromUrl) {
          localStorage.setItem('token', tokenFromUrl);
          setIsAuthenticated(true);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google`;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
        <p className="mt-4 text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Frontpage />;
  }

  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-6 overflow-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <button
            onClick={handleLogout}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Logout
          </button>
        </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-black">Tournaments</h3>
            <p className="text-black">View and manage tournaments.</p>
            <button onClick={() => navigate('/tournaments')} className="text-black hover:underline mt-2">Go to Tournaments</button>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-black">Teams</h3>
            <p className="text-black">Manage teams and players.</p>
            <button onClick={() => navigate('/teams')} className="text-black hover:underline mt-2">Go to Teams</button>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold">Brackets</h3>
            <p className="text-black">Create and view tournament brackets.</p>
            <button onClick={() => navigate('/brackets')} className="text-black hover:underline mt-2">Go to Brackets</button>
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  );
}

export default App;