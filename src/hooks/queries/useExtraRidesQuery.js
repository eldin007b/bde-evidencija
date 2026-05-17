// src/hooks/queries/useExtraRidesQuery.js
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryKeys, queryClient } from '../../lib/queryClient';
import { supabase } from '../../db/supabaseClient';
import { format } from 'date-fns';

/**
 * 🚙 Smart hook za extra rides sa React Query caching
 */
export function useExtraRidesQuery(filterMonth, filterDriver = '', options = {}) {
  return useQuery({
    queryKey: queryKeys.extraRides.byMonth(
      filterMonth?.split('-')[0], 
      filterMonth?.split('-')[1]
    ),
    queryFn: async () => {
      const [year, month] = filterMonth.split('-');
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      const from = format(startDate, 'yyyy-MM-dd');
      const to = format(endDate, 'yyyy-MM-dd');

      // Fetch approved rides
      const { data: approved } = await supabase
        .from('extra_rides')
        .select('*')
        .gte('date', from)
        .lte('date', to)
        .eq('status', 'approved');

      // Fetch pending rides
      const { data: pending } = await supabase
        .from('extra_rides_pending')
        .select('*')
        .gte('date', from)
        .lte('date', to)
        .eq('status', 'pending');

      let allApproved = approved || [];
      let allPending = pending || [];

      // Filter by driver if specified
      if (filterDriver) {
        allApproved = allApproved.filter(r => r.driver === filterDriver);
        allPending = allPending.filter(r => r.driver === filterDriver);
      }

      // Combine and sort
      const all = [
        ...allPending.map(r => ({ ...r, status: 'pending' })),
        ...allApproved.map(r => ({ ...r, status: 'approved' }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date));

      return {
        rides: all,
        pendingCount: allPending.length,
        approvedCount: allApproved.length,
        approvedSum: allApproved.reduce((s, r) => s + (r.cijena || 0), 0),
      };
    },
    enabled: !!filterMonth,
    staleTime: 2 * 60 * 1000, // 2 min - extra rides se često mijenjaju
    ...options,
  });
}

/**
 * Extra rides stats
 */
export function useExtraRidesStatsQuery(year, month, options = {}) {
  return useQuery({
    queryKey: queryKeys.extraRides.stats(year, month),
    queryFn: async () => {
      const filterMonth = `${year}-${String(month + 1).padStart(2, '0')}`;
      const [yr, mn] = filterMonth.split('-');
      const startDate = new Date(parseInt(yr), parseInt(mn) - 1, 1);
      const endDate = new Date(parseInt(yr), parseInt(mn), 0);
      const from = format(startDate, 'yyyy-MM-dd');
      const to = format(endDate, 'yyyy-MM-dd');

      const { data: approved } = await supabase
        .from('extra_rides')
        .select('*')
        .gte('date', from)
        .lte('date', to)
        .eq('status', 'approved');

      const { data: pending } = await supabase
        .from('extra_rides_pending')
        .select('*')
        .gte('date', from)
        .lte('date', to)
        .eq('status', 'pending');

      const allApproved = approved || [];
      const allPending = pending || [];

      return {
        pendingCount: allPending.length,
        approvedCount: allApproved.length,
        totalAmount: allApproved.reduce((sum, r) => sum + (r.cijena || 0), 0),
        avgAmount: allApproved.length > 0 
          ? Math.round(allApproved.reduce((sum, r) => sum + (r.cijena || 0), 0) / allApproved.length)
          : 0,
      };
    },
    enabled: year !== undefined && month !== undefined,
    staleTime: 3 * 60 * 1000,
    ...options,
  });
}

/**
 * Add extra ride mutation
 */
export function useAddExtraRideMutation() {
  return useMutation({
    mutationFn: async (rideData) => {
      const { data, error } = await supabase
        .from('extra_rides_pending')
        .insert([rideData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onMutate: async (newRide) => {
      // Optimistic update
      const queryKey = queryKeys.extraRides.byMonth(
        new Date(newRide.date).getFullYear(),
        new Date(newRide.date).getMonth() + 1
      );
      
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData(queryKey);
      
      queryClient.setQueryData(queryKey, (old) => {
        if (!old) return { rides: [newRide], pendingCount: 1, approvedCount: 0, approvedSum: 0 };
        return {
          ...old,
          rides: [{ ...newRide, status: 'pending' }, ...old.rides],
          pendingCount: old.pendingCount + 1,
        };
      });
      
      return { previousData, queryKey };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }
    },
    onSettled: (data) => {
      if (data) {
        const date = new Date(data.date);
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.extraRides.byMonth(date.getFullYear(), date.getMonth() + 1) 
        });
      }
    },
  });
}

/**
 * Update extra ride mutation
 */
export function useUpdateExtraRideMutation() {
  return useMutation({
    mutationFn: async ({ id, updates, isPending = true }) => {
      const table = isPending ? 'extra_rides_pending' : 'extra_rides';
      const { data, error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.extraRides.all });
    },
  });
}

/**
 * Delete extra ride mutation
 */
export function useDeleteExtraRideMutation() {
  return useMutation({
    mutationFn: async ({ id, isPending = true }) => {
      const table = isPending ? 'extra_rides_pending' : 'extra_rides';
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onMutate: async ({ id }) => {
      // Optimistic removal
      await queryClient.cancelQueries({ queryKey: queryKeys.extraRides.all });
      const previousData = queryClient.getQueryData(queryKeys.extraRides.all);
      
      queryClient.setQueriesData({ queryKey: queryKeys.extraRides.all }, (old) => {
        if (!old) return old;
        return {
          ...old,
          rides: old.rides.filter(r => r.id !== id),
        };
      });
      
      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.extraRides.all, context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.extraRides.all });
    },
  });
}

/**
 * Approve extra ride mutation (move from pending to approved)
 */
export function useApproveExtraRideMutation() {
  return useMutation({
    mutationFn: async (ride) => {
      // Delete from pending
      const { error: deleteError } = await supabase
        .from('extra_rides_pending')
        .delete()
        .eq('id', ride.id);
      
      if (deleteError) throw deleteError;
      
      // Add to approved
      const { data, error: insertError } = await supabase
        .from('extra_rides')
        .insert([{
          driver: ride.driver,
          date: ride.date,
          tura: ride.tura,
          plz: ride.plz,
          broj_adresa: ride.broj_adresa,
          cijena: ride.cijena,
          plz_price: ride.plz_price,
          adresa_price: ride.adresa_price,
        }])
        .select()
        .single();
      
      if (insertError) throw insertError;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.extraRides.all });
    },
  });
}
