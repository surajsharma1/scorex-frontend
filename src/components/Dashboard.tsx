export default function Dashboard() {
  return (
    <div className="p-6">
      <h2 className="text-2xl mb-4">Dashboard</h2>
      <p>Welcome to your dashboard! Manage tournaments, teams, and overlays here.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-lg">Tournaments</h3>
          <p>View and manage tournaments.</p>
          <a href="/tournaments" className="text-blue-500">Go to Tournaments</a>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-lg">Teams</h3>
          <p>Manage teams and players.</p>
          <a href="/teams" className="text-blue-500">Go to Teams</a>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-lg">Overlays</h3>
          <p>Create live streaming overlays.</p>
          <a href="/overlays" className="text-blue-500">Go to Overlays</a>
        </div>
      </div>
    </div>
  );
}