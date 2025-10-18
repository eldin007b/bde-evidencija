import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Truck, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  Activity,
  DollarSign,
  Calendar,
  BarChart3,
  RefreshCw,
  Target,
  AlertCircle,
  TrendingDown
} from 'lucide-react';
import { supabase } from '../../db/supabaseClient';

const DashboardOverview = ({ data, drivers, loading, error, onRefresh }) => {
  const [currentTheme, setCurrentTheme] = useState('default');
  const [timeRange, setTimeRange] = useState('month'); // 'today', 'month', 'year'
  const [monthlyStops, setMonthlyStops] = useState(0);
  const [yearlyStops, setYearlyStops] = useState(0);
  const [monthlyWorkDays, setMonthlyWorkDays] = useState(0);
  const [yearlyWorkDays, setYearlyWorkDays] = useState(0);

  useEffect(() => {
    const fetchMonthlyData = async () => {
      const today = new Date();
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const monthEnd = today.toISOString().split('T')[0];
      
      const { data: monthData } = await supabase
        .from('deliveries')
        .select('produktivitaet_stops, date')
        .gte('date', monthStart)
        .lte('date', monthEnd)
        .eq('deleted', 0)
        .not('produktivitaet_stops', 'is', null);
      
      const monthStops = monthData?.reduce((sum, d) => sum + (d.produktivitaet_stops || 0), 0) || 0;
      const uniqueDates = [...new Set(monthData?.map(d => d.date) || [])];
      setMonthlyStops(monthStops);
      setMonthlyWorkDays(uniqueDates.length);
    };

    const fetchYearlyData = async () => {
      const today = new Date();
      const yearStart = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
      const yearEnd = today.toISOString().split('T')[0];
      
      const { data: yearData } = await supabase
        .from('deliveries')
        .select('produktivitaet_stops, date')
        .gte('date', yearStart)
        .lte('date', yearEnd)
        .eq('deleted', 0)
        .not('produktivitaet_stops', 'is', null);
      
      const yearStops = yearData?.reduce((sum, d) => sum + (d.produktivitaet_stops || 0), 0) || 0;
      const uniqueDates = [...new Set(yearData?.map(d => d.date) || [])];
      setYearlyStops(yearStops);
      setYearlyWorkDays(uniqueDates.length);
    };

    fetchMonthlyData();
    fetchYearlyData();
  }, []);

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

  // Prva kartica: Danas - Stops (zbir stopova od zadnjeg dana za sve vozače)
  const danasStops = data?.dailyStops || 0;
  // Cilj je fiksno 300
  const dnevniCilj = 300;
  const faliDoCilja = dnevniCilj - danasStops;
  const procenatRealizacije = dnevniCilj > 0 ? ((danasStops / dnevniCilj) * 100).toFixed(2) : 0;

  const statsCards = [
    {
      title: 'Danas - Stops',
      value: `${danasStops} / ${dnevniCilj} (${procenatRealizacije}%)`,
      subtitle: `Zbir stopova od zadnjeg dana za sve vozače`,
      icon: Target,
      gradient: 'from-green-500 to-emerald-500',
      showSubtitle: true
    },
    {
      title: 'Fali do cilja',
      value: faliDoCilja > 0 ? faliDoCilja : 0,
      subtitle: `Cilj: ${dnevniCilj} stopova`,
      icon: AlertCircle,
      gradient: 'from-red-500 to-orange-500',
      showSubtitle: true
    },
    {
      title: 'Extra Vožnje',
      value: data?.extraRides || 0,
      subtitle: `${data?.pendingRides || 0} na čekanju`,
      icon: Truck,
      gradient: 'from-purple-500 to-pink-500',
      showSubtitle: true
    },
    {
      title: 'Uspješnost',
      value: `${data?.successRate || 0}%`,
      subtitle: 'Realizovano vožnji',
      icon: TrendingUp,
      gradient: 'from-orange-500 to-red-500',
      showSubtitle: true
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className={`w-12 h-12 mx-auto mb-4 animate-spin ${isNightTheme ? 'text-blue-400' : 'text-blue-600'}`} />
          <p className={`text-lg ${isNightTheme ? 'text-gray-400' : 'text-gray-600'}`}>Učitavanje podataka...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <p className={`text-lg ${isNightTheme ? 'text-gray-400' : 'text-gray-600'}`}>Greška pri učitavanju: {error}</p>
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

  // Prikaz za odabrani period
  let prikaz = null;
  if (timeRange === 'today') {
    prikaz = (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Stops danas */}
        <motion.div className={`relative overflow-hidden rounded-lg sm:rounded-xl p-3 sm:p-4 ${isNightTheme ? 'bg-gray-800/50' : 'bg-white'} backdrop-blur-xl shadow-lg border ${isNightTheme ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex-shrink-0">
              <Target className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium ${isNightTheme ? 'text-gray-400' : 'text-gray-600'}`}>Stops</p>
              <p className={`text-lg sm:text-xl font-bold ${isNightTheme ? 'text-white' : 'text-gray-900'} truncate`}>{danasStops}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className={`text-xs ${isNightTheme ? 'text-gray-500' : 'text-gray-500'}`}>Zbir stopova</p>
              <p className={`text-xs font-semibold ${isNightTheme ? 'text-blue-400' : 'text-blue-600'}`}>
                {data?.latestDate ? new Date(data.latestDate).toLocaleDateString('bs-BA', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'danas'}
              </p>
            </div>
          </div>
        </motion.div>
        {/* Cilj */}
        <motion.div className={`relative overflow-hidden rounded-lg sm:rounded-xl p-3 sm:p-4 ${isNightTheme ? 'bg-gray-800/50' : 'bg-white'} backdrop-blur-xl shadow-lg border ${isNightTheme ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex-shrink-0">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium ${isNightTheme ? 'text-gray-400' : 'text-gray-600'}`}>Cilj</p>
              <p className={`text-lg sm:text-xl font-bold ${isNightTheme ? 'text-white' : 'text-gray-900'} truncate`}>300</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className={`text-xs ${isNightTheme ? 'text-gray-500' : 'text-gray-500'}`}>Cilj za 4 ture</p>
              <p className={`text-xs ${isNightTheme ? 'text-gray-500' : 'text-gray-500'}`}>je 300</p>
            </div>
          </div>
        </motion.div>
        {/* Potrebno do cilja */}
        <motion.div className={`relative overflow-hidden rounded-lg sm:rounded-xl p-3 sm:p-4 ${isNightTheme ? 'bg-gray-800/50' : 'bg-white'} backdrop-blur-xl shadow-lg border ${isNightTheme ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-gradient-to-br ${faliDoCilja > 0 ? 'from-red-500 to-orange-500' : 'from-green-500 to-emerald-500'} flex-shrink-0`}>
              <AlertCircle className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium ${isNightTheme ? 'text-gray-400' : 'text-gray-600'}`}>Potrebno do cilja</p>
              <p className={`text-lg sm:text-xl font-bold ${faliDoCilja > 0 ? 'text-red-600' : 'text-green-600'} truncate`}>
                {faliDoCilja > 0 ? `-${faliDoCilja}` : faliDoCilja < 0 ? `+${Math.abs(faliDoCilja)}` : 0}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className={`text-xs ${isNightTheme ? 'text-gray-500' : 'text-gray-500'}`}>{faliDoCilja > 0 ? 'štopovi' : 'štopovi'}</p>
              <p className={`text-xs ${isNightTheme ? 'text-gray-500' : 'text-gray-500'}`}>{faliDoCilja > 0 ? 'u minusu' : 'u plusu'}</p>
            </div>
          </div>
        </motion.div>
        {/* Uspješnost */}
        <motion.div className={`relative overflow-hidden rounded-lg sm:rounded-xl p-3 sm:p-4 ${isNightTheme ? 'bg-gray-800/50' : 'bg-white'} backdrop-blur-xl shadow-lg border ${isNightTheme ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex-shrink-0">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium ${isNightTheme ? 'text-gray-400' : 'text-gray-600'}`}>Uspješnost</p>
              <p className={`text-lg sm:text-xl font-bold ${isNightTheme ? 'text-white' : 'text-gray-900'} truncate`}>{procenatRealizacije}%</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className={`text-xs ${isNightTheme ? 'text-gray-500' : 'text-gray-500'}`}>Uspjeh</p>
              <p className={`text-xs ${isNightTheme ? 'text-gray-500' : 'text-gray-500'}`}>u postotku</p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  } else if (timeRange === 'month') {
    const monthlyGoal = monthlyWorkDays * 300;
    const monthlyMissing = monthlyGoal - monthlyStops;
    const monthlySuccess = monthlyGoal > 0 ? ((monthlyStops / monthlyGoal) * 100).toFixed(2) : 0;

    prikaz = (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Stops mjesec */}
        <motion.div className={`relative overflow-hidden rounded-lg sm:rounded-xl p-3 sm:p-4 ${isNightTheme ? 'bg-gray-800/50' : 'bg-white'} backdrop-blur-xl shadow-lg border ${isNightTheme ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex-shrink-0">
              <Target className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium ${isNightTheme ? 'text-gray-400' : 'text-gray-600'}`}>Stops</p>
              <p className={`text-lg sm:text-xl font-bold ${isNightTheme ? 'text-white' : 'text-gray-900'} truncate`}>{monthlyStops}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className={`text-xs ${isNightTheme ? 'text-gray-500' : 'text-gray-500'}`}>Zbir stopova</p>
              <p className={`text-xs font-semibold ${isNightTheme ? 'text-blue-400' : 'text-blue-600'}`}>
                {(() => {
                  const meseci = ['Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun', 'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'];
                  return meseci[new Date().getMonth()];
                })()}
              </p>
            </div>
          </div>
        </motion.div>
        {/* Cilj mjesec */}
        <motion.div className={`relative overflow-hidden rounded-lg sm:rounded-xl p-3 sm:p-4 ${isNightTheme ? 'bg-gray-800/50' : 'bg-white'} backdrop-blur-xl shadow-lg border ${isNightTheme ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex-shrink-0">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium ${isNightTheme ? 'text-gray-400' : 'text-gray-600'}`}>Cilj</p>
              <p className={`text-lg sm:text-xl font-bold ${isNightTheme ? 'text-white' : 'text-gray-900'} truncate`}>{monthlyGoal}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className={`text-xs ${isNightTheme ? 'text-gray-500' : 'text-gray-500'}`}>{monthlyWorkDays} dana</p>
              <p className={`text-xs ${isNightTheme ? 'text-gray-500' : 'text-gray-500'}`}>× 300</p>
            </div>
          </div>
        </motion.div>
        {/* Potrebno do cilja mjesec */}
        <motion.div className={`relative overflow-hidden rounded-lg sm:rounded-xl p-3 sm:p-4 ${isNightTheme ? 'bg-gray-800/50' : 'bg-white'} backdrop-blur-xl shadow-lg border ${isNightTheme ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-gradient-to-br ${monthlyMissing > 0 ? 'from-red-500 to-orange-500' : 'from-green-500 to-emerald-500'} flex-shrink-0`}>
              <AlertCircle className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium ${isNightTheme ? 'text-gray-400' : 'text-gray-600'}`}>Potrebno do cilja</p>
              <p className={`text-lg sm:text-xl font-bold ${monthlyMissing > 0 ? 'text-red-600' : 'text-green-600'} truncate`}>
                {monthlyMissing > 0 ? `-${monthlyMissing}` : monthlyMissing < 0 ? `+${Math.abs(monthlyMissing)}` : 0}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className={`text-xs ${isNightTheme ? 'text-gray-500' : 'text-gray-500'}`}>{monthlyMissing > 0 ? 'štopovi' : 'štopovi'}</p>
              <p className={`text-xs ${isNightTheme ? 'text-gray-500' : 'text-gray-500'}`}>{monthlyMissing > 0 ? 'u minusu' : 'u plusu'}</p>
            </div>
          </div>
        </motion.div>
        {/* Uspješnost mjesec */}
        <motion.div className={`relative overflow-hidden rounded-lg sm:rounded-xl p-3 sm:p-4 ${isNightTheme ? 'bg-gray-800/50' : 'bg-white'} backdrop-blur-xl shadow-lg border ${isNightTheme ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex-shrink-0">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium ${isNightTheme ? 'text-gray-400' : 'text-gray-600'}`}>Uspješnost</p>
              <p className={`text-lg sm:text-xl font-bold ${isNightTheme ? 'text-white' : 'text-gray-900'} truncate`}>{monthlySuccess}%</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className={`text-xs ${isNightTheme ? 'text-gray-500' : 'text-gray-500'}`}>Uspjeh</p>
              <p className={`text-xs ${isNightTheme ? 'text-gray-500' : 'text-gray-500'}`}>u postotku</p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  } else if (timeRange === 'year') {
    const yearlyGoal = yearlyWorkDays * 300;
    const yearlyMissing = yearlyGoal - yearlyStops;
    const yearlySuccess = yearlyGoal > 0 ? ((yearlyStops / yearlyGoal) * 100).toFixed(2) : 0;

    prikaz = (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Stops godina */}
        <motion.div className={`relative overflow-hidden rounded-lg sm:rounded-xl p-3 sm:p-4 ${isNightTheme ? 'bg-gray-800/50' : 'bg-white'} backdrop-blur-xl shadow-lg border ${isNightTheme ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0">
              <Target className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium ${isNightTheme ? 'text-gray-400' : 'text-gray-600'}`}>Stops</p>
              <p className={`text-lg sm:text-xl font-bold ${isNightTheme ? 'text-white' : 'text-gray-900'} truncate`}>{yearlyStops}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className={`text-xs ${isNightTheme ? 'text-gray-500' : 'text-gray-500'}`}>Zbir stopova</p>
              <p className={`text-xs font-semibold ${isNightTheme ? 'text-blue-400' : 'text-blue-600'}`}>{new Date().getFullYear()}. godina</p>
            </div>
          </div>
        </motion.div>
        {/* Cilj godina */}
        <motion.div className={`relative overflow-hidden rounded-lg sm:rounded-xl p-3 sm:p-4 ${isNightTheme ? 'bg-gray-800/50' : 'bg-white'} backdrop-blur-xl shadow-lg border ${isNightTheme ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex-shrink-0">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium ${isNightTheme ? 'text-gray-400' : 'text-gray-600'}`}>Cilj</p>
              <p className={`text-lg sm:text-xl font-bold ${isNightTheme ? 'text-white' : 'text-gray-900'} truncate`}>{yearlyGoal}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className={`text-xs ${isNightTheme ? 'text-gray-500' : 'text-gray-500'}`}>{yearlyWorkDays} dana</p>
              <p className={`text-xs ${isNightTheme ? 'text-gray-500' : 'text-gray-500'}`}>× 300</p>
            </div>
          </div>
        </motion.div>
        {/* Potrebno do cilja godina */}
        <motion.div className={`relative overflow-hidden rounded-lg sm:rounded-xl p-3 sm:p-4 ${isNightTheme ? 'bg-gray-800/50' : 'bg-white'} backdrop-blur-xl shadow-lg border ${isNightTheme ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-gradient-to-br ${yearlyMissing > 0 ? 'from-red-500 to-orange-500' : 'from-green-500 to-emerald-500'} flex-shrink-0`}>
              <AlertCircle className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium ${isNightTheme ? 'text-gray-400' : 'text-gray-600'}`}>Potrebno do cilja</p>
              <p className={`text-lg sm:text-xl font-bold ${yearlyMissing > 0 ? 'text-red-600' : 'text-green-600'} truncate`}>
                {yearlyMissing > 0 ? `-${yearlyMissing}` : yearlyMissing < 0 ? `+${Math.abs(yearlyMissing)}` : 0}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className={`text-xs ${isNightTheme ? 'text-gray-500' : 'text-gray-500'}`}>{yearlyMissing > 0 ? 'štopovi' : 'štopovi'}</p>
              <p className={`text-xs ${isNightTheme ? 'text-gray-500' : 'text-gray-500'}`}>{yearlyMissing > 0 ? 'u minusu' : 'u plusu'}</p>
            </div>
          </div>
        </motion.div>
        {/* Uspješnost godina */}
        <motion.div className={`relative overflow-hidden rounded-lg sm:rounded-xl p-3 sm:p-4 ${isNightTheme ? 'bg-gray-800/50' : 'bg-white'} backdrop-blur-xl shadow-lg border ${isNightTheme ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex-shrink-0">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium ${isNightTheme ? 'text-gray-400' : 'text-gray-600'}`}>Uspješnost</p>
              <p className={`text-lg sm:text-xl font-bold ${isNightTheme ? 'text-white' : 'text-gray-900'} truncate`}>{yearlySuccess}%</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className={`text-xs ${isNightTheme ? 'text-gray-500' : 'text-gray-500'}`}>Uspjeh</p>
              <p className={`text-xs ${isNightTheme ? 'text-gray-500' : 'text-gray-500'}`}>u postotku</p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  } else {
    prikaz = (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`relative overflow-hidden rounded-2xl p-6 ${isNightTheme ? 'bg-gray-800/50' : 'bg-white'} backdrop-blur-xl shadow-xl border ${isNightTheme ? 'border-gray-700' : 'border-gray-100'}`}
          >
            {/* Background Gradient */}
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.gradient} opacity-10 rounded-full blur-2xl`} />
            {/* Icon */}
            <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${stat.gradient} mb-4`}>
              <stat.icon className="w-6 h-6 text-white" />
            </div>
            {/* Content */}
            <div className="relative">
              <p className={`text-sm font-medium ${isNightTheme ? 'text-gray-400' : 'text-gray-600'}`}>{stat.title}</p>
              <p className={`text-3xl font-bold mt-2 ${isNightTheme ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
              {stat.showSubtitle && (
                <p className={`text-xs mt-2 ${isNightTheme ? 'text-gray-500' : 'text-gray-500'}`}>{stat.subtitle}</p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Time Range Filter */}
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
            <h2 className={`text-xl sm:text-2xl font-bold ${isNightTheme ? 'text-white' : 'text-gray-800'}`}>
              Dashboard Pregled
            </h2>
            <p className={`text-xs sm:text-sm ${isNightTheme ? 'text-gray-400' : 'text-gray-600'}`}>
              {data?.latestDate ? `Zadnje ažurirano: ${new Date(data.latestDate).toLocaleDateString('bs-BA')}` : 'Pregled statistika'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Quick Time Range Buttons */}
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
                {range === 'today' ? 'Danas' : range === 'month' ? 'Mjesec' : 'Godina'}
              </motion.button>
            ))}
          </div>

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
      </motion.div>

      {prikaz}
    </div>
  );
};

export default DashboardOverview;
