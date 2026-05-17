import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../db/supabaseClient';

export default function useRidesApproval() {
  const [pendingRides, setPendingRides] = useState([]);
  const [approvedRides, setApprovedRides] = useState([]);
  const [rejectedRides, setRejectedRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPendingRides = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('rides_approval')
        .select('*')
        .eq('status', 'pending');
      if (error) throw error;
      setPendingRides(data || []);
    } catch (e) {
      setError(e);
      setPendingRides([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchApprovedRides = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('rides_approval')
        .select('*')
        .eq('status', 'approved');
      if (error) throw error;
      setApprovedRides(data || []);
    } catch (e) {
      setError(e);
      setApprovedRides([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const approveRide = useCallback(async (rideId) => {
    try {
      const { error } = await supabase
        .from('rides_approval')
        .update({ status: 'approved', approved_at: new Date() })
        .eq('id', rideId);
      if (error) throw error;
      await fetchPendingRides();
      await fetchApprovedRides();
    } catch (e) {
      setError(e);
      throw e;
    }
  }, [fetchPendingRides, fetchApprovedRides]);

  const rejectRide = useCallback(async (rideId, reason = null) => {
    try {
      const { error } = await supabase
        .from('rides_approval')
        .update({ 
          status: 'rejected', 
          rejected_at: new Date(),
          rejection_reason: reason 
        })
        .eq('id', rideId);
      if (error) throw error;
      await fetchPendingRides();
    } catch (e) {
      setError(e);
      throw e;
    }
  }, [fetchPendingRides]);

  useEffect(() => {
    fetchPendingRides();
    fetchApprovedRides();
  }, [fetchPendingRides, fetchApprovedRides]);

  return {
    pendingRides,
    approvedRides,
    rejectedRides,
    loading,
    error,
    fetchPendingRides,
    fetchApprovedRides,
    approveRide,
    rejectRide,
    refresh: fetchPendingRides,
  };
}
