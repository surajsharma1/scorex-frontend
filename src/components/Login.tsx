import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await authAPI.login({ email, password });
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        navigate('/');
      } else {
        setError('Login failed: No token received');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google`;
  };

  return (
    <div className="container flex justify-center items-center min-h-screen">
      <form onSubmit={handleSubmit} className="card p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Login to ScoreX</h2>
                   {error && <p className="text-red-500 mb-4">{error}</p>}
           <div className="mb-4">
             <label className="block text-sm font-medium mb-1">Email</label>
             <input
               type="email"
               value={email}
               onChange={(e) => setEmail(e.target.value)}
               className="w-full p-2 border rounded"
               required
             />
           </div>
           <div className="mb-6">
             <label className="block text-sm font-medium mb-1">Password</label>
             <input
               type="password"
               value={password}
               onChange={(e) => setPassword(e.target.value)}
               className="w-full p-2 border rounded"
               required
             />
           </div>
           <button type="submit" disabled={loading} className="btn btn-primary w-full mb-4">
             {loading ? 'Logging in...' : 'Login'}
           </button>
           <button type="button" onClick={handleGoogleLogin} className="btn btn-secondary w-full">
             Login with Google
           </button>
         </form>
       </div>
     );
   }