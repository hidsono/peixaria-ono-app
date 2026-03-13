"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface NotificationContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    return (
        <NotificationContext.Provider value={{ showToast }}>
            {children}
            <div style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                pointerEvents: 'none'
            }}>
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        style={{
                            padding: '12px 20px',
                            borderRadius: '8px',
                            backgroundColor: 
                                toast.type === 'success' ? '#4caf50' : 
                                toast.type === 'error' ? '#f44336' : 
                                toast.type === 'warning' ? '#ff9800' : '#2196f3',
                            color: 'white',
                            fontWeight: '600',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            animation: 'slideIn 0.3s ease forwards',
                            pointerEvents: 'auto'
                        }}
                    >
                        {toast.message}
                    </div>
                ))}
            </div>
            <style jsx global>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </NotificationContext.Provider>
    );
}

export function useNotification() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
}
