import React from 'react';

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
  if (!open) return null;
  
  return (
    <div style={{
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)', 
      backdropFilter: 'blur(10px)',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      zIndex: 1000,
      animation: 'fadeIn 0.3s ease'
    }}>
      <div style={{ 
        background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px', 
        padding: '32px', 
        minWidth: '400px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        color: 'var(--text-on-dark, #f1f5f9)',
        animation: 'scaleIn 0.3s ease'
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          paddingBottom: '16px'
        }}>
          <h3 style={{ 
            margin: 0, 
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: 'var(--text-on-dark, #f1f5f9)',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            {title}
          </h3>
          <button 
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-on-dark, #f1f5f9)',
              fontSize: '18px',
              fontWeight: 'bold',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(5px)'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
              e.target.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              e.target.style.transform = 'scale(1)';
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <form onSubmit={e => { e.preventDefault(); onSubmit && onSubmit(); }}>
          <div style={{ marginBottom: showActions ? '24px' : '0' }}>
            {children}
          </div>
          
          {/* Actions */}
          {showActions && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: '12px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              paddingTop: '16px'
            }}>
              <button 
                type="button" 
                onClick={onClose} 
                style={{ 
                  background: 'rgba(255, 255, 255, 0.1)', 
                  color: 'var(--text-on-dark, #f1f5f9)', 
                  borderRadius: '12px', 
                  padding: '12px 24px', 
                  fontWeight: 'bold', 
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(5px)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                {closeLabel}
              </button>
              
              {onSubmit && (
                <button 
                  type="submit" 
                  disabled={loading} 
                  style={{ 
                    background: loading ? 'rgba(68, 202, 223, 0.5)' : 'linear-gradient(145deg, #44cadf 0%, #22d3ee 100%)', 
                    color: '#fff', 
                    borderRadius: '12px', 
                    padding: '12px 24px', 
                    fontWeight: 'bold', 
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: loading ? 'none' : '0 4px 15px rgba(68, 202, 223, 0.3)',
                    opacity: loading ? 0.7 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 6px 20px rgba(68, 202, 223, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 15px rgba(68, 202, 223, 0.3)';
                    }
                  }}
                >
                  {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTop: '2px solid #fff',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      Čuvanje...
                    </div>
                  ) : submitLabel}
                </button>
              )}
            </div>
          )}
        </form>
      </div>
      
      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from { 
            opacity: 0; 
            transform: scale(0.9) translateY(20px); 
          }
          to { 
            opacity: 1; 
            transform: scale(1) translateY(0); 
          }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ModernModal;