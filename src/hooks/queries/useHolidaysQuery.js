// src/hooks/queries/useHolidaysQuery.js
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryKeys, queryClient } from '../../lib/queryClient';
import { getAllHolidaysCloud } from '../../db/supabaseClient';
import { supabase } from '../../db/supabaseClient';

/**
 * 🎉 Smart hook za holidays sa React Query caching
 */
export function useHolidaysQuery(year, options = {}) {
  return useQuery({
    queryKey: queryKeys.holidays.byYear(year),
    queryFn: () => getAllHolidaysCloud(year),
    staleTime: 30 * 60 * 1000, // 30 min - holidays se rijetko mijenjaju
    enabled: year !== undefined,
    ...options,
  });
}

/**
 * All holidays (multi-year)
 */
export function useAllHolidaysQuery(options = {}) {
  return useQuery({
    queryKey: queryKeys.holidays.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('holidays')
        .select('*')
        .order('date', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 30 * 60 * 1000,
    ...options,
  });
}

/**
 * Add holiday mutation
 */
export function useAddHolidayMutation() {
  return useMutation({
    mutationFn: async (holidayData) => {
      const { data, error } = await supabase
        .from('holidays')
        .insert([holidayData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      const year = new Date(data.date).getFullYear();
      queryClient.invalidateQueries({ queryKey: queryKeys.holidays.byYear(year) });
      queryClient.invalidateQueries({ queryKey: queryKeys.holidays.all });
    },
  });
}

/**
 * Delete holiday mutation
 */
export function useDeleteHolidayMutation() {
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('holidays')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.holidays.all });
    },
  });
}
