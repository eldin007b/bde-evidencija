import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  FileText, Download, Trash2, X, FolderOpen,
  Loader2, TrendingUp, Wallet, Receipt, ChevronDown
} from "lucide-react";
import { getPayrollFiles, downloadPayrollFile, deletePayrollFile } from "../../services/SupabasePayrollService";
import { supabase } from "../../db/supabaseClient";

const MONTHS_BS = [
  "Januar", "Februar", "Mart", "April", "Maj", "Juni",
  "Juli", "August", "Septembar", "Oktobar", "Novembar", "Decembar"
];

const parseFileDate = (fileName) => {
  // Koristimo charCode umjesto d da izbjegnemo backslash problem
  const clean = fileName.replace(".pdf", "");
  const parts = clean.split("_");
  if (parts.length !== 2) return { month: 0, year: 0, label: fileName };
  const m = parseInt(parts[0], 10);
  const y = parseInt(parts[1], 10);
  if (isNaN(m) || isNaN(y) || m < 1 || m > 12) return { month: 0, year: 0, label: fileName };
  return { month: m, year: y, label: `${MONTHS_BS[m - 1]} ${y}` };
};

const normalizeDriverName = (name) => {
  if (!name) return "";
  return name
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d");
};

const PayrollArchive = ({ driver, onClose, onRefresh }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingFile, setDeletingFile] = useState(null);
  const [expandedFile, setExpandedFile] = useState(null);

  const loadFiles = useCallback(async () => {
    if (!driver?.ime) return;
    setLoading(true);
    try {
      const normalized = normalizeDriverName(driver.ime);
      const files = await getPayrollFiles(normalized);

      const enriched = await Promise.all(
        files.map(async (file) => {
          const { data } = await supabase
            .from("payroll_amounts")
            .select("neto, bruto, ukupni_trosak")
            .eq("driver_name", normalized)
            .eq("file_name", file.name)
            .single();
          const parsed = parseFileDate(file.name);
          return {
            name: file.name,
            ...parsed,
            neto: parseFloat(data?.neto || 0),
            bruto: parseFloat(data?.bruto || 0),
            trosak: parseFloat(data?.ukupni_trosak || 0),
          };
        })
      );

      // Sortiraj: godina DESC, pa mjesec DESC
      enriched.sort((a, b) => {
        if (b.year !== a.year) return b.year - a.year;
        return b.month - a.month;
      });

      setRows(enriched);
    } catch (err) {
      console.error("Greška pri učitavanju arhive:", err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [driver]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleDownload = async (fileName) => {
    try {
      await downloadPayrollFile(driver, fileName);
    } catch (err) {
      toast.error("Greška pri preuzimanju fajla.");
    }
    };

  const handleDelete = async (fileName) => {
    if (!window.confirm(`Obrisati platnu listu "${fileName}"?`)) return;
    setDeletingFile(fileName);
    try {
      await deletePayrollFile(driver.ime, fileName);
      await loadFiles();
      if (typeof onRefresh === "function") onRefresh();
    } catch {
      toast.error("Greška pri brisanju fajla.");
    } finally {
      setDeletingFile(null);
    }
  };

  if (!driver) return null;

  const totalNeto = rows.reduce((s, r) => s + r.neto, 0);
  const totalTrosak = rows.reduce((s, r) => s + r.trosak, 0);
  const fmt = (n) => n.toLocaleString("de-DE", { minimumFractionDigits: 2 }) + " €";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.96 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="w-full sm:max-w-lg bg-gray-950 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-white/10"
          style={{ maxHeight: "92vh" }}
        >
          {/* Drag handle mobilni */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          {/* Header */}
          <div className="relative px-5 pt-4 pb-5">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/30 via-teal-600/20 to-transparent pointer-events-none" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30">
                  <FolderOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-white text-lg tracking-tight">Platne liste</h3>
                  <p className="text-emerald-400 text-sm font-medium">{driver.ime}</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Summary kartice */}
            {!loading && rows.length > 0 && (
              <div className="relative mt-4 grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px] font-semibold uppercase text-emerald-400 tracking-wider">
                      Ukupno neto
                    </span>
                  </div>
                  <p className="text-xl font-black text-white">{fmt(totalNeto)}</p>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Receipt className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-[10px] font-semibold uppercase text-purple-400 tracking-wider">
                      Ukupni trošak
                    </span>
                  </div>
                  <p className="text-xl font-black text-white">{fmt(totalTrosak)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-white/10 mx-5" />

          {/* Lista */}
          <div className="overflow-y-auto px-4 py-4 space-y-2" style={{ maxHeight: "52vh" }}>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="p-4 rounded-2xl bg-emerald-500/10"
                >
                  <Loader2 className="w-8 h-8 text-emerald-500" />
                </motion.div>
                <p className="text-sm text-gray-500">Učitavanje arhive...</p>
              </div>
            ) : rows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="p-5 rounded-3xl bg-white/5">
                  <FolderOpen className="w-10 h-10 text-gray-600" />
                </div>
                <p className="text-sm font-medium text-gray-500">Nema uploadanih platnih lista</p>
              </div>
            ) : (
              rows.map((row, index) => {
                const isExpanded = expandedFile === row.name;
                const isLatest = index === 0;
                return (
                  <motion.div
                    key={row.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className={`rounded-2xl border overflow-hidden transition-all ${
                      isLatest
                        ? "border-emerald-500/40 bg-emerald-950/40"
                        : "border-white/[0.08] bg-white/[0.04]"
                    }`}
                  >
                    <button
                      onClick={() => setExpandedFile(isExpanded ? null : row.name)}
                      className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/5 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl bg-gradient-to-br ${
                          isLatest ? "from-emerald-500 to-teal-500" : "from-blue-600 to-indigo-600"
                        } shadow-lg`}>
                          <FileText className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-white">{row.label}</p>
                          <p className="text-xs text-gray-500">{row.name}</p>
                        </div>
                        {isLatest && (
                          <span className="ml-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase">
                            Novo
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-black text-emerald-400">{fmt(row.neto)}</p>
                          <p className="text-[11px] text-gray-500">neto</p>
                        </div>
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        </motion.div>
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-1">
                            <div className="h-px bg-white/[0.08] mb-3" />
                            <div className="grid grid-cols-3 gap-2 mb-4">
                              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                                <p className="text-[10px] text-emerald-400 uppercase font-semibold mb-1">Neto</p>
                                <p className="text-sm font-black text-white">{fmt(row.neto)}</p>
                              </div>
                              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                                <p className="text-[10px] text-blue-400 uppercase font-semibold mb-1">Bruto</p>
                                <p className="text-sm font-black text-white">{fmt(row.bruto)}</p>
                              </div>
                              <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
                                <p className="text-[10px] text-purple-400 uppercase font-semibold mb-1">Trošak</p>
                                <p className="text-sm font-black text-white">{fmt(row.trosak)}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <motion.button
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                onClick={() => handleDownload(row.name)}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-indigo-500 transition-all"
                              >
                                <Download className="w-4 h-4" />
                                Preuzmi PDF
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                onClick={() => handleDelete(row.name)}
                                disabled={deletingFile === row.name}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-sm font-semibold hover:bg-red-500/25 transition-all disabled:opacity-50"
                              >
                                {deletingFile === row.name
                                  ? <Loader2 className="w-4 h-4 animate-spin" />
                                  : <Trash2 className="w-4 h-4" />}
                              </motion.button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {!loading && rows.length > 0 && (
            <div className="px-5 py-3 border-t border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-xs text-gray-500">{rows.length} platnih lista</span>
              </div>
              <span className="text-xs text-gray-600">
                {rows[rows.length - 1]?.label} — {rows[0]?.label}
              </span>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PayrollArchive;

