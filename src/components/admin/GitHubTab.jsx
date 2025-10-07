import React, { useState, useEffect } from 'react';
import ActionButton from '../../components/common/ActionButton';
import EmptyState from '../../components/common/EmptyState';
import axios from 'axios';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN || ''; // Iz environment variable
const GITHUB_REPO = import.meta.env.VITE_GITHUB_REPO || 'eldin007b/gls-scraper';
const WORKFLOW_FILE = import.meta.env.VITE_WORKFLOW_FILE || 'scraper.yml';

const GitHubTab = () => {
  const [githubLoading, setGithubLoading] = useState(false);
  const [workflowStatus, setWorkflowStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [githubToken, setGithubToken] = useState(GITHUB_TOKEN || localStorage.getItem('github_token') || '');
  
  // Provjeri da li token postoji u environment ili localStorage
  const hasValidToken = githubToken && githubToken.length > 10;

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
  }, []);

  // Funkcija za čuvanje historije u localStorage
  const saveGithubHistory = async (status, mode) => {
    const newHistoryItem = {
      status,
      mode,
      timestamp: new Date().toLocaleString('bs-BA'),
    };

    try {
      const updatedHistory = [newHistoryItem, ...history];
      setHistory(updatedHistory);
      localStorage.setItem('github_scraper_history', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Greška prilikom čuvanja historije:', error);
    }
  };

  // Poboljšana funkcija za dohvaćanje workflow statusa
  const getLastWorkflowStatus = async () => {
    if (!hasValidToken) {
      console.warn('GitHub token nije dostupan');
      return null;
    }
    
    try {
      const response = await axios.get(
        `https://api.github.com/repos/${GITHUB_REPO}/actions/runs`,
        {
          headers: {
            'Authorization': `token ${githubToken}`,
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
    if (!hasValidToken) {
      alert('GitHub token nije postavljen! Molimo unesite valjan token.');
      return;
    }
    
    setGithubLoading(true);
    setStatusLoading(true);
    setWorkflowStatus(null);

    try {
      const response = await axios.post(
        `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/${WORKFLOW_FILE}/dispatches`,
        { ref: 'main' },
        {
          headers: {
            'Authorization': `token ${githubToken}`,
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

  const handleGitHubScraper = handleGitHubWorkflow;

  const renderWorkflowStatus = () => {
    if (statusLoading) return <span>🔄 Učitavanje statusa...</span>;
    if (workflowStatus) {
      const statusColor = workflowStatus.status === 'completed' ? 
        (workflowStatus.conclusion === 'success' ? '#22c55e' : '#ef4444') : '#f59e0b';
      
      return (
        <div style={{ 
          marginTop: 10, 
          padding: 15, 
          background: 'rgba(255, 255, 255, 0.1)', 
          borderRadius: 12, 
          border: `2px solid ${statusColor}`,
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ color: statusColor, fontWeight: 'bold', fontSize: '16px', marginBottom: '8px' }}>
            🔄 {workflowStatus.name || 'GitHub Workflow'}
          </div>
          <div style={{ display: 'grid', gap: '6px', fontSize: '14px', color: 'var(--text-on-dark, #f1f5f9)' }}>
            <div>📊 Status: <strong>{workflowStatus.status}</strong></div>
            {workflowStatus.conclusion && (
              <div>✅ Zaključak: <strong>{workflowStatus.conclusion}</strong></div>
            )}
            <div>🕒 Pokrenuto: <strong>{formatTimeAgo(workflowStatus.started_at)}</strong></div>
            {workflowStatus.duration && (
              <div>⏱️ Trajanje: <strong>{workflowStatus.duration} min</strong></div>
            )}
            <div>🎯 Tip: <strong>{workflowStatus.mode}</strong></div>
            {workflowStatus.html_url && (
              <div>
                <a 
                  href={workflowStatus.html_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: statusColor, textDecoration: 'underline' }}
                >
                  🔗 Pogledaj na GitHub-u
                </a>
              </div>
            )}
          </div>
        </div>
      );
    }
    return <EmptyState icon={<span>🔗</span>} text="Nema dostupnih informacija o statusu." />;
  };

  const saveToken = () => {
    localStorage.setItem('github_token', githubToken);
    alert('GitHub token je sačuvan! Restart aplikacije da promjene stupaju na snagu.');
  };

  const clearToken = () => {
    setGithubToken('');
    localStorage.removeItem('github_token');
    alert('GitHub token je obrisan!');
  };

  return (
    <div style={{
      background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.08) 50%, rgba(255, 255, 255, 0.04) 100%)',
      backdropFilter: 'blur(15px)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      borderRadius: '16px',
      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      padding: '2rem',
      color: 'var(--text-on-dark, #f1f5f9)'
    }}>
      <h2 style={{ fontWeight: 'bold', marginBottom: 20, color: 'var(--text-on-dark, #f1f5f9)' }}>
        🚀 GitHub Actions Control Panel
      </h2>
      
      {/* GitHub Token Status */}
      <div style={{
        background: hasValidToken ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 193, 7, 0.15)',
        border: hasValidToken ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(255, 193, 7, 0.3)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '20px'
      }}>
        <h3 style={{ 
          color: hasValidToken ? '#22c55e' : '#ffc107', 
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {hasValidToken ? '✅ GitHub API Konfigurisan' : '⚠️ GitHub Token potreban'}
        </h3>
        
        <div style={{ display: 'grid', gap: '8px', fontSize: '14px' }}>
          <div style={{ color: 'var(--text-on-dark, #f1f5f9)', opacity: 0.9 }}>
            📁 Repository: <strong>{GITHUB_REPO}</strong>
          </div>
          <div style={{ color: 'var(--text-on-dark, #f1f5f9)', opacity: 0.9 }}>
            ⚙️ Workflow: <strong>{WORKFLOW_FILE}</strong>
          </div>
          <div style={{ color: 'var(--text-on-dark, #f1f5f9)', opacity: 0.9 }}>
            🔑 Token: <strong>{hasValidToken ? `${githubToken.substring(0, 8)}...` : 'Nije postavljen'}</strong>
          </div>
        </div>
        
        {!hasValidToken && (
          <div style={{ marginTop: '12px' }}>
            <p style={{ color: 'var(--text-on-dark, #f1f5f9)', marginBottom: '12px', fontSize: '14px' }}>
              Za pokretanje GitHub Actions potreban je Personal Access Token s dozvolama: <code>repo</code>, <code>workflow</code>
            </p>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="password"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder="Unesite GitHub Personal Access Token"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'var(--text-on-dark, #f1f5f9)',
                  backdropFilter: 'blur(5px)'
                }}
              />
              <ActionButton onClick={saveToken} bgColor="#ffc107">
                💾 Sačuvaj
              </ActionButton>
            </div>
          </div>
        )}
        
        {hasValidToken && (
          <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
            <ActionButton onClick={clearToken} bgColor="#dc3545">
              🗑️ Obriši Token
            </ActionButton>
          </div>
        )}
      </div>
      
      <ActionButton 
        loading={githubLoading || statusLoading} 
        onClick={handleGitHubScraper} 
        style={{ marginBottom: 20 }}
        bgColor={hasValidToken ? "#238636" : "#6c757d"}
        disabled={!hasValidToken}
      >
        {githubLoading ? '🔄 Pokretanje...' : !hasValidToken ? '🔒 Token potreban' : '▶️ Pokreni Scraper Workflow'}
      </ActionButton>
      
      {renderWorkflowStatus()}
      
      <h3 style={{ fontWeight: 'bold', marginTop: 30, marginBottom: 15, color: 'var(--text-on-dark, #f1f5f9)' }}>
        📜 Historija Pokretanja
      </h3>
      
      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {history.length === 0 ? (
          <EmptyState icon={<span>📜</span>} text="Nema historije pokretanja" />
        ) : (
          history.map((item, idx) => (
            <div key={idx} style={{ 
              padding: 12, 
              marginBottom: 8,
              background: item.status === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: item.status === 'success' ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 8,
              backdropFilter: 'blur(5px)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 'bold', color: 'var(--text-on-dark, #f1f5f9)' }}>
                    {item.status === 'success' ? '✅' : '❌'} {item.status === 'success' ? 'Uspješno' : 'Greška'}
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.8, color: 'var(--text-on-dark, #f1f5f9)' }}>
                    🎯 Tip: {item.mode === 'manual' ? 'Ručno pokretanje' : 'Automatsko pokretanje'}
                  </div>
                </div>
                <div style={{ fontSize: '12px', opacity: 0.7, color: 'var(--text-on-dark, #f1f5f9)' }}>
                  🕒 {item.timestamp}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GitHubTab;