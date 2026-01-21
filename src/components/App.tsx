import { useState, useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [navigate]);

  if (!isAuthenticated) {
    return null;  // Let router handle login/register
  }

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <Outlet />  {/* Renders child routes */}
      </main>
    </div>
  );
}

export default App;