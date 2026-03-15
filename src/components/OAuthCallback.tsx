import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Aggressive immediate redirect - dashboard state handles auth
    const checkAndRedirect = () => {
      // First check hash (primary OAuth path)
      const hash = location.hash;
      console.log('OAuthCallback: hash=', hash);

      if (hash) {
        try {
          const params = new URLSearchParams(hash.substring(1));
          const token = params.get('token');
          const userStr = params.get('user');
          
          console.log('Parsed token:', !!token, 'userStr preview:', userStr?.substring(0, 100));

          if (token) {
            localStorage.setItem('token', token);
            
            if (userStr) {
              try {
                const decoded = decodeURIComponent(userStr);
                console.log('Decoded preview:', decoded.substring(0, 100));
                const user = JSON.parse(decoded);
                localStorage.setItem('user', JSON.stringify(user));
              } catch (parseErr) {
                console.warn('User JSON parse failed:', parseErr);
              }
            }
          }
        } catch (paramsErr) {
          console.error('Hash params error:', paramsErr);
        }
      }
      
      // IMMEDIATE redirect - App.tsx storage listener handles rest
      window.location.replace('/dashboard');
    };

    // Run immediately and retry every 100ms (handles race conditions)
    checkAndRedirect();
    const interval = setInterval(checkAndRedirect, 100);

    // Cleanup after 5s max
    const timeout = setTimeout(() => {
      clearInterval(interval);
      console.log('OAuthCallback timeout - forcing dashboard');
      window.location.replace('/dashboard');
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Logging you in...</h1>
        <p className="text-slate-400">Completing Google login, please wait</p>
        <p className="text-sm mt-4 text-slate-500">If not redirected in 5s, <a href="/login" className="text-blue-400 hover:underline">click here</a></p>
      </div>
    </div>
  );
}

