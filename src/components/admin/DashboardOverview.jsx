import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Truck,
  CheckCircle,
  XCircle,
  DollarSign,
  BarChart3,
  RefreshCw,
  Target,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { supabase } from '../../db/supabaseClient';

// Rute koje pratimo
const ROUTES = ['8610', '8620', '8630', '8640'];

// Helper: formatiraj datum kao YYYY-MM-DD (bez toISOString bugova i time zone)
const formatDate = (year, monthIndexZeroBased, day) => {
  const y = String(year);
  const m = String(monthIndexZeroBased + 1).padStart(2, '0'); // 0-11 -> 01-12
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// ----------------- CLEAN HELPERS (radimo sve u JS, ne u SQL-u) -----------------

// Define Urlaub days
const urlaubMarks = {
  '2025-11-07-8620': true,
  '2025-11-10-8620': true,
  '2025-11-17-8640': true,
  '2025-11-25-8640': true,
  '2025-12-10-8620': true,
  '2025-12-11-8620': true,
  '2025-12-12-8620': true,
  '2025-12-13-8620': true
};

const isUrlaub = (date, tura) => {
  if (!date || !tura) return false;
  const dateStr = typeof date === 'string' ? date.slice(0, 10) : new Date(date).toISOString().slice(0, 10);
  // Ensure tura is a string and trimmed for consistent key matching
  const turaStr = String(tura).trim();
  return urlaubMarks[`${dateStr}-${turaStr}`];
};

// Iz driver stringa (npr. "8610 Eldin") izvučemo samo broj rute ("8610")
const normalizeDriver = (raw) => {
  if (raw === null || raw === undefined) return null;
  const num = String(raw).replace(/[^0-9]/g, '').trim();
  return num || null;
};

// Pretvori bilo šta u čist integer ("" / "-" / "false" / null -> 0)
const parseNum = (value) => {
  if (value === null || value === undefined) return 0;
  const cleaned = String(value).replace(/[^\d-]/g, '');
  if (!cleaned) return 0;
  const n = parseInt(cleaned, 10);
  return Number.isNaN(n) ? 0 : n;
};

// Pospremi jedan red iz deliveries
const cleanRow = (row) => {
  const driverClean = normalizeDriver(row.driver);
  return {
    ...row,
    driverClean,
    stops: parseNum(row.produktivitaet_stops),
    paketi: parseNum(row.zustellung_paketi),
    pickup: parseNum(row.pickup_paketi),
    deletedFlag: row.deleted,
  };
};

// Pospremi cijeli niz redova
const cleanRows = (rows) => {
  if (!rows || !Array.isArray(rows)) return [];
  return rows
    .map(cleanRow)
    .filter(
      (r) =>
        r.driverClean &&
        ROUTES.includes(r.driverClean) &&
        (r.deletedFlag === null || r.deletedFlag === 0) &&
        !isUrlaub(r.date, r.driverClean)
    );
};

// Sum helper
const sumBy = (rows, key) =>
  rows.reduce((sum, r) => sum + (r[key] || 0), 0);

// Jedinstveni datumi
const uniqueDatesCount = (rows) =>
  new Set(rows.map((r) => r.date)).size;

// ----------------- KOMPONENTA -----------------

const DashboardOverview = ({ data, drivers, loading, error, onRefresh }) => {
  // tema
  const [currentTheme, setCurrentTheme] = useState('default');
  const isNightTheme = currentTheme === 'night';

  // range i izbor datuma
  const today = new Date();
  const [timeRange, setTimeRange] = useState('month'); // 'today' | 'month' | 'year'
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth()); // 0-11
  const [selectedDay, setSelectedDay] = useState(
    today.toISOString().split('T')[0]
  ); // YYYY-MM-DD

  const [latestDate, setLatestDate] = useState(null);

  // osnovne metrike
  const [dailyStops, setDailyStops] = useState(0);
  const [monthlyStops, setMonthlyStops] = useState(0);
  const [yearlyStops, setYearlyStops] = useState(0);

  const [dailyPackages, setDailyPackages] = useState(0);
  const [monthlyPackages, setMonthlyPackages] = useState(0);
  const [yearlyPackages, setYearlyPackages] = useState(0);

  const [dailyPickups, setDailyPickups] = useState(0);
  const [monthlyPickups, setMonthlyPickups] = useState(0);
  const [yearlyPickups, setYearlyPickups] = useState(0);

  const [monthlyWorkDays, setMonthlyWorkDays] = useState(0);
  const [yearlyWorkDays, setYearlyWorkDays] = useState(0);

  // prosjek po rutama
  const [routeStats, setRouteStats] = useState({
    8610: { today: 0, month: 0, year: 0 },
    8620: { today: 0, month: 0, year: 0 },
    8630: { today: 0, month: 0, year: 0 },
    8640: { today: 0, month: 0, year: 0 },
  });

  const [statsLoading, setStatsLoading] = useState(true);

  // auto tema po satu
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

  // dohvatimo latestDate iz baze da ne ovisimo o props.data
  useEffect(() => {
    const fetchLatest = async () => {
      // Fetch last 10 dates to handle holidays
      const { data: latestRows, error: latestError } = await supabase
        .from('deliveries')
        .select('date, driver')
        .order('date', { ascending: false })
        .limit(20);

      if (!latestError && latestRows && latestRows.length > 0) {
        // Find first date where at least one driver is NOT on vacation
        // This is global dashboard, so we want the latest working day for ANY driver
        // But typically we just want the latest date that is not a holiday for EVERYONE
        // Or simplest: find the latest date where ANY driver has worked
        
        // Filter out dates where all entries are Urlaub
        // Or check if the date itself is a global holiday? No, Urlaub is per driver.
        
        // Strategy: Iterate through dates. For a date to be valid "latest", 
        // at least one driver should have data and NOT be on Urlaub.
        
        const validDateRow = latestRows.find(row => {
            // Check if this specific entry is Urlaub
            // normalizeDriver handles nulls
            const driver = normalizeDriver(row.driver);
            if (!driver) return false; 
            return !isUrlaub(row.date, driver);
        });

        if (validDateRow) {
            const dbDate = validDateRow.date;
            setLatestDate(dbDate);
            const d = new Date(dbDate);
            setSelectedYear(d.getFullYear());
            setSelectedMonth(d.getMonth());
            setSelectedDay(dbDate);
        } else {
             // Fallback to first row if everything is Urlaub (shouldn't happen usually)
             const dbDate = latestRows[0].date;
             setLatestDate(dbDate);
             const d = new Date(dbDate);
             setSelectedYear(d.getFullYear());
             setSelectedMonth(d.getMonth());
             setSelectedDay(dbDate);
        }

      } else if (data?.latestDate) {
        setLatestDate(data.latestDate);
      }
    };
    fetchLatest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // glavni efekat: kad se promijeni godina/mjesec/dan -> povuci podatke i izračunaj metrike
  useEffect(() => {
    const fetchStats = async () => {
      setStatsLoading(true);

      try {
        // DAY
        const dayDate = selectedDay;

        // MONTH
        const lastDayOfMonth = new Date(
          selectedYear,
          selectedMonth + 1,
          0
        ).getDate();
        const monthStart = formatDate(selectedYear, selectedMonth, 1);
        const monthEnd = formatDate(
          selectedYear,
          selectedMonth,
          lastDayOfMonth
        );

        // YEAR
        const yearStart = formatDate(selectedYear, 0, 1);
        const yearEnd = formatDate(selectedYear, 11, 31);

        console.log('🔍 FILTERI', {
          dayDate,
          monthStart,
          monthEnd,
          yearStart,
          yearEnd,
        });

        // 1) DNEVNI PODACI
        const { data: dayRaw, error: dayError } = await supabase
          .from('deliveries')
          .select('*')
          .eq('date', dayDate);

        if (dayError) {
          console.error('❌ daily query', dayError);
        }
        const dayRows = cleanRows(dayRaw);

        // 2) MJESACNI PODACI
        const { data: monthRaw, error: monthError } = await supabase
          .from('deliveries')
          .select('*')
          .gte('date', monthStart)
          .lte('date', monthEnd);

        if (monthError) {
          console.error('❌ month query', monthError);
        }
        const monthRows = cleanRows(monthRaw);

        // 3) GODISNJI PODACI
        const { data: yearRaw, error: yearError } = await supabase
          .from('deliveries')
          .select('*')
          .gte('date', yearStart)
          .lte('date', yearEnd);

        if (yearError) {
          console.error('❌ year query', yearError);
        }
        const yearRows = cleanRows(yearRaw);

        console.log('📊 daily rows:', dayRows.length);
        console.log('📊 month rows:', monthRows.length);
        console.log('📊 year rows:', yearRows.length);

        // WORK DAYS
        const monthWD = uniqueDatesCount(monthRows);
        const yearWD = uniqueDatesCount(yearRows);

        setMonthlyWorkDays(monthWD);
        setYearlyWorkDays(yearWD);

        // SUMS
        // danas
        setDailyStops(sumBy(dayRows, 'stops'));
        setDailyPackages(sumBy(dayRows, 'paketi'));
        setDailyPickups(sumBy(dayRows, 'pickup'));

        // mjesec
        setMonthlyStops(sumBy(monthRows, 'stops'));
        setMonthlyPackages(sumBy(monthRows, 'paketi'));
        setMonthlyPickups(sumBy(monthRows, 'pickup'));

        // godina
        setYearlyStops(sumBy(yearRows, 'stops'));
        setYearlyPackages(sumBy(yearRows, 'paketi'));
        setYearlyPickups(sumBy(yearRows, 'pickup'));

        // prosjek po rutama
        const newRouteStats = {};
        ROUTES.forEach((route) => {
          const dayR = dayRows.filter((r) => r.driverClean === route);
          const monthR = monthRows.filter((r) => r.driverClean === route);
          const yearR = yearRows.filter((r) => r.driverClean === route);

          const dayStopsRoute = sumBy(dayR, 'stops');
          const monthStopsRoute = sumBy(monthR, 'stops');
          const yearStopsRoute = sumBy(yearR, 'stops');

          const monthRouteDays = uniqueDatesCount(monthR) || 1;
          const yearRouteDays = uniqueDatesCount(yearR) || 1;

          newRouteStats[route] = {
            today: dayStopsRoute,
            month: Math.round(monthStopsRoute / monthRouteDays),
            year: Math.round(yearStopsRoute / yearRouteDays),
          };
        });

        console.log('📈 route stats', newRouteStats);
        setRouteStats(newRouteStats);
      } catch (err) {
        console.error('❌ Dashboard stats error', err);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, [selectedDay, selectedMonth, selectedYear]);

  // kombinovani loading
  if (loading || statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw
            className={`w-12 h-12 mx-auto mb-4 animate-spin ${
              isNightTheme ? 'text-blue-400' : 'text-blue-600'
            }`}
          />
          <p
            className={`text-lg ${
              isNightTheme ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            Učitavanje podataka...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <p
            className={`text-lg ${
              isNightTheme ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            Greška pri učitavanju: {error}
          </p>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all"
            >
              Pokušaj ponovo
            </button>
          )}
        </div>
      </div>
    );
  }

  // ------ Izračun ciljeva / uspješnosti za prikaz ------

  const dnevniCilj = 300;
  const faliDoCilja = dnevniCilj - dailyStops;
  const procenatRealizacije =
    dnevniCilj > 0 ? ((dailyStops / dnevniCilj) * 100).toFixed(2) : '0.00';

  const monthlyGoal = monthlyWorkDays * 300;
  const monthlyMissing = monthlyGoal - monthlyStops;
  const monthlySuccess =
    monthlyGoal > 0 ? ((monthlyStops / monthlyGoal) * 100).toFixed(2) : '0.00';

  const yearlyGoal = yearlyWorkDays * 300;
  const yearlyMissing = yearlyGoal - yearlyStops;
  const yearlySuccess =
    yearlyGoal > 0 ? ((yearlyStops / yearlyGoal) * 100).toFixed(2) : '0.00';

  // helper za prikaz trenutnih paketa/pickup po odabranom periodu
  const getCurrentPackages = () => {
    if (timeRange === 'today') return dailyPackages;
    if (timeRange === 'month') return monthlyPackages;
    return yearlyPackages;
  };

  const getCurrentPickups = () => {
    if (timeRange === 'today') return dailyPickups;
    if (timeRange === 'month') return monthlyPickups;
    return yearlyPickups;
  };

  const getCurrentStops = () => {
    if (timeRange === 'today') return dailyStops;
    if (timeRange === 'month') return monthlyStops;
    return yearlyStops;
  };

  const getCurrentGoal = () => {
    if (timeRange === 'today') return dnevniCilj;
    if (timeRange === 'month') return monthlyGoal;
    return yearlyGoal;
  };

  const getCurrentMissing = () => {
    if (timeRange === 'today') return faliDoCilja;
    if (timeRange === 'month') return monthlyMissing;
    return yearlyMissing;
  };

  const getCurrentSuccess = () => {
    if (timeRange === 'today') return procenatRealizacije;
    if (timeRange === 'month') return monthlySuccess;
    return yearlySuccess;
  };

  const monthNames = [
    'Januar',
    'Februar',
    'Mart',
    'April',
    'Maj',
    'Juni',
    'Juli',
    'Avgust',
    'Septembar',
    'Oktobar',
    'Novembar',
    'Decembar',
  ];

  const currentMonthName = monthNames[selectedMonth] || '';

  const currentYearLabel = selectedYear;

  const currentDateLabel =
    selectedDay ||
    (latestDate
      ? latestDate
      : new Date().toISOString().split('T')[0]);

  // ----------------- UI -----------------

  // glavni blok kartica (paketi, pickup, stops itd.) – zavisi od timeRange
  const renderMainStats = () => {
    const labelRange =
      timeRange === 'today'
        ? 'danas'
        : timeRange === 'month'
        ? currentMonthName
        : `${currentYearLabel}. godina`;

    const stopsLabel =
      timeRange === 'today'
        ? currentDateLabel
        : timeRange === 'month'
        ? currentMonthName
        : `${currentYearLabel}. godina`;

    const missing = getCurrentMissing();
    const success = getCurrentSuccess();

    return (
      <div className="space-y-4">
        {/* Paketi + Pickup */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* Paketi */}
          <motion.div
            className={`relative overflow-hidden rounded-lg sm:rounded-xl p-3 sm:p-4 ${
              isNightTheme ? 'bg-gray-800/50' : 'bg-white'
            } backdrop-blur-xl shadow-lg border ${
              isNightTheme ? 'border-gray-700' : 'border-gray-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex-shrink-0">
                <DollarSign className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-xs font-medium ${
                    isNightTheme ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  Paketi
                </p>
                <p
                  className={`text-lg sm:text-xl font-bold ${
                    isNightTheme ? 'text-white' : 'text-gray-900'
                  } truncate`}
                >
                  {getCurrentPackages()}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p
                  className={`text-xs ${
                    isNightTheme ? 'text-gray-500' : 'text-gray-500'
                  }`}
                >
                  Ukupno paketa
                </p>
                <p
                  className={`text-xs font-semibold ${
                    isNightTheme ? 'text-blue-400' : 'text-blue-600'
                  }`}
                >
                  {labelRange}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Pickup */}
          <motion.div
            className={`relative overflow-hidden rounded-lg sm:rounded-xl p-3 sm:p-4 ${
              isNightTheme ? 'bg-gray-800/50' : 'bg-white'
            } backdrop-blur-xl shadow-lg border ${
              isNightTheme ? 'border-gray-700' : 'border-gray-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex-shrink-0">
                <Truck className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-xs font-medium ${
                    isNightTheme ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  Pickup
                </p>
                <p
                  className={`text-lg sm:text-xl font-bold ${
                    isNightTheme ? 'text-white' : 'text-gray-900'
                  } truncate`}
                >
                  {getCurrentPickups()}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p
                  className={`text-xs ${
                    isNightTheme ? 'text-gray-500' : 'text-gray-500'
                  }`}
                >
                  Ukupno pickup
                </p>
                <p
                  className={`text-xs font-semibold ${
                    isNightTheme ? 'text-blue-400' : 'text-blue-600'
                  }`}
                >
                  {labelRange}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Stops / cilj / potrebno / uspješnost */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* Stops */}
          <motion.div
            className={`relative overflow-hidden rounded-lg sm:rounded-xl p-3 sm:p-4 ${
              isNightTheme ? 'bg-gray-800/50' : 'bg-white'
            } backdrop-blur-xl shadow-lg border ${
              isNightTheme ? 'border-gray-700' : 'border-gray-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex-shrink-0">
                <Target className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-xs font-medium ${
                    isNightTheme ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  Stops
                </p>
                <p
                  className={`text-lg sm:text-xl font-bold ${
                    isNightTheme ? 'text-white' : 'text-gray-900'
                  } truncate`}
                >
                  {getCurrentStops()}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p
                  className={`text-xs ${
                    isNightTheme ? 'text-gray-500' : 'text-gray-500'
                  }`}
                >
                  Zbir stopova
                </p>
                <p
                  className={`text-xs font-semibold ${
                    isNightTheme ? 'text-blue-400' : 'text-blue-600'
                  }`}
                >
                  {stopsLabel}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Cilj */}
          <motion.div
            className={`relative overflow-hidden rounded-lg sm:rounded-xl p-3 sm:p-4 ${
              isNightTheme ? 'bg-gray-800/50' : 'bg-white'
            } backdrop-blur-xl shadow-lg border ${
              isNightTheme ? 'border-gray-700' : 'border-gray-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex-shrink-0">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-xs font-medium ${
                    isNightTheme ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  Cilj
                </p>
                <p
                  className={`text-lg sm:text-xl font-bold ${
                    isNightTheme ? 'text-white' : 'text-gray-900'
                  } truncate`}
                >
                  {getCurrentGoal()}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-gray-500">
                  {timeRange === 'today'
                    ? 'Cilj za 4 ture'
                    : `${timeRange === 'month' ? monthlyWorkDays : yearlyWorkDays} dana`}
                </p>
                <p className="text-xs text-gray-500">
                  {timeRange === 'today' ? 'je 300' : '× 300'}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Potrebno do cilja */}
          <motion.div
            className={`relative overflow-hidden rounded-lg sm:rounded-xl p-3 sm:p-4 ${
              isNightTheme ? 'bg-gray-800/50' : 'bg-white'
            } backdrop-blur-xl shadow-lg border ${
              isNightTheme ? 'border-gray-700' : 'border-gray-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg bg-gradient-to-br ${
                  missing > 0
                    ? 'from-red-500 to-orange-500'
                    : 'from-green-500 to-emerald-500'
                } flex-shrink-0`}
              >
                <AlertCircle className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-xs font-medium ${
                    isNightTheme ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  Potrebno do cilja
                </p>
                <p
                  className={`text-lg sm:text-xl font-bold ${
                    missing > 0 ? 'text-red-600' : 'text-green-600'
                  } truncate`}
                >
                  {missing > 0
                    ? `-${missing}`
                    : missing < 0
                    ? `+${Math.abs(missing)}`
                    : 0}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-gray-500">štopovi</p>
                <p className="text-xs text-gray-500">
                  {missing > 0 ? 'u minusu' : 'u plusu'}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Uspješnost */}
          <motion.div
            className={`relative overflow-hidden rounded-lg sm:rounded-xl p-3 sm:p-4 ${
              isNightTheme ? 'bg-gray-800/50' : 'bg-white'
            } backdrop-blur-xl shadow-lg border ${
              isNightTheme ? 'border-gray-700' : 'border-gray-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex-shrink-0">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-xs font-medium ${
                    isNightTheme ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  Uspješnost
                </p>
                <p
                  className={`text-lg sm:text-xl font-bold ${
                    isNightTheme ? 'text-white' : 'text-gray-900'
                  } truncate`}
                >
                  {getCurrentSuccess()}%
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-gray-500">Uspjeh</p>
                <p className="text-xs text-gray-500">u postotku</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  };

  // route cards
  const renderRouteCards = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <h3
          className={`text-lg font-bold ${
            isNightTheme ? 'text-white' : 'text-gray-900'
          }`}
        >
          Prosjek stopova po rutama
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {ROUTES.map((route, index) => {
          const routeData = routeStats[route] || {
            today: 0,
            month: 0,
            year: 0,
          };
          const currentValue =
            timeRange === 'today'
              ? routeData.today
              : timeRange === 'month'
              ? routeData.month
              : routeData.year;

          const gradients = [
            'from-cyan-500 to-blue-500',
            'from-emerald-500 to-teal-500',
            'from-violet-500 to-purple-500',
            'from-rose-500 to-pink-500',
          ];

          return (
            <motion.div
              key={route}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className={`relative overflow-hidden rounded-lg sm:rounded-xl p-3 sm:p-4 ${
                isNightTheme ? 'bg-gray-800/50' : 'bg-white'
              } backdrop-blur-xl shadow-lg border ${
                isNightTheme ? 'border-gray-700' : 'border-gray-100'
              }`}
            >
              <div
                className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${
                  gradients[index]
                } opacity-10 rounded-full blur-xl`}
              />
              <div className="flex items-center gap-3 relative">
                <div
                  className={`p-2 rounded-lg bg-gradient-to-br ${
                    gradients[index]
                  } flex-shrink-0`}
                >
                  <Target className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-xs font-medium ${
                      isNightTheme ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    Ruta {route}
                  </p>
                  <p
                    className={`text-lg sm:text-xl font-bold ${
                      isNightTheme ? 'text-white' : 'text-gray-900'
                    } truncate`}
                  >
                    {currentValue}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-500">Prosjek stopova</p>
                  <p
                    className={`text-xs font-semibold ${
                      isNightTheme ? 'text-blue-400' : 'text-blue-600'
                    }`}
                  >
                    {timeRange === 'today'
                      ? 'danas'
                      : timeRange === 'month'
                      ? 'mjesec'
                      : 'godina'}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );

  // godine za dropdown (od 2024 do trenutne + 1)
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let y = 2024; y <= currentYear + 1; y += 1) {
    yearOptions.push(y);
  }

  return (
    <div className="space-y-6">
      {/* Header + filteri */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 rounded-2xl ${
          isNightTheme ? 'bg-gray-800/50' : 'bg-white/50'
        } backdrop-blur-xl border ${
          isNightTheme ? 'border-gray-700' : 'border-white/20'
        } shadow-xl gap-4 sm:gap-0`}
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="p-2 sm:p-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600"
          >
            <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </motion.div>
          <div>
            <h2
              className={`text-xl sm:text-2xl font-bold ${
                isNightTheme ? 'text-white' : 'text-gray-800'
              }`}
            >
              Dashboard Pregled
            </h2>
            <p
              className={`text-xs sm:text-sm ${
                isNightTheme ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              {latestDate
                ? `Zadnje ažurirano: ${new Date(
                    latestDate
                  ).toLocaleDateString('bs-BA')}`
                : 'Pregled statistika'}
            </p>
          </div>
        </div>

        {/* desna strana: range dugmad + date/month/year filteri + refresh */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          {/* range dugmad */}
          <div className="flex gap-1 sm:gap-2 flex-1 sm:flex-none">
            {['today', 'month', 'year'].map((range) => (
              <motion.button
                key={range}
                onClick={() => setTimeRange(range)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-3 py-2 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl font-medium transition-all text-sm sm:text-base flex-1 sm:flex-none ${
                  timeRange === range
                    ? isNightTheme
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                      : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                    : isNightTheme
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-white/60 text-gray-700 hover:bg-white/80'
                }`}
              >
                {range === 'today'
                  ? 'Danas'
                  : range === 'month'
                  ? 'Mjesec'
                  : 'Godina'}
              </motion.button>
            ))}
          </div>

          {/* izbor datuma / mjeseca / godine */}
          <div className="flex items-center gap-2">
            {timeRange === 'today' && (
              <input
                type="date"
                className={`px-3 py-2 rounded-lg border text-sm ${
                  isNightTheme
                    ? 'bg-gray-800 border-gray-600 text-gray-100'
                    : 'bg-white border-gray-200 text-gray-800'
                }`}
                value={selectedDay}
                max={latestDate || undefined}
                onChange={(e) => setSelectedDay(e.target.value)}
              />
            )}

            {timeRange === 'month' && (
              <>
                <select
                  className={`px-2 py-2 rounded-lg border text-sm ${
                    isNightTheme
                      ? 'bg-gray-800 border-gray-600 text-gray-100'
                      : 'bg-white border-gray-200 text-gray-800'
                  }`}
                  value={selectedMonth}
                  onChange={(e) =>
                    setSelectedMonth(parseInt(e.target.value, 10))
                  }
                >
                  {monthNames.map((m, idx) => (
                    <option key={m} value={idx}>
                      {m}
                    </option>
                  ))}
                </select>

                <select
                  className={`px-2 py-2 rounded-lg border text-sm ${
                    isNightTheme
                      ? 'bg-gray-800 border-gray-600 text-gray-100'
                      : 'bg-white border-gray-200 text-gray-800'
                  }`}
                  value={selectedYear}
                  onChange={(e) =>
                    setSelectedYear(parseInt(e.target.value, 10))
                  }
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </>
            )}

            {timeRange === 'year' && (
              <select
                className={`px-3 py-2 rounded-lg border text-sm ${
                  isNightTheme
                    ? 'bg-gray-800 border-gray-600 text-gray-100'
                    : 'bg-white border-gray-200 text-gray-800'
                }`}
                value={selectedYear}
                onChange={(e) =>
                  setSelectedYear(parseInt(e.target.value, 10))
                }
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            )}

            {onRefresh && (
              <motion.button
                onClick={onRefresh}
                whileHover={{ scale: 1.05, rotate: 180 }}
                whileTap={{ scale: 0.95 }}
                className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${
                  isNightTheme
                    ? 'bg-gray-700 text-white hover:bg-gray-600'
                    : 'bg-white text-gray-800 hover:bg-gray-50'
                } transition-all shadow-lg`}
              >
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* glavni stats */}
      {renderMainStats()}

      {/* prosjek po rutama */}
      {renderRouteCards()}
    </div>
  );
};

export default DashboardOverview;
