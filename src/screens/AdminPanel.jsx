import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../utils/authService';
import axios from 'axios';

const GITHUB_TOKEN = ''; // Onemogućeno za produkciju
const GITHUB_REPO = 'eldin007b/gls-scraper';
const WORKFLOW_FILE = 'scraper.yml';

const AdminPanel = () => {
  const navigate = useNavigate();
  const [githubLoading, setGithubLoading] = useState(false);
  const [workflowStatus, setWorkflowStatus] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    // Provjeri autentifikaciju prilikom učitavanja
    if (!authService.requireAuth()) {
      alert('Nemate dozvolu za pristup admin panelu!');
      navigate('/');
      return;
    }
  }, [navigate]);

  const currentUser = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  const handleGitHubScraper = async () => {
    setGithubLoading(true);
    try {
      const response = await axios.post(
        `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/${WORKFLOW_FILE}/dispatches`,
        { ref: 'main' },
        {
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            'User-Agent': 'BDEVidencija-PWA/3.0.0',
          },
        }
      );
      if (response.status === 204) {
        setHistory(prev => [{ 
          status: 'success', 
          mode: 'manual', 
          timestamp: new Date().toLocaleString('bs-BA') 
        }, ...prev]);
        alert('GitHub Actions workflow je uspješno pokrenut!');
      } else {
        throw new Error(`GitHub API vratilo status: ${response.status}`);
      }
    } catch (error) {
      setHistory(prev => [{ 
        status: 'error', 
        mode: 'manual', 
        timestamp: new Date().toLocaleString('bs-BA') 
      }, ...prev]);
      alert(`Neuspješno pokretanje GitHub Actions: ${error.message}`);
    } finally {
      setGithubLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f3f4f6'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Niste prijavljeni</h2>
          <p>Preusmjeravamo vas na glavnu stranicu...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f3f4f6',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        background: '#ffffff',
        padding: '20px',
        borderBottom: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <img 
              src="/bde-evidencija/assets/logo.png" 
              alt="B&D Logo" 
              style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '8px',
                objectFit: 'contain',
                background: '#f8fafc',
                padding: '6px',
                border: '2px solid #e5e7eb'
              }} 
            />
            <div>
              <h1 style={{ margin: 0, fontSize: '24px', color: '#1f2937' }}>
                Admin Panel
              </h1>
              <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                BDEVidencija Administration
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '14px', color: '#4b5563' }}>
              Dobrodošli, <strong>{currentUser.name}</strong>
            </span>
            <button
              onClick={handleLogout}
              style={{
                padding: '8px 16px',
                background: '#dc2626',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Odjavi se
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '40px 20px' 
      }}>
        {/* Title */}
        <h2 style={{ 
          color: '#1769aa', 
          textAlign: 'center', 
          marginBottom: '30px',
          fontSize: '32px',
          fontWeight: 'bold'
        }}>
          Admin Dashboard
        </h2>

        {/* Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '20px',
          marginBottom: '30px'
        }}>
          {/* Status sinhronizacije */}
          <div style={{
            background: '#e3f2fd',
            padding: '24px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: '#1769aa',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 15px',
              fontSize: '24px'
            }}>
              ✓
            </div>
            <div style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>
              Status sinhronizacije
            </div>
            <div style={{ color: '#2e7d32', fontSize: '20px', fontWeight: 'bold' }}>
              Aktivno
            </div>
          </div>

          {/* Pending vožnje */}
          <div style={{
            background: '#fff3e0',
            padding: '24px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: '#ff9800',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 15px',
              fontSize: '24px'
            }}>
              🚗
            </div>
            <div style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>
              Pending vožnje
            </div>
            <div style={{ color: '#388e3c', fontSize: '20px', fontWeight: 'bold' }}>
              0
            </div>
          </div>
        </div>

        {/* GitHub Actions Section */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{
            background: '#ffffff',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ 
              margin: '0 0 20px', 
              color: '#1f2937',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              🐙 GitHub Actions
            </h3>
            
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
              <button 
                onClick={handleGitHubScraper}
                disabled={githubLoading}
                style={{
                  padding: '12px 20px',
                  background: githubLoading ? '#ccc' : '#333',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: githubLoading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {githubLoading ? '⏳' : '🚀'} 
                {githubLoading ? 'Pokretanje...' : 'Pokreni Workflow'}
              </button>
              
              <button 
                onClick={() => window.open(`https://github.com/${GITHUB_REPO}`, '_blank')}
                style={{
                  padding: '12px 20px',
                  background: '#6b7280',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                🔗 Otvori Repository
              </button>
            </div>

            {/* Workflow Status */}
            {workflowStatus && (
              <div style={{
                background: '#e3f2fd',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid #1769aa'
              }}>
                <div style={{ color: '#1769aa', fontWeight: 'bold', marginBottom: '5px' }}>
                  Workflow: {workflowStatus.name}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  Status: {workflowStatus.status} | Zaključak: {workflowStatus.conclusion}
                </div>
              </div>
            )}

            {/* History */}
            {history.length > 0 && (
              <div>
                <h4 style={{ margin: '0 0 15px', color: '#1f2937' }}>
                  Poslednja pokretanja:
                </h4>
                <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                  {history.slice(0, 3).map((item, idx) => (
                    <div key={idx} style={{
                      padding: '10px',
                      borderBottom: idx < 2 ? '1px solid #e5e7eb' : 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '500' }}>
                          {item.status === 'success' ? '✅' : '❌'} {item.mode === 'manual' ? 'Ručno' : 'Auto'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {item.timestamp}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Povratak na glavnu */}
        <div style={{ marginTop: '40px', textAlign: 'center' }}>
          <a 
            href="/"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: '#f3f4f6',
              color: '#374151',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
          >
            ← Povratak na glavnu stranicu
          </a>
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;