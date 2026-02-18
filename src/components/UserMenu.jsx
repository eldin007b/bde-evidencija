import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { supabase } from "../db/supabaseClient"; // Provjeri putanju do supabase klijenta
import {
  User,
  ChevronDown,
  LogOut,
  KeyRound,
  LayoutDashboard,
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

  // Logika za dobijanje podataka iz payroll_amounts tabele
  useEffect(() => {
    const fetchLatestPayroll = async () => {
      if (!user || user.role === "admin" || !supabase) return;

      try {
        const searchName = (user.username || user.name || "").toLowerCase();
        
        const { data, error } = await supabase
          .from('payroll_amounts')
          .select('file_name, neto')
          .eq('driver_name', searchName);

        if (!error && data && data.length > 0) {
          const sorted = data.sort((a, b) => {
            const parse = (name) => {
              const m = name.match(/(\d{2})_(\d{4})/);
              return m ? { m: parseInt(m[1]), y: parseInt(m[2]) } : { m: 0, y: 0 };
            };
            const aP = parse(a.file_name);
            const bP = parse(b.file_name);
            return bP.y !== aP.y ? bP.y - aP.y : bP.m - aP.m;
          });

          const top = sorted[0];
          setLatestPayroll({
            amount: top.neto ? parseFloat(top.neto).toFixed(2) : "0.00",
            date: top.file_name.replace('.pdf', '').replace('.PDF', '').replace('_', '/')
          });
        }
      } catch (err) {
        console.error("Greška pri dohvatu plate:", err);
      }
    };

    fetchLatestPayroll();
  }, [user]);

  // Default themes if not provided
  const defaultThemes = {
    default: { accent: 'from-blue-600 to-purple-600', gradient: 'bg-gradient-to-r from-blue-500 to-purple-500' },
    sunrise: { accent: 'from-orange-500 to-pink-500', gradient: 'bg-gradient-to-r from-orange-400 to-pink-400' },
    afternoon: { accent: 'from-blue-500 to-cyan-500', gradient: 'bg-gradient-to-r from-blue-400 to-cyan-400' },
    evening: { accent: 'from-purple-600 to-indigo-600', gradient: 'bg-gradient-to-r from-purple-500 to-indigo-500' },
    night: { accent: 'from-gray-600 to-blue-800', gradient: 'bg-gradient-to-r from-gray-500 to-blue-700' }
  };
  const themeConfig = themes || defaultThemes;

  // Status scrappera
  const getScraperStatus = () => {
    if (!scraperData) return { text: "Nepoznato", color: "text-gray-500" };
    if (scraperData.status === "completed") return { text: "Uspešno", color: "text-emerald-500" };
    if (scraperData.status === "in_progress") return { text: "U toku", color: "text-amber-500" };
    if (scraperData.status === "failure") return { text: "Greška", color: "text-rose-500" };
    return { text: "Nepoznato", color: "text-gray-500" };
  };

  const formatScraperTime = () => {
    if (!scraperData) return "Nepoznato";
    const candidates = [
      scraperData.formattedTimestamp,
      scraperData.timestamp,
      scraperData.raw?.updated_at,
      scraperData.raw?.run_started_at,
      scraperData.raw?.created_at,
    ];
    for (const c of candidates) {
      if (c) {
        const d = new Date(c);
        if (!isNaN(d.getTime())) {
          return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")} ${String(
            d.getHours()
          ).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
        }
      }
    }
    return "Nepoznato";
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      const isOutsideButton = buttonRef.current && !buttonRef.current.contains(e.target);
      const isOutsideContainer = menuRef.current && !menuRef.current.contains(e.target);
      const isOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(e.target);
      if (isOutsideButton && isOutsideContainer && isOutsideDropdown) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("touchstart", handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleClick = () => setIsOpen(!isOpen);
  const handleMenuItemClick = (fn) => {
    setIsOpen(false);
    setTimeout(() => fn?.(), 100);
  };

  return (
    <div 
      className="relative inline-block text-left" 
      ref={menuRef}
      style={{ zIndex: isOpen ? 999999 : 'auto', position: 'relative' }}
    >
      {/* Enhanced Avatar button - ORIGINALNI STIL */}
      <motion.div 
        ref={buttonRef}
        onClick={handleClick} 
        whileHover={{ scale: 1.05, y: -2 }} 
        whileTap={{ scale: 0.95 }}
      >
        <motion.div 
          className={`flex items-center gap-3 px-3 py-2 ${currentTheme === 'night' ? 'bg-gray-800/40' : 'bg-white/60'} backdrop-blur-2xl rounded-full border ${currentTheme === 'night' ? 'border-white/10' : 'border-gray-100/50'} cursor-pointer transition-all duration-300`}
          style={{
            boxShadow: currentTheme === 'night'
              ? '6px 6px 12px rgba(0,0,0,0.4), -6px -6px 12px rgba(255,255,255,0.02)'
              : '6px 6px 12px rgba(0,0,0,0.08), -6px -6px 12px rgba(255,255,255,0.8)'
          }}
        >
          <motion.div 
            className={`w-8 h-8 rounded-full bg-gradient-to-br ${themeConfig[currentTheme].accent} flex items-center justify-center text-white font-bold`}
          >
            {user?.role === "admin" ? <Crown className="w-6 h-6 text-amber-400" /> : <Truck className="w-6 h-6 text-white" />}
          </motion.div>
          <span className={`font-medium ${currentTheme === 'night' ? 'text-gray-200' : 'text-gray-800'}`}>
            {user?.name || "Korisnik"}
          </span>
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
            <ChevronDown className={`w-4 h-4 ${currentTheme === 'night' ? 'text-gray-400' : 'text-gray-500'}`} />
          </motion.div>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className={`absolute right-0 mt-2 w-72 ${currentTheme === 'night' ? 'bg-gray-900/95' : 'bg-white/95'} backdrop-blur-3xl border ${currentTheme === 'night' ? 'border-white/30' : 'border-gray-300'} rounded-2xl p-4`}
            style={{
              zIndex: 999999,
              position: 'absolute',
              top: '100%',
              right: 0,
              boxShadow: currentTheme === 'night'
                ? '0 25px 50px rgba(0,0,0,0.8), 0 10px 30px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.2)'
                : '0 25px 50px rgba(0,0,0,0.15), 0 10px 30px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Profile Section */}
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-10 h-10 bg-gradient-to-br ${themeConfig[currentTheme].accent} rounded-full flex items-center justify-center text-white font-bold`}>
                {user?.role === "admin" ? <Crown className="w-6 h-6 text-amber-400" /> : <Truck className="w-6 h-6 text-white" />}
              </div>
              <div className="flex-1">
                <h3 className={`font-semibold text-sm ${currentTheme === 'night' ? 'text-gray-100' : 'text-gray-900'}`}>{user?.name}</h3>
                <p className={`text-xs ${currentTheme === 'night' ? 'text-gray-400' : 'text-gray-500'}`}>{user?.username}</p>
              </div>
            </div>

            {/* Payment Data - POPRAVLJENO */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              {user?.role !== "admin" && (
                <>
                  <motion.div 
                    className={`${currentTheme === 'night' ? 'bg-gray-800/50 border-gray-600/50' : 'bg-blue-50/80 border-blue-200/60'} border rounded-xl p-2 backdrop-blur-sm`}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className={`text-[10px] font-bold ${currentTheme === 'night' ? 'text-blue-400' : 'text-blue-600'} uppercase leading-tight`}>
                      Zadnja plata {latestPayroll.date && `(${latestPayroll.date})`}
                    </div>
                    <div className={`font-black ${currentTheme === 'night' ? 'text-blue-300' : 'text-blue-900'} text-sm mt-1`}>
                      {latestPayroll.amount ? `${latestPayroll.amount} €` : (user?.zadnjaPlata || "-")}
                    </div>
                  </motion.div>
                  <motion.div 
                    className={`${currentTheme === 'night' ? 'bg-gray-800/50 border-gray-600/50' : 'bg-emerald-50/80 border-emerald-200/60'} border rounded-xl p-2 backdrop-blur-sm`}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className={`text-[10px] font-bold ${currentTheme === 'night' ? 'text-emerald-400' : 'text-emerald-600'} uppercase leading-tight`}>
                      Ukupna zarada
                    </div>
                    <div className={`font-black ${currentTheme === 'night' ? 'text-emerald-300' : 'text-emerald-900'} text-sm mt-1`}>
                      {user?.ukupnaZarada || "-"}
                    </div>
                  </motion.div>
                </>
              )}
            </div>

            {/* Admin Scraper Status */}
            {user?.role === "admin" && scraperData && (
              <div className={`${currentTheme === 'night' ? 'bg-gray-800/50 border-gray-600/50' : 'bg-blue-50/80 border-blue-200/60'} border rounded-xl p-2 mb-3 backdrop-blur-sm`}>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 opacity-70"><Activity size={12}/> Status:</span>
                  <span className={`font-medium ${getScraperStatus().color}`}>{getScraperStatus().text}</span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1">
                  <span className="flex items-center gap-1 opacity-70"><Clock size={12}/> Vrijeme:</span>
                  <span className="font-mono">{formatScraperTime()}</span>
                </div>
              </div>
            )}

            {/* Action Buttons - ORIGINALNI STIL */}
            <div className="space-y-1">
              <Button
                variant="ghost" size="sm"
                className={`w-full justify-start text-left ${user?.role === 'admin' ? 'text-blue-600' : 'text-emerald-600'} rounded-xl py-2 text-sm`}
                onClick={() => handleMenuItemClick(() => navigate(user?.role === 'admin' ? "/admin" : "/payroll-list"))}
              >
                {user?.role === "admin" ? <Crown className="w-4 h-4 mr-2" /> : <Wallet className="w-4 h-4 mr-2" />}
                {user?.role === "admin" ? "Admin Panel" : "Platne liste"}
              </Button>
              <Button
                variant="ghost" size="sm"
                className="w-full justify-start text-left text-amber-600 rounded-xl py-2 text-sm"
                onClick={() => handleMenuItemClick(onChangePassword)}
              >
                <KeyRound className="w-4 h-4 mr-2" /> Promijeni šifru
              </Button>
              <Button
                variant="ghost" size="sm"
                className="w-full justify-start text-left text-rose-600 rounded-xl py-2 text-sm"
                onClick={onLogout}
              >
                <LogOut className="w-4 h-4 mr-2" /> Odjava
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
