export function downloadCsv(filename, csvContent) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function buildDeliveriesCsv({ workdays = [], groupedData = {}, drivers = [] }) {
  // Header: Datum, driver1, driver2, ..., Ukupno
  const header = ['Datum', ...drivers.map(d => d.ime || d.tura || d.id), 'Ukupno'];
  const rows = [header];

  workdays.forEach(date => {
    const dateString = date instanceof Date ? date.toISOString().slice(0, 10) : date;
    const dayData = groupedData[dateString] || {};
    const row = [dateString];
    let total = 0;
    drivers.forEach(d => {
      const key = d.tura ?? d.id ?? d.ime;
      const value = dayData[key] || 0;
      row.push(value);
      total += value;
    });
    row.push(total);
    rows.push(row);
  });

  // Convert to CSV string
  return rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
}

export default { downloadCsv, buildDeliveriesCsv };
