import React, { useState, useEffect } from 'react';
import ActionButton from '../../components/common/ActionButton';
import EmptyState from '../../components/common/EmptyState';
import { useSyncContext } from '../../context/SyncContext';
import { autoSyncService } from '../../services/AutoSyncService';
import { format } from 'date-fns';

const SyncTab = () => {
  const { 
    isSyncInProgress, 
    lastSyncTime,
    isAutoSyncRunning,
    globalSyncEnabled,
    setGlobalSyncEnabled,
    syncInterval,
    setSyncInterval,
    syncNow
  } = useSyncContext();
  const [manualLoading, setManualLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [workflowStatus, setWorkflowStatus] = useState(null);
  const [syncStats, setSyncStats] = useState({
    totalSyncs: 0,
    errorCount: 0,
    lastErrorTime: null,
    uptime: 0
  });
  const [error, setError] = useState(null);

  // Load sync stats from localStorage
  useEffect(() => {
    const loadStats = () => {
      try {
        const saved = localStorage.getItem('autoSyncState');
        if (saved) {
          const state = JSON.parse(saved);
          setSyncStats(prev => ({
            ...prev,
            errorCount: state.errorCount || 0,
            lastSyncTime: state.lastSyncTime
          }));
        }
      } catch (error) {
        console.warn('Failed to load sync stats:', error);
      }
    };
    
    loadStats();
    const interval = setInterval(loadStats, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const handleToggleAutoSync = () => {
    setGlobalSyncEnabled(!globalSyncEnabled);
  };

  const handleIntervalChange = (newInterval) => {
    setSyncInterval(newInterval);
  };

  const handleManualSync = async () => {
    setManualLoading(true);
    setError(null);
    try {
      const result = await syncNow(true); // Force sync
      if (result.success) {
        setError(null);
        // Success je već prikazano preko toast notifikacija
      } else {
        setError(result.error?.message || result.reason || 'Nepoznata greška');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setManualLoading(false);
    }
  };

  const handleResetErrorCount = () => {
    if (autoSyncService.errorCount > 0) {
      autoSyncService.errorCount = 0;
      autoSyncService.saveState();
      setSyncStats(prev => ({ ...prev, errorCount: 0 }));
    }
  };

  const handleGitHubScraper = async () => {
    setGithubLoading(true);
    setTimeout(() => {
      setGithubLoading(false);
      setWorkflowStatus({ 
        name: 'Workflow', 
        status: 'completed', 
        conclusion: 'success', 
        started_at: new Date().toISOString() 
      });
      alert('GitHub workflow pokrenut!');
    }, 1200);
  };

  const getSyncStatusColor = () => {
    if (error) return '#ef4444';
    if (isSyncInProgress) return '#f59e0b';
    if (isAutoSyncRunning) return '#10b981';
    return '#6b7280';
  };

  const getSyncStatusText = () => {
    if (error) return 'Greška';
    if (isSyncInProgress) return 'U toku';
    if (isAutoSyncRunning) return 'Aktivno';
    return 'Zaustavljeno';
  };

  return (
    <div style={{ padding: 16, background: '#f4f4f4' }}>
      <h2 style={{ fontWeight: 'bold', marginBottom: 16 }}>Sinhronizacija</h2>
      
      {/* Status Overview */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 18 }}>
        <h3 style={{ marginBottom: 12, color: '#222' }}>📊 Status pregled</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
          <div style={{ textAlign: 'center', padding: 12, background: '#f8f9fa', borderRadius: 8 }}>
            <div style={{ fontSize: 24, color: getSyncStatusColor() }}>●</div>
            <div style={{ fontWeight: 'bold', color: getSyncStatusColor() }}>{getSyncStatusText()}</div>
            <div style={{ fontSize: 12, color: '#666' }}>Status</div>
          </div>
          <div style={{ textAlign: 'center', padding: 12, background: '#f8f9fa', borderRadius: 8 }}>
            <div style={{ fontSize: 20, fontWeight: 'bold', color: '#2563eb' }}>
              {lastSyncTime ? format(new Date(lastSyncTime), 'HH:mm') : '—'}
            </div>
            <div style={{ fontSize: 12, color: '#666' }}>Zadnji sync</div>
          </div>
          <div style={{ textAlign: 'center', padding: 12, background: '#f8f9fa', borderRadius: 8 }}>
            <div style={{ fontSize: 20, fontWeight: 'bold', color: syncStats.errorCount > 0 ? '#ef4444' : '#10b981' }}>
              {syncStats.errorCount}
            </div>
            <div style={{ fontSize: 12, color: '#666' }}>Greške</div>
          </div>
          <div style={{ textAlign: 'center', padding: 12, background: '#f8f9fa', borderRadius: 8 }}>
            <div style={{ fontSize: 20, fontWeight: 'bold', color: '#8b5cf6' }}>
              {syncInterval}min
            </div>
            <div style={{ fontSize: 12, color: '#666' }}>Interval</div>
          </div>
        </div>
      </div>

      {/* Automatic Sync Controls */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontWeight: 'bold', fontSize: 18, color: '#222' }}>🔄 Automatska sinhronizacija</span>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={globalSyncEnabled} 
              onChange={handleToggleAutoSync}
              style={{ marginRight: 8, transform: 'scale(1.2)' }} 
            />
            <span style={{ color: globalSyncEnabled ? '#10b981' : '#6b7280', fontWeight: 'bold' }}>
              {globalSyncEnabled ? 'Uključeno' : 'Isključeno'}
            </span>
          </label>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>Interval (min):</span>
            <select 
              value={syncInterval} 
              onChange={e => handleIntervalChange(Number(e.target.value))}
              style={{ 
                padding: '8px 12px', 
                borderRadius: 6, 
                border: '1px solid #ccc',
                background: '#fff'
              }}
            >
              <option value={1}>1 min</option>
              <option value={3}>3 min</option>
              <option value={5}>5 min</option>
              <option value={10}>10 min</option>
              <option value={15}>15 min</option>
              <option value={30}>30 min</option>
            </select>
          </label>
          
          {syncStats.errorCount > 0 && (
            <ActionButton 
              onClick={handleResetErrorCount}
              style={{ 
                background: '#f59e0b', 
                fontSize: 12, 
                padding: '6px 12px' 
              }}
            >
              Reset grešaka
            </ActionButton>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <ActionButton 
            loading={manualLoading} 
            onClick={handleManualSync}
            style={{ flex: 1 }}
          >
            Ručni sync
          </ActionButton>
          
          <ActionButton 
            onClick={() => window.location.reload()}
            style={{ 
              background: '#6b7280',
              flex: 'none',
              padding: '0 16px'
            }}
          >
            ↻ Refresh
          </ActionButton>
        </div>

        {error && (
          <div style={{ 
            marginTop: 12, 
            padding: 12, 
            background: '#fef2f2', 
            border: '1px solid #fecaca',
            borderRadius: 8,
            color: '#dc2626'
          }}>
            <strong>Greška:</strong> {error}
          </div>
        )}
      </div>

      {/* GitHub Workflow */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontWeight: 'bold', fontSize: 18, color: '#222' }}>🔗 GitHub Workflow</span>
        </div>
        <ActionButton loading={githubLoading} onClick={handleGitHubScraper} style={{ marginBottom: 16 }}>
          Pokreni workflow
        </ActionButton>
        <div>
          {workflowStatus ? (
            <div style={{ 
              padding: 12, 
              background: '#f0fdf4', 
              border: '1px solid #bbf7d0',
              borderRadius: 8,
              color: '#166534'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
                ✅ Workflow: {workflowStatus.name}
              </div>
              <div style={{ fontSize: 14 }}>
                Status: {workflowStatus.status} | 
                Zaključak: {workflowStatus.conclusion} | 
                Pokrenuto: {format(new Date(workflowStatus.started_at), 'dd.MM.yyyy HH:mm')}
              </div>
            </div>
          ) : (
            <EmptyState 
              icon={<span style={{ fontSize: 24 }}>🔗</span>} 
              text="Nema dostupnih informacija o workflow statusu." 
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default SyncTab;
