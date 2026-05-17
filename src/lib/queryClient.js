// src/lib/queryClient.js
import { QueryClient } from '@tanstack/react-query';

/**
 * Simple localStorage persister for React Query cache
 * Čuva cache između browser sesija za bolje performanse
 */
const createPersister = () => {
  return {
    persistClient: (client) => {
      try {
        const clientState = {
          timestamp: Date.now(),
          clientState: JSON.stringify({
            queries: client.getQueryCache().getAll()
              .filter(query => {
                // Persist samo important queries, ne sve
                const key = query.queryKey[0];
                return ['drivers', 'holidays'].includes(key);
              })
              .map(query => ({
                queryKey: query.queryKey,
                state: query.state,
              })),
          }),
        };
        localStorage.setItem('bde_query_cache', JSON.stringify(clientState));
      } catch (error) {
        console.warn('Failed to persist query cache:', error);
      }
    },
    
    restoreClient: () => {
      try {
        const stored = localStorage.getItem('bde_query_cache');
        if (!stored) return;
        
        const { timestamp, clientState } = JSON.parse(stored);
        const maxAge = 24 * 60 * 60 * 1000; // 24h max age
        
        if (Date.now() - timestamp > maxAge) {
          localStorage.removeItem('bde_query_cache');
          return;
        }
        
        return JSON.parse(clientState);
      } catch (error) {
        console.warn('Failed to restore query cache:', error);
        localStorage.removeItem('bde_query_cache');
      }
    },
    
    removeClient: () => {
      localStorage.removeItem('bde_query_cache');
    },
  };
};

const persister = createPersister();

/**
 * Smart cache strategy based on work schedule
 * Podatci se dodaju radnim danima 02:00-08:00, tako da prilagođavamo cache
 */
const getSmartStaleTime = () => {
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay(); // 0 = nedjelja, 1-5 = radni dani, 6 = subota
  
  let staleTime, reason;
  
  // Ako je radni dan (ponedeljak-petak) i između 02:00-09:00 - kratki cache za fresh podatke
  if (dayOfWeek >= 1 && dayOfWeek <= 5 && hour >= 2 && hour <= 9) {
    staleTime = 5 * 60 * 1000; // 5 minuta - frequent refresh kad se dodaju novi podatci
    reason = "radni sat (dodaju se novi podaci)";
  }
  // Ako je radni dan ali posle 09:00 - srednji cache
  else if (dayOfWeek >= 1 && dayOfWeek <= 5 && hour > 9) {
    staleTime = 2 * 60 * 60 * 1000; // 2 sata - podaci se verovatno neće menjati do sutra
    reason = "radni dan posle 09h";
  }
  // Vikend ili noću - dugi cache
  else {
    staleTime = 6 * 60 * 60 * 1000; // 6 sati - vikend/noć, sigurno nema novih podataka
    reason = dayOfWeek === 0 || dayOfWeek === 6 ? "vikend" : "noć";
  }
  
  console.log(`🧠 Smart cache: ${staleTime / 60000} min (${reason})`);
  return staleTime;
};

/**
 * 🚀 Global React Query Client Configuration  
 * Optimized za BDE Evidencija app sa smart work-schedule caching strategijama
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Smart caching strategy - prilagođava se radnom vremenu
      staleTime: getSmartStaleTime(), // Dinamički cache na osnovu vremena
      cacheTime: 4 * 60 * 60 * 1000, // 4 sata - garbage collection
      
      // Refetch strategy - pametno refreshovanje  
      refetchOnWindowFocus: () => {
        // Refresh samo u radnim satima kad su mogući novi podaci
        const hour = new Date().getHours();
        const dayOfWeek = new Date().getDay();
        return dayOfWeek >= 1 && dayOfWeek <= 5 && hour >= 2 && hour <= 9;
      },
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

/**
 * Initialize cache persistence
 * Vraća cached podatke iz localStorage kad se app pokrene
 */
try {
  const restoredState = persister.restoreClient();
  if (restoredState?.queries) {
    restoredState.queries.forEach(({ queryKey, state }) => {
      if (state.data) {
        queryClient.setQueryData(queryKey, state.data);
      }
    });
  }
} catch (error) {
  console.warn('Failed to restore query cache on init:', error);
}

// Persist cache kad se promeni
let persistTimeout;
queryClient.getQueryCache().subscribe(() => {
  clearTimeout(persistTimeout);
  persistTimeout = setTimeout(() => {
    persister.persistClient(queryClient);
  }, 1000); // Debounce 1s
});

// Cleanup na page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    persister.persistClient(queryClient);
  });
}
