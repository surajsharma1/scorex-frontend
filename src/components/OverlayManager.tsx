import { useState, useEffect, useRef, useCallback } from 'react';
import { Eye, Copy, RefreshCw, X, ShieldAlert, Timer, MonitorPlay } from 'lucide-react';
import { overlayAPI } from '../services/api';
import { getBackendBaseUrl, getApiBaseUrl } from '../services/env';
import { useAuth } from '../App';
import { useToast } from '../hooks/useToast';
import { usePreviewScale } from '../hooks/usePreviewScale';

const getTemplateFilename = (t: any): string => {
  if (t.file) return t.file;
  if (t.url) return t.url.split('/').pop() || '';
  if (t.template) return t.template.split('/').pop() || '';
  return `${t.id || 'default'}.html`;
};

const CountdownBadge = ({ expiresAt, overlayId, onExpire }: { expiresAt: string, overlayId: string, onExpire: (id: string) => void }) => {
  const [timeLeft, setTimeLeft] = useState(() => new Date(expiresAt).getTime() - Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = new Date(expiresAt).getTime() - Date.now();
      if (remaining <= 0) {
        clearInterval(timer);
        setTimeLeft(0);
        onExpire(overlayId); // Kills the URL visually and logically
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [expiresAt, overlayId, onExpire]);

  if (timeLeft <= 0) return <span className="text-red-500 font-bold ml-auto text-xs flex items-center gap-1"><X className="w-3 h-3"/> DEAD URL</span>;

  const mins = Math.floor(timeLeft / 60000);
  const secs = Math.floor((timeLeft % 60000) / 1000);
  return (
    <span className="ml-auto text-xs font-mono font-bold px-2 py-1 bg-yellow-500/10 text-yellow-500 rounded flex items-center gap-1">
      <Timer className="w-3 h-3"/> {mins}:{secs.toString().padStart(2, '0')}
    </span>
  );
};

import type { Match } from './types';

export default function OverlayManager({ tournamentId, matches }: { tournamentId?: string; matches?: Match[] }) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [overlays, setOverlays] = useState<any[]>([]);
  const [selectedOverlay, setSelectedOverlay] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const { idealScale } = usePreviewScale({ containerRef });

  useEffect(() => {
    const fetchOverlays = async () => {
      try {
        const res = await overlayAPI.getOverlays(tournamentId);
        setOverlays(res.data?.data || []);
      } catch (e) {
        console.error(e);
        addToast({ type: 'error', message: 'Failed to load overlays' });
      } finally {
        setLoading(false);
      }
    };
    fetchOverlays();
  }, [tournamentId, addToast]);

  const handleOverlayExpiration = useCallback((expiredOverlayId: string) => {
    if (selectedOverlay && selectedOverlay.includes(expiredOverlayId)) {
      setSelectedOverlay(null); 
      addToast({ type: 'error', title: 'Security Timeout', message: 'The overlay URL has expired to prevent unauthorized access.' });
    }
  }, [selectedOverlay, addToast]);

  const generateSecureUrl = (overlay: any) => {
    const filename = getTemplateFilename(overlay.template);
    // Add expiration timestamp to the URL to ensure it dies securely on the backend as well
    const expTime = new Date(overlay.expiresAt).getTime();
    return `${getBackendBaseUrl()}/overlays/${filename}?tournament=${tournamentId || overlay.tournamentId}&exp=${expTime}`;
  };

  if (loading) return <div className="p-8 text-center"><RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500"/></div>;

  return (
    <div className="space-y-6">
      {overlays.length === 0 ? (
        <div className="p-8 text-center bg-gray-900 border border-gray-800 rounded-2xl">
          <ShieldAlert className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No Active Overlays</h3>
          <p className="text-gray-400">Upgrade your membership or create a new overlay to view them here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List */}
          <div className="space-y-3 lg:col-span-1 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
            {overlays.map(overlay => {
              const secureUrl = generateSecureUrl(overlay);
              return (
                <div key={overlay._id} className="p-4 bg-gray-900 border border-gray-800 rounded-xl hover:border-blue-500/50 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-white">{overlay.name}</h4>
                    <CountdownBadge expiresAt={overlay.expiresAt} overlayId={overlay._id} onExpire={handleOverlayExpiration} />
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <button 
                      onClick={() => setSelectedOverlay(secureUrl)}
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-all flex justify-center items-center gap-2"
                    >
                      <Eye className="w-4 h-4" /> Preview
                    </button>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(secureUrl);
                        addToast({ type: 'success', message: 'Secure URL copied to clipboard!' });
                      }}
                      className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 rounded-lg text-sm font-bold transition-all flex justify-center items-center gap-2"
                    >
                      <Copy className="w-4 h-4" /> Copy URL
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Secure Preview Area */}
          <div className="lg:col-span-2">
            <div 
              ref={containerRef}
              className="w-full aspect-video bg-black rounded-2xl border border-gray-800 relative overflow-hidden flex items-center justify-center"
              style={{ backgroundImage: 'radial-gradient(#1a1a24 1px, transparent 1px)', backgroundSize: '20px 20px' }}
            >
              {selectedOverlay ? (
                <iframe
                  src={selectedOverlay}
                  className="absolute pointer-events-none border-none"
                  style={{
                    width: '1920px',
                    height: '1080px',
                    transform: `scale(${idealScale})`,
                    transformOrigin: 'center center'
                  }}
                  sandbox="allow-scripts allow-same-origin"
                />
              ) : (
                <div className="text-gray-500 flex flex-col items-center">
                  <MonitorPlay className="w-12 h-12 mb-3 opacity-50" />
                  <p>Select an active overlay to preview securely</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}