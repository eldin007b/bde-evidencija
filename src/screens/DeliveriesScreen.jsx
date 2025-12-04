import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, TrendingUp, TrendingDown, Users, AlertCircle, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import useWorkdays from '../hooks/useWorkdays';
import { useDriversQuery, useDeliveriesQuery, useHolidaysQuery } from '../hooks/queries';

const CURRENT_YEAR = new Date().getFullYear();
const MONTHS = ['Januar', 'Februar', 'Mart', 'April', 'Maj', 'Juni', 'Juli', 'August', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'];

export default function DeliveriesScreen() {
  const navigate = useNavigate();
  const [year, setYear] = useState(CURRENT_YEAR);
  const [month, setMonth] = useState(new Date().getMonth());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentTheme, setCurrentTheme] = useState('night');

  const themes = {
    default: { background: 'from-blue-50 via-white to-purple-50' },
    sunrise: { background: 'from-orange-100 via-pink-100 to-yellow-100' },
    afternoon: { background: 'from-blue-100 via-cyan-100 to-sky-100' },
    evening: { background: 'from-purple-100 via-pink-100 to-indigo-100' },
    night: { background: 'from-slate-900 via-blue-900 to-indigo-900' }
  };

  useEffect(() => {
    setCurrentTheme('night'); // Always use night theme
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const { data: drivers = [], isLoading: driversLoading } = useDriversQuery();
  const { data: deliveries = [], isLoading: deliveriesLoading } = useDeliveriesQuery(year, month);
  const { data: holidays = [] } = useHolidaysQuery(year);
  const loading = deliveriesLoading || driversLoading;

  const groupedData = useMemo(() => {
    const grouped = {};
    deliveries.forEach(delivery => {
      if (!grouped[delivery.date]) grouped[delivery.date] = {};
      grouped[delivery.date][delivery.driver] = delivery.produktivitaet_stops || 0;
    });
    
    // Apply special rules for specific dates
    Object.keys(grouped).forEach(dateString => {
      // For 17.11 and 25.11, transfer values from 8640 to 8610
      if (dateString === '2025-11-17' || dateString === '2025-11-25') {
        if (grouped[dateString]['8640']) {
          const valueToAdd = grouped[dateString]['8640'];
          
          // Add value to 8610 if it exists, otherwise create new entry
          if (grouped[dateString]['8610']) {
            grouped[dateString]['8610'] += valueToAdd;
          } else {
            grouped[dateString]['8610'] = valueToAdd;
          }
          
          // Delete 8640 after transfer
          delete grouped[dateString]['8640'];
        }
      }
    });
    
    return grouped;
  }, [deliveries]);

  // Define Urlaub days
  const urlaubMarks = useMemo(() => ({
    '2025-11-07-8620': true,
    '2025-11-10-8620': true,
    '2025-11-17-8640': true,
    '2025-11-25-8640': true,
	'2025-12-10-8620': true,
	'2025-12-11-8620': true,
	'2025-12-12-8620': true
  }), []);

  const workdays = useWorkdays(year, month, holidays.map(h => h.date));

  const monthStats = useMemo(() => {
    const totalWorkdays = workdays.length;
    const daysWithData = new Set();
    deliveries.forEach(delivery => {
      if (delivery.produktivitaet_stops > 0) daysWithData.add(delivery.date);
    });
    const workedDaysCount = daysWithData.size;
    
    // Calculate how many workdays have passed until today
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    let passedWorkdays = 0;
    
    if (year === currentYear && month === currentMonth) {
      // If current month, count workdays until today
      const currentDay = today.getDate();
      passedWorkdays = workdays.filter(workday => {
        const workdayDate = new Date(workday);
        return workdayDate.getDate() <= currentDay;
      }).length;
    } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
      // If past month, all workdays have passed
      passedWorkdays = totalWorkdays;
    } else {
      // If future month, no workdays have passed
      passedWorkdays = 0;
    }
    
    const totalStops = deliveries.reduce((sum, d) => sum + (d.produktivitaet_stops || 0), 0);
    const monthlyTarget = drivers.filter(d => d.aktivan).reduce((sum, driver) => sum + ((driver.target_per_day || 0) * totalWorkdays), 0);
    const targetForWorkedDays = drivers.filter(d => d.aktivan).reduce((sum, driver) => sum + ((driver.target_per_day || 0) * workedDaysCount), 0);
    const difference = totalStops - monthlyTarget;
    
    // Calculate B&D values
    const workedDaysForBD = workdays.filter(date => {
      const dateString = format(date, 'yyyy-MM-dd');
      const dayData = groupedData[dateString] || {};
      const dayTotal = drivers.filter(d => d.aktivan).reduce((sum, driver) => sum + (dayData[driver.tura] || 0), 0);
      return dayTotal > 0;
    });
    
    const totalAllWorked = workedDaysForBD.reduce((sum, date) => {
      const dateString = format(date, 'yyyy-MM-dd');
      const dayData = groupedData[dateString] || {};
      return sum + drivers.filter(d => d.aktivan).reduce((dsum, driver) => dsum + (dayData[driver.tura] || 0), 0);
    }, 0);
    
    const targetForWorkedDaysBD = drivers.filter(d => d.aktivan).reduce((sum, driver) => 
      sum + ((driver.target_per_day || 0) * workedDaysForBD.length), 0);
      
    const targetAllDaysBD = drivers.filter(d => d.aktivan).reduce((sum, driver) => 
      sum + ((driver.target_per_day || 0) * totalWorkdays), 0);
      
    const bilansBD = totalAllWorked - targetAllDaysBD;
    
    return { 
      totalWorkdays, 
      passedWorkdays,
      drivers: drivers.filter(d => d.aktivan).length, 
      remainingDays: Math.max(0, totalWorkdays - workedDaysCount), 
      totalStops, 
      monthlyTarget, 
      targetForWorkedDays, 
      difference,
      totalAllWorked,
      targetForWorkedDaysBD,
      bilansBD
    };
  }, [workdays, deliveries, drivers, year, month, groupedData]);

  const formatTime = (date) => date.toLocaleTimeString('bs-BA', { hour: '2-digit', minute: '2-digit', hour12: false });
  const formatDate = (date) => date.toLocaleDateString('bs-BA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const getThemeBackground = () => `bg-gradient-to-br ${themes[currentTheme].background}`;

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

  return (
    <div className={`min-h-screen ${getThemeBackground()} ${currentTheme === 'night' ? 'text-white' : 'text-gray-800'}`}>
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
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`p-4 rounded-xl ${currentTheme === 'night' ? 'bg-gray-700/30' : 'bg-gray-50/50'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className={`w-5 h-5 ${currentTheme === 'night' ? 'text-blue-400' : 'text-blue-600'}`} />
                <span className={`text-sm ${currentTheme === 'night' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Radnih dana
                </span>
              </div>
              <p className={`text-2xl font-bold ${currentTheme === 'night' ? 'text-white' : 'text-gray-800'}`}>
                {monthStats.passedWorkdays}/{monthStats.totalWorkdays}
              </p>
            </div>
            
            <div className={`p-4 rounded-xl ${currentTheme === 'night' ? 'bg-gray-700/30' : 'bg-gray-50/50'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Users className={`w-5 h-5 ${currentTheme === 'night' ? 'text-green-400' : 'text-green-600'}`} />
                <span className={`text-sm ${currentTheme === 'night' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Vozača
                </span>
              </div>
              <p className={`text-2xl font-bold ${currentTheme === 'night' ? 'text-white' : 'text-gray-800'}`}>
                {monthStats.drivers}
              </p>
            </div>
            
            <div className={`p-4 rounded-xl ${currentTheme === 'night' ? 'bg-gray-700/30' : 'bg-gray-50/50'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Package className={`w-5 h-5 ${currentTheme === 'night' ? 'text-purple-400' : 'text-purple-600'}`} />
                <span className={`text-sm ${currentTheme === 'night' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Ukupno
                </span>
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
                <span className={`text-sm ${currentTheme === 'night' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Bilans
                </span>
              </div>
              <p 
                className="text-2xl font-black" 
                style={{
                  color: monthStats.bilansBD >= 0 
                    ? (currentTheme === 'night' ? '#4ade80' : '#15803d') 
                    : (currentTheme === 'night' ? '#fb7185' : '#dc2626'),
                  textShadow: currentTheme === 'night' ? '0 0 3px rgba(0,0,0,0.3)' : 'none'
                }}
              >
                {monthStats.bilansBD > 0 ? '+' : ''}{monthStats.bilansBD}
              </p>
            </div>
          </div>
        </motion.div>

        {loading ? (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className={`p-8 rounded-2xl ${currentTheme === 'night' ? 'bg-gray-800/40' : 'bg-white/60'} backdrop-blur-xl text-center`}
          >
            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className={currentTheme === 'night' ? 'text-gray-400' : 'text-gray-600'}>
              Učitavanje...
            </p>
          </motion.div>
        ) : workdays.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className={`p-8 rounded-2xl ${currentTheme === 'night' ? 'bg-gray-800/40' : 'bg-white/60'} backdrop-blur-xl text-center`}
          >
            <AlertCircle className={`w-16 h-16 mx-auto mb-4 ${currentTheme === 'night' ? 'text-gray-600' : 'text-gray-400'}`} />
            <p className={currentTheme === 'night' ? 'text-gray-400' : 'text-gray-600'}>
              Nema radnih dana
            </p>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.2 }} 
            className={`rounded-2xl ${currentTheme === 'night' ? 'bg-gray-800/40 border-gray-700/50' : 'bg-white/70 border-gray-200/30'} border backdrop-blur-xl overflow-hidden`}
          >
            <div className="overflow-x-auto">
              <table className="w-full table-fixed" style={{ fontSize: '0.8rem' }}>
                <thead>
                  <tr className={`${currentTheme === 'night' ? 'bg-gray-700/50' : 'bg-gray-100/80'}`}>
                    <th 
                      className="px-1 py-2 text-left text-xs font-bold w-16" 
                      style={{ color: currentTheme === 'night' ? '#fff' : '#1f2937' }}
                    >
                      Datum
                    </th>
                    {drivers.filter(d => d.aktivan).map(driver => (
                      <th 
                        key={driver.tura} 
                        className="px-1 py-2 text-center text-xs font-bold" 
                        style={{ color: currentTheme === 'night' ? '#fff' : '#1f2937' }}
                      >
                        <div className="font-semibold">{driver.ime}</div>
                        <div className="text-[10px] opacity-70">{driver.tura}</div>
                      </th>
                    ))}
                    <th 
                      className="px-1 py-2 text-center text-xs font-bold w-16" 
                      style={{ color: currentTheme === 'night' ? '#fff' : '#1f2937' }}
                    >
                      <div className="font-semibold">Ukupno</div>
                      <div className="text-[10px] opacity-70">B&D</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(groupedData)
                    .sort((a, b) => new Date(a) - new Date(b))
                    .map((dateString, index) => {
                      const dayData = groupedData[dateString] || {};
                      const total = drivers.filter(d => d.aktivan).reduce((sum, driver) => sum + (dayData[driver.tura] || 0), 0);
                      const isHoliday = holidays.some(h => h.date === dateString);
                      
                      return (
                        <motion.tr 
                          key={dateString} 
                          initial={{ opacity: 0, x: -20 }} 
                          animate={{ opacity: 1, x: 0 }} 
                          transition={{ delay: index * 0.02 }} 
                          className={`border-t ${currentTheme === 'night' ? 'border-gray-700/50' : 'border-gray-200/50'} ${isHoliday ? (currentTheme === 'night' ? 'bg-red-900/20' : 'bg-red-50/70') : ''}`}
                        >
                          <td 
                            className="px-1 py-1.5 text-xs font-bold" 
                            style={{ color: currentTheme === 'night' ? '#e5e7eb' : '#374151' }}
                          >
                            {format(new Date(dateString), 'dd.MM.')}
                          </td>
                          
                          {drivers.filter(d => d.aktivan).map(driver => {
                            const value = dayData[driver.tura];
                            const target = driver.target_per_day || 0;
                            const isSuccess = value >= target;
                            const isUrlaub = urlaubMarks[`${dateString}-${driver.tura}`];
                            
                            // Dynamic colors - dark for light themes, light for dark theme
                            const successColor = currentTheme === 'night' ? '#4ade80' : '#15803d';
                            const warningColor = currentTheme === 'night' ? '#fb7185' : '#dc2626';
                            
                            return (
                              <td 
                                key={driver.tura} 
                                className="px-1 py-1.5 text-center text-xs font-extrabold"
                                style={{ 
                                  color: isUrlaub 
                                    ? (currentTheme === 'night' ? '#f59e0b' : '#d97706')
                                    : value 
                                      ? (isSuccess ? successColor : warningColor) 
                                      : '#9ca3af',
                                  fontWeight: '900',
                                  textShadow: (value || isUrlaub) 
                                    ? (currentTheme === 'night' ? '0 0 2px rgba(0,0,0,0.5)' : 'none') 
                                    : 'none'
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
                              textShadow: total > 0 
                                ? (currentTheme === 'night' ? '0 0 2px rgba(0,0,0,0.5)' : 'none') 
                                : 'none'
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
                    <td 
                      className="px-1 py-2 text-xs font-extrabold" 
                      style={{ color: currentTheme === 'night' ? '#fff' : '#1f2937' }}
                    >
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
                      
                      const workedDaysCount = workedDays.length;
                      const targetForWorkedDays = (driver.target_per_day || 0) * workedDaysCount;
                      const targetAllDays = (driver.target_per_day || 0) * workdays.length;
                      const bilans = totalForDriver - targetAllDays;
                      
                      // Dynamic colors
                      const successColor = currentTheme === 'night' ? '#4ade80' : '#15803d';
                      const errorColor = currentTheme === 'night' ? '#fb7185' : '#dc2626';
                      
                      // Color for total - green if >= target for worked days, red if less
                      const totalColor = totalForDriver >= targetForWorkedDays ? successColor : errorColor;
                      
                      // Color for balance - green if >= 0, red if negative
                      const bilansColor = bilans >= 0 ? successColor : errorColor;
                      
                      return (
                        <td key={driver.tura} className="px-1 py-2 text-center">
                          <div 
                            className="text-xs font-extrabold" 
                            style={{ 
                              color: totalColor,
                              textShadow: currentTheme === 'night' ? '0 0 2px rgba(0,0,0,0.5)' : 'none'
                            }}
                          >
                            {totalForDriver}
                          </div>
                          <div 
                            className="text-[10px] font-black" 
                            style={{ 
                              color: bilansColor,
                              textShadow: currentTheme === 'night' ? '0 0 2px rgba(0,0,0,0.5)' : 'none'
                            }}
                          >
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
                        
                        const targetForWorkedDays = drivers.filter(d => d.aktivan).reduce((sum, driver) => 
                          sum + ((driver.target_per_day || 0) * workedDays.length), 0);
                          
                        const targetAllDays = drivers.filter(d => d.aktivan).reduce((sum, driver) => 
                          sum + ((driver.target_per_day || 0) * workdays.length), 0);
                          
                        const bilans = totalAllWorked - targetAllDays;
                        
                        const successColor = currentTheme === 'night' ? '#4ade80' : '#15803d';
                        const errorColor = currentTheme === 'night' ? '#fb7185' : '#dc2626';
                        
                        const totalColor = totalAllWorked >= targetForWorkedDays ? successColor : errorColor;
                        const bilansColor = bilans >= 0 ? successColor : errorColor;
                        
                        return (
                          <>
                            <div 
                              className="text-xs font-extrabold" 
                              style={{ 
                                color: totalColor,
                                textShadow: currentTheme === 'night' ? '0 0 2px rgba(0,0,0,0.5)' : 'none'
                              }}
                            >
                              {totalAllWorked}
                            </div>
                            <div 
                              className="text-[10px] font-black" 
                              style={{ 
                                color: bilansColor,
                                textShadow: currentTheme === 'night' ? '0 0 2px rgba(0,0,0,0.5)' : 'none'
                              }}
                            >
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
