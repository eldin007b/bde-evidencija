import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Users, RefreshCw, Calendar } from 'lucide-react';

export default function PayrollAnalytics({ drivers, currentTheme = 'default' }) {
  const [payrollData, setPayrollData] = useState({ drivers: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const isNightTheme = currentTheme === 'night';
  
  // Generiši listu dostupnih godina (npr. od 2020 do trenutne godine + 1)
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: currentYear - 2019 }, (_, i) => 2020 + i);

  useEffect(() => {
    const loadPayrollAnalytics = async () => {
      setLoading(true);
      try {
        const { getPayrollAnalytics } = await import('../../utils/payrollAnalytics');
        const data = await getPayrollAnalytics(selectedYear);
        // Sortiraj vozače od najvećeg prema najmanjem trošku
        const sortedDrivers = [...data.drivers].sort((a, b) => (b.cost || 0) - (a.cost || 0));
        setPayrollData({ ...data, drivers: sortedDrivers });
      } catch (error) {
        console.error('Greška pri učitavanju payroll analitike:', error);
        setPayrollData({ drivers: [], total: 0 });
      } finally {
        setLoading(false);
      }
    };

    if (drivers.length > 0) {
      loadPayrollAnalytics();
    }
  }, [drivers, selectedYear]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const { refreshAllPayrolls } = await import('../../utils/payrollBatchRefresh');
      await refreshAllPayrolls();
      
      const { getPayrollAnalytics } = await import('../../utils/payrollAnalytics');
      const data = await getPayrollAnalytics(selectedYear);
      // Sortiraj vozače od najvećeg prema najmanjem trošku
      const sortedDrivers = [...data.drivers].sort((a, b) => (b.cost || 0) - (a.cost || 0));
      setPayrollData({ ...data, drivers: sortedDrivers });
    } catch (error) {
      console.error('Greška u batch refresh:', error);
      alert('Greška u batch refresh: ' + (error?.message || error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="p-6"
    >
      <div className={`rounded-2xl ${isNightTheme ? 'bg-gray-800/50' : 'bg-white/50'} backdrop-blur-xl border ${isNightTheme ? 'border-gray-700' : 'border-white/20'} shadow-xl p-6`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600"
            >
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </motion.div>
            <div>
              <h2 className={`text-xl sm:text-2xl font-bold ${isNightTheme ? 'text-white' : 'text-gray-800'}`}>
                Troškovi firme po vozaču
              </h2>
              <p className={`text-xs sm:text-sm ${isNightTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                Godina: {selectedYear}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Year Selector */}
            <div className="flex items-center gap-2 flex-1 sm:flex-none">
              <Calendar className={`w-4 h-4 ${isNightTheme ? 'text-gray-400' : 'text-gray-600'}`} />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className={`flex-1 sm:flex-none px-3 py-2 rounded-lg sm:rounded-xl font-medium transition-all text-sm sm:text-base ${
                  isNightTheme
                    ? 'bg-gray-700 text-white border-gray-600'
                    : 'bg-white text-gray-800 border-gray-200'
                } border focus:outline-none focus:ring-2 focus:ring-emerald-500`}
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            <motion.button
              onClick={handleRefresh}
              disabled={loading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl font-medium transition-all text-sm sm:text-base ${
                loading 
                  ? 'opacity-50 cursor-not-allowed' 
                  : isNightTheme
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-400 hover:to-teal-500'
              } shadow-lg flex-shrink-0`}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </motion.button>
          </div>
        </div>

        {loading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12"
          >
            <RefreshCw className={`w-12 h-12 mb-4 animate-spin ${isNightTheme ? 'text-emerald-400' : 'text-emerald-600'}`} />
            <span className={`text-lg ${isNightTheme ? 'text-gray-300' : 'text-gray-600'}`}>
              Učitavanje podataka...
            </span>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="lg:col-span-2 grid gap-3 sm:gap-4">
              {payrollData.drivers.map((driver, idx) => (
                <motion.div
                  key={driver.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`p-3 sm:p-4 rounded-lg sm:rounded-xl ${
                    isNightTheme 
                      ? 'bg-gray-700/50 hover:bg-gray-700/70' 
                      : 'bg-white/60 hover:bg-white/80'
                  } backdrop-blur-sm border ${
                    isNightTheme ? 'border-gray-600' : 'border-white/40'
                  } transition-all hover:scale-[1.02] hover:shadow-lg`}
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-2 sm:p-3 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex-shrink-0">
                      <Users className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs sm:text-sm ${isNightTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                        Ukupni trošak za
                      </div>
                      <div className={`font-semibold text-sm sm:text-base ${isNightTheme ? 'text-white' : 'text-gray-800'} capitalize truncate`}>
                        {driver.name}
                      </div>
                    </div>
                    <div className={`text-base sm:text-xl font-bold ${isNightTheme ? 'text-emerald-400' : 'text-emerald-600'} flex-shrink-0`}>
                      {(driver.cost !== undefined ? driver.cost : 0).toLocaleString('de-DE', {
                        minimumFractionDigits: 2
                      })} €
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-br ${
                isNightTheme 
                  ? 'from-emerald-900/50 to-teal-900/50 border-emerald-700/50' 
                  : 'from-emerald-50 to-teal-50 border-emerald-200/50'
              } border-2 flex flex-col justify-center items-center text-center`}
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="p-3 sm:p-4 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 mb-3 sm:mb-4"
              >
                <DollarSign className="w-6 h-6 sm:w-10 sm:h-10 text-white" />
              </motion.div>
              <div className={`text-xs sm:text-sm font-medium mb-2 ${isNightTheme ? 'text-gray-300' : 'text-gray-600'}`}>
                Ukupni trošak za sve vozače
              </div>
              <div className={`text-xl sm:text-3xl font-bold ${isNightTheme ? 'text-white' : 'text-gray-900'}`}>
                {payrollData.total.toLocaleString('de-DE', {
                  minimumFractionDigits: 2
                })} €
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </motion.div>
  );
}