
import React from 'react';

export default function ModernModal({ visible, onClose, children, title, icon }) {
  if (!visible) return null;
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        backdropFilter: 'blur(8px)',
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          borderRadius: 20,
          background: 'linear-gradient(180deg, #fff 0%, #f8f9fa 100%)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 20,
          }}
        >
          {icon}
          <span style={{ fontSize: 20, fontWeight: 'bold', color: '#333', flex: 1, textAlign: 'center', margin: '0 10px' }}>{title}</span>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: 16, background: '#f5f5f5', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            aria-label="Zatvori modal"
          >
            <span style={{ fontSize: 24, color: '#999' }}>×</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
