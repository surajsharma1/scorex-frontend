import { useState, useEffect } from 'react';
import { FileText, Download, Search, RefreshCw, AlertCircle } from 'lucide-react';
import { adminAPI } from '../services/api';

interface Log {
  name: string;
  size: number;
  mtime: string;
}

export default function AdminLogsTable() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => { loadLogs(); }, []);

  const loadLogs = async () => {
    setRefreshing(true);
    try {
      setError(null);
      const res = await adminAPI.getLogs();
      setLogs(res.data.data || []);
    } catch (err: any) {
      console.error('Failed to load logs:', err);
      setError('Failed to fetch logs. Check backend connection.');
      setLogs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredLogs = logs.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase())
  );

  const downloadLog = async (filename: string) => {
    setDownloading(filename);
    try {
      const res = await adminAPI.downloadLog(filename);
      const blob = new Blob([res.data], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `scorex-${filename}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      setError(`Download failed for ${filename}`);
    } finally {
      setDownloading(null);
    }
  };

  const viewLog = async (filename: string) => {
    try {
      const res = await adminAPI.downloadLog(filename);
      const blob = new Blob([res.data], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 5000);
    } catch (err) {
      setError(`Cannot open ${filename}`);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#64748b,#475569)' }}>
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>System Logs</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{filteredLogs.length} log file{filteredLogs.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              placeholder="Search logs..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-xl text-sm w-56 focus:outline-none"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
          </div>
          <button
            onClick={loadLogs}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm disabled:opacity-60 transition-all"
            style={{ background: 'var(--accent)', color: '#000' }}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-xs opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Filename', 'Size', 'Last Modified', 'Actions'].map(h => (
                <th key={h} className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-16 text-center">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" style={{ color: 'var(--accent)' }} />
                  <p style={{ color: 'var(--text-muted)' }}>Loading logs…</p>
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-16 text-center">
                  <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" style={{ color: 'var(--text-muted)' }} />
                  <p style={{ color: 'var(--text-muted)' }}>{search ? `No logs matching "${search}"` : 'No log files found'}</p>
                </td>
              </tr>
            ) : filteredLogs.map((log, i) => (
              <tr key={i} className="transition-colors" style={{ borderBottom: '1px solid var(--border)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                onMouseLeave={e => (e.currentTarget.style.background = '')}>
                <td className="px-6 py-4">
                  <span className="font-mono text-sm" style={{ color: 'var(--text-primary)' }}>{log.name}</span>
                </td>
                <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-muted)' }}>{formatSize(log.size)}</td>
                <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                  {log.mtime ? new Date(log.mtime).toLocaleString() : '—'}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {/* View (open in new tab) */}
                    <button
                      onClick={() => viewLog(log.name)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                      title="Open in new tab"
                    >
                      View
                    </button>
                    {/* Download */}
                    <button
                      onClick={() => downloadLog(log.name)}
                      disabled={downloading === log.name}
                      className="p-1.5 rounded-lg transition-all disabled:opacity-50"
                      style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa' }}
                      title="Download log file"
                    >
                      {downloading === log.name
                        ? <RefreshCw className="w-4 h-4 animate-spin" />
                        : <Download className="w-4 h-4" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
