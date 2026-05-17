import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

const MONTHS = [
  'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Juni',
  'Juli', 'August', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'
];

const MonthYearPicker = ({
  month,
  year,
  onMonthChange,
  onYearChange,
  monthlyPerformance = {},
  isLoadingPerformance = false,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(month ?? new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(year ?? new Date().getFullYear());

  const months = MONTHS;
  const years = [2023, 2024, 2025, 2026, 2027];

  const handleConfirm = () => {
    onMonthChange && onMonthChange(selectedMonth);
    onYearChange && onYearChange(selectedYear);
    setIsOpen(false);
  };

  const openPicker = () => setIsOpen(true);
  const closePicker = () => setIsOpen(false);

  return (
    <div className={`relative w-full max-w-xs ${className}`}>
      <div
        className="cursor-pointer px-4 py-2 bg-white rounded-lg shadow border border-gray-300 flex items-center justify-between"
        onClick={openPicker}
      >
        <span className="font-semibold">{months[selectedMonth]} {selectedYear}</span>
        <svg className="w-4 h-4 ml-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
      </div>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50" onClick={closePicker}>
          <div className="bg-white rounded-xl shadow-lg w-full max-w-xs p-4 relative" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-semibold">Odaberi mjesec i godinu</span>
              <button className="text-2xl font-bold text-gray-400 hover:text-gray-600 transition" onClick={closePicker}>&times;</button>
            </div>
            <div className="mb-4">
              <div className="flex gap-2">
                <select
                  className="border rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(Number(e.target.value))}
                >
                  {months.map((month, idx) => (
                    <option key={month} value={idx}>{month}</option>
                  ))}
                </select>
                <select
                  className="border rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={selectedYear}
                  onChange={e => setSelectedYear(Number(e.target.value))}
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition" onClick={handleConfirm}>Potvrdi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthYearPicker;