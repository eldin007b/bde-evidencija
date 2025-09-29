import React, { useState, useEffect, useCallback } from 'react';
import InfoCard from '../../components/common/InfoCard';
import ActionButton from '../../components/common/ActionButton';
import useSettings from '../../hooks/useSettings';
import useDeviceApprovals from '../../hooks/useDeviceApprovals';
import { useSyncContext } from '../../context/SyncContext.jsx';
import { supabase } from '../../db/supabaseClient';
import { format } from 'date-fns';
import axios from 'axios';

const DashboardTab = () => {
  const { isAutoSyncRunning } = useSyncContext();
  const { settings } = useSettings();
  const [workflowStatus, setWorkflowStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [pendingRidesCount, setPendingRidesCount] = useState(0);
  const [pendingRidesLoading, setPendingRidesLoading] = useState(true);
  const [onlineUsersCount, setOnlineUsersCount] = useState(0);
  const [onlineUsersLoading, setOnlineUsersLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState([]);

  // GitHub config - onemogući za produkciju zbog sigurnosti
  const GITHUB_TOKEN = '';
  const GITHUB_REPO = 'eldin007b/gls-scraper';

  // Funkcija za čitanje pending vožnji iz Supabase
  const fetchPendingRides = useCallback(async () => {
    setPendingRidesLoading(true);
    try {
      console.log('🔍 [Dashboard] Fetching pending rides...');
      
      const { data, error } = await supabase
        .from('extra_rides_pending')
        .select('id, status')
        .eq('status', 'pending');

      if (error) {
        console.error('❌ [Dashboard] Error fetching pending rides:', error);
        setPendingRidesCount(0);
      } else {
        console.log('✅ [Dashboard] Pending rides data:', data);
        setPendingRidesCount(data ? data.length : 0);
      }
    } catch (error) {
      console.error('❌ [Dashboard] Error in fetchPendingRides:', error);
      setPendingRidesCount(0);
    } finally {
      setPendingRidesLoading(false);
    }
  }, []);

  // Funkcija za čitanje online korisnika (zadnji login u zadnjih 30 minuta)
  const fetchOnlineUsers = useCallback(async () => {
    setOnlineUsersLoading(true);
    try {
      console.log('👥 [Dashboard] Fetching online users...');
      
      // Račun online kao korisnici koji su se prijavili u zadnjih 30 minuta
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      
      const { data, error } = await supabase
        .from('drivers')
        .select('id, ime, tura, aktivan, device_id, last_login')
        .eq('aktivan', true)
        .gte('last_login', thirtyMinutesAgo.toISOString());

      if (error) {
        console.error('❌ [Dashboard] Error fetching online users:', error);
        setOnlineUsersCount(0);
      } else {
        console.log('✅ [Dashboard] Online users data:', data);
        // Loguj i Device ID za svaki online korisnik
        data?.forEach(user => {
          const lastLogin = new Date(user.last_login);
          const minutesAgo = Math.floor((Date.now() - lastLogin.getTime()) / (1000 * 60));
          console.log(`🟢 ${user.ime} (${user.tura}) - Device: ${user.device_id || 'N/A'} - ${minutesAgo}min ago`);
        });
        setOnlineUsersCount(data ? data.length : 0);
        setOnlineUsers(data || []);
      }
    } catch (error) {
      console.error('❌ [Dashboard] Error in fetchOnlineUsers:', error);
      setOnlineUsersCount(0);
    } finally {
      setOnlineUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingRides();
    fetchOnlineUsers();
    // Refresh pending rides i online users svakih 30 sekundi
    const interval = setInterval(() => {
      fetchPendingRides();
      fetchOnlineUsers();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchPendingRides, fetchOnlineUsers]);

  // Funkcija za čuvanje historije u localStorage
  const saveGithubHistory = async (status, mode = 'manual') => {
    try {
      const newHistory = {
        lastRun: new Date().toISOString(),
        status: status,
        mode: mode,
        timestamp: new Date().toLocaleString('bs-BA', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      const updatedHistory = [newHistory, ...history].slice(0, 10); // Zadržava samo zadnjih 10
      setHistory(updatedHistory);
      localStorage.setItem('github_scraper_history', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Greška pri čuvanju GitHub historije:', error);
    }
  };

  // Poboljšana funkcija za dohvaćanje workflow statusa
  const getLastWorkflowStatus = async () => {
    try {
      const response = await axios.get(
        `https://api.github.com/repos/${GITHUB_REPO}/actions/runs`,
        {
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Evidencija-App/1.0.0',
          },
          params: { per_page: 1 },
        }
      );

      if (response.data.workflow_runs && response.data.workflow_runs.length > 0) {
        const run = response.data.workflow_runs[0];
        return {
          name: run.name,
          status: run.status,
          conclusion: run.conclusion,
          started_at: run.run_started_at || run.created_at,
          duration: run.updated_at ? Math.round((new Date(run.updated_at) - new Date(run.run_started_at || run.created_at)) / 60000) : null,
          mode: run.event === 'schedule' ? 'Automatski' : 'Ručno',
          html_url: run.html_url,
          id: run.id,
        };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Greška prilikom dohvaćanja statusa workflow-a:', error);
      return null;
    }
  };

  // Poboljšana funkcija za pokretanje GitHub workflow-a
  const handleGitHubWorkflow = async () => {
    setGithubLoading(true);
    setStatusLoading(true);
    setWorkflowStatus(null);

    try {
      const response = await axios.post(
        `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/scraper.yml/dispatches`,
        { ref: 'main' },
        {
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            'User-Agent': 'Evidencija-App/1.0.0',
          },
        }
      );

      if (response.status === 204) {
        await saveGithubHistory('success', 'manual');
        alert('Uspjeh! GitHub Actions workflow je uspješno pokrenut!');
        
        // Čekaj 3 sekunde pa dohvati novi status
        setTimeout(async () => {
          const newStatus = await getLastWorkflowStatus();
          setWorkflowStatus(newStatus);
          setStatusLoading(false);
        }, 3000);
      } else {
        throw new Error(`GitHub API vratilo status: ${response.status}`);
      }
    } catch (error) {
      await saveGithubHistory('error', 'manual');
      alert(`Greška: Neuspješno pokretanje GitHub Actions: ${error.message}`);
      setStatusLoading(false);
    } finally {
      setGithubLoading(false);
    }
  };

  // Formatiranje vremena kao "an hour ago"
  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minuta ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours === 1 ? 'an' : hours} hour${hours === 1 ? '' : 's'} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days === 1 ? '' : 's'} ago`;
    }
  };

  useEffect(() => {
    // Učitaj historiju iz localStorage
    const loadHistory = () => {
      try {
        const storedHistory = localStorage.getItem('github_scraper_history');
        setHistory(storedHistory ? JSON.parse(storedHistory) : []);
      } catch (error) {
        console.error('Greška prilikom učitavanja historije:', error);
      }
    };

    // Funkcija za dohvaćanje GitHub workflow statusa
    const fetchWorkflowStatus = async () => {
      setStatusLoading(true);
      try {
        const status = await getLastWorkflowStatus();
        setWorkflowStatus(status);
      } catch (error) {
        console.error('Greška prilikom učitavanja GitHub workflow statusa:', error);
      } finally {
        setStatusLoading(false);
      }
    };

    loadHistory();
    fetchWorkflowStatus();

    // Automatsko osvježavanje svakih 60 sekundi
    const interval = setInterval(fetchWorkflowStatus, 60000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: 24, background: '#f7fafd' }}>
      <h2 style={{ color: '#1769aa', textAlign: 'center', marginBottom: 18 }}>Admin Dashboard</h2>
      <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
        <InfoCard 
          icon={<span role="img" aria-label="cloud">☁️</span>} 
          label="Status sinhronizacije" 
          value={isAutoSyncRunning ? 'Aktivno' : 'Isključeno'} 
          color={isAutoSyncRunning ? '#2e7d32' : '#c62828'} 
          bgColor="#e3f2fd" 
        />
        <InfoCard 
          icon={<span role="img" aria-label="car">🚗</span>} 
          label="Pending vožnje" 
          value={pendingRidesLoading ? '...' : pendingRidesCount} 
          color={pendingRidesCount > 0 ? '#ff9800' : '#388e3c'} 
          bgColor="#fff3e0" 
        />
        <InfoCard 
          icon={<span role="img" aria-label="users">👥</span>} 
          label="Online korisnici" 
          value={onlineUsersLoading ? '...' : onlineUsersCount} 
          color={onlineUsersCount > 0 ? '#2e7d32' : '#757575'} 
          bgColor="#e8f5e8" 
        />
      </div>

      {/* Online korisnici sekcija */}
      {onlineUsers.length > 0 && (
        <div style={{
          background: '#ffffff',
          padding: 20,
          borderRadius: 12,
          marginBottom: 24,
          border: '1px solid #e0e0e0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ color: '#2e7d32', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span role="img" aria-label="users">👥</span>
            Online korisnici ({onlineUsers.length})
          </h3>
          <div style={{ display: 'grid', gap: 12 }}>
            {onlineUsers.map(user => {
              const lastLogin = new Date(user.last_login);
              const minutesAgo = Math.floor((Date.now() - lastLogin.getTime()) / (1000 * 60));
              return (
                <div key={user.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 12,
                  background: '#f8f9fa',
                  borderRadius: 8,
                  border: '1px solid #e9ecef'
                }}>
                  <div>
                    <strong style={{ color: '#2c3e50' }}>{user.ime}</strong>
                    <span style={{ color: '#6c757d', marginLeft: 8 }}>({user.tura})</span>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '13px', color: '#6c757d' }}>
                    <div>Device: <code style={{ background: '#e9ecef', padding: '2px 6px', borderRadius: 4 }}>{user.device_id || 'N/A'}</code></div>
                    <div>{minutesAgo < 1 ? 'upravo' : `${minutesAgo}min ago`}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* GitHub Workflow Section */}
      <div style={{
        background: '#ffffff',
        padding: 24,
        borderRadius: 12,
        marginBottom: 24,
        border: '1px solid #e0e0e0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
          <span role="img" aria-label="github" style={{ fontSize: 24, marginRight: 12 }}>🔗</span>
          <span style={{ fontWeight: 'bold', fontSize: 18, color: '#222' }}>GitHub Workflow</span>
        </div>
        <p style={{ color: '#666', marginBottom: 16, fontSize: 14 }}>
          Status zadnjeg workflow-a i ručno pokretanje.
        </p>
        
        <button
          onClick={handleGitHubWorkflow}
          disabled={githubLoading || statusLoading}
          style={{
            background: '#333',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            padding: '12px 20px',
            fontSize: 14,
            fontWeight: 'bold',
            cursor: githubLoading || statusLoading ? 'not-allowed' : 'pointer',
            opacity: githubLoading || statusLoading ? 0.6 : 1,
            marginBottom: 16
          }}
        >
          {githubLoading || statusLoading ? 'Loading...' : 'Pokreni workflow'}
        </button>

        <button
          onClick={async () => {
            setStatusLoading(true);
            const newStatus = await getLastWorkflowStatus();
            setWorkflowStatus(newStatus);
            setStatusLoading(false);
          }}
          disabled={statusLoading}
          style={{
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            padding: '12px 20px',
            fontSize: 14,
            fontWeight: 'bold',
            cursor: statusLoading ? 'not-allowed' : 'pointer',
            opacity: statusLoading ? 0.6 : 1,
            marginBottom: 16,
            marginLeft: 8
          }}
        >
          {statusLoading ? 'Loading...' : 'Osvježi Status'}
        </button>

        {/* Workflow Status Display */}
        {statusLoading ? (
          <div style={{ textAlign: 'center', color: '#666' }}>Loading...</div>
        ) : workflowStatus ? (
          <div style={{
            background: '#f8f9fa',
            padding: 16,
            borderRadius: 8,
            border: '1px solid #e9ecef'
          }}>
            <div style={{ marginBottom: 8 }}>
              <span style={{ color: '#28a745', fontWeight: 'bold' }}>Workflow: </span>
              <span style={{ color: '#28a745', fontWeight: 'bold' }}>{workflowStatus.name}</span>
            </div>
            <div style={{ marginBottom: 8 }}>
              <span style={{ color: '#28a745', fontWeight: 'bold' }}>Status: </span>
              <span style={{ color: '#28a745', fontWeight: 'bold' }}>{workflowStatus.status}</span>
            </div>
            <div style={{ marginBottom: 8 }}>
              <span style={{ color: '#28a745', fontWeight: 'bold' }}>Zaključak: </span>
              <span style={{ color: '#28a745', fontWeight: 'bold' }}>{workflowStatus.conclusion}</span>
            </div>
            <div style={{ marginBottom: 8 }}>
              <span style={{ color: '#333' }}>Pokrenuto: </span>
              <span style={{ color: '#333' }}>{formatTimeAgo(workflowStatus.started_at)}</span>
            </div>
            <div style={{ marginBottom: 8 }}>
              <span style={{ color: '#333' }}>Trajanje: </span>
              <span style={{ color: '#333' }}>
                {workflowStatus.duration ? `${workflowStatus.duration} minuta` : 'Nepoznato'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
              <span role="img" aria-label="settings" style={{ fontSize: 16 }}>⚙️</span>
              <span style={{
                background: workflowStatus.mode === 'Ručno' ? '#007bff' : '#28a745',
                color: 'white',
                padding: '4px 8px',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 'bold'
              }}>
                {workflowStatus.mode}
              </span>
            </div>
            <a
              href={workflowStatus.html_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#007bff',
                textDecoration: 'none',
                fontSize: 14,
                display: 'inline-block',
                marginTop: 8
              }}
            >
              Detalji na GitHub-u
            </a>
          </div>
        ) : (
          <div style={{ color: '#666', fontStyle: 'italic' }}>
            Nema dostupnih informacija o statusu.
          </div>
        )}
      </div>

      {/* Historija Pokretanja */}
      {history.length > 0 && (
        <div style={{
          background: '#ffffff',
          padding: 24,
          borderRadius: 12,
          marginBottom: 24,
          border: '1px solid #e0e0e0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
            <span role="img" aria-label="history" style={{ fontSize: 20, marginRight: 8 }}>📋</span>
            <span style={{ fontWeight: 'bold', fontSize: 16, color: '#222' }}>Historija Pokretanja</span>
          </div>
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {history.map((item, index) => (
              <div key={index} style={{
                padding: 12,
                borderBottom: index < history.length - 1 ? '1px solid #eee' : 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 'bold', color: '#333' }}>
                    {item.timestamp}
                  </div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                    Status: {item.status} • Mod: {item.mode}
                  </div>
                </div>
                <span style={{
                  background: item.status === 'success' ? '#28a745' : '#dc3545',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 'bold'
                }}>
                  {item.status === 'success' ? '✓' : '✗'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <ActionButton 
        onClick={() => window.open('https://github.com/your-repo/bdevidencija', '_blank')}
        bgColor="#333"
        style={{ marginBottom: 24 }}
      >
        <span style={{ marginRight: 8 }}>📂</span>
        GitHub Repository
      </ActionButton>
    </div>
  );
};

export default DashboardTab;