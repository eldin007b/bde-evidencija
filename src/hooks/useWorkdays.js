import { useMemo } from 'react';
import { eachDayOfInterval, isWeekend, format } from 'date-fns';

export default function useWorkdays(year, month, holidays = []) {
  return useMemo(() => {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    const allDays = eachDayOfInterval({ start, end });
    return allDays.filter(
      d => !isWeekend(d) && !(holidays || []).includes(format(d, 'yyyy-MM-dd'))
    );
  }, [year, month, holidays]);
}
