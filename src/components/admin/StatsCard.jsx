// components/admin/StatsCard.jsx - Premium glassmorphism stats card
import React, { useState } from 'react';

export const StatsCard = ({ 
  title, 
  value, 
  subtitle, 
  gradient, 
  shadowColor, 
  icon,
  onClick 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const cardStyle = {
    '--shadow-color': shadowColor,
    background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
    boxShadow: isHovered ? `0 10px 30px ${shadowColor}` : '0 4px 6px rgba(0,0,0,0.1)',
    transition: 'all 0.3s ease',
    padding: '1.5rem',
    borderRadius: '1rem',
    cursor: onClick ? 'pointer' : 'default',
    color: 'white',
    position: 'relative',
    overflow: 'hidden'
  };

  return (
    <div 
      style={cardStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <span className="text-4xl">{icon}</span>
        </div>
        <div className="text-3xl font-bold mb-1">{value}</div>
        <div className="text-sm font-semibold opacity-90 mb-1">{title}</div>
        <div className="text-xs opacity-75">{subtitle}</div>
      </div>
    </div>
  );
};

export default StatsCard;