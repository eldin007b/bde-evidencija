import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Search, Phone, MessageSquare, ChevronDown, ChevronUp, MapPin, User, ArrowLeft, Send, X, Truck, Layers } from "lucide-react";
import { supabase } from "@/db/supabaseClient";
import useDrivers from "@/hooks/useDrivers";
import useSimpleAuth from "@/hooks/useSimpleAuth";

export default function ImenikScreen() {
  const navigate = useNavigate();
  const { currentUser: user } = useSimpleAuth();
  const { availableRoutes } = useDrivers();
  
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTour, setSelectedTour] = useState("SVE"); // Default sada na SVE zbog testiranja
  const [expandedPlz, setExpandedPlz] = useState(null);
  
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [customSms, setCustomSms] = useState("");
  const [smsMode, setSmsMode] = useState("template1");

  useEffect(() => {
    const name = user?.name?.toLowerCase() || user?.ime?.toLowerCase() || "";
    if (name.includes("eldin")) setSelectedTour("8610");
    else if (name.includes("denis")) setSelectedTour("8620");
    else if (name.includes("nina")) setSelectedTour("8630");
    else if (name.includes("arnes")) setSelectedTour("8640");
    else setSelectedTour("SVE");
  }, [user]);

  useEffect(() => {
    const fetchContacts = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from("contact").select("*").order("adresa", { ascending: true });
        if (error) {
          console.error("Greška iz baze:", error);
          throw error;
        }
        console.log("Učitani kontakti iz baze:", data); // DA VIDIMO U KONZOLI STA DOHVATA
        setContacts(data || []);
      } catch (err) {
        console.error("Greška pri učitavanju kontakata:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchContacts();
  }, []);

  const filteredContacts = contacts.filter(c => {
    // Pametno filtriranje ture koje ignorira razmake
    const tourFromDb = c.tura ? c.tura.toString().trim() : "";
    const matchesTour = selectedTour === "SVE" || tourFromDb === selectedTour;
    
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      (c.ime && c.ime.toLowerCase().includes(searchLower)) ||
      (c.adresa && c.adresa.toLowerCase().includes(searchLower)) ||
      (c.telefon && c.telefon.includes(searchQuery));
    
    return matchesTour && matchesSearch;
  });

  const groupedByPlz = filteredContacts.reduce((acc, c) => {
    // Bolji Regex: pronalazi bilo koja 4 broja u nizu (Poštanski broj)
    const plzMatch = c.adresa ? c.adresa.match(/\b\d{4}\b/) : null;
    const plz = plzMatch ? plzMatch[0] : "Ostalo";
    
    if (!acc[plz]) acc[plz] = [];
    acc[plz].push(c);
    return acc;
  }, {});

  const getSmsText = (contact, mode, customText) => {
    const name = contact?.ime || "Kunde";
    if (mode === "template1") return `Guten Tag ${name}, hier ist Ihr GLS-Fahrer. Ich schaffe die Zustellung heute zeitlich leider nicht mehr bis zu Ihrer Adresse. Gibt es eine alternative Zustellmöglichkeit (z.B. Paketshop)? Vielen Dank!`;
    if (mode === "template2") return `Guten Tag ${name}, hier ist Ihr GLS-Fahrer. Da die Straße wegen des Schnees sehr glatt ist, wollte ich fragen, ob ich Ihr Paket an einem anderen Ort (z.B. Paketshop) zustellen kann? Gibt es eine Alternative? Vielen Dank!`;
    return customText;
  };

  const handleSendSms = () => {
    if (!selectedContact || !selectedContact.telefon) return;
    const text = getSmsText(selectedContact, smsMode, customSms);
    window.location.href = `sms:${selectedContact.telefon}?body=${encodeURIComponent(text)}`;
    setIsSmsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 pb-10 font-sans">
      <div className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-xl p-4 border-b border-slate-800 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate('/')} className="p-3 bg-slate-800 rounded-full hover:bg-slate-700 transition">
            <ArrowLeft className="w-5 h-5 text-slate-300" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
              <User className="w-5 h-5 text-blue-400" /> Imenik
            </h1>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto mt-5 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
          <input 
            type="text" placeholder="Traži po imenu, adresi ili broju..." 
            className="w-full bg-slate-800 rounded-2xl py-3.5 pl-12 pr-4 border border-slate-700 text-white focus:border-blue-500 focus:outline-none transition-all shadow-inner"
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 mt-2">
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
          {/* Dodali smo gumb SVE */}
          <button onClick={() => setSelectedTour("SVE")} className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold transition-all whitespace-nowrap ${selectedTour === "SVE" ? "bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]" : "bg-slate-800 text-slate-400 border border-slate-700"}`}>
            <Layers className="w-4 h-4" /> Sve Ture
          </button>
          {availableRoutes.map(t => (
            <button key={t} onClick={() => setSelectedTour(t)} className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold transition-all whitespace-nowrap ${selectedTour === t ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]" : "bg-slate-800 text-slate-400 border border-slate-700"}`}>
              <Truck className="w-4 h-4" /> Tura {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-400 animate-pulse font-medium">Učitavanje kontakata iz baze...</div>
        ) : Object.keys(groupedByPlz).length === 0 ? (
          <div className="text-center py-20 text-slate-500 bg-slate-800/30 rounded-3xl border border-slate-800 flex flex-col items-center">
            <User className="w-12 h-12 text-slate-600 mb-4" />
            <p>Nema kontakata. Ako si siguran da baza nije prazna, provjeri Supabase RLS postavke!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.keys(groupedByPlz).sort().map(plz => (
              <div key={plz} className="bg-slate-800/40 rounded-[2rem] border border-slate-700/50 overflow-hidden shadow-lg">
                <button onClick={() => setExpandedPlz(expandedPlz === plz ? null : plz)} className="w-full p-5 flex justify-between items-center hover:bg-slate-700/30">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-500/20 p-3 rounded-2xl border border-blue-500/20"><MapPin className="text-blue-400 w-6 h-6" /></div>
                    <div className="text-left">
                      <h2 className="text-lg font-black text-white">{plz}</h2>
                      <p className="text-sm text-slate-400 font-medium">{groupedByPlz[plz].length} kupaca</p>
                    </div>
                  </div>
                  <div className="bg-slate-800 p-2 rounded-full">{expandedPlz === plz ? <ChevronUp className="text-blue-400" /> : <ChevronDown className="text-slate-400" />}</div>
                </button>
                <AnimatePresence>
                  {expandedPlz === plz && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-slate-900/40 border-t border-slate-700/50 p-3 space-y-3">
                      {groupedByPlz[plz].map(c => (
                        <div key={c.id} className="p-4 bg-slate-800 rounded-2xl border border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <h3 className="font-bold text-white text-lg">{c.ime}</h3>
                            <p className="text-sm text-slate-400 mt-1 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {c.adresa}</p>
                            {c.telefon && <p className="text-blue-400 font-medium text-sm mt-1">{c.telefon}</p>}
                          </div>
                          <div className="flex gap-3">
                            <button onClick={() => window.location.href=`tel:${c.telefon}`} disabled={!c.telefon} className="flex-1 md:flex-none p-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl disabled:opacity-30"><Phone className="w-5 h-5 mx-auto" /></button>
                            <button onClick={() => {setSelectedContact(c); setSmsMode("template1"); setCustomSms(""); setIsSmsModalOpen(true);}} disabled={!c.telefon} className="flex-1 md:flex-none p-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-xl disabled:opacity-30"><MessageSquare className="w-5 h-5 mx-auto" /></button>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isSmsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSmsModalOpen(false)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative w-full max-w-md bg-slate-800 rounded-[2rem] p-6 border border-slate-700 shadow-2xl z-10">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-black text-xl text-white">SMS za {selectedContact?.ime?.split(' ')[0]}</h2>
                <button onClick={() => setIsSmsModalOpen(false)} className="bg-slate-700/50 p-2 rounded-full text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3 mb-8">
                <button onClick={() => setSmsMode("template1")} className={`w-full p-4 rounded-2xl border text-left ${smsMode === "template1" ? "border-blue-500 bg-blue-500/10" : "border-slate-700 bg-slate-900/50"}`}>
                  <p className={`font-bold mb-1 ${smsMode === "template1" ? "text-blue-400" : "text-white"}`}>1. Nedostatak vremena</p>
                  <p className="text-xs text-slate-400 italic">"Guten Tag {selectedContact?.ime}, ich schaffe die Zustellung..."</p>
                </button>
                <button onClick={() => setSmsMode("template2")} className={`w-full p-4 rounded-2xl border text-left ${smsMode === "template2" ? "border-blue-500 bg-blue-500/10" : "border-slate-700 bg-slate-900/50"}`}>
                  <p className={`font-bold mb-1 ${smsMode === "template2" ? "text-blue-400" : "text-white"}`}>2. Loše vrijeme (Snijeg)</p>
                  <p className="text-xs text-slate-400 italic">"Guten Tag {selectedContact?.ime}, da die Straße wegen des Schnees sehr glatt ist..."</p>
                </button>
                <button onClick={() => setSmsMode("custom")} className={`w-full p-4 rounded-2xl border text-left ${smsMode === "custom" ? "border-blue-500 bg-blue-500/10" : "border-slate-700 bg-slate-900/50"}`}>
                  <p className={`font-bold ${smsMode === "custom" ? "text-blue-400 mb-2" : "text-white"}`}>3. ✍️ Vlastita poruka</p>
                  {smsMode === "custom" && <textarea className="w-full mt-2 bg-slate-900 rounded-xl p-3 text-sm text-white border border-slate-600 focus:outline-none" rows="3" value={customSms} onChange={e => setCustomSms(e.target.value)} />}
                </button>
              </div>
              <button onClick={handleSendSms} className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl flex items-center justify-center gap-3"><Send className="w-5 h-5"/> POŠALJI SMS</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
