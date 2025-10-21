import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Calendar, Clock, CheckCircle, XCircle, AlertCircle, Github, Activity, Play, ExternalLink } from 'lucide-react';
// Removed ThemeContext usage; theming now via prop

// Helper hook za responsive dizajn
const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
};

// ActionButton komponenta sa enhanced animacijama
const ActionButton = ({ onClick, variant = 'primary', children, disabled = false, loading = false, size = 'default', icon, className = '' }) => {
  const variants = {
    primary: 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700',
    success: 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700',
    danger: 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700',
    warning: 'bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700',
    secondary: 'bg-gradient-to-r from-gray-500 to-slate-600 hover:from-gray-600 hover:to-slate-700'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    default: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <motion.button
      whileHover={{ 
        scale: disabled || loading ? 1 : 1.02,
        y: disabled || loading ? 0 : -1
      }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${sizes[size]} rounded-lg text-white font-medium transition-all duration-200 shadow-md hover:shadow-lg ${
        variants[variant]
      } ${(disabled || loading) ? 'opacity-50 cursor-not-allowed' : ''} flex items-center gap-2 ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {loading && (
        <RefreshCw className="w-4 h-4 animate-spin" />
      )}
      {icon && !loading && icon}
      {children}
    </motion.button>
  );
};

// StatusBadge komponenta
const StatusBadge = ({ type, children }) => {
  const variants = {
    success: 'bg-green-500/20 text-green-300 border-green-500/30',
    error: 'bg-red-500/20 text-red-300 border-red-500/30',
    warning: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    pending: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    info: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
  };

  return (
    <motion.span 
      className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-300 ${
        variants[type] || variants.info
      }`}
      whileHover={{ scale: 1.05 }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {children}
    </motion.span>
  );
};

const GitHubTab = ({ currentTheme }) => {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);
  const isNightTheme = currentTheme === 'night';

  const GITHUB_API_BASE = 'https://api.github.com/repos';
  // GitHub konfiguracija iz environment variables
  const GITHUB_REPO = import.meta.env.VITE_GITHUB_REPO || 'eldin007b/bde-evidencija';
  const GITHUB_REPO_FALLBACK = import.meta.env.VITE_GITHUB_REPO_FALLBACK || 'eldin007b/gls-scraper';
  // GitHub token iz environment varijabli (radi i lokalno i na production)
  const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN;
  const isProduction = window.location.hostname.includes('github.io');
  const [REPO_OWNER, REPO_NAME] = GITHUB_REPO.split('/');

  const fetchWorkflows = async () => {
    setLoading(true);
    setError(null);
    try {
      let data = null;
      let repoUsed = '';
      
      if (!GITHUB_TOKEN) {
        console.warn('ℹ️ GitHub token nije postavljen - koristim javni API (ograničeno)');
        setError('ℹ️ Javni GitHub API (ograničeno na 60 poziva/sat)');
      } else {
        console.log('🔑 GitHub token konfigurisan - koristim potpun API pristup');
      }
      
      // Pokušaj sa glavnim repo
      let response = await fetch(
        `${GITHUB_API_BASE}/${REPO_OWNER}/${REPO_NAME}/actions/runs?per_page=20`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            ...(GITHUB_TOKEN && { 'Authorization': `token ${GITHUB_TOKEN}` })
          }
        }
      );

      if (response.ok) {
        data = await response.json();
        repoUsed = GITHUB_REPO;
      } else {
        // Pokušaj sa fallback repo ako glavni ne radi
        console.log(`⚠️ Glavni repo ${GITHUB_REPO} ne radi, pokušavam fallback...`);
        const [fallbackOwner, fallbackName] = GITHUB_REPO_FALLBACK.split('/');
        
        response = await fetch(
          `${GITHUB_API_BASE}/${fallbackOwner}/${fallbackName}/actions/runs?per_page=20`,
          {
            headers: {
              'Accept': 'application/vnd.github.v3+json',
              ...(GITHUB_TOKEN && { 'Authorization': `token ${GITHUB_TOKEN}` })
            }
          }
        );
        
        if (response.ok) {
          data = await response.json();
          repoUsed = GITHUB_REPO_FALLBACK;
        }
      }

      if (data) {
        // Pretraži sve workflow-e koji mogu biti scraper
        let scraperWorkflows = (data.workflow_runs || []).filter(run => {
          const name = (run.name || '').toLowerCase();
          return name.includes('gls scraper') || name.includes('scraper') || name.includes('gls') || name.includes('sync') || name.includes('data');
        });

        // If primary repo returned runs but none match scraper-like names, try fallback repo
        if ((!scraperWorkflows || scraperWorkflows.length === 0) && repoUsed === GITHUB_REPO && GITHUB_REPO_FALLBACK) {
          console.log(`ℹ️ Nema scraper-like workflow-a u ${GITHUB_REPO}, pokušavam fallback ${GITHUB_REPO_FALLBACK}...`);
          const [fallbackOwner, fallbackName] = GITHUB_REPO_FALLBACK.split('/');
          const fallbackResp = await fetch(
            `${GITHUB_API_BASE}/${fallbackOwner}/${fallbackName}/actions/runs?per_page=20`,
            {
              headers: {
                'Accept': 'application/vnd.github.v3+json',
                ...(GITHUB_TOKEN && { 'Authorization': `token ${GITHUB_TOKEN}` })
              }
            }
          );
          if (fallbackResp.ok) {
            const fallbackData = await fallbackResp.json();
            scraperWorkflows = (fallbackData.workflow_runs || []).filter(run => {
              const name = (run.name || '').toLowerCase();
              return name.includes('gls scraper') || name.includes('scraper') || name.includes('gls') || name.includes('sync') || name.includes('data');
            });
            if (scraperWorkflows.length > 0) {
              repoUsed = GITHUB_REPO_FALLBACK;
              data = fallbackData;
            }
          }
        }

        console.log(`📊 Pronašao ${scraperWorkflows.length} workflow-a u ${repoUsed}:`, scraperWorkflows.map(w => w.name));
        setWorkflows(scraperWorkflows);

        // Sačuvaj poslednji uspešan workflow u localStorage za HomeScreen
        if (scraperWorkflows.length > 0) {
          const lastSuccessful = scraperWorkflows.find(w => w.conclusion === 'success');
          if (lastSuccessful) {
            const isoTs = lastSuccessful.updated_at || lastSuccessful.run_started_at || lastSuccessful.created_at || new Date().toISOString();
            const formatShort = (d) => {
              try {
                const date = new Date(d);
                if (isNaN(date.getTime())) return null;
                const day = date.getDate().toString().padStart(2, '0');
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const hours = date.getHours().toString().padStart(2, '0');
                const minutes = date.getMinutes().toString().padStart(2, '0');
                return `${day}.${month} ${hours}:${minutes}`;
              } catch (e) { return null; }
            };

            const syncData = {
              timestamp: isoTs,
              formattedTimestamp: formatShort(isoTs),
              status: 'success',
              workflowId: lastSuccessful.id,
              runNumber: lastSuccessful.run_number,
              source: 'github_api',
              repoUsed: repoUsed,
              raw: lastSuccessful
            };

            localStorage.setItem('github_scraper_history', JSON.stringify([syncData]));
            console.log('✅ Sačuvao GitHub scraper podatke u localStorage:', syncData);
          }
        }
        
        setLastUpdate(new Date());
      } else {
        console.error('Greška pri dohvatanju workflow-a:', response.status, response.statusText);
        if (response.status === 401) {
          console.warn('🔑 GitHub token neispravka ili nema dozvole - prebacujem na javni API');
          setError('⚠️ GitHub token neispravka - koristim javni API (ograničeno)');
          // Pokušaj bez tokena kao fallback
          try {
            const publicResponse = await fetch(
              `${GITHUB_API_BASE}/${REPO_OWNER}/${REPO_NAME}/actions/runs?per_page=10`,
              {
                headers: { 'Accept': 'application/vnd.github.v3+json' }
              }
            );
            if (publicResponse.ok) {
              data = await publicResponse.json();
              repoUsed = GITHUB_REPO + ' (javni API)';
              console.log('✅ Javni GitHub API radi - dobio', data?.workflow_runs?.length, 'workflow-ova');
              setError('ℹ️ Koristim javni GitHub API (60 poziva/sat limit)');
            } else {
              console.error('❌ Javni API takođe ne radi:', publicResponse.status);
            }
          } catch (fallbackError) {
            console.error('❌ Fallback API poziv neuspešan:', fallbackError);
          }
        } else if (response.status === 404) {
          setError('GitHub repo ili Actions nisu dostupni');
        } else {
          setError(`GitHub API greška: ${response.status}`);
        }
      }
    } catch (error) {
      console.error('Greška pri GitHub API pozivu:', error);
      setError('Mrežna greška pri povezivanju sa GitHub API');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (conclusion) => {
    switch (conclusion) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'failure':
        return <XCircle className="h-4 w-4 text-red-400" />;
      case 'in_progress':
        return <RefreshCw className="h-4 w-4 text-blue-400 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-400" />;
    }
  };

  const getStatusBadgeType = (conclusion) => {
    switch (conclusion) {
      case 'success':
        return 'success';
      case 'failure':
        return 'error';
      case 'in_progress':
        return 'pending';
      default:
        return 'warning';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('sr-RS', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatDuration = (durationMs) => {
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  const handleWorkflowDispatch = async () => {
    if (!GITHUB_TOKEN) {
      const message = 'GitHub token nije konfigurisan.\n\nDodajte VITE_GITHUB_TOKEN u environment varijable da biste mogli pokretati workflow-ove.';
      alert(message);
      return;
    }

    const workflowFile = import.meta.env.VITE_WORKFLOW_FILE || 'scraper.yml';
    
    const tryDispatch = async (repo) => {
      const [owner, name] = repo.split('/');
      const url = `${GITHUB_API_BASE}/${owner}/${name}/actions/workflows/${workflowFile}/dispatches`;
      
      // Debug logging
      console.log('🔍 [WORKFLOW DISPATCH] URL:', url);
      console.log('🔍 [WORKFLOW DISPATCH] Token exists:', !!GITHUB_TOKEN);
      console.log('🔍 [WORKFLOW DISPATCH] Token length:', GITHUB_TOKEN?.length);
      console.log('🔍 [WORKFLOW DISPATCH] Token preview:', GITHUB_TOKEN?.substring(0, 7) + '...');
      
      try {
        const resp = await fetch(url, {
          method: 'POST',
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ ref: 'main' })
        });
        
        console.log('🔍 [WORKFLOW DISPATCH] Response status:', resp.status);
        console.log('🔍 [WORKFLOW DISPATCH] Response headers:', Object.fromEntries(resp.headers.entries()));
        
        return resp;
      } catch (err) {
        return { ok: false, status: 0, statusText: err.message };
      }
    };

    setLoading(true);
    try {
      let resp = await tryDispatch(GITHUB_REPO);
      let usedRepo = GITHUB_REPO;
      
      if (!resp.ok) {
        resp = await tryDispatch(GITHUB_REPO_FALLBACK);
        usedRepo = GITHUB_REPO_FALLBACK;
      }

      if (resp.ok) {
        alert(`Workflow dispatch poslat na ${usedRepo}. Pokrećem osvežavanje...`);
        try {
          localStorage.setItem('github_scraper_last_event', JSON.stringify({
            action: 'workflow_dispatch',
            at: new Date().toISOString(),
            repo: usedRepo,
            workflowFile: workflowFile
          }));
        } catch (e) { /* ignore */ }
        setTimeout(() => fetchWorkflows(), 3000);
      } else {
        let bodyText = null;
        try {
          const cloned = await resp.clone().json();
          bodyText = cloned.message || JSON.stringify(cloned);
        } catch (e) {
          try {
            bodyText = await resp.text();
          } catch (ee) {
            bodyText = resp.statusText;
          }
        }
        
        let msg = `Neuspjeh pri pokretanju workflow-a: ${resp.status} ${resp.statusText} - ${bodyText}`;
        
        if (resp.status === 401) {
          msg += '\n\n🔍 Debug info:';
          msg += `\n• Token postoji: ${!!GITHUB_TOKEN}`;
          msg += `\n• Token length: ${GITHUB_TOKEN?.length || 0}`;  
          msg += `\n• Token početak: ${GITHUB_TOKEN?.substring(0, 10) || 'N/A'}...`;
        }
        
        alert(msg);
        try {
          localStorage.setItem('github_scraper_last_event', JSON.stringify({
            action: 'workflow_dispatch_error',
            at: new Date().toISOString(),
            repo: usedRepo,
            workflowFile: workflowFile,
            status: resp.status,
            statusText: resp.statusText,
            body: bodyText
          }));
        } catch (e) { /* ignore */ }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForceSync = async () => {
    const before = localStorage.getItem('github_scraper_history');
    await fetchWorkflows();
    const after = localStorage.getItem('github_scraper_history');
    try {
      const parsed = after ? JSON.parse(after)[0] : null;
      if (parsed) {
        const enriched = {
          ...parsed,
          formattedTimestamp: new Date(parsed.timestamp).toLocaleString('sr-RS', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
          })
        };
        try {
          localStorage.setItem('github_scraper_last_event', JSON.stringify({
            action: 'force_sync',
            at: new Date().toISOString(),
            payload: enriched
          }));
        } catch (e) { /* ignore */ }
        window.dispatchEvent(new CustomEvent('githubSync:updated', { detail: enriched }));
      }
    } catch (e) {
      console.warn('Ne mogu parsirati github_scraper_history nakon Force sync', e);
    }
  };

  useEffect(() => {
    // Delay initial fetch to avoid blocking render
    const timer = setTimeout(() => {
      fetchWorkflows();
    }, 1000);
    
    // Osvežavaj svake 5 minuta
    const interval = setInterval(fetchWorkflows, 5 * 60 * 1000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  return (
    <motion.div 
      className={`p-6 min-h-screen transition-all duration-500 ${
        isNightTheme 
          ? 'bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20' 
          : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header sa animovanim naslovom */}
      {/* Header section - responsive layout */}
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {/* Title and icon */}
        <div className="flex items-center gap-4 mb-4">
          <motion.div
            className={`p-3 rounded-2xl ${
              isNightTheme 
                ? 'bg-gradient-to-br from-purple-600 to-blue-600 shadow-2xl shadow-purple-500/25' 
                : 'bg-gradient-to-br from-purple-500 to-blue-500 shadow-2xl shadow-purple-500/25'
            }`}
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Github className="w-8 h-8 text-white" />
          </motion.div>
          <div className="flex-1">
            <motion.h3 
              className={`text-xl md:text-2xl font-bold ${isNightTheme ? 'text-white' : 'text-gray-900'}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              GitHub Actions
            </motion.h3>
            <motion.p 
              className={`text-xs md:text-sm ${isNightTheme ? 'text-gray-400' : 'text-gray-600'} break-all md:break-normal`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              {lastUpdate && `Poslednje ažuriranje: ${formatDate(lastUpdate)}`}
            </motion.p>
          </div>
        </div>
        
        {/* Action buttons - responsive grid */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <ActionButton
            onClick={fetchWorkflows}
            loading={loading}
            variant="secondary"
            size="sm"
            icon={<RefreshCw className="w-4 h-4" />}
            className="w-full justify-center"
          >
            Osvježi
          </ActionButton>

          <ActionButton
            onClick={handleForceSync}
            variant="primary"
            size="sm"
            icon={<Activity className="w-4 h-4" />}
            className="w-full justify-center"
          >
            Force Sync
          </ActionButton>
          
          <ActionButton
            onClick={handleWorkflowDispatch}
            variant="success"
            size="sm"
            icon={<Play className="w-4 h-4" />}
            className="w-full justify-center"
            title="Pokreni GLS Scraper workflow"
          >
            Pokreni Scraper
          </ActionButton>
        </motion.div>
      </motion.div>

      {/* Workflows List */}
      {workflows.length > 0 ? (
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {workflows.map((workflow, index) => (
            <motion.div
              key={workflow.id}
              className={`p-6 rounded-2xl backdrop-blur-sm border transition-all duration-300 ${
                isNightTheme 
                  ? 'bg-gray-800/40 border-gray-700/50 hover:bg-gray-800/60 hover:border-gray-600/50' 
                  : 'bg-white/60 border-gray-200 hover:bg-white/80 hover:border-gray-300'
              } hover:shadow-xl group`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              whileHover={{ y: -2 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    {getStatusIcon(workflow.conclusion)}
                  </motion.div>
                  <div>
                    <motion.p 
                      className={`font-semibold text-lg ${isNightTheme ? 'text-white' : 'text-gray-900'}`}
                      whileHover={{ x: 2 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      {workflow.name}
                    </motion.p>
                    <p className={`text-sm ${isNightTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                      Run #{workflow.run_number} • {workflow.head_branch}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <StatusBadge type={getStatusBadgeType(workflow.conclusion)}>
                        {workflow.conclusion || 'unknown'}
                      </StatusBadge>
                    </div>
                  </div>
                </div>
                
                <div className={`text-right text-sm ${isNightTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                  <div className="flex items-center justify-end gap-2 mb-2">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(workflow.updated_at)}</span>
                  </div>
                  {workflow.run_started_at && workflow.updated_at && (
                    <div className="flex items-center justify-end gap-2">
                      <Clock className="h-4 w-4" />
                      <span>
                        {formatDuration(
                          new Date(workflow.updated_at) - new Date(workflow.run_started_at)
                        )}
                      </span>
                    </div>
                  )}
                  {workflow.html_url && (
                    <motion.a
                      href={workflow.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-end gap-1 mt-2 text-xs hover:underline ${
                        isNightTheme ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                      }`}
                      whileHover={{ scale: 1.05 }}
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Pogledaj na GitHub</span>
                    </motion.a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div 
          className={`p-12 rounded-2xl backdrop-blur-sm border text-center ${
            isNightTheme 
              ? 'bg-gray-800/40 border-gray-700/50' 
              : 'bg-white/60 border-gray-200'
          }`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
        >
          <motion.div
            className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
              isNightTheme ? 'bg-gray-700/50' : 'bg-gray-100'
            }`}
            animate={{ rotate: loading ? 360 : 0 }}
            transition={{ duration: loading ? 1 : 0, repeat: loading ? Infinity : 0 }}
          >
            <Github className={`w-8 h-8 ${isNightTheme ? 'text-gray-400' : 'text-gray-500'}`} />
          </motion.div>
          <p className={`text-lg font-medium mb-2 ${isNightTheme ? 'text-gray-300' : 'text-gray-700'}`}>
            {loading ? 'Učitavam workflow podatke...' : error ? 'Greška pri učitavanju' : 'Nema pronađenih workflow-a'}
          </p>
          {!loading && error && (
            <p className={`text-sm ${isNightTheme ? 'text-red-400' : 'text-red-600'} mb-2`}>
              {error}
            </p>
          )}
          {!loading && !error && (
            <p className={`text-sm ${isNightTheme ? 'text-gray-500' : 'text-gray-500'}`}>
              Proveri da li repo ima GitHub Actions ili proveri naziv repo.
            </p>
          )}
        </motion.div>
      )}
      
      {/* Footer sa informacijama */}
      <motion.div 
        className={`mt-8 p-4 rounded-xl backdrop-blur-sm border ${
          isNightTheme 
            ? 'bg-gray-800/20 border-gray-700/30' 
            : 'bg-white/40 border-gray-200/50'
        }`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <div className={`text-xs space-y-1 ${isNightTheme ? 'text-gray-400' : 'text-gray-600'}`}>
          <p>
            📡 Glavni repo: <span className="font-mono">{GITHUB_REPO}</span>
          </p>
          <p>
            🔄 Fallback repo: <span className="font-mono">{GITHUB_REPO_FALLBACK}</span>
          </p>
          <p>
            🔑 Token: {GITHUB_TOKEN ? '✅ Konfigurisan (potpun pristup)' : '❌ Nedostaje'}
          </p>
          <div className="flex items-center gap-4 mt-2">
            <span>🌐 GitHub Actions:</span>
            <motion.a 
              href={`https://github.com/${GITHUB_REPO}/actions`} 
              target="_blank" 
              rel="noopener noreferrer"
              className={`${isNightTheme ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} hover:underline`}
              whileHover={{ scale: 1.05 }}
            >
              Glavni
            </motion.a>
            <motion.a 
              href={`https://github.com/${GITHUB_REPO_FALLBACK}/actions`} 
              target="_blank" 
              rel="noopener noreferrer"
              className={`${isNightTheme ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} hover:underline`}
              whileHover={{ scale: 1.05 }}
            >
              Fallback
            </motion.a>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GitHubTab;