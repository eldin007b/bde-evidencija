// Utility for deliveries grouping and simple aggregations
export function groupDeliveries(deliveries = []) {
  // normalized to { 'yyyy-MM-dd': { driverKey: value, ... }, ... }
  const grouped = {};
  deliveries.forEach(delivery => {
    // Delivery may reference driver by different keys; prefer explicit driver key or tura
    const date = delivery?.date;
    if (!date) return;
    const driverKey = delivery.driver ?? delivery.tura ?? delivery.driver_id ?? delivery.driverId;
    if (!grouped[date]) grouped[date] = {};
    const value = Number(delivery.produktivitaet_stops || 0);
    grouped[date][driverKey] = (grouped[date][driverKey] || 0) + value;
  });
  return grouped;
}

export default {
  groupDeliveries
};
