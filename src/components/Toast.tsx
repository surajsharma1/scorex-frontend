import React from 'react';

interface ToastProps {
  msg: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ msg, type, onClose }) => (
  <div className="fixed top-20 right-4 z-50 p-4 rounded-2xl shadow-2xl animate-in slide-in-from-right fade-in duration-300 max-w-sm"
    style={{
      background: type === 'success' ? 'rgba(34,197,94,0.95)' : 'rgba(239,68,68,0.95)',
      color: 'white',
      backdropFilter: 'blur(10px)',
    }}>
    <div className="flex items-center justify-between">
      <span>{msg}</span>
      <button onClick={onClose} className="ml-4 p-1 hover:opacity-70">
        ×
      </button>
    </div>
  </div>
);

