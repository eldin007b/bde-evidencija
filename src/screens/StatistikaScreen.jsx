import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Calendar, 
  CalendarRange, 
  CalendarDays,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Target,
  Truck,
  User,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '../db/supabaseClient';
import useSimpleAuth from '../hooks/useSimpleAuth';

const mjeseci = [
  'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Juni',
  'Juli', 'August', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'
];

// Formatiranje datuma u DD.MM.YYYY format
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

const StatistikaScreen = () => {
  const navigate = useNavigate();
  const { currentUser } = useSimpleAuth();
  const [currentTheme, setCurrentTheme] = useState('night');
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [driverStats, setDriverStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState(null);

  const memoizedCurrentMonth = useMemo(() => mjeseci[new Date().getMonth()], []);
  const memoizedCurrentYear = useMemo(() => new Date().getFullYear(), []);

  // Fixed NIGHT Theme
  useEffect(() => {
    setCurrentTheme('night'); // Always use night theme
  }, []);

  const isNightTheme = currentTheme === 'night';

  // Target stops - ISTA logika kao u HomeScreenModern
  const getTargetStops = useCallback((tura) => {
    if (tura === '8610') return 50;
    if (tura === '8620' || tura === '8630') return 85;
    if (tura === '8640') return 80;
    return 50;
  }, []);

  // Učitaj vozače
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const { data, error } = await supabase
          .from('drivers')
          .select('*')
          .eq('aktivan', true)
          .order('ime', { ascending: true });

        if (error) throw error;
        
        setDrivers(data || []);
        
        console.log('🚗 StatistikaScreen - Loaded drivers:', data?.length || 0);
        console.log('👤 Current user:', currentUser);
        
        // Prvo pokušaj da odabereš ulogovanog vozača po imenu
        if (currentUser && (currentUser.name || currentUser.ime) && data && data.length > 0) {
          const userName = currentUser.name || currentUser.ime;
          console.log('🔍 Looking for driver with name:', userName);
          const loggedInDriver = data.find(driver => driver.ime === userName);
          if (loggedInDriver) {
            console.log('✅ Found driver by name:', loggedInDriver.ime);
            setSelectedDriver(loggedInDriver);
          } else {
            console.log('🔍 Driver not found by name, trying by tura:', currentUser.username || currentUser.tura);
            // Ako ulogovani vozač nije pronađen po imenu, pokušaj po turi
            const loggedInDriverByTura = data.find(driver => driver.tura === (currentUser.username || currentUser.tura));
            if (loggedInDriverByTura) {
              console.log('✅ Found driver by tura:', loggedInDriverByTura.ime);
              setSelectedDriver(loggedInDriverByTura);
            } else {
              console.log('❌ Driver not found, selecting first driver');
              // Ako ni po turi nije pronađen, odaberi prvog
              setSelectedDriver(data[0]);
            }
          }
        } else if (data && data.length > 0) {
          console.log('❌ No current user, selecting first driver');
          // Ako nema ulogovanog korisnika, odaberi prvog vozača
          setSelectedDriver(data[0]);
        }
      } catch (err) {
        console.error('Greška pri učitavanju vozača:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDrivers();
  }, [currentUser]); // Promenjeno sa user na currentUser

  // ISTA loadDriverStats funkcija kao u HomeScreenModern
  const loadDriverStats = useCallback(async (driver) => {
    if (!driver || !driver.tura) return;

    setStatsLoading(true);
    
    try {
      // Helper for local date ISO string (YYYY-MM-DD)
      const toLocalISO = (date) => {
        const offset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - offset).toISOString().slice(0, 10);
      };

      // Define Urlaub days
      const urlaubMarks = {
        '2025-11-07-8620': true,
        '2025-11-10-8620': true,
        '2025-11-17-8640': true,
        '2025-11-25-8640': true,
        '2025-12-10-8620': true,
        '2025-12-11-8620': true,
        '2025-12-12-8620': true
      };

      const isUrlaub = (date, tura) => {
        if (!date || !tura) return false;
        const dateStr = typeof date === 'string' ? date.slice(0, 10) : new Date(date).toISOString().slice(0, 10);
        return urlaubMarks[`${dateStr}-${tura}`];
      };

      const currentDate = new Date();
      const today = toLocalISO(currentDate);
      const monthStart = toLocalISO(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
      const monthEnd = toLocalISO(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0));
      const yearStart = toLocalISO(new Date(currentDate.getFullYear(), 0, 1));
      const yearEnd = toLocalISO(new Date(currentDate.getFullYear(), 11, 31));

      // Nađi zadnji dan dostave (fetch more to skip Urlaub days)
      const { data: lastDayData } = await supabase
        .from('deliveries')
        .select('*')
        .eq('driver', driver.tura)
        .eq('deleted', 0)
        .order('date', { ascending: false })
        .limit(10);

      // Find first non-Urlaub day
      const lastDayItem = lastDayData?.find(item => !isUrlaub(item.date, driver.tura));

      const lastDay = lastDayItem?.date ? (
        typeof lastDayItem.date === 'string' 
          ? lastDayItem.date.slice(0, 10) 
          : today
      ) : today;

      // Povuci podatke za sve periode
      const [dayResult, monthResult, yearResult] = await Promise.all([
        supabase
          .from('deliveries')
          .select('*')
          .eq('driver', driver.tura)
          .gte('date', `${lastDay}T00:00:00`)
          .lte('date', `${lastDay}T23:59:59`)
          .eq('deleted', 0),
        supabase
          .from('deliveries')
          .select('*')
          .eq('driver', driver.tura)
          .gte('date', monthStart)
          .lte('date', monthEnd)
          .eq('deleted', 0),
        supabase
          .from('deliveries')
          .select('*')
          .eq('driver', driver.tura)
          .gte('date', yearStart)
          .lte('date', yearEnd)
          .eq('deleted', 0)
      ]);

      const targetStops = getTargetStops(driver.tura);

      // Kalkulacije - ISTA logika kao u HomeScreenModern
      const calculate = (data, period) => {
        if (!data || data.length === 0) {
          return {
            packages: 0,
            diff: period === 'day' ? -targetStops : 0,
            complaints: 0,
            date: period === 'day' ? lastDay : null
          };
        }

        let filteredData = data;

        if (period === 'month') {
          const now = new Date();
          const year = now.getFullYear();
          const month = now.getMonth();

          filteredData = data.filter(item => {
            if (!item?.date) return false;
            if (isUrlaub(item.date, item.driver)) return false;

            const dateStr = typeof item.date === 'string' ? item.date.slice(0, 10) : item.date;
            const d = new Date(dateStr);
            
            const paketi = item.zustellung_paketi;
            const validPaketi = paketi !== undefined && 
                               paketi !== null && 
                               paketi !== '' && 
                               !isNaN(Number(paketi)) && 
                               Number(paketi) > 0;

            return d.getFullYear() === year &&
                   d.getMonth() === month &&
                   item.driver == driver.tura &&
                   item.deleted == 0 &&
                   validPaketi;
          });
        } else if (period === 'year') {
          filteredData = data.filter(item => {
            if (isUrlaub(item.date, item.driver)) return false;
            return parseInt(item?.produktivitaet_stops || 0, 10) > 0;
          });
        } else if (period === 'day') {
          filteredData = data.filter(item => {
            if (isUrlaub(item.date, item.driver)) return false;
            return parseInt(item?.produktivitaet_stops || 0, 10) > 0;
          });
        }

        const packages = filteredData.reduce((s, it) => 
          s + (parseInt(it?.produktivitaet_stops || 0, 10) || 0), 0
        );

        const complaints = filteredData.reduce((s, it) => 
          s + (parseInt(it?.probleme_druga || 0, 10) || 0), 0
        );

        const uniqueDays = new Set(
          filteredData.map(item => {
            if (!item?.date) return null;
            return typeof item.date === 'string' 
              ? item.date.slice(0, 10) 
              : new Date(item.date).toISOString().slice(0, 10);
          }).filter(Boolean)
        ).size || 0;

        const target = uniqueDays * targetStops;

        // Pronađi najnoviji datum sa podacima
        const latestDate = filteredData.length > 0 
          ? filteredData
              .map(item => {
                if (!item?.date) return null;
                return typeof item.date === 'string' 
                  ? item.date.slice(0, 10) 
                  : new Date(item.date).toISOString().slice(0, 10);
              })
              .filter(Boolean)
              .sort((a, b) => new Date(b) - new Date(a))[0]
          : null;

        if (period === 'day') {
          return {
            packages,
            diff: packages - targetStops,
            complaints,
            date: lastDay
          };
        }

        return {
          packages,
          diff: packages - target,
          complaints,
          date: latestDate
        };
      };

      const day = calculate(dayResult.data, 'day');
      const month = calculate(monthResult.data, 'month');
      const year = calculate(yearResult.data, 'year');

      const newStats = [
        {
          label: `Dostava (${day.date || ''})`,
          value: day.diff,
          packages: day.packages,
          complaints: day.complaints,
          target: targetStops,
          date: day.date,
          dataDate: day.date
        },
        {
          label: `Reklamacije (${day.date || ''})`,
          value: day.complaints,
          date: day.date,
          dataDate: day.date
        },
        {
          label: `Dostava za ${memoizedCurrentMonth}`,
          value: month.diff,
          packages: month.packages,
          complaints: month.complaints,
          dataDate: month.date
        },
        {
          label: `Reklamacije za ${memoizedCurrentMonth}`,
          value: month.complaints,
          dataDate: month.date
        },
        {
          label: `Dostava za ${memoizedCurrentYear}`,
          value: year.diff,
          packages: year.packages,
          complaints: year.complaints,
          dataDate: year.date
        },
        {
          label: `Reklamacije za ${memoizedCurrentYear}`,
          value: year.complaints,
          dataDate: year.date
        }
      ];

      setDriverStats(newStats);
    } catch (err) {
      console.error('Greška pri učitavanju statistika:', err);
      setError(err.message);
      setDriverStats([]);
    } finally {
      setStatsLoading(false);
    }
  }, [getTargetStops, memoizedCurrentMonth, memoizedCurrentYear]);

  useEffect(() => {
    if (selectedDriver) {
      loadDriverStats(selectedDriver);
    }
  }, [selectedDriver, loadDriverStats]);

  // Format za prikaz
  const statCards = [
    {
      title: driverStats[0]?.date ? 
        formatDate(driverStats[0].date) :
        'Danas',
      period: driverStats[0]?.dataDate ? 
        `Podaci: ${formatDate(driverStats[0].dataDate)}` :
        (driverStats[0]?.label || 'Danas'),
      delivery: {
        value: driverStats[0]?.packages || 0,
        diff: driverStats[0]?.value || 0,
        target: driverStats[0]?.target || 0,
        trend: (driverStats[0]?.value || 0) > 0 ? 'up' : (driverStats[0]?.value || 0) < 0 ? 'down' : 'neutral'
      },
      complaints: {
        value: driverStats[1]?.value || 0,
        trend: (driverStats[1]?.value || 0) === 0 ? 'good' : 'bad'
      },
      icon: Calendar
    },
    {
      title: driverStats[2]?.dataDate ? 
        mjeseci[new Date(driverStats[2].dataDate).getMonth()] :
        'Ovaj mjesec',
      period: driverStats[2]?.dataDate ? 
        `Podaci do: ${formatDate(driverStats[2].dataDate)}` :
        (driverStats[2]?.label || 'Ovaj mjesec'),
      delivery: {
        value: driverStats[2]?.packages || 0,
        diff: driverStats[2]?.value || 0,
        target: (driverStats[2]?.packages || 0) - (driverStats[2]?.value || 0), // Stvarni cilj = packages - diff
        trend: (driverStats[2]?.value || 0) > 0 ? 'up' : (driverStats[2]?.value || 0) < 0 ? 'down' : 'neutral'
      },
      complaints: {
        value: driverStats[3]?.value || 0,
        trend: (driverStats[3]?.value || 0) === 0 ? 'good' : 'bad'
      },
      icon: CalendarRange
    },
    {
      title: driverStats[4]?.dataDate ? 
        new Date(driverStats[4].dataDate).getFullYear() :
        'Ova godina',
      period: driverStats[4]?.dataDate ? 
        `Podaci do: ${formatDate(driverStats[4].dataDate)}` :
        (driverStats[4]?.label || 'Ova godina'),
      delivery: {
        value: driverStats[4]?.packages || 0,
        diff: driverStats[4]?.value || 0,
        target: (driverStats[4]?.packages || 0) - (driverStats[4]?.value || 0), // Stvarni cilj = packages - diff
        trend: (driverStats[4]?.value || 0) > 0 ? 'up' : (driverStats[4]?.value || 0) < 0 ? 'down' : 'neutral'
      },
      complaints: {
        value: driverStats[5]?.value || 0,
        trend: (driverStats[5]?.value || 0) === 0 ? 'good' : 'bad'
      },
      icon: CalendarDays
    }
  ];

  const getTrendIcon = (trend) => {
    if (trend === 'up') return TrendingUp;
    if (trend === 'down') return TrendingDown;
    if (trend === 'good') return CheckCircle2;
    if (trend === 'bad') return XCircle;
    return Package;
  };

  const getTrendColor = (trend, isComplaint = false) => {
    if (isComplaint) {
      if (trend === 'good') return isNightTheme ? 'text-green-400' : 'text-green-600';
      if (trend === 'bad') return isNightTheme ? 'text-red-400' : 'text-red-600';
    } else {
      if (trend === 'up') return isNightTheme ? 'text-green-400' : 'text-green-600';
      if (trend === 'down') return isNightTheme ? 'text-red-400' : 'text-red-600';
    }
    return isNightTheme ? 'text-gray-400' : 'text-gray-600';
  };

  // Driver navigation functions
  const previousDriver = () => {
    if (!selectedDriver || drivers.length === 0) return;
    const currentIndex = drivers.findIndex(d => d.id === selectedDriver.id);
    const prevIndex = currentIndex === 0 ? drivers.length - 1 : currentIndex - 1;
    setSelectedDriver(drivers[prevIndex]);
  };

  const nextDriver = () => {
    if (!selectedDriver || drivers.length === 0) return;
    const currentIndex = drivers.findIndex(d => d.id === selectedDriver.id);
    const nextIndex = currentIndex === drivers.length - 1 ? 0 : currentIndex + 1;
    setSelectedDriver(drivers[nextIndex]);
  };

  return (
    <div className={`min-h-screen p-4 sm:p-6 lg:p-8 ${
      isNightTheme ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900' : 'bg-gradient-to-br from-blue-50 via-white to-indigo-50'
    }`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className={`mb-6 sm:mb-8 p-4 sm:p-6 rounded-2xl ${
          isNightTheme ? 'bg-gray-800/50' : 'bg-white/80'
        } backdrop-blur-xl border ${
          isNightTheme ? 'border-gray-700' : 'border-white/20'
        } shadow-xl`}>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-4">
              <motion.button
                onClick={() => navigate('/')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-2 rounded-xl ${
                  isNightTheme 
                    ? 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300' 
                    : 'bg-gray-100/50 hover:bg-gray-200/50 text-gray-600'
                } transition-all duration-200`}
              >
                <ArrowLeft className="w-6 h-6" />
              </motion.button>
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600"
              >
                <Truck className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h1 className={`text-2xl sm:text-3xl font-bold ${isNightTheme ? 'text-white' : 'text-gray-800'}`}>
                  Statistika
                </h1>
                <p className={`text-sm ${isNightTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                  Pregled performansi vozača
                </p>
              </div>
            </div>
          </div>

          {/* Driver info - Centered with Navigation */}
          {selectedDriver && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`mt-4 pt-4 border-t ${isNightTheme ? 'border-gray-700' : 'border-gray-200'}`}
            >
              <div className="w-full flex justify-center">
                <div className="flex items-center gap-4">
                  <motion.button
                    onClick={previousDriver}
                    whileHover={{ 
                      scale: 1.1,
                      x: -3,
                      backgroundColor: isNightTheme ? '#374151' : '#e5e7eb'
                    }}
                    whileTap={{ 
                      scale: 0.9,
                      x: -5
                    }}
                    animate={{
                      x: [0, -2, 0],
                    }}
                    transition={{
                      x: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                      scale: { duration: 0.2 },
                      backgroundColor: { duration: 0.3 }
                    }}
                    className={`p-3 rounded-lg ${
                      isNightTheme 
                        ? 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 shadow-lg shadow-blue-500/20' 
                        : 'bg-gray-100/50 hover:bg-gray-200/50 text-gray-600 shadow-lg shadow-blue-500/10'
                    } transition-all duration-200 border-2 border-transparent hover:border-blue-400/30`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </motion.button>
                  
                  <motion.div 
                    key={selectedDriver?.id}
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: -10 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 300, 
                      damping: 20,
                      duration: 0.4
                    }}
                    className="flex flex-wrap gap-4 items-center justify-center"
                  >
                    <div className="flex items-center gap-2">
                      <User className={`w-5 h-5 ${isNightTheme ? 'text-blue-400' : 'text-blue-600'}`} />
                      <span className={`text-lg font-bold ${isNightTheme ? 'text-white' : 'text-gray-900'}`}>
                        {selectedDriver.ime}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Truck className={`w-4 h-4 ${isNightTheme ? 'text-gray-400' : 'text-gray-600'}`} />
                      <span className={`text-sm ${isNightTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                        Tura {selectedDriver.tura}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className={`w-4 h-4 ${isNightTheme ? 'text-gray-400' : 'text-gray-600'}`} />
                      <span className={`text-sm ${isNightTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                        Cilj: {getTargetStops(selectedDriver.tura)} stopova/dan
                      </span>
                    </div>
                  </motion.div>

                  <motion.button
                    onClick={nextDriver}
                    whileHover={{ 
                      scale: 1.1,
                      x: 3,
                      backgroundColor: isNightTheme ? '#374151' : '#e5e7eb'
                    }}
                    whileTap={{ 
                      scale: 0.9,
                      x: 5
                    }}
                    animate={{
                      x: [0, 2, 0],
                    }}
                    transition={{
                      x: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                      scale: { duration: 0.2 },
                      backgroundColor: { duration: 0.3 }
                    }}
                    className={`p-3 rounded-lg ${
                      isNightTheme 
                        ? 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 shadow-lg shadow-blue-500/20' 
                        : 'bg-gray-100/50 hover:bg-gray-200/50 text-gray-600 shadow-lg shadow-blue-500/10'
                    } transition-all duration-200 border-2 border-transparent hover:border-blue-400/30`}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Error state */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`mb-6 p-4 rounded-xl ${
              isNightTheme ? 'bg-red-900/30 border-red-700/50' : 'bg-red-50 border-red-200/50'
            } border`}
          >
            <div className="flex items-center gap-3">
              <AlertCircle className={`w-5 h-5 ${isNightTheme ? 'text-red-400' : 'text-red-600'}`} />
              <p className={`text-sm font-medium ${isNightTheme ? 'text-red-400' : 'text-red-600'}`}>
                Greška pri učitavanju podataka: {error}
              </p>
            </div>
          </motion.div>
        )}

        {/* Loading state */}
        {loading || statsLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className={`w-16 h-16 mb-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center`}
            >
              <Package className="w-8 h-8 text-white" />
            </motion.div>
            <span className={`text-lg ${isNightTheme ? 'text-gray-300' : 'text-gray-600'}`}>
              <motion.div
                className="flex items-center gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className={`w-6 h-6 rounded-full border-2 border-t-transparent ${
                    isNightTheme ? 'border-blue-400' : 'border-blue-600'
                  }`}
                />
                <div className="flex flex-col">
                  <motion.span
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    Učitavanje statistike...
                  </motion.span>
                  <motion.div
                    className={`h-2 mt-2 bg-gradient-to-r ${
                      isNightTheme 
                        ? 'from-blue-600 via-blue-400 to-blue-600' 
                        : 'from-blue-500 via-blue-300 to-blue-500'
                    } rounded-full`}
                    animate={{ 
                      backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity,
                      ease: "linear"
                    }}
                    style={{
                      backgroundSize: '200% 200%'
                    }}
                  />
                </div>
              </motion.div>
            </span>
          </motion.div>
        ) : (
          /* Statistics cards - PREMIUM DESIGN */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <AnimatePresence>
              {statCards.map((card, index) => {
                const Icon = card.icon;
                const DeliveryTrendIcon = getTrendIcon(card.delivery.trend);
                const ComplaintTrendIcon = getTrendIcon(card.complaints.trend);
                const hasComplaints = card.complaints.value > 0;
                const successRate = card.delivery.target > 0 ? (card.delivery.value / card.delivery.target) * 100 : 0;
                const isOverTarget = successRate > 100;

                return (
                  <motion.div
                    key={card.title}
                    initial={{ opacity: 0, y: 30, scale: 0.8, rotateX: -15 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0, 
                      scale: 1,
                      rotateX: 0
                    }}
                    exit={{ opacity: 0, y: -30, scale: 0.8, rotateX: 15 }}
                    transition={{ 
                      delay: index * 0.15,
                      type: "spring",
                      stiffness: 300,
                      damping: 25,
                      duration: 0.6
                    }}
                    whileHover={{ 
                      scale: 1.03,
                      y: -8,
                      rotateY: 2,
                      transition: { duration: 0.3 }
                    }}
                    className="relative group cursor-pointer"
                    style={{ perspective: "1000px" }}
                  >
                    {/* Premium solid background with gradients */}
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white via-gray-50 to-gray-100 border-2 border-gray-200/60 shadow-2xl transform group-hover:scale-105 transition-transform duration-300"></div>
                    
                    {/* Subtle inner shadow for depth */}
                    <div className="absolute inset-1 rounded-3xl bg-gradient-to-br from-white/80 to-transparent pointer-events-none"></div>
                    
                    {/* Animated glow effect */}
                    <motion.div 
                      className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      animate={{
                        background: [
                          "radial-gradient(circle at 0% 0%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)",
                          "radial-gradient(circle at 100% 100%, rgba(147, 51, 234, 0.3) 0%, transparent 50%)",
                          "radial-gradient(circle at 0% 100%, rgba(236, 72, 153, 0.3) 0%, transparent 50%)",
                          "radial-gradient(circle at 100% 0%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)"
                        ]
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    />

                    {/* Success/Warning overlay */}
                    {hasComplaints && (
                      <motion.div 
                        className="absolute inset-0 rounded-3xl bg-red-500/10 border border-red-400/30"
                        animate={{
                          opacity: [0.3, 0.6, 0.3],
                          scale: [1, 1.02, 1]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                    )}

                    <div className="relative p-8 h-full flex flex-col">
                      {/* Premium Header with floating icon */}
                      <div className="flex items-center justify-between mb-6">
                        <motion.div 
                          className="relative"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ type: "spring", stiffness: 400 }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-600 rounded-2xl blur-md opacity-70"></div>
                          <div className="relative p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                            <Icon className="w-6 h-6 text-white drop-shadow-lg" />
                          </div>
                          <motion.div
                            className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                            animate={{
                              scale: [1, 1.3, 1],
                              opacity: [0.7, 1, 0.7]
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                          />
                        </motion.div>
                        
                        <div className="text-right">
                          <h3 className="text-lg font-bold text-gray-800">
                            {card.title}
                          </h3>
                          <p className="text-sm text-gray-600 font-medium">{card.period}</p>
                        </div>
                      </div>

                      {/* Main metrics with enhanced visuals */}
                      <div className="space-y-6 flex-grow">
                        
                        {/* Delivery Section */}
                        <div className="relative">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                              Dostavljeno
                            </span>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                            >
                              <DeliveryTrendIcon className={`w-5 h-5 ${getTrendColor(card.delivery.trend)} drop-shadow-sm`} />
                            </motion.div>
                          </div>
                          
                          <div className="flex items-baseline justify-between mb-4">
                            <motion.span 
                              className="text-4xl font-black text-gray-900"
                              animate={{ 
                                textShadow: [
                                  "2px 2px 4px rgba(0,0,0,0.1)",
                                  "3px 3px 6px rgba(59,130,246,0.3)",
                                  "2px 2px 4px rgba(0,0,0,0.1)"
                                ]
                              }}
                              transition={{ duration: 3, repeat: Infinity }}
                            >
                              {card.delivery.value}
                            </motion.span>
                            <span className="text-lg font-bold text-gray-600">stopova</span>
                            {card.delivery.diff !== undefined && card.delivery.diff !== 0 && (
                              <motion.span 
                                className={`px-2 py-1 rounded-full text-sm font-bold ${
                                  card.delivery.diff > 0 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-red-100 text-red-700'
                                }`}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.3, type: "spring" }}
                              >
                                {card.delivery.diff > 0 ? '+' : ''}{card.delivery.diff}
                              </motion.span>
                            )}
                          </div>

                          {/* Ultra Premium Progress Bar */}
                          {card.delivery.target > 0 && (
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm font-bold">
                                <span className="text-gray-800">Cilj: {card.delivery.target}</span>
                                <motion.span 
                                  className={`font-black ${
                                    successRate >= 100 
                                      ? 'text-green-700' 
                                      : successRate >= 98 
                                        ? 'text-blue-700' 
                                        : 'text-red-700'
                                  }`}
                                  animate={successRate >= 100 ? {
                                    scale: [1, 1.15, 1],
                                    textShadow: [
                                      "1px 1px 2px rgba(0,0,0,0.2)",
                                      "2px 2px 4px rgba(34,197,94,0.4)",
                                      "1px 1px 2px rgba(0,0,0,0.2)"
                                    ]
                                  } : successRate >= 98 ? {
                                    scale: [1, 1.08, 1],
                                    textShadow: [
                                      "1px 1px 2px rgba(0,0,0,0.2)",
                                      "2px 2px 4px rgba(59,130,246,0.4)",
                                      "1px 1px 2px rgba(0,0,0,0.2)"
                                    ]
                                  } : {
                                    scale: [1, 1.1, 1],
                                    textShadow: [
                                      "1px 1px 2px rgba(0,0,0,0.2)",
                                      "2px 2px 4px rgba(220,38,38,0.4)",
                                      "1px 1px 2px rgba(0,0,0,0.2)"
                                    ]
                                  }}
                                  transition={{ duration: 1.5, repeat: Infinity }}
                                >
                                  {Math.round(successRate)}%
                                </motion.span>
                              </div>
                              
                              <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden border border-gray-300">
                                <motion.div 
                                  className={`h-full rounded-full relative ${
                                    successRate >= 100
                                      ? 'bg-gradient-to-r from-green-400 via-green-500 to-emerald-600' 
                                      : successRate >= 98
                                        ? 'bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-600'
                                        : 'bg-gradient-to-r from-red-400 via-red-500 to-red-600'
                                  }`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.min(successRate, 100)}%` }}
                                  transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                                >
                                  <motion.div
                                    className="absolute inset-0 bg-white/30"
                                    animate={{
                                      x: ["-100%", "100%"]
                                    }}
                                    transition={{
                                      duration: 2,
                                      repeat: Infinity,
                                      ease: "linear"
                                    }}
                                  />
                                </motion.div>
                                
                                {successRate >= 100 && (
                                  <motion.div
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                                    animate={{
                                      scale: [1, 1.2, 1],
                                      rotate: [0, 10, -10, 0]
                                    }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                  >
                                    <span className="text-xs font-bold text-white drop-shadow">🎯</span>
                                  </motion.div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Complaints Section with clean solid design */}
                        <div className={`relative p-4 rounded-2xl transition-all duration-500 border-2 ${
                          hasComplaints 
                            ? 'bg-red-50 border-red-200 shadow-lg shadow-red-100' 
                            : 'bg-green-50 border-green-200 shadow-lg shadow-green-100'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                              Reklamacije
                            </span>
                            {hasComplaints ? (
                              <motion.div
                                animate={{ 
                                  rotate: [0, -10, 10, -10, 0],
                                  scale: [1, 1.2, 1]
                                }}
                                transition={{ 
                                  duration: 1,
                                  repeat: Infinity,
                                  ease: "easeInOut"
                                }}
                              >
                                <AlertTriangle className="w-5 h-5 text-red-600 drop-shadow-sm" />
                              </motion.div>
                            ) : (
                              <motion.div
                                animate={{ 
                                  scale: [1, 1.1, 1],
                                  rotate: [0, 5, -5, 0]
                                }}
                                transition={{ 
                                  duration: 2,
                                  repeat: Infinity,
                                  ease: "easeInOut"
                                }}
                              >
                                <CheckCircle2 className="w-5 h-5 text-green-600 drop-shadow-sm" />
                              </motion.div>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <motion.span 
                              className={`text-3xl font-black ${
                                hasComplaints ? 'text-red-700' : 'text-green-700'
                              }`}
                              animate={hasComplaints ? {
                                scale: [1, 1.1, 1],
                                textShadow: [
                                  "1px 1px 2px rgba(0,0,0,0.1)",
                                  "2px 2px 4px rgba(220, 38, 38, 0.3)",
                                  "1px 1px 2px rgba(0,0,0,0.1)"
                                ]
                              } : {
                                textShadow: [
                                  "1px 1px 2px rgba(0,0,0,0.1)",
                                  "2px 2px 4px rgba(34, 197, 94, 0.3)",
                                  "1px 1px 2px rgba(0,0,0,0.1)"
                                ]
                              }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              {card.complaints.value}
                            </motion.span>
                            
                            {hasComplaints ? (
                              <motion.div
                                initial={{ scale: 0, rotate: 180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
                                className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1"
                              >
                                <span>≈</span>
                                <span>{(card.complaints.value * 80).toLocaleString()}€</span>
                              </motion.div>
                            ) : (
                              <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
                                className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded-full shadow-lg"
                              >
                                SAVRŠENO!
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Floating action indicator */}
                      <motion.div
                        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        animate={{
                          y: [0, -5, 0]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full shadow-lg"></div>
                      </motion.div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default StatistikaScreen;
