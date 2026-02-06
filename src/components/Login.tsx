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
    <div className="container flex justify-center items-center min-h-screen" role="main" aria-labelledby="login-heading">
      <form onSubmit={handleSubmit} className="card p-8 w-full max-w-md" role="form" aria-labelledby="login-heading">
        <h2 id="login-heading" className="text-2xl font-bold mb-6 text-center">Login to ScoreX</h2>
                   {error && <p className="text-red-500 mb-4" role="alert" aria-live="polite">{error}</p>}
           <div className="mb-4">
             <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
             <input
               id="email"
               type="email"
               value={email}
               onChange={(e) => setEmail(e.target.value)}
               className="w-full p-2 border rounded"
               required
               aria-describedby="email-help"
               aria-required="true"
             />
             <span id="email-help" className="sr-only">Enter your email address to log in</span>
           </div>
           <div className="mb-6">
             <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
             <input
               id="password"
               type="password"
               value={password}
               onChange={(e) => setPassword(e.target.value)}
               className="w-full p-2 border rounded"
               required
               aria-describedby="password-help"
               aria-required="true"
             />
             <span id="password-help" className="sr-only">Enter your password to log in</span>
           </div>
           <button type="submit" disabled={loading} className="btn btn-primary w-full mb-4" aria-describedby="login-status">
             {loading ? 'Logging in...' : 'Login'}
           </button>
           <span id="login-status" className="sr-only">{loading ? 'Logging in, please wait' : 'Click to log in'}</span>
           <button type="button" onClick={handleGoogleLogin} className="btn btn-secondary w-full" aria-label="Login using Google account">
             Login with Google
           </button>
         </form>
       </div>
     );
   }