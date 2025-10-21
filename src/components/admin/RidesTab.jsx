import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, CheckCircle, XCircle, Clock, Calendar, MapPin, Hash, Euro, FileText, Edit3, Eye, Filter } from 'lucide-react';
import { supabase } from '../../db/supabaseClient';
import { format } from 'date-fns';
import ModernModal from './ModernModal';

// Helper hook za responsive dizajn
const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
};

// StatusBadge komponenta sa enhanced animacijama
const StatusBadge = ({ status, children }) => {
  const badgeConfig = {
    pending: {
      colors: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      hoverColors: 'hover:bg-yellow-500/30 hover:border-yellow-400/50',
      pulse: 'animate-pulse'
    },
    approved: {
      colors: 'bg-green-500/20 text-green-300 border-green-500/30',
      hoverColors: 'hover:bg-green-500/30 hover:border-green-400/50',
      pulse: ''
    },
    rejected: {
      colors: 'bg-red-500/20 text-red-300 border-red-500/30',
      hoverColors: 'hover:bg-red-500/30 hover:border-red-400/50',
      pulse: ''
    }
  };

  const config = badgeConfig[status] || badgeConfig.pending;

  return (
    <motion.span 
      className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-300 cursor-default ${config.colors} ${config.hoverColors} ${config.pulse}`}
      whileHover={{ 
        scale: 1.05,
        y: -1
      }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {children}
    </motion.span>
  );
};

// ActionButton komponenta sa enhanced animacijama
const ActionButton = ({ onClick, bgColor, children, disabled = false }) => {
  return (
    <motion.button
      whileHover={{ 
        scale: disabled ? 1 : 1.05,
        y: disabled ? 0 : -1,
        boxShadow: disabled ? "none" : "0 8px 25px rgba(0,0,0,0.15)"
      }}
      whileTap={{ 
        scale: disabled ? 1 : 0.95,
        y: disabled ? 0 : 1
      }}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition-all duration-200 shadow-md ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'
      }`}
      style={{ backgroundColor: disabled ? '#9CA3AF' : bgColor }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {children}
    </motion.button>
  );
};

// EmptyState komponenta sa enhanced animacijama
const EmptyState = ({ icon, text, subtext }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 20,
        duration: 0.5
      }}
      className="text-center py-12"
    >
      <motion.div 
        className="text-5xl mb-3"
        animate={{ 
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0]
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        }}
      >
        {icon}
      </motion.div>
      <motion.p 
        className="text-lg font-semibold text-gray-300 mb-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {text}
      </motion.p>
      <motion.p 
        className="text-sm text-gray-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {subtext}
      </motion.p>
    </motion.div>
  );
};

const RidesTab = () => {
  const [currentTheme, setCurrentTheme] = useState('default');
  
  // Theme logic
  useEffect(() => {
    const updateTheme = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 8) setCurrentTheme('sunrise');
      else if (hour >= 8 && hour < 12) setCurrentTheme('default');
      else if (hour >= 12 && hour < 17) setCurrentTheme('afternoon');
      else if (hour >= 17 && hour < 20) setCurrentTheme('evening');
      else setCurrentTheme('night');
    };

    updateTheme();
    const interval = setInterval(updateTheme, 60000);
    return () => clearInterval(interval);
  }, []);

  const isNightTheme = currentTheme === 'night';
  const isTablet = useMediaQuery('(min-width: 768px)');
  const [pendingRides, setPendingRides] = useState([]);
  const [approvedRides, setApprovedRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRide, setSelectedRide] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingRide, setEditingRide] = useState(null);
  const [editForm, setEditForm] = useState({
    driver: '',
    date: '',
    tura: '',
    plz: '',
    broj_adresa: '',
    cijena: '',
    notes: ''
  });
  const [filterMonth, setFilterMonth] = useState(format(new Date(), 'yyyy-MM'));

  // Statistics
  const totalRides = pendingRides.length + approvedRides.length;
  const pendingCount = pendingRides.length;
  const approvedCount = approvedRides.length;

  // Funkcija za učitavanje vožnji iz Supabase
  const fetchRides = useCallback(async () => {
    setLoading(true);
    
    try {
      const [year, month] = filterMonth.split('-');
      
      // Koristi tačan datum opseg
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      
      const from = format(startDate, 'yyyy-MM-dd');
      const to = format(endDate, 'yyyy-MM-dd');
      
      console.log('📅 [RidesTab] Date range:', from, 'to', to);
      
      // Fetch approved extra rides from extra_rides table (JSONB structure)
      const { data: approvedData, error: approvedError } = await supabase
        .from('extra_rides')
        .select('id, driver_id, driver_name, ride_details, status, created_at, notes')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(100);

      // Fetch pending extra rides from extra_rides_pending table with proper columns
      const { data: pendingData, error: pendingError } = await supabase
        .from('extra_rides_pending')
        .select('id, date, driver, tura, plz, broj_adresa, cijena, status, notes, created_at, created_by')
        .eq('status', 'pending')
        .order('date', { ascending: false })
        .limit(50);

      if (approvedError) {
        console.error('Error fetching approved rides:', approvedError);
      }
      if (pendingError) {
        console.error('❌ [RidesTab] Error fetching pending rides:', pendingError);
      }

      // Mapiranje podataka iz baze u format koji komponenta očekuje sa error handling
      const mappedPending = (pendingData || []).map(ride => {
        try {
          // Za pending rides koristimo tačnu 'date' kolonu koja postoji
          const rideDate = ride.date || new Date().toISOString();
          return {
            id: ride.id,
            vozac: ride.driver || 'N/A',
            datum: format(new Date(rideDate), 'dd.MM.yyyy'),
            tura: ride.tura || 'N/A',
            plz: ride.plz || 'N/A',
            brojAdresa: ride.broj_adresa || 0,
            cijena: `${ride.cijena || 0}€`,
            status: ride.status || 'pending',
            napomena: ride.notes || ''
          };
        } catch (err) {
          console.error('❌ [RidesTab] Error mapping pending ride:', ride, err);
          return null;
        }
      }).filter(Boolean);

      const mappedApproved = (approvedData || []).map(ride => {
        try {
          // Extract data from JSONB ride_details
          const details = ride.ride_details || {};
          const rideDate = details.date || ride.created_at || new Date().toISOString();
          
          return {
            id: ride.id,
            vozac: ride.driver_name || ride.driver_id || 'N/A',
            datum: format(new Date(rideDate), 'dd.MM.yyyy'),
            tura: details.tura || 'N/A',
            plz: details.plz || 'N/A',
            brojAdresa: details.broj_adresa || 0,
            cijena: `${details.cijena || 0}€`,
            status: 'approved',
            napomena: ride.notes || ''
          };
        } catch (err) {
          console.error('❌ [RidesTab] Error mapping approved ride:', ride, err);
          return null;
        }
      }).filter(Boolean);

      setPendingRides(mappedPending);
      setApprovedRides(mappedApproved);

    } catch (error) {
      console.error('❌ [RidesTab] Error fetching rides:', error);
      setPendingRides([]);
      setApprovedRides([]);
    } finally {
      setLoading(false);
    }
  }, [filterMonth]);

  useEffect(() => {
    fetchRides();
  }, [fetchRides]);

  // Funkcija za odobravanje vožnje
  const approveRide = async (rideId) => {
    try {
      // Pronađi vožnju u pending listi
      const ride = pendingRides.find(r => r.id === rideId);
      if (!ride) return;

      // Učitaj originalne podatke iz pending tabele
      const { data: originalRide, error: fetchError } = await supabase
        .from('extra_rides_pending')
        .select('date, driver, tura, plz, broj_adresa, cijena, notes, created_by')
        .eq('id', rideId)
        .single();

      if (fetchError) throw fetchError;

      // Pripremi podatke za extra_rides tabelu (koristi JSONB strukturu)
      const insertData = {
        driver_id: originalRide.driver,
        driver_name: originalRide.driver,
        ride_details: {
          date: originalRide.date,
          tura: originalRide.tura || '',
          plz: originalRide.plz || '',
          broj_adresa: originalRide.broj_adresa || 0,
          cijena: originalRide.cijena || 0,
          original_pending_id: rideId
        },
        status: 'approved',
        reviewed_by: 'Admin',
        reviewed_at: new Date().toISOString()
      };
      
      if (originalRide.notes) insertData.notes = originalRide.notes;
      
      const { error: insertError } = await supabase
        .from('extra_rides')
        .insert([insertData]);

      if (insertError) throw insertError;

      // Ukloni iz pending tabele
      const { error: deleteError } = await supabase
        .from('extra_rides_pending')
        .delete()
        .eq('id', rideId);

      if (deleteError) throw deleteError;

      // Refresh podatke
      await fetchRides();
      
      alert('Vožnja je uspešno odobrena!');
    } catch (error) {
      console.error('❌ [RidesTab] Error approving ride:', error);
      alert('Greška pri odobravanju vožnje: ' + error.message);
    }
  };

  // Funkcija za odbijanje vožnje
  const rejectRide = async (rideId) => {
    try {
      // Označi kao odbačenu
      const { error } = await supabase
        .from('extra_rides_pending')
        .update({ status: 'rejected' })
        .eq('id', rideId);

      if (error) throw error;

      // Refresh podatke
      await fetchRides();
      
      alert('Vožnja je odbijena!');
    } catch (error) {
      console.error('❌ [RidesTab] Error rejecting ride:', error);
      alert('Greška pri odbijanju vožnje: ' + error.message);
    }
  };

  // Funkcija za otvaranje edit modala
  const openEditModal = (ride, isPending = true) => {
    console.log('📝 [RidesTab] Opening edit modal for ride:', ride);
    
    setEditingRide({ ...ride, isPending });
    setEditForm({
      driver: ride.vozac,
      date: ride.datum.split('.').reverse().join('-'), // DD.MM.YYYY -> YYYY-MM-DD
      tura: ride.tura,
      plz: ride.plz,
      broj_adresa: ride.brojAdresa,
      cijena: parseFloat(ride.cijena.replace('€', '')),
      notes: ride.napomena || ''
    });
    setEditModalVisible(true);
  };

  // Funkcija za čuvanje izmena
  const saveRideEdit = async () => {
    if (!editingRide) return;
    
    try {
      console.log('💾 [RidesTab] Saving ride edit:', editForm);
      
      let updateData;
      let tableName;
      
      if (editingRide.isPending) {
        // Za pending rides - standardna struktura
        tableName = 'extra_rides_pending';
        updateData = {
          driver: editForm.driver,
          tura: editForm.tura,
          plz: editForm.plz,
          cijena: parseFloat(editForm.cijena)
        };
        if (editForm.notes) updateData.notes = editForm.notes;
      } else {
        // Za approved rides - JSONB struktura
        tableName = 'extra_rides';
        updateData = {
          driver_name: editForm.driver,
          ride_details: {
            tura: editForm.tura,
            plz: editForm.plz,
            cijena: parseFloat(editForm.cijena),
            broj_adresa: parseInt(editForm.broj_adresa) || 0
          },
          updated_at: new Date().toISOString()
        };
        if (editForm.notes) updateData.notes = editForm.notes;
      }
      
      const { error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', editingRide.id);

      if (error) throw error;

      // Zatvori modal i refresh podatke
      setEditModalVisible(false);
      setEditingRide(null);
      await fetchRides();
      
      alert('Vožnja je uspešno izmenjena!');
    } catch (error) {
      console.error('❌ [RidesTab] Error saving ride edit:', error);
      alert('Greška pri čuvanju izmena: ' + error.message);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`p-4 sm:p-6 rounded-2xl ${
        isNightTheme ? 'bg-gray-800/50' : 'bg-white/50'
      } backdrop-blur-xl border ${
        isNightTheme ? 'border-gray-700' : 'border-white/20'
      } shadow-xl`}
    >
      {/* Header */}
      <motion.div 
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <motion.div 
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <motion.div
            whileHover={{ 
              scale: 1.1, 
              rotate: [0, -10, 10, -10, 0],
              transition: { duration: 0.5 }
            }}
            whileTap={{ scale: 0.95 }}
            className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg"
          >
            <Car className="w-6 h-6 text-white" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className={`text-xl sm:text-2xl font-bold ${
              isNightTheme ? 'text-white' : 'text-gray-900'
            }`}>
              Extra vožnje
            </h2>
            <p className={`text-sm ${
              isNightTheme ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Odobravanje i upravljanje vožnjama
            </p>
          </motion.div>
        </motion.div>

        <motion.div 
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div
            whileHover={{ scale: 1.1, rotate: 180 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Filter className={`w-4 h-4 ${isNightTheme ? 'text-gray-400' : 'text-gray-600'}`} />
          </motion.div>
          <motion.input
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            whileFocus={{ scale: 1.02 }}
            className={`px-4 py-2 rounded-xl border-2 transition-all duration-200 ${
              isNightTheme 
                ? 'bg-gray-800/50 border-gray-600 text-white focus:border-blue-400' 
                : 'bg-white/80 border-gray-200 text-gray-900 focus:border-blue-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:shadow-md`}
          />
        </motion.div>
      </motion.div>

      {/* Statistics */}
      <motion.div 
        className="grid grid-cols-3 gap-2 sm:gap-4 mb-6"
        variants={{
          show: {
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
        initial="hidden"
        animate="show"
      >
        <motion.div 
          variants={{
            hidden: { opacity: 0, y: 20, scale: 0.8 },
            show: { opacity: 1, y: 0, scale: 1 }
          }}
          whileHover={{ 
            scale: 1.05, 
            y: -3,
            transition: { type: "spring", stiffness: 400, damping: 10 }
          }}
          whileTap={{ scale: 0.95 }}
          className={`p-3 sm:p-4 rounded-xl ${
            isNightTheme ? 'bg-gray-700/50' : 'bg-white/70'
          } backdrop-blur-sm border ${
            isNightTheme ? 'border-gray-600' : 'border-white/30'
          } cursor-pointer transition-all duration-300 hover:shadow-lg`}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500">
              <Car className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <p className={`text-lg sm:text-2xl font-bold ${
                isNightTheme ? 'text-white' : 'text-gray-900'
              }`}>
                {totalRides}
              </p>
              <p className={`text-xs sm:text-sm ${
                isNightTheme ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Ukupno
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          variants={{
            hidden: { opacity: 0, y: 20, scale: 0.8 },
            show: { opacity: 1, y: 0, scale: 1 }
          }}
          whileHover={{ 
            scale: 1.05, 
            y: -3,
            transition: { type: "spring", stiffness: 400, damping: 10 }
          }}
          whileTap={{ scale: 0.95 }}
          className={`p-3 sm:p-4 rounded-xl ${
            isNightTheme ? 'bg-gray-700/50' : 'bg-white/70'
          } backdrop-blur-sm border ${
            isNightTheme ? 'border-gray-600' : 'border-white/30'
          } cursor-pointer transition-all duration-300 hover:shadow-lg`}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <p className={`text-lg sm:text-2xl font-bold ${
                isNightTheme ? 'text-white' : 'text-gray-900'
              }`}>
                {pendingCount}
              </p>
              <p className={`text-xs sm:text-sm ${
                isNightTheme ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Pending
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          variants={{
            hidden: { opacity: 0, y: 20, scale: 0.8 },
            show: { opacity: 1, y: 0, scale: 1 }
          }}
          whileHover={{ 
            scale: 1.05, 
            y: -3,
            transition: { type: "spring", stiffness: 400, damping: 10 }
          }}
          whileTap={{ scale: 0.95 }}
          className={`p-3 sm:p-4 rounded-xl ${
            isNightTheme ? 'bg-gray-700/50' : 'bg-white/70'
          } backdrop-blur-sm border ${
            isNightTheme ? 'border-gray-600' : 'border-white/30'
          } cursor-pointer transition-all duration-300 hover:shadow-lg`}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <p className={`text-lg sm:text-2xl font-bold ${
                isNightTheme ? 'text-white' : 'text-gray-900'
              }`}>
                {approvedCount}
              </p>
              <p className={`text-xs sm:text-sm ${
                isNightTheme ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Odobreno
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Pending vožnje */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className={`text-lg font-bold mb-3 ${isNightTheme ? 'text-white' : 'text-gray-900'}`}>
          ⏳ Vožnje na čekanju
        </h3>
        {loading ? (
          <div className="text-center py-8">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className={`inline-block text-3xl ${isNightTheme ? 'text-white' : 'text-gray-900'}`}
            >
              🔄
            </motion.div>
            <p className={`mt-2 ${isNightTheme ? 'text-gray-400' : 'text-gray-600'}`}>Učitavanje...</p>
          </div>
        ) : pendingRides.length === 0 ? (
          <EmptyState icon={<span>✅</span>} text="Nema vožnji na čekanju" subtext="Sve vožnje su obrađene." />
        ) : (
          <motion.div 
            className="grid grid-cols-1 gap-3 mb-6"
            variants={{
              show: {
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
            initial="hidden"
            animate="show"
          >
            {pendingRides.map((ride, index) => (
              <motion.div 
                key={ride.id}
                variants={{
                  hidden: { opacity: 0, x: -20, scale: 0.95 },
                  show: { opacity: 1, x: 0, scale: 1 }
                }}
                whileHover={{ 
                  scale: 1.02, 
                  y: -2,
                  transition: { type: "spring", stiffness: 300 }
                }}
                whileTap={{ scale: 0.98 }}
                className={`p-4 rounded-xl border backdrop-blur-sm cursor-pointer transition-all duration-300 ${
                  isNightTheme 
                    ? 'bg-yellow-500/10 border-yellow-500/30 hover:bg-yellow-500/20 hover:border-yellow-400/50' 
                    : 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100 hover:border-yellow-300'
                } hover:shadow-lg`}
              >
              <div className="flex items-center justify-between mb-3">
                <span className={`font-bold text-base ${isNightTheme ? 'text-white' : 'text-gray-900'}`}>
                  👤 {ride.vozac}
                </span>
                <StatusBadge status={ride.status}>⏳ Pending</StatusBadge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                <div className={`text-sm ${isNightTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                  <span className="opacity-70">📅</span> <strong>{ride.datum}</strong>
                </div>
                <div className={`text-sm ${isNightTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                  <span className="opacity-70">🚛</span> <strong>{ride.tura}</strong>
                </div>
                <div className={`text-sm ${isNightTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                  <span className="opacity-70">📍</span> <strong>{ride.plz}</strong>
                </div>
                <div className={`text-sm ${isNightTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                  <span className="opacity-70">🏠</span> <strong>{ride.brojAdresa}</strong>
                </div>
                <div className={`text-sm ${isNightTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                  <span className="opacity-70">💰</span> <strong>{ride.cijena}</strong>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <ActionButton onClick={() => approveRide(ride.id)} bgColor="#28a745">
                  ✅ Odobri
                </ActionButton>
                <ActionButton onClick={() => rejectRide(ride.id)} bgColor="#dc3545">
                  ❌ Odbij
                </ActionButton>
                <ActionButton onClick={() => openEditModal(ride, true)} bgColor="#ffc107">
                  ✏️ Uredi
                </ActionButton>
                <ActionButton onClick={() => { setSelectedRide(ride); setModalVisible(true); }} bgColor="#007bff">
                  📋 Detalji
                </ActionButton>
              </div>
            </motion.div>
          ))}
          </motion.div>
        )}
      </motion.div>
      
      {/* Odobrene vožnje */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className={`text-lg font-bold mb-3 mt-6 ${isNightTheme ? 'text-white' : 'text-gray-900'}`}>
          ✅ Odobrene vožnje
        </h3>
        {approvedRides.length === 0 ? (
          <EmptyState icon={<span>📋</span>} text="Nema odobrenih vožnji" subtext="Za odabrani mesec." />
        ) : (
          <motion.div 
            className={`grid ${isTablet ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}
            variants={{
              show: {
                transition: {
                  staggerChildren: 0.08
                }
              }
            }}
            initial="hidden"
            animate="show"
          >
            {approvedRides.map((ride, index) => (
              <motion.div 
                key={ride.id}
                variants={{
                  hidden: { opacity: 0, y: 20, scale: 0.95 },
                  show: { opacity: 1, y: 0, scale: 1 }
                }}
                whileHover={{ 
                  scale: 1.02, 
                  y: -2,
                  transition: { type: "spring", stiffness: 300 }
                }}
                whileTap={{ scale: 0.98 }}
                className={`p-4 rounded-xl border backdrop-blur-sm cursor-pointer transition-all duration-300 ${
                  isNightTheme 
                    ? 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20 hover:border-green-400/50' 
                    : 'bg-green-50 border-green-200 hover:bg-green-100 hover:border-green-300'
                } hover:shadow-lg`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`font-bold text-base ${isNightTheme ? 'text-white' : 'text-gray-900'}`}>
                  👤 {ride.vozac}
                </span>
                <StatusBadge status="approved">✅ Odobreno</StatusBadge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                <div className={`text-sm ${isNightTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                  📅 {ride.datum}
                </div>
                <div className={`text-sm ${isNightTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                  🚛 {ride.tura}
                </div>
                <div className={`text-sm ${isNightTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                  📍 {ride.plz}
                </div>
                <div className={`text-sm ${isNightTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                  🏠 {ride.brojAdresa}
                </div>
                <div className={`text-sm ${isNightTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                  💰 {ride.cijena}
                </div>
              </div>
              <div className="flex gap-2">
                <ActionButton onClick={() => openEditModal(ride, false)} bgColor="#ffc107">
                  ✏️ Uredi
                </ActionButton>
                <ActionButton onClick={() => { setSelectedRide(ride); setModalVisible(true); }} bgColor="#007bff">
                  📋 Detalji
                </ActionButton>
              </div>
            </motion.div>
          ))}
          </motion.div>
        )}
      </motion.div>
      
      {/* Detalji Modal */}
      <ModernModal 
        open={modalVisible} 
        title="📋 Detalji vožnje" 
        onClose={() => setModalVisible(false)} 
        showActions={false}
      >
        {selectedRide && (
          <div className="space-y-3">
            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 items-center">
              <strong className={isNightTheme ? 'text-white' : 'text-gray-900'}>👤 Vozač:</strong>
              <span className={`${isNightTheme ? 'text-gray-300' : 'text-gray-700'}`}>{selectedRide.vozac}</span>
              
              <strong className={isNightTheme ? 'text-white' : 'text-gray-900'}>📅 Datum:</strong>
              <span className={`${isNightTheme ? 'text-gray-300' : 'text-gray-700'}`}>{selectedRide.datum}</span>
              
              <strong className={isNightTheme ? 'text-white' : 'text-gray-900'}>🚛 Tura:</strong>
              <span className={`${isNightTheme ? 'text-gray-300' : 'text-gray-700'}`}>{selectedRide.tura}</span>
              
              <strong className={isNightTheme ? 'text-white' : 'text-gray-900'}>📍 PLZ:</strong>
              <span className={`${isNightTheme ? 'text-gray-300' : 'text-gray-700'}`}>{selectedRide.plz}</span>
              
              <strong className={isNightTheme ? 'text-white' : 'text-gray-900'}>🏠 Broj adresa:</strong>
              <span className={`${isNightTheme ? 'text-gray-300' : 'text-gray-700'}`}>{selectedRide.brojAdresa}</span>
              
              <strong className={isNightTheme ? 'text-white' : 'text-gray-900'}>💰 Cijena:</strong>
              <span className={`${isNightTheme ? 'text-gray-300' : 'text-gray-700'}`}>{selectedRide.cijena}</span>
              
              <strong className={isNightTheme ? 'text-white' : 'text-gray-900'}>📊 Status:</strong>
              <span className={`${isNightTheme ? 'text-gray-300' : 'text-gray-700'}`}>{selectedRide.status}</span>
              
              {selectedRide.napomena && (
                <>
                  <strong className={isNightTheme ? 'text-white' : 'text-gray-900'}>📝 Napomena:</strong>
                  <span className={`${isNightTheme ? 'text-gray-300' : 'text-gray-700'}`}>{selectedRide.napomena}</span>
                </>
              )}
            </div>
          </div>
        )}
      </ModernModal>

      {/* Edit Modal */}
      <ModernModal 
        open={editModalVisible} 
        title={`✏️ Uredi vožnju ${editingRide?.isPending ? '(Pending)' : '(Odobreno)'}`}
        onClose={() => setEditModalVisible(false)} 
        onSubmit={saveRideEdit} 
        loading={loading}
        submitLabel="💾 Sačuvaj promjene"
        closeLabel="❌ Otkaži"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block mb-2 font-semibold ${isNightTheme ? 'text-white' : 'text-gray-900'}`}>
                👤 Vozač:
              </label>
              <input
                type="text"
                value={editForm.driver}
                onChange={(e) => setEditForm({...editForm, driver: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border-2 transition-all ${
                  isNightTheme 
                    ? 'bg-gray-800/50 border-gray-600 text-white focus:border-blue-400' 
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              />
            </div>
            
            <div>
              <label className={`block mb-2 font-semibold ${isNightTheme ? 'text-white' : 'text-gray-900'}`}>
                📅 Datum:
              </label>
              <input
                type="date"
                value={editForm.date}
                onChange={(e) => setEditForm({...editForm, date: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border-2 transition-all ${
                  isNightTheme 
                    ? 'bg-gray-800/50 border-gray-600 text-white focus:border-blue-400' 
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block mb-2 font-semibold ${isNightTheme ? 'text-white' : 'text-gray-900'}`}>
                🚛 Tura:
              </label>
              <input
                type="text"
                value={editForm.tura}
                onChange={(e) => setEditForm({...editForm, tura: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border-2 transition-all ${
                  isNightTheme 
                    ? 'bg-gray-800/50 border-gray-600 text-white focus:border-blue-400' 
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              />
            </div>
            
            <div>
              <label className={`block mb-2 font-semibold ${isNightTheme ? 'text-white' : 'text-gray-900'}`}>
                📍 PLZ:
              </label>
              <input
                type="text"
                value={editForm.plz}
                onChange={(e) => setEditForm({...editForm, plz: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border-2 transition-all ${
                  isNightTheme 
                    ? 'bg-gray-800/50 border-gray-600 text-white focus:border-blue-400' 
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block mb-2 font-semibold ${isNightTheme ? 'text-white' : 'text-gray-900'}`}>
                🏠 Broj adresa:
              </label>
              <input
                type="number"
                min="1"
                value={editForm.broj_adresa}
                onChange={(e) => setEditForm({...editForm, broj_adresa: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border-2 transition-all ${
                  isNightTheme 
                    ? 'bg-gray-800/50 border-gray-600 text-white focus:border-blue-400' 
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              />
            </div>
            
            <div>
              <label className={`block mb-2 font-semibold ${isNightTheme ? 'text-white' : 'text-gray-900'}`}>
                💰 Cijena (€):
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={editForm.cijena}
                onChange={(e) => setEditForm({...editForm, cijena: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border-2 transition-all ${
                  isNightTheme 
                    ? 'bg-gray-800/50 border-gray-600 text-white focus:border-blue-400' 
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              />
            </div>
          </div>
          
          <div>
            <label className={`block mb-2 font-semibold ${isNightTheme ? 'text-white' : 'text-gray-900'}`}>
              📝 Napomena:
            </label>
            <textarea
              value={editForm.notes}
              onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
              rows={3}
              className={`w-full px-3 py-2 rounded-lg border-2 transition-all resize-vertical ${
                isNightTheme 
                  ? 'bg-gray-800/50 border-gray-600 text-white focus:border-blue-400 placeholder-gray-500' 
                  : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 placeholder-gray-400'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              placeholder="Dodajte napomenu..."
            />
          </div>
        </div>
      </ModernModal>
    </motion.div>
  );
};

export default RidesTab;
