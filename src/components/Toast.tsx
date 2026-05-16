import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';

interface ToastProps {
  msg: string;
  type: 'success' | 'error';
  onClose: () => void;
  index?: number;
}

export const Toast: React.FC<ToastProps> = ({ msg, type, onClose }) => {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setLeaving(true);
    setTimeout(onClose, 300);
  };

  const isSuccess = type === 'success';

  // Parse "Title: body" format that addToast produces
  const colonIdx = msg.indexOf(': ');
  const hasTitle = colonIdx > 0 && colonIdx < 45;
  const title = hasTitle ? msg.slice(0, colonIdx) : (isSuccess ? 'Success' : 'Error');
  const body  = hasTitle ? msg.slice(colonIdx + 2) : msg;

  return (
    <div style={{
      transform: leaving
        ? 'translateX(calc(100% + 1.5rem))'
        : visible
        ? 'translateX(0)'
        : 'translateX(calc(100% + 1.5rem))',
      opacity: leaving ? 0 : visible ? 1 : 0,
      transition: 'transform 0.38s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease',
      marginBottom: '0.55rem',
      pointerEvents: 'all',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        padding: '0.875rem 1rem 1.125rem',
        borderRadius: '0.875rem',
        minWidth: '270px',
        maxWidth: '340px',
        background: 'var(--bg-elevated, #13131c)',
        border: `1px solid ${isSuccess ? 'rgba(34,197,94,0.22)' : 'rgba(239,68,68,0.22)'}`,
        boxShadow: '0 12px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)',
        backdropFilter: 'blur(24px)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Left accent stripe */}
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px',
          background: isSuccess
            ? 'linear-gradient(180deg,#22c55e,#10b981)'
            : 'linear-gradient(180deg,#ef4444,#dc2626)',
        }} />

        {/* Icon bubble */}
        <div style={{
          flexShrink: 0, width: '2rem', height: '2rem', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: isSuccess ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
          border: `1px solid ${isSuccess ? 'rgba(34,197,94,0.22)' : 'rgba(239,68,68,0.22)'}`,
          marginLeft: '0.25rem', marginTop: '0.05rem',
        }}>
          {isSuccess
            ? <CheckCircle2 size={13} color="#22c55e" />
            : <XCircle     size={13} color="#ef4444" />}
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.025em',
            color: isSuccess ? '#4ade80' : '#f87171',
            marginBottom: '0.18rem', lineHeight: 1.3, margin: '0 0 0.18rem',
          }}>{title}</p>
          <p style={{
            fontSize: '0.8125rem', color: 'var(--text-secondary,#94a3b8)',
            lineHeight: 1.45, wordBreak: 'break-word', margin: 0,
          }}>{body}</p>
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          style={{
            flexShrink: 0, width: '1.4rem', height: '1.4rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: '50%', border: 'none', background: 'transparent',
            color: 'var(--text-muted,#475569)', cursor: 'pointer',
            transition: 'background 0.15s, color 0.15s', padding: 0,
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.09)';
            (e.currentTarget as HTMLElement).style.color = 'var(--text-primary,#fff)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
            (e.currentTarget as HTMLElement).style.color = 'var(--text-muted,#475569)';
          }}
        ><X size={11} /></button>

        {/* Countdown progress bar */}
        <ProgressBar isSuccess={isSuccess} />
      </div>
    </div>
  );
};

const ProgressBar: React.FC<{ isSuccess: boolean }> = ({ isSuccess }) => {
  const [width, setWidth] = useState(100);
  useEffect(() => {
    const start = Date.now();
    const dur = 3850;
    let raf: number;
    const tick = () => {
      const pct = Math.max(0, 100 - ((Date.now() - start) / dur) * 100);
      setWidth(pct);
      if (pct > 0) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, height: '2.5px',
      background: 'rgba(255,255,255,0.04)',
    }}>
      <div style={{
        height: '100%', width: `${width}%`,
        background: isSuccess
          ? 'linear-gradient(90deg,#22c55e,#10b981)'
          : 'linear-gradient(90deg,#ef4444,#dc2626)',
        transition: 'width 0.08s linear',
      }} />
    </div>
  );
};
