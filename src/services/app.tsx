import { useState, useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

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
        navigate('/login');
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [navigate]);

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    
    <div className="app-container">
      <Sidebar isOpen={false} onToggle={function (): void {
        throw new Error('Function not implemented.');
      } } />
      <main className="main-content">
        <Outlet />
      </main>
    </div>

    
  );
}

export default App;