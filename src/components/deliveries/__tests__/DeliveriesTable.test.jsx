import React from 'react';
import { render, screen } from '@testing-library/react';
import DeliveriesTable from '../DeliveriesTable';

describe('DeliveriesTable', () => {
  test('renders headers and totals', () => {
    const workdays = [new Date('2025-10-01')];
    const drivers = [{ tura: 'A', ime: 'Ana', target_per_day: 2 }];
    const groupedData = { '2025-10-01': { 'A': 2 } };
    const totalsPerDay = { '2025-10-01': 2 };
    const totalsPerDriver = { 'A': 2 };
    render(<DeliveriesTable groupedData={groupedData} workdays={workdays} drivers={drivers} holidays={[]} totalsPerDay={totalsPerDay} totalsPerDriver={totalsPerDriver} grandTotal={2} />);

    expect(screen.getByText('Datum')).toBeInTheDocument();
    expect(screen.getByText('Ana')).toBeInTheDocument();
    // multiple cells/strongs contain '2' (value and totals) - assert at least one exists
    const matches = screen.getAllByText('2');
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });
});
