/**
 * 🌴 Urlaub Service
 * Centralizovana logika za obračun godišnjih odmora
 */

export function calculateEarnedUrlaub(startDateStr, startDays) {
  const startDate = new Date(startDateStr);
  const now = new Date();
  
  let earned = startDays;
  let tempDate = new Date(startDate);
  tempDate.setDate(1); 
  
  while (tempDate <= now) {
    if (tempDate >= startDate) {
      // 1. u mjesecu
      if (new Date(tempDate.getFullYear(), tempDate.getMonth(), 1) <= now) {
        earned += 1;
      }
      // 15. u mjesecu
      if (new Date(tempDate.getFullYear(), tempDate.getMonth(), 15) <= now) {
        earned += 1;
      }
    }
    tempDate.setMonth(tempDate.getMonth() + 1);
  }
  return earned;
}

export function calculateRemainingUrlaub(earned, usedCount) {
  return Math.max(0, earned - usedCount);
}
