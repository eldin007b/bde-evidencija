/**
 * 🌴 Urlaub Service
 * Centralizovana logika za obračun godišnjih odmora
 */

export function calculateEarnedUrlaub(startDateStr, startDays) {
  const startDate = new Date(startDateStr);
  const now = new Date();
  
  console.log('🔍 [urlaubUtils] startDate:', startDateStr, 'startDays:', startDays);
  
  let earned = startDays;
  let tempDate = new Date(startDate);
  tempDate.setDate(1); 
  
  while (tempDate <= now) {
    if (tempDate >= startDate) {
      // 1. u mjesecu
      if (new Date(tempDate.getFullYear(), tempDate.getMonth(), 1) <= now) {
        console.log(`➕ Adding day for 1st of ${tempDate.getMonth()+1}/${tempDate.getFullYear()}`);
        earned += 1;
      }
      // 15. u mjesecu
      if (new Date(tempDate.getFullYear(), tempDate.getMonth(), 15) <= now) {
        console.log(`➕ Adding day for 15th of ${tempDate.getMonth()+1}/${tempDate.getFullYear()}`);
        earned += 1;
      }
    }
    tempDate.setMonth(tempDate.getMonth() + 1);
  }
  console.log('🏁 [urlaubUtils] Total earned:', earned);
  return earned;
}

export function calculateRemainingUrlaub(earned, usedCount) {
  return Math.max(0, earned - usedCount);
}
