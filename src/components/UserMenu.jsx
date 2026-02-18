import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
// Uvezi supabase klijent - putanja mora biti tačna prema tvom projektu
import { supabase } from "../db/supabaseClient"; 
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
  const [latestPayroll, setLatestPayroll] = useState(null); // Stanje za pravu zadnju platu
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // NOVO: Učitavanje stvarne zadnje plate direktno iz baze
  useEffect(() => {
    const fetchLatestPayroll = async () => {
      if (!user || user.role === "admin") return;

      try {
        const { data, error } = await supabase
          .from('payrolls')
          .select('file_name')
          .eq('driver_name', (user.username || user.driverName || "").toLowerCase())
          .order('created_at', { ascending: false })
          .limit(1);

        if (!error && data && data.length > 0) {
          // Pretvara "01_2026.pdf" u "01/2026"
          const display = data[0].file_name
            .replace('.pdf', '')
            .replace('.PDF', '')
            .replace('_', '/');
          setLatestPayroll(display);
        }
      } catch (err) {
        console.error("Greška pri dohvatu zadnje plate za meni:", err);
      }
    };

    fetchLatestPayroll();
  }, [user]);

  // Ostali postojeći efekti i funkcije (defaultThemes, getScraperStatus, formatScraperTime, itd.)
  const defaultThemes = {
    default: { accent: 'from-blue-600 to-purple-600', gradient: 'bg-gradient-to-r from-blue-500 to-purple-500' },
    sunrise: { accent: 'from-orange-500 to-pink-500', gradient: 'bg-gradient-to-r from-orange-400 to-pink-400' },
    afternoon: { accent: 'from-blue-500 to-cyan-500', gradient: 'bg-gradient-to-r from-blue-400 to-cyan-400' },
    evening: { accent: 'from-purple-600 to-indigo-600', gradient: 'bg-gradient-to-r from-purple-500 to-indigo-500' },
    night: { accent: 'from-gray-600 to-blue-800', gradient: 'bg-gradient-to-r from-gray-500 to-blue-700' }
  };
  const themeConfig = themes || defaultThemes;

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
    <div className="relative inline-block text-left" ref={menuRef} style={{ zIndex: isOpen ? 999999 : 'auto', position: 'relative' }}>
      {/* Avatar Button */}
      <motion.div ref={buttonRef} onClick={handleClick} whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
        <div className={`flex items-center gap-3 px-3 py-2 ${currentTheme === 'night' ? 'bg-gray-800/40' : 'bg-white/60'} backdrop-blur-2xl rounded-full border ${currentTheme === 'night' ? 'border-white/10' : 'border-gray-100/50'} cursor-pointer shadow-sm`}>
          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${themeConfig[currentTheme].accent} flex items-center justify-center text-white font-bold`}>
            {user?.role === "admin" ? <Crown size={18} /> : <Truck size={18} />}
          </div>
          <span className={`font-medium ${currentTheme === 'night' ? 'text-gray-200' : 'text-gray-800'}`}>{user?.name || "Korisnik"}</span>
          <ChevronDown className="w-4 h-4" />
        </div>
      </motion.div>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`absolute right-0 mt-2 w-72 ${currentTheme === 'night' ? 'bg-gray-900' : 'bg-white'} border rounded-2xl p-4 shadow-2xl`}
            style={{ zIndex: 999999 }}
          >
            {/* User Info */}
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 bg-gradient-to-br ${themeConfig[currentTheme].accent} rounded-full flex items-center justify-center text-white`}>
                {user?.role === "admin" ? <Crown size={20} /> : <Truck size={20} />}
              </div>
              <div>
                <h3 className="font-bold text-sm">{user?.name}</h3>
                <p className="text-xs text-gray-500">{user?.username}</p>
              </div>
            </div>

            {/* PAYMENT DATA SECTION - Ovdje je popravak */}
            {user?.role !== "admin" && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className={`p-2 rounded-xl border ${currentTheme === 'night' ? 'bg-gray-800 border-gray-700' : 'bg-blue-50 border-blue-100'}`}>
                  <p className="text-[10px] font-bold text-blue-500 uppercase">Zadnja plata</p>
                  <p className="text-sm font-black">
                    {/* Prioritet dajemo novom stanju latestPayroll, ako nema onda starom user.zadnjaPlata */}
                    {latestPayroll || user?.zadnjaPlata || "-"}
                  </p>
                </div>
                <div className={`p-2 rounded-xl border ${currentTheme === 'night' ? 'bg-gray-800 border-gray-700' : 'bg-emerald-50 border-emerald-100'}`}>
                  <p className="text-[10px] font-bold text-emerald-500 uppercase">Ukupna zarada</p>
                  <p className="text-sm font-black">{user?.ukupnaZarada || "-"}</p>
                </div>
              </div>
            )}

            {/* Scraper info for Admin */}
            {user?.role === "admin" && scraperData && (
               <div className="mb-4 p-2 bg-gray-50 rounded-lg text-xs">
                 <div className="flex justify-between"><span>Status:</span><span className={getScraperStatus().color}>{getScraperStatus().text}</span></div>
                 <div className="flex justify-between mt-1"><span>Ažurirano:</span><span>{formatScraperTime()}</span></div>
               </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-1">
              {user?.role === "admin" ? (
                <Button variant="ghost" className="w-full justify-start text-blue-600" onClick={() => handleMenuItemClick(() => navigate("/admin"))}>
                  <Crown className="w-4 h-4 mr-2" /> Admin Panel
                </Button>
              ) : (
                <Button variant="ghost" className="w-full justify-start text-emerald-600" onClick={() => handleMenuItemClick(() => navigate("/payroll-list"))}>
                  <Wallet className="w-4 h-4 mr-2" /> Platne liste
                </Button>
              )}
              <Button variant="ghost" className="w-full justify-start" onClick={() => handleMenuItemClick(onChangePassword)}>
                <KeyRound className="w-4 h-4 mr-2" /> Šifra
              </Button>
              <Button variant="ghost" className="w-full justify-start text-red-500" onClick={onLogout}>
                <LogOut className="w-4 h-4 mr-2" /> Odjava
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
