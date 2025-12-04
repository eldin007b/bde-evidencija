import { motion } from "framer-motion";
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, TrendingUp, Package, ChevronLeft, ChevronRight, Clock, MapPin, DollarSign, CheckCircle, XCircle, User } from 'lucide-react';
import useDrivers from '../hooks/useDrivers';
import { supabase } from '../db/supabaseClient';
import realtimeService from '../services/RealtimeService';
import stopPrices from '../db/adresaPrices.js';
import plzPrices from '../db/plzPrices.js';
import ModernModal from '../components/common/ModernModal';

const CURRENT_YEAR = new Date().getFullYear();
const MONTHS = [
  'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Juni',
  'Juli', 'August', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'
];

export default function ExtraRidesScreen() {
  const navigate = useNavigate();
  const { drivers } = useDrivers();
  const [currentTheme, setCurrentTheme] = useState('night');

  // Fiksna NIGHT tema
  const themes = {
    night: { background: 'from-slate-900 via-blue-900 to-indigo-900' }
  };

  useEffect(() => {
    setCurrentTheme('night');
  }, []);

  // state
  const initSelected = () => {
    try {
      const s = typeof window !== 'undefined' ? localStorage.getItem('bde_current_user') : null;
      if (s) {
        const u = JSON.parse(s);
        if (u?.name) return u.name;
      }
      const t = typeof window !== 'undefined' ? localStorage.getItem('DRIVER_TURA') : null;
      if (t && drivers && drivers.length) {
        const m = drivers.find(d => d.tura === t);
        if (m) return m.ime;
      }
    } catch {}
    return '';
  };
  const [selectedDriver, setSelectedDriver] = useState(initSelected);
  const autoSelectedRef = useRef(false);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [tura, setTura] = useState('');
  const [plz, setPlz] = useState('');
  const [brojAdresa, setBrojAdresa] = useState('');
  const [cijena, setCijena] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [rides, setRides] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [approvedSum, setApprovedSum] = useState(0);
  const [loading, setLoading] = useState(true);
  const [detailRide, setDetailRide] = useState(null);

  // filteri
  const [filterDriver, setFilterDriver] = useState('');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());

  // Sync selected driver with logged-in user; ignore any old manual selections
  useEffect(() => {
    // clear any stale manual selection key from older versions
    try { localStorage.removeItem('EXTRA_SELECTED_DRIVER'); } catch {}
    if (!drivers || drivers.length === 0) return;
    const getUserFromStorage = () => {
      try { return JSON.parse(localStorage.getItem('bde_current_user') || 'null'); } catch { return null; }
    };
    const u = getUserFromStorage();
    let nextName = '';
    if (u?.name) {
      nextName = u.name;
    } else {
      const t = localStorage.getItem('DRIVER_TURA');
      const byTura = t ? drivers.find(d => d.tura === t) : null;
      if (byTura) nextName = byTura.ime;
    }
    if (nextName && nextName !== selectedDriver) {
      setSelectedDriver(nextName);
    }
    autoSelectedRef.current = true;
  }, [drivers]);

  // dropdown opcije: svi vozači + ulogovani (ako ga nema iz nekog razloga)
  const optionDrivers = useMemo(() => {
    const all = drivers ? [...drivers] : [];
    const currentUser = (() => { try { return JSON.parse(localStorage.getItem('bde_current_user') || 'null'); } catch { return null; } })();
    const current = currentUser?.username ? all.find(d => d.tura === currentUser.username) : null;
    const list = current ? [current, ...all] : all;
    const seen = new Set();
    const deduped = list.filter(d => {
      const key = d.tura || d.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    
    // Sortiraj prioritetne ture prvo
    const priority = ['8610', '8620', '8630', '8640'];
    deduped.sort((a, b) => {
      const ai = priority.indexOf(String(a.tura));
      const bi = priority.indexOf(String(b.tura));
      if (ai !== -1 || bi !== -1) {
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      }
      // fallback: po tura pa ime
      const ta = String(a.tura || '');
      const tb = String(b.tura || '');
      const cmp = ta.localeCompare(tb, undefined, { numeric: true });
      if (cmp !== 0) return cmp;
      return String(a.ime || '').localeCompare(String(b.ime || ''), undefined, { sensitivity: 'base' });
    });
    
    // Dodaj "Svi vozači" opciju na početak
    return [{ ime: '', tura: 'ALL' }, ...deduped];
  }, [drivers]);

  // fetch vožnje
  const fetchRides = useCallback(async () => {
    setLoading(true);
    try {
      const startDate = new Date(filterYear, filterMonth, 1);
      const endDate = new Date(filterYear, filterMonth + 1, 0);
      const from = format(startDate, 'yyyy-MM-dd');
      const to = format(endDate, 'yyyy-MM-dd');

      console.log('📊 [FETCH RIDES] Date range:', { from, to });
      console.log('📊 [FETCH RIDES] Filter params:', { filterYear, filterMonth });
      console.log('📊 [FETCH RIDES] Učitavam odobrene vožnje iz extra_rides tabele...');
      
      // Filtriraj po created_at za ovaj mesec
      const { data: approved, error: approvedError } = await supabase
        .from('extra_rides')
        .select('*')
        .gte('created_at', `${filterYear}-${(filterMonth + 1).toString().padStart(2, '0')}-01`)
        .lte('created_at', `${filterYear}-${(filterMonth + 1).toString().padStart(2, '0')}-31`);
      
      console.log('📊 [FETCH RIDES] Raw approved data:', approved);
      console.log('📊 [FETCH RIDES] Approved error:', approvedError);

      console.log('📊 [FETCH RIDES] Učitavam pending vožnje iz extra_rides_pending tabele...');
      // Filtriraj po datumu za ovaj mesec
      const { data: pending, error: pendingError } = await supabase
        .from('extra_rides_pending')
        .select('*')
        .gte('date', from)
        .lte('date', to)
        .eq('status', 'pending');
      
      console.log('📊 [FETCH RIDES] Raw pending data:', pending);
      console.log('📊 [FETCH RIDES] Pending error:', pendingError);

      // Map approved rides from JSONB structure 
      let allApproved = (approved || []).map((ride, index) => {
        console.log(`🔄 [FETCH RIDES] Mapping approved ride ${index + 1}:`, ride);
        
        if (ride.ride_details) {
          // JSONB struktura
          const details = ride.ride_details;
          const mappedRide = {
            id: ride.id,
            driver: details.driver || details.vozac || ride.driver_name,
            date: details.date || details.datum,
            tura: details.tura,
            plz: details.plz,
            broj_adresa: details.broj_adresa || details.brojAdresa,
            cijena: details.cijena || 0,
            status: 'approved',
            created_at: ride.created_at
          };
          console.log(`✅ [FETCH RIDES] Mapped approved ride ${index + 1}:`, mappedRide);
          console.log(`📅 [FETCH RIDES] Date value for ride ${index + 1}:`, mappedRide.date, typeof mappedRide.date);
          return mappedRide;
        } else {
          // Obična struktura (backup)
          const mappedRide = { ...ride, status: 'approved' };
          console.log(`📅 [FETCH RIDES] Direct mapped ride ${index + 1}:`, mappedRide);
          console.log(`📅 [FETCH RIDES] Date value for direct ride ${index + 1}:`, mappedRide.date, typeof mappedRide.date);
          return mappedRide;
        }
      });
      
      let allPending = pending || [];

      console.log('🔄 [FETCH RIDES] Mapped approved rides:', allApproved);
      console.log('🔄 [FETCH RIDES] Raw pending rides:', allPending);

      if (filterDriver) {
        allApproved = allApproved.filter(r => r.driver === filterDriver);
        allPending = allPending.filter(r => r.driver === filterDriver);
      }

      const all = [
        ...allPending.map(r => ({ ...r, status: 'pending' })),
        ...allApproved.map(r => ({ ...r, status: 'approved' }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date));

      setRides(all);
      setPendingCount(allPending.length);
      setApprovedCount(allApproved.length);
      setApprovedSum(allApproved.reduce((s, r) => s + (r.cijena || 0), 0));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filterYear, filterMonth, filterDriver]);

  useEffect(() => { fetchRides(); }, [fetchRides]);

  // kalkulacija cijene
  useEffect(() => {
    const adresaNum = parseInt(brojAdresa);
    const plzNum = parseInt(plz);
    const adresaCijena = (!isNaN(adresaNum) && stopPrices[adresaNum]) ? stopPrices[adresaNum] : 0;
    const plzCijena = (!isNaN(plzNum) && plzPrices[plzNum]) ? plzPrices[plzNum] : 0;
    setCijena(adresaCijena + plzCijena);
  }, [brojAdresa, plz]);

  // submit
  const handleSubmit = async () => {
    if (!selectedDriver || !date || !tura || !plz || !brojAdresa) {
      alert('Unesite sve podatke!');
      return;
    }
    
    console.log('🚀 [DODAJ VOŽNJU] Početak dodavanja vožnje...');
    console.log('🔍 [DODAJ VOŽNJU] Supabase client status:', !!supabase);
    console.log('🔍 [DODAJ VOŽNJU] Supabase URL:', supabase?.supabaseUrl);
    setSubmitting(true);
    
    try {
      const currentUser = (() => { try { return JSON.parse(localStorage.getItem('bde_current_user') || 'null'); } catch { return null; } })();
      const adresaNum = parseInt(brojAdresa);
      const plzNum = parseInt(plz);
      const adresaPrice = stopPrices[adresaNum] || 0;
      const plzPrice = plzPrices[plzNum] || 0;

      const rideData = {
        driver: selectedDriver,
        date,
        tura,
        plz,
        broj_adresa: adresaNum,
        cijena,
        plz_price: plzPrice,
        adresa_price: adresaPrice,
        // auditable/required fields
        action: 'create',
        created_by: currentUser?.username || tura || null,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      console.log('🔄 [DODAJ VOŽNJU] Podaci za slanje:', rideData);
      console.log('🔄 [DODAJ VOŽNJU] Pozivam supabase.from("extra_rides_pending").insert()...');
      
      const { error } = await supabase.from('extra_rides_pending').insert([rideData]);
      
      console.log('✅ [DODAJ VOŽNJU] Supabase odgovor - error:', error);
      if (error) throw error;

      console.log('✅ [DODAJ VOŽNJU] Vožnja uspešno dodana u bazu!');
      
      // 🚀 INSTANT CACHE INVALIDATION - sada će svi videti nove podatke odmah!
      console.log('🔄 [DODAJ VOŽNJU] Pozivam realtimeService.triggerDataChange()...');
      try {
        realtimeService.triggerDataChange('extraRides');
        console.log('✅ [DODAJ VOŽNJU] RealtimeService triggerovan uspešno');
      } catch (realtimeErr) {
        console.error('❌ [DODAJ VOŽNJU] RealtimeService greška:', realtimeErr);
      }
      
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setTura(''); setPlz(''); setBrojAdresa(''); setCijena(0);
      // fokus na Tura nakon uspješnog dodavanja
      if (turaRef.current) {
        turaRef.current.focus();
      }
      console.log('🔄 [DODAJ VOŽNJU] Pozivam fetchRides() za refresh podataka...');
      try {
        await fetchRides();
        console.log('✅ [DODAJ VOŽNJU] fetchRides() završen uspešno');
      } catch (fetchErr) {
        console.error('❌ [DODAJ VOŽNJU] fetchRides() greška:', fetchErr);
      }
      
      alert('Vožnja dodana!');
    } catch (err) {
      console.error('❌ [DODAJ VOŽNJU] GREŠKA:', err);
      console.error('❌ [DODAJ VOŽNJU] Error name:', err.name);
      console.error('❌ [DODAJ VOŽNJU] Error message:', err.message);
      console.error('❌ [DODAJ VOŽNJU] Error stack:', err.stack);
      alert('Greška: ' + err.message);
    } finally {
      console.log('🏁 [DODAJ VOŽNJU] Završetak procesa dodavanja');
      setSubmitting(false);
    }
  };

  // refs za fokus na input polja
  const dateRef = useRef(null);
  const turaRef = useRef(null);
  const plzRef = useRef(null);
  const brojAdresaRef = useRef(null);

  // Handler za Enter key - prebacuje na sledeće polje
  const handleKeyDown = (e, nextRef) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (nextRef && nextRef.current) {
        nextRef.current.focus();
      }
    }
  };

  // Navigacija za mjesece
  const previousMonth = () => { 
    if (filterMonth === 0) { 
      setFilterMonth(11); 
      setFilterYear(filterYear - 1); 
    } else { 
      setFilterMonth(filterMonth - 1); 
    } 
  };
  
  const nextMonth = () => { 
    if (filterMonth === 11) { 
      setFilterMonth(0); 
      setFilterYear(filterYear + 1); 
    } else { 
      setFilterMonth(filterMonth + 1); 
    } 
  };

  // Helper functions
  const getThemeBackground = () => {
    const themeObj = themes[currentTheme] || themes['default'];
    return `bg-gradient-to-br ${themeObj.background}`;
  };

  const successColor = currentTheme === 'night' ? '#4ade80' : '#15803d';
  const warningColor = currentTheme === 'night' ? '#fb7185' : '#dc2626';

  return (
    <div className={`min-h-screen ${getThemeBackground()} ${currentTheme === 'night' ? 'text-white' : 'text-gray-800'}`}>
      {/* Modern Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className={`${currentTheme === 'night' ? 'bg-gray-800/40 border-gray-700/50' : 'bg-white/60 border-gray-200/50'} backdrop-blur-xl border-b sticky top-0 z-50`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 md:py-4">
          <div className="flex items-center gap-4">
            <motion.button 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }} 
              onClick={() => navigate('/')} 
              className={`p-2 rounded-xl ${currentTheme === 'night' ? 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300' : 'bg-gray-100/50 hover:bg-gray-200/50 text-gray-600'} transition-all duration-200`}
            >
              <ArrowLeft className="w-6 h-6" />
            </motion.button>
            <h1 className={`text-2xl md:text-3xl font-bold ${currentTheme === 'night' ? 'text-white' : 'text-gray-800'}`}>
              Posebne Vožnje
            </h1>
          </div>
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 md:py-8">
        {/* Month Selector & Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1 }} 
          className={`mb-6 p-4 md:p-6 rounded-2xl ${currentTheme === 'night' ? 'bg-gray-800/40 border-gray-700/50' : 'bg-white/60 border-gray-200/30'} border backdrop-blur-xl`}
        >
          <div className="flex items-center justify-between mb-6">
            <motion.button 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }} 
              onClick={previousMonth} 
              className={`p-2 rounded-lg ${currentTheme === 'night' ? 'bg-gray-700/50 hover:bg-gray-600/50' : 'bg-gray-100/50 hover:bg-gray-200/50'} transition-all`}
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
            <div className="text-center">
              <h2 className={`text-2xl font-bold ${currentTheme === 'night' ? 'text-white' : 'text-gray-800'}`}>
                {MONTHS[filterMonth]} {filterYear}
              </h2>
            </div>
            <motion.button 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }} 
              onClick={nextMonth} 
              className={`p-2 rounded-lg ${currentTheme === 'night' ? 'bg-gray-700/50 hover:bg-gray-600/50' : 'bg-gray-100/50 hover:bg-gray-200/50'} transition-all`}
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className={`p-4 rounded-xl ${currentTheme === 'night' ? 'bg-gray-700/30' : 'bg-gray-50/50'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Clock className={`w-5 h-5 ${currentTheme === 'night' ? 'text-yellow-400' : 'text-yellow-600'}`} />
                <span className={`text-sm ${currentTheme === 'night' ? 'text-gray-400' : 'text-gray-600'}`}>Na čekanju</span>
              </div>
              <p className={`text-2xl font-bold ${currentTheme === 'night' ? 'text-white' : 'text-gray-800'}`}>
                {pendingCount}
              </p>
            </div>

            <div className={`p-4 rounded-xl ${currentTheme === 'night' ? 'bg-gray-700/30' : 'bg-gray-50/50'}`}>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className={`w-5 h-5 ${currentTheme === 'night' ? 'text-green-400' : 'text-green-600'}`} />
                <span className={`text-sm ${currentTheme === 'night' ? 'text-gray-400' : 'text-gray-600'}`}>Odobreno</span>
              </div>
              <p className={`text-2xl font-bold ${currentTheme === 'night' ? 'text-white' : 'text-gray-800'}`}>
                {approvedCount}
              </p>
            </div>

            <div className={`p-4 rounded-xl ${currentTheme === 'night' ? 'bg-gray-700/30' : 'bg-gray-50/50'}`}>
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className={`w-5 h-5 ${currentTheme === 'night' ? 'text-blue-400' : 'text-blue-600'}`} />
                <span className={`text-sm ${currentTheme === 'night' ? 'text-gray-400' : 'text-gray-600'}`}>Ukupno</span>
              </div>
              <p className={`text-2xl font-bold ${currentTheme === 'night' ? 'text-white' : 'text-gray-800'}`}>
                {approvedSum.toFixed(0)}€
              </p>
            </div>
          </div>

          {/* Form za dodavanje vožnje */}
          <div className={`p-4 rounded-xl ${currentTheme === 'night' ? 'bg-gray-700/30' : 'bg-gray-50/50'}`}>
            <h3 className={`text-lg font-bold mb-4 ${currentTheme === 'night' ? 'text-white' : 'text-gray-800'}`}>
              Dodaj novu vožnju
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${currentTheme === 'night' ? 'text-gray-300' : 'text-gray-700'}`}>
                  <Calendar className="w-4 h-4 inline mr-1" /> Datum
                </label>
                <input 
                  ref={dateRef}
                  type="date" 
                  value={date} 
                  onChange={e => setDate(e.target.value)}
                  onClick={e => e.target.showPicker && e.target.showPicker()}
                  onKeyDown={e => handleKeyDown(e, turaRef)}
                  className={`w-full px-3 py-2 rounded-lg ${currentTheme === 'night' ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${currentTheme === 'night' ? 'text-gray-300' : 'text-gray-700'}`}>
                  <User className="w-4 h-4 inline mr-1" /> Vozač
                </label>
                <input 
                  type="text" 
                  value={selectedDriver || ''} 
                  disabled 
                  placeholder="Ulogovani vozač"
                  className={`w-full px-3 py-2 rounded-lg ${currentTheme === 'night' ? 'bg-gray-800 text-gray-400 border-gray-600' : 'bg-gray-100 text-gray-600 border-gray-300'} border`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${currentTheme === 'night' ? 'text-gray-300' : 'text-gray-700'}`}>
                  <Package className="w-4 h-4 inline mr-1" /> Tura
                </label>
                <input 
                  ref={turaRef}
                  type="number" 
                  placeholder="4 broja (1000-9999)" 
                  min="1000"
                  max="9999"
                  value={tura} 
                  onChange={e => {
                    const value = e.target.value;
                    if (value === '' || (value.length <= 4 && !isNaN(value))) {
                      setTura(value);
                    }
                  }}
                  onKeyDown={e => handleKeyDown(e, plzRef)}
                  className={`w-full px-3 py-2 rounded-lg ${currentTheme === 'night' ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${currentTheme === 'night' ? 'text-gray-300' : 'text-gray-700'}`}>
                  <MapPin className="w-4 h-4 inline mr-1" /> PLZ
                </label>
                <input 
                  ref={plzRef}
                  type="number" 
                  placeholder="PLZ" 
                  value={plz} 
                  onChange={e => setPlz(e.target.value)}
                  onKeyDown={e => handleKeyDown(e, brojAdresaRef)}
                  className={`w-full px-3 py-2 rounded-lg ${currentTheme === 'night' ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${currentTheme === 'night' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Broj adresa
                </label>
                <input 
                  ref={brojAdresaRef}
                  type="number" 
                  placeholder="Broj adresa" 
                  value={brojAdresa} 
                  onChange={e => setBrojAdresa(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      // Na poslednjem polju, možemo submitovati formu
                      const submitBtn = document.querySelector('button[type="button"]');
                      if (submitBtn) submitBtn.click();
                    }
                  }}
                  className={`w-full px-3 py-2 rounded-lg ${currentTheme === 'night' ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${currentTheme === 'night' ? 'text-gray-300' : 'text-gray-700'}`}>
                  <DollarSign className="w-4 h-4 inline mr-1" /> Cijena
                </label>
                <input 
                  type="text" 
                  value={`${cijena.toFixed(2)} €`} 
                  disabled 
                  className={`w-full px-3 py-2 rounded-lg ${currentTheme === 'night' ? 'bg-gray-800 text-green-400 border-gray-600' : 'bg-gray-100 text-green-600 border-gray-300'} border font-bold`}
                />
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={submitting}
              className={`mt-4 w-full px-6 py-3 rounded-xl font-medium transition-all ${
                submitting 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : currentTheme === 'night' 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {submitting ? 'Dodavanje...' : 'Dodaj vožnju'}
            </motion.button>
          </div>
        </motion.div>

        {/* Lista vožnji */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2 }} 
          className={`rounded-2xl ${currentTheme === 'night' ? 'bg-gray-800/40 border-gray-700/50' : 'bg-white/70 border-gray-200/30'} border backdrop-blur-xl overflow-hidden`}
        >
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className={currentTheme === 'night' ? 'text-gray-400' : 'text-gray-600'}>Učitavanje...</p>
            </div>
          ) : rides.length === 0 ? (
            <div className="p-8 text-center">
              <Package className={`w-16 h-16 mx-auto mb-4 ${currentTheme === 'night' ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`text-lg font-medium mb-2 ${currentTheme === 'night' ? 'text-white' : 'text-gray-900'}`}>
                Nema vožnji
              </p>
              <p className={currentTheme === 'night' ? 'text-gray-400' : 'text-gray-600'}>
                Dodajte prvu posebnu vožnju gore
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${currentTheme === 'night' ? 'bg-gray-700/50' : 'bg-gray-100/80'}`}>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold" style={{ color: currentTheme === 'night' ? '#fff' : '#1f2937' }}>Datum</th>
                    <th className="px-4 py-3 text-left text-xs font-bold" style={{ color: currentTheme === 'night' ? '#fff' : '#1f2937' }}>Vozač</th>
                    <th className="px-4 py-3 text-center text-xs font-bold" style={{ color: currentTheme === 'night' ? '#fff' : '#1f2937' }}>Tura</th>
                    <th className="px-4 py-3 text-center text-xs font-bold" style={{ color: currentTheme === 'night' ? '#fff' : '#1f2937' }}>PLZ</th>
                    <th className="px-4 py-3 text-center text-xs font-bold" style={{ color: currentTheme === 'night' ? '#fff' : '#1f2937' }}>Adrese</th>
                    <th className="px-4 py-3 text-center text-xs font-bold" style={{ color: currentTheme === 'night' ? '#fff' : '#1f2937' }}>Cijena</th>
                    <th className="px-4 py-3 text-center text-xs font-bold" style={{ color: currentTheme === 'night' ? '#fff' : '#1f2937' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rides.map((ride, idx) => (
                    <motion.tr 
                      key={idx}
                      initial={{ opacity: 0, x: -20 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      transition={{ delay: idx * 0.02 }}
                      onClick={() => setDetailRide(ride)}
                      className={`border-t ${currentTheme === 'night' ? 'border-gray-700/50 hover:bg-gray-700/30' : 'border-gray-200/50 hover:bg-gray-50'} cursor-pointer transition-colors`}
                    >
                      <td className="px-4 py-3 text-sm" style={{ color: currentTheme === 'night' ? '#e5e7eb' : '#374151' }}>
                        {(() => {
                          try {
                            if (!ride.date) return 'N/A';
                            const date = new Date(ride.date);
                            if (isNaN(date.getTime())) return 'Invalid Date';
                            return format(date, 'dd.MM.yyyy');
                          } catch (err) {
                            console.error('❌ Date formatting error for ride:', ride, err);
                            return 'Error';
                          }
                        })()}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: currentTheme === 'night' ? '#e5e7eb' : '#374151' }}>
                        {ride.driver}
                      </td>
                      <td className="px-4 py-3 text-center text-sm" style={{ color: currentTheme === 'night' ? '#e5e7eb' : '#374151' }}>
                        {ride.tura}
                      </td>
                      <td className="px-4 py-3 text-center text-sm" style={{ color: currentTheme === 'night' ? '#e5e7eb' : '#374151' }}>
                        {ride.plz}
                      </td>
                      <td className="px-4 py-3 text-center text-sm" style={{ color: currentTheme === 'night' ? '#e5e7eb' : '#374151' }}>
                        {ride.broj_adresa}
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-bold" style={{ color: currentTheme === 'night' ? '#4ade80' : '#15803d' }}>
                        {Number(ride.cijena).toFixed(0)}€
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          ride.status === 'approved' 
                            ? currentTheme === 'night' ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'
                            : ride.status === 'rejected'
                            ? currentTheme === 'night' ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'
                            : currentTheme === 'night' ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {ride.status === 'approved' ? <CheckCircle className="w-3 h-3" /> : 
                           ride.status === 'rejected' ? <XCircle className="w-3 h-3" /> : 
                           <Clock className="w-3 h-3" />}
                          {ride.status === 'approved' ? 'Odobreno' : 
                           ride.status === 'rejected' ? 'Odbijeno' : 
                           'Čekanje'}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </main>

      {/* Modal za detalje */}
      {detailRide && (
        <ModernModal
          isOpen={!!detailRide}
          onClose={() => setDetailRide(null)}
          title="Detalji vožnje"
        >
          <div className="space-y-3">
            <div><strong>Datum:</strong> {format(new Date(detailRide.date), 'dd.MM.yyyy')}</div>
            <div><strong>Vozač:</strong> {detailRide.driver}</div>
            <div><strong>Tura:</strong> {detailRide.tura}</div>
            <div><strong>PLZ:</strong> {detailRide.plz}</div>
            <div><strong>Broj adresa:</strong> {detailRide.broj_adresa}</div>
            <div><strong>Cijena:</strong> {Number(detailRide.cijena).toFixed(0)} €</div>
            <div>
              <strong>Status:</strong>{' '}
              <span className={
                detailRide.status === 'approved' ? 'text-green-600 font-bold' :
                detailRide.status === 'rejected' ? 'text-red-600 font-bold' :
                'text-yellow-600 font-bold'
              }>
                {detailRide.status === 'approved' ? '✅ Odobreno' :
                 detailRide.status === 'rejected' ? '❌ Odbijeno' :
                 '⏳ Na čekanju'}
              </span>
            </div>
          </div>
        </ModernModal>
      )}
    </div>
  );
}

