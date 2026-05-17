/* PRO VERSION DriversTab - FINAL */
import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Users, Plus, Edit, Trash2, Play, Pause, Upload,
  Eye, EyeOff, Copy, Shield, Clock, Target, XCircle,
  FolderOpen, Loader2, Calendar
} from "lucide-react";
import { toast } from "react-hot-toast";
import ModernModal from "./ModernModal";
import PayrollArchive from "./PayrollArchive";
import useDrivers from "../../hooks/useDrivers";

const normalizeDriverName = (name) => {
  if (!name) return "";
  return name
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d");
};

const DriversTab = () => {
  const [currentTheme, setCurrentTheme] = useState("default");

  useEffect(() => {
    const updateTheme = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 8) setCurrentTheme("sunrise");
      else if (hour >= 8 && hour < 12) setCurrentTheme("default");
      else if (hour >= 12 && hour < 17) setCurrentTheme("afternoon");
      else if (hour >= 17 && hour < 20) setCurrentTheme("evening");
      else setCurrentTheme("night");
    };
    updateTheme();
    const interval = setInterval(updateTheme, 60000);
    return () => clearInterval(interval);
  }, []);

  const isNightTheme = currentTheme === "night";

  const { drivers, loading, error, addDriver, updateDriver, deleteDriver, toggleDriverStatus } = useDrivers();

  const [selectedDriver, setSelectedDriver] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({});
  const [copiedPassword, setCopiedPassword] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [archiveCounts, setArchiveCounts] = useState({});
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [payrollArchiveDriver, setPayrollArchiveDriver] = useState(null);
  const [urlaubCounts, setUrlaubCounts] = useState({});
  const [statsLoading, setStatsLoading] = useState(false);
  const globalFileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    ime: "", tura: "", aktivan: true,
    target_per_day: 0, password_hash: "", role: "driver",
  });

  // ✅ Čita iz baze (ne Storage), filtrira admine
  const loadArchiveCounts = useCallback(async () => {
    setArchiveLoading(true);
    try {
      const { getArchiveCounts } = await import("../../services/SupabasePayrollService");
      const counts = await getArchiveCounts(
        drivers
          .filter(d => d.role !== "admin")
          .map(d => normalizeDriverName(d.ime))
      );
      setArchiveCounts(counts || {});
    } catch (err) {
      console.error("Greška pri učitavanju broja arhivskih fajlova", err);
    } finally {
      setArchiveLoading(false);
    }
  }, [drivers]);

  // ✅ Matchovanje po tura, filter start_date, preskoči admine
  const loadDriverStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const { supabase } = await import('../../db/supabaseClient');

      const { data: urlaubSettings, error: usError } = await supabase
        .from('urlaub_settings').select('*');
      if (usError) throw usError;

      const { data: urlaubMarks, error: umError } = await supabase
        .from('urlaub_marks').select('*');
      if (umError) throw umError;

      const urlaubs = {};
      urlaubSettings?.forEach(setting => {
        const code = String(setting.driver || "");
        const matchedDriver = drivers.find(d =>
          String(d.tura || "") === code && d.role !== "admin"
        );
        if (!matchedDriver) return;

        const name = normalizeDriverName(matchedDriver.ime);
        const startDate = new Date(setting.start_date);
        const today = new Date();
        const monthsWorked =
          (today.getFullYear() - startDate.getFullYear()) * 12 +
          (today.getMonth() - startDate.getMonth());
        const earned = (setting.start_days || 0) + (Math.max(0, monthsWorked) * 2);

        // ✅ Samo marks od start_date nadalje
        const used = urlaubMarks?.filter(m =>
          String(m.driver) === code &&
          (m.is_active !== undefined ? m.is_active : true) &&
          new Date(m.date) >= new Date(setting.start_date)
        ).length || 0;

        urlaubs[name] = earned - used;
      });
      setUrlaubCounts(urlaubs);

    } catch (err) {
      console.error("Greška pri učitavanju statistike vozača:", err);
    } finally {
      setStatsLoading(false);
    }
  }, [drivers]);

  useEffect(() => {
    if (drivers.length > 0) {
      loadArchiveCounts();
      loadDriverStats();
    }
  }, [drivers, loadArchiveCounts, loadDriverStats]);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      const { processCombinedPayroll } = await import("../../services/SupabasePayrollService");
      for (const file of files) await processCombinedPayroll(file);
      await loadArchiveCounts();
    } catch (err) {
      alert("Greška pri obradi platnih lista: " + err.message);
    } finally {
      setUploading(false);
      if (globalFileInputRef.current) globalFileInputRef.current.value = "";
    }
  };

  const copyToClipboard = async (text, driverId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPassword(driverId);
      setTimeout(() => setCopiedPassword(null), 2000);
    } catch (err) { console.error("Failed to copy", err); }
  };

  const togglePasswordVisibility = (driverId) =>
    setShowPasswords(prev => ({ ...prev, [driverId]: !prev[driverId] }));

  const decodePassword = (h) => { try { return atob(h); } catch { return h; } };
  const encodePassword = (p) => { try { return btoa(p); } catch { return p; } };

  const handleAddDriver = async () => {
    setFormLoading(true);
    try {
      await addDriver({
        ime: formData.ime, tura: formData.tura, aktivan: formData.aktivan,
        target_per_day: formData.target_per_day, role: formData.role,
        password_hash: formData.password_hash ? encodePassword(formData.password_hash) : "",
      });
      setAddModalVisible(false);
      setFormData({ ime: "", tura: "", aktivan: true, target_per_day: 0, password_hash: "", role: "driver" });
    } catch (error) {
      alert("Greška pri dodavanju vozača: " + error.message);
    } finally { setFormLoading(false); }
  };

  const handleEditDriver = async () => {
    if (!selectedDriver) return;
    setFormLoading(true);
    try {
      await updateDriver(selectedDriver.id, {
        ime: formData.ime, tura: formData.tura, aktivan: formData.aktivan,
        target_per_day: formData.target_per_day, role: formData.role,
        password_hash: formData.password_hash
          ? encodePassword(formData.password_hash)
          : selectedDriver.password_hash,
      });
      setEditModalVisible(false);
      setSelectedDriver(null);
    } catch (error) {
      alert("Greška pri ažuriranju vozača: " + error.message);
    } finally { setFormLoading(false); }
  };

  const handleDeleteDriver = async (driver) => {
    if (window.confirm(`Da li ste sigurni da želite obrisati vozača ${driver.ime}?`)) {
      try { await deleteDriver(driver.id); }
      catch (error) { alert("Greška pri brisanju vozača: " + error.message); }
    }
  };

  const handleToggleStatus = async (driver) => {
    try { 
      await toggleDriverStatus(driver.id, driver.aktivan); 
      toast.success(`Vozač ${driver.aktivan ? 'deaktiviran' : 'aktiviran'}!`);
    }
    catch (error) { toast.error("Greška pri mijenjanju statusa: " + error.message); }
  };

  const openEditModal = (driver) => {
    setSelectedDriver(driver);
    setFormData({
      ime: driver.ime, tura: driver.tura, aktivan: driver.aktivan,
      target_per_day: driver.target_per_day || 0, role: driver.role || "driver",
      password_hash: driver.password_hash ? decodePassword(driver.password_hash) : "",
    });
    setEditModalVisible(true);
  };

  const openAddModal = () => {
    setFormData({ ime: "", tura: "", aktivan: true, target_per_day: 0, password_hash: "", role: "driver" });
    setAddModalVisible(true);
  };

  const ic = `w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20`;
  const icDay = `bg-white/80 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500`;
  const icNight = `bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400`;
  const inputClass = `${ic} ${isNightTheme ? icNight : icDay}`;
  const labelClass = `flex items-center gap-2 text-sm font-medium ${isNightTheme ? "text-gray-200" : "text-gray-700"}`;

  const formFields = (idSuffix) => (
    <div className="space-y-3 sm:space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-1 sm:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1">
              <label className={labelClass}><Users className="w-4 h-4" /> Ime vozača</label>
              <input type="text" value={formData.ime}
                onChange={e => setFormData({ ...formData, ime: e.target.value })}
                placeholder="Unesite ime vozača" required className={inputClass} />
            </div>
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border sm:flex-shrink-0 ${isNightTheme ? "bg-gray-800/30 border-gray-600" : "bg-gray-50 border-gray-200"}`}>
              <input type="checkbox" id={`activeCheckbox_${idSuffix}`}
                checked={formData.aktivan}
                onChange={e => setFormData({ ...formData, aktivan: e.target.checked })}
                className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500" />
              <label htmlFor={`activeCheckbox_${idSuffix}`}
                className={`text-sm font-medium cursor-pointer whitespace-nowrap ${isNightTheme ? "text-gray-200" : "text-gray-700"}`}>
                Aktivan vozač
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className={labelClass}><Target className="w-4 h-4" /> Tura</label>
          <input type="text" value={formData.tura}
            onChange={e => setFormData({ ...formData, tura: e.target.value })}
            placeholder="npr. 8610, 8620..." required className={inputClass} />
        </div>

        <div className="space-y-1">
          <label className={labelClass}><Clock className="w-4 h-4" /> Target po danu</label>
          <input type="number" value={formData.target_per_day}
            onChange={e => setFormData({ ...formData, target_per_day: parseInt(e.target.value) || 0 })}
            placeholder="0" min="0" className={inputClass} />
        </div>

        <div className="space-y-1">
          <label className={labelClass}><Shield className="w-4 h-4" /> Uloga</label>
          <select value={formData.role}
            onChange={e => setFormData({ ...formData, role: e.target.value })}
            className={inputClass}>
            <option value="driver">Vozač</option>
            <option value="admin">Administrator</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className={labelClass}><Eye className="w-4 h-4" /> Lozinka</label>
          <input type="password" value={formData.password_hash}
            onChange={e => setFormData({ ...formData, password_hash: e.target.value })}
            placeholder="Unesite lozinku" className={inputClass} />
        </div>
      </div>
    </div>
  );

  const renderedDrivers = useMemo(() => {
    return drivers.map((driver, index) => {
      const driverNormName = normalizeDriverName(driver.ime);
      const isAdmin = driver.role === "admin";
      return (
        <motion.div
          key={driver.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className={`p-4 sm:p-5 rounded-xl border backdrop-blur-sm hover:scale-[1.02] transition-all duration-200 ${
            driver.aktivan
              ? isNightTheme ? "bg-green-900/30 border-green-700/50" : "bg-green-50 border-green-200/50"
              : isNightTheme ? "bg-yellow-900/30 border-yellow-700/50" : "bg-yellow-50 border-yellow-200/50"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-gradient-to-br ${driver.aktivan ? "from-green-500 to-emerald-500" : "from-yellow-500 to-orange-500"}`}>
                <Users className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className={`font-semibold ${isNightTheme ? "text-white" : "text-gray-800"}`}>{driver.ime}</h3>
                <p className={`text-xs ${isNightTheme ? "text-gray-400" : "text-gray-600"}`}>Tura: {driver.tura}</p>
              </div>
            </div>
            <div className={`px-2 py-1 rounded-lg text-xs font-medium ${
              driver.aktivan
                ? isNightTheme ? "bg-green-700/50 text-green-300" : "bg-green-100 text-green-700"
                : isNightTheme ? "bg-yellow-700/50 text-yellow-300" : "bg-yellow-100 text-yellow-700"
            }`}>
              {driver.aktivan ? "Aktivan" : "Neaktivan"}
            </div>
          </div>

          {/* Detalji */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Target className={`w-4 h-4 ${isNightTheme ? "text-gray-400" : "text-gray-600"}`} />
              <span className={`text-sm ${isNightTheme ? "text-gray-300" : "text-gray-700"}`}>
                Target: <strong>{driver.target_per_day || 0}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className={`w-4 h-4 ${isNightTheme ? "text-gray-400" : "text-gray-600"}`} />
              <span className={`text-sm ${isNightTheme ? "text-gray-300" : "text-gray-700"}`}>
                {isAdmin ? "Admin" : "Vozač"}
              </span>
            </div>
            {driver.last_login && (
              <div className="flex items-center gap-2 sm:col-span-2">
                <Clock className={`w-4 h-4 ${isNightTheme ? "text-gray-400" : "text-gray-600"}`} />
                <span className={`text-sm ${isNightTheme ? "text-gray-300" : "text-gray-700"}`}>
                  Zadnji login: {new Date(driver.last_login).toLocaleDateString("bs-BA")}
                </span>
              </div>
            )}
          </div>

          {/* ✅ DUAL PANEL — samo za vozače, ne za admine */}
          {!isAdmin && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <motion.div
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => setPayrollArchiveDriver(driver)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl cursor-pointer border transition-all ${
                  isNightTheme
                    ? "bg-emerald-900/20 border-emerald-700/50 hover:bg-emerald-800/30"
                    : "bg-emerald-50 border-emerald-200/50 hover:bg-emerald-100 shadow-sm"
                }`}
              >
                <div className="p-1.5 rounded-lg bg-emerald-500 mb-1">
                  <FolderOpen className="w-4 h-4 text-white" />
                </div>
                <p className={`text-[10px] font-bold uppercase ${isNightTheme ? "text-emerald-400" : "text-emerald-700"}`}>
                  Platne liste
                </p>
                <p className={`text-sm font-black ${isNightTheme ? "text-emerald-300" : "text-emerald-600"}`}>
                  {archiveLoading
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : `${archiveCounts[driverNormName] ?? 0} listi`}
                </p>
              </motion.div>

              <div className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                isNightTheme ? "bg-amber-900/20 border-amber-700/50" : "bg-amber-50 border-amber-200/50 shadow-sm"
              }`}>
                <div className="p-1.5 rounded-lg bg-amber-500 mb-1">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                <p className={`text-[10px] font-bold uppercase ${isNightTheme ? "text-amber-400" : "text-amber-700"}`}>
                  Godišnji
                </p>
                <p className={`text-sm font-black ${isNightTheme ? "text-amber-300" : "text-amber-600"}`}>
                  {statsLoading
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : `${urlaubCounts[driverNormName] ?? 0} dana`}
                </p>
              </div>
            </div>
          )}

          {/* Password */}
          {driver.password_hash && (
            <div className={`p-3 rounded-lg mb-4 ${isNightTheme ? "bg-gray-800/50" : "bg-gray-50"}`}>
              <div className="flex items-center justify-between">
                <span className={`text-sm ${isNightTheme ? "text-gray-300" : "text-gray-700"}`}>
                  Password: {showPasswords[driver.id] ? decodePassword(driver.password_hash) : "••••••••"}
                </span>
                <div className="flex gap-2">
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={() => togglePasswordVisibility(driver.id)}
                    className={`p-1 rounded ${isNightTheme ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}>
                    {showPasswords[driver.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={() => copyToClipboard(decodePassword(driver.password_hash), driver.id)}
                    className={`p-1 rounded ${isNightTheme ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}>
                    {copiedPassword === driver.id ? <span className="text-xs text-green-500">✓</span> : <Copy className="w-4 h-4" />}
                  </motion.button>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => openEditModal(driver)}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isNightTheme ? "bg-blue-700/50 text-blue-300 hover:bg-blue-600/50" : "bg-blue-500 text-white hover:bg-blue-600"
              }`}>
              <Edit className="w-4 h-4" />
              <span className="hidden sm:inline">Uredi</span>
            </motion.button>

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => handleToggleStatus(driver)}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                driver.aktivan
                  ? isNightTheme ? "bg-yellow-700/50 text-yellow-300 hover:bg-yellow-600/50" : "bg-yellow-500 text-white hover:bg-yellow-600"
                  : isNightTheme ? "bg-green-700/50 text-green-300 hover:bg-green-600/50" : "bg-green-500 text-white hover:bg-green-600"
              }`}>
              {driver.aktivan ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span className="hidden sm:inline">{driver.aktivan ? "Pauza" : "Aktiviraj"}</span>
            </motion.button>

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => handleDeleteDriver(driver)}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isNightTheme ? "bg-red-700/50 text-red-300 hover:bg-red-600/50" : "bg-red-500 text-white hover:bg-red-600"
              }`}>
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Obriši</span>
            </motion.button>
          </div>
        </motion.div>
      );
    });
  }, [drivers, isNightTheme, showPasswords, copiedPassword, archiveCounts, archiveLoading, urlaubCounts, statsLoading]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      className={`p-4 sm:p-6 rounded-2xl backdrop-blur-xl shadow-xl border ${
        isNightTheme ? "bg-gray-800/50 border-gray-700" : "bg-white/50 border-white/20"
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}
            className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600">
            <Users className="w-6 h-6 text-white" />
          </motion.div>
          <div>
            <h2 className={`text-xl sm:text-2xl font-bold ${isNightTheme ? "text-white" : "text-gray-800"}`}>
              Upravljanje vozačima
            </h2>
            <p className={`text-sm ${isNightTheme ? "text-gray-400" : "text-gray-600"}`}>
              Upravljaj vozačima i njihovim dozvolama
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <motion.button onClick={() => globalFileInputRef.current?.click()}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} disabled={uploading}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium shadow-lg disabled:opacity-60 transition-all ${
              isNightTheme
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500"
                : "bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-400 hover:to-teal-500"
            }`}>
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <span className="hidden sm:inline">{uploading ? "Obrada..." : "Obradi platne liste"}</span>
            <span className="sm:hidden">{uploading ? "..." : "Upload"}</span>
          </motion.button>

          <input ref={globalFileInputRef} type="file" multiple accept="application/pdf"
            className="hidden" onChange={handleFileUpload} />

          <motion.button onClick={openAddModal}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium shadow-lg transition-all ${
              isNightTheme
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500"
                : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-400 hover:to-indigo-500"
            }`}>
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Dodaj vozača</span>
            <span className="sm:hidden">Dodaj</span>
          </motion.button>
        </div>
      </div>

      {/* Statistika */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
        {[
          { label: "Aktivni", value: drivers.filter(d => d.aktivan).length, from: "from-green-500", to: "to-emerald-500", color: "green" },
          { label: "Neaktivni", value: drivers.filter(d => !d.aktivan).length, from: "from-yellow-500", to: "to-orange-500", color: "yellow" },
          { label: "Ukupno", value: drivers.length, from: "from-blue-500", to: "to-indigo-500", color: "blue" },
        ].map(({ label, value, from, to, color }, i) => (
          <motion.div key={label}
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: (i + 1) * 0.1 }}
            className={`p-2 sm:p-4 rounded-xl border ${
              isNightTheme ? `bg-${color}-900/30 border-${color}-700/50` : `bg-${color}-50 border-${color}-200/50`
            }`}>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`p-1.5 sm:p-2 rounded-lg bg-gradient-to-br ${from} ${to}`}>
                <Users className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
              <div>
                <p className={`text-xs ${isNightTheme ? "text-gray-400" : "text-gray-600"}`}>{label}</p>
                <p className={`text-sm sm:text-lg font-bold ${isNightTheme ? `text-${color}-400` : `text-${color}-600`}`}>{value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Greška */}
      {error && (
        <div className={`p-4 rounded-xl mb-6 border ${isNightTheme ? "bg-red-900/30 border-red-700/50" : "bg-red-50 border-red-200/50"}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-red-600">
              <XCircle className="w-4 h-4 text-white" />
            </div>
            <p className={`text-sm font-medium ${isNightTheme ? "text-red-400" : "text-red-600"}`}>
              Greška: {error.message}
            </p>
          </div>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 mb-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </motion.div>
          <span className={`text-lg ${isNightTheme ? "text-gray-300" : "text-gray-600"}`}>Učitavanje vozača...</span>
        </div>
      ) : drivers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className={`w-16 h-16 mb-4 rounded-xl flex items-center justify-center ${isNightTheme ? "bg-gray-700" : "bg-gray-100"}`}>
            <Users className={`w-8 h-8 ${isNightTheme ? "text-gray-400" : "text-gray-500"}`} />
          </div>
          <h3 className={`text-lg font-semibold mb-2 ${isNightTheme ? "text-gray-300" : "text-gray-700"}`}>Nema vozača</h3>
          <p className={`text-sm ${isNightTheme ? "text-gray-500" : "text-gray-600"}`}>Nema registrovanih vozača u sistemu</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {renderedDrivers}
        </div>
      )}

      {/* Modal dodaj */}
      <ModernModal open={addModalVisible} title="Dodaj novog vozača"
        onClose={() => setAddModalVisible(false)} onSubmit={handleAddDriver}
        loading={formLoading} submitLabel="Dodaj vozača" closeLabel="Otkaži">
        {formFields("add")}
      </ModernModal>

      {/* Modal uredi */}
      <ModernModal open={editModalVisible} title="Uredi vozača"
        onClose={() => setEditModalVisible(false)} onSubmit={handleEditDriver}
        loading={formLoading} submitLabel="Sačuvaj promjene" closeLabel="Otkaži">
        {formFields("edit")}
      </ModernModal>

      {/* ✅ Payroll Archive Modal */}
      <PayrollArchive
        driver={payrollArchiveDriver}
        onClose={() => setPayrollArchiveDriver(null)}
        onRefresh={() => {
          loadArchiveCounts();
          setPayrollArchiveDriver(null);
        }}
      />
    </motion.div>
  );
};

export default DriversTab;
