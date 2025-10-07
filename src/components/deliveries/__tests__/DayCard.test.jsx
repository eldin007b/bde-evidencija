import React from 'react';
import { render, screen } from '@testing-library/react';
import DayCard from '../DayCard';
import { format } from 'date-fns';

describe('DayCard', () => {
  test('renders date and driver rows', () => {
    const date = new Date('2025-10-01');
    const drivers = [{ tura: 'A', ime: 'Ana', target_per_day: 3 }];
    const dayData = { 'A': 2 };
    render(<DayCard date={date} dayData={dayData} drivers={drivers} totalsPerDay={{ '2025-10-01': 2 }} holidays={[]} />);

    expect(screen.getByText(format(date, 'dd.MM.yyyy'))).toBeInTheDocument();
    expect(screen.getByText('🚚 Ana')).toBeInTheDocument();
    expect(screen.getByText('Ukupno: 2')).toBeInTheDocument();
  });
});
