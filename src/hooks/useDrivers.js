import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../db/supabaseClient';
import driversSync from '../services/driversSync';

/**
 * useDrivers Hook - Business layer koji koristi drivers tabelu  
 * Fokus na: targets, performance, business logic, admin management
 */
export default function useDrivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

      // Ensure a consistent, business-desired ordering for common tours
      // Put these specific turas first in this order: 8610, 8620, 8630, 8640
      const priorityOrder = ['8610', '8620', '8630', '8640'];
      driversData.sort((a, b) => {
        const ai = priorityOrder.indexOf(String(a.tura));
        const bi = priorityOrder.indexOf(String(b.tura));
        if (ai !== -1 || bi !== -1) {
          if (ai === -1) return 1; // a not in priority -> after
          if (bi === -1) return -1; // b not in priority -> after
          return ai - bi; // both in priority -> by defined order
        }
        // fallback: numeric compare by tura then by name
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

      await fetchDrivers(); // Refresh lista
      return data[0];
    } catch (err) {
      setError(err);
      throw err;
    }
  }, [fetchDrivers]);

  // Admin function - Soft delete driver
  const deleteDriver = useCallback(async (id) => {
    try {
      const { error } = await supabase
        .from('drivers')
        .update({ 
          deleted: 1,
          last_updated: new Date()
        })
        .eq('id', id);
        
      if (error) throw error;
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

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  return { 
    // Data
    drivers, 
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
    
    // Utils
    refresh: fetchDrivers
  };
}
