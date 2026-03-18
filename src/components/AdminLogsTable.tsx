import React, { useState, useEffect } from 'react';
import { FileText, Download, Search, RefreshCw } from 'lucide-react';
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

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const res = await adminAPI.getLogs();
      setLogs(res.data.data || []);
    } catch (err) {
      console.error('Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(l => 
    l.name.toLowerCase().includes(search.toLowerCase())
  );

  const downloadLog = (filename: string) => {
    // Backend can add /admin/logs/:filename for download
    window.open(`/api/v1/admin/logs/${filename}`, '_blank');
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
                <td colSpan={4} className="px-6 py-12 text-center" style={{ color: 'var(--text-muted)' }}>
                  Loading logs...
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center" style={{ color: 'var(--text-muted)' }}>
                  No logs found
                </td>
              </tr>
            ) : (
              filteredLogs.map((log, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono text-sm truncate max-w-xs" style={{ color: 'var(--text-primary)' }}>
                    {log.name}
                  </td>
                  <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                    {(log.size / 1024).toFixed(1)} KB
                  </td>
                  <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                    {new Date(log.mtime).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => downloadLog(log.name)}
                      className="p-1.5 rounded-lg hover:bg-blue-200 text-blue-500 hover:text-blue-700"
                      title="View Log"
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

