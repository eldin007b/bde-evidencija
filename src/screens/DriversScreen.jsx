import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, TrendingUp, Users, Package, ChevronLeft, ChevronRight, Target, Clock, AlertTriangle } from 'lucide-react';
import useWorkdays from '../hooks/useWorkdays';
import SyncProgressBar from '../components/common/SyncProgressBar';
import { useUserContext } from '../context/UserContext';
import { useDriversQuery, useDriverDeliveriesQuery, useHolidaysQuery } from '../hooks/queries';
import { supabase } from '../db/supabaseClient';

const CURRENT_YEAR = new Date().getFullYear();
const MONTHS = [
  'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Juni',
  'Juli', 'August', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'
];

export default function DriversScreen() {
  const navigate = useNavigate();
  const [year, setYear] = useState(CURRENT_YEAR);
  const [month, setMonth] = useState(new Date().getMonth());
  const [currentDriverIndex, setCurrentDriverIndex] = useState(0);
  const [currentTheme, setCurrentTheme] = useState('night');
  const [currentTime, setCurrentTime] = useState(new Date());

  const themes = {
    default: { background: 'from-blue-50 via-white to-purple-50' },
    sunrise: { background: 'from-orange-100 via-pink-100 to-yellow-100' },
    afternoon: { background: 'from-blue-100 via-cyan-100 to-sky-100' },
    evening: { background: 'from-purple-100 via-pink-100 to-indigo-100' },
    night: { background: 'from-slate-900 via-blue-900 to-indigo-900' }
  };

  const getThemeBackground = () => {
    const themeObj = themes[currentTheme] || themes['night'];
    return `bg-gradient-to-br ${themeObj.background}`;
  };

  useEffect(() => {
    setCurrentTheme('night');
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const [blinkState, setBlinkState] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => {
      setBlinkState(prev => !prev);
    }, 400);
    return () => clearInterval(interval);
  }, []);

  const { driverName } = useUserContext();
  const { data: drivers = [], isLoading: driversLoading } = useDriversQuery();
  const { data: holidays = [] } = useHolidaysQuery(year);

  // Dohvati Urlaub marks iz baze
  const [urlaubMarks, setUrlaubMarks] = useState({});
  
  useEffect(() => {
    const fetchUrlaubMarks = async () => {
      try {
        const { data, error } = await supabase
          .from('urlaub_marks')
          .select('date, driver')
          .eq('is_active', true);

        if (error) throw error;

        const marks = {};
        (data || []).forEach((row) => {
          const dateStr = typeof row.date === 'string' ? row.date.slice(0, 10) : row.date;
          marks[`${dateStr}-${row.driver}`] = true;
        });
        setUrlaubMarks(marks);
      } catch (err) {
        console.error('Greška pri dohvaćanju urlaub marks:', err);
      }
    };
    fetchUrlaubMarks();
  }, []);

  const previousMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const previousDriver = () => {
    setCurrentDriverIndex(prev => prev === 0 ? drivers.length - 1 : prev - 1);
  };

  const nextDriver = () => {
    setCurrentDriverIndex(prev => prev === drivers.length - 1 ? 0 : prev + 1);
  };

  useEffect(() => {
    if (drivers.length > 0) {
      const driverToSelect = driverName
        ? drivers.findIndex(d => d.ime === driverName)
        : drivers.findIndex(d => d.aktivan);
      if (driverToSelect >= 0) {
        setCurrentDriverIndex(driverToSelect);
      }
    }
  }, [drivers, driverName]);

  const selectedDriver = drivers[currentDriverIndex]?.ime || '';
  const selectedTura = drivers[currentDriverIndex]?.tura || '';
  const driverObj = drivers[currentDriverIndex];

  const { data: driverDeliveries = [], isLoading: deliveriesLoading } = useDriverDeliveriesQuery(
    driverObj?.tura,
    year,
    month,
    { enabled: !!driverObj }
  );

  const loading = deliveriesLoading || driversLoading;
  const workdays = useWorkdays(year, month, holidays.map(h => h.date));

  // Process deliveries data + Urlaub logika
  const processedDeliveries = useMemo(() => {
    if (!driverDeliveries.length || !driverObj) return [];

    const cleanPercentage = (value) => {
      if (!value) return 0;
      const cleaned = value.toString().replace('%', '').replace(',', '.').trim();
      return parseFloat(cleaned) || 0;
    };

    const grouped = {};
    driverDeliveries.forEach(delivery => {
      const deliveryDate = new Date(delivery.date);
      const deliveryMonth = deliveryDate.getMonth();
      const deliveryYear = deliveryDate.getFullYear();

      if (deliveryYear !== year || deliveryMonth !== month) {
        return;
      }

      const date = delivery.date;
      if (!grouped[date]) {
        grouped[date] = {
          date,
          stops: 0,
          packages: 0,
          pickupPackages: 0,
          complaints: 0,
          totalTime: 0,
          realPercentage: cleanPercentage(delivery.zustellung_proc),
          undelivered: parseInt(delivery.zustellung_nedostavljeno) || 0,
          pickupPercentage: cleanPercentage(delivery.pickup_proc),
          pickupUndelivered: parseInt(delivery.pickup_nedostavljeno) || 0,
          firstComplaints: parseInt(delivery.probleme_prva) || 0,
          secondComplaints: parseInt(delivery.probleme_druga) || 0,
          stopsPerHourRaw: delivery.produktivitaet_stops_pro_std || '0',
          isUrlaubDay: false
        };
      }

      grouped[date].stops += delivery.produktivitaet_stops || 0;
      grouped[date].packages += delivery.zustellung_paketi || 0;
      grouped[date].pickupPackages += parseInt(delivery.pickup_paketi) || 0;
      grouped[date].complaints += parseInt(delivery.probleme_druga) || 0;

      const dauer = delivery.produktivitaet_dauer || '0:00';
      const timeParts = dauer.split(':');
      const minutes = (parseInt(timeParts[0]) || 0) * 60 + (parseInt(timeParts[1]) || 0);
      grouped[date].totalTime += minutes;
    });

    // Dodaj sve datume iz mjeseca koji imaju urlaub i koji su prošli ili danas
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Resetuj vrijeme na ponoć
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const currentDate = new Date(dateStr);
      
      // Provjeri da li je datum prošao ili danas
      if (currentDate > today) continue;
      
      // Provjeri da li ima urlaub za bilo kojeg vozača na ovaj datum
      const hasUrlaub = Object.keys(urlaubMarks).some(key => key.startsWith(dateStr));
      
      if (hasUrlaub && !grouped[dateStr]) {
        grouped[dateStr] = {
          date: dateStr,
          stops: 0,
          packages: 0,
          pickupPackages: 0,
          complaints: 0,
          totalTime: 0,
          realPercentage: 0,
          undelivered: 0,
          pickupPercentage: 0,
          pickupUndelivered: 0,
          firstComplaints: 0,
          secondComplaints: 0,
          stopsPerHourRaw: '0',
          isUrlaubDay: false
        };
      }
    }

    const tura = driverObj.tura?.toString();

    // Ako je Eldin (8610) – prikaži Urlaub samo ako je Eldin na odmoru
    if (tura === '8610') {
      Object.keys(grouped).forEach(dateStr => {
        const key = `${dateStr}-${tura}`;
        if (urlaubMarks[key]) {
          grouped[dateStr].isUrlaubDay = true;
          grouped[dateStr].stops = 0;
          grouped[dateStr].packages = 0;
          grouped[dateStr].pickupPackages = 0;
          grouped[dateStr].complaints = 0;
          grouped[dateStr].totalTime = 0;
        }
      });
    }

    // Ako je Denis 8620 ili Arnes 8640 – prikaži dan kao Urlaub (0 stopova)
    if (tura === '8620' || tura === '8640') {
      Object.keys(grouped).forEach(dateStr => {
        const key = `${dateStr}-${tura}`;
        if (urlaubMarks[key]) {
          grouped[dateStr].isUrlaubDay = true;
          grouped[dateStr].stops = 0;
          grouped[dateStr].packages = 0;
          grouped[dateStr].pickupPackages = 0;
          grouped[dateStr].complaints = 0;
          grouped[dateStr].totalTime = 0;
        }
      });
    }

    return Object.values(grouped)
      .filter(d => {
        // Prikazuj samo datume koji imaju podatke (stops > 0) ili su označeni kao urlaub
        return d.stops > 0 || d.isUrlaubDay;
      })
      .map(d => {
        const percentage = d.realPercentage > 0
          ? d.realPercentage
          : (d.stops > 0 ? ((d.packages / d.stops) * 100) : 0);

        return {
          ...d,
          percentage,
          stopsPerHour: d.totalTime > 0 ? (d.stops / (d.totalTime / 60)) : 0,
        };
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [driverDeliveries, year, month, driverObj, urlaubMarks]); 

  const monthStats = useMemo(() => {
    const totalWorkdays = workdays.length;
    const daysWithData = processedDeliveries.filter(d => d.stops > 0).length;
    const totalStops = processedDeliveries.reduce((sum, d) => sum + d.stops, 0);
    const totalPackages = processedDeliveries.reduce((sum, d) => sum + d.packages, 0);
    const avgStopsPerDay = daysWithData > 0 ? (totalStops / daysWithData) : 0;
    const avgPackagesPerDay = daysWithData > 0 ? (totalPackages / daysWithData) : 0;

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    let passedWorkdays = 0;

    if (year === currentYear && month === currentMonth) {
      const currentDay = today.getDate();
      passedWorkdays = workdays.filter(workday => {
        const workdayDate = new Date(workday);
        return workdayDate.getDate() <= currentDay;
      }).length;
    } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
      passedWorkdays = totalWorkdays;
    } else {
      passedWorkdays = 0;
    }

    const target = driverObj?.target_per_day || 0;
    const targetTotal = target * totalWorkdays;
    const difference = totalStops - targetTotal;

    return {
      totalWorkdays,
      passedWorkdays,
      daysWithData,
      avgPackagesPerDay: Math.round(avgPackagesPerDay),
      avgStopsPerDay: Math.round(avgStopsPerDay),
      totalStops,
      totalPackages,
      difference
    };
  }, [workdays, processedDeliveries, driverObj, year, month]); 

  const formatTime = (date) => date.toLocaleTimeString('bs-BA', { hour: '2-digit', minute: '2-digit', hour12: false });
  const formatDate = (date) => date.toLocaleDateString('bs-BA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const successColor = currentTheme === 'night' ? '#4ade80' : '#15803d';
  const warningColor = currentTheme === 'night' ? '#fb7185' : '#dc2626';
  const neutralColor = '#9ca3af';

  return (
    <div className={`min-h-screen ${getThemeBackground()} ${currentTheme === 'night' ? 'text-white' : 'text-gray-800'}`}>
      <SyncProgressBar />

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
            <div className="flex items-center gap-2">
              <Users className={`w-8 h-8 ${currentTheme === 'night' ? 'text-blue-400' : 'text-blue-600'}`} />
              <h1 className={`text-2xl md:text-3xl font-bold ${currentTheme === 'night' ? 'text-white' : 'text-gray-800'}`}>
                Vozači Statistike
              </h1>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 md:py-8">
        {/* Month + driver nav */}
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
              <p className={`text-sm ${currentTheme === 'night' ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                {formatTime(currentTime)} • {formatDate(currentTime)}
              </p>
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

          <div className="flex items-center justify-between mt-6 mb-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={previousDriver}
              className={`p-2 rounded-lg ${currentTheme === 'night' ? 'bg-gray-700/50 hover:bg-gray-600/50' : 'bg-gray-100/50 hover:bg-gray-200/50'} transition-all`}
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>

            <div className="text-center">
              <h3 className={`text-xl font-bold ${currentTheme === 'night' ? 'text-white' : 'text-gray-800'}`}>
                {selectedDriver ? `${selectedDriver} (${selectedTura})` : 'Nema vozača'}
              </h3>
              <p className={`text-sm ${currentTheme === 'night' ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                {drivers.length > 0 ? `${currentDriverIndex + 1} / ${drivers.length}` : '0 / 0'}
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={nextDriver}
              className={`p-2 rounded-lg ${currentTheme === 'night' ? 'bg-gray-700/50 hover:bg-gray-600/50' : 'bg-gray-100/50 hover:bg-gray-200/50'} transition-all`}
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className={`p-4 rounded-xl ${currentTheme === 'night' ? 'bg-gray-700/30' : 'bg-gray-50/50'} backdrop-blur-sm flex items-center gap-3`}
            >
              <Calendar className={`w-6 h-6 ${currentTheme === 'night' ? 'text-blue-400' : 'text-blue-600'}`} />
              <div>
                <div className={`text-2xl font-bold ${currentTheme === 'night' ? 'text-white' : 'text-gray-800'}`}>
                  {monthStats.passedWorkdays}/{monthStats.totalWorkdays}
                </div>
                <div className={`text-sm ${currentTheme === 'night' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Radni dani
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className={`p-4 rounded-xl ${currentTheme === 'night' ? 'bg-gray-700/30' : 'bg-gray-50/50'} backdrop-blur-sm flex items-center gap-3`}
            >
              <Users className={`w-6 h-6 ${currentTheme === 'night' ? 'text-green-400' : 'text-green-600'}`} />
              <div>
                <div className={`text-2xl font-bold ${currentTheme === 'night' ? 'text-white' : 'text-gray-800'}`}>
                  {selectedDriver ? `${selectedDriver} (${selectedTura})` : '—'}
                </div>
                <div className={`text-sm ${currentTheme === 'night' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Vozač
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className={`p-4 rounded-xl ${currentTheme === 'night' ? 'bg-gray-700/30' : 'bg-gray-50/50'} backdrop-blur-sm flex items-center gap-3`}
            >
              <Target className={`w-6 h-6 ${currentTheme === 'night' ? 'text-purple-400' : 'text-purple-600'}`} />
              <div>
                <div className={`text-2xl font-bold ${currentTheme === 'night' ? 'text-white' : 'text-gray-800'}`}>
                  {monthStats.totalStops}
                </div>
                <div className={`text-sm ${currentTheme === 'night' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Ukupno stopova
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className={`p-4 rounded-xl ${currentTheme === 'night' ? 'bg-gray-700/30' : 'bg-gray-50/50'} backdrop-blur-sm flex items-center gap-3`}
            >
              <TrendingUp className={`w-6 h-6 ${monthStats.difference >= 0 ? (currentTheme === 'night' ? 'text-green-400' : 'text-green-600') : (currentTheme === 'night' ? 'text-red-400' : 'text-red-600')}`} />
              <div>
                <div
                  className="text-2xl font-bold"
                  style={{
                    color: monthStats.difference >= 0 ? successColor : warningColor,
                  }}
                >
                  {monthStats.difference > 0 ? '+' : ''}{monthStats.difference}
                </div>
                <div className={`text-sm ${currentTheme === 'night' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Bilans
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Data table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className={`rounded-2xl overflow-hidden ${
            currentTheme === 'night' ? 'bg-gray-800/40 border-gray-700/50' : 'bg-white/60 border-gray-200/30'
          } border backdrop-blur-xl`}
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className={`w-8 h-8 border-2 rounded-full animate-spin ${
                currentTheme === 'night' ? 'border-gray-600 border-t-white' : 'border-gray-300 border-t-blue-600'
              }`}></div>
              <p className={`text-sm mt-4 ${currentTheme === 'night' ? 'text-gray-400' : 'text-gray-600'}`}>
                Učitavanje...
              </p>
            </div>
          ) : processedDeliveries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className={`w-12 h-12 mb-4 ${currentTheme === 'night' ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`text-lg font-medium mb-2 ${currentTheme === 'night' ? 'text-white' : 'text-gray-900'}`}>
                Nema podataka za {MONTHS[month]} {year}
              </p>
              <p className={`text-sm ${currentTheme === 'night' ? 'text-gray-400' : 'text-gray-600'}`}>
                Odaberite vozača iz liste da vidite statistiku
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-full">
                <thead className={`${currentTheme === 'night' ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-50 text-gray-700'}`}>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Datum</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Stopovi</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Paketi</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Pickup</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Reklamacije</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Vreme (h)</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Efikasnost</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Stop/h</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {processedDeliveries.map((d, idx) => {
                    const date = new Date(d.date);
                    const target = driverObj?.target_per_day || 0;
                    const isSuccess = d.stops >= target;
                    const isUrlaub = d.isUrlaubDay;

                    return (
                      <motion.tr
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 + (idx * 0.05) }}
                        className={`transition-colors ${
                          currentTheme === 'night' ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="px-4 py-3 text-sm whitespace-nowrap font-medium">
                          {format(date, 'dd.MM.')}
                        </td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap font-semibold" style={{ color: isUrlaub ? '#f59e0b' : neutralColor }}>
                          {isUrlaub ? 'Urlaub' : 'Radni dan'}
                        </td>
                        <td
                          className="px-4 py-3 text-sm whitespace-nowrap"
                          style={{
                            color: isUrlaub ? neutralColor : (isSuccess ? successColor : warningColor),
                            fontWeight: '700',
                          }}
                        >
                          {d.stops || (isUrlaub ? '0' : '–')}
                        </td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap">{d.packages || (isUrlaub ? '0' : '–')}</td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap">{d.pickupPackages || (isUrlaub ? '0' : '–')}</td>
                        <td
                          className="px-4 py-3 text-sm whitespace-nowrap"
                          style={d.secondComplaints > 0 ? {
                            backgroundColor: blinkState ? '#ffffff' : '#f44336',
                            color: blinkState ? '#f44336' : '#ffffff',
                            fontWeight: '900',
                            textAlign: 'center',
                            transition: 'all 0.3s',
                            outline: blinkState ? '2px solid #f44336' : 'none',
                            outlineOffset: '-2px',
                            borderRadius: '4px'
                          } : {}}
                        >
                          {d.secondComplaints > 0 && (
                            <div className="flex items-center gap-1 justify-center">
                              <AlertTriangle className="w-4 h-4" />
                              {d.secondComplaints}
                            </div>
                          )}
                          {d.secondComplaints === 0 && '–'}
                        </td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap">
                          {d.totalTime ? (
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {`${(d.totalTime / 60).toFixed(1)}h`}
                            </div>
                          ) : '–'}
                        </td>
                        <td
                          className="px-4 py-3 text-sm whitespace-nowrap"
                          style={{
                            color: d.percentage >= 98 ? successColor : warningColor,
                            fontWeight: '600',
                          }}
                        >
                          {d.percentage ? `${d.percentage.toFixed(1)}%` : '–'}
                        </td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap">
                          {d.stopsPerHour ? d.stopsPerHour.toFixed(1) : '–'}
                        </td>
                      </motion.tr>
                    );
                  })}

                  {/* Ukupno red */}
                  <motion.tr
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 }}
                    className={`${currentTheme === 'night' ? 'bg-gray-700/70 font-bold' : 'bg-gray-50 font-bold'}`}
                  >
                    <td className="px-4 py-3 text-sm whitespace-nowrap"><strong>Ukupno</strong></td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap"><strong>—</strong></td>
                    <td
                      className="px-4 py-3 text-sm whitespace-nowrap"
                      style={{
                        color: monthStats.difference >= 0 ? successColor : warningColor,
                        fontWeight: '900',
                      }}
                    >
                      <strong>
                        {monthStats.totalStops} ({monthStats.difference > 0 ? '+' : ''}{monthStats.difference})
                      </strong>
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap"><strong>{monthStats.totalPackages}</strong></td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      <strong>
                        {processedDeliveries.reduce((sum, d) => sum + (d.pickupPackages || 0), 0)}
                      </strong>
                    </td>
                    <td
                      className="px-4 py-3 text-sm whitespace-nowrap"
                      style={(() => {
                        const totalComplaints = processedDeliveries.reduce((sum, d) => sum + (d.secondComplaints || 0), 0);
                        if (totalComplaints > 0) {
                          return {
                            backgroundColor: blinkState ? '#ffffff' : '#f44336',
                            color: blinkState ? '#f44336' : '#ffffff',
                            fontWeight: '900',
                            transition: 'all 0.3s',
                            borderRadius: '4px',
                            outline: blinkState ? '2px solid #f44336' : 'none',
                            textAlign: 'center'
                          };
                        }
                        return { color: successColor, fontWeight: '700' };
                      })()}
                    >
                      <strong>
                        {(() => {
                          const totalComplaints = processedDeliveries.reduce((sum, d) => sum + (d.secondComplaints || 0), 0);
                          return totalComplaints > 0 ? (
                            <div className="flex items-center gap-1 justify-center">
                              <AlertTriangle className="w-4 h-4" />
                              {totalComplaints}
                            </div>
                          ) : totalComplaints;
                        })()}
                      </strong>
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      <strong>
                        {(() => {
                          const totalTime = processedDeliveries.reduce((sum, d) => sum + (d.totalTime || 0), 0);
                          return totalTime ? `${(totalTime / 60).toFixed(1)}h` : '–';
                        })()}
                      </strong>
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      <strong>
                        {(() => {
                          const efficiencyData = processedDeliveries.filter(d => d.percentage && d.percentage > 0);
                          const avgEfficiency = efficiencyData.length > 0
                            ? (efficiencyData.reduce((sum, d) => sum + d.percentage, 0) / efficiencyData.length)
                            : 0;
                          return avgEfficiency > 0 ? `${avgEfficiency.toFixed(1)}%` : '–';
                        })()}
                      </strong>
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      <strong>
                        {(() => {
                          const validStopH = processedDeliveries.filter(d => d.stopsPerHour && d.stopsPerHour > 0);
                          const avgStopH = validStopH.length > 0
                            ? (validStopH.reduce((sum, d) => sum + d.stopsPerHour, 0) / validStopH.length).toFixed(1)
                            : '–';
                          return avgStopH !== 'NaN' ? avgStopH : '–';
                        })()}
                      </strong>
                    </td>
                  </motion.tr>
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
