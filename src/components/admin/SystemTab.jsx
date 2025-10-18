import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Database, 
  Download, 
  Upload, 
  Trash2, 
  Settings, 
  Shield, 
  Clock, 
  HardDrive,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  History,
  Archive
} from 'lucide-react';
import { supabase } from '../../db/supabaseClient';
import ModernModal from './ModernModal.jsx';

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
const ActionButton = ({ onClick, variant = 'primary', children, disabled = false, loading = false }) => {
  const variants = {
    primary: 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700',
    success: 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700',
    danger: 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700',
    warning: 'bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700'
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
      className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg ${
        variants[variant]
      } ${(disabled || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {loading && (
        <RefreshCw className="w-4 h-4 mr-2 animate-spin inline" />
      )}
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
    info: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
  };

  return (
    <motion.span 
      className={`px-2 py-1 rounded-full text-xs font-semibold border ${variants[type] || variants.info}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      {children}
    </motion.span>
  );
};

const SystemTab = () => {
  // Theme logic
  const [currentTheme, setCurrentTheme] = useState('default');
  
  useEffect(() => {
    const updateTheme = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 8) setCurrentTheme('sunrise');
      else if (hour >= 8 && hour < 12) setCurrentTheme('default');
      else if (hour >= 12 && hour < 17) setCurrentTheme('afternoon');
      else if (hour >= 17 && hour < 20) setCurrentTheme('evening');
      else setCurrentTheme('night');
    };

    updateTheme();
    const interval = setInterval(updateTheme, 60000);
    return () => clearInterval(interval);
  }, []);

  const isNightTheme = currentTheme === 'night';
  const isTablet = useMediaQuery('(min-width: 768px)');

  const [backupData, setBackupData] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState('');
  const [selectedTables, setSelectedTables] = useState({
    drivers: true,
    deliveries: true,
    extra_rides: true,
    extra_rides_pending: true,
    holidays: true
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [backupHistory, setBackupHistory] = useState([]);
  const [showDeleteBackupModal, setShowDeleteBackupModal] = useState(false);
  const [backupToDelete, setBackupToDelete] = useState(null);

  // Lista svih tabela u bazi sa modernijim ikonama
  const availableTables = [
    { 
      key: 'drivers', 
      name: 'Vozači', 
      icon: Database, 
      color: 'from-blue-500 to-indigo-600',
      description: 'Svi vozači i njihovi podaci' 
    },
    { 
      key: 'deliveries', 
      name: 'Dostave', 
      icon: Archive, 
      color: 'from-green-500 to-emerald-600',
      description: 'Svi podaci o dostavama' 
    },
    { 
      key: 'extra_rides', 
      name: 'Extra vožnje', 
      icon: CheckCircle, 
      color: 'from-purple-500 to-violet-600',
      description: 'Odobrene extra vožnje' 
    },
    { 
      key: 'extra_rides_pending', 
      name: 'Pending vožnje', 
      icon: Clock, 
      color: 'from-yellow-500 to-orange-600',
      description: 'Vožnje na čekanju' 
    },
    { 
      key: 'holidays', 
      name: 'Praznici', 
      icon: Shield, 
      color: 'from-pink-500 to-rose-600',
      description: 'Kalendar praznika' 
    }
  ];

  useEffect(() => {
    loadBackupHistory();
  }, []);

  // Helper function for relative time
  const getRelativeTime = (timestamp) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Upravo sada';
    if (diffMins < 60) return `Prije ${diffMins}min`;
    if (diffHours < 24) return `Prije ${diffHours}h`;
    if (diffDays < 7) return `Prije ${diffDays}d`;
    return 'Stariji';
  };

  // Učitaj historiju backup-ova iz localStorage
  const loadBackupHistory = () => {
    const historyString = localStorage.getItem('backupHistory') || '[]';
    const history = JSON.parse(historyString);
    setBackupHistory(history.slice(-10)); // Posledjih 10 backup-ova
  };

  // Test funkcija - kreiraj dummy backup za testiranje
  const createTestBackup = () => {
    const testBackup = {
      drivers: [
        { id: 1, name: 'Test Vozač 1', phone: '061234567' },
        { id: 2, name: 'Test Vozač 2', phone: '062345678' }
      ],
      deliveries: [
        { id: 1, from: 'Sarajevo', to: 'Mostar', date: '2024-01-15' },
        { id: 2, from: 'Tuzla', to: 'Zenica', date: '2024-01-16' }
      ],
      extra_rides: [
        { id: 1, driver_id: 1, date: '2024-01-15', amount: 50 }
      ]
    };
    
    saveToBackupHistory(testBackup);
    setProcessStatus('✅ Test backup kreiran uspešno!');
    setTimeout(() => setProcessStatus(''), 3000);
  };

  // Sačuvaj backup u localStorage istoriju
  const saveToBackupHistory = (backupInfo) => {
    const history = JSON.parse(localStorage.getItem('backupHistory') || '[]');
    
    // Ukloni _metadata iz kalkulacije
    const { _metadata, ...actualData } = backupInfo;
    
    // Kalkuliši veličinu backup-a
    const calculateBackupSize = (data) => {
      const jsonString = JSON.stringify(data);
      return jsonString.length; // Bytes
    };
    
    // Format file size
    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    
    const backupSize = calculateBackupSize(backupInfo);
    
    // Koristi metadata ako postoji, inače kalkuliši - ALI ukloni _metadata iz tables
    const rawTables = _metadata?.tables || Object.keys(actualData);
    const tables = rawTables.filter(tableName => tableName !== '_metadata'); // Eksplicitno ukloni _metadata
    const totalRecords = _metadata?.total_records || Object.values(actualData).reduce((sum, table) => sum + (Array.isArray(table) ? table.length : 0), 0);
    
    const newEntry = {
      id: Date.now(),
      name: `Backup_${new Date().toLocaleDateString('sr-RS')}_${new Date().toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' })}`,
      timestamp: new Date().toISOString(),
      tables: tables,
      totalRecords: totalRecords,
      fileSize: formatFileSize(backupSize),
      fileSizeBytes: backupSize,
      data: backupInfo // Sačuvaj i podatke za download
    };
    
    history.push(newEntry);
    localStorage.setItem('backupHistory', JSON.stringify(history.slice(-20))); // Čuvaj poslednih 20
    loadBackupHistory();
  };

  // Obriši backup iz istorije
  const deleteBackupFromHistory = (backupId) => {
    const history = JSON.parse(localStorage.getItem('backupHistory') || '[]');
    const updatedHistory = history.filter(backup => backup.id !== backupId);
    localStorage.setItem('backupHistory', JSON.stringify(updatedHistory));
    loadBackupHistory();
    setShowDeleteBackupModal(false);
    setBackupToDelete(null);
  };

  // Download backup iz istorije
  const downloadBackupFromHistory = (backup) => {
    try {
      const dataStr = JSON.stringify(backup.data || backup, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = backup.name || `backup_${new Date(backup.timestamp).toLocaleDateString('sr-RS')}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      setProcessStatus('✅ Backup preuzet uspešno!');
      setTimeout(() => setProcessStatus(''), 3000);
    } catch (error) {
      console.error('Greška pri preuzimanju backup-a:', error);
      setProcessStatus('❌ Greška pri preuzimanju backup-a');
      setTimeout(() => setProcessStatus(''), 3000);
    }
  };

  // Kreiraj kompletni backup
  const createFullBackup = async () => {
    setIsProcessing(true);
    setProcessStatus('🔄 Kreiranje kompletnog backup-a...');
    
    try {
      const backup = {};
      let totalRecords = 0;

      for (const table of availableTables) {
        if (selectedTables[table.key]) {
          setProcessStatus(`📊 Backup tabele: ${table.name}...`);
          const { data, error } = await supabase.from(table.key).select('*');
          
          if (error) throw error;
          
          backup[table.key] = data;
          totalRecords += data.length;
          
          // Kratka pauza da se vidi progres
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Dodaj metadata
      backup._metadata = {
        created_at: new Date().toISOString(),
        version: '1.0',
        total_records: totalRecords,
        tables: Object.keys(backup).filter(key => key !== '_metadata')
      };

      setBackupData(backup);
      saveToBackupHistory(backup);
      
      setProcessStatus(`✅ Backup kreiran! Ukupno ${totalRecords} zapisa`);
      
      // Automatski download
      downloadBackup(backup);
      
      // Clear status nakon 3 sekunde i refresh istoriju
      setTimeout(() => {
        setProcessStatus('');
        loadBackupHistory(); // Force refresh
      }, 3000);
      
    } catch (error) {
      console.error('Backup error:', error);
      setProcessStatus(`❌ Greška: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Download backup kao JSON fajl
  const downloadBackup = (data = backupData) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `supabase-backup-${timestamp}.json`;
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Restore backup iz fajla
  const handleFileRestore = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const backupData = JSON.parse(e.target.result);
        await restoreFromBackup(backupData);
      } catch (error) {
        setProcessStatus(`❌ Neispravna backup datoteka: ${error.message}`);
      }
    };
    reader.readAsText(file);
  };

  // Restore podatke u bazu
  const restoreFromBackup = async (data) => {
    setIsProcessing(true);
    setProcessStatus('🔄 Vraćanje backup-a u bazu...');

    try {
      let totalRestored = 0;

      for (const [tableName, records] of Object.entries(data)) {
        if (tableName === '_metadata') continue;
        if (!selectedTables[tableName]) continue;

        setProcessStatus(`📥 Vraćanje tabele: ${tableName} (${records.length} zapisa)...`);

        // Umetni podatke u batch-ovima od 100
        const batchSize = 100;
        for (let i = 0; i < records.length; i += batchSize) {
          const batch = records.slice(i, i + batchSize);
          const { error } = await supabase.from(tableName).upsert(batch);
          
          if (error) throw error;
          totalRestored += batch.length;
          
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      setProcessStatus(`✅ Backup vraćen! ${totalRestored} zapisa uspešno vraćeno`);
      
    } catch (error) {
      console.error('Restore error:', error);
      setProcessStatus(`❌ Greška pri vraćanju: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Obriši sve podatke iz tabele
  const deleteTableData = async (tableName) => {
    setIsProcessing(true);
    setProcessStatus(`🗑️ Brisanje podataka iz tabele: ${tableName}...`);

    try {
      // Prvo preuzmi sve ID-jeve
      const { data: records, error: fetchError } = await supabase
        .from(tableName)
        .select('id');

      if (fetchError) throw fetchError;

      if (records.length === 0) {
        setProcessStatus(`ℹ️ Tabela ${tableName} je već prazna`);
        setIsProcessing(false);
        return;
      }

      // Obriši u batch-ovima
      const batchSize = 100;
      let deletedCount = 0;

      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        const ids = batch.map(record => record.id);
        
        const { error } = await supabase
          .from(tableName)
          .delete()
          .in('id', ids);

        if (error) throw error;
        
        deletedCount += ids.length;
        setProcessStatus(`🗑️ Obrisano ${deletedCount}/${records.length} zapisa iz ${tableName}...`);
        
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      setProcessStatus(`✅ Uspešno obrisano ${deletedCount} zapisa iz tabele ${tableName}`);
      
    } catch (error) {
      console.error('Delete error:', error);
      setProcessStatus(`❌ Greška pri brisanju: ${error.message}`);
    } finally {
      setIsProcessing(false);
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  };

  // Preuzmi statistike tabela
  const [tableStats, setTableStats] = useState({});
  
  useEffect(() => {
    const loadTableStats = async () => {
      const stats = {};
      for (const table of availableTables) {
        try {
          const { count, error } = await supabase
            .from(table.key)
            .select('*', { count: 'exact', head: true });
          
          if (!error) {
            stats[table.key] = count;
          }
        } catch (error) {
          stats[table.key] = 0;
        }
      }
      setTableStats(stats);
    };

    loadTableStats();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`p-4 sm:p-6 rounded-2xl ${
        isNightTheme ? 'bg-gray-800/50' : 'bg-white/50'
      } backdrop-blur-xl border ${
        isNightTheme ? 'border-gray-700' : 'border-white/20'
      } shadow-xl`}
    >
      {/* Header */}
      <motion.div 
        className="mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <motion.div 
          className="flex items-center gap-3 mb-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <motion.div
            whileHover={{ 
              scale: 1.1, 
              rotate: [0, -10, 10, -10, 0],
              transition: { duration: 0.5 }
            }}
            className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg"
          >
            <Settings className="w-6 h-6 text-white" />
          </motion.div>
          <div>
            <h2 className={`text-xl sm:text-2xl font-bold ${
              isNightTheme ? 'text-white' : 'text-gray-900'
            }`}>
              Sistem & Backup
            </h2>
            <p className={`text-sm ${
              isNightTheme ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Kompletno backup/restore rešenje za Supabase bazu
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Status */}
      <AnimatePresence>
        {processStatus && (
          <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`p-4 rounded-xl mb-6 border font-mono text-sm ${
              isProcessing 
                ? `${isNightTheme ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300' : 'bg-yellow-50 border-yellow-200 text-yellow-800'}` 
                : `${isNightTheme ? 'bg-green-500/10 border-green-500/30 text-green-300' : 'bg-green-50 border-green-200 text-green-800'}`
            }`}
          >
            <div className="flex items-center gap-2">
              {isProcessing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              {processStatus}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabela selekcija */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        data-backup-section
        className={`rounded-xl p-4 sm:p-6 mb-6 border ${
          isNightTheme ? 'bg-gray-700/30 border-gray-600' : 'bg-white/70 border-white/30'
        } backdrop-blur-sm`}
      >
        <motion.h3 
          className={`mb-4 font-bold text-lg flex items-center gap-2 ${
            isNightTheme ? 'text-white' : 'text-gray-900'
          }`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Database className="w-5 h-5 text-green-500" />
          Izbor tabela za backup/restore
        </motion.h3>
        
        <motion.div 
          className={`grid ${isTablet ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}
          variants={{
            show: {
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
          initial="hidden"
          animate="show"
        >
          {availableTables.map((table, index) => {
            const IconComponent = table.icon;
            const isSelected = selectedTables[table.key];
            
            return (
              <motion.div 
                key={table.key}
                variants={{
                  hidden: { opacity: 0, y: 20, scale: 0.95 },
                  show: { opacity: 1, y: 0, scale: 1 }
                }}
                whileHover={{ 
                  scale: 1.02, 
                  y: -2,
                  transition: { type: "spring", stiffness: 300 }
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedTables(prev => ({ ...prev, [table.key]: !prev[table.key] }))}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 relative ${
                  isSelected 
                    ? `${isNightTheme ? 'bg-blue-500/20 border-blue-400/50' : 'bg-blue-50 border-blue-300'} shadow-lg` 
                    : `${isNightTheme ? 'bg-gray-800/30 border-gray-600 hover:bg-gray-700/40' : 'bg-white/50 border-gray-200 hover:bg-white/80'}`
                } hover:shadow-md`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <motion.div 
                    className={`p-2 rounded-lg bg-gradient-to-r ${table.color}`}
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.3 }}
                  >
                    <IconComponent className="w-4 h-4 text-white" />
                  </motion.div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <strong className={`${isNightTheme ? 'text-white' : 'text-gray-900'}`}>
                        {table.name}
                      </strong>
                      <StatusBadge type={isSelected ? 'success' : 'info'}>
                        {tableStats[table.key] || 0} zapisa
                      </StatusBadge>
                    </div>
                    <p className={`text-sm mt-1 ${
                      isNightTheme ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {table.description}
                    </p>
                  </div>
                  <motion.div
                    animate={{ scale: isSelected ? 1 : 0, opacity: isSelected ? 1 : 0 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </motion.div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </motion.div>

      {/* Backup operacije */}
      <motion.div 
        className={`grid ${isTablet ? 'grid-cols-2' : 'grid-cols-1'} gap-4 mb-6`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        
        {/* Kreiranje backup-a */}
        <motion.div 
          whileHover={{ scale: 1.02, y: -2 }}
          className={`rounded-xl p-6 border ${
            isNightTheme ? 'bg-blue-500/10 border-blue-500/30' : 'bg-blue-50 border-blue-200'
          } backdrop-blur-sm`}
        >
          <motion.h3 
            className={`font-bold text-lg mb-3 flex items-center gap-2 ${
              isNightTheme ? 'text-blue-300' : 'text-blue-800'
            }`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Download className="w-5 h-5" />
            Kreiranje Backup-a
          </motion.h3>
          <p className={`mb-4 text-sm ${
            isNightTheme ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Kreiraj backup izabranih tabela i preuzmi kao JSON fajl
          </p>
          <ActionButton
            onClick={createFullBackup}
            disabled={isProcessing || Object.values(selectedTables).every(v => !v)}
            loading={isProcessing}
            variant="primary"
          >
            {isProcessing ? 'Kreiram backup...' : '💾 Kreiraj i preuzmi backup'}
          </ActionButton>
        </motion.div>

        {/* Restore backup-a */}
        <motion.div 
          whileHover={{ scale: 1.02, y: -2 }}
          className={`rounded-xl p-6 border ${
            isNightTheme ? 'bg-green-500/10 border-green-500/30' : 'bg-green-50 border-green-200'
          } backdrop-blur-sm`}
        >
          <motion.h3 
            className={`font-bold text-lg mb-3 flex items-center gap-2 ${
              isNightTheme ? 'text-green-300' : 'text-green-800'
            }`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Upload className="w-5 h-5" />
            Restore Backup-a
          </motion.h3>
          <p className={`mb-4 text-sm ${
            isNightTheme ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Vrati podatke iz backup JSON fajla u bazu
          </p>
          <motion.input
            type="file"
            accept=".json"
            onChange={handleFileRestore}
            disabled={isProcessing}
            whileFocus={{ scale: 1.02 }}
            className={`w-full p-3 rounded-lg border-2 transition-all ${
              isNightTheme 
                ? 'bg-gray-800/50 border-gray-600 text-white focus:border-green-400' 
                : 'bg-white border-gray-300 text-gray-900 focus:border-green-500'
            } focus:outline-none cursor-pointer hover:border-green-400`}
          />
        </motion.div>
      </motion.div>

      {/* Brisanje podataka sekcija */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className={`rounded-xl p-6 mb-6 border ${
          isNightTheme ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'
        } backdrop-blur-sm`}
      >
        <motion.h3 
          className={`font-bold text-lg mb-3 flex items-center gap-2 ${
            isNightTheme ? 'text-red-300' : 'text-red-800'
          }`}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Trash2 className="w-5 h-5" />
          Brisanje Podataka
        </motion.h3>
        <p className={`mb-4 text-sm ${
          isNightTheme ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Obriši sve podatke iz izabranih tabela (OPREZ!)
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {availableTables.map(table => {
            if (!selectedTables[table.key]) return null;
            const IconComponent = table.icon;
            
            return (
              <motion.button
                key={table.key}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setDeleteTarget(table);
                  setShowDeleteModal(true);
                }}
                disabled={isProcessing}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                  isNightTheme ? 'bg-red-900/30 border-red-700/50 hover:bg-red-800/40' : 'bg-red-100 border-red-300 hover:bg-red-200'
                } disabled:opacity-50`}
              >
                <IconComponent className="w-4 h-4" />
                <span className={`text-sm font-medium ${
                  isNightTheme ? 'text-red-300' : 'text-red-800'
                }`}>
                  🗑️ {table.name}
                </span>
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      {/* Backup Istorija - Completely Redesigned */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className={`rounded-2xl p-6 mb-6 relative overflow-hidden ${
          isNightTheme 
            ? 'bg-gradient-to-br from-purple-900/20 via-purple-800/10 to-indigo-900/20 border border-purple-500/30' 
            : 'bg-gradient-to-br from-purple-50 via-white to-indigo-50 border border-purple-200/50'
        } backdrop-blur-sm shadow-xl`}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-full h-full"
               style={{
                 backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23a855f7' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                 backgroundSize: '60px 60px'
               }}
          />
        </div>

        {/* Header with Enhanced Design */}
        <motion.div 
          className="flex items-center justify-between mb-6 relative z-10"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="flex items-center gap-3">
            <motion.div
              className={`p-3 rounded-xl ${
                isNightTheme 
                  ? 'bg-gradient-to-br from-purple-600 to-indigo-600 shadow-purple-500/25' 
                  : 'bg-gradient-to-br from-purple-500 to-indigo-500 shadow-purple-500/25'
              } shadow-lg`}
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <History className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h3 className={`font-bold text-xl ${
                isNightTheme ? 'text-purple-300' : 'text-purple-800'
              }`}>
                Backup Istorija
              </h3>
              <p className={`text-sm ${
                isNightTheme ? 'text-purple-400/70' : 'text-purple-600/70'
              }`}>
                Upravljajte vašim backup fajlovima
              </p>
            </div>
          </div>
          
          {backupHistory.length > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.8, type: "spring" }}
              className="flex items-center gap-2"
            >
              <StatusBadge type="info">
                {backupHistory.length} backup{backupHistory.length !== 1 && 'ova'}
              </StatusBadge>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  const allHistory = JSON.parse(localStorage.getItem('backupHistory') || '[]');
                  localStorage.setItem('backupHistory', '[]');
                  loadBackupHistory();
                  setProcessStatus('🗑️ Sva istorija obrisana');
                  setTimeout(() => setProcessStatus(''), 3000);
                }}
                className={`p-2 rounded-lg transition-all ${
                  isNightTheme 
                    ? 'bg-red-600/20 hover:bg-red-500/30 border border-red-500/30 text-red-400' 
                    : 'bg-red-50 hover:bg-red-100 border border-red-200 text-red-600'
                }`}
                title="Obriši svu istoriju"
              >
                <Trash2 className="w-4 h-4" />
              </motion.button>
            </motion.div>
          )}
        </motion.div>

        {/* Empty State - Enhanced */}
        {backupHistory.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center py-12 relative z-10"
          >
            <motion.div
              animate={{ 
                y: [-10, 10, -10],
                rotateY: [0, 360, 0]
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="text-6xl mb-6 inline-block"
              style={{
                filter: 'drop-shadow(0 4px 8px rgba(168, 85, 247, 0.3))'
              }}
            >
              📚
            </motion.div>
            
            <div className="space-y-3 mb-8">
              <h4 className={`text-lg font-semibold ${
                isNightTheme ? 'text-purple-300' : 'text-purple-800'
              }`}>
                Nema backup-ova u istoriji
              </h4>
              <p className={`text-sm max-w-md mx-auto leading-relaxed ${
                isNightTheme ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Kreirajte prvi backup ili koristite test funkciju da vidite kako istorija funkcioniše
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={createTestBackup}
                className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center gap-2 ${
                  isNightTheme 
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/25' 
                    : 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-lg shadow-purple-500/25'
                }`}
              >
                <span className="text-lg">🧪</span>
                Kreiraj test backup
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => document.querySelector('[data-backup-section]')?.scrollIntoView({ behavior: 'smooth' })}
                className={`px-6 py-3 rounded-xl font-medium text-sm transition-all duration-300 border-2 flex items-center gap-2 ${
                  isNightTheme 
                    ? 'border-purple-500/50 hover:border-purple-400 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300' 
                    : 'border-purple-300 hover:border-purple-400 bg-purple-50 hover:bg-purple-100 text-purple-700'
                }`}
              >
                <Archive className="w-4 h-4" />
                Kreiraj pravi backup
              </motion.button>
            </div>
          </motion.div>
        ) : (
          /* Backup List - Beautiful but Working Design */
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {backupHistory.slice().reverse().map((backup, index) => {
              const isRecent = index === 0;
              const date = new Date(backup.timestamp);
              const relativeTime = getRelativeTime(backup.timestamp);
              
              return (
                <div 
                  key={backup.id}
                  className={`group p-5 rounded-xl border transition-all duration-300 hover:shadow-lg ${
                    isRecent
                      ? `${isNightTheme ? 'bg-gradient-to-r from-purple-900/60 to-indigo-900/60 border-purple-500/50 ring-2 ring-purple-500/30' : 'bg-gradient-to-r from-purple-100 to-indigo-100 border-purple-300/50 ring-2 ring-purple-300/50'} shadow-lg`
                      : `${isNightTheme ? 'bg-gray-800/40 border-gray-600/50 hover:bg-gray-700/50' : 'bg-white/80 border-gray-200/50 hover:bg-white/95'}`
                  } backdrop-blur-sm`}
                >
                  {/* New Badge */}
                  {isRecent && (
                    <div className="absolute -top-2 -right-2 z-10">
                      <span className="px-3 py-1 text-xs font-bold bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full shadow-lg border-2 border-white">
                        NAJNOVIJI
                      </span>
                    </div>
                  )}

                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className={`p-2.5 rounded-lg ${
                            isRecent 
                              ? 'bg-gradient-to-br from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/25' 
                              : `${isNightTheme ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`
                          }`}
                        >
                          <Archive className="w-4 h-4" />
                        </div>
                        
                        <div>
                          <h4 className={`font-semibold text-base ${
                            isNightTheme ? 'text-white' : 'text-gray-900'
                          }`}>
                            {backup.name || `Backup ${date.toLocaleDateString('sr-RS')}`}
                          </h4>
                          <div className="flex items-center gap-2 text-xs">
                            <span className={isNightTheme ? 'text-gray-400' : 'text-gray-500'}>
                              {date.toLocaleDateString('sr-RS', {
                                weekday: 'short',
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })} u {date.toLocaleTimeString('sr-RS', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              isNightTheme ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'
                            }`}>
                              {relativeTime}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Tables */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {backup.tables && backup.tables.length > 0 ? (
                          backup.tables.map(tableName => {
                            const table = availableTables.find(t => t.key === tableName);
                            if (!table) {
                              return null;
                            }
                            const IconComponent = table.icon;
                            
                            return (
                              <div
                                key={tableName}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:shadow-sm hover:scale-105 ${
                                  isNightTheme ? 'bg-gray-700/60 text-gray-300 border border-gray-600/50' : 'bg-gray-50 text-gray-700 border border-gray-200'
                                }`}
                              >
                                <IconComponent className="w-3.5 h-3.5" />
                                {table.name}
                              </div>
                            )
                          })
                        ) : (
                          <div className="text-xs text-gray-500">Nema tabela</div>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-6 text-sm">
                        <div className={`flex items-center gap-2 ${
                          isNightTheme ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          <Database className="w-4 h-4" />
                          <span className="font-medium">{backup.totalRecords}</span>
                          <span>zapisa</span>
                        </div>
                        <div className={`flex items-center gap-2 ${
                          isNightTheme ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          <HardDrive className="w-4 h-4" />
                          <span className="font-medium">{backup.fileSize || '0 KB'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 ml-4 opacity-60 group-hover:opacity-100 transition-opacity">
                      <ActionButton
                        onClick={() => downloadBackupFromHistory(backup)}
                        variant="primary"
                        size="sm"
                      >
                        <Download className="w-4 h-4" />
                      </ActionButton>
                      <ActionButton
                        onClick={() => {
                          setBackupToDelete(backup);
                          setShowDeleteBackupModal(true);
                        }}
                        variant="danger"
                        size="sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </ActionButton>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </motion.div>      {/* Delete confirmation modal */}
      {showDeleteModal && deleteTarget && (
        <ModernModal onClose={() => {setShowDeleteModal(false); setDeleteTarget(null);}}>
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>Potvrdi brisanje</h2>
            <p style={{ marginBottom: '1.5rem' }}>
              Da li ste sigurni da želite da obrišete <strong>SVE PODATKE</strong> iz tabele:
            </p>
            <div style={{ 
              padding: '1rem', 
              background: 'rgba(239, 68, 68, 0.1)', 
              borderRadius: '8px',
              marginBottom: '1.5rem',
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                {deleteTarget.icon} {deleteTarget.name}
              </div>
              <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                {tableStats[deleteTarget.key] || 0} zapisa će biti TRAJNO OBRISANO
              </div>
            </div>
            <p style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '2rem' }}>
              Ova akcija se NE MOŽE poništiti! Preporučujemo da prvo napravite backup.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => {setShowDeleteModal(false); setDeleteTarget(null);}}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'var(--text-on-dark)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                ❌ Otkaži
              </button>
              <button
                onClick={() => deleteTableData(deleteTarget.key)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(145deg, #ef4444, #dc2626)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                🗑️ DA, OBRIŠI SVE
              </button>
            </div>
          </div>
        </ModernModal>
      )}

      {/* Delete Backup Confirmation Modal */}
      {showDeleteBackupModal && (
        <ModernModal
          isOpen={showDeleteBackupModal}
          onClose={() => {
            setShowDeleteBackupModal(false);
            setBackupToDelete(null);
          }}
          title="Potvrdi brisanje backup-a"
        >
          <div style={{ padding: '1.5rem' }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1.5rem'
              }}
            >
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5, delay: 0.2 }}
                style={{
                  fontSize: '4rem',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 4px 8px rgba(239, 68, 68, 0.3))'
                }}
              >
                🗑️
              </motion.div>
              
              <div style={{ textAlign: 'center' }}>
                <h3 style={{
                  margin: '0 0 0.5rem 0',
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  color: '#ef4444'
                }}>
                  Brisanje backup-a
                </h3>
                <p style={{
                  margin: 0,
                  color: '#6b7280',
                  lineHeight: '1.5'
                }}>
                  Da li ste sigurni da želite da obrišete backup{' '}
                  <strong style={{ color: '#374151' }}>
                    {backupToDelete?.name}
                  </strong>?
                  <br />
                  <span style={{ fontSize: '0.875rem', fontStyle: 'italic' }}>
                    Ova akcija se ne može poništiti.
                  </span>
                </p>
              </div>
            </motion.div>

            <div style={{
              display: 'flex',
              gap: '1rem',
              marginTop: '2rem',
              justifyContent: 'center'
            }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setShowDeleteBackupModal(false);
                  setBackupToDelete(null);
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(145deg, #f3f4f6, #e5e7eb)',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}
              >
                Otkaži
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (backupToDelete) {
                    deleteBackupFromHistory(backupToDelete.id);
                  }
                  setShowDeleteBackupModal(false);
                  setBackupToDelete(null);
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(145deg, #ef4444, #dc2626)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
                }}
              >
                Obriši backup
              </motion.button>
            </div>
          </div>
        </ModernModal>
      )}
    </motion.div>
  );
};

export default SystemTab;