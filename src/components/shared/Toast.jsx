import React, { useEffect } from 'react';

const Toast = ({ message, isOpen, duration = 2500, onClose, type = 'info' }) => {
  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => {
      onClose && onClose();
    }, duration);
    return () => clearTimeout(t);
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  const typeClasses = {
    info: 'bg-blue-600',
    success: 'bg-emerald-600',
    error: 'bg-red-600',
    warning: 'bg-yellow-500',
  };

  return (
    <div className="fixed bottom-6 left-1/2 z-50 transform -translate-x-1/2 flex items-center justify-center">
      <div className={`px-6 py-3 rounded-xl shadow-lg text-white font-semibold transition-all duration-300 ${typeClasses[type] || typeClasses.info}`} role="status">
        {message}
      </div>
    </div>
  );
};

export default Toast;
