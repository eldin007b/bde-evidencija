// src/lib/queryClient.js
import { QueryClient } from '@tanstack/react-query';

/**
 * 🚀 Global React Query Client Configuration
 * Optimized za BDE Evidencija app sa smart caching strategijama
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Caching strategy
      staleTime: 5 * 60 * 1000, // 5 minuta - data se smatra fresh
      cacheTime: 10 * 60 * 1000, // 10 minuta - garbage collection
      
      // Refetch strategy
      refetchOnWindowFocus: true, // Refresh kad korisnik vrati tab
      refetchOnReconnect: true, // Refresh nakon reconnect
      refetchOnMount: false, // Ne refetch ako ima cached data
      
      // Retry strategy
      retry: 2, // Retry 2x ako fail
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Performance
      suspense: false,
      useErrorBoundary: false,
      
      // Network mode
      networkMode: 'online', // Only fetch kad online
    },
    mutations: {
      // Optimistic updates enabled
      retry: 1,
      networkMode: 'online',
    },
  },
});

/**
 * Query Keys Factory
 * Centralizovani način definisanja query keys
 */
export const queryKeys = {
  // Drivers
  drivers: {
    all: ['drivers'],
    active: () => [...queryKeys.drivers.all, 'active'],
    byTura: (tura) => [...queryKeys.drivers.all, 'tura', tura],
    byId: (id) => [...queryKeys.drivers.all, 'id', id],
  },
  
  // Deliveries
  deliveries: {
    all: ['deliveries'],
    byMonth: (year, month) => [...queryKeys.deliveries.all, 'month', year, month],
    byYear: (year) => [...queryKeys.deliveries.all, 'year', year],
    byDriver: (driver, year, month) => [...queryKeys.deliveries.all, 'driver', driver, year, month],
    stats: (year, month) => [...queryKeys.deliveries.all, 'stats', year, month],
  },
  
  // Holidays
  holidays: {
    all: ['holidays'],
    byYear: (year) => [...queryKeys.holidays.all, 'year', year],
  },
  
  // Extra Rides
  extraRides: {
    all: ['extraRides'],
    byMonth: (year, month) => [...queryKeys.extraRides.all, 'month', year, month],
    byDriver: (driver) => [...queryKeys.extraRides.all, 'driver', driver],
    pending: () => [...queryKeys.extraRides.all, 'pending'],
    approved: () => [...queryKeys.extraRides.all, 'approved'],
    stats: (year, month) => [...queryKeys.extraRides.all, 'stats', year, month],
  },
  
  // Driver Stats
  driverStats: {
    all: ['driverStats'],
    byDriver: (driver, year, month) => [...queryKeys.driverStats.all, driver, year, month],
    monthly: (year, month) => [...queryKeys.driverStats.all, 'monthly', year, month],
  },
  
  // Sync Status
  sync: {
    status: ['sync', 'status'],
    lastSync: ['sync', 'lastSync'],
  },
  
  // User
  user: {
    current: ['user', 'current'],
    preferences: ['user', 'preferences'],
  },
};

/**
 * Cache invalidation helpers
 */
export const invalidateQueries = {
  drivers: () => queryClient.invalidateQueries({ queryKey: queryKeys.drivers.all }),
  deliveries: () => queryClient.invalidateQueries({ queryKey: queryKeys.deliveries.all }),
  holidays: () => queryClient.invalidateQueries({ queryKey: queryKeys.holidays.all }),
  extraRides: () => queryClient.invalidateQueries({ queryKey: queryKeys.extraRides.all }),
  driverStats: () => queryClient.invalidateQueries({ queryKey: queryKeys.driverStats.all }),
  all: () => queryClient.invalidateQueries(),
};

/**
 * Prefetch helpers - za preload podataka prije nego korisnik otvori ekran
 */
export const prefetchQueries = {
  drivers: async () => {
    const { getAllDriversCloud } = await import('../db/supabaseClient');
    await queryClient.prefetchQuery({
      queryKey: queryKeys.drivers.all,
      queryFn: getAllDriversCloud,
    });
  },
  
  deliveries: async (year, month) => {
    const { getAllDeliveriesCloud } = await import('../db/supabaseClient');
    await queryClient.prefetchQuery({
      queryKey: queryKeys.deliveries.byMonth(year, month),
      queryFn: () => getAllDeliveriesCloud(year, month),
    });
  },
  
  holidays: async (year) => {
    const { getAllHolidaysCloud } = await import('../db/supabaseClient');
    await queryClient.prefetchQuery({
      queryKey: queryKeys.holidays.byYear(year),
      queryFn: () => getAllHolidaysCloud(year),
    });
  },
};

/**
 * Optimistic update helpers
 */
export const optimisticUpdates = {
  updateDriver: (driverId, newData) => {
    queryClient.setQueryData(queryKeys.drivers.all, (old) => {
      if (!old) return old;
      return old.map((driver) =>
        driver.id === driverId ? { ...driver, ...newData } : driver
      );
    });
  },
  
  addExtraRide: (newRide) => {
    queryClient.setQueryData(queryKeys.extraRides.all, (old) => {
      if (!old) return [newRide];
      return [newRide, ...old];
    });
  },
  
  removeExtraRide: (rideId) => {
    queryClient.setQueryData(queryKeys.extraRides.all, (old) => {
      if (!old) return old;
      return old.filter((ride) => ride.id !== rideId);
    });
  },
};
