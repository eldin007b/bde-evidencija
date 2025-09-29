
import { useMemo } from 'react';
import { isTablet } from '../utils/responsive';


export default function useDynamicColumnWidth(driverCount) {
  const screenWidth = window.innerWidth;
  return useMemo(() => {
    if (isTablet()) {
      return driverCount > 0 ? Math.max(90, Math.floor((screenWidth - 60) / (driverCount + 2))) : 90;
    } else {
      return driverCount > 0 ? Math.max(75, Math.floor((screenWidth - 40) / (driverCount + 2))) : 75;
    }
  }, [driverCount, screenWidth]);
}
