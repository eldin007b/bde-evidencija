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

export default function UserMenu({
  user,
  onChangePassword,
  onLogout,
  scraperData,
  currentTheme = "default",
  themes,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [latestPayroll, setLatestPayroll] = useState({
    amount: "---",
    date: "",
  });
  const [totalEarnings, setTotalEarnings] = useState("0,00 €");

  const menuRef = useRef(null);
  const navigate = useNavigate();

  /* ======================================================
     FETCH PLATA (SORTIRANJE PO GODINI I MJESECU IZ FAJLA)
  ====================================================== */
 useEffect(() => {
  const fetchPayrollData = async () => {
    if (!user || user.role === "admin" || !supabase) return;

    try {
      const searchName = (user.username || user.name || "")
        .toLowerCase()
        .trim();

      const { data, error } = await supabase
        .from("payroll_amounts")
        .select("file_name, neto")
        .eq("driver_name", searchName);

      if (error) {
        console.error("Greška pri dohvatu plata:", error);
        return;
      }

      if (!data || data.length === 0) {
        setLatestPayroll({ amount: "---", date: "" });
        setTotalEarnings("0,00 €");
        return;
      }

      // 🔥 SORT PO GODINI I MJESECU
      const sorted = [...data].sort((a, b) => {
        const parse = (name) => {
          const clean = name.replace(".pdf", "").replace(".PDF", "");
          const [month, year] = clean.split("_");
          return {
            y: parseInt(year) || 0,
            m: parseInt(month) || 0,
          };
        };

        const A = parse(a.file_name);
        const B = parse(b.file_name);

        if (B.y !== A.y) return B.y - A.y;
        return B.m - A.m;
      });

      const top = sorted[0];

      // Ukupna zarada
      const sum = data.reduce(
        (acc, curr) => acc + parseFloat(curr.neto || 0),
        0
      );

      setTotalEarnings(
        sum.toLocaleString("de-DE", {
          minimumFractionDigits: 2,
        }) + " €"
      );

      setLatestPayroll({
        amount:
          parseFloat(top.neto).toLocaleString("de-DE", {
            minimumFractionDigits: 2,
          }) + " €",
        date: top.file_name
          .replace(".pdf", "")
          .replace(".PDF", "")
          .replace("_", "/"),
      });
    } catch (err) {
      console.error("Neočekivana greška:", err);
    }
  };

  fetchPayrollData();
}, [user]);

  /* ======================================================
     TEME
  ====================================================== */
  const defaultThemes = {
    default: { accent: "from-blue-600 to-purple-600" },
    sunrise: { accent: "from-orange-500 to-pink-500" },
    afternoon: { accent: "from-blue-500 to-cyan-500" },
    evening: { accent: "from-purple-600 to-indigo-600" },
    night: { accent: "from-gray-600 to-blue-800" },
  };

  const themeConfig = themes || defaultThemes;

  /* ======================================================
     SCRAPER STATUS
  ====================================================== */
  const getScraperStatus = () => {
    if (!scraperData)
      return { text: "Nepoznato", color: "text-gray-500" };
    if (scraperData.status === "completed")
      return { text: "Uspešno", color: "text-emerald-500" };
    if (scraperData.status === "in_progress")
      return { text: "U toku", color: "text-amber-500" };
    if (scraperData.status === "failure")
      return { text: "Greška", color: "text-rose-500" };
    return { text: "Nepoznato", color: "text-gray-500" };
  };

  const formatScraperTime = () => {
    if (!scraperData) return "Nepoznato";
    const candidates = [
      scraperData.formattedTimestamp,
      scraperData.timestamp,
      scraperData.raw?.updated_at,
    ];
    for (const c of candidates) {
      if (c) {
        const d = new Date(c);
        if (!isNaN(d.getTime())) {
          return `${String(d.getDate()).padStart(2, "0")}.${String(
            d.getMonth() + 1
          ).padStart(2, "0")} ${String(d.getHours()).padStart(
            2,
            "0"
          )}:${String(d.getMinutes()).padStart(2, "0")}`;
        }
      }
    }
    return "Nepoznato";
  };

  /* ======================================================
     CLICK OUTSIDE
  ====================================================== */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleMenuItemClick = (fn) => {
    setIsOpen(false);
    setTimeout(() => fn?.(), 100);
  };

  /* ======================================================
     UI
  ====================================================== */
  return (
    <div
      className="relative inline-block text-left"
      ref={menuRef}
      style={{ zIndex: isOpen ? 999999 : 50 }}
    >
      {/* Avatar Button */}
      <motion.div
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05, y: -2 }}
        className={`flex items-center gap-3 px-3 py-2 ${
          currentTheme === "night"
            ? "bg-gray-800/40 border-white/10"
            : "bg-white/60 border-gray-100/50"
        } backdrop-blur-2xl rounded-full border cursor-pointer transition-all duration-300 shadow-sm`}
      >
        <div
          className={`w-8 h-8 rounded-full bg-gradient-to-br ${
            themeConfig[currentTheme]?.accent ||
            "from-blue-500 to-purple-500"
          } flex items-center justify-center text-white`}
        >
          {user?.role === "admin" ? (
            <Crown size={16} />
          ) : (
            <Truck size={16} />
          )}
        </div>

        <span
          className={`font-medium text-sm ${
            currentTheme === "night"
              ? "text-gray-200"
              : "text-gray-800"
          }`}
        >
          {user?.name || "Korisnik"}
        </span>

        <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
          <ChevronDown
            size={14}
            className={
              currentTheme === "night"
                ? "text-gray-400"
                : "text-gray-500"
            }
          />
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className={`absolute right-0 mt-2 w-72 ${
              currentTheme === "night"
                ? "bg-gray-900/95 border-white/30"
                : "bg-white/95 border-gray-300"
            } backdrop-blur-3xl border rounded-2xl p-4 shadow-2xl`}
          >
            {/* PROFILE HEADER */}
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-10 h-10 bg-gradient-to-br ${
                  themeConfig[currentTheme]?.accent ||
                  "from-blue-500 to-purple-500"
                } rounded-full flex items-center justify-center text-white font-bold text-lg`}
              >
                {(user?.name || "K")[0]}
              </div>
              <div className="text-left">
                <h3
                  className={`font-bold text-sm ${
                    currentTheme === "night"
                      ? "text-white"
                      : "text-gray-900"
                  }`}
                >
                  {user?.name}
                </h3>
                <p className="text-xs opacity-50 mt-1">
                  {user?.username}
                </p>
              </div>
            </div>

            {/* PLATE */}
            {user?.role !== "admin" && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-2">
                  <div className="text-[10px] font-bold text-blue-500 uppercase">
                    Plata {latestPayroll.date && `(${latestPayroll.date})`}
                  </div>
                  <div className="font-black text-blue-600 text-sm mt-1">
                    {latestPayroll.amount}
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2">
                  <div className="text-[10px] font-bold text-emerald-500 uppercase">
                    Ukupna zarada
                  </div>
                  <div className="font-black text-emerald-600 text-sm mt-1">
                    {totalEarnings}
                  </div>
                </div>
              </div>
            )}

            {/* ACTIONS */}
            <div className="space-y-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-left text-emerald-600 hover:bg-emerald-50 rounded-xl py-2 text-sm"
                onClick={() =>
                  handleMenuItemClick(() =>
                    navigate(
                      user?.role === "admin"
                        ? "/admin"
                        : "/payroll-list"
                    )
                  )
                }
              >
                {user?.role === "admin" ? (
                  <Crown className="w-4 h-4 mr-2" />
                ) : (
                  <Wallet className="w-4 h-4 mr-2" />
                )}
                {user?.role === "admin"
                  ? "Admin Panel"
                  : "Platne liste"}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-left text-amber-600 hover:bg-amber-50 rounded-xl py-2 text-sm"
                onClick={() => handleMenuItemClick(onChangePassword)}
              >
                <KeyRound className="w-4 h-4 mr-2" />
                Promijeni šifru
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-left text-rose-600 hover:bg-rose-50 rounded-xl py-2 text-sm"
                onClick={onLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Odjava
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}y
