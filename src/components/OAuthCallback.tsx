import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const hash = location.hash;
    console.log('OAuthCallback: hash=', hash); // Debug

    if (hash) {
      try {
        const params = new URLSearchParams(hash.substring(1));
        const token = params.get('token');
        const userStr = params.get('user');
        
        console.log('Parsed token:', !!token, 'userStr preview:', userStr?.substring(0, 100));

        if (token) {
          localStorage.setItem('token', token);
          
          let user = null;
          if (userStr) {
            try {
              const decoded = decodeURIComponent(userStr);
              console.log('Decoded preview:', decoded.substring(0, 100));
              user = JSON.parse(decoded);
              localStorage.setItem('user', JSON.stringify(user));
            } catch (parseErr) {
              console.warn('User JSON parse failed, will refresh from API:', parseErr);
            }
          }
          
          // Clear hash and redirect
          window.location.replace('/dashboard');
          return;
        }
      } catch (paramsErr) {
        console.error('Hash params error:', paramsErr);
      }
    }
    
    // Fallback: use API refresh if token exists
    const token = localStorage.getItem('token');
    if (token) {
      window.location.replace('/dashboard');
      return;
    }
    
    console.error('No token found, redirect to login');
    window.location.href = '/login';
  }, [location.hash]);

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

