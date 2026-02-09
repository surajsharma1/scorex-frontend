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
    <div className="p-6 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white min-h-screen">
      <h2 className="text-2xl mb-4">API Test Page</h2>
      <button onClick={testLogin} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg mr-4 transition-colors">Test Login</button>
      <button onClick={testTournaments} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">Test Tournaments</button>
      <pre className="mt-4 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white p-4 rounded overflow-auto border border-gray-300 dark:border-gray-700">{result}</pre>
    </div>
  );
}