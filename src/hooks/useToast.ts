import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Toast } from '../components/Toast';

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error';
}

interface ToastContextType {
  addToast: (toast: { type: ToastMessage['type']; message: string; title?: string }) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback(({ type, message, title }: { type: ToastMessage['type']; message: string; title?: string }) => {
    const id = Math.random().toString(36).substr(2, 9);
    const displayMessage = title ? `${title}: ${message}` : message;
    setToasts(prev => [...prev, { id, message: displayMessage, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Fixed stacking container — bottom-right, newest on top (column-reverse)
  const toastContainer = React.createElement(
    'div',
    {
      style: {
        position: 'fixed',
        bottom: '1.25rem',
        right: '1rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column-reverse' as const,
        alignItems: 'flex-end',
        pointerEvents: 'none',
        maxHeight: 'calc(100vh - 2rem)',
        overflow: 'hidden',
      }
    },
    toasts.map((toast) =>
      React.createElement(Toast, {
        key: toast.id,
        msg: toast.message,
        type: toast.type as 'success' | 'error',
        onClose: () => removeToast(toast.id),
      })
    )
  );

  return React.createElement(
    ToastContext.Provider,
    { value: { addToast } },
    children,
    typeof document !== 'undefined'
      ? createPortal(toastContainer, document.body)
      : toastContainer
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
