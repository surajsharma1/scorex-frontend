import React from 'react';

interface StatusBadgeProps {
  status: string;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '', style, children }) => {
  const map: Record<string, string> = {
    upcoming: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    live: 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse',
    completed: 'bg-green-500/20 text-green-400 border-green-500/30',
    ongoing: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  };

  return (
    <span 
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border font-semibold transition-all ${map[status] || map['upcoming']} ${className}`}
      style={style}
    >
      {children || (status === 'live' ? '● LIVE' : status.toUpperCase())}
    </span>
  );
};

export default StatusBadge;

