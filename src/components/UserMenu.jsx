import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { supabase } from "../db/supabaseClient"; 
import {
  ChevronDown,
  LogOut,
  KeyRound,
  Wallet,
  Crown,
  Truck,
  Activity,
  Clock
} from "lucide-react";

export default function UserMenu({ user, onChangePassword, onLogout, scraperData, currentTheme = 'default', themes }) {
  const [isOpen, setIsOpen] = useState(false);
  const [latestPayroll, setLatestPayroll] = useState({ amount: null, date: null });
  
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLatestPayroll = async () => {
      // Sigurnosna provjera da se spriječi bijeli ekran
      if (!user || user.role === "admin" || !supabase) return;

      try {
        const searchName = (user.username || user.name || "").toLowerCase();
        
        // TAČAN NAZIV TABELE IZ SQL-a: payroll_amounts
        const { data, error } = await supabase
          .from('payroll_amounts')
          .select('file_name, neto')
          .eq('driver_name', searchName);

        if (!error && data && data.length > 0) {
          // Sortiranje po godini i mjesecu iz file_name (01_2026)
          const sorted = data.sort((a, b) => {
            const parse = (name) => {
              const m = name.match(/(\d{2})_(\d{4})/);
              return m ? { m: parseInt(m[1]), y: parseInt(m[2]) } : { m: 0, y: 0 };
            };
            const aP = parse(a.file_name);
            const bP = parse(b.file_name);
            return bP.y !== aP.y ? bP.y - aP.y : bP.m - aP.m;
          });

          const latest = sorted[0];
          setLatestPayroll({
            amount: latest.neto ? parseFloat(latest.neto).toFixed(2) : "0.00",
            date: latest.file_name.replace('.pdf', '').replace('.PDF', '').replace('_', '/')
          });
        }
      } catch (err) {
        console.error("Greška pri dohvatu:", err);
      }
    };

    fetchLatestPayroll();
  }, [user]);

  const defaultThemes = {
    default: { accent: 'from-blue-600 to-purple-600' },
    night: { accent: 'from-gray-600 to-blue-800' }
  };
  const themeConfig = themes || defaultThemes;

  return (
    <div className="relative inline-block text-left" ref={menuRef} style={{ zIndex: isOpen ? 999999 : 50 }}>
      {/* Trigger Dugme - ORIGINALNI STIL */}
      <motion.div 
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)} 
        whileHover={{ scale: 1.05 }} 
        className={`flex items-center gap-3 px-3 py-2 ${currentTheme === 'night' ? 'bg-gray-800/40 border-white/10 text-white' : 'bg-white/60 border-gray-100/50 text-gray-800'} backdrop-blur-2xl rounded-full border cursor-pointer transition-all duration-300 shadow-sm`}
      >
        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${themeConfig[currentTheme]?.accent || 'from-blue-500 to-blue-700'} flex items-center justify-center text-white`}>
          {user?.role === "admin" ? <Crown size={16} /> : <Truck size={16} />}
        </div>
        <span className="font-medium text-sm">{user?.name || "Korisnik"}</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`absolute right-0 mt-2 w-72 ${currentTheme === 'night' ? 'bg-gray-900/95 border-white/20 text-white' : 'bg-white/95 border-gray-200 text-gray-900'} backdrop-blur-3xl border rounded-2xl p-4 shadow-2xl`}
          >
            {/* Header sekcija */}
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 bg-gradient-to-br ${themeConfig[currentTheme]?.accent || 'from-blue-500 to-blue-700'} rounded-full flex items-center justify-center text-white font-bold text-lg`}>
                {(user?.name || "K")[0]}
              </div>
              <div className="text-left">
                <h3 className="font-bold text-sm leading-none">{user?.name}</h3>
                <p className="text-xs opacity-50 mt-1">{user?.username}</p>
              </div>
            </div>

            {/* KARTICE SA PODACIMA - TVOJ ORIGINALNI IZGLED */}
            {user?.role !== "admin" && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className={`${currentTheme === 'night' ? 'bg-blue-900/30 border-blue-500/30' : 'bg-blue-50 border-blue-100'} border rounded-xl p-2 text-left`}>
                  <div className="text-[10px] font-bold text-blue-500 uppercase leading-tight">
                    Zadnja plata {latestPayroll.date && `(${latestPayroll.date})`}
                  </div>
                  <div className="font-black text-blue-600 text-sm mt-1 leading-none">
                    {latestPayroll.amount ? `${latestPayroll.amount} €` : "---"}
                  </div>
                </div>
                
                <div className={`${currentTheme === 'night' ? 'bg-emerald-900/30 border-emerald-500/30' : 'bg-emerald-50 border-emerald-100'} border rounded-xl p-2 text-left`}>
                  <div className="text-[10px] font-bold text-emerald-500 uppercase leading-tight">Ukupna zarada</div>
                  <div className="font-black text-emerald-600 text-sm mt-1 leading-none">
                    {user?.ukupnaZarada || "0.00 €"}
                  </div>
                </div>
              </div>
            )}

            {/* Dugmad - Akcije */}
            <div className="space-y-1">
              <Button variant="ghost" className="w-full justify-start text-emerald-600 rounded-xl py-2" onClick={() => navigate("/payroll-list")}>
                <Wallet className="w-4 h-4 mr-2" /> Platne liste
              </Button>
              <Button variant="ghost" className="w-full justify-start text-amber-600 rounded-xl py-2" onClick={onChangePassword}>
                <KeyRound className="w-4 h-4 mr-2" /> Promijeni šifru
              </Button>
              <Button variant="ghost" className="w-full justify-start text-rose-600 rounded-xl py-2 hover:bg-rose-50" onClick={onLogout}>
                <LogOut className="w-4 h-4 mr-2" /> Odjava
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
