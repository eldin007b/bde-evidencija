// src/hooks/queries/useDriversQuery.js
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryKeys, queryClient } from '../../lib/queryClient';
import { supabase } from '../../db/supabaseClient';

/**
 * 🚗 Smart hook za drivers sa React Query caching
 */
export function useDriversQuery(options = {}) {
  return useQuery({
    queryKey: queryKeys.drivers.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .order('tura', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 min - drivers se rijetko mijenjaju
    ...options,
  });
}

/**
 * Active drivers only
 */
export function useActiveDriversQuery(options = {}) {
  return useQuery({
    queryKey: queryKeys.drivers.active(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('aktivan', true)
        .order('tura', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
    ...options,
  });
}

/**
 * Single driver by tura
 */
export function useDriverByTuraQuery(tura, options = {}) {
  return useQuery({
    queryKey: queryKeys.drivers.byTura(tura),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('tura', tura)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!tura,
    staleTime: 10 * 60 * 1000,
    ...options,
  });
}

/**
 * Update driver mutation sa optimistic update
 */
export function useUpdateDriverMutation() {
  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('drivers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.drivers.all });
      
      // Snapshot previous value
      const previousDrivers = queryClient.getQueryData(queryKeys.drivers.all);
      
      // Optimistically update
      queryClient.setQueryData(queryKeys.drivers.all, (old) => {
        if (!old) return old;
        return old.map((driver) =>
          driver.id === id ? { ...driver, ...updates } : driver
        );
      });
      
      return { previousDrivers };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousDrivers) {
        queryClient.setQueryData(queryKeys.drivers.all, context.previousDrivers);
      }
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: queryKeys.drivers.all });
    },
  });
}
