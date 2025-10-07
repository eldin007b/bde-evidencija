import React from 'react';
import PropTypes from 'prop-types';
import './styles.css';

const StatisticsCard = ({ icon: Icon, value, label, loading }) => {
  return (
    <div className="stats-card">
      {Icon && <Icon size={24} className="stats-card-icon" />}
      <div className="stats-card-value">
        {loading ? (
          <span>...</span>
        ) : (
          value
        )}
      </div>
      <div className="stats-card-label">{label}</div>
    </div>
  );
};

const StatisticsCards = ({ cards, className = '' }) => {
  return (
    <div className={`stats-cards ${className}`}>
      {cards.map((card, index) => (
        <StatisticsCard
          key={index}
          icon={card.icon}
          value={card.value}
          label={card.label}
          loading={card.loading}
        />
      ))}
    </div>
  );
};

StatisticsCard.propTypes = {
  icon: PropTypes.elementType,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number
  ]).isRequired,
  label: PropTypes.string.isRequired,
  loading: PropTypes.bool
};

StatisticsCards.propTypes = {
  cards: PropTypes.arrayOf(
    PropTypes.shape({
      icon: PropTypes.elementType,
      value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number
      ]).isRequired,
      label: PropTypes.string.isRequired,
      loading: PropTypes.bool
    })
  ).isRequired,
  className: PropTypes.string
};

export default StatisticsCards;