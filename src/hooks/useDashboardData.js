// hooks/useDashboardData.js - Ultra moderni hook za dashboard analitiku
import { useState, useEffect } from 'react';
import { supabase } from '../db/supabaseClient';

export const useDashboardData = (drivers = []) => {
  const [stats, setStats] = useState({
    totalStops: 0,
    dailyStops: 0,
    extraRides: 0,
    pendingRides: 0,
    activeDrivers: 0,
    totalDrivers: 0,
    avgStopsPerDay: 0,
    latestDate: null,
    successRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
      // Helper: calculate yearly target for selected driver
      function getYearlyTarget(driver, year, deliveries) {
        // Broj radnih dana = broj dana kad ima delivery za tog vozača
        const driverDeliveries = deliveries.filter(d => d.tura === driver.tura);
        const workDays = driverDeliveries.length;
        return (driver.target_per_day || 0) * workDays;
      }
    if (!drivers.length) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const monthStart = `${year}-${month}-01`;
      const yearStart = `${year}-01-01`;

      // Paralelno dohvaćanje svih podataka - OPTIMIZIRANO
      const [
        monthlyStopsResult,
        latestDayStopsResult,
        yearlyStopsResult,
        extraRidesResult,
        pendingRidesResult
      ] = await Promise.all([
        // Mjesečni stops
        supabase
          .from('deliveries')
          .select('produktivitaet_stops')
          .gte('date', monthStart)
          .eq('deleted', 0)
          .not('produktivitaet_stops', 'is', null),

        // Najnoviji dostupni dan
        supabase
          .from('deliveries')
          .select('produktivitaet_stops, date')
          .eq('deleted', 0)
          .not('produktivitaet_stops', 'is', null)
          .order('date', { ascending: false })
          .limit(20),

        // Godišnji stops
        supabase
          .from('deliveries')
          .select('produktivitaet_stops, tura, probleme_druga, date')
          .gte('date', yearStart)
          .eq('deleted', 0)
          .not('produktivitaet_stops', 'is', null),

        // Extra vožnje
        supabase.from('extra_rides').select('id', { count: 'exact' }),

        // Pending vožnje
        supabase.from('extra_rides_pending').select('id', { count: 'exact' })
      ]);

      // KALKULACIJE - Optimizovano
      const monthlyStops = monthlyStopsResult.data?.reduce((sum, delivery) =>
        sum + (delivery.produktivitaet_stops || 0), 0
      ) || 0;

      // Najnoviji dan logika
      let dailyStops = 0;
      let latestDate = null;

      if (latestDayStopsResult.data?.length > 0) {
        const groupedByDate = latestDayStopsResult.data.reduce((acc, delivery) => {
          const date = delivery.date;
          if (!acc[date]) acc[date] = [];
          acc[date].push(delivery);
          return acc;
        }, {});

        const latestDateKey = Object.keys(groupedByDate)
          .sort((a, b) => new Date(b) - new Date(a))[0];

        if (latestDateKey) {
          latestDate = latestDateKey;
          dailyStops = groupedByDate[latestDateKey].reduce((sum, delivery) =>
            sum + (delivery.produktivitaet_stops || 0), 0
          );
        }
      }

      // Godišnji stops po vozaču
      let yearlyStops = 0;
      let yearlyComplaints = 0;
      let yearlyTarget = 0;
      if (drivers && drivers.length > 0) {
        // Za svakog vozača iz drivers
        drivers.forEach(driver => {
          const driverDeliveries = yearlyStopsResult.data?.filter(d => d.tura === driver.tura) || [];
          yearlyStops += driverDeliveries.reduce((sum, delivery) => sum + (delivery.produktivitaet_stops || 0), 0);
          yearlyComplaints += driverDeliveries.reduce((sum, delivery) => sum + (delivery.probleme_druga || 0), 0);
          yearlyTarget += (driver.target_per_day || 0) * driverDeliveries.length;
        });
      }

      // Vozači analitika
      const activeDrivers = drivers.filter(driver => driver.aktivan).length;
      const totalDrivers = drivers.length;

      // Prosječni stops per dan
      const daysInMonth = today.getDate();
      const avgStopsPerDay = daysInMonth > 0 ? Math.round(monthlyStops / daysInMonth) : 0;

      // Success rate kalkulacija
      const totalExtraRides = extraRidesResult.count || 0;
      const pendingRides = pendingRidesResult.count || 0;
      const successRate = (totalExtraRides + pendingRides) > 0 ?
        ((totalExtraRides / (totalExtraRides + pendingRides)) * 100) : 0;

      // 6-element array for StatistikaScreen and SidebarModern
      const statsArray = [
        { label: 'Danas', value: dailyStops, trend: dailyStops > 0 ? 'up' : 'neutral' },
        { label: 'Reklamacije', value: '0', trend: 'neutral' }, // TODO: Complaints
        { label: 'Ovaj mjesec', value: monthlyStops, trend: monthlyStops > 0 ? 'up' : 'neutral' },
        { label: 'Reklamacije', value: '0', trend: 'neutral' }, // TODO: Complaints
        { 
          label: 'Ova godina', 
          value: yearlyStops - yearlyTarget, // prikazuje razliku od cilja
          trend: (yearlyStops - yearlyTarget) > 0 ? 'up' : (yearlyStops - yearlyTarget) < 0 ? 'down' : 'neutral'
        },
        { 
          label: 'Reklamacije', 
          value: yearlyComplaints, 
          trend: yearlyComplaints === 0 ? 'up' : 'down' 
        }
      ];

      setStats({
  totalStops: monthlyStops,
  dailyStops,
  yearlyStops,
  yearlyStopsResult, // Dodaj raw podatke za godinu
  extraRides: totalExtraRides,
  pendingRides,
  activeDrivers,
  totalDrivers,
  avgStopsPerDay,
  latestDate,
  successRate: parseFloat(successRate.toFixed(1)),
  statsArray
      });

    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [drivers]);

  // Nova funkcija: zbir stopova za odabrani dan
  const getStopsForDate = async (date) => {
    try {
      const result = await supabase
        .from('deliveries')
        .select('produktivitaet_stops')
        .eq('date', date)
        .eq('deleted', 0)
        .not('produktivitaet_stops', 'is', null);
      return result.data?.reduce((sum, delivery) => sum + (delivery.produktivitaet_stops || 0), 0) || 0;
    } catch (err) {
      console.error('Greška pri dohvaćanju stopova za dan:', err);
      return 0;
    }
  };

  return {
    stats,
    loading,
    error,
    refetch: fetchDashboardData,
    getStopsForDate
  };
};