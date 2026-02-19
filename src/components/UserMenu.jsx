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

  // ===============================
  // PAYROLL FETCH (ISPRAVLJENO)
  // ===============================

  useEffect(() => {
    const fetchPayrollData = async () => {
      if (!user || user.role === "admin" || !supabase) return;

      try {
        // 🔥 BITNO: koristimo ISKLJUČIVO ime
        const searchName = user?.name?.toLowerCase()?.trim();

        if (!searchName) return;

        const { data, error } = await supabase
          .from("payroll_amounts")
          .select("file_name, neto, ukupni_trosak")
          .ilike("driver_name", searchName);

        if (error) {
          console.error("Greška u payroll query:", error);
          return;
        }

        if (!data || data.length === 0) {
          setLatestPayroll({ amount: "---", date: "" });
          setTotalEarnings("0,00 €");
          return;
        }

        // ===============================
        // UKUPNA ZARADA
        // ===============================

        const sum = data.reduce((acc, curr) => {
          const value = parseFloat(
            curr.ukupni_trosak ?? curr.neto ?? 0
          );
          return acc + value;
        }, 0);

        setTotalEarnings(
          sum.toLocaleString("de-DE", {
            minimumFractionDigits: 2,
          }) + " €"
        );

        // ===============================
        // SORTIRANJE PO GODINI/MJESECU
        // ===============================

        const sorted = [...data].sort((a, b) => {
          const parse = (name) => {
            const match = name.match(/(\d{2})_(\d{4})/);
            if (!match) return { m: 0, y: 0 };
            return {
              m: parseInt(match[1]),
              y: parseInt(match[2]),
            };
          };

          const dA = parse(a.file_name);
          const dB = parse(b.file_name);

          if (dB.y !== dA.y) return dB.y - dA.y;
          return dB.m - dA.m;
        });

        const latest = sorted[0];

        setLatestPayroll({
          amount:
            parseFloat(latest.neto ?? 0).toLocaleString("de-DE", {
              minimumFractionDigits: 2,
            }) + " €",
          date: latest.file_name
            .replace(".pdf", "")
            .replace(".PDF", "")
            .replace("_", "/"),
        });
      } catch (err) {
        console.error("Greška pri dohvatu payroll:", err);
      }
    };

    fetchPayrollData();
  }, [user]);

  // ===============================
  // UI OSTAJE ISTI
  // ===============================

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div
      className="relative inline-block text-left"
      ref={menuRef}
      style={{ zIndex: isOpen ? 999999 : 50 }}
    >
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-2 bg-white/60 backdrop-blur-2xl rounded-full border cursor-pointer shadow-sm"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white">
          {user?.role === "admin" ? (
            <Crown size={16} />
          ) : (
            <Truck size={16} />
          )}
        </div>
        <span className="font-medium text-sm text-gray-800">
          {user?.name || "Korisnik"}
        </span>
        <ChevronDown size={14} className="text-gray-500" />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-72 bg-white/95 backdrop-blur-3xl border rounded-2xl p-4 shadow-2xl"
          >
            {user?.role !== "admin" && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-blue-50 border rounded-xl p-2 text-left">
                  <div className="text-[10px] font-bold text-blue-500 uppercase">
                    Plata {latestPayroll.date && `(${latestPayroll.date})`}
                  </div>
                  <div className="font-black text-blue-600 text-sm mt-1">
                    {latestPayroll.amount}
                  </div>
                </div>

                <div className="bg-emerald-50 border rounded-xl p-2 text-left">
                  <div className="text-[10px] font-bold text-emerald-500 uppercase">
                    Ukupna zarada
                  </div>
                  <div className="font-black text-emerald-600 text-sm mt-1">
                    {totalEarnings}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-left text-emerald-600"
                onClick={() =>
                  navigate(
                    user?.role === "admin"
                      ? "/admin"
                      : "/payroll-list"
                  )
                }
              >
                <Wallet className="w-4 h-4 mr-2" />
                Platne liste
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-left text-amber-600"
                onClick={onChangePassword}
              >
                <KeyRound className="w-4 h-4 mr-2" />
                Promijeni šifru
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-left text-rose-600"
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
}
