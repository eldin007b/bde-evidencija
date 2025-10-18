import React from 'react';

const ActionButton = ({ loading, children, bgColor, style, ...props }) => (
  <button {...props} disabled={loading} style={{
    borderRadius: 12,
    padding: '16px 18px',
    background: bgColor || '#1769aa',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: loading ? 0.7 : 1,
    cursor: loading ? 'not-allowed' : 'pointer',
    ...style
  }}>
    {loading ? <span className="spinner" /> : children}
  </button>
);

export default ActionButton;
