import React, { createContext, useState, useContext, useCallback } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();
export const useToast = () => useContext(ToastContext);

const toastStyles = {
    success: {
        container: 'bg-[#0d1f0f] border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)]',
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
        text: 'text-emerald-100',
        bar: 'bg-emerald-500',
    },
    error: {
        container: 'bg-[#1f0d0d] border border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.15)]',
        icon: <XCircle className="w-4 h-4 text-red-400 shrink-0" />,
        text: 'text-red-100',
        bar: 'bg-red-500',
    },
    info: {
        container: 'bg-[#0d1420] border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.15)]',
        icon: <Info className="w-4 h-4 text-cyan-400 shrink-0" />,
        text: 'text-cyan-100',
        bar: 'bg-cyan-500',
    },
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', duration = 3500) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type, duration }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
    }, []);

    const toast = {
        success: (msg) => addToast(msg, 'success'),
        error: (msg) => addToast(msg, 'error'),
        info: (msg) => addToast(msg, 'info'),
    };

    const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id));

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 max-w-[340px] w-full pointer-events-none">
                {toasts.map(t => {
                    const s = toastStyles[t.type];
                    return (
                        <div
                            key={t.id}
                            style={{ animation: 'toastIn 0.25s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
                            className={`relative flex items-start gap-3 px-4 py-3 rounded-xl pointer-events-auto overflow-hidden backdrop-blur-sm ${s.container}`}
                        >
                            <div className={`absolute bottom-0 left-0 h-[2px] ${s.bar}`}
                                style={{ animation: `toastBar ${t.duration}ms linear forwards` }} />
                            {s.icon}
                            <p className={`text-sm font-medium flex-grow leading-snug ${s.text}`}>{t.message}</p>
                            <button
                                onClick={() => remove(t.id)}
                                className="text-white/30 hover:text-white/70 transition-colors mt-0.5 shrink-0"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    );
                })}
            </div>
            <style>{`
                @keyframes toastIn {
                    from { opacity: 0; transform: translateX(20px) scale(0.95); }
                    to   { opacity: 1; transform: translateX(0) scale(1); }
                }
                @keyframes toastBar {
                    from { width: 100%; }
                    to   { width: 0%; }
                }
            `}</style>
        </ToastContext.Provider>
    );
};