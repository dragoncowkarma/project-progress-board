import React, { useEffect } from 'react';

interface NotificationToastProps {
  message: { text: string; type: 'success' | 'error' } | null;
  onClear: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ message, onClear }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClear();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message, onClear]);

  if (!message) return null;

  return (
    <div className="toast-container">
      <div className={`toast ${message.type}`}>
        <span>{message.type === 'success' ? '✓' : '⚠️'}</span>
        <span>{message.text}</span>
      </div>
    </div>
  );
};
