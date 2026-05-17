import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../db/supabaseClient';
import driversSync from '../services/driversSync';
import { invalidateQueries } from '../lib/queryClient';

/**
 * useDrivers Hook - Business layer koji koristi drivers tabelu  
 * Fokus na: targets, performance, business logic, admin management
 */
export default function useDrivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const notifyDriversUpdated = useCallback(() => {
    try {
      if (typeof window !== 'undefined' && window?.dispatchEvent) {
        window.dispatchEvent(new Event('drivers-updated'));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('deleted', 0)
        .order('target_per_day', { ascending: false }) // Najveći target prvi
        .order('tura');
      
      if (error) {
        throw error;
      }
      
      // Business data from drivers table
      const driversData = data?.map(driver => ({
        // Primary business fields
        id: driver.id,
        tura: driver.tura,
        ime: driver.ime,
        target_per_day: driver.target_per_day || 0,
        aktivan: driver.aktivan,
        
        // Secondary fields  
        role: driver.role || 'driver',
        password_hash: driver.password_hash || '',
        last_login: driver.last_login,
        last_updated: driver.last_updated,
        deleted: driver.deleted || 0,
        
        // Compatibility fields (deprecated)
        name: driver.ime,
        tour: driver.tura,
        active: driver.aktivan
      })) || [];

      // Sortiraj po turi numerički za konzistentan redoslijed
      driversData.sort((a, b) => {
        const ta = String(a.tura || '');
        const tb = String(b.tura || '');
        return ta.localeCompare(tb, undefined, { numeric: true });
      });

      setDrivers(driversData);
  console.log('useDrivers: drivers loaded', { count: driversData.length });
    } catch (err) {
      setError(err);
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Admin function - Add new driver business record
  const addDriver = useCallback(async (driverData) => {
    try {
      const newDriver = {
        ime: driverData.ime,
        tura: driverData.tura,
        aktivan: driverData.aktivan ?? true,
        target_per_day: driverData.target_per_day || 0,
        password_hash: driverData.password_hash || null,
        role: driverData.role || 'driver',
        last_updated: new Date(),
        deleted: 0
      };

      const { data, error } = await supabase
        .from('drivers')
        .insert([newDriver])
        .select();
        
      if (error) throw error;

      // Sync back to app_users if needed
      await driversSync.syncDriverToUser(driverData.tura, {
        ime: driverData.ime,
        role: driverData.role,
        aktivan: driverData.aktivan
      });

      try {
        invalidateQueries.drivers();
      } catch (e) {
        // ignore cache invalidation errors
      }

      notifyDriversUpdated();

      await fetchDrivers(); // Refresh lista
      return data[0];
    } catch (err) {
      setError(err);
      throw err;
    }
  }, [fetchDrivers]);

  // Admin function - Update driver business data
  const updateDriver = useCallback(async (id, driverData) => {
    try {
      const updates = {
        ime: driverData.ime,
        tura: driverData.tura,
        aktivan: driverData.aktivan,
        target_per_day: driverData.target_per_day || 0,
        password_hash: driverData.password_hash,
        role: driverData.role || 'driver',
        last_updated: new Date()
      };

      const { data, error } = await supabase
        .from('drivers')
        .update(updates)
        .eq('id', id)
        .select();
        
      if (error) throw error;

      // Sync important changes back to app_users
      if (data && data.length > 0) {
        await driversSync.syncDriverToUser(data[0].tura, {
          ime: driverData.ime,
          role: driverData.role,
          aktivan: driverData.aktivan
        });
      }

      try {
        invalidateQueries.drivers();
      } catch (e) {
        // ignore cache invalidation errors
      }

      notifyDriversUpdated();

      await fetchDrivers(); // Refresh lista
      return data[0];
    } catch (err) {
      setError(err);
      throw err;
    }
  }, [fetchDrivers]);

  // Admin function - Permanent delete driver
  const deleteDriver = useCallback(async (id) => {
    try {
      const { error } = await supabase
        .from('drivers')
        .delete()
        .eq('id', id);
        
      if (error) throw error;

      try {
        invalidateQueries.drivers();
      } catch (e) {
        // ignore cache invalidation errors
      }

      notifyDriversUpdated();

      await fetchDrivers(); // Refresh lista
    } catch (err) {
      setError(err);
      throw err;
    }
  }, [fetchDrivers]);

  // Admin function - Toggle driver business status
  const toggleDriverStatus = useCallback(async (id, aktivan) => {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .update({ 
          aktivan: !aktivan,
          last_updated: new Date()
        })
        .eq('id', id)
        .select();
        
      if (error) throw error;

      // Sync status change back to app_users
      if (data && data.length > 0) {
        await driversSync.syncDriverToUser(data[0].tura, {
          aktivan: !aktivan
        });
      }

      try {
        invalidateQueries.drivers();
      } catch (e) {
        // ignore cache invalidation errors
      }

      notifyDriversUpdated();

      await fetchDrivers(); // Refresh lista
    } catch (err) {
      setError(err);
      throw err;
    }
  }, [fetchDrivers]);

  // Business function - Update driver target
  const updateDriverTarget = useCallback(async (tura, newTarget) => {
    try {
      const { error } = await supabase
        .from('drivers')
        .update({ 
          target_per_day: newTarget,
          last_updated: new Date()
        })
        .eq('tura', tura)
        .eq('deleted', 0);
        
      if (error) throw error;

      try {
        invalidateQueries.drivers();
      } catch (e) {
        // ignore cache invalidation errors
      }

      notifyDriversUpdated();

      await fetchDrivers(); // Refresh lista
      
      return true;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, [fetchDrivers]);

  // Business function - Get driver by tura
  const getDriverByTura = useCallback((tura) => {
    return drivers.find(driver => driver.tura === tura && !driver.deleted);
  }, [drivers]);

  // Business function - Get active drivers only
  const getActiveDrivers = useCallback(() => {
    return drivers.filter(driver => driver.aktivan && !driver.deleted);
  }, [drivers]);

  // Business function - Get drivers with targets
  const getDriversWithTargets = useCallback(() => {
    return drivers.filter(driver => 
      driver.aktivan && 
      !driver.deleted && 
      driver.target_per_day > 0
    );
  }, [drivers]);

  // New: Get all unique active routes
  const availableRoutes = useMemo(() => {
    return Array.from(new Set(
      drivers
        .filter(d => d.aktivan && !d.deleted)
        .map(d => String(d.tura))
    )).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [drivers]);

  // Business function - Calculate Urlaub
  const getDriverUrlaubStats = useCallback(async (tura) => {
    console.log('🔍 [useDrivers] Calculating Urlaub for tura:', tura);
    try {
      // 1. Dohvati SVE postavke da debugujemo
      const { data, error } = await supabase
        .from("urlaub_settings")
        .select("*");

      if (error) {
        console.error('❌ [useDrivers] Error fetching settings:', error);
        return 0;
      }
      
      console.log('📋 [useDrivers] Svi redovi u urlaub_settings:', data);

      // Ručno nađi vozača (bez obzira na tip podataka)
      const settings = data.find(s => String(s.driver).trim() === String(tura).trim());

      if (!settings) {
        console.warn('⚠️ [useDrivers] Vozač nije pronađen u urlaub_settings (traženo:', tura, ')');
        return 0;
      }
      console.log('✅ [useDrivers] Settings found:', settings);

      // 2. Izračunaj zarađene dane
      const { calculateEarnedUrlaub, calculateRemainingUrlaub } = await import("../utils/urlaubUtils");
      const earned = calculateEarnedUrlaub(settings.start_date, settings.start_days);
      console.log('📈 [useDrivers] Earned:', earned);

      // 3. Dohvati iskorištene
      const { data: usedData, error: usedError } = await supabase
        .from("urlaub_marks")
        .select("id")
        .eq("driver", String(tura))
        .eq("is_active", true)
        .gte("date", settings.start_date);
          
      const usedCount = usedError ? 0 : (usedData?.length || 0);
      console.log('📅 [useDrivers] Used:', usedCount);
      
      const remaining = calculateRemainingUrlaub(earned, usedCount);
      console.log('🏁 [useDrivers] Remaining:', remaining);
      
      return remaining;
    } catch (err) {
      console.error('Error fetching urlaub stats:', err);
      return 0;
    }
  }, [supabase]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window?.addEventListener) return;

    const handler = () => {
      fetchDrivers();
    };

    window.addEventListener('drivers-updated', handler);
    return () => window.removeEventListener('drivers-updated', handler);
  }, [fetchDrivers]);

  return { 
    // Data
    drivers, 
    availableRoutes,
    loading, 
    error,
    
    // Admin functions
    addDriver,
    updateDriver,
    deleteDriver,
    toggleDriverStatus,
    
    // Business functions
    updateDriverTarget,
    getDriverByTura,
    getActiveDrivers,
    getDriversWithTargets,
    getDriverUrlaubStats, // DODANO
    
    // Utils
    refresh: fetchDrivers
  };
}
