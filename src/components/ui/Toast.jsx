/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

const TOAST_DURATION = 3000;
const TOAST_TYPES = {
  success: { icon: CheckCircle2, bg: 'bg-white ring-1 ring-emerald-200', text: 'text-emerald-800', iconColor: 'text-emerald-500' },
  error: { icon: XCircle, bg: 'bg-white ring-1 ring-rose-200', text: 'text-rose-800', iconColor: 'text-rose-500' },
  warning: { icon: AlertCircle, bg: 'bg-white ring-1 ring-amber-200', text: 'text-amber-800', iconColor: 'text-amber-500' },
  info: { icon: Info, bg: 'bg-white ring-1 ring-pink-200', text: 'text-pink-800', iconColor: 'text-pink-500' },
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = TOAST_DURATION) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, duration }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
    info: (msg, dur) => addToast(msg, 'info', dur),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(t => {
          const config = TOAST_TYPES[t.type];
          const Icon = config.icon;
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-xl shadow-pink-500/10 animate-slide-in-right ${config.bg}`}
              style={{ animation: 'slideInRight 0.3s ease-out' }}
            >
              <Icon className={`shrink-0 mt-0.5 ${config.iconColor}`} size={20} />
              <p className={`flex-1 text-sm font-medium ${config.text}`}>{t.message}</p>
              <button onClick={() => removeToast(t.id)} className={`shrink-0 hover:opacity-70 transition ${config.text}`}>
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </ToastContext.Provider>
  );
};
