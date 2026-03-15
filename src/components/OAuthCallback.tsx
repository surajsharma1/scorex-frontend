import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const hash = location.hash;
    if (hash) {
      try {
        const params = new URLSearchParams(hash.replace('#', ''));
        const token = params.get('token');
        const userStr = params.get('user');
        
        if (token && userStr) {
          localStorage.setItem('token', token);
          const user = JSON.parse(decodeURIComponent(userStr));
          localStorage.setItem('user', JSON.stringify(user));
          
          // Redirect to dashboard
          navigate('/dashboard', { replace: true });
          return;
        }
      } catch (e) {
        console.error('OAuth callback parse error:', e);
      }
    }
    
    // Fallback redirect
    navigate('/dashboard', { replace: true });
  }, [navigate, location]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Logging you in...</h1>
        <p className="text-slate-400">Completing Google login, please wait</p>
      </div>
    </div>
  );
}

