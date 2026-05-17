// src/hooks/queries/useDeliveriesQuery.js
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryKeys, queryClient } from '../../lib/queryClient';
import { getAllDeliveriesCloud } from '../../db/supabaseClient';
import { supabase } from '../../db/supabaseClient';

/**
 * 📦 Smart hook za deliveries sa React Query caching
 */
export function useDeliveriesQuery(year, month, options = {}) {
  return useQuery({
    queryKey: queryKeys.deliveries.byMonth(year, month),
    queryFn: () => getAllDeliveriesCloud(year, month),
    staleTime: 3 * 60 * 1000, // 3 min - deliveries se češće mijenjaju
    enabled: year !== undefined && month !== undefined,
    ...options,
  });
}

/**
 * 📦 Hook za deliveries za celu godinu (svi meseci)
 */
export function useYearlyDeliveriesQuery(year, options = {}) {
  return useQuery({
    queryKey: queryKeys.deliveries.byYear(year),
    queryFn: async () => {
      // Učitaj podatke za sve mesece u godini
      const allDeliveries = [];
      for (let month = 0; month < 12; month++) {
        try {
          const monthDeliveries = await getAllDeliveriesCloud(year, month);
          allDeliveries.push(...monthDeliveries);
        } catch (error) {
          console.warn(`Failed to load deliveries for ${year}-${month}:`, error);
        }
      }
      return allDeliveries;
    },
    staleTime: 5 * 60 * 1000, // 5 min - godišnji podaci se ređe mijenjaju
    enabled: year !== undefined,
    ...options,
  });
}

/**
 * Deliveries za specific driver
 */
export function useDriverDeliveriesQuery(driver, year, month, options = {}) {
  return useQuery({
    queryKey: queryKeys.deliveries.byDriver(driver, year, month),
    queryFn: async () => {
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);
      const from = startDate.toISOString().split('T')[0];
      const to = endDate.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('deliveries')
        .select('*')
        .eq('driver', driver)
        .gte('date', from)
        .lte('date', to)
        .order('date', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!driver && year !== undefined && month !== undefined,
    staleTime: 3 * 60 * 1000,
    ...options,
  });
}

/**
 * Monthly stats
 */
export function useDeliveryStatsQuery(year, month, options = {}) {
  return useQuery({
    queryKey: queryKeys.deliveries.stats(year, month),
    queryFn: async () => {
      const data = await getAllDeliveriesCloud(year, month);
      
      const stats = {
        totalDeliveries: data.length,
        totalStops: data.reduce((sum, d) => sum + (d.produktivitaet_stops || 0), 0),
        averageStops: 0,
        daysWithData: new Set(data.map(d => d.date)).size,
      };
      
      if (data.length > 0) {
        stats.averageStops = Math.round(stats.totalStops / data.length);
      }
      
      return stats;
    },
    enabled: year !== undefined && month !== undefined,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * Add delivery mutation
 */
export function useAddDeliveryMutation() {
  return useMutation({
    mutationFn: async (deliveryData) => {
      const { data, error } = await supabase
        .from('deliveries')
        .insert([deliveryData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      const date = new Date(data.date);
      const year = date.getFullYear();
      const month = date.getMonth();
      
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.deliveries.byMonth(year, month) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.deliveries.stats(year, month) 
      });
    },
  });
}

/**
 * Update delivery mutation
 */
export function useUpdateDeliveryMutation() {
  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('deliveries')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onMutate: async ({ id, updates }) => {
      // Optimistic update logic
      const date = updates.date ? new Date(updates.date) : new Date();
      const year = date.getFullYear();
      const month = date.getMonth();
      const queryKey = queryKeys.deliveries.byMonth(year, month);
      
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData(queryKey);
      
      queryClient.setQueryData(queryKey, (old) => {
        if (!old) return old;
        return old.map((delivery) =>
          delivery.id === id ? { ...delivery, ...updates } : delivery
        );
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
        const year = date.getFullYear();
        const month = date.getMonth();
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.deliveries.byMonth(year, month) 
        });
      }
    },
  });
}

/**
 * Delete delivery mutation
 */
export function useDeleteDeliveryMutation() {
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('deliveries')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.deliveries.all });
    },
  });
}
