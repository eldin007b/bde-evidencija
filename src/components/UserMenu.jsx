import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { supabase } from "../db/supabaseClient";
import useSimpleAuth from "../hooks/useSimpleAuth";
import useDrivers from "../hooks/useDrivers"; // Uvoz hook-a
import { ChevronDown, LogOut, KeyRound, Wallet, Crown, User, Receipt } from "lucide-react";
import { calculateEarnedUrlaub, calculateRemainingUrlaub } from "../utils/urlaubUtils";

export default function UserMenu({
  user,
  onChangePassword,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [latestPayroll, setLatestPayroll] = useState({ amount: "---", date: "" });
  const [totalEarnings, setTotalEarnings] = useState("0,00 €");
  const [urlaubDays, setUrlaubDays] = useState(0);

  const menuRef = useRef(null);
  const navigate = useNavigate();
  const { logout } = useSimpleAuth();
  const driverHook = useDrivers(); 
  const { getDriverUrlaubStats } = driverHook;

  const isAdmin = user?.role === "admin";
  
  // ... (ostatak koda ostaje isti)
  const handleLogout = async () => {
    if (window.confirm('Da li ste sigurni da se želite odjaviti?')) {
      await logout();
      navigate('/login');
    }
  };
  
  // Ažuriraj JSX za logout dugme
  /* 
     Promijeniti u JSX-u:
     <button onClick={() => { setIsOpen(false); handleLogout(); }} ...>
  */


  useEffect(() => {
    const fetchData = async () => {
      // 1. Sigurnosna provjera korisnika
      if (!user || isAdmin) return;
      
      console.log('🔍 [UserMenu] Pokrećem dohvat podataka za:', user.username);
      
      // 2. Urlaub Stats
      try {
        const days = await getDriverUrlaubStats(user.username);
        setUrlaubDays(days || 0);
      } catch (err) {
        console.error('❌ [UserMenu] Error fetching Urlaub stats:', err);
        setUrlaubDays(0);
      }

      // 3. Payroll Stats
      try {
        const searchName = user?.name?.toLowerCase()?.trim();
        if (searchName) {
          const { data: payrollData } = await supabase
            .from("payroll_amounts")
            .select("file_name, neto, ukupni_trosak")
            .ilike("driver_name", searchName);

          if (payrollData && payrollData.length > 0) {
            const sum = payrollData.reduce((acc, curr) => acc + parseFloat(curr.ukupni_trosak ?? curr.neto ?? 0), 0);
            setTotalEarnings(sum.toLocaleString("de-DE", { minimumFractionDigits: 2 }) + " €");

            const sorted = [...payrollData].sort((a, b) => {
              const parse = (name) => {
                const match = name.match(/(\d{2})_(\d{4})/);
                return match ? { m: parseInt(match[1]), y: parseInt(match[2]) } : { m: 0, y: 0 };
              };
              const dA = parse(a.file_name);
              const dB = parse(b.file_name);
              if (dB.y !== dA.y) return dB.y - dA.y;
              return dB.m - dA.m;
            });

            const latest = sorted[0];
            setLatestPayroll({
              amount: parseFloat(latest.neto ?? 0).toLocaleString("de-DE", { minimumFractionDigits: 2 }) + " €",
              date: latest.file_name?.replace(".pdf", "")?.replace("_", "/") || "",
            });
          }
        }
      } catch (err) {
        console.error('❌ [UserMenu] Error fetching payroll data:', err);
      }
    };

    fetchData();
  }, [user, isAdmin]); // Uklonjeno getDriverUrlaubStats jer je sad memoizovan iz hook-a

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const displayRole = isAdmin ? "Admin" : user?.username;

  return (
    <div className="relative w-full inline-block text-left" ref={menuRef}>
      
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="relative group w-full h-full"
      >
        <div className={`absolute inset-0 backdrop-blur-xl rounded-full border transition-all ${isAdmin ? 'bg-rose-900/40 border-rose-500/40 shadow-[0_0_15px_rgba(225,29,72,0.3)] group-hover:bg-rose-800/40' : 'bg-slate-800/60 border-slate-600/50 shadow-lg group-hover:bg-slate-700/60'}`}></div>
        <div className="relative flex items-center justify-between gap-2 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white border ${isAdmin ? 'bg-gradient-to-br from-rose-500 to-red-600 border-rose-400/30' : 'bg-gradient-to-br from-purple-500 to-indigo-500 border-purple-400/30'}`}>
              {isAdmin ? <Crown size={14} /> : <User size={14} />}
            </div>
            <p className="font-black text-sm text-white tracking-wide">
              {user?.name || "Korisnik"} <span className={`font-medium opacity-70 ${isAdmin ? 'text-rose-200' : 'text-slate-300'}`}>({displayRole})</span>
            </p>
          </div>
          <ChevronDown size={16} className={`${isAdmin ? 'text-rose-300' : 'text-slate-400'} transition-transform duration-300 ${isOpen ? "rotate-180 text-white" : ""}`} />
        </div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`absolute top-full left-0 right-0 w-full sm:w-[340px] sm:left-auto sm:right-0 mt-3 backdrop-blur-3xl rounded-[2.5rem] p-5 shadow-[0_25px_50px_rgba(0,0,0,0.7)] z-[999999] border ${isAdmin ? 'bg-rose-950/90 border-rose-800/50' : 'bg-slate-800/95 border-slate-700/80'}`}
          >
            <div className={`flex items-center gap-4 mb-5 pb-4 border-b ${isAdmin ? 'border-rose-800/50' : 'border-slate-700/50'}`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl font-black border ${isAdmin ? 'bg-gradient-to-br from-rose-500 to-red-600 border-rose-400/30' : 'bg-gradient-to-br from-purple-500 to-indigo-500 border-purple-400/30'}`}>
                {(user?.name || "K")[0].toUpperCase()}
              </div>
              <div>
                <h3 className="font-black text-lg text-white leading-none mb-1">{user?.name}</h3>
                <p className={`text-xs uppercase tracking-widest ${isAdmin ? 'text-rose-300' : 'text-slate-400'}`}>{isAdmin ? "Sistem Admin" : `Tura ${user?.username}`}</p>
              </div>
            </div>

            {!isAdmin && (
              <div className="space-y-3 mb-6">
                <div className="rounded-2xl p-4 bg-slate-900/50 border border-blue-500/20">
                  <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest flex items-center gap-2 mb-1">
                    <Receipt size={12} /> Zadnja Plata {latestPayroll.date && `(${latestPayroll.date})`}
                  </p>
                  <p className="text-2xl font-black text-white">{latestPayroll.amount}</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1 rounded-2xl p-3 bg-slate-900/50 border border-emerald-500/20">
                    <p className="text-[9px] text-emerald-400 font-black uppercase tracking-widest mb-1">Zarada</p>
                    <p className="text-lg font-black text-white">{totalEarnings}</p>
                  </div>
                  <div className="flex-1 rounded-2xl p-3 bg-slate-900/50 border border-amber-500/20">
                    <p className="text-[9px] text-amber-400 font-black uppercase tracking-widest mb-1">Odmor</p>
                    <p className="text-lg font-black text-white">{urlaubDays} <span className="text-[10px] font-normal text-slate-400">dana</span></p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <button
                onClick={() => { setIsOpen(false); navigate(isAdmin ? "/admin" : "/payroll-list"); }}
                className={`w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all group ${isAdmin ? 'hover:bg-rose-900/50' : 'hover:bg-slate-700/50'}`}
              >
                <div className={`p-2 rounded-xl transition-colors ${isAdmin ? 'bg-rose-500/20 group-hover:bg-rose-500/30' : 'bg-emerald-500/10 group-hover:bg-emerald-500/20'}`}>
                  {isAdmin ? <Crown size={18} className="text-rose-400" /> : <Wallet size={18} className="text-emerald-400" />}
                </div>
                <span className="font-bold text-slate-200 group-hover:text-white">{isAdmin ? "Admin Panel" : "Platne liste"}</span>
              </button>

              <button
                onClick={() => { setIsOpen(false); onChangePassword(); }}
                className={`w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all group ${isAdmin ? 'hover:bg-rose-900/50' : 'hover:bg-slate-700/50'}`}
              >
                <div className={`p-2 rounded-xl ${isAdmin ? 'bg-amber-500/10 group-hover:bg-amber-500/20' : 'bg-blue-500/10 group-hover:bg-blue-500/20'}`}>
                  <KeyRound size={18} className={isAdmin ? "text-amber-400" : "text-blue-400"} />
                </div>
                <span className="font-bold text-slate-200 group-hover:text-white">Promijeni šifru</span>
              </button>

              <div className={`h-px my-2 ${isAdmin ? 'bg-rose-800/50' : 'bg-slate-700/50'}`}></div>

              <button
                onClick={() => { setIsOpen(false); handleLogout(); }}
                className="w-full flex items-center gap-3 p-3.5 rounded-2xl hover:bg-rose-500/10 transition-all group"
              >
                <div className="bg-rose-500/10 p-2 rounded-xl group-hover:bg-rose-500/20">
                  <LogOut size={18} className="text-rose-400" />
                </div>
                <span className="font-bold text-rose-400 group-hover:text-rose-300">Odjava sa sistema</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
