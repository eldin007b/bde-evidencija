import { useState, useEffect, useCallback } from 'react';
import { getDeviceApprovals, blockDevice } from '../db/supabaseClient';

export default function useDeviceApprovals() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getDeviceApprovals();
      setDevices(result || []);
    } catch (e) {
      setError(e);
      setDevices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  // Blokiraj uređaj
  const blockDeviceCloud = async (device_id) => {
    setLoading(true);
    try {
      await blockDevice(device_id);
      await fetchDevices();
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  return {
    devices,
    loading,
    error,
    refresh: fetchDevices,
    blockDevice: blockDeviceCloud,
  };
}
