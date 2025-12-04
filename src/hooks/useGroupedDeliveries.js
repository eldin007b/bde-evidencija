import { useMemo } from 'react';
import { format } from 'date-fns';
import { groupDeliveries } from '../utils/deliveryUtils';

export default function useGroupedDeliveries(deliveries = [], workdays = [], activeDrivers = []) {
  const groupedData = useMemo(() => groupDeliveries(deliveries), [deliveries]);

  const totals = useMemo(() => {
    const totalsPerDay = {};
    const totalsPerDriver = {};
    let grandTotal = 0;

    activeDrivers.forEach(d => {
      const key = d.tura ?? d.id ?? d.ime;
      totalsPerDriver[key] = 0;
    });

    workdays.forEach(date => {
      const dateString = format(date, 'yyyy-MM-dd');
      const dayData = groupedData[dateString] || {};
      let dayTotal = 0;
      activeDrivers.forEach(driver => {
        const key = driver.tura ?? driver.id ?? driver.ime;
        const value = dayData[key] || 0;
        totalsPerDriver[key] = (totalsPerDriver[key] || 0) + value;
        dayTotal += value;
      });
      totalsPerDay[dateString] = dayTotal;
      grandTotal += dayTotal;
    });

    return { totalsPerDay, totalsPerDriver, grandTotal };
  }, [groupedData, workdays, activeDrivers]);

  return { groupedData, ...totals };
}
