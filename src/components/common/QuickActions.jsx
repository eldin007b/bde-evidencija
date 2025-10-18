import React from 'react';

const QuickActions = ({ 
  onApproveAll, 
  onRejectAll, 
  onExportData, 
  onRefreshAll,
  onClearHistory,
  pendingCount = 0,
  loading = false 
}) => {
  return (
    <div style={{
      background: '#ffffff',
      padding: '20px',
      borderRadius: '12px',
      border: '1px solid #e0e0e0',
      marginBottom: '24px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <span style={{ fontSize: '20px', marginRight: '8px' }}>⚡</span>
        <h3 style={{ 
          margin: 0, 
          fontSize: '18px', 
          fontWeight: 'bold',
          color: '#333'
        }}>
          Brze Akcije
        </h3>
        {pendingCount > 0 && (
          <span style={{
            background: '#ff9800',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 'bold',
            marginLeft: '8px'
          }}>
            {pendingCount} pending
          </span>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '12px'
      }}>
        <button
          onClick={onApproveAll}
          disabled={loading || pendingCount === 0}
          style={{
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: loading || pendingCount === 0 ? 'not-allowed' : 'pointer',
            opacity: loading || pendingCount === 0 ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          ✅ Odobri sve
        </button>

        <button
          onClick={onRejectAll}
          disabled={loading || pendingCount === 0}
          style={{
            background: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: loading || pendingCount === 0 ? 'not-allowed' : 'pointer',
            opacity: loading || pendingCount === 0 ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          ❌ Odbaci sve
        </button>

        <button
          onClick={onExportData}
          disabled={loading}
          style={{
            background: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          📊 Export
        </button>

        <button
          onClick={onRefreshAll}
          disabled={loading}
          style={{
            background: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          🔄 Refresh
        </button>

        {onClearHistory && (
          <button
            onClick={onClearHistory}
            disabled={loading}
            style={{
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            🗑️ Čisto
          </button>
        )}
      </div>
    </div>
  );
};

export default QuickActions;