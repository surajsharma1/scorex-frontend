import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <h2 className="text-2xl mb-4">Dashboard</h2>
      <p>Welcome to your dashboard! Manage tournaments, teams, and overlays here.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-lg">Tournaments</h3>
          <p>View and manage tournaments.</p>
          <button onClick={() => navigate('/tournaments')} className="text-blue-500">Go to Tournaments</button>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-lg">Teams</h3>
          <p>Manage teams and players.</p>
          <button onClick={() => navigate('/teams')} className="text-blue-500">Go to Teams</button>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-lg">Overlays</h3>
          <p>Create live streaming overlays.</p>
          <button onClick={() => navigate('/overlay')} className="text-blue-500">Go to Overlays</button>
        </div>
      </div>
    </div>
  );
}