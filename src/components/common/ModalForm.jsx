import React from 'react';

const ModalForm = ({ open, title, children, loading, onSubmit, onClose, submitLabel = 'Sačuvaj', closeLabel = 'Otkaži' }) => {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, minWidth: 320, boxShadow: '0 2px 16px rgba(0,0,0,0.15)' }}>
        <h3 style={{ marginBottom: 18, textAlign: 'center' }}>{title}</h3>
        <form onSubmit={e => { e.preventDefault(); onSubmit && onSubmit(); }}>
          {children}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 18 }}>
            <button type="submit" disabled={loading} style={{ background: '#007bff', color: '#fff', borderRadius: 8, padding: '10px 18px', fontWeight: 'bold', border: 'none' }}>
              {loading ? '...' : submitLabel}
            </button>
            <button type="button" onClick={onClose} style={{ background: '#eee', color: '#333', borderRadius: 8, padding: '10px 18px', fontWeight: 'bold', border: 'none' }}>{closeLabel}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalForm;
