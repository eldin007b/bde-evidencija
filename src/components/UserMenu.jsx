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
  const [urlaubDays, setUrlaubDays] = useState(0);

  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (!user || user.role === "admin") return;

      try {
        // ===============================
        // 1️⃣ DOHVAT PLATA
        // ===============================

        const searchName = user?.name?.toLowerCase()?.trim();
        if (!searchName) return;

        const { data: payrollData } = await supabase
          .from("payroll_amounts")
          .select("file_name, neto, ukupni_trosak")
          .ilike("driver_name", searchName);

        if (payrollData && payrollData.length > 0) {
          const sum = payrollData.reduce((acc, curr) => {
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

          const sorted = [...payrollData].sort((a, b) => {
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
        }

        // ===============================
        // 2️⃣ GODIŠNJI OBRAČUN
        // ===============================

        const driverCode = user?.username; // npr 8640
        if (!driverCode) return;

        const { data: settings } = await supabase
          .from("urlaub_settings")
          .select("*")
          .eq("driver", driverCode)
          .single();

        if (!settings) return;

        const startDate = new Date(settings.start_date);
        const startDays = settings.start_days;

        const now = new Date();

        const months =
          (now.getFullYear() - startDate.getFullYear()) * 12 +
          (now.getMonth() - startDate.getMonth());

        const earned = startDays + months * 2;

        const { data: usedData } = await supabase
          .from("urlaub_marks")
          .select("id")
          .eq("driver", driverCode)
          .eq("is_active", true)
          .gte("date", settings.start_date);

        const used = usedData?.length || 0;

        setUrlaubDays(earned - used);

      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, [user]);

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
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-3 w-80 bg-white/95 backdrop-blur-3xl border border-gray-200 rounded-3xl p-5 shadow-2xl"
          >
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

            {user?.role !== "admin" && (
              <div className="space-y-4 mb-6">

                <div className="rounded-2xl p-4 bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-200/30 shadow-md">
                  <div className="text-xs text-blue-500 font-semibold uppercase">
                    Plata {latestPayroll.date && `(${latestPayroll.date})`}
                  </div>
                  <div className="mt-2 text-3xl font-black text-blue-700">
                    {latestPayroll.amount}
                  </div>
                </div>

                <div className="rounded-2xl p-4 bg-gradient-to-br from-emerald-600/10 to-green-600/10 border border-emerald-200/30 shadow-md">
                  <div className="text-xs text-emerald-500 font-semibold uppercase">
                    Ukupna zarada
                  </div>
                  <div className="mt-2 text-3xl font-black text-emerald-700">
                    {totalEarnings}
                  </div>
                </div>

                <div className="rounded-2xl p-4 bg-gradient-to-br from-amber-600/10 to-orange-600/10 border border-amber-200/30 shadow-md">
                  <div className="text-xs text-amber-500 font-semibold uppercase">
                    Godišnji odmor
                  </div>
                  <div className="mt-2 text-3xl font-black text-amber-700">
                    {urlaubDays} dana
                  </div>
                </div>

              </div>
            )}

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
