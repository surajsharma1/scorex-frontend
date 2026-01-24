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
      console.log('Login response:', response.data);  // Debug log
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        console.log('Token set, navigating to /');  // Debug log
        navigate('/');
      } else {
        setError('Login failed: No token received');
      }
    } catch (err: any) {
      console.error('Login error:', err);  // Debug log
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container flex justify-center items-center min-h-screen">
      <form onSubmit={handleSubmit} className="card p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Login to ScoreX</h2>
        {error && <div className="alert alert-error mb-4">{error}</div>}
        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary w-full" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
        <p className="text-center mt-4">
          Don't have an account? <button onClick={() => navigate('/register')} className="text-blue-600">Register</button>
        </p>
      </form>
    </div>
  );
}