import React from 'react';

interface PageLoaderProps {
  /** Optional label shown below the spinner */
  label?: string;
  /** Full-screen mode (default: false — fills parent min-height) */
  fullScreen?: boolean;
}

/**
 * PageLoader — the single shared loading spinner for ScoreX.
 *
 * Uses a CSS keyframe animation defined in index.css (@keyframes spin)
 * with hardware-accelerated will-change:transform. Safe to use inside
 * any component — does NOT depend on CSS variables resolving first.
 *
 * Usage:
 *   if (loading) return <PageLoader />;
 *   if (loading) return <PageLoader label="Loading match..." fullScreen />;
 */
const PageLoader: React.FC<PageLoaderProps> = ({ label, fullScreen = false }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem',
      minHeight: fullScreen ? '100vh' : '60vh',
      width: '100%',
      background: fullScreen ? '#030305' : 'transparent',
    }}>
      {/* Two-ring spinner — outer accent ring + inner glow ring */}
      <div style={{ position: 'relative', width: '2.75rem', height: '2.75rem' }}>
        {/* Outer spinning ring */}
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: '50%',
          border: '3px solid rgba(34,197,94,0.15)',
          borderTopColor: '#22c55e',
          borderRightColor: '#22c55e',
          animation: 'scorex-spin 0.75s linear infinite',
          willChange: 'transform',
        }} />
        {/* Inner glow dot */}
        <div style={{
          position: 'absolute', inset: '30%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34,197,94,0.5) 0%, transparent 70%)',
          animation: 'scorex-pulse 1.5s ease-in-out infinite',
        }} />
      </div>

      {label && (
        <p style={{
          fontSize: '0.8125rem',
          color: '#475569',
          letterSpacing: '0.04em',
          fontWeight: 500,
          margin: 0,
        }}>
          {label}
        </p>
      )}

      <style>{`
        @keyframes scorex-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes scorex-pulse {
          0%, 100% { opacity: 0.4; transform: scale(0.8); }
          50%       { opacity: 1;   transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
};

export default PageLoader;
