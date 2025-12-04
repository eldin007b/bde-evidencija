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
    '--gradient-start': gradient[0],
    '--gradient-end': gradient[1]
  };

  return (
    <div 
      className={`${styles.card} ${isHovered ? styles.hovered : ''}`}
      style={cardStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Glow effect */}
      <div className={styles.glowEffect}></div>
      
      {/* Icon */}
      <div className={styles.iconContainer}>
        <span className={styles.icon}>{icon}</span>
      </div>

      {/* Main value */}
      <div className={styles.valueContainer}>
        <span className={styles.value}>{value}</span>
      </div>

      {/* Title */}
      <div className={styles.titleContainer}>
        <span className={styles.title}>{title}</span>
      </div>

      {/* Subtitle */}
      <div className={styles.subtitleContainer}>
        <span className={styles.subtitle}>{subtitle}</span>
      </div>

      {/* Shine effect */}
      <div className={styles.shineEffect}></div>
    </div>
  );
};

export default StatsCard;