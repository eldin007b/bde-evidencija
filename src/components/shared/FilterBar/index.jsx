import React from 'react';
import PropTypes from 'prop-types';
import './styles.css';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];
const MONTHS = [
  'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Juni', 'Juli', 'August',
  'Septembar', 'Oktobar', 'Novembar', 'Decembar'
];

const FilterBar = ({
  selectedYear,
  selectedMonth,
  selectedDriver,
  drivers = [],
  showDriverFilter = false,
  onYearChange,
  onMonthChange,
  onDriverChange,
  className = ''
}) => {
  return (
    <div className={`filter-bar ${className}`}>
      <select 
        className="filter-select"
        value={selectedYear}
        onChange={(e) => onYearChange(Number(e.target.value))}
      >
        {YEARS.map(year => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>

      <select
        className="filter-select"
        value={selectedMonth}
        onChange={(e) => onMonthChange(Number(e.target.value))}
      >
        {MONTHS.map((month, index) => (
          <option key={month} value={index}>
            {month}
          </option>
        ))}
      </select>

      {showDriverFilter && drivers.length > 0 && (
        <select
          className="filter-select filter-driver-select"
          value={selectedDriver}
          onChange={(e) => onDriverChange(e.target.value)}
        >
          <option value="">Svi vozači</option>
          {drivers.map(driver => (
            <option key={driver.id} value={driver.ime}>
              {driver.ime}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};

FilterBar.propTypes = {
  selectedYear: PropTypes.number.isRequired,
  selectedMonth: PropTypes.number.isRequired,
  selectedDriver: PropTypes.string,
  drivers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      ime: PropTypes.string.isRequired
    })
  ),
  showDriverFilter: PropTypes.bool,
  onYearChange: PropTypes.func.isRequired,
  onMonthChange: PropTypes.func.isRequired,
  onDriverChange: PropTypes.func,
  className: PropTypes.string
};

export default FilterBar;