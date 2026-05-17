import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { MapPin, Truck, Users, BarChart3, Info, Navigation, ShieldAlert } from "lucide-react";
import UserMenu from "@/components/UserMenu";
import useSimpleAuth from "@/hooks/useSimpleAuth";
import { supabase } from "@/db/supabaseClient";
import ChangePasswordModal from "@/components/ChangePasswordModal";

export default function HomeScreenModern() {
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [ukupnaZarada, setUkupnaZarada] = useState("-");
  const [zadnjaPlata, setZadnjaPlata] = useState("-");
  const [particles, setParticles] = useState([]);
  
  const navigate = useNavigate();
  const { currentUser: user, logout, changePassword } = useSimpleAuth();

  const isAdmin = user?.role === "admin";

  const fetchPayroll = async () => {
    if (!user || isAdmin) return;
    try {
      const driver = user.name || user.ime || "";
      const { data } = await supabase.from("payroll_amounts").select("neto").eq("driver_name", driver.toLowerCase());
      const totalNeto = data?.reduce((sum, item) => sum + (item.neto || 0), 0) || 0;
      setUkupnaZarada(`${totalNeto.toFixed(2)} €`);
      const { data: lastData } = await supabase.from("payroll_amounts").select("neto").eq("driver_name", driver.toLowerCase()).order("created_at", { ascending: false }).limit(1);
      if (lastData?.[0]) setZadnjaPlata(`${lastData[0].neto.toFixed(2)} €`);
    } catch (err) {}
  };

  useEffect(() => {
    if (user) fetchPayroll();
    setParticles(Array.from({ length: 30 }, (_, i) => ({
      id: i, x: Math.random() * 100, y: Math.random() * 100, size: Math.random() * 3 + 1, duration: Math.random() * 20 + 10, delay: Math.random() * 5
    })));
  }, [user]);

  const menuItems = [
    { title: "Statistika", desc: "Grafovi i izvještaji", icon: <BarChart3 />, path: "/statistika", gradient: "from-purple-500 to-pink-500", iconColor: "text-purple-400" },
    { title: "Navigacija", desc: "Mapa i praćenje ruta", icon: <Navigation />, path: "/navigacija", gradient: "from-indigo-500 to-blue-500", iconColor: "text-indigo-400" },
    { title: "Dostava", desc: "Pregled po mjesecu", icon: <Truck />, path: "/deliveries", gradient: "from-blue-500 to-cyan-500", iconColor: "text-blue-400" },
    { title: "Vozači", desc: "Statistika po vozaču", icon: <Users />, path: "/drivers", gradient: "from-emerald-500 to-teal-500", iconColor: "text-emerald-400" },
    { title: "Extra vožnje", desc: "Sonderfahrt ture", icon: <MapPin />, path: "/extra-rides", gradient: "from-orange-500 to-red-500", iconColor: "text-orange-400" },
    { title: "O aplikaciji", desc: "Informacije i pomoć", icon: <Info />, path: "/about", gradient: "from-gray-500 to-slate-500", iconColor: "text-gray-400" },
  ];

  return (
    <div className="min-h-screen bg-slate-900 overflow-x-hidden relative">
      <div className="absolute inset-0 pointer-events-none">
        {particles.map(p => (
          <motion.div key={p.id} className={`absolute ${isAdmin ? 'bg-rose-400/20' : 'bg-blue-400/20'} rounded-full`} style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }} animate={{ y: [0, -100], opacity: [0, 0.5, 0] }} transition={{ duration: p.duration, repeat: Infinity, delay: p.delay }} />
        ))}
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        
        {/* HEADER SEKCIJA - DINAMIČNI STIL ZA ADMINA */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 relative z-[9999]">
          <div className={`bg-white/5 backdrop-blur-2xl border ${isAdmin ? 'border-rose-500/40 shadow-[0_0_30px_rgba(225,29,72,0.15)]' : 'border-white/10 shadow-2xl'} rounded-[2.5rem] p-6 relative z-[9999] transition-all duration-500`}>
            
            <div className="flex flex-col items-center lg:flex-row lg:justify-between gap-8 relative z-[9999]">
              
              {/* Naslov aplikacije */}
              <div className="text-center lg:text-left flex flex-col items-center lg:items-start">
                {isAdmin && <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-1 mb-1"><ShieldAlert size={12}/> Admin Mod</span>}
                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase italic drop-shadow-md">
                  B&D <span className={isAdmin ? "text-rose-500" : "text-blue-500"}>Evidencija</span>
                </h1>
              </div>

              {/* Kontejner za dugmad */}
              <div className="flex flex-col sm:flex-row w-full max-w-sm sm:max-w-none lg:w-auto gap-4 relative z-[99999]">
                
                {/* Imenik Dugme */}
                <div className="w-full sm:w-[220px]">
                  <motion.button onClick={() => navigate('/imenik')} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="relative group w-full h-full">
                    <div className="absolute inset-0 bg-blue-600/30 backdrop-blur-xl rounded-full border border-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.4)] group-hover:bg-blue-600/40 transition-all"></div>
                    <div className="relative flex items-center justify-center gap-3 px-6 py-4">
                      <Users className="w-5 h-5 text-blue-300" />
                      <span className="text-[13px] font-black text-white tracking-[0.15em] uppercase">Imenik Kupaca</span>
                    </div>
                  </motion.button>
                </div>

                {/* User Menu Dugme */}
                <div className="w-full sm:w-[240px] relative z-[999999]">
                  <UserMenu user={{ ...user, ukupnaZarada, zadnjaPlata }} onChangePassword={() => setIsChangePasswordOpen(true)} onLogout={logout} />
                </div>

              </div>

            </div>
          </div>
        </motion.div>

        {/* GRID KARTICA */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 relative z-10">
          {menuItems.map((item, index) => (
            <motion.div key={index} onClick={() => navigate(item.path)} className="group cursor-pointer" whileHover={{ y: -5 }}>
              <Card className="bg-white/5 backdrop-blur-xl border-white/10 rounded-[2rem] p-6 h-full flex flex-col items-center text-center transition-all group-hover:bg-white/10">
                <div className={`p-4 rounded-2xl bg-slate-800 mb-4 ${item.iconColor} shadow-xl group-hover:scale-110 transition-transform`}>{React.cloneElement(item.icon, { size: 32 })}</div>
                <h3 className="text-white font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-slate-400 text-xs leading-relaxed">{item.desc}</p>
                <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r ${item.gradient} rounded-full opacity-0 group-hover:opacity-100 transition-opacity`} />
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      <ChangePasswordModal isOpen={isChangePasswordOpen} onClose={() => setIsChangePasswordOpen(false)} onChangePassword={changePassword} loading={false} />
    </div>
  );
}
