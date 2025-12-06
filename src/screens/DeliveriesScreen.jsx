import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  ArrowLeft, Calendar, TrendingUp, TrendingDown, 
  Users, AlertCircle, Package, ChevronLeft, ChevronRight 
} from 'lucide-react';
import useWorkdays from '../hooks/useWorkdays';
import { useDriversQuery, useDeliveriesQuery, useHolidaysQuery } from '../hooks/queries';
import { supabase } from '../db/supabaseClient';

const CURRENT_YEAR = new Date().getFullYear();
const MONTHS = [
  'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Juni',
  'Juli', 'August', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'
];

export default function DeliveriesScreen() {
  const navigate = useNavigate();

  // State
  const [year, setYear] = useState(CURRENT_YEAR);
  const [month, setMonth] = useState(new Date().getMonth()); // 0-11 (JavaScript standard)
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentTheme, setCurrentTheme] = useState('night');
  const [urlaubMarks, setUrlaubMarks] = useState({});

  const themes = {
    default: { background: 'from-blue-50 via-white to-purple-50' },
    sunrise: { background: 'from-orange-100 via-pink-100 to-yellow-100' },
    afternoon: { background: 'from-blue-100 via-cyan-100 to-sky-100' },
    evening: { background: 'from-purple-100 via-pink-100 to-indigo-100' },
    night: { background: 'from-slate-900 via-blue-900 to-indigo-900' }
  };

  // Dohvati sve potrebne podatke
  const { data: drivers = [], isLoading: driversLoading, error: driversError } = useDriversQuery();
  // useDeliveriesQuery / getAllDeliveriesCloud očekuju mjesec u formatu 0-11
  const { data: deliveries = [], isLoading: deliveriesLoading, error: deliveriesError } = useDeliveriesQuery(year, month);
  const { data: holidays = [] } = useHolidaysQuery(year);
  // useWorkdays je lokalni hook (nije React Query) i vraća direktno niz datuma radnih dana
  const workdays = useWorkdays(year, month, holidays.map(h => h.date));

  // Debug logovi
  console.log('🚚 Deliveries query:', { 
    deliveries, 
    deliveriesLoading, 
    deliveriesError, 
    year, 
    month, // 0-11 (JavaScript standard)
    drivers: drivers.length,
    workdays: workdays.length
  });

  // Kombinirano loading stanje
  const loading = driversLoading || deliveriesLoading;

  // Postavi temu
  useEffect(() => {
    setCurrentTheme('night');
  }, []);

  // Timer za ažuriranje vremena
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Ref za praćenje da li su urlaub podaci već učitani
  const hasFetchedUrlaub = useRef(false);

  // Učitaj urlaub oznake - samo jednom
  useEffect(() => {
    if (hasFetchedUrlaub.current) return;
    
    const fetchUrlaubMarks = async () => {
      try {
        const { data, error } = await supabase
          .from('urlaub_marks')
          .select('date, driver')
          .eq('is_active', true);

        console.log('📅 Supabase urlaub_marks response:', { data, error });

        if (error) {
          console.error('❌ Supabase error:', error);
          return;
        }

        const marks = {};
        data?.forEach(row => {
          const dateStr = typeof row.date === 'string' 
            ? row.date.slice(0, 10) 
            : row.date;
          marks[`${dateStr}-${row.driver}`] = true;
        });

        console.log('✅ urlaubMarks loaded:', marks);
        setUrlaubMarks(marks);
        hasFetchedUrlaub.current = true; // Označi da su podaci učitani
      } catch (err) {
        console.error('❌ Urlaub fetch error:', err);
      }
    };

    fetchUrlaubMarks();
  }, []); // Prazan dependency array osigurava da se pozove samo jednom

  // groupedData memo
  const groupedData = useMemo(() => {
    console.log('📦 Creating groupedData, deliveries count:', deliveries?.length);
    
    if (!deliveries || !Array.isArray(deliveries)) {
      console.log('📦 No valid deliveries data');
      return {};
    }

    const grouped = {};
    deliveries.forEach(delivery => {
      if (!grouped[delivery.date]) {
        grouped[delivery.date] = {};
      }
      // koristimo isto polje kao DriversScreen / Dashboard: produktivitaet_stops
      grouped[delivery.date][delivery.driver] = delivery.produktivitaet_stops || 0;
    });

    // Apply special rules for specific dates
    Object.keys(grouped).forEach(dateString => {
      if (dateString === '2025-11-17' || dateString === '2025-11-25') {
        if (grouped[dateString]['8640']) {
          const valueToAdd = grouped[dateString]['8640'];
          if (grouped[dateString]['8610']) {
            grouped[dateString]['8610'] += valueToAdd;
          } else {
            grouped[dateString]['8610'] = valueToAdd;
          }
          delete grouped[dateString]['8640'];
        }
      }
    });

    console.log('📦 groupedData created with dates:', Object.keys(grouped).join(', '));
    return grouped;
  }, [deliveries]);

  // groupedDataWithUrlaub memo
  const groupedDataWithUrlaub = useMemo(() => {
    console.log('🎯 Creating groupedDataWithUrlaub', { 
      workdays: workdays?.length, 
      drivers: drivers?.length, 
      groupedDataKeys: Object.keys(groupedData).length,
      urlaubMarksKeys: Object.keys(urlaubMarks).length
    });

    if (!workdays || !drivers || !groupedData) {
      console.log('🎯 Missing required data for groupedDataWithUrlaub');
      return {};
    }

    const result = { ...groupedData };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Koristimo JavaScript Date konstruktor s ispravnim mjesecom (0-11)
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Dodaj sve datume koji imaju urlaub
    for (let day = 1; day <= daysInMonth; day++) {
      // Pravilno formatiranje datuma s vodićom nulom
      const monthStr = String(month + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const dateStr = `${year}-${monthStr}-${dayStr}`;
      
      // Kreiranje datuma kroz JavaScript Date objekt za pouzdano uspoređivanje
      const currentDate = new Date(year, month, day);

      if (currentDate > today) continue;

      const hasUrlaub = Object.keys(urlaubMarks).some(key => key.startsWith(dateStr));

      if (hasUrlaub && !result[dateStr]) {
        result[dateStr] = {};
      }
    }

    // Vrati samo datume koji imaju podatke ili urlaub
    const finalResult = Object.keys(result).reduce((acc, dateStr) => {
      const dayData = result[dateStr];
      const hasData = Array.isArray(drivers) && drivers.some(driver => 
        driver && driver.tura !== undefined && dayData[driver.tura] > 0
      );
      const hasUrlaub = Object.keys(urlaubMarks).some(key => key.startsWith(dateStr));

      if (hasData || hasUrlaub) {
        acc[dateStr] = dayData;
      }
      return acc;
    }, {});

    console.log('🎯 groupedDataWithUrlaub result - dates with data:', Object.keys(finalResult).join(', '));
    return finalResult;
  }, [groupedData, urlaubMarks, year, month, workdays, drivers]);

  // monthStats memo
  const monthStats = useMemo(() => {
    if (!Array.isArray(workdays)) {
      return {
        totalWorkdays: 0, passedWorkdays: 0, drivers: 0, remainingDays: 0,
        totalStops: 0, monthlyTarget: 0, targetForWorkedDays: 0, difference: 0,
        totalAllWorked: 0, targetForWorkedDaysBD: 0, targetAllDaysBD: 0, bilansBD: 0
      };
    }
    
    // Debug log za provjeru radnih dana
    console.log('📅 Workdays data:', workdays);

    const totalWorkdays = workdays.length;
    const daysWithData = new Set();

    deliveries.forEach(delivery => {
      if (delivery.produktivitaet_stops > 0) {
        daysWithData.add(delivery.date);
      }
    });

    const workedDaysCount = daysWithData.size;

    // Calculate passed workdays
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-11, isto kao i state `month`
    let passedWorkdays = 0;

    if (year === currentYear && month === currentMonth) {
      const currentDay = today.getDate();
      passedWorkdays = workdays.filter(workday => {
        const workdayDate = new Date(workday);
        return workdayDate.getDate() <= currentDay;
      }).length;
    } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
      passedWorkdays = totalWorkdays;
    }

    const totalStops = deliveries.reduce((sum, d) => sum + (d.produktivitaet_stops || 0), 0);
    const activeDrivers = drivers.filter(d => d.aktivan);
    const monthlyTarget = activeDrivers.reduce((sum, driver) => 
      sum + ((driver.target_per_day || 0) * totalWorkdays), 0);
    const targetForWorkedDays = activeDrivers.reduce((sum, driver) => 
      sum + ((driver.target_per_day || 0) * workedDaysCount), 0);
    const difference = totalStops - monthlyTarget;

    // BD values
    const workedDaysForBD = workdays.filter(date => {
      const dateString = format(date, 'yyyy-MM-dd');
      const dayData = groupedData[dateString] || {};
      const dayTotal = activeDrivers.reduce((sum, driver) => 
        sum + (dayData[driver.tura] || 0), 0);
      return dayTotal > 0;
    });

    const totalAllWorked = workedDaysForBD.reduce((sum, date) => {
      const dateString = format(date, 'yyyy-MM-dd');
      const dayData = groupedData[dateString] || {};
      return sum + activeDrivers.reduce((dsum, driver) => 
        dsum + (dayData[driver.tura] || 0), 0);
    }, 0);

    const targetAllDaysBD = activeDrivers.reduce((sum, driver) => 
      sum + ((driver.target_per_day || 0) * totalWorkdays), 0);
    const bilansBD = totalAllWorked - targetAllDaysBD;

    return {
      totalWorkdays,
      passedWorkdays,
      drivers: activeDrivers.length,
      remainingDays: Math.max(0, totalWorkdays - workedDaysCount),
      totalStops,
      monthlyTarget,
      targetForWorkedDays,
      difference,
      totalAllWorked,
      targetForWorkedDaysBD: activeDrivers.reduce((sum, driver) => 
        sum + ((driver.target_per_day || 0) * workedDaysForBD.length), 0),
      bilansBD
    };
  }, [workdays, deliveries, drivers, year, month, groupedData]);

  // Navigation functions
  const previousMonth = () => {
    if (month === 0) {  // Siječanj (0)
      setMonth(11);     // Prošli mjesec je prošle godine (Decembar = 11)
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const nextMonth = () => {
    if (month === 11) {  // Prosinac (11)
      setMonth(0);       // Sljedeći mjesec je sljedeće godine (Siječanj = 0)
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const getThemeBackground = () => `bg-gradient-to-br ${themes[currentTheme].background}`;

  // Error handling
  if (driversError || deliveriesError) {
    const error = driversError || deliveriesError;
    console.error('Greška u DeliveriesScreen:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center p-8">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <p>Greška pri učitavanju podataka</p>
          <p className="text-sm text-gray-400 mt-2">{error?.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${getThemeBackground()} ${currentTheme === 'night' ? 'text-white' : 'text-gray-800'}`}>
      {/* Header */}
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
              Pregled Dostava
            </h1>
          </div>
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 md:py-8">
        {/* Month Navigation */}
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
                {MONTHS[month]} {year}
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

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`p-4 rounded-xl ${currentTheme === 'night' ? 'bg-gray-700/30' : 'bg-gray-50/50'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className={`w-5 h-5 ${currentTheme === 'night' ? 'text-blue-400' : 'text-blue-600'}`} />
                <span className={`text-sm ${currentTheme === 'night' ? 'text-gray-400' : 'text-gray-600'}`}>Radnih dana</span>
              </div>
              <p className={`text-2xl font-bold ${currentTheme === 'night' ? 'text-white' : 'text-gray-800'}`}>
                {monthStats.passedWorkdays}/{monthStats.totalWorkdays}
              </p>
            </div>

            <div className={`p-4 rounded-xl ${currentTheme === 'night' ? 'bg-gray-700/30' : 'bg-gray-50/50'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Users className={`w-5 h-5 ${currentTheme === 'night' ? 'text-green-400' : 'text-green-600'}`} />
                <span className={`text-sm ${currentTheme === 'night' ? 'text-gray-400' : 'text-gray-600'}`}>Vozača</span>
              </div>
              <p className={`text-2xl font-bold ${currentTheme === 'night' ? 'text-white' : 'text-gray-800'}`}>
                {monthStats.drivers}
              </p>
            </div>

            <div className={`p-4 rounded-xl ${currentTheme === 'night' ? 'bg-gray-700/30' : 'bg-gray-50/50'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Package className={`w-5 h-5 ${currentTheme === 'night' ? 'text-purple-400' : 'text-purple-600'}`} />
                <span className={`text-sm ${currentTheme === 'night' ? 'text-gray-400' : 'text-gray-600'}`}>Ukupno</span>
              </div>
              <p className={`text-2xl font-bold ${currentTheme === 'night' ? 'text-white' : 'text-gray-800'}`}>
                {monthStats.totalAllWorked}
              </p>
            </div>

            <div className={`p-4 rounded-xl ${currentTheme === 'night' ? 'bg-gray-700/30' : 'bg-gray-50/50'}`}>
              <div className="flex items-center gap-2 mb-2">
                {monthStats.bilansBD >= 0 ? (
                  <TrendingUp className="w-5 h-5" style={{ color: currentTheme === 'night' ? '#4ade80' : '#15803d' }} />
                ) : (
                  <TrendingDown className="w-5 h-5" style={{ color: currentTheme === 'night' ? '#fb7185' : '#dc2626' }} />
                )}
                <span className={`text-sm ${currentTheme === 'night' ? 'text-gray-400' : 'text-gray-600'}`}>Bilans</span>
              </div>
              <p className="text-2xl font-black" style={{
                color: monthStats.bilansBD >= 0 
                  ? (currentTheme === 'night' ? '#4ade80' : '#15803d') 
                  : (currentTheme === 'night' ? '#fb7185' : '#dc2626'),
                textShadow: currentTheme === 'night' ? '0 0 3px rgba(0,0,0,0.3)' : 'none'
              }}>
                {monthStats.bilansBD > 0 ? '+' : ''}{monthStats.bilansBD}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Loading State */}
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`p-8 rounded-2xl ${currentTheme === 'night' ? 'bg-gray-800/40' : 'bg-white/60'} backdrop-blur-xl text-center`}
          >
            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className={currentTheme === 'night' ? 'text-gray-400' : 'text-gray-600'}>Učitavanje...</p>
          </motion.div>
        ) : workdays.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`p-8 rounded-2xl ${currentTheme === 'night' ? 'bg-gray-800/40' : 'bg-white/60'} backdrop-blur-xl text-center`}
          >
            <AlertCircle className={`w-16 h-16 mx-auto mb-4 ${currentTheme === 'night' ? 'text-gray-600' : 'text-gray-400'}`} />
            <p className={currentTheme === 'night' ? 'text-gray-400' : 'text-gray-600'}>Nema radnih dana</p>
          </motion.div>
        ) : (
          /* Data Table */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`rounded-2xl ${currentTheme === 'night' ? 'bg-gray-800/40 border-gray-700/50' : 'bg-white/70 border-gray-200/30'} border backdrop-blur-xl overflow-hidden`}
          >
            <div className="overflow-x-auto">
              <table className="w-full table-fixed" style={{ fontSize: '0.8rem' }}>
                <thead>
                  <tr className={currentTheme === 'night' ? 'bg-gray-700/50' : 'bg-gray-100/80'}>
                    <th className="px-1 py-2 text-left text-xs font-bold w-16" style={{ color: currentTheme === 'night' ? '#fff' : '#1f2937' }}>
                      Datum
                    </th>
                    {drivers.filter(d => d.aktivan).map(driver => (
                      <th key={driver.tura} className="px-1 py-2 text-center text-xs font-bold" style={{ color: currentTheme === 'night' ? '#fff' : '#1f2937' }}>
                        <div className="font-semibold">{driver.ime}</div>
                        <div className="text-[10px] opacity-70">{driver.tura}</div>
                      </th>
                    ))}
                    <th className="px-1 py-2 text-center text-xs font-bold w-16" style={{ color: currentTheme === 'night' ? '#fff' : '#1f2937' }}>
                      <div className="font-semibold">Ukupno</div>
                      <div className="text-[10px] opacity-70">B&D</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(groupedDataWithUrlaub)
                    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
                    .map((dateString, index) => {
                      const dayData = groupedDataWithUrlaub[dateString] || {};
                      const total = drivers.filter(d => d.aktivan).reduce((sum, driver) => 
                        sum + (dayData[driver.tura] || 0), 0);
                      const isHoliday = holidays.some(h => h.date === dateString);

                      return (
                        <motion.tr
                          key={dateString}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className={`border-t ${currentTheme === 'night' ? 'border-gray-700/50' : 'border-gray-200/50'} ${isHoliday ? (currentTheme === 'night' ? 'bg-red-900/20' : 'bg-red-50/70') : ''}`}
                        >
                          <td className="px-1 py-1.5 text-xs font-bold" style={{ color: currentTheme === 'night' ? '#e5e7eb' : '#374151' }}>
                            {format(new Date(dateString), 'dd.MM.')}
                          </td>
                          {drivers.filter(d => d.aktivan).map(driver => {
                            const value = dayData[driver.tura];
                            const target = driver.target_per_day || 0;
                            const isSuccess = value >= target;
                            const key = `${dateString}-${driver.tura}`;
                            const isUrlaub = urlaubMarks[key];

                            const successColor = currentTheme === 'night' ? '#4ade80' : '#15803d';
                            const warningColor = currentTheme === 'night' ? '#fb7185' : '#dc2626';

                            return (
                              <td
                                key={driver.tura}
                                className="px-1 py-1.5 text-center text-xs font-extrabold"
                                style={{
                                  color: isUrlaub 
                                    ? (currentTheme === 'night' ? '#f59e0b' : '#d97706')
                                    : value ? (isSuccess ? successColor : warningColor) : '#9ca3af',
                                  fontWeight: '900',
                                  textShadow: (value || isUrlaub) ? (currentTheme === 'night' ? '0 0 2px rgba(0,0,0,0.5)' : 'none') : 'none'
                                }}
                              >
                                {isUrlaub ? 'Urlaub' : (value || '–')}
                              </td>
                            );
                          })}
                          <td
                            className="px-1 py-1.5 text-center text-xs font-extrabold"
                            style={{
                              color: total >= 300 
                                ? (currentTheme === 'night' ? '#4ade80' : '#15803d') 
                                : total > 0 
                                  ? (currentTheme === 'night' ? '#fb7185' : '#dc2626') 
                                  : '#9ca3af',
                              fontWeight: '900',
                              textShadow: total > 0 ? (currentTheme === 'night' ? '0 0 2px rgba(0,0,0,0.5)' : 'none') : 'none'
                            }}
                          >
                            {total || '–'}
                          </td>
                        </motion.tr>
                      );
                    })}
                </tbody>
                <tfoot>
                  <tr className={`border-t-2 ${currentTheme === 'night' ? 'border-gray-600 bg-gray-700/70' : 'border-gray-400 bg-gray-200/80'}`}>
                    <td className="px-1 py-2 text-xs font-extrabold" style={{ color: currentTheme === 'night' ? '#fff' : '#1f2937' }}>
                      Ukupno
                    </td>
                    {drivers.filter(d => d.aktivan).map(driver => {
                      const workedDays = workdays.filter(date => {
                        const dateString = format(date, 'yyyy-MM-dd');
                        const dayData = groupedData[dateString] || {};
                        return dayData[driver.tura] > 0;
                      });

                      const totalForDriver = workedDays.reduce((sum, date) => {
                        const dateString = format(date, 'yyyy-MM-dd');
                        const dayData = groupedData[dateString] || {};
                        return sum + (dayData[driver.tura] || 0);
                      }, 0);

                      const targetAllDays = (driver.target_per_day || 0) * workdays.length;
                      const bilans = totalForDriver - targetAllDays;

                      const successColor = currentTheme === 'night' ? '#4ade80' : '#15803d';
                      const errorColor = currentTheme === 'night' ? '#fb7185' : '#dc2626';
                      const totalColor = totalForDriver >= ((driver.target_per_day || 0) * workedDays.length) ? successColor : errorColor;
                      const bilansColor = bilans >= 0 ? successColor : errorColor;

                      return (
                        <td key={driver.tura} className="px-1 py-2 text-center">
                          <div className="text-xs font-extrabold" style={{ 
                            color: totalColor, 
                            textShadow: currentTheme === 'night' ? '0 0 2px rgba(0,0,0,0.5)' : 'none' 
                          }}>
                            {totalForDriver}
                          </div>
                          <div className="text-[10px] font-black" style={{ 
                            color: bilansColor, 
                            textShadow: currentTheme === 'night' ? '0 0 2px rgba(0,0,0,0.5)' : 'none' 
                          }}>
                            ({bilans > 0 ? '+' : ''}{bilans})
                          </div>
                        </td>
                      );
                    })}
                    <td className="px-1 py-2 text-center">
                      {(() => {
                        const workedDays = workdays.filter(date => {
                          const dateString = format(date, 'yyyy-MM-dd');
                          const dayData = groupedData[dateString] || {};
                          const dayTotal = drivers.filter(d => d.aktivan).reduce((sum, driver) => 
                            sum + (dayData[driver.tura] || 0), 0);
                          return dayTotal > 0;
                        });

                        const totalAllWorked = workedDays.reduce((sum, date) => {
                          const dateString = format(date, 'yyyy-MM-dd');
                          const dayData = groupedData[dateString] || {};
                          return sum + drivers.filter(d => d.aktivan).reduce((dsum, driver) => 
                            dsum + (dayData[driver.tura] || 0), 0);
                        }, 0);

                        const targetAllDays = drivers.filter(d => d.aktivan).reduce((sum, driver) => 
                          sum + ((driver.target_per_day || 0) * workdays.length), 0);
                        const bilans = totalAllWorked - targetAllDays;

                        const successColor = currentTheme === 'night' ? '#4ade80' : '#15803d';
                        const errorColor = currentTheme === 'night' ? '#fb7185' : '#dc2626';
                        const targetForWorkedDays = drivers.filter(d => d.aktivan).reduce((sum, driver) => 
                          sum + ((driver.target_per_day || 0) * workedDays.length), 0);
                        const totalColor = totalAllWorked >= targetForWorkedDays ? successColor : errorColor;
                        const bilansColor = bilans >= 0 ? successColor : errorColor;

                        return (
                          <>
                            <div className="text-xs font-extrabold" style={{ 
                              color: totalColor, 
                              textShadow: currentTheme === 'night' ? '0 0 2px rgba(0,0,0,0.5)' : 'none' 
                            }}>
                              {totalAllWorked}
                            </div>
                            <div className="text-[10px] font-black" style={{ 
                              color: bilansColor, 
                              textShadow: currentTheme === 'night' ? '0 0 2px rgba(0,0,0,0.5)' : 'none' 
                            }}>
                              ({bilans > 0 ? '+' : ''}{bilans})
                            </div>
                          </>
                        );
                      })()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}