import React, { useState, useEffect } from 'react';
import ActionButton from '../../components/common/ActionButton';
import EmptyState from '../../components/common/EmptyState';
import axios from 'axios';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

const GITHUB_TOKEN = ''; // Onemogućeno za produkciju
const GITHUB_REPO = 'eldin007b/gls-scraper';
const WORKFLOW_FILE = 'scraper.yml';

const GitHubTab = () => {
  const [githubLoading, setGithubLoading] = useState(false);
  const [workflowStatus, setWorkflowStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    // Ovdje možeš dodati logiku za učitavanje historije iz localStorage
    // i automatsko osvježavanje statusa
  }, []);

  const handleGitHubScraper = async () => {
    setGithubLoading(true);
    setStatusLoading(true);
    setWorkflowStatus(null);
    try {
      const response = await axios.post(
        `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/${WORKFLOW_FILE}/dispatches`,
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
        // Dodaj u historiju
        setHistory(prev => [{ status: 'success', mode: 'manual', timestamp: new Date().toLocaleString('bs-BA') }, ...prev]);
        alert('GitHub Actions workflow je uspješno pokrenut!');
      } else {
        throw new Error(`GitHub API vratilo status: ${response.status}`);
      }
    } catch (error) {
      setHistory(prev => [{ status: 'error', mode: 'manual', timestamp: new Date().toLocaleString('bs-BA') }, ...prev]);
      alert(`Neuspješno pokretanje GitHub Actions: ${error.message}`);
    } finally {
      setGithubLoading(false);
      setStatusLoading(false);
    }
  };

  const renderWorkflowStatus = () => {
    if (statusLoading) return <span>Učitavanje...</span>;
    if (workflowStatus) {
      return (
        <div style={{ marginTop: 10, padding: 10, background: '#e9ecef', borderRadius: 5, border: '2px solid #007bff' }}>
          <div style={{ color: '#007bff', fontWeight: 'bold' }}>Workflow: {workflowStatus.name}</div>
          <div>Status: {workflowStatus.status}</div>
          <div>Zaključak: {workflowStatus.conclusion}</div>
          <div>Pokrenuto: {dayjs(workflowStatus.started_at).fromNow()}</div>
        </div>
      );
    }
    return <EmptyState icon={<span>🔗</span>} text="Nema dostupnih informacija o statusu." />;
  };

  return (
    <div style={{ padding: 10, background: '#f4f4f4' }}>
      <h2 style={{ fontWeight: 'bold', marginBottom: 10 }}>GitHub Actions</h2>
      <ActionButton loading={githubLoading || statusLoading} onClick={handleGitHubScraper} style={{ marginBottom: 10 }}>
        Pokreni Workflow
      </ActionButton>
      {renderWorkflowStatus()}
      <h2 style={{ fontWeight: 'bold', marginTop: 20 }}>Historija Pokretanja</h2>
      <div>
        {history.length === 0 ? (
          <EmptyState icon={<span>📜</span>} text="Nema historije" />
        ) : (
          history.map((item, idx) => (
            <div key={idx} style={{ padding: 10, borderBottom: '1px solid #ddd' }}>
              <div>{item.timestamp}</div>
              <div>Status: {item.status}</div>
              <div>Mod: {item.mode}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GitHubTab;
