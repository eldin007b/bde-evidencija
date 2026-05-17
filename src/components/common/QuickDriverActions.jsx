import React from 'react';

const QuickDriverActions = ({ 
  selectedDriver,
  onQuickEntry,
  onFrequentRoutes,
  onTodaysSummary,
  loading = false 
}) => {
  const frequentRoutes = [
    { name: 'Centar → Aerodrom', distance: '15km' },
    { name: 'Banja Luka → Prijedor', distance: '45km' },
    { name: 'Gradiška → Novi Grad', distance: '30km' }
  ];

  return (
    <div style={{
      background: '#ffffff',
      padding: '16px',
      borderRadius: '12px',
      border: '1px solid #e0e0e0',
      marginBottom: '20px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <span style={{ fontSize: '18px', marginRight: '8px' }}>🚀</span>
        <h3 style={{ 
          margin: 0, 
          fontSize: '16px', 
          fontWeight: 'bold',
          color: '#333'
        }}>
          Brze Akcije za {selectedDriver || 'Vozač'}
        </h3>
      </div>

      {/* Quick Entry Button */}
      <button
        onClick={onQuickEntry}
        disabled={loading || !selectedDriver}
        style={{
          width: '100%',
          background: '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '14px',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: loading || !selectedDriver ? 'not-allowed' : 'pointer',
          opacity: loading || !selectedDriver ? 0.6 : 1,
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
      >
        ⚡ Brz unos vožnje
      </button>

      {/* Frequent Routes */}
      <div style={{ marginBottom: '12px' }}>
        <h4 style={{ 
          fontSize: '14px', 
          fontWeight: 'bold',
          color: '#666',
          marginBottom: '8px',
          margin: 0
        }}>
          Česte rute:
        </h4>
        <div style={{
          display: 'grid',
          gap: '6px'
        }}>
          {frequentRoutes.map((route, index) => (
            <button
              key={index}
              onClick={() => onFrequentRoutes(route)}
              disabled={loading || !selectedDriver}
              style={{
                background: '#f8f9fa',
                border: '1px solid #e9ecef',
                borderRadius: '6px',
                padding: '8px 12px',
                fontSize: '13px',
                cursor: loading || !selectedDriver ? 'not-allowed' : 'pointer',
                opacity: loading || !selectedDriver ? 0.6 : 1,
                textAlign: 'left',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>{route.name}</span>
              <span style={{ color: '#666', fontSize: '12px' }}>{route.distance}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Today's Summary */}
      <button
        onClick={onTodaysSummary}
        disabled={loading || !selectedDriver}
        style={{
          width: '100%',
          background: '#17a2b8',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '10px',
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: loading || !selectedDriver ? 'not-allowed' : 'pointer',
          opacity: loading || !selectedDriver ? 0.6 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px'
        }}
      >
        📊 Pregled dana
      </button>
    </div>
  );
};

export default QuickDriverActions;