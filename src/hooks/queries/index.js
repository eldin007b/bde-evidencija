// src/hooks/queries/index.js
/**
 * 🚀 Centralized Query Hooks Export
 * Smart caching hooks za sve entitete
 */

// Drivers
export {
  useDriversQuery,
  useActiveDriversQuery,
  useDriverByTuraQuery,
  useUpdateDriverMutation,
} from './useDriversQuery';

// Deliveries
export {
  useDeliveriesQuery,
  useYearlyDeliveriesQuery,
  useDriverDeliveriesQuery,
  useDeliveryStatsQuery,
  useAddDeliveryMutation,
  useUpdateDeliveryMutation,
  useDeleteDeliveryMutation,
} from './useDeliveriesQuery';

// Holidays
export {
  useHolidaysQuery,
  useAllHolidaysQuery,
  useAddHolidayMutation,
  useDeleteHolidayMutation,
} from './useHolidaysQuery';

// Extra Rides
export {
  useExtraRidesQuery,
  useExtraRidesStatsQuery,
  useAddExtraRideMutation,
  useUpdateExtraRideMutation,
  useDeleteExtraRideMutation,
  useApproveExtraRideMutation,
} from './useExtraRidesQuery';

// Query Client utilities
export { queryClient, queryKeys, invalidateQueries, prefetchQueries } from '../../lib/queryClient';
