import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Download, Search, RefreshCw, AlertCircle, Clock } from 'lucide-react';
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

  const loadLogs = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      setError(null);
      const res = await adminAPI.getLogs();
      // Backend may return plain string[] or {name,size,mtime}[]
      const raw: any[] = res.data.data || [];
      const normalized: Log[] = raw.map(item =>
        typeof item === 'string'
          ? { name: item, size: 0, mtime: '' }
          : { name: item.name || item, size: item.size || 0, mtime: item.mtime || item.modified || '' }
      );
      setLogs(normalized);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch logs. Check backend server.');
      setLogs([]);
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const filteredLogs = logs.filter(l => l.name.toLowerCase().includes(search.toLowerCase()));

  const downloadLog = async (filename: string) => {
    try {
      const res = await adminAPI.downloadLog(filename);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url; link.download = `scorex-${filename}`;
      document.body.appendChild(link); link.click(); link.remove();
      window.URL.revokeObjectURL(url);
    } catch { setError('Download failed.'); }
  };

  const inp = { background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' };

  const formatSize = (bytes: number) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{filteredLogs.length} log files</p>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input placeholder="Search logs…" value={search} onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-xl text-sm w-52 focus:outline-none transition-all" style={inp}
              onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
          </div>
          <button onClick={() => loadLogs(true)} disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm text-white transition-all hover:scale-105 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Filename', 'Size', 'Last Modified', 'Actions'].map(h => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-16 text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" style={{ color: 'var(--accent)' }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading logs…</p>
              </td></tr>
            ) : error ? (
              <tr><td colSpan={4} className="px-6 py-16 text-center">
                <div className="flex flex-col items-center gap-3 max-w-xs mx-auto">
                  <AlertCircle className="w-10 h-10 text-red-400" />
                  <p className="font-bold text-sm text-red-400">Load Error</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{error}</p>
                  <button onClick={() => loadLogs()} className="px-4 py-2 rounded-xl font-bold text-sm text-white"
                    style={{ background: 'var(--accent)' }}>Retry</button>
                </div>
              </td></tr>
            ) : filteredLogs.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-16 text-center">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" style={{ color: 'var(--text-muted)' }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {search ? `No logs matching "${search}"` : 'No log files found'}
                </p>
              </td></tr>
            ) : filteredLogs.map((log, i) => (
              <tr key={i} className="transition-colors" style={{ borderBottom: '1px solid var(--border)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                    <span className="font-mono text-sm" style={{ color: 'var(--text-primary)' }}>{log.name}</span>
                  </div>
                </td>

                <td className="px-5 py-4 text-sm" style={{ color: 'var(--text-muted)' }}>{formatSize(log.size)}</td>

                <td className="px-5 py-4">
                  {log.mtime ? (
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(log.mtime).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  ) : <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>}
                </td>

                <td className="px-5 py-4">
                  <button onClick={() => downloadLog(log.name)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105"
                    style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)' }}>
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
