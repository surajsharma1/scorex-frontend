import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import api from '../services/api';
import { Zap } from 'lucide-react';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (!token) { navigate('/login?error=no_token'); return; }
    localStorage.setItem('token', token);
    api.get('/auth/me')
      .then(res => {
        const u = res.data.data;
        login({ token, user: u });
        navigate('/dashboard');
      })
      .catch(() => { localStorage.removeItem('token'); navigate('/login?error=oauth_failed'); });
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
          <Zap className="w-8 h-8 text-white" />
        </div>
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-400">Completing sign in...</p>
      </div>
    </div>
  );
}
