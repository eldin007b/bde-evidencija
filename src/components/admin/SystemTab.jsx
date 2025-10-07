import React, { useState, useEffect } from 'react';
import { supabase } from '../../db/supabaseClient';
import ModernModal from './ModernModal.jsx';
import { IconRefresh, IconUser, IconStats, IconSettings } from '../common/Icons.jsx';

const SystemTab = () => {
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

  // Lista svih tabela u bazi
  const availableTables = [
    { key: 'drivers', name: 'Vozači', icon: '👤', description: 'Svi vozači i njihovi podaci' },
    { key: 'deliveries', name: 'Dostave', icon: '📦', description: 'Svi podaci o dostavama' },
    { key: 'extra_rides', name: 'Extra vožnje', icon: '🚛', description: 'Odobrene extra vožnje' },
    { key: 'extra_rides_pending', name: 'Pending vožnje', icon: '⏳', description: 'Vožnje na čekanju' },
    { key: 'holidays', name: 'Praznici', icon: '🎉', description: 'Kalendar praznika' }
  ];

  useEffect(() => {
    loadBackupHistory();
  }, []);

  // Učitaj historiju backup-ova iz localStorage
  const loadBackupHistory = () => {
    const history = JSON.parse(localStorage.getItem('backupHistory') || '[]');
    setBackupHistory(history.slice(-10)); // Poslednih 10 backup-ova
  };

  // Sačuvaj backup u localStorage istoriju
  const saveToBackupHistory = (backupInfo) => {
    const history = JSON.parse(localStorage.getItem('backupHistory') || '[]');
    const newEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      tables: Object.keys(backupInfo),
      totalRecords: Object.values(backupInfo).reduce((sum, table) => sum + table.length, 0),
      ...backupInfo
    };
    history.push(newEntry);
    localStorage.setItem('backupHistory', JSON.stringify(history.slice(-20))); // Čuvaj poslednih 20
    loadBackupHistory();
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
    <div style={{ padding: '1.5rem', color: 'var(--text-on-dark)' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: '#44cadf', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <IconSettings size={24} />
          Sistem & Backup Upravljanje
        </h2>
        <p style={{ opacity: 0.8, margin: 0 }}>
          Kompletno backup/restore rešenje za Supabase bazu podataka
        </p>
      </div>

      {/* Status */}
      {processStatus && (
        <div style={{ 
          padding: '1rem', 
          background: isProcessing ? 'rgba(255, 193, 7, 0.1)' : 'rgba(34, 197, 94, 0.1)', 
          borderRadius: '8px', 
          marginBottom: '1.5rem',
          border: `1px solid ${isProcessing ? 'rgba(255, 193, 7, 0.2)' : 'rgba(34, 197, 94, 0.2)'}`,
          fontFamily: 'monospace'
        }}>
          {processStatus}
        </div>
      )}

      {/* Tabela selekcija */}
      <div style={{ 
        background: 'rgba(255, 255, 255, 0.05)', 
        borderRadius: '12px', 
        padding: '1.5rem', 
        marginBottom: '2rem',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <h3 style={{ marginBottom: '1rem', color: '#22c55e' }}>📊 Izbor tabela za backup/restore</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {availableTables.map(table => (
            <div 
              key={table.key}
              style={{ 
                padding: '1rem', 
                background: selectedTables[table.key] ? 'rgba(68, 202, 223, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                borderRadius: '8px',
                border: `1px solid ${selectedTables[table.key] ? 'rgba(68, 202, 223, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => setSelectedTables(prev => ({ ...prev, [table.key]: !prev[table.key] }))}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem' }}>{table.icon}</span>
                <strong>{table.name}</strong>
                <span style={{ 
                  marginLeft: 'auto', 
                  padding: '0.2rem 0.5rem', 
                  background: 'rgba(255, 255, 255, 0.1)', 
                  borderRadius: '4px', 
                  fontSize: '0.8rem' 
                }}>
                  {tableStats[table.key] || 0} zapisa
                </span>
              </div>
              <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                {table.description}
              </div>
              <div style={{ 
                position: 'absolute', 
                top: '0.5rem', 
                right: '0.5rem',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: selectedTables[table.key] ? '#22c55e' : 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                color: 'white'
              }}>
                {selectedTables[table.key] ? '✓' : ''}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Backup operacije */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Kreiranje backup-a */}
        <div style={{ 
          background: 'rgba(68, 202, 223, 0.1)', 
          borderRadius: '12px', 
          padding: '1.5rem',
          border: '1px solid rgba(68, 202, 223, 0.2)'
        }}>
          <h3 style={{ color: '#44cadf', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📥 Kreiranje Backup-a
          </h3>
          <p style={{ opacity: 0.8, marginBottom: '1rem', fontSize: '0.9rem' }}>
            Kreiraj backup izabranih tabela i preuzmi kao JSON fajl
          </p>
          <button 
            onClick={createFullBackup}
            disabled={isProcessing || Object.values(selectedTables).every(v => !v)}
            style={{ 
              width: '100%',
              padding: '0.75rem',
              background: 'linear-gradient(145deg, #44cadf, #22d3ee)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              opacity: isProcessing ? 0.6 : 1
            }}
          >
            {isProcessing ? '🔄 Kreiram backup...' : '💾 Kreiraj i preuzmi backup'}
          </button>
        </div>

        {/* Restore backup-a */}
        <div style={{ 
          background: 'rgba(34, 197, 94, 0.1)', 
          borderRadius: '12px', 
          padding: '1.5rem',
          border: '1px solid rgba(34, 197, 94, 0.2)'
        }}>
          <h3 style={{ color: '#22c55e', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📤 Restore Backup-a
          </h3>
          <p style={{ opacity: 0.8, marginBottom: '1rem', fontSize: '0.9rem' }}>
            Vrati podatke iz backup JSON fajla u bazu
          </p>
          <input
            type="file"
            accept=".json"
            onChange={handleFileRestore}
            disabled={isProcessing}
            style={{ 
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'var(--text-on-dark)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          />
        </div>

        {/* Brisanje podataka */}
        <div style={{ 
          background: 'rgba(239, 68, 68, 0.1)', 
          borderRadius: '12px', 
          padding: '1.5rem',
          border: '1px solid rgba(239, 68, 68, 0.2)'
        }}>
          <h3 style={{ color: '#ef4444', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🗑️ Brisanje Podataka
          </h3>
          <p style={{ opacity: 0.8, marginBottom: '1rem', fontSize: '0.9rem' }}>
            Obriši sve podatke iz izabranih tabela (OPREZ!)
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {availableTables.map(table => (
              selectedTables[table.key] && (
                <button
                  key={table.key}
                  onClick={() => {
                    setDeleteTarget(table);
                    setShowDeleteModal(true);
                  }}
                  disabled={isProcessing}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'rgba(239, 68, 68, 0.2)',
                    color: '#ef4444',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  🗑️ {table.name}
                </button>
              )
            ))}
          </div>
        </div>
      </div>

      {/* Backup istorija */}
      <div style={{ 
        background: 'rgba(255, 255, 255, 0.05)', 
        borderRadius: '12px', 
        padding: '1.5rem',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <h3 style={{ color: '#a855f7', marginBottom: '1rem' }}>📚 Backup Istorija</h3>
        {backupHistory.length === 0 ? (
          <p style={{ opacity: 0.6, fontStyle: 'italic' }}>Nema prethodnih backup-ova</p>
        ) : (
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {backupHistory.slice().reverse().map(backup => (
              <div key={backup.id} style={{ 
                padding: '0.75rem', 
                background: 'rgba(255, 255, 255, 0.05)', 
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                    {new Date(backup.timestamp).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                    {backup.tables.join(', ')} • {backup.totalRecords} zapisa
                  </div>
                </div>
                <button
                  onClick={() => downloadBackup(backup)}
                  style={{
                    padding: '0.4rem 0.8rem',
                    background: 'rgba(168, 85, 247, 0.2)',
                    color: '#a855f7',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  💾 Download
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
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
    </div>
  );
};

export default SystemTab;