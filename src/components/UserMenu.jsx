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
  Activity,
  Clock,
  Truck,
} from "lucide-react";

export default function UserMenu({ user, onChangePassword, onLogout, scraperData, currentTheme = 'default', themes }) {
  const [isOpen, setIsOpen] = useState(false);
  const [latestPayroll, setLatestPayroll] = useState({ amount: null, date: null });
  
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // NOVO: Pametno sortiranje - 01_2026 mora biti ispred 12_2025
  useEffect(() => {
    const fetchLatestPayroll = async () => {
      if (!user || user.role === "admin") return;

      try {
        const { data, error } = await supabase
          .from('payrolls')
          .select('file_name, neto')
          .eq('driver_name', (user.username || user.name || "").toLowerCase());

        if (!error && data && data.length > 0) {
          const sorted = data.sort((a, b) => {
            const parse = (name) => {
              const m = name.match(/(\d{2})_(\d{4})/);
              if (!m) return { m: 0, y: 0 };
              return { m: parseInt(m[1]), y: parseInt(m[2]) };
            };
            const aP = parse(a.file_name);
            const bP = parse(b.file_name);
            
            // Prvo poredi godinu, pa mjesec (unazad)
            if (bP.y !== aP.y) return bP.y - aP.y;
            return bP.m - aP.m;
          });

          const top = sorted[0];
          setLatestPayroll({
            amount: parseFloat(top.neto).toFixed(2), // Formatira na 2092.30
            date: top.file_name.replace('.pdf', '').replace('.PDF', '').replace('_', '/')
          });
        }
      } catch (err) {
        console.error("Greška pri dohvatu plate:", err);
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
    <div className="relative inline-block text-left" ref={menuRef} style={{ zIndex: isOpen ? 999999 : 'auto' }}>
      {/* Avatar Button - ORIGINALNI IZGLED */}
      <motion.div 
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)} 
        whileHover={{ scale: 1.05, y: -2 }} 
        className={`flex items-center gap-3 px-3 py-2 ${currentTheme === 'night' ? 'bg-gray-800/40 border-white/10' : 'bg-white/60 border-gray-100/50'} backdrop-blur-2xl rounded-full border cursor-pointer transition-all duration-300`}
        style={{ boxShadow: '6px 6px 12px rgba(0,0,0,0.08)' }}
      >
        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${themeConfig[currentTheme].accent} flex items-center justify-center text-white font-bold`}>
          {user?.role === "admin" ? <Crown size={18} /> : <Truck size={18} />}
        </div>
        <span className="font-medium">{user?.name}</span>
        <ChevronDown size={16} className={isOpen ? "rotate-180" : ""} />
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`absolute right-0 mt-2 w-72 ${currentTheme === 'night' ? 'bg-gray-900/95 border-white/30' : 'bg-white/95 border-gray-300'} backdrop-blur-3xl border rounded-2xl p-4 shadow-2xl`}
            style={{ position: 'absolute', top: '100%', right: 0 }}
          >
            {/* Header - ORIGINALNI FONT I BOJE */}
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-10 h-10 bg-gradient-to-br ${themeConfig[currentTheme].accent} rounded-full flex items-center justify-center text-white font-bold`}>
                {(user?.name || "K")[0]}
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-sm">{user?.name}</h3>
                <p className="text-xs opacity-50">{user?.username}</p>
              </div>
            </div>

            {/* PLATNI PODACI - SADA SA TAČNIM 01/2026 IZNOSOM */}
            {user?.role !== "admin" && (
              <div className="grid grid-cols-2 gap-2 mb-3">
                <motion.div 
                  className={`${currentTheme === 'night' ? 'bg-gray-800/50 border-gray-600/50' : 'bg-blue-50/80 border-blue-200/60'} border rounded-xl p-2 backdrop-blur-sm`}
                >
                  <div className="text-[10px] font-bold text-blue-500 uppercase leading-none">
                    Zadnja plata {latestPayroll.date && `(${latestPayroll.date})`}
                  </div>
                  <div className={`font-black ${currentTheme === 'night' ? 'text-blue-300' : 'text-blue-900'} text-sm mt-1`}>
                    {latestPayroll.amount ? `${latestPayroll.amount} €` : "Učitavam..."}
                  </div>
                </motion.div>
                
                <motion.div 
                  className={`${currentTheme === 'night' ? 'bg-gray-800/50 border-gray-600/50' : 'bg-emerald-50/80 border-emerald-200/60'} border rounded-xl p-2 backdrop-blur-sm`}
                >
                  <div className="text-[10px] font-bold text-emerald-500 uppercase leading-none">Ukupna zarada</div>
                  <div className={`font-black ${currentTheme === 'night' ? 'text-emerald-300' : 'text-emerald-900'} text-sm mt-1`}>
                    {user?.ukupnaZarada || "-"}
                  </div>
                </motion.div>
              </div>
            )}

            {/* BUTTONS - ORIGINALNI STIL */}
            <div className="space-y-1">
              <Button variant="ghost" size="sm" className="w-full justify-start text-left text-emerald-600 rounded-xl" onClick={() => navigate("/payroll-list")}>
                <Wallet className="w-4 h-4 mr-2" /> Platne liste
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start text-left text-amber-600 rounded-xl" onClick={onChangePassword}>
                <KeyRound className="w-4 h-4 mr-2" /> Promijeni šifru
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start text-left text-rose-600 rounded-xl" onClick={onLogout}>
                <LogOut className="w-4 h-4 mr-2" /> Odjava
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
s
