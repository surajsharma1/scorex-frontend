import React, { useState, useEffect } from 'react';
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
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setError(null);
      const res = await adminAPI.getLogs();
      const logData = res.data.data || [];
      setLogs(logData);
    } catch (err: any) {
      console.error('Failed to load logs:', err);
      setError('Failed to fetch logs. Check backend server.');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };


  const filteredLogs = logs.filter(l => 
    l.name.toLowerCase().includes(search.toLowerCase())
  );

  const downloadLog = async (filename: string) => {
    try {
      const res = await adminAPI.downloadLog(filename);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `scorex-${filename}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      setError('Download failed. Check console.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-2xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>System Logs</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{filteredLogs.length} log files</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-xl text-sm w-64 focus:outline-none"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
          </div>
          <button 
            onClick={loadLogs}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm bg-blue-500 text-white shadow-lg hover:scale-105"
          >
            <RefreshCw className="w-4 h-4 animate-spin" />
            Refresh
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Filename</th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Size</th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Modified</th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-4 p-8 rounded-2xl" style={{ background: 'var(--bg-elevated)' }}>
                    <RefreshCw className="w-12 h-12 animate-spin" style={{ color: 'var(--accent)' }} />
                    <div style={{ color: 'var(--text-muted)' }}>
                      <p className="text-lg font-bold">Loading logs...</p>
                      <p className="text-sm">Fetching from server...</p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={4} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-4 p-8 rounded-2xl" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                    <AlertCircle className="w-12 h-12" style={{ color: '#ef4444' }} />
                    <div>
                      <p className="text-lg font-bold text-red-400">Load Error</p>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{error}</p>
                      <button onClick={loadLogs} className="mt-4 px-4 py-2 rounded-xl font-bold" style={{ background: 'var(--accent)', color: 'white' }}>
                        Retry
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-4 p-8 rounded-2xl" style={{ background: 'var(--bg-elevated)' }}>
                    <FileText className="w-12 h-12 opacity-40" style={{ color: 'var(--text-muted)' }} />
                    <div style={{ color: 'var(--text-muted)' }}>
                      <p className="text-lg font-bold">No logs found</p>
                      <p className="text-sm">{search ? `No matching "${search}"` : 'Server logs directory empty'}</p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (

              filteredLogs.map((log, index) => (
                <tr key={index} className="hover:bg-[var(--bg-hover)] transition-colors group">
                  <td className="px-6 py-4 font-mono text-sm truncate max-w-xs group-hover:font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {log.name}
                  </td>
                  <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                    {(log.size / 1024).toFixed(1)} KB
                  </td>
                  <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                    {log.mtime ? new Date(log.mtime).toLocaleString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => downloadLog(log.name)}
                      className="p-2 rounded-xl hover:bg-[var(--accent)/0.1] group-hover:scale-105 transition-all text-blue-400 hover:text-blue-500"
                      title="Download Log (Backend endpoint needed)"
                      disabled={!log.name.includes('.log')}
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </td>
                </tr>

              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

