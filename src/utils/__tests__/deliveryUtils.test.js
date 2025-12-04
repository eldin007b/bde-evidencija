import { groupDeliveries } from '../deliveryUtils';

describe('groupDeliveries', () => {
  test('groups deliveries by date and driver key', () => {
    const deliveries = [
      { date: '2025-10-01', driver: 'A', produktivitaet_stops: 5 },
      { date: '2025-10-01', driver: 'B', produktivitaet_stops: 3 },
      { date: '2025-10-02', driver: 'A', produktivitaet_stops: 2 },
      { date: '2025-10-01', tura: 'A', produktivitaet_stops: 1 }, // should add to A on 2025-10-01
    ];

    const grouped = groupDeliveries(deliveries);
    expect(grouped['2025-10-01']).toBeDefined();
    expect(grouped['2025-10-02']).toBeDefined();
    expect(grouped['2025-10-01']['A']).toBe(6); // 5 + 1
    expect(grouped['2025-10-01']['B']).toBe(3);
    expect(grouped['2025-10-02']['A']).toBe(2);
  });
});
