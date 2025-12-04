import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Edit, Trash2, Play, Pause, Upload, Eye, EyeOff, Copy, Shield, Clock, Target, XCircle } from 'lucide-react';
import ActionButton from '../common/ActionButton';
import StatusBadge from '../common/StatusBadge';
import EmptyState from '../common/EmptyState';
import ModernModal from './ModernModal';
import useDrivers from '../../hooks/useDrivers';

const DriversTab = () => {
  const [currentTheme, setCurrentTheme] = useState('default');
  
  // Theme logic
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
  
  const { 
    drivers, 
    loading, 
    error, 
    addDriver, 
    updateDriver, 
    deleteDriver, 
    toggleDriverStatus 
  } = useDrivers();
  
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({});
  
  // Form podataci
  const [formData, setFormData] = useState({
    ime: '',
    tura: '',
    aktivan: true,
    target_per_day: 0,
    password_hash: '',
    role: 'driver'
  });

  const [copiedPassword, setCopiedPassword] = useState(null);

  const copyToClipboard = async (text, driverId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPassword(driverId);
      setTimeout(() => setCopiedPassword(null), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const togglePasswordVisibility = (driverId) => {
    setShowPasswords(prev => ({
      ...prev,
      [driverId]: !prev[driverId]
    }));
  };

  const decodePassword = (passwordHash) => {
    try {
      // Dekoduj Base64 password
      return atob(passwordHash);
    } catch (error) {
      // Ako nije Base64, vrati originalni
      return passwordHash;
    }
  };

  const encodePassword = (password) => {
    try {
      // Enkoduj password u Base64
      return btoa(password);
    } catch (error) {
      // Ako greška, vrati originalni
      return password;
    }
  };

  const handleAddDriver = async () => {
    setFormLoading(true);
    try {
      // Enkoduj password prije slanja
      const driverDataToSend = {
        ...formData,
        password_hash: formData.password_hash ? encodePassword(formData.password_hash) : ''
      };
      await addDriver(driverDataToSend);
      setAddModalVisible(false);
      setFormData({
        ime: '',
        tura: '',
        aktivan: true,
        target_per_day: 0,
        password_hash: '',
        role: 'driver'
      });
    } catch (error) {
      console.error('Greška pri dodavanju vozača:', error);
      alert('Greška pri dodavanju vozača: ' + error.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditDriver = async () => {
    if (!selectedDriver) return;
    setFormLoading(true);
    try {
      // Enkoduj password prije slanja (samo ako je novo unesen)
      const driverDataToSend = {
        ...formData,
        password_hash: formData.password_hash ? encodePassword(formData.password_hash) : selectedDriver.password_hash
      };
      await updateDriver(selectedDriver.id, driverDataToSend);
      setEditModalVisible(false);
      setSelectedDriver(null);
    } catch (error) {
      console.error('Greška pri ažuriranju vozača:', error);
      alert('Greška pri ažuriranju vozača: ' + error.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteDriver = async (driver) => {
    if (window.confirm(`Da li ste sigurni da želite obrisati vozača ${driver.ime}?`)) {
      try {
        await deleteDriver(driver.id);
      } catch (error) {
        console.error('Greška pri brisanju vozača:', error);
        alert('Greška pri brisanju vozača: ' + error.message);
      }
    }
  };

  const handleToggleStatus = async (driver) => {
    try {
      await toggleDriverStatus(driver.id, driver.aktivan);
    } catch (error) {
      console.error('Greška pri mijenjanju statusa:', error);
      alert('Greška pri mijenjanju statusa: ' + error.message);
    }
  };

  const openEditModal = (driver) => {
    setSelectedDriver(driver);
    setFormData({
      ime: driver.ime,
      tura: driver.tura,
      aktivan: driver.aktivan,
      target_per_day: driver.target_per_day || 0,
      password_hash: driver.password_hash ? decodePassword(driver.password_hash) : '',
      role: driver.role || 'driver'
    });
    setEditModalVisible(true);
  };

  const openAddModal = () => {
    setFormData({
      ime: '',
      tura: '',
      aktivan: true,
      target_per_day: 0,
      password_hash: '',
      role: 'driver'
    });
    setAddModalVisible(true);
  };

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600"
          >
            <Users className="w-6 h-6 text-white" />
          </motion.div>
          <div>
            <h2 className={`text-xl sm:text-2xl font-bold ${isNightTheme ? 'text-white' : 'text-gray-800'}`}>
              Upravljanje vozačima
            </h2>
            <p className={`text-sm ${isNightTheme ? 'text-gray-400' : 'text-gray-600'}`}>
              Upravljaj vozačima i njihovim dozvolama
            </p>
          </div>
        </div>
        
        <motion.button
          onClick={openAddModal}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
            isNightTheme
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500'
              : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-400 hover:to-indigo-500'
          } shadow-lg`}
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Dodaj vozača</span>
          <span className="sm:hidden">Dodaj</span>
        </motion.button>
      </div>

      {/* Statistika */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className={`p-2 sm:p-4 rounded-xl ${
            isNightTheme ? 'bg-green-900/30 border-green-700/50' : 'bg-green-50 border-green-200/50'
          } border`}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
              <Users className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
            </div>
            <div>
              <p className={`text-xs ${isNightTheme ? 'text-gray-400' : 'text-gray-600'}`}>Aktivni</p>
              <p className={`text-sm sm:text-lg font-bold ${isNightTheme ? 'text-green-400' : 'text-green-600'}`}>
                {drivers.filter(d => d.aktivan).length}
              </p>
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className={`p-2 sm:p-4 rounded-xl ${
            isNightTheme ? 'bg-yellow-900/30 border-yellow-700/50' : 'bg-yellow-50 border-yellow-200/50'
          } border`}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500">
              <Pause className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
            </div>
            <div>
              <p className={`text-xs ${isNightTheme ? 'text-gray-400' : 'text-gray-600'}`}>Neaktivni</p>
              <p className={`text-sm sm:text-lg font-bold ${isNightTheme ? 'text-yellow-400' : 'text-yellow-600'}`}>
                {drivers.filter(d => !d.aktivan).length}
              </p>
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className={`p-2 sm:p-4 rounded-xl ${
            isNightTheme ? 'bg-blue-900/30 border-blue-700/50' : 'bg-blue-50 border-blue-200/50'
          } border`}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500">
              <Users className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
            </div>
            <div>
              <p className={`text-xs ${isNightTheme ? 'text-gray-400' : 'text-gray-600'}`}>Ukupno</p>
              <p className={`text-sm sm:text-lg font-bold ${isNightTheme ? 'text-blue-400' : 'text-blue-600'}`}>
                {drivers.length}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-4 rounded-xl mb-6 ${
            isNightTheme ? 'bg-red-900/30 border-red-700/50' : 'bg-red-50 border-red-200/50'
          } border`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-red-600">
              <XCircle className="w-4 h-4 text-white" />
            </div>
            <p className={`text-sm font-medium ${isNightTheme ? 'text-red-400' : 'text-red-600'}`}>
              Greška: {error.message}
            </p>
          </div>
        </motion.div>
      )}
      
      {loading ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-12"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className={`w-12 h-12 mb-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center`}
          >
            <Users className="w-6 h-6 text-white" />
          </motion.div>
          <span className={`text-lg ${isNightTheme ? 'text-gray-300' : 'text-gray-600'}`}>
            Učitavanje vozača...
          </span>
        </motion.div>
      ) : drivers.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-12"
        >
          <div className={`w-16 h-16 mb-4 rounded-xl ${
            isNightTheme ? 'bg-gray-700' : 'bg-gray-100'
          } flex items-center justify-center`}>
            <Users className={`w-8 h-8 ${isNightTheme ? 'text-gray-400' : 'text-gray-500'}`} />
          </div>
          <h3 className={`text-lg font-semibold mb-2 ${isNightTheme ? 'text-gray-300' : 'text-gray-700'}`}>
            Nema vozača
          </h3>
          <p className={`text-sm ${isNightTheme ? 'text-gray-500' : 'text-gray-600'}`}>
            Nema registrovanih vozača u sistemu
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {drivers.map((driver, index) => (
            <motion.div 
              key={driver.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-4 sm:p-5 rounded-xl ${
                driver.aktivan 
                  ? isNightTheme ? 'bg-green-900/30 border-green-700/50' : 'bg-green-50 border-green-200/50'
                  : isNightTheme ? 'bg-yellow-900/30 border-yellow-700/50' : 'bg-yellow-50 border-yellow-200/50'
              } border backdrop-blur-sm hover:scale-[1.02] transition-all duration-200`}
            >
              {/* Header sa imenom i statusom */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${
                    driver.aktivan ? 'from-green-500 to-emerald-500' : 'from-yellow-500 to-orange-500'
                  }`}>
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className={`font-semibold ${isNightTheme ? 'text-white' : 'text-gray-800'}`}>
                      {driver.ime}
                    </h3>
                    <p className={`text-xs ${isNightTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                      Tura: {driver.tura}
                    </p>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-lg text-xs font-medium ${
                  driver.aktivan 
                    ? isNightTheme ? 'bg-green-700/50 text-green-300' : 'bg-green-100 text-green-700'
                    : isNightTheme ? 'bg-yellow-700/50 text-yellow-300' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {driver.aktivan ? 'Aktivan' : 'Neaktivan'}
                </div>
              </div>

              {/* Detalji */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <Target className={`w-4 h-4 ${isNightTheme ? 'text-gray-400' : 'text-gray-600'}`} />
                  <span className={`text-sm ${isNightTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                    Target: <strong>{driver.target_per_day || 0}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className={`w-4 h-4 ${isNightTheme ? 'text-gray-400' : 'text-gray-600'}`} />
                  <span className={`text-sm ${isNightTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                    {driver.role === 'admin' ? 'Admin' : 'Vozač'}
                  </span>
                </div>
                {driver.last_login && (
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <Clock className={`w-4 h-4 ${isNightTheme ? 'text-gray-400' : 'text-gray-600'}`} />
                    <span className={`text-sm ${isNightTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                      Zadnji login: {new Date(driver.last_login).toLocaleDateString('bs-BA')}
                    </span>
                  </div>
                )}
              </div>

              {/* Password sekcija */}
              {driver.password_hash && (
                <div className={`p-3 rounded-lg mb-4 ${
                  isNightTheme ? 'bg-gray-800/50' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${isNightTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                      Password: {showPasswords[driver.id] ? decodePassword(driver.password_hash) : '••••••••'}
                    </span>
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => togglePasswordVisibility(driver.id)}
                        className={`p-1 rounded ${
                          isNightTheme ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                        }`}
                      >
                        {showPasswords[driver.id] ? 
                          <EyeOff className="w-4 h-4" /> : 
                          <Eye className="w-4 h-4" />
                        }
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => copyToClipboard(decodePassword(driver.password_hash), driver.id)}
                        className={`p-1 rounded ${
                          isNightTheme ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                        }`}
                      >
                        {copiedPassword === driver.id ? 
                          <span className="text-xs text-green-500">✓</span> : 
                          <Copy className="w-4 h-4" />
                        }
                      </motion.button>
                    </div>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {/* Upload button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => document.getElementById(`upload-input-${driver.id}`).click()}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isNightTheme
                      ? 'bg-green-700/50 text-green-300 hover:bg-green-600/50'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span className="hidden sm:inline">Upload</span>
                </motion.button>

                {/* Edit button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => openEditModal(driver)}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isNightTheme
                      ? 'bg-blue-700/50 text-blue-300 hover:bg-blue-600/50'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  <Edit className="w-4 h-4" />
                  <span className="hidden sm:inline">Uredi</span>
                </motion.button>

                {/* Status toggle button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleToggleStatus(driver)}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    driver.aktivan 
                      ? isNightTheme
                        ? 'bg-yellow-700/50 text-yellow-300 hover:bg-yellow-600/50'
                        : 'bg-yellow-500 text-white hover:bg-yellow-600'
                      : isNightTheme
                        ? 'bg-green-700/50 text-green-300 hover:bg-green-600/50'
                        : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  {driver.aktivan ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span className="hidden sm:inline">{driver.aktivan ? 'Pauza' : 'Aktiviraj'}</span>
                </motion.button>

                {/* Delete button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleDeleteDriver(driver)}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isNightTheme
                      ? 'bg-red-700/50 text-red-300 hover:bg-red-600/50'
                      : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Obriši</span>
                </motion.button>
              </div>

              {/* Hidden file input */}
              <input
                id={`upload-input-${driver.id}`}
                type="file"
                accept="application/pdf"
                multiple
                className="hidden"
                onChange={async (e) => {
                  const files = Array.from(e.target.files);
                  if (!files.length) return;
                  const { uploadPayrollFile } = await import('../../services/SupabasePayrollService');
                  const { extractNetoBrutoFromPDF } = await import('../../utils/pdfPayrollParser');
                  const { supabase } = await import('../../db/supabaseClient');
                  const folderName = driver.ime.trim().toLowerCase();
                  let successCount = 0;
                  let failCount = 0;
                  for (const file of files) {
                    const result = await uploadPayrollFile(folderName, file);
                    if (!result) {
                      failCount++;
                      console.error(`Greška pri uploadu platne liste ${file.name}! Provjeri konekciju, dozvole ili ime fajla.`);
                      continue;
                    }
                    try {
                      const arrayBuffer = await file.arrayBuffer();
                      const { neto, bruto } = await extractNetoBrutoFromPDF(arrayBuffer);
                      await supabase.from('payroll_amounts').upsert([{
                        driver_name: folderName,
                        file_name: file.name,
                        neto,
                        bruto,
                        created_at: new Date()
                      }]);
                      successCount++;
                    } catch (err) {
                      failCount++;
                      console.error('Greška pri parsiranju PDF-a ili upisu u payroll_amounts:', err);
                    }
                  }
                  if (typeof window.refreshPayrollFiles === 'function') {
                    window.refreshPayrollFiles(folderName);
                  }
                  if (successCount > 0 && failCount === 0) {
                    alert(`Svi fajlovi (${successCount}) su uspješno uploadovani za vozača ${driver.ime} (tura ${driver.tura})!`);
                  } else if (successCount > 0 && failCount > 0) {
                    alert(`Upload završen: ${successCount} fajlova uspješno, ${failCount} grešaka.`);
                  } else {
                    alert('Nijedan fajl nije uspješno uploadovan!');
                  }
                  e.target.value = '';
                }}
              />
            </motion.div>
          ))}
        </div>
      )}
      
      {/* Modal za dodavanje korisnika */}
      <ModernModal 
        open={addModalVisible} 
        title="Dodaj novog vozača" 
        onClose={() => setAddModalVisible(false)} 
        onSubmit={handleAddDriver} 
        loading={formLoading}
        submitLabel="Dodaj vozača"
        closeLabel="Otkaži"
      >
        <div className="space-y-3 sm:space-y-5">
          {/* Desktop: 2 kolone layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Ime korisnika i Aktivan checkbox - u istom redu */}
            <div className="space-y-1 sm:col-span-2">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                <div className="flex-1">
                  <label className={`flex items-center gap-2 text-sm font-medium ${
                    isNightTheme ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    <Users className="w-4 h-4" />
                    Ime vozača
                  </label>
                  <input
                    type="text"
                    value={formData.ime}
                    onChange={(e) => setFormData({...formData, ime: e.target.value})}
                    placeholder="Unesite ime vozača"
                    required
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                      isNightTheme 
                        ? 'bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400' 
                        : 'bg-white/80 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                  />
                </div>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                  isNightTheme 
                    ? 'bg-gray-800/30 border-gray-600' 
                    : 'bg-gray-50 border-gray-200'
                } sm:flex-shrink-0`}>
                  <input
                    type="checkbox"
                    id="addActiveCheckbox"
                    checked={formData.aktivan}
                    onChange={(e) => setFormData({...formData, aktivan: e.target.checked})}
                    className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                  />
                  <label 
                    htmlFor="addActiveCheckbox" 
                    className={`text-sm font-medium cursor-pointer whitespace-nowrap ${
                      isNightTheme ? 'text-gray-200' : 'text-gray-700'
                    }`}
                  >
                    Aktivan vozač
                  </label>
                </div>
              </div>
            </div>
            
            {/* Tura */}
            <div className="space-y-1">
              <label className={`flex items-center gap-2 text-sm font-medium ${
                isNightTheme ? 'text-gray-200' : 'text-gray-700'
              }`}>
                <Target className="w-4 h-4" />
                Tura
              </label>
              <input
                type="text"
                value={formData.tura}
                onChange={(e) => setFormData({...formData, tura: e.target.value})}
                placeholder="npr. A1, B2, C3..."
                required
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                  isNightTheme 
                    ? 'bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400' 
                    : 'bg-white/80 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              />
            </div>
            
            {/* Target po danu */}
            <div className="space-y-1">
              <label className={`flex items-center gap-2 text-sm font-medium ${
                isNightTheme ? 'text-gray-200' : 'text-gray-700'
              }`}>
                <Clock className="w-4 h-4" />
                Target po danu
              </label>
              <input
                type="number"
                value={formData.target_per_day}
                onChange={(e) => setFormData({...formData, target_per_day: parseInt(e.target.value) || 0})}
                placeholder="0"
                min="0"
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                  isNightTheme 
                    ? 'bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400' 
                    : 'bg-white/80 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              />
            </div>
            
            {/* Uloga */}
            <div className="space-y-1">
              <label className={`flex items-center gap-2 text-sm font-medium ${
                isNightTheme ? 'text-gray-200' : 'text-gray-700'
              }`}>
                <Shield className="w-4 h-4" />
                Uloga
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                  isNightTheme 
                    ? 'bg-gray-800/50 border-gray-600 text-white focus:border-blue-400' 
                    : 'bg-white/80 border-gray-200 text-gray-900 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              >
                <option value="driver">Vozač</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            
            {/* Password */}
            <div className="space-y-1">
              <label className={`flex items-center gap-2 text-sm font-medium ${
                isNightTheme ? 'text-gray-200' : 'text-gray-700'
              }`}>
                <Eye className="w-4 h-4" />
                Lozinka
              </label>
              <input
                type="password"
                value={formData.password_hash}
                onChange={(e) => setFormData({...formData, password_hash: e.target.value})}
                placeholder="Unesite lozinku"
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                  isNightTheme 
                    ? 'bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400' 
                    : 'bg-white/80 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              />
            </div>
          </div>
        </div>
      </ModernModal>

      {/* Modal za uređivanje korisnika */}
      <ModernModal 
        open={editModalVisible} 
        title="Uredi vozača" 
        onClose={() => setEditModalVisible(false)} 
        onSubmit={handleEditDriver} 
        loading={formLoading}
        submitLabel="Sačuvaj promjene"
        closeLabel="Otkaži"
      >
        <div className="space-y-3 sm:space-y-5">
          {/* Desktop: 2 kolone layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Ime korisnika i Aktivan checkbox - u istom redu */}
            <div className="space-y-1 sm:col-span-2">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                <div className="flex-1">
                  <label className={`flex items-center gap-2 text-sm font-medium ${
                    isNightTheme ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    <Users className="w-4 h-4" />
                    Ime vozača
                  </label>
                  <input
                    type="text"
                    value={formData.ime}
                    onChange={(e) => setFormData({...formData, ime: e.target.value})}
                    placeholder="Unesite ime vozača"
                    required
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                      isNightTheme 
                        ? 'bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400' 
                        : 'bg-white/80 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                  />
                </div>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                  isNightTheme 
                    ? 'bg-gray-800/30 border-gray-600' 
                    : 'bg-gray-50 border-gray-200'
                } sm:flex-shrink-0`}>
                  <input
                    type="checkbox"
                    id="editActiveCheckbox"
                    checked={formData.aktivan}
                    onChange={(e) => setFormData({...formData, aktivan: e.target.checked})}
                    className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                  />
                  <label 
                    htmlFor="editActiveCheckbox" 
                    className={`text-sm font-medium cursor-pointer whitespace-nowrap ${
                      isNightTheme ? 'text-gray-200' : 'text-gray-700'
                    }`}
                  >
                    Aktivan vozač
                  </label>
                </div>
              </div>
            </div>
            
            {/* Tura */}
            <div className="space-y-1">
              <label className={`flex items-center gap-2 text-sm font-medium ${
                isNightTheme ? 'text-gray-200' : 'text-gray-700'
              }`}>
                <Target className="w-4 h-4" />
                Tura
              </label>
              <input
                type="text"
                value={formData.tura}
                onChange={(e) => setFormData({...formData, tura: e.target.value})}
                placeholder="npr. A1, B2, C3..."
                required
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                  isNightTheme 
                    ? 'bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400' 
                    : 'bg-white/80 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              />
            </div>
            
            {/* Target po danu */}
            <div className="space-y-1">
              <label className={`flex items-center gap-2 text-sm font-medium ${
                isNightTheme ? 'text-gray-200' : 'text-gray-700'
              }`}>
                <Clock className="w-4 h-4" />
                Target po danu
              </label>
              <input
                type="number"
                value={formData.target_per_day}
                onChange={(e) => setFormData({...formData, target_per_day: parseInt(e.target.value) || 0})}
                placeholder="0"
                min="0"
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                  isNightTheme 
                    ? 'bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400' 
                    : 'bg-white/80 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              />
            </div>
            
            {/* Uloga */}
            <div className="space-y-1">
              <label className={`flex items-center gap-2 text-sm font-medium ${
                isNightTheme ? 'text-gray-200' : 'text-gray-700'
              }`}>
                <Shield className="w-4 h-4" />
                Uloga
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                  isNightTheme 
                    ? 'bg-gray-800/50 border-gray-600 text-white focus:border-blue-400' 
                    : 'bg-white/80 border-gray-200 text-gray-900 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              >
                <option value="driver">Vozač</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            
            {/* Password */}
            <div className="space-y-1">
              <label className={`flex items-center gap-2 text-sm font-medium ${
                isNightTheme ? 'text-gray-200' : 'text-gray-700'
              }`}>
                <Eye className="w-4 h-4" />
                Lozinka
              </label>
              <input
                type="password"
                value={formData.password_hash}
                onChange={(e) => setFormData({...formData, password_hash: e.target.value})}
                placeholder="Ostavite prazno da ne mijenjate lozinku"
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                  isNightTheme 
                    ? 'bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400' 
                    : 'bg-white/80 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              />
            </div>
          </div>
        </div>
      </ModernModal>
    </motion.div>
  );
};

export default DriversTab;
