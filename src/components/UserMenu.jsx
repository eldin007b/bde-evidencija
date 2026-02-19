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
} from "lucide-react";

export default function UserMenu({
  user,
  onChangePassword,
  onLogout,
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
  // DOHVAT PLATA
  // ===============================

  useEffect(() => {
    const fetchPayrollData = async () => {
      if (!user || user.role === "admin") return;

      try {
        const searchName = user?.name?.toLowerCase()?.trim();
        if (!searchName) return;

        const { data, error } = await supabase
          .from("payroll_amounts")
          .select("file_name, neto, ukupni_trosak")
          .ilike("driver_name", searchName);

        if (error) {
          console.error(error);
          return;
        }

        if (!data || data.length === 0) {
          setLatestPayroll({ amount: "---", date: "" });
          setTotalEarnings("0,00 €");
          return;
        }

        // Ukupna zarada
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

        // Sortiranje
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
            .replace("_", "/"),
        });

      } catch (err) {
        console.error(err);
      }
    };

    fetchPayrollData();
  }, [user]);

  // ===============================
  // OUTSIDE CLICK
  // ===============================

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

  return (
    <div
      className="relative inline-block text-left"
      ref={menuRef}
      style={{ zIndex: isOpen ? 999999 : 50 }}
    >
      {/* AVATAR BUTTON */}
      <motion.div
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        className="flex items-center gap-3 px-4 py-2 bg-white/60 backdrop-blur-xl rounded-full border border-gray-200 cursor-pointer shadow-sm"
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
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className="absolute right-0 mt-3 w-80 bg-white/95 backdrop-blur-3xl border border-gray-200 rounded-3xl p-5 shadow-2xl"
          >
            {/* HEADER */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-lg font-bold">
                {(user?.name || "K")[0]}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">
                  {user?.name}
                </h3>
                <p className="text-xs text-gray-500">
                  {user?.username}
                </p>
              </div>
            </div>

            {/* PLATE MODERNI DIZAJN */}
            {user?.role !== "admin" && (
              <div className="space-y-4 mb-6">

                {/* Plata */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-200/30 backdrop-blur-xl shadow-md"
                >
                  <div className="text-xs uppercase tracking-wider text-blue-500 font-semibold">
                    Plata {latestPayroll.date && `(${latestPayroll.date})`}
                  </div>

                  <div className="mt-2 text-3xl font-black text-blue-700 tracking-tight">
                    {latestPayroll.amount}
                  </div>

                  <div className="absolute -right-8 -top-8 w-28 h-28 bg-blue-400/10 rounded-full blur-3xl"></div>
                </motion.div>

                {/* Ukupna zarada */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-emerald-600/10 to-green-600/10 border border-emerald-200/30 backdrop-blur-xl shadow-md"
                >
                  <div className="text-xs uppercase tracking-wider text-emerald-500 font-semibold">
                    Ukupna zarada
                  </div>

                  <div className="mt-2 text-3xl font-black text-emerald-700 tracking-tight">
                    {totalEarnings}
                  </div>

                  <div className="absolute -right-8 -top-8 w-28 h-28 bg-emerald-400/10 rounded-full blur-3xl"></div>
                </motion.div>

              </div>
            )}

            {/* AKCIJE */}
            <div className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start text-emerald-600 hover:bg-emerald-50 rounded-xl"
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
                className="w-full justify-start text-amber-600 hover:bg-amber-50 rounded-xl"
                onClick={onChangePassword}
              >
                <KeyRound className="w-4 h-4 mr-2" />
                Promijeni šifru
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start text-rose-600 hover:bg-rose-50 rounded-xl"
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
