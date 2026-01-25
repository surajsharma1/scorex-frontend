import { useState } from 'react';
import { authAPI, tournamentAPI } from '../services/api';

export default function TestPage() {
  const [result, setResult] = useState('');

  const testLogin = async () => {
    try {
      const res = await authAPI.login({ email: 'admin@example.com', password: 'password123' });
      setResult('Login successful: ' + JSON.stringify(res.data));
    } catch (error: any) {
      setResult('Login failed: ' + error.message);
    }
  };

  const testTournaments = async () => {
    try {
      const res = await tournamentAPI.getTournaments();
      setResult('Tournaments: ' + JSON.stringify(res.data));
    } catch (error: any) {
      setResult('Tournaments failed: ' + error.message);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl mb-4">API Test Page</h2>
      <button onClick={testLogin} className="btn btn-primary mr-4">Test Login</button>
      <button onClick={testTournaments} className="btn btn-primary">Test Tournaments</button>
      <pre className="mt-4 bg-gray-100 p-4 rounded overflow-auto">{result}</pre>
    </div>
  );
}