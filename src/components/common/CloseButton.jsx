import React from 'react';
import { useNavigate } from 'react-router-dom';

const CloseButton = ({ style = {} }) => {
  const navigate = useNavigate();
  console.log('CloseButton is rendering!');

  const handleClose = () => {
    console.log('CloseButton clicked!');
    navigate('/');
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'flex-start',
      marginBottom: '10px',
      marginTop: '-10px',
      marginRight: '-10px',
      ...style
    }}>
      <button
        onClick={handleClose}
        style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(15px)',
          border: '2px solid rgba(255, 255, 255, 0.8)',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          color: '#2c3e50',
          fontWeight: '900',
          transition: 'all 0.3s ease',
          fontFamily: 'Arial, sans-serif'
        }}
        onMouseOver={(e) => {
          e.target.style.transform = 'scale(1.1)';
          e.target.style.background = 'rgba(231, 76, 60, 0.95)';
          e.target.style.color = 'white';
          e.target.style.boxShadow = '0 8px 25px rgba(231, 76, 60, 0.4)';
        }}
        onMouseOut={(e) => {
          e.target.style.transform = 'scale(1)';
          e.target.style.background = 'rgba(255, 255, 255, 0.95)';
          e.target.style.color = '#2c3e50';
          e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';
        }}
        aria-label="Povratak na početnu"
        title="Povratak na početnu"
      >
        ×
      </button>
    </div>
  );
};

export default CloseButton;