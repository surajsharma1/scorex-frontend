import { useState, useEffect } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import Frontpage from './Frontpage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

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
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Frontpage />;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-4 md:p-6 overflow-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
        </div>
        {<div className="flex min-h-screen bg-gray-100">
    <Sidebar />
    <main className="flex-1 md:ml-64 p-6 overflow-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
      </div>
      <Outlet /> {}
      {}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Tournaments</h3>
          <p>Manage your cricket tournaments.</p>
          <Link to="/tournaments" className="text-blue-500 hover:underline">Go to Tournaments</Link>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Teams</h3>
          <p>Organize teams and players.</p>
          <Link to="/teams" className="text-blue-500 hover:underline">Go to Teams</Link>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Brackets</h3>
          <p>Create and view tournament brackets.</p>
          <Link to="/brackets" className="text-blue-500 hover:underline">Go to Brackets</Link>
        </div>
      </div>
    </main>
  </div>}
      </main>
    </div>
  );
}

export default App;