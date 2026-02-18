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
  const [latestPayroll, setLatestPayroll] = useState({ amount: "0.00", date: "" });
  const menuRef = useRef(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const themeConfig = themes || {
    default: { accent: 'from-blue-600 to-purple-600' },
    night: { accent: 'from-gray-600 to-blue-800' }
  };

  // DOHVAT NAJNOVIJIH PODATAKA IZ BAZE (01/2026)
  useEffect(() => {
    const fetchLatestData = async () => {
      if (!user || user.role === "admin") return;

      try {
        const { data, error } = await supabase
          .from('payrolls')
          .select('file_name, neto')
          .eq('driver_name', (user.username || user.driverName || "").toLowerCase());

        if (!error && data && data.length > 0) {
          // Sortiramo po nazivu fajla da dobijemo 01_2026 ispred 12_2025
          const sorted = data.sort((a, b) => {
            const parse = (n) => {
              const m = n.match(/(\d{2})_(\d{4})/);
              return m ? { month: parseInt(m[1]), year: parseInt(m[2]) } : { month: 0, year: 0 };
            };
            const bP = parse(b.file_name);
            const aP = parse(a.file_name);
            return bP.year !== aP.year ? bP.year - aP.year : bP.month - aP.month;
          });

          const latest = sorted[0];
          setLatestPayroll({
            amount: latest.neto || "0.00",
            date: latest.file_name.replace('.pdf', '').replace('.PDF', '').replace('_', '/')
          });
        }
      } catch (err) {
        console.error("Greška pri dnuhvatu plate:", err);
      }
    };

    fetchLatestData();
  }, [user]);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <motion.div 
        onClick={() => setIsOpen(!isOpen)} 
        whileHover={{ scale: 1.05 }}
        className={`flex items-center gap-3 px-3 py-2 rounded-full border cursor-pointer backdrop-blur-2xl ${currentTheme === 'night' ? 'bg-gray-800/40 border-white/10' : 'bg-white/60 border-gray-100/50'}`}
      >
        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${themeConfig[currentTheme].accent} flex items-center justify-center text-white`}>
          {user?.role === "admin" ? <Crown size={18} /> : <Truck size={18} />}
        </div>
        <span className="font-medium">{user?.name || "Korisnik"}</span>
        <ChevronDown size={16} />
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`absolute right-0 mt-2 w-72 p-4 rounded-2xl shadow-2xl backdrop-blur-3xl border ${currentTheme === 'night' ? 'bg-gray-900/95 border-white/30 text-white' : 'bg-white/95 border-gray-300 text-gray-900'}`}
            style={{ zIndex: 999999 }}
          >
            {/* Header Profil */}
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 bg-gradient-to-br ${themeConfig[currentTheme].accent} rounded-full flex items-center justify-center text-white font-bold`}>
                {(user?.name || "K")[0]}
              </div>
              <div>
                <h3 className="font-bold text-sm">{user?.name}</h3>
                <p className="text-xs opacity-50">{user?.username}</p>
              </div>
            </div>

            {/* PLATNI PODACI - TO JE ONO ŠTO SI TRAŽIO */}
            {user?.role !== "admin" && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                {/* ZADNJA PLATA KARTICA */}
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className={`p-2 rounded-xl border backdrop-blur-sm ${currentTheme === 'night' ? 'bg-gray-800/50 border-gray-600/50' : 'bg-blue-50/80 border-blue-200/60'}`}
                >
                  <div className="text-[10px] font-bold text-blue-500 uppercase">
                    Zadnja plata {latestPayroll.date && `(${latestPayroll.date})`}
                  </div>
                  <div className={`font-black text-sm mt-1 ${currentTheme === 'night' ? 'text-blue-300' : 'text-blue-900'}`}>
                    {latestPayroll.amount} €
                  </div>
                </motion.div>

                {/* UKUPNA ZARADA KARTICA */}
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className={`p-2 rounded-xl border backdrop-blur-sm ${currentTheme === 'night' ? 'bg-gray-800/50 border-gray-600/50' : 'bg-emerald-50/80 border-emerald-200/60'}`}
                >
                  <div className="text-[10px] font-bold text-emerald-500 uppercase">Ukupna zarada</div>
                  <div className={`font-black text-sm mt-1 ${currentTheme === 'night' ? 'text-emerald-300' : 'text-emerald-900'}`}>
                    {user?.ukupnaZarada || "0.00 €"}
                  </div>
                </motion.div>
              </div>
            )}

            {/* Akcije */}
            <div className="space-y-1">
              <Button variant="ghost" className="w-full justify-start rounded-xl" onClick={() => navigate(user?.role === "admin" ? "/admin" : "/payroll-list")}>
                {user?.role === "admin" ? <Crown className="mr-2 h-4 w-4" /> : <Wallet className="mr-2 h-4 w-4 text-emerald-500" />}
                {user?.role === "admin" ? "Admin Panel" : "Platne liste"}
              </Button>
              <Button variant="ghost" className="w-full justify-start rounded-xl" onClick={onChangePassword}>
                <KeyRound className="mr-2 h-4 w-4 text-amber-500" /> Šifra
              </Button>
              <Button variant="ghost" className="w-full justify-start rounded-xl text-rose-500 hover:bg-rose-50" onClick={onLogout}>
                <LogOut className="mr-2 h-4 w-4" /> Odjava
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
