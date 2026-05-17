import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const ModernModal = ({ 
  open, 
  title, 
  children, 
  loading, 
  onSubmit, 
  onClose, 
  submitLabel = 'Sačuvaj', 
  closeLabel = 'Otkaži',
  showActions = true 
}) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      // Save current scroll position
      const scrollY = window.scrollY;
      
      // Lock body
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
      document.body.style.width = '100%';
      
      return () => {
        // Restore scroll position
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflow = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [open]);

  if (!open) return null;
  
  return createPortal(
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999]"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999
      }}
    >
      <div 
        className="absolute inset-0 flex items-start justify-center p-2 sm:p-4 pt-4 sm:pt-8"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: '2rem'
        }}
      >
      <div className="bg-white/10 backdrop-blur-md rounded-2xl w-full max-w-md sm:max-w-3xl max-h-[90vh] sm:max-h-[92vh] overflow-hidden shadow-2xl border border-white/20 animate-in fade-in-0 zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 flex-shrink-0">
          <h3 className="text-lg sm:text-xl font-bold text-white">
            {title}
          </h3>
          <button 
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-200 text-white hover:scale-110"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={e => { e.preventDefault(); onSubmit && onSubmit(); }} className="flex flex-col max-h-full">
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0 max-h-[calc(90vh-140px)] sm:max-h-[calc(92vh-140px)]">
            {children}
          </div>
          
          {/* Actions */}
          {showActions && (
            <div className="flex justify-end gap-3 p-4 sm:p-6 border-t border-white/10 bg-black/10 flex-shrink-0">
              <button 
                type="button" 
                onClick={onClose} 
                disabled={loading}
                className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors duration-200 border border-white/20 disabled:opacity-50"
              >
                {closeLabel}
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {submitLabel}
              </button>
            </div>
          )}
        </form>
      </div>
      </div>
    </div>,
    document.body
  );
};

export default ModernModal;